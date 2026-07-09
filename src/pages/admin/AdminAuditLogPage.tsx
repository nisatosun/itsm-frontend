import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Tag, ClipboardList, Bell, LogOut,
  Search, X, Filter,
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',          href: '/admin/dashboard' },
  { icon: Users,           label: 'Kullanıcı Yönetimi', href: '/admin/users' },
  { icon: Tag,             label: 'Kategori Yönetimi',  href: '/admin/categories' },
  { icon: ClipboardList,   label: 'Audit Log',          href: '/admin/audit' },
  { icon: Bell,            label: 'Bildirimler',        href: '/admin/notifications' },
];

type ActionType =
  | 'USER_CREATED' | 'USER_UPDATED' | 'USER_DEACTIVATED'
  | 'ROLE_CHANGED' | 'TICKET_CREATED' | 'TICKET_ASSIGNED'
  | 'TICKET_RESOLVED' | 'TICKET_CLOSED' | 'SLA_UPDATED'
  | 'CATEGORY_CREATED' | 'CATEGORY_DELETED' | 'REPORT_EXPORTED'
  | 'LOGIN' | 'LOGOUT' | 'PASSWORD_RESET';

interface AuditEntry {
  id: number;
  timestamp: string;
  date: string;
  user: string;
  role: 'ADMIN' | 'MANAGER' | 'AGENT' | 'CUSTOMER';
  action: ActionType;
  detail: string;
  ip: string;
}

const ACTION_META: Record<ActionType, { label: string; color: string }> = {
  USER_CREATED:      { label: 'Kullanıcı Oluşturuldu',   color: 'bg-blue-100 text-blue-700' },
  USER_UPDATED:      { label: 'Kullanıcı Güncellendi',   color: 'bg-blue-100 text-blue-700' },
  USER_DEACTIVATED:  { label: 'Kullanıcı Pasif Edildi',  color: 'bg-orange-100 text-orange-700' },
  ROLE_CHANGED:      { label: 'Rol Değiştirildi',        color: 'bg-purple-100 text-purple-700' },
  TICKET_CREATED:    { label: 'Ticket Açıldı',           color: 'bg-green-100 text-green-700' },
  TICKET_ASSIGNED:   { label: 'Ticket Atandı',           color: 'bg-teal-100 text-teal-700' },
  TICKET_RESOLVED:   { label: 'Ticket Çözüldü',         color: 'bg-emerald-100 text-emerald-700' },
  TICKET_CLOSED:     { label: 'Ticket Kapatıldı',       color: 'bg-gray-100 text-gray-600' },
  SLA_UPDATED:       { label: 'SLA Güncellendi',         color: 'bg-amber-100 text-amber-700' },
  CATEGORY_CREATED:  { label: 'Kategori Oluşturuldu',   color: 'bg-indigo-100 text-indigo-700' },
  CATEGORY_DELETED:  { label: 'Kategori Silindi',        color: 'bg-red-100 text-red-700' },
  REPORT_EXPORTED:   { label: 'Rapor İndirildi',         color: 'bg-cyan-100 text-cyan-700' },
  LOGIN:             { label: 'Giriş Yapıldı',           color: 'bg-green-100 text-green-700' },
  LOGOUT:            { label: 'Çıkış Yapıldı',           color: 'bg-gray-100 text-gray-500' },
  PASSWORD_RESET:    { label: 'Şifre Sıfırlandı',        color: 'bg-red-100 text-red-700' },
};

const ROLE_COLOR: Record<string, string> = {
  ADMIN:    'bg-red-100 text-red-700',
  MANAGER:  'bg-orange-100 text-orange-700',
  AGENT:    'bg-blue-100 text-blue-700',
  CUSTOMER: 'bg-green-100 text-green-700',
};

