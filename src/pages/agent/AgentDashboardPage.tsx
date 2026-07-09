import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard,
  Ticket,
  Inbox,
  BookOpen,
  Bell,
  LogOut,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Timer,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AgentTicket {
  id: string;
  subject: string;
  priority: string;
  status: string;
  customerName: string;
  slaMinutesLeft: number | null; // null = no SLA
  createdAt: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_TICKETS: AgentTicket[] = [
  { id: 'TKT-1042', subject: 'VPN bağlantısı sürekli kopuyor',          priority: 'HIGH',     status: 'Bekleyen', customerName: 'Elif Nisatosun',  slaMinutesLeft: 92,   createdAt: '12 May 2026' },
  { id: 'TKT-1041', subject: 'SAP oturumu açılmıyor',                   priority: 'CRITICAL', status: 'Açık',     customerName: 'Ahmet Kaya',      slaMinutesLeft: 35,   createdAt: '12 May 2026' },
  { id: 'TKT-1040', subject: 'Yazıcı sürücüsü kurulumu',                priority: 'LOW',      status: 'Açık',     customerName: 'Selin Demir',     slaMinutesLeft: 480,  createdAt: '11 May 2026' },
  { id: 'TKT-1039', subject: 'Outlook e-posta gönderilemiyor',          priority: 'HIGH',     status: 'Bekleyen', customerName: 'Murat Yıldız',    slaMinutesLeft: 18,   createdAt: '11 May 2026' },
  { id: 'TKT-1036', subject: 'Active Directory erişim talebi',          priority: 'MEDIUM',   status: 'Açık',     customerName: 'Ayşe Çelik',      slaMinutesLeft: 320,  createdAt: '9 May 2026'  },
  { id: 'TKT-1034', subject: 'Laptop ekran parlaklığı sorunu',          priority: 'LOW',      status: 'Açık',     customerName: 'Burak Arslan',    slaMinutesLeft: null, createdAt: '7 May 2026'  },
  { id: 'TKT-1033', subject: 'ERP modülü hata veriyor (kod: 0x4F2)',    priority: 'CRITICAL', status: 'Bekleyen', customerName: 'Zeynep Koç',      slaMinutesLeft: -45,  createdAt: '6 May 2026'  },
  { id: 'TKT-1031', subject: 'Uzak masaüstü bağlantı hatası',          priority: 'HIGH',     status: 'Açık',     customerName: 'Emre Şahin',      slaMinutesLeft: 210,  createdAt: '4 May 2026'  },
  { id: 'TKT-1030', subject: 'Yeni kullanıcı hesabı açılması',         priority: 'MEDIUM',   status: 'Açık',     customerName: 'Fatma Öztürk',    slaMinutesLeft: 600,  createdAt: '3 May 2026'  },
  { id: 'TKT-1029', subject: 'Antivirüs lisansı yenileme',              priority: 'MEDIUM',   status: 'Bekleyen', customerName: 'Can Aydın',       slaMinutesLeft: 55,   createdAt: '2 May 2026'  },
  { id: 'TKT-1027', subject: 'Wi-Fi bağlantı kesintisi — 3. kat',      priority: 'HIGH',     status: 'Açık',     customerName: 'Hande Güler',     slaMinutesLeft: 110,  createdAt: '1 May 2026'  },
  { id: 'TKT-1025', subject: 'Teams ses sorunu toplantılarda',          priority: 'MEDIUM',   status: 'Açık',     customerName: 'Tolga Erdoğan',   slaMinutesLeft: 390,  createdAt: '30 Nis 2026' },
];

// ── Style helpers ─────────────────────────────────────────────────────────────

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

function slaLabel(minutes: number | null): { text: string; cls: string } {
  if (minutes === null) return { text: '—', cls: 'text-gray-400' };
  if (minutes < 0)      return { text: `${Math.abs(minutes)}d ihlal`,  cls: 'text-red-600 font-semibold' };
  if (minutes < 60)     return { text: `${minutes}d kaldı`,            cls: 'text-red-500 font-semibold' };
  if (minutes < 120)    return { text: `${Math.floor(minutes / 60)}s ${minutes % 60}d`, cls: 'text-amber-600 font-semibold' };
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return { text: `${h}s ${m}d`, cls: 'text-green-600' };
}

// ── Nav ───────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',         href: '/agent/dashboard' },
  { icon: Ticket,          label: 'Atanmış Ticketlar', href: '/agent/tickets' },
  { icon: Inbox,           label: 'Ticket Havuzu',     href: '/agent/queue' },
  { icon: BookOpen,        label: 'Bilgi Bankası',      href: '/agent/knowledge-base' },
  { icon: Bell,            label: 'Bildirimler',        href: '/agent/notifications' },
];

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
          const active = location.pathname === href;
          return (
            <button
              key={label}
              onClick={() => navigate(href)}
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
          <p className="text-red-200 text-[10px] truncate">{email ?? 'Agent'}</p>
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

export default function AgentDashboardPage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ''}`.trim()
    : (user?.username ?? 'Agent');

  const [tickets,  setTickets]  = useState<AgentTicket[]>(MOCK_TICKETS);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    axios
      .get<AgentTicket[]>('http://localhost:8083/api/tickets', {
        params: { assignee: 'me' },
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => { if (!cancelled) { setTickets(res.data); setFetchErr(false); } })
      .catch(() => { if (!cancelled) { setTickets(MOCK_TICKETS); setFetchErr(true); } })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [token]);

  // Derived stats
  const stats = useMemo(() => {
    const assigned  = tickets.length;
    const resolvedToday = 4; // would come from backend
    const slaClose  = tickets.filter(
      (t) => t.slaMinutesLeft !== null && t.slaMinutesLeft >= 0 && t.slaMinutesLeft < 120
    ).length;
    return { assigned, resolvedToday, slaClose, avgResolution: '3s 42d' };
  }, [tickets]);

  // SLA danger list: breached or < 120 min
  const slaDanger = useMemo(
    () =>
      tickets
        .filter((t) => t.slaMinutesLeft !== null && t.slaMinutesLeft < 120)
        .sort((a, b) => (a.slaMinutesLeft ?? 0) - (b.slaMinutesLeft ?? 0)),
    [tickets]
  );

  const STAT_CARDS = [
    { label: 'Atanmış Ticketlar', value: loading ? '—' : stats.assigned,     icon: Ticket,       color: '#2563EB', bg: '#EFF6FF' },
    { label: 'Bugün Çözülen',     value: loading ? '—' : stats.resolvedToday, icon: CheckCircle2, color: '#16A34A', bg: '#F0FDF4' },
    { label: 'SLA Yaklaşan',      value: loading ? '—' : stats.slaClose,      icon: AlertTriangle,color: '#DC2626', bg: '#FEF2F2' },
    { label: 'Ort. Çözüm Süresi', value: loading ? '—' : stats.avgResolution, icon: Timer,        color: '#7C3AED', bg: '#F5F3FF' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar displayName={displayName} email={user?.email} logout={logout} />

      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">Dashboard</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Hoş geldiniz, {displayName}
              {fetchErr && <span className="ml-2 text-amber-500">· Demo verisi</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
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
                <p className="text-[10px] text-gray-400 mt-0.5">Agent</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-5">

          {/* Stat cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
              <div
                key={label}
                className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 hover:shadow-sm transition-shadow"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
                  <Icon size={17} style={{ color }} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{value}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Two-column layout */}
          <div className="flex gap-5 items-start">

            {/* ── LEFT: Assigned tickets table (2/3) ─────────────────── */}
            <div className="flex-1 min-w-0 bg-white rounded-xl border border-gray-100">
              <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-xs font-bold text-gray-900">Atanmış Ticketlar</h2>
                <button
                  onClick={() => navigate('/agent/tickets')}
                  className="text-[10px] font-medium hover:underline"
                  style={{ color: '#EB0A1E' }}
                >
                  Tümünü Gör
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-gray-400 text-xs">
                  <RefreshCw size={14} className="animate-spin" />
                  Yükleniyor...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-50">
                        {['Ticket No', 'Konu', 'Öncelik', 'Durum', 'SLA', 'İşlem'].map((col) => (
                          <th
                            key={col}
                            className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {tickets.slice(0, 8).map((t) => {
                        const p   = PRIORITY_STYLE[t.priority] ?? { label: t.priority, cls: 'bg-gray-100 text-gray-600' };
                        const s   = STATUS_STYLE[t.status]     ?? { label: t.status,   cls: 'bg-gray-100 text-gray-600' };
                        const sla = slaLabel(t.slaMinutesLeft);
                        return (
                          <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="px-4 py-3 font-mono text-[10px] text-gray-400 whitespace-nowrap">{t.id}</td>
                            <td className="px-4 py-3 max-w-[180px]">
                              <p className="font-medium text-gray-800 truncate">{t.subject}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5 truncate">{t.customerName}</p>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${p.cls}`}>
                                {p.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${s.cls}`}>
                                {s.label}
                              </span>
                            </td>
                            <td className={`px-4 py-3 whitespace-nowrap text-[10px] ${sla.cls}`}>
                              <span className="flex items-center gap-1">
                                <Clock size={11} />
                                {sla.text}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <button
                                onClick={() => navigate(`/agent/tickets/${t.id}`)}
                                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded-lg border border-gray-200 text-gray-600 hover:border-[#EB0A1E] hover:text-[#EB0A1E] transition-all"
                              >
                                <ExternalLink size={11} />
                                İşle
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── RIGHT: SLA danger list (1/3) ───────────────────────── */}
            <div className="w-64 shrink-0">
              <div className="bg-white rounded-xl border border-gray-100">
                <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-red-500 shrink-0" />
                  <h2 className="text-xs font-bold text-gray-900">SLA Tehlikeli</h2>
                  {slaDanger.length > 0 && (
                    <span className="ml-auto text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full" style={{ background: '#EB0A1E' }}>
                      {slaDanger.length}
                    </span>
                  )}
                </div>

                {loading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-gray-400 text-xs">
                    <RefreshCw size={13} className="animate-spin" />
                  </div>
                ) : slaDanger.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-1.5 text-center px-4">
                    <CheckCircle2 size={24} className="text-green-300" />
                    <p className="text-xs font-medium text-gray-400">Tüm SLA'lar güvende</p>
                  </div>
                ) : (
                  <ul className="p-3 space-y-2">
                    {slaDanger.map((t) => {
                      const sla     = slaLabel(t.slaMinutesLeft);
                      const breached = (t.slaMinutesLeft ?? 0) < 0;
                      return (
                        <li key={t.id}>
                          <button
                            onClick={() => navigate(`/agent/tickets/${t.id}`)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all hover:shadow-sm ${
                              breached
                                ? 'bg-red-50 border-red-200 hover:border-red-300'
                                : 'bg-amber-50 border-amber-200 hover:border-amber-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="font-mono text-[10px] text-gray-500">{t.id}</span>
                              <span className={`text-[10px] font-bold ${sla.cls}`}>{sla.text}</span>
                            </div>
                            <p className="text-[11px] font-medium text-gray-800 leading-snug line-clamp-2">
                              {t.subject}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1">{t.customerName}</p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
