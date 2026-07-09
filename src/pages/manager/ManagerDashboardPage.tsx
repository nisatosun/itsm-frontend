import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  BarChart2,
  ShieldAlert,
  Bell,
  LogOut,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Timer,
  Users,
  SmilePlus,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

// ── Mock data ─────────────────────────────────────────────────────────────────

const TICKET_DISTRIBUTION = [
  { label: 'Açık',     count: 38, color: '#EB0A1E',  bg: '#FEF2F2' },
  { label: 'Triage',   count: 12, color: '#EC4899',  bg: '#FDF2F8' },
  { label: 'Atandı',   count: 24, color: '#2563EB',  bg: '#EFF6FF' },
  { label: 'İşlemde',  count: 41, color: '#7C3AED',  bg: '#F5F3FF' },
  { label: 'Bekleyen', count: 19, color: '#D97706',  bg: '#FFFBEB' },
  { label: 'Çözüldü',  count: 87, color: '#16A34A',  bg: '#F0FDF4' },
];

const AGENT_PERFORMANCE = [
  { name: 'Mert Yılmaz',    assigned: 18, resolved: 14, avgTime: '2s 45d', slaRate: 94 },
  { name: 'Selin Demir',    assigned: 15, resolved: 12, avgTime: '3s 10d', slaRate: 88 },
  { name: 'Ahmet Kaya',     assigned: 21, resolved: 17, avgTime: '2s 20d', slaRate: 97 },
  { name: 'Zeynep Koç',     assigned: 12, resolved:  9, avgTime: '4s 05d', slaRate: 79 },
  { name: 'Emre Şahin',     assigned: 16, resolved: 13, avgTime: '3s 30d', slaRate: 91 },
  { name: 'Fatma Öztürk',   assigned: 10, resolved:  8, avgTime: '2s 55d', slaRate: 85 },
];

const SLA_VIOLATIONS = [
  { id: 'TKT-1033', subject: 'ERP modülü hata veriyor',        agent: 'Zeynep Koç',  overdueMin: 45, priority: 'CRITICAL' },
  { id: 'TKT-1045', subject: 'Windows güncelleme döngüsü',     agent: 'Ahmet Kaya',  overdueMin: 12, priority: 'HIGH'     },
  { id: 'TKT-1051', subject: 'E-posta sunucusu erişilemiyor',  agent: 'Atanmadı',    overdueMin: 78, priority: 'CRITICAL' },
];

const ACTIVITY_FEED = [
  { icon: CheckCircle2, color: '#16A34A', text: 'TKT-1038 çözüldü',                         sub: 'Mert Yılmaz · az önce'      },
  { icon: AlertTriangle,color: '#DC2626', text: 'TKT-1033 SLA ihlali',                       sub: 'Zeynep Koç · 12d önce'      },
  { icon: Ticket,       color: '#2563EB', text: 'TKT-1050 açıldı ve atandı',                 sub: 'Sistem · 18d önce'          },
  { icon: CheckCircle2, color: '#16A34A', text: 'TKT-1047 çözüldü',                         sub: 'Selin Demir · 35d önce'     },
  { icon: AlertTriangle,color: '#D97706', text: 'TKT-1039 SLA eşiğine yaklaşıyor',          sub: 'Sistem · 42d önce'          },
  { icon: Users,        color: '#7C3AED', text: 'Emre Şahin vardiyaya başladı',              sub: 'Sistem · 1s önce'           },
  { icon: CheckCircle2, color: '#16A34A', text: 'TKT-1036 çözüldü',                         sub: 'Ahmet Kaya · 1s 20d önce'   },
];

