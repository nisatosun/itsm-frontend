import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  BookOpen,
  Bell,
  BarChart2,
  ClipboardList,
  LogOut,
  ChevronRight,
  Inbox,
  ShieldAlert,
  Tag,
  Users,
  CheckCheck,
  TicketCheck,
  RefreshCw,
  ArrowRightLeft,
  AlertTriangle,
  MessageSquare,
  CircleCheck,
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

// ── Types ─────────────────────────────────────────────────────────────────────

type NotifType = 'TICKET_OPENED' | 'STATUS_CHANGED' | 'SLA_WARNING' | 'COMMENT_ADDED' | 'RESOLVED';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  description: string;
  ticketId: string | null;
  createdAt: string;
  read: boolean;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n-001',
    type: 'SLA_WARNING',
    title: 'SLA Süresi Dolmak Üzere',
    description: 'TKT-1042 numaralı ticketın SLA süresi 2 saat içinde dolacak.',
    ticketId: 'TKT-1042',
    createdAt: '12 May 2026, 16:45',
    read: false,
  },
  {
    id: 'n-002',
    type: 'COMMENT_ADDED',
    title: 'Yeni Yorum',
    description: 'Mert Yılmaz, TKT-1042 numaralı ticketa yanıt verdi.',
    ticketId: 'TKT-1042',
    createdAt: '12 May 2026, 16:05',
    read: false,
  },
  {
    id: 'n-003',
    type: 'STATUS_CHANGED',
    title: 'Ticket Durumu Değişti',
    description: 'TKT-1041 numaralı ticketın durumu "Açık" → "Bekleyen" olarak güncellendi.',
    ticketId: 'TKT-1041',
    createdAt: '12 May 2026, 10:32',
    read: false,
  },
  {
    id: 'n-004',
    type: 'TICKET_OPENED',
    title: 'Ticket Oluşturuldu',
    description: 'TKT-1042 numaralı destek talebiniz başarıyla oluşturuldu ve destek ekibine iletildi.',
    ticketId: 'TKT-1042',
    createdAt: '12 May 2026, 09:14',
    read: false,
  },
  {
    id: 'n-005',
    type: 'RESOLVED',
    title: 'Ticket Çözüldü',
    description: 'TKT-1038 numaralı "Teams toplantı bağlantısı" sorununuz çözüldü.',
    ticketId: 'TKT-1038',
    createdAt: '11 May 2026, 14:20',
    read: true,
  },
  {
    id: 'n-006',
    type: 'COMMENT_ADDED',
    title: 'Yeni Yorum',
    description: 'Destek ekibi TKT-1039 numaralı ticketa ek bilgi talep etti.',
    ticketId: 'TKT-1039',
    createdAt: '11 May 2026, 11:03',
    read: true,
  },
  {
    id: 'n-007',
    type: 'STATUS_CHANGED',
    title: 'Ticket Durumu Değişti',
    description: 'TKT-1037 numaralı ticketın durumu "Bekleyen" → "Çözüldü" olarak güncellendi.',
    ticketId: 'TKT-1037',
    createdAt: '10 May 2026, 17:55',
    read: true,
  },
  {
    id: 'n-008',
    type: 'TICKET_OPENED',
    title: 'Ticket Oluşturuldu',
    description: 'TKT-1039 numaralı "Outlook e-posta gönderilemiyor" talebiniz oluşturuldu.',
    ticketId: 'TKT-1039',
    createdAt: '11 May 2026, 08:47',
    read: true,
  },
  {
    id: 'n-009',
    type: 'RESOLVED',
    title: 'Ticket Çözüldü',
    description: 'TKT-1035 numaralı "Outlook şifresi sıfırlama" sorununuz çözüldü. Memnuniyet anketini doldurmayı unutmayın.',
    ticketId: 'TKT-1035',
    createdAt: '10 May 2026, 09:30',
    read: true,
  },
  {
    id: 'n-010',
    type: 'SLA_WARNING',
    title: 'SLA İhlali Oluştu',
    description: 'TKT-1033 numaralı kritik ticketın SLA süresi ihlal edildi. Destek ekibimiz bilgilendirildi.',
    ticketId: 'TKT-1033',
    createdAt: '6 May 2026, 18:00',
    read: true,
  },
];

// ── Notification type config ──────────────────────────────────────────────────

