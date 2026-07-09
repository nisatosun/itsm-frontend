import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
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
  assignedAgent: string | null;
  slaDeadline: string | null;
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

interface Attachment {
  id: string;
  filename: string;
  sizeBytes: number;
  uploadedAt: string;
}

interface TimelineEvent {
  id: string;
  event: string;
  detail: string;
  timestamp: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_TICKET: TicketDetail = {
  id: 'TKT-1042',
  subject: 'VPN bağlantısı sürekli kopuyor',
  category: 'Ağ',
  priority: 'HIGH',
  status: 'Bekleyen',
  description:
    'Sabahtan beri VPN bağlantısı her 10–15 dakikada bir kesiliyor. Yeniden bağlandığımda yaklaşık 2–3 dakika bekliyorum. Özellikle SAP üzerinde çalışırken oturumun düşmesi ciddi iş kaybına neden oluyor.\n\nDenediğim çözümler:\n• Bilgisayarı yeniden başlattım — sorun devam etti\n• Farklı ağ üzerinden (mobil hotspot) denedim — yine aynı sorun\n• VPN istemcisini kaldırıp tekrar kurdum — değişmedi\n\nFortiClient sürümü: 7.2.1\nİşletim sistemi: Windows 11 Pro 23H2',
  createdAt: '12 May 2026, 09:14',
  assignedAgent: 'Mert Yılmaz',
  slaDeadline: '13 May 2026, 09:14',
  slaBreached: false,
};

const MOCK_COMMENTS: Comment[] = [
  {
    id: 'c1',
    authorName: 'Destek Ekibi',
    authorRole: 'AGENT',
    body: 'Merhaba, talebinizi aldık. Ağ altyapısı ekibimizle iletişime geçtik. FortiClient log dosyalarını bizimle paylaşabilir misiniz? C:\\ProgramData\\Fortinet\\FortiClient\\logs klasöründen ulaşabilirsiniz.',
    createdAt: '12 May 2026, 10:32',
    type: 'EXTERNAL',
  },
  {
    id: 'c2',
    authorName: 'Elif Nisatosun',
    authorRole: 'CUSTOMER',
    body: 'Log dosyalarını ekte gönderdim. Ayrıca bugün de 3 kez koptu, son kopma 14:07\'de oldu.',
    createdAt: '12 May 2026, 14:21',
    type: 'EXTERNAL',
  },
  {
    id: 'c3',
    authorName: 'Mert Yılmaz',
    authorRole: 'AGENT',
    body: 'Logları inceledik. Firewall tarafında oturum zaman aşımı süresi 10 dakikaya ayarlı görünüyor. Ağ yöneticimiz ayarı 60 dakikaya çıkaracak. Yarın sabaha kadar değişiklik uygulanmış olacak, lütfen takip edin.',
    createdAt: '12 May 2026, 16:05',
    type: 'EXTERNAL',
  },
];

const MOCK_ATTACHMENTS: Attachment[] = [
  { id: 'a1', filename: 'forticlient_log_20260512.txt', sizeBytes: 48320,  uploadedAt: '12 May 2026' },
  { id: 'a2', filename: 'screenshot_error.png',          sizeBytes: 214000, uploadedAt: '12 May 2026' },
];

const MOCK_TIMELINE: TimelineEvent[] = [
  { id: 't1', event: 'Ticket Oluşturuldu',  detail: 'Elif Nisatosun tarafından',    timestamp: '12 May 2026, 09:14' },
  { id: 't2', event: 'Atandı',              detail: 'Agent: Mert Yılmaz',            timestamp: '12 May 2026, 09:28' },
  { id: 't3', event: 'Durum Değişti',       detail: 'Açık → Bekleyen',               timestamp: '12 May 2026, 10:32' },
  { id: 't4', event: 'Yorum Eklendi',       detail: 'Agent yanıt verdi',             timestamp: '12 May 2026, 10:32' },
  { id: 't5', event: 'Yorum Eklendi',       detail: 'Müşteri yanıt verdi',           timestamp: '12 May 2026, 14:21' },
  { id: 't6', event: 'Yorum Eklendi',       detail: 'Agent çözüm önerdi',            timestamp: '12 May 2026, 16:05' },
];

// ── Style maps ────────────────────────────────────────────────────────────────

const PRIORITY_STYLE: Record<string, { label: string; cls: string }> = {
  LOW:      { label: 'Düşük',  cls: 'bg-green-50 text-green-700' },
  MEDIUM:   { label: 'Orta',   cls: 'bg-amber-50 text-amber-700' },
  HIGH:     { label: 'Yüksek', cls: 'bg-orange-50 text-orange-700' },
  CRITICAL: { label: 'Kritik', cls: 'bg-red-50 text-red-700' },
};

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  Açık:     { label: 'Açık',     cls: 'bg-red-50 text-red-700' },
  Bekleyen: { label: 'Bekleyen', cls: 'bg-amber-50 text-amber-700' },
  Çözüldü:  { label: 'Çözüldü',  cls: 'bg-green-50 text-green-700' },
  Kapalı:   { label: 'Kapalı',   cls: 'bg-gray-100 text-gray-600' },
};

