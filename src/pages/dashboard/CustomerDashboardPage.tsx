import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  BookOpen,
  Bell,
  LogOut,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Hash,
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

const mockTickets = [
  { id: 'TKT-1042', subject: 'VPN bağlantısı kopuyor',       priority: 'Yüksek', status: 'Açık',     date: '12 May 2026' },
  { id: 'TKT-1039', subject: 'Yazıcı kurulumu',               priority: 'Düşük',  status: 'Bekleyen', date: '11 May 2026' },
  { id: 'TKT-1035', subject: 'Outlook şifresi sıfırlama',     priority: 'Orta',   status: 'Çözüldü',  date: '10 May 2026' },
  { id: 'TKT-1028', subject: 'SAP erişim talebi',             priority: 'Yüksek', status: 'Çözüldü',  date: '8 May 2026'  },
  { id: 'TKT-1020', subject: 'Laptop performans sorunu',       priority: 'Orta',   status: 'Çözüldü',  date: '5 May 2026'  },
];

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',    href: '/customer/dashboard' },
  { icon: Ticket,          label: 'Ticketlarım',  href: '/customer/tickets' },
  { icon: PlusCircle,      label: 'Yeni Ticket',  href: '/customer/tickets/new' },
  { icon: BookOpen,        label: 'Bilgi Bankası', href: '#' },
  { icon: Bell,            label: 'Bildirimler',   href: '#' },
];

const STATS = [
  { label: 'Açık Ticketlar', value: 3,  icon: AlertCircle,  color: '#EB0A1E', bg: '#FEF2F2' },
  { label: 'Bekleyen',       value: 1,  icon: Clock,        color: '#F59E0B', bg: '#FFFBEB' },
  { label: 'Çözüldü',        value: 12, icon: CheckCircle2, color: '#10B981', bg: '#ECFDF5' },
  { label: 'Toplam',         value: 16, icon: Hash,         color: '#6366F1', bg: '#EEF2FF' },
];

const PRIORITY_STYLE: Record<string, string> = {
  Yüksek: 'bg-red-50 text-red-600',
  Orta:   'bg-amber-50 text-amber-600',
  Düşük:  'bg-green-50 text-green-600',
};

const STATUS_STYLE: Record<string, string> = {
  Açık:     'bg-red-50 text-red-600',
  Bekleyen: 'bg-amber-50 text-amber-600',
  Çözüldü:  'bg-green-50 text-green-600',
};

export default function CustomerDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const activeNav = NAV_ITEMS.find(
    (item) => item.href !== '#' && location.pathname === item.href
  )?.label ?? 'Dashboard';

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ''}`.trim()
    : (user?.username ?? 'Kullanıcı');

  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ── Sidebar ── */}
      <aside className="w-56 shrink-0 flex flex-col" style={{ background: '#EB0A1E' }}>

        {/* Logo */}
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

        {/* Nav items */}
        <nav className="flex-1 px-2.5 py-3 flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
            const active = href !== '#' && location.pathname === href;
            return (
              <button
                key={label}
                onClick={() => { if (href !== '#') navigate(href); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                  active
                    ? 'bg-white/20 text-white'
                    : 'text-red-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={15} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={12} />}
              </button>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="px-2.5 py-3 border-t border-white/10">
          <div className="px-3 py-1.5 mb-0.5">
            <p className="text-white text-xs font-medium truncate">{displayName}</p>
            <p className="text-red-200 text-[10px] truncate">{user?.email ?? 'Müşteri'}</p>
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

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">{activeNav}</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">Hoş geldiniz, {displayName}</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <button className="relative p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition">
              <Bell size={17} />
              <span
                className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full border-2 border-white"
                style={{ background: '#EB0A1E' }}
              />
            </button>

            {/* Avatar */}
            <div className="flex items-center gap-2 pl-3 border-l border-gray-100">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: '#EB0A1E' }}
              >
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-gray-800 leading-none">{displayName}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Müşteri</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 space-y-5">

          {/* Stat cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {STATS.map(({ label, value, icon: Icon, color, bg }) => (
              <div
                key={label}
                className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 hover:shadow-sm transition-shadow"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: bg }}
                >
                  <Icon size={17} style={{ color }} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{value}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Recent tickets table */}
          <div className="bg-white rounded-xl border border-gray-100">
            <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-xs font-bold text-gray-900">Son Ticketlar</h2>
              <button
                className="text-[10px] font-medium hover:underline transition"
                style={{ color: '#EB0A1E' }}
              >
                Tümünü Gör
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-50">
                    {['Ticket No', 'Konu', 'Öncelik', 'Durum', 'Tarih'].map((col) => (
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
                  {mockTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 font-mono text-[10px] text-gray-400 whitespace-nowrap">
                        {ticket.id}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 text-xs">
                        {ticket.subject}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${PRIORITY_STYLE[ticket.priority]}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_STYLE[ticket.status]}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[10px] text-gray-400 whitespace-nowrap">
                        {ticket.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            <div className="px-4 py-2.5 border-t border-gray-50 flex items-center justify-between">
              <p className="text-[10px] text-gray-400">
                {mockTickets.length} kayıt gösteriliyor
              </p>
              <div className="flex items-center gap-1">
                {['1', '2', '3'].map((page) => (
                  <button
                    key={page}
                    className={`w-6 h-6 rounded text-[10px] font-medium transition ${
                      page === '1'
                        ? 'text-white'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                    style={page === '1' ? { background: '#EB0A1E' } : {}}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