const TYPE_CONFIG: Record<NotifType, { icon: React.ElementType; bg: string; color: string }> = {
  TICKET_OPENED:  { icon: Ticket,          bg: '#EFF6FF', color: '#2563EB' },
  STATUS_CHANGED: { icon: ArrowRightLeft,  bg: '#FFF7ED', color: '#EA580C' },
  SLA_WARNING:    { icon: AlertTriangle,   bg: '#FEF2F2', color: '#DC2626' },
  COMMENT_ADDED:  { icon: MessageSquare,   bg: '#F0FDF4', color: '#16A34A' },
  RESOLVED:       { icon: CircleCheck,     bg: '#F5F3FF', color: '#7C3AED' },
};

type FilterType = 'Tümü' | 'Okunmamış' | 'Okunmuş';
const FILTERS: FilterType[] = ['Tümü', 'Okunmamış', 'Okunmuş'];

// ── Nav ───────────────────────────────────────────────────────────────────────

type Role = 'ADMIN' | 'MANAGER' | 'AGENT' | 'CUSTOMER';

type NavItem = {
  icon: React.ElementType;
  label: string;
  href: string;
};

const NAV_ITEMS_BY_ROLE: Record<Role, NavItem[]> = {
  ADMIN: [
    { icon: LayoutDashboard, label: 'Dashboard',          href: '/admin/dashboard' },
    { icon: Users,           label: 'Kullanıcı Yönetimi', href: '/admin/users' },
    { icon: Tag,             label: 'Kategori Yönetimi',  href: '/admin/categories' },
    { icon: ClipboardList,   label: 'Audit Log',          href: '/admin/audit' },
    { icon: Bell,            label: 'Bildirimler',        href: '/admin/notifications' },
  ],
  MANAGER: [
    { icon: LayoutDashboard, label: 'Dashboard',     href: '/manager/dashboard' },
    { icon: Ticket,          label: 'Tüm Ticketlar', href: '/manager/tickets' },
    { icon: BarChart2,       label: 'Raporlar',      href: '/manager/reports' },
    { icon: ShieldAlert,     label: 'SLA Yönetimi',  href: '/manager/sla' },
    { icon: Bell,            label: 'Bildirimler',   href: '/manager/notifications' },
  ],
  AGENT: [
    { icon: LayoutDashboard, label: 'Dashboard',         href: '/agent/dashboard' },
    { icon: Ticket,          label: 'Atanmış Ticketlar', href: '/agent/tickets' },
    { icon: Inbox,           label: 'Ticket Havuzu',     href: '/agent/queue' },
    { icon: BookOpen,        label: 'Bilgi Bankası',     href: '/agent/knowledge-base' },
    { icon: Bell,            label: 'Bildirimler',       href: '/agent/notifications' },
  ],
  CUSTOMER: [
    { icon: LayoutDashboard, label: 'Dashboard',     href: '/customer/dashboard' },
    { icon: Ticket,          label: 'Ticketlarım',   href: '/customer/tickets' },
    { icon: PlusCircle,      label: 'Yeni Ticket',   href: '/customer/tickets/new' },
    { icon: BookOpen,        label: 'Bilgi Bankası', href: '/customer/knowledge-base' },
    { icon: Bell,            label: 'Bildirimler',   href: '/customer/notifications' },
  ],
};

function getActiveRole(roles: string[], pathname: string): Role {
  if (pathname.startsWith('/admin')) return 'ADMIN';
  if (pathname.startsWith('/manager')) return 'MANAGER';
  if (pathname.startsWith('/agent')) return 'AGENT';
  if (pathname.startsWith('/customer')) return 'CUSTOMER';

  if (roles.includes('ADMIN')) return 'ADMIN';
  if (roles.includes('MANAGER')) return 'MANAGER';
  if (roles.includes('AGENT')) return 'AGENT';
  return 'CUSTOMER';
}