// ── Nav ───────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',     href: '/manager/dashboard' },
  { icon: Ticket,          label: 'Tüm Ticketlar', href: '/manager/tickets' },
  { icon: BarChart2,       label: 'Raporlar',       href: '/manager/reports' },
  { icon: ShieldAlert,     label: 'SLA Yönetimi',   href: '/manager/sla' },
  { icon: Bell,            label: 'Bildirimler',    href: '/manager/notifications' },
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
          <p className="text-red-200 text-[10px] truncate">{email ?? 'Manager'}</p>
        </div>
        <button onClick={logout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-red-100 hover:bg-white/10 hover:text-white transition-all">
          <LogOut size={15} />Çıkış Yap
        </button>
      </div>
    </aside>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ManagerDashboardPage() {
  const { user, logout } = useAuth();

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ''}`.trim()
    : (user?.username ?? 'Manager');

  const totalTickets = TICKET_DISTRIBUTION.reduce((s, d) => s + d.count, 0);
  const maxCount     = Math.max(...TICKET_DISTRIBUTION.map((d) => d.count));

  const STAT_CARDS = [
    { label: 'Toplam Açık Ticket',     value: '38',   icon: Ticket,       color: '#EB0A1E', bg: '#FEF2F2' },
    { label: 'Bugün Çözülen',          value: '23',   icon: CheckCircle2, color: '#16A34A', bg: '#F0FDF4' },
    { label: 'SLA İhlali',             value: '3',    icon: AlertTriangle,color: '#DC2626', bg: '#FEF2F2' },
    { label: 'Ort. Çözüm Süresi',      value: '3s 2d',icon: Timer,        color: '#7C3AED', bg: '#F5F3FF' },
    { label: 'Aktif Agent',            value: '6',    icon: Users,        color: '#2563EB', bg: '#EFF6FF' },
    { label: 'Müşteri Memnuniyeti',    value: '%91',  icon: SmilePlus,    color: '#D97706', bg: '#FFFBEB' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar displayName={displayName} email={user?.email} logout={logout} />

      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">Dashboard</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">Hoş geldiniz, {displayName}</p>
          </div>
          <div className="flex items-center gap-2">
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
                <p className="text-[10px] text-gray-400 mt-0.5">Manager</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-5">

          {/* Stat cards — 3+3 */}
          <div className="grid grid-cols-3 gap-4">
            {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
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

            {/* ── LEFT (2/3) ─────────────────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-4">

              {/* Ticket distribution bar chart */}
              <div className="bg-white rounded-xl border border-gray-100 px-5 py-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-bold text-gray-900">Ticket Dağılımı</h2>
                  <span className="text-[10px] text-gray-400">Toplam {totalTickets} ticket</span>
                </div>
                <div className="space-y-2.5">
                  {TICKET_DISTRIBUTION.map((d) => {
                    const pct = Math.round((d.count / maxCount) * 100);
                    const share = ((d.count / totalTickets) * 100).toFixed(1);
                    return (
                      <div key={d.label} className="flex items-center gap-3">
                        <span className="text-[10px] font-medium text-gray-500 w-16 shrink-0 text-right">{d.label}</span>
                        <div className="flex-1 h-5 bg-gray-50 rounded-lg overflow-hidden">
                          <div
                            className="h-full rounded-lg flex items-center px-2 transition-all"
                            style={{ width: `${pct}%`, background: d.color + '22', minWidth: '2rem' }}
                          >
                            <div className="h-2 rounded-full flex-1" style={{ background: d.color, opacity: 0.8 }} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-bold text-gray-800 w-6 text-right">{d.count}</span>
                          <span className="text-[10px] text-gray-400 w-10">%{share}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Agent performance table */}
              <div className="bg-white rounded-xl border border-gray-100">
                <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
                  <h2 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <TrendingUp size={13} className="text-gray-400" />
                    Agent Performansı
                  </h2>
                  <span className="text-[10px] text-gray-400">Bu hafta</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-50">
                        {['Agent', 'Atanmış', 'Çözülen', 'Ort. Süre', 'SLA Uyum'].map((col) => (
                          <th key={col} className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {AGENT_PERFORMANCE.map((a) => {
                        const slaColor =
                          a.slaRate >= 90 ? '#16A34A' :
                          a.slaRate >= 80 ? '#D97706' : '#DC2626';
                        return (
                          <tr key={a.name} className="hover:bg-gray-50/60 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: '#EB0A1E' }}>
                                  {a.name.charAt(0)}
                                </div>
                                <span className="font-medium text-gray-800 text-xs">{a.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{a.assigned}</td>
                            <td className="px-4 py-3 text-gray-600">{a.resolved}</td>
                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{a.avgTime}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${a.slaRate}%`, background: slaColor }} />
                                </div>
                                <span className="text-[10px] font-semibold shrink-0" style={{ color: slaColor }}>
                                  %{a.slaRate}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ── RIGHT (1/3) ────────────────────────────────────────── */}
            <div className="w-64 shrink-0 space-y-4">

              {/* SLA violations */}
              <div className="bg-white rounded-xl border border-gray-100">
                <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-red-500 shrink-0" />
                  <h2 className="text-xs font-bold text-gray-900">SLA İhlalleri</h2>
                  <span className="ml-auto text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full" style={{ background: '#EB0A1E' }}>
                    {SLA_VIOLATIONS.length}
                  </span>
                </div>
                <ul className="p-3 space-y-2">
                  {SLA_VIOLATIONS.map((v) => (
                    <li key={v.id} className="px-3 py-2.5 rounded-lg bg-red-50 border border-red-200">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-mono text-[10px] text-red-400">{v.id}</span>
                        <span className="text-[10px] font-bold text-red-600">{v.overdueMin}d ihlal</span>
                      </div>
                      <p className="text-[11px] font-medium text-gray-800 leading-snug line-clamp-2">{v.subject}</p>
                      <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                        <Users size={9} />{v.agent}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Activity feed */}
              <div className="bg-white rounded-xl border border-gray-100">
                <div className="px-4 py-3 border-b border-gray-50">
                  <h2 className="text-xs font-bold text-gray-900">Son Aktiviteler</h2>
                </div>
                <ul className="px-4 py-3 space-y-3">
                  {ACTIVITY_FEED.map(({ icon: Icon, color, text, sub }, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: color + '18' }}>
                        <Icon size={12} style={{ color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-gray-800 leading-snug">{text}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
