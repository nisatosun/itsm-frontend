import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard,
  Ticket,
  Inbox,
  BookOpen,
  Bell,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Send,
  Paperclip,
  Download,
  Clock,
  AlertTriangle,
  CheckCircle2,
  User,
  RefreshCw,
  FileText,
  Plus,
  X,
  Lock,
  Globe,
  Timer,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TicketDetail {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  createdAt: string;
  customerName: string;
  assignedAgent: string | null;
  slaDeadlineMinutes: number;   // total SLA minutes
  slaMinutesLeft: number | null;
  slaBreached: boolean;
}

interface Comment {
  id: string;
  authorName: string;
  authorRole: string;
  body: string;
  createdAt: string;
  type: 'EXTERNAL' | 'INTERNAL';
}

interface Worklog {
  id: string;
  authorName: string;
  hours: number;
  minutes: number;
  note: string;
  loggedAt: string;
}

interface Attachment {
  id: string;
  filename: string;
  sizeBytes: number;
}

interface TimelineEvent {
  id: string;
  event: string;
  detail: string;
  timestamp: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_TICKET: TicketDetail = {
  id: 'TKT-1041',
  subject: 'SAP oturumu açılmıyor',
  category: 'Yazılım',
  priority: 'CRITICAL',
  status: 'İşlemde',
  description:
    'SAP GUI açılış ekranında "RFC_ERROR_SYSTEM_FAILURE" hatası alıyorum. Dün akşama kadar çalışıyordu. Bugün sabah 08:30\'da bu hatayla karşılaştım.\n\nHata kodu: RFC_ERROR_SYSTEM_FAILURE\nSAP GUI sürümü: 7.70 patch 5\nBağlandığım sistem: PRD (Production)\n\nBaşka kullanıcılarla konuştuğumda onların da aynı sorunu yaşadığını öğrendim. Üretim sistemine erişemediğimiz için iş durmak üzere.',
  createdAt: '12 May 2026, 08:45',
  customerName: 'Ahmet Kaya',
  assignedAgent: 'Mert Yılmaz',
  slaDeadlineMinutes: 240,
  slaMinutesLeft: 35,
  slaBreached: false,
};

const MOCK_COMMENTS: Comment[] = [
  { id: 'c1', authorName: 'Mert Yılmaz', authorRole: 'AGENT', body: 'Merhaba Ahmet Bey, sorununuzu aldık. SAP BASIS ekibiyle iletişime geçiyorum. Üretim ortamında genel bir sorun olup olmadığını kontrol edeceğim.', createdAt: '12 May 2026, 09:02', type: 'EXTERNAL' },
  { id: 'c2', authorName: 'Mert Yılmaz', authorRole: 'AGENT', body: 'BASIS kontrol etti: RFC gateway servisi çökmüş. Restart deniyoruz. ETA 30 dakika.', createdAt: '12 May 2026, 09:15', type: 'INTERNAL' },
  { id: 'c3', authorName: 'Ahmet Kaya', authorRole: 'CUSTOMER', body: 'Teşekkürler, bekliyorum. Bu sorun üretimimizi doğrudan etkiliyor, acil.', createdAt: '12 May 2026, 09:20', type: 'EXTERNAL' },
  { id: 'c4', authorName: 'Mert Yılmaz', authorRole: 'AGENT', body: 'SM50/SM66 kontrol edildi. Birden fazla work process PRIV durumunda takılı. Dump analizi başlatıldı — ABAP hatası olabilir.', createdAt: '12 May 2026, 09:35', type: 'INTERNAL' },
];

const MOCK_WORKLOGS: Worklog[] = [
  { id: 'w1', authorName: 'Mert Yılmaz', hours: 0, minutes: 20, note: 'BASIS ekibiyle koordinasyon, RFC gateway durumu incelendi.', loggedAt: '12 May 2026, 09:15' },
  { id: 'w2', authorName: 'Mert Yılmaz', hours: 0, minutes: 35, note: 'SM50/SM66 analizi, dump kayıtları incelendi.', loggedAt: '12 May 2026, 09:50' },
];

const MOCK_ATTACHMENTS: Attachment[] = [
  { id: 'a1', filename: 'sap_dump_20260512.txt', sizeBytes: 82400 },
  { id: 'a2', filename: 'screenshot_rfc_error.png', sizeBytes: 195000 },
];

const MOCK_TIMELINE: TimelineEvent[] = [
  { id: 't1', event: 'Ticket Oluşturuldu',  detail: 'Ahmet Kaya tarafından',       timestamp: '12 May 2026, 08:45' },
  { id: 't2', event: 'Atandı',              detail: 'Agent: Mert Yılmaz',           timestamp: '12 May 2026, 09:00' },
  { id: 't3', event: 'Durum Değişti',       detail: 'Açık → İşlemde',              timestamp: '12 May 2026, 09:05' },
  { id: 't4', event: 'Worklog Eklendi',     detail: '20 dakika — BASIS koordinasyon', timestamp: '12 May 2026, 09:15' },
  { id: 't5', event: 'Worklog Eklendi',     detail: '35 dakika — SM50/SM66 analizi',  timestamp: '12 May 2026, 09:50' },
];

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUSES = ['Açık', 'Triage', 'Atandı', 'İşlemde', 'Bekleyen', 'Çözüldü'];

const PRIORITY_STYLE: Record<string, { label: string; cls: string }> = {
  LOW:      { label: 'Düşük',  cls: 'bg-green-50 text-green-700' },
  MEDIUM:   { label: 'Orta',   cls: 'bg-amber-50 text-amber-700' },
  HIGH:     { label: 'Yüksek', cls: 'bg-orange-50 text-orange-700' },
  CRITICAL: { label: 'Kritik', cls: 'bg-red-50 text-red-700' },
};

const STATUS_STYLE: Record<string, { cls: string }> = {
  Açık:     { cls: 'bg-red-50 text-red-700' },
  Triage:   { cls: 'bg-pink-50 text-pink-700' },
  Atandı:   { cls: 'bg-blue-50 text-blue-700' },
  İşlemde:  { cls: 'bg-indigo-50 text-indigo-700' },
  Bekleyen: { cls: 'bg-amber-50 text-amber-700' },
  Çözüldü:  { cls: 'bg-green-50 text-green-700' },
};

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',         href: '/agent/dashboard' },
  { icon: Ticket,          label: 'Atanmış Ticketlar', href: '/agent/tickets' },
  { icon: Inbox,           label: 'Ticket Havuzu',     href: '/agent/queue' },
  { icon: BookOpen,        label: 'Bilgi Bankası',      href: '/agent/knowledge-base' },
  { icon: Bell,            label: 'Bildirimler',        href: '/agent/notifications' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function authorInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({ displayName, email, logout }: { displayName: string; email?: string; logout: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <aside className="w-56 shrink-0 flex flex-col" style={{ background: '#EB0A1E' }}>
      <div className="px-4 py-4 border-b border-white/10 flex items-center gap-2.5">
        <div className="w-7 h-7 bg-white rounded flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
            <ellipse cx="12" cy="12" rx="10" ry="4.5" stroke="#EB0A1E" strokeWidth="1.8" />
            <ellipse cx="12" cy="12" rx="4.5" ry="10" stroke="#EB0A1E" strokeWidth="1.8" />
            <circle cx="12" cy="12" r="2.5" fill="#EB0A1E" />
          </svg>
        </div>
        <div>
          <p className="text-white font-bold text-xs leading-none">Toyota</p>
          <p className="text-red-200 text-[10px] mt-0.5">IT Service Mgmt</p>
        </div>
      </div>
      <nav className="flex-1 px-2.5 py-3 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
          const active = href === '/agent/tickets'
            ? location.pathname.startsWith('/agent/tickets')
            : location.pathname === href;
          return (
            <button key={label} onClick={() => navigate(href)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${active ? 'bg-white/20 text-white' : 'text-red-100 hover:bg-white/10 hover:text-white'}`}
            >
              <Icon size={15} /><span className="flex-1">{label}</span>
              {active && <ChevronRight size={12} />}
            </button>
          );
        })}
      </nav>
      <div className="px-2.5 py-3 border-t border-white/10">
        <div className="px-3 py-1.5 mb-0.5">
          <p className="text-white text-xs font-medium truncate">{displayName}</p>
          <p className="text-red-200 text-[10px] truncate">{email ?? 'Agent'}</p>
        </div>
        <button onClick={logout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-red-100 hover:bg-white/10 hover:text-white transition-all">
          <LogOut size={15} />Çıkış Yap
        </button>
      </div>
    </aside>
  );
}

// ── Worklog Modal ─────────────────────────────────────────────────────────────

function WorklogModal({
  onClose,
  onSave,
  saving,
}: {
  onClose: () => void;
  onSave: (hours: number, minutes: number, note: string) => Promise<void>;
  saving: boolean;
}) {
  const [hours,   setHours]   = useState(0);
  const [mins,    setMins]    = useState(30);
  const [note,    setNote]    = useState('');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    await onSave(hours, mins, note.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-md mx-4">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Timer size={15} className="text-gray-400" />
            Worklog Ekle
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSave} className="px-5 py-4 space-y-4">
          {/* Time inputs */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Harcanan Süre</label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-[10px] text-gray-400 mb-1">Saat</label>
                <input
                  type="number" min={0} max={24} value={hours}
                  onChange={(e) => setHours(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-[#EB0A1E] focus:ring-2 focus:ring-[#EB0A1E]/10 focus:bg-white transition"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] text-gray-400 mb-1">Dakika</label>
                <input
                  type="number" min={0} max={59} value={mins}
                  onChange={(e) => setMins(Math.min(59, Math.max(0, Number(e.target.value))))}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-[#EB0A1E] focus:ring-2 focus:ring-[#EB0A1E]/10 focus:bg-white transition"
                />
              </div>
              <div className="mt-5 text-xs font-semibold text-gray-500 shrink-0">
                = {hours > 0 ? `${hours}s ` : ''}{mins}d
              </div>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Açıklama <span style={{ color: '#EB0A1E' }}>*</span>
            </label>
            <textarea
              value={note} onChange={(e) => setNote(e.target.value)} rows={3}
              placeholder="Bu sürede ne yaptınız?"
              className="w-full px-3 py-2.5 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 outline-none focus:border-[#EB0A1E] focus:ring-2 focus:ring-[#EB0A1E]/10 focus:bg-white resize-none transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >İptal</button>
            <button type="submit" disabled={saving || !note.trim() || (hours === 0 && mins === 0)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#EB0A1E' }}
              onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLButtonElement).style.background = '#a50015'; }}
              onMouseLeave={e => { if (!saving) (e.currentTarget as HTMLButtonElement).style.background = '#EB0A1E'; }}
            >
              {saving ? <RefreshCw size={12} className="animate-spin" /> : <Timer size={12} />}
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AgentTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ''}`.trim()
    : (user?.username ?? 'Agent');

  // Data
  const [ticket,      setTicket]      = useState<TicketDetail | null>(null);
  const [comments,    setComments]    = useState<Comment[]>([]);
  const [worklogs,    setWorklogs]    = useState<Worklog[]>(MOCK_WORKLOGS);
  const [attachments]                 = useState<Attachment[]>(MOCK_ATTACHMENTS);
  const [timeline,    setTimeline]    = useState<TimelineEvent[]>(MOCK_TIMELINE);
  const [loadingPage, setLoadingPage] = useState(true);

  // Comment form
  const [commentTab,    setCommentTab]    = useState<'EXTERNAL' | 'INTERNAL'>('EXTERNAL');
  const [commentBody,   setCommentBody]   = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError,  setCommentError]  = useState<string | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Comment view tab
  const [viewTab, setViewTab] = useState<'EXTERNAL' | 'INTERNAL'>('EXTERNAL');

  // Status change
  const [currentStatus,  setCurrentStatus]  = useState('');
  const [statusDraft,    setStatusDraft]     = useState('');
  const [resolutionNote, setResolutionNote]  = useState('');
  const [savingStatus,   setSavingStatus]    = useState(false);
  const [statusSuccess,  setStatusSuccess]   = useState(false);

  // Worklog modal
  const [showWorklog,   setShowWorklog]   = useState(false);
  const [savingWorklog, setSavingWorklog] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoadingPage(true);

    Promise.all([
      axios.get<TicketDetail>(`http://localhost:8083/api/tickets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => ({ data: MOCK_TICKET })),

      axios.get<Comment[]>(`http://localhost:8083/api/tickets/${id}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => ({ data: MOCK_COMMENTS })),
    ]).then(([tRes, cRes]) => {
      if (cancelled) return;
      setTicket(tRes.data);
      setCurrentStatus(tRes.data.status);
      setStatusDraft(tRes.data.status);
      setComments(cRes.data);
    }).finally(() => { if (!cancelled) setLoadingPage(false); });

    return () => { cancelled = true; };
  }, [id, token]);

  // Status save
  async function saveStatus() {
    if (!id || statusDraft === currentStatus) return;
    if (statusDraft === 'Çözüldü' && !resolutionNote.trim()) return;
    setSavingStatus(true);
    try {
      await axios.put(`http://localhost:8083/api/tickets/${id}/status`,
        { status: statusDraft, resolutionNote: resolutionNote.trim() || undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch { /* optimistic */ }

    setCurrentStatus(statusDraft);
    setTicket((prev) => prev ? { ...prev, status: statusDraft } : prev);
    const newEvent: TimelineEvent = {
      id: `t-${Date.now()}`,
      event: 'Durum Değişti',
      detail: `${currentStatus} → ${statusDraft}`,
      timestamp: new Date().toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    };
    setTimeline((prev) => [newEvent, ...prev]);
    setStatusSuccess(true);
    setTimeout(() => setStatusSuccess(false), 2000);
    setSavingStatus(false);
  }

  // Submit comment
  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentBody.trim() || !id) return;
    setCommentError(null);
    setSubmittingComment(true);
    try {
      const res = await axios.post<Comment>(
        `http://localhost:8083/api/tickets/${id}/comments`,
        { body: commentBody.trim(), type: commentTab },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments((prev) => [...prev, res.data]);
    } catch {
      const optimistic: Comment = {
        id: `local-${Date.now()}`,
        authorName: displayName,
        authorRole: 'AGENT',
        body: commentBody.trim(),
        createdAt: new Date().toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        type: commentTab,
      };
      setComments((prev) => [...prev, optimistic]);
      setCommentError('Yorum kaydedilemedi — yerel olarak gösteriliyor.');
    } finally {
      setCommentBody('');
      setSubmittingComment(false);
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }

  // Save worklog
  async function saveWorklog(hours: number, minutes: number, note: string) {
    if (!id) return;
    setSavingWorklog(true);
    try {
      const res = await axios.post<Worklog>(
        `http://localhost:8083/api/tickets/${id}/worklogs`,
        { hours, minutes, note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWorklogs((prev) => [res.data, ...prev]);
    } catch {
      const optimistic: Worklog = {
        id: `wl-${Date.now()}`,
        authorName: displayName,
        hours, minutes, note,
        loggedAt: new Date().toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      };
      setWorklogs((prev) => [optimistic, ...prev]);
    } finally {
      setSavingWorklog(false);
      setShowWorklog(false);
      const newEvent: TimelineEvent = {
        id: `t-wl-${Date.now()}`,
        event: 'Worklog Eklendi',
        detail: `${hours > 0 ? `${hours}s ` : ''}${minutes}d — ${note}`,
        timestamp: new Date().toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      };
      setTimeline((prev) => [newEvent, ...prev]);
    }
  }

  // Loading / not found
  if (loadingPage) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar displayName={displayName} email={user?.email} logout={logout} />
        <div className="flex-1 flex items-center justify-center gap-2 text-gray-400 text-xs">
          <RefreshCw size={15} className="animate-spin" />Yükleniyor...
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar displayName={displayName} email={user?.email} logout={logout} />
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-400">
          <Ticket size={32} className="text-gray-200" />
          <p className="text-sm font-medium">Ticket bulunamadı</p>
          <button onClick={() => navigate('/agent/tickets')} className="mt-1 text-xs font-semibold" style={{ color: '#EB0A1E' }}>← Listeye dön</button>
        </div>
      </div>
    );
  }

  const p = PRIORITY_STYLE[ticket.priority] ?? { label: ticket.priority, cls: 'bg-gray-100 text-gray-600' };
  const s = STATUS_STYLE[currentStatus]     ?? { cls: 'bg-gray-100 text-gray-600' };

  const visibleComments = comments.filter((c) => c.type === viewTab);
  const slaPercent = ticket.slaMinutesLeft !== null
    ? Math.max(0, Math.min(100, (ticket.slaMinutesLeft / ticket.slaDeadlineMinutes) * 100))
    : 100;
  const slaColor = ticket.slaBreached || (ticket.slaMinutesLeft ?? 999) < 0
    ? '#DC2626'
    : (ticket.slaMinutesLeft ?? 999) < 60
      ? '#EA580C'
      : (ticket.slaMinutesLeft ?? 999) < 120
        ? '#D97706'
        : '#16A34A';

  const totalWorklogMins = worklogs.reduce((acc, w) => acc + w.hours * 60 + w.minutes, 0);

  return (
    <>
      {showWorklog && (
        <WorklogModal
          onClose={() => setShowWorklog(false)}
          onSave={saveWorklog}
          saving={savingWorklog}
        />
      )}

      <div className="flex min-h-screen bg-gray-50">
        <Sidebar displayName={displayName} email={user?.email} logout={logout} />

        <div className="flex-1 flex flex-col min-w-0">

          {/* Topbar */}
          <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => navigate('/agent/tickets')}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition shrink-0"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="min-w-0">
                <h1 className="text-base font-bold text-gray-900 truncate">{ticket.subject}</h1>
                <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{ticket.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowWorklog(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-all"
                style={{ background: '#EB0A1E' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#a50015')}
                onMouseLeave={e => (e.currentTarget.style.background = '#EB0A1E')}
              >
                <Timer size={13} />Worklog
              </button>
              <button className="relative p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 transition">
                <Bell size={17} />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full border-2 border-white" style={{ background: '#EB0A1E' }} />
              </button>
              <div className="flex items-center gap-2 pl-3 border-l border-gray-100">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: '#EB0A1E' }}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold text-gray-800 leading-none">{displayName}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Agent</p>
                </div>
              </div>
            </div>
          </header>

          {/* Two-column content */}
          <main className="flex-1 p-6">
            <div className="flex gap-5 items-start">

              {/* ── LEFT (2/3) ────────────────────────────────────────── */}
              <div className="flex-1 min-w-0 space-y-4">

                {/* Header card */}
                <div className="bg-white rounded-xl border border-gray-100 px-5 py-4">
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-sm font-bold text-gray-900 leading-snug">{ticket.subject}</h2>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="font-mono text-[10px] text-gray-400">{ticket.id}</span>
                        <span className="text-[10px] text-gray-300">·</span>
                        <span className="text-[10px] text-gray-400">{ticket.category}</span>
                        <span className="text-[10px] text-gray-300">·</span>
                        <span className="flex items-center gap-1 text-[10px] text-gray-400">
                          <User size={10} />{ticket.customerName}
                        </span>
                        <span className="text-[10px] text-gray-300">·</span>
                        <span className="text-[10px] text-gray-400">{ticket.createdAt}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.cls}`}>{currentStatus}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${p.cls}`}>{p.label}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="bg-white rounded-xl border border-gray-100 px-5 py-4">
                  <h3 className="text-xs font-bold text-gray-700 mb-3">Açıklama</h3>
                  <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                </div>

                {/* Tabbed comments */}
                <div className="bg-white rounded-xl border border-gray-100">

                  {/* View tabs */}
                  <div className="px-5 pt-3 border-b border-gray-50 flex items-center gap-0">
                    {(['EXTERNAL', 'INTERNAL'] as const).map((tab) => {
                      const count = comments.filter((c) => c.type === tab).length;
                      const isActive = viewTab === tab;
                      return (
                        <button
                          key={tab}
                          onClick={() => setViewTab(tab)}
                          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all -mb-px ${
                            isActive
                              ? 'border-[#EB0A1E] text-[#EB0A1E]'
                              : 'border-transparent text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          {tab === 'EXTERNAL'
                            ? <Globe size={12} />
                            : <Lock size={12} />
                          }
                          {tab === 'EXTERNAL' ? 'Harici' : 'Dahili'}
                          {count > 0 && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                    {viewTab === 'INTERNAL' && (
                      <span className="ml-auto mr-2 flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                        <Lock size={10} />Sadece agentlar görür
                      </span>
                    )}
                  </div>

                  {/* Comment list */}
                  <div className="px-5 py-4 space-y-4 min-h-[120px]">
                    {visibleComments.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-6">
                        {viewTab === 'INTERNAL' ? 'Dahili not yok.' : 'Henüz yorum yok.'}
                      </p>
                    ) : (
                      visibleComments.map((c) => {
                        const isAgent    = c.authorRole === 'AGENT';
                        const isInternal = c.type === 'INTERNAL';
                        return (
                          <div key={c.id} className={`flex gap-3 ${isAgent && !isInternal ? '' : isInternal ? '' : 'flex-row-reverse'}`}>
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 text-white"
                              style={{ background: isInternal ? '#D97706' : isAgent ? '#6366F1' : '#EB0A1E' }}
                            >
                              {authorInitials(c.authorName)}
                            </div>
                            <div className={`max-w-[80%] flex flex-col gap-1 ${!isAgent && !isInternal ? 'items-end' : ''}`}>
                              <div className={`flex items-center gap-2 ${!isAgent && !isInternal ? 'flex-row-reverse' : ''}`}>
                                <span className="text-[10px] font-semibold text-gray-700">{c.authorName}</span>
                                <span className="text-[10px] text-gray-400">{c.createdAt}</span>
                              </div>
                              <div
                                className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${
                                  isInternal
                                    ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-tl-none'
                                    : isAgent
                                      ? 'bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-none'
                                      : 'text-white rounded-tr-none'
                                }`}
                                style={!isAgent && !isInternal ? { background: '#EB0A1E' } : {}}
                              >
                                {c.body}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={commentsEndRef} />
                  </div>

                  {/* Comment form */}
                  <div className="px-5 pb-4 border-t border-gray-50 pt-3 space-y-2">
                    {/* Write tab selector */}
                    <div className="flex items-center gap-1">
                      {(['EXTERNAL', 'INTERNAL'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setCommentTab(tab)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                            commentTab === tab
                              ? tab === 'INTERNAL'
                                ? 'bg-amber-50 border-amber-300 text-amber-700'
                                : 'text-white border-transparent'
                              : 'text-gray-500 bg-gray-50 border-gray-200 hover:border-gray-300'
                          }`}
                          style={commentTab === tab && tab === 'EXTERNAL' ? { background: '#EB0A1E', borderColor: '#EB0A1E' } : {}}
                        >
                          {tab === 'EXTERNAL' ? <Globe size={10} /> : <Lock size={10} />}
                          {tab === 'EXTERNAL' ? 'Harici Not' : 'Dahili Not'}
                        </button>
                      ))}
                    </div>

                    {commentError && (
                      <p className="text-[10px] text-amber-600 flex items-center gap-1">
                        <AlertTriangle size={11} />{commentError}
                      </p>
                    )}

                    <form onSubmit={submitComment} className="flex gap-2.5 items-end">
                      <textarea
                        value={commentBody} onChange={(e) => setCommentBody(e.target.value)}
                        placeholder={commentTab === 'INTERNAL' ? 'Dahili not — müşteri görmez...' : 'Müşteriye yanıt yazın...'}
                        rows={2}
                        className={`flex-1 px-3 py-2 text-xs border rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 outline-none transition resize-none ${
                          commentTab === 'INTERNAL'
                            ? 'border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200/50'
                            : 'border-gray-200 focus:border-[#EB0A1E] focus:ring-2 focus:ring-[#EB0A1E]/10 focus:bg-white'
                        }`}
                      />
                      <button type="submit" disabled={submittingComment || !commentBody.trim()}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        style={{ background: commentTab === 'INTERNAL' ? '#D97706' : '#EB0A1E' }}
                        onMouseEnter={e => { if (!submittingComment) (e.currentTarget as HTMLButtonElement).style.background = commentTab === 'INTERNAL' ? '#b45309' : '#a50015'; }}
                        onMouseLeave={e => { if (!submittingComment) (e.currentTarget as HTMLButtonElement).style.background = commentTab === 'INTERNAL' ? '#D97706' : '#EB0A1E'; }}
                      >
                        {submittingComment ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                        Gönder
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* ── RIGHT (1/3) ───────────────────────────────────────── */}
              <div className="w-72 shrink-0 space-y-4">

                {/* Status change card */}
                <div className="bg-white rounded-xl border border-gray-100 px-4 py-4">
                  <h3 className="text-xs font-bold text-gray-700 mb-3">Durum Güncelle</h3>

                  <div className="relative">
                    <select
                      value={statusDraft}
                      onChange={(e) => { setStatusDraft(e.target.value); setStatusSuccess(false); }}
                      className="w-full appearance-none px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-800 outline-none focus:border-[#EB0A1E] focus:ring-2 focus:ring-[#EB0A1E]/10 cursor-pointer transition"
                    >
                      {STATUSES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Resolution note — required when Çözüldü */}
                  {statusDraft === 'Çözüldü' && (
                    <div className="mt-3">
                      <label className="block text-[10px] font-semibold text-gray-600 mb-1">
                        Çözüm Notu <span style={{ color: '#EB0A1E' }}>*</span>
                      </label>
                      <textarea
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                        placeholder="Sorunu nasıl çözdüğünüzü yazın..."
                        rows={3}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-200/50 resize-none transition"
                      />
                    </div>
                  )}

                  <button
                    onClick={saveStatus}
                    disabled={savingStatus || statusDraft === currentStatus || (statusDraft === 'Çözüldü' && !resolutionNote.trim())}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: '#EB0A1E' }}
                    onMouseEnter={e => { if (!savingStatus) (e.currentTarget as HTMLButtonElement).style.background = '#a50015'; }}
                    onMouseLeave={e => { if (!savingStatus) (e.currentTarget as HTMLButtonElement).style.background = '#EB0A1E'; }}
                  >
                    {savingStatus
                      ? <RefreshCw size={12} className="animate-spin" />
                      : statusSuccess
                        ? <CheckCircle2 size={12} />
                        : null
                    }
                    {statusSuccess ? 'Kaydedildi!' : 'Durumu Güncelle'}
                  </button>
                </div>

                {/* Details + SLA */}
                <div className="bg-white rounded-xl border border-gray-100 px-4 py-4">
                  <h3 className="text-xs font-bold text-gray-700 mb-3">Detaylar</h3>
                  <dl className="space-y-2.5">
                    {[
                      { label: 'Müşteri',  value: <span className="text-xs text-gray-700">{ticket.customerName}</span> },
                      { label: 'Kategori', value: <span className="text-xs text-gray-700">{ticket.category}</span> },
                      { label: 'Öncelik',  value: <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${p.cls}`}>{p.label}</span> },
                      {
                        label: 'Agent',
                        value: ticket.assignedAgent
                          ? <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center"><User size={10} className="text-indigo-600" /></div><span className="text-xs text-gray-700">{ticket.assignedAgent}</span></div>
                          : <span className="text-xs text-gray-400">Atanmadı</span>,
                      },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between gap-2">
                        <dt className="text-[10px] font-medium text-gray-400 shrink-0">{label}</dt>
                        <dd className="text-right">{value}</dd>
                      </div>
                    ))}
                  </dl>

                  {/* SLA progress */}
                  <div className="mt-3 pt-3 border-t border-gray-50">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] font-medium text-gray-400">SLA</p>
                      <p className="text-[10px] font-semibold" style={{ color: slaColor }}>
                        {ticket.slaMinutesLeft === null
                          ? '—'
                          : ticket.slaMinutesLeft < 0
                            ? `${Math.abs(ticket.slaMinutesLeft)}d ihlal`
                            : ticket.slaMinutesLeft < 60
                              ? `${ticket.slaMinutesLeft}d kaldı`
                              : `${Math.floor(ticket.slaMinutesLeft / 60)}s ${ticket.slaMinutesLeft % 60}d`
                        }
                      </p>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${slaPercent}%`, background: slaColor }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {slaPercent.toFixed(0)}% süre kaldı
                    </p>
                  </div>
                </div>

                {/* Worklog */}
                <div className="bg-white rounded-xl border border-gray-100 px-4 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <Timer size={13} className="text-gray-400" />
                      Worklog
                    </h3>
                    <div className="flex items-center gap-2">
                      {totalWorklogMins > 0 && (
                        <span className="text-[10px] text-gray-400">
                          Toplam: {Math.floor(totalWorklogMins / 60) > 0 ? `${Math.floor(totalWorklogMins / 60)}s ` : ''}{totalWorklogMins % 60}d
                        </span>
                      )}
                      <button
                        onClick={() => setShowWorklog(true)}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-lg border border-gray-200 text-gray-600 hover:border-[#EB0A1E] hover:text-[#EB0A1E] transition-all"
                      >
                        <Plus size={10} />Ekle
                      </button>
                    </div>
                  </div>
                  {worklogs.length === 0 ? (
                    <p className="text-[10px] text-gray-400">Henüz worklog yok.</p>
                  ) : (
                    <ul className="space-y-2">
                      {worklogs.map((w) => (
                        <li key={w.id} className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[10px] font-semibold text-gray-700">
                              {w.hours > 0 ? `${w.hours}s ` : ''}{w.minutes}d
                            </span>
                            <span className="text-[10px] text-gray-400">{w.loggedAt}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 leading-relaxed">{w.note}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{w.authorName}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Attachments */}
                <div className="bg-white rounded-xl border border-gray-100 px-4 py-4">
                  <h3 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                    <Paperclip size={13} className="text-gray-400" />
                    Dosya Ekleri
                  </h3>
                  {attachments.length === 0 ? (
                    <p className="text-[10px] text-gray-400">Ek yok.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {attachments.map((a) => (
                        <li key={a.id} className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                          <FileText size={13} className="text-gray-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-medium text-gray-700 truncate">{a.filename}</p>
                            <p className="text-[10px] text-gray-400">{formatBytes(a.sizeBytes)}</p>
                          </div>
                          <button className="text-gray-400 hover:text-[#EB0A1E] transition shrink-0" title="İndir">
                            <Download size={13} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Timeline */}
                <div className="bg-white rounded-xl border border-gray-100 px-4 py-4">
                  <h3 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                    <Clock size={13} className="text-gray-400" />
                    Zaman Çizelgesi
                  </h3>
                  <ol className="relative border-l border-gray-100 ml-2 space-y-3">
                    {timeline.map((ev, idx) => (
                      <li key={ev.id} className="pl-4 relative">
                        <div
                          className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white"
                          style={{ background: idx === 0 ? '#EB0A1E' : '#D1D5DB' }}
                        />
                        <p className="text-[10px] font-semibold text-gray-700 leading-none">{ev.event}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{ev.detail}</p>
                        <p className="text-[10px] text-gray-300 mt-0.5">{ev.timestamp}</p>
                      </li>
                    ))}
                  </ol>
                </div>

              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