function getTicketDetailPath(role: Role, ticketId: string) {
  const prefix = role.toLowerCase();
  return `/${prefix}/tickets/${ticketId}`;
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({
  displayName,
  email,
  logout,
  unreadCount,
  role,
}: {
  displayName: string;
  email?: string;
  logout: () => void;
  unreadCount: number;
  role: Role;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = NAV_ITEMS_BY_ROLE[role];

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
        {navItems.map(({ icon: Icon, label, href }) => {
          const active = href !== '#' && location.pathname === href;
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
              {label === 'Bildirimler' && unreadCount > 0 && !active && (
                <span className="flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[9px] font-bold text-white bg-white/30">
                  {unreadCount}
                </span>
              )}
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

export default function NotificationsPage() {
  const { user, token, logout, roles } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const activeRole = getActiveRole(roles, location.pathname);

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ''}`.trim()
    : (user?.username ?? 'Kullanıcı');

  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [loading,       setLoading]       = useState(true);
  const [markingAll,    setMarkingAll]    = useState(false);
  const [filter,        setFilter]        = useState<FilterType>('Tümü');

  // Fetch
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    axios
      .get<Notification[]>('http://localhost:8083/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => { if (!cancelled) setNotifications(res.data); })
      .catch(() => { if (!cancelled) setNotifications(MOCK_NOTIFICATIONS); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [token]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const filtered = useMemo(() => {
    const list = notifications.filter((n) => {
      if (filter === 'Okunmamış') return !n.read;
      if (filter === 'Okunmuş')   return n.read;
      return true;
    });
    // unread first
    return [...list].sort((a, b) => Number(a.read) - Number(b.read));
  }, [notifications, filter]);

  // Mark single as read
  async function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    axios
      .put(`http://localhost:8083/api/notifications/${id}/read`, null, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .catch(() => { /* optimistic — already updated locally */ });
  }

  // Mark all as read
  async function markAllRead() {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    axios
      .put('http://localhost:8083/api/notifications/mark-all-read', null, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .catch(() => { /* optimistic */ })
      .finally(() => setMarkingAll(false));
  }

  // Click: mark read + navigate
  function handleClick(notif: Notification) {
    if (!notif.read) markRead(notif.id);
    if (notif.ticketId) {
      navigate(getTicketDetailPath(activeRole, notif.ticketId));
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        displayName={displayName}
        email={user?.email}
        logout={logout}
        unreadCount={unreadCount}
        role={activeRole}
      />

      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">Bildirimler</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {loading
                ? 'Yükleniyor...'
                : unreadCount > 0
                  ? `${unreadCount} okunmamış bildirim`
                  : 'Tüm bildirimler okundu'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={markingAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
              >
                {markingAll
                  ? <RefreshCw size={12} className="animate-spin" />
                  : <CheckCheck size={12} />
                }
                Tümünü Okundu İşaretle
              </button>
            )}
            <button className="relative p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 transition">
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full border-2 border-white" style={{ background: '#EB0A1E' }} />
              )}
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
                <p className="text-[10px] text-gray-400 mt-0.5">{activeRole}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-4">

          {/* Filter bar */}
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                    filter === f
                      ? 'text-white border-transparent'
                      : 'text-gray-500 bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                  style={filter === f ? { background: '#EB0A1E', borderColor: '#EB0A1E' } : {}}
                >
                  {f}
                  {f === 'Okunmamış' && unreadCount > 0 && (
                    <span className={`ml-1.5 px-1 py-0.5 rounded text-[9px] font-bold ${filter === f ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400">{filtered.length} bildirim</p>
          </div>

          {/* Notification list */}
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-gray-400 text-xs">
              <RefreshCw size={15} className="animate-spin" />
              Bildirimler yükleniyor...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <TicketCheck size={32} className="text-gray-200" />
              <p className="text-sm font-medium text-gray-400">
                {filter === 'Okunmamış' ? 'Okunmamış bildirim yok' : 'Bildirim bulunamadı'}
              </p>
              <p className="text-[10px] text-gray-300">Her şey güncel görünüyor</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
              {filtered.map((notif) => {
                const cfg = TYPE_CONFIG[notif.type];
                const Icon = cfg.icon;
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={`flex items-start gap-3.5 px-5 py-3.5 transition-colors cursor-pointer group ${
                      !notif.read
                        ? 'bg-blue-50/50 hover:bg-blue-50'
                        : 'hover:bg-gray-50/70'
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: cfg.bg }}
                    >
                      <Icon size={15} style={{ color: cfg.color }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-semibold leading-snug ${!notif.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-gray-400 shrink-0 mt-0.5">{notif.createdAt}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{notif.description}</p>
                      {notif.ticketId && (
                        <span className="inline-flex mt-1.5 items-center font-mono text-[10px] text-gray-400 group-hover:text-[#EB0A1E] transition-colors">
                          {notif.ticketId} →
                        </span>
                      )}
                    </div>

                    {/* Unread dot */}
                    <div className="shrink-0 mt-1.5 w-4 flex items-center justify-center">
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