const MOCK_LOGS: AuditEntry[] = [
  { id:1,  timestamp:'09:14:32', date:'14.05.2026', user:'sistem',         role:'ADMIN',    action:'USER_CREATED',     detail:'Zeynep Arslan oluşturuldu',          ip:'—'            },
  { id:2,  timestamp:'09:12:05', date:'14.05.2026', user:'Elif Tosun',     role:'ADMIN',    action:'ROLE_CHANGED',     detail:'H. Şahin → MANAGER rolü atandı',    ip:'192.168.1.10' },
  { id:3,  timestamp:'09:05:18', date:'14.05.2026', user:'Ahmet Yılmaz',  role:'MANAGER',  action:'REPORT_EXPORTED',  detail:'Mayıs 2026 Özet Raporu',            ip:'10.0.0.42'    },
  { id:4,  timestamp:'09:00:00', date:'14.05.2026', user:'Zeynep Arslan', role:'AGENT',    action:'LOGIN',            detail:'Başarılı giriş',                    ip:'10.0.0.73'    },
  { id:5,  timestamp:'08:58:44', date:'14.05.2026', user:'Mehmet Kaya',   role:'AGENT',    action:'TICKET_ASSIGNED',  detail:'TKT-2031 → Mehmet Kaya',            ip:'10.0.0.55'    },
  { id:6,  timestamp:'08:47:20', date:'14.05.2026', user:'Ayşe Demir',    role:'AGENT',    action:'TICKET_RESOLVED',  detail:'TKT-2028 çözüldü',                 ip:'10.0.0.61'    },
  { id:7,  timestamp:'08:30:55', date:'14.05.2026', user:'Elif Tosun',    role:'ADMIN',    action:'CATEGORY_CREATED', detail:'Kategori: "Ağ / VPN" eklendi',     ip:'192.168.1.10' },
  { id:8,  timestamp:'08:18:02', date:'14.05.2026', user:'Fatma Çelik',   role:'CUSTOMER', action:'TICKET_CREATED',   detail:'TKT-2032 açıldı',                  ip:'78.45.12.200' },
  { id:9,  timestamp:'08:10:30', date:'14.05.2026', user:'Elif Tosun',    role:'ADMIN',    action:'SLA_UPDATED',      detail:'Kritik SLA: 4h → 3h güncellendi',   ip:'192.168.1.10' },
  { id:10, timestamp:'08:05:17', date:'14.05.2026', user:'Hasan Şahin',   role:'MANAGER',  action:'SLA_UPDATED',      detail:'Düşük SLA politikası güncellendi',  ip:'10.0.0.42'    },
  { id:11, timestamp:'07:52:40', date:'14.05.2026', user:'Zeynep Arslan', role:'AGENT',    action:'TICKET_CLOSED',    detail:'TKT-2019 kapatıldı',               ip:'10.0.0.73'    },
  { id:12, timestamp:'07:30:00', date:'14.05.2026', user:'sistem',         role:'ADMIN',    action:'USER_DEACTIVATED', detail:'Emre Çetin pasif edildi',           ip:'—'            },
  { id:13, timestamp:'23:55:10', date:'13.05.2026', user:'Mehmet Kaya',   role:'AGENT',    action:'LOGOUT',           detail:'Oturum kapatıldı',                 ip:'10.0.0.55'    },
  { id:14, timestamp:'22:10:05', date:'13.05.2026', user:'Fatma Çelik',   role:'CUSTOMER', action:'TICKET_CREATED',   detail:'TKT-2030 açıldı',                  ip:'78.45.12.200' },
  { id:15, timestamp:'18:00:00', date:'13.05.2026', user:'Elif Tosun',    role:'ADMIN',    action:'USER_UPDATED',     detail:'Ayşe Demir e-posta güncellendi',    ip:'192.168.1.10' },
  { id:16, timestamp:'17:45:33', date:'13.05.2026', user:'Ahmet Yılmaz', role:'MANAGER',  action:'REPORT_EXPORTED',  detail:'Haftalık SLA Raporu',              ip:'10.0.0.42'    },
  { id:17, timestamp:'16:30:22', date:'13.05.2026', user:'Selin Doğan',   role:'AGENT',    action:'TICKET_ASSIGNED',  detail:'TKT-2029 → Selin Doğan',           ip:'10.0.0.80'    },
  { id:18, timestamp:'14:20:11', date:'13.05.2026', user:'Burak Yıldız',  role:'CUSTOMER', action:'LOGIN',            detail:'Başarılı giriş',                    ip:'88.12.44.100' },
  { id:19, timestamp:'11:05:50', date:'13.05.2026', user:'Elif Tosun',    role:'ADMIN',    action:'CATEGORY_DELETED', detail:'Kategori: "Eski Sistem" silindi',   ip:'192.168.1.10' },
  { id:20, timestamp:'09:00:00', date:'13.05.2026', user:'sistem',         role:'ADMIN',    action:'PASSWORD_RESET',   detail:'Burak Yıldız şifre sıfırlandı',    ip:'—'            },
];

const UNIQUE_USERS   = [...new Set(MOCK_LOGS.map(l => l.user))].sort();
const UNIQUE_ACTIONS = [...new Set(MOCK_LOGS.map(l => l.action))] as ActionType[];