// ── Nav constants ─────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',    href: '/customer/dashboard' },
  { icon: Ticket,          label: 'Ticketlarım',  href: '/customer/tickets' },
  { icon: PlusCircle,      label: 'Yeni Ticket',  href: '/customer/tickets/new' },
  { icon: BookOpen,        label: 'Bilgi Bankası', href: '#' },
  { icon: Bell,            label: 'Bildirimler',   href: '#' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
          const active = href !== '#' && (
            href === '/customer/tickets'
              ? location.pathname.startsWith('/customer/tickets')
              : location.pathname === href
          );
          return (
            <button
              key={label}
              onClick={() => { if (href !== '#') navigate(href); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                active ? 'bg-white/20 text-white' : 'text-red-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={15} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={12} />}
            </button>
          );
        })}
      </nav>
      <div className="px-2.5 py-3 border-t border-white/10">
        <div className="px-3 py-1.5 mb-0.5">
          <p className="text-white text-xs font-medium truncate">{displayName}</p>
          <p className="text-red-200 text-[10px] truncate">{email ?? 'Müşteri'}</p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-red-100 hover:bg-white/10 hover:text-white transition-all"
        >
          <LogOut size={15} />
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ''}`.trim()
    : (user?.username ?? 'Kullanıcı');

  const [ticket,      setTicket]      = useState<TicketDetail | null>(null);
  const [comments,    setComments]    = useState<Comment[]>([]);
  const [attachments]                 = useState<Attachment[]>(MOCK_ATTACHMENTS);
  const [timeline]                    = useState<TimelineEvent[]>(MOCK_TIMELINE);
  const [loadingPage, setLoadingPage] = useState(true);

  const [commentBody,     setCommentBody]     = useState('');
  const [submitting,      setSubmitting]      = useState(false);
  const [commentError,    setCommentError]    = useState<string | null>(null);

  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Fetch ticket + comments
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
    ]).then(([ticketRes, commentsRes]) => {
      if (cancelled) return;
      setTicket(ticketRes.data);
      setComments(commentsRes.data.filter((c) => c.type === 'EXTERNAL'));
    }).finally(() => {
      if (!cancelled) setLoadingPage(false);
    });

    return () => { cancelled = true; };
  }, [id, token]);

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentBody.trim() || !id) return;
    setCommentError(null);
    setSubmitting(true);

    try {
      const res = await axios.post<Comment>(
        `http://localhost:8083/api/tickets/${id}/comments`,
        { body: commentBody.trim(), type: 'EXTERNAL' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments((prev) => [...prev, res.data]);
    } catch {
      // Optimistic fallback
      const optimistic: Comment = {
        id: `local-${Date.now()}`,
        authorName: displayName,
        authorRole: 'CUSTOMER',
        body: commentBody.trim(),
        createdAt: new Date().toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        type: 'EXTERNAL',
      };
      setComments((prev) => [...prev, optimistic]);
      setCommentError('Yorum kaydedilemedi — yerel olarak gösteriliyor.');
    } finally {
      setCommentBody('');
      setSubmitting(false);
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }

  if (loadingPage) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar displayName={displayName} email={user?.email} logout={logout} />
        <div className="flex-1 flex items-center justify-center gap-2 text-gray-400 text-xs">
          <RefreshCw size={15} className="animate-spin" />
          Yükleniyor...
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
          <button onClick={() => navigate('/customer/tickets')} className="mt-1 text-xs font-semibold" style={{ color: '#EB0A1E' }}>
            ← Listeye dön
          </button>
        </div>
      </div>
    );
  }

  const p = PRIORITY_STYLE[ticket.priority] ?? { label: ticket.priority, cls: 'bg-gray-100 text-gray-600' };
  const s = STATUS_STYLE[ticket.status]     ?? { label: ticket.status,   cls: 'bg-gray-100 text-gray-600' };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar displayName={displayName} email={user?.email} logout={logout} />

      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/customer/tickets')}
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
            <button className="relative p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 transition">
              <Bell size={17} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full border-2 border-white" style={{ background: '#EB0A1E' }} />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-gray-100">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: '#EB0A1E' }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-gray-800 leading-none">{displayName}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Müşteri</p>
              </div>
            </div>
          </div>
        </header>

        {/* Two-column content */}
        <main className="flex-1 p-6">
          <div className="flex gap-5 items-start">

            {/* ── LEFT COLUMN (2/3) ───────────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-4">

              {/* Ticket header card */}
              <div className="bg-white rounded-xl border border-gray-100 px-5 py-4">
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-bold text-gray-900 leading-snug">{ticket.subject}</h2>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="font-mono text-[10px] text-gray-400">{ticket.id}</span>
                      <span className="text-[10px] text-gray-300">·</span>
                      <span className="text-[10px] text-gray-400">{ticket.category}</span>
                      <span className="text-[10px] text-gray-300">·</span>
                      <span className="text-[10px] text-gray-400">{ticket.createdAt}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.cls}`}>
                      {s.label}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${p.cls}`}>
                      {p.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description card */}
              <div className="bg-white rounded-xl border border-gray-100 px-5 py-4">
                <h3 className="text-xs font-bold text-gray-700 mb-3">Açıklama</h3>
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
              </div>

              {/* Comments card */}
              <div className="bg-white rounded-xl border border-gray-100">
                <div className="px-5 py-3 border-b border-gray-50">
                  <h3 className="text-xs font-bold text-gray-700">
                    Yorumlar
                    {comments.length > 0 && (
                      <span className="ml-2 text-[10px] font-normal text-gray-400">{comments.length} yorum</span>
                    )}
                  </h3>
                </div>

                {/* Comment list */}
                <div className="px-5 py-4 space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">Henüz yorum yok.</p>
                  ) : (
                    comments.map((c) => {
                      const isAgent = c.authorRole === 'AGENT';
                      return (
                        <div key={c.id} className={`flex gap-3 ${isAgent ? '' : 'flex-row-reverse'}`}>
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 text-white"
                            style={{ background: isAgent ? '#6366F1' : '#EB0A1E' }}
                          >
                            {authorInitials(c.authorName)}
                          </div>
                          <div className={`max-w-[80%] ${isAgent ? '' : 'items-end'} flex flex-col gap-1`}>
                            <div className={`flex items-center gap-2 ${isAgent ? '' : 'flex-row-reverse'}`}>
                              <span className="text-[10px] font-semibold text-gray-700">{c.authorName}</span>
                              <span className="text-[10px] text-gray-400">{c.createdAt}</span>
                            </div>
                            <div
                              className={`px-3 py-2 rounded-xl text-xs text-gray-800 leading-relaxed ${
                                isAgent
                                  ? 'bg-gray-50 border border-gray-100 rounded-tl-none'
                                  : 'text-white rounded-tr-none'
                              }`}
                              style={!isAgent ? { background: '#EB0A1E' } : {}}
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
                <div className="px-5 pb-4 border-t border-gray-50 pt-3">
                  {commentError && (
                    <p className="mb-2 text-[10px] text-amber-600 flex items-center gap-1">
                      <AlertTriangle size={11} />
                      {commentError}
                    </p>
                  )}
                  <form onSubmit={submitComment} className="flex gap-2.5 items-end">
                    <textarea
                      value={commentBody}
                      onChange={(e) => setCommentBody(e.target.value)}
                      placeholder="Yanıtınızı yazın..."
                      rows={2}
                      className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB0A1E] focus:ring-2 focus:ring-[#EB0A1E]/10 focus:bg-white resize-none"
                    />
                    <button
                      type="submit"
                      disabled={submitting || !commentBody.trim()}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                      style={{ background: '#EB0A1E' }}
                      onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.background = '#a50015'; }}
                      onMouseLeave={e => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.background = '#EB0A1E'; }}
                    >
                      {submitting
                        ? <RefreshCw size={13} className="animate-spin" />
                        : <Send size={13} />
                      }
                      Gönder
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN (1/3) ──────────────────────────────────── */}
            <div className="w-72 shrink-0 space-y-4">

              {/* Details card */}
              <div className="bg-white rounded-xl border border-gray-100 px-4 py-4">
                <h3 className="text-xs font-bold text-gray-700 mb-3">Detaylar</h3>
                <dl className="space-y-2.5">
                  {[
                    { label: 'Durum',    value: <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.cls}`}>{s.label}</span> },
                    { label: 'Öncelik', value: <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${p.cls}`}>{p.label}</span> },
                    { label: 'Kategori', value: <span className="text-xs text-gray-700">{ticket.category}</span> },
                    {
                      label: 'Atanan Agent',
                      value: ticket.assignedAgent
                        ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                              <User size={10} className="text-indigo-600" />
                            </div>
                            <span className="text-xs text-gray-700">{ticket.assignedAgent}</span>
                          </div>
                        )
                        : <span className="text-xs text-gray-400">Atanmadı</span>,
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between gap-2">
                      <dt className="text-[10px] font-medium text-gray-400 shrink-0">{label}</dt>
                      <dd className="text-right">{value}</dd>
                    </div>
                  ))}
                </dl>

                {/* SLA */}
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <p className="text-[10px] font-medium text-gray-400 mb-1.5">SLA Durumu</p>
                  {ticket.slaDeadline ? (
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                        ticket.slaBreached
                          ? 'bg-red-50 text-red-700'
                          : 'bg-green-50 text-green-700'
                      }`}
                    >
                      {ticket.slaBreached
                        ? <AlertTriangle size={13} className="shrink-0" />
                        : <CheckCircle2  size={13} className="shrink-0" />
                      }
                      <div>
                        <p className="text-[10px] font-semibold">
                          {ticket.slaBreached ? 'SLA İhlali' : 'SLA Süresi İçinde'}
                        </p>
                        <p className="text-[10px] opacity-75">Son tarih: {ticket.slaDeadline}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">SLA tanımlı değil</p>
                  )}
                </div>
              </div>

              {/* Attachments card */}
              <div className="bg-white rounded-xl border border-gray-100 px-4 py-4">
                <h3 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                  <Paperclip size={13} className="text-gray-400" />
                  Dosya Ekleri
                  {attachments.length > 0 && (
                    <span className="ml-auto text-[10px] font-normal text-gray-400">{attachments.length} dosya</span>
                  )}
                </h3>
                {attachments.length === 0 ? (
                  <p className="text-[10px] text-gray-400">Ek dosya yok.</p>
                ) : (
                  <ul className="space-y-2">
                    {attachments.map((att) => (
                      <li key={att.id} className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                        <FileText size={13} className="text-gray-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-medium text-gray-700 truncate">{att.filename}</p>
                          <p className="text-[10px] text-gray-400">{formatBytes(att.sizeBytes)}</p>
                        </div>
                        <button
                          className="text-gray-400 hover:text-[#EB0A1E] transition shrink-0"
                          title="İndir"
                        >
                          <Download size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Timeline card */}
              <div className="bg-white rounded-xl border border-gray-100 px-4 py-4">
                <h3 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                  <Clock size={13} className="text-gray-400" />
                  Zaman Çizelgesi
                </h3>
                <ol className="relative border-l border-gray-100 ml-2 space-y-3">
                  {timeline.map((ev, idx) => (
                    <li key={ev.id} className="pl-4 relative">
                      <div
                        className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                          idx === 0 ? '' : 'bg-gray-200'
                        }`}
                        style={idx === 0 ? { background: '#EB0A1E' } : {}}
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
  );
}