function Sidebar() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { logout } = useAuth();
  return (
    <aside className="w-56 bg-white border-r border-gray-100 flex flex-col shrink-0 h-screen sticky top-0">
      <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-100">
        <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">T</span>
        </div>
        <div>
          <p className="text-[11px] font-bold text-gray-800 leading-none">Toyota ITSM</p>
          <p className="text-[9px] text-red-600 font-medium">Admin Panel</p>
        </div>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
          const active = location.pathname === href;
          return (
            <button key={href} onClick={() => navigate(href)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${active ? 'bg-red-50 text-red-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}`}>
              <Icon size={14} className={active ? 'text-red-600' : 'text-gray-400'} />
              <span className="text-xs">{label}</span>
            </button>
          );
        })}
      </nav>
      <div className="px-2 py-3 border-t border-gray-100">
        <button onClick={logout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
          <LogOut size={14} /><span className="text-xs">Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );
}

export default function AdminAuditLogPage() {
  const { user } = useAuth();
  const [search,       setSearch]       = useState('');
  const [filterUser,   setFilterUser]   = useState('ALL');
  const [filterAction, setFilterAction] = useState<ActionType | 'ALL'>('ALL');
  const [filterDate,   setFilterDate]   = useState('ALL');

  const DATE_OPTIONS = [
    { label: 'Tüm Tarihler', value: 'ALL' },
    { label: '14.05.2026',   value: '14.05.2026' },
    { label: '13.05.2026',   value: '13.05.2026' },
  ];

  const filtered = useMemo(() => MOCK_LOGS.filter(log => {
    const matchSearch = search === '' ||
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.detail.toLowerCase().includes(search.toLowerCase()) ||
      log.ip.toLowerCase().includes(search.toLowerCase());
    const matchUser   = filterUser   === 'ALL' || log.user   === filterUser;
    const matchAction = filterAction === 'ALL' || log.action === filterAction;
    const matchDate   = filterDate   === 'ALL' || log.date   === filterDate;
    return matchSearch && matchUser && matchAction && matchDate;
  }), [search, filterUser, filterAction, filterDate]);

  const hasFilters = search || filterUser !== 'ALL' || filterAction !== 'ALL' || filterDate !== 'ALL';

  function clearFilters() {
    setSearch(''); setFilterUser('ALL'); setFilterAction('ALL'); setFilterDate('ALL');
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-sm font-bold text-gray-800">Audit Log</h1>
            <p className="text-[10px] text-gray-400">{filtered.length} / {MOCK_LOGS.length} kayıt</p>
          </div>
          <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-white text-[10px] font-bold">
            {user?.username?.[0]?.toUpperCase() ?? 'A'}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Filters */}
          <div className="bg-white border border-gray-100 rounded-lg px-4 py-2.5 flex items-center gap-3 flex-wrap">
            <Filter size={12} className="text-gray-400 shrink-0" />
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Kullanıcı, detay, IP..."
                className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-red-400"/>
            </div>
            <select value={filterDate} onChange={e => setFilterDate(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-red-400 text-gray-600">
              {DATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={filterUser} onChange={e => setFilterUser(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-red-400 text-gray-600">
              <option value="ALL">Tüm Kullanıcılar</option>
              {UNIQUE_USERS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <select value={filterAction} onChange={e => setFilterAction(e.target.value as ActionType | 'ALL')}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-red-400 text-gray-600">
              <option value="ALL">Tüm İşlemler</option>
              {UNIQUE_ACTIONS.map(a => (
                <option key={a} value={a}>{ACTION_META[a].label}</option>
              ))}
            </select>
            {hasFilters && (
              <button onClick={clearFilters}
                className="text-[10px] text-gray-400 hover:text-red-500 flex items-center gap-1">
                <X size={11}/> Temizle
              </button>
            )}
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 w-36">Zaman</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400">Kullanıcı</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400">Rol</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400">İşlem</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400">Detay</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400">IP Adresi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(log => {
                  const meta = ACTION_META[log.action];
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2.5 text-gray-400 font-mono whitespace-nowrap">
                        <span className="text-gray-600">{log.timestamp}</span>
                        <span className="block text-[9px] text-gray-300">{log.date}</span>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-gray-700">{log.user}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${ROLE_COLOR[log.role] ?? 'bg-gray-100 text-gray-500'}`}>
                          {log.role}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${meta.color}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 max-w-[200px] truncate">{log.detail}</td>
                      <td className="px-4 py-2.5 text-gray-400 font-mono">{log.ip}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-xs text-gray-400">
                      Filtrelerle eşleşen log bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
