import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Tag, ClipboardList, Bell, LogOut,
  Activity, CheckCircle2, AlertTriangle, XCircle, ServerCrash,
  Database, Mail, Workflow, Cpu, TrendingUp, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',          href: '/admin/dashboard' },
  { icon: Users,           label: 'Kullanıcı Yönetimi', href: '/admin/users' },
  { icon: Tag,             label: 'Kategori Yönetimi',  href: '/admin/categories' },
  { icon: ClipboardList,   label: 'Audit Log',          href: '/admin/audit' },
  { icon: Bell,            label: 'Bildirimler',        href: '/admin/notifications' },
];

type ServiceStatus = 'up' | 'degraded' | 'down';

interface Service {
  name: string;
  icon: React.ElementType;
  status: ServiceStatus;
  latency: string;
}

interface UserAction {
  id: number;
  user: string;
  role: string;
  action: string;
  date: string;
  ip: string;
}

interface AuditLog {
  id: number;
  actor: string;
  event: string;
  target: string;
  time: string;
  severity: 'info' | 'warn' | 'error';
}

const MOCK_SERVICES: Service[] = [
  { name: 'Backend API',  icon: Cpu,        status: 'up',       latency: '42 ms' },
  { name: 'Keycloak',    icon: ShieldCheck, status: 'up',       latency: '61 ms' },
  { name: 'PostgreSQL',  icon: Database,    status: 'up',       latency: '8 ms'  },
  { name: 'MailHog',     icon: Mail,        status: 'degraded', latency: '210 ms'},
  { name: 'jBPM',        icon: Workflow,    status: 'down',     latency: '—'     },
];

const MOCK_USER_ACTIONS: UserAction[] = [
  { id:1, user:'Elif Tosun',      role:'ADMIN',   action:'Kullanıcı oluşturdu',   date:'14.05.2026 09:12', ip:'192.168.1.10' },
  { id:2, user:'Ahmet Yılmaz',   role:'MANAGER', action:'Rapor dışa aktardı',    date:'14.05.2026 09:05', ip:'10.0.0.42'    },
  { id:3, user:'Mehmet Kaya',    role:'AGENT',   action:'Ticket üstlendi',        date:'14.05.2026 08:58', ip:'10.0.0.55'    },
  { id:4, user:'Ayşe Demir',     role:'AGENT',   action:'Yorum ekledi',           date:'14.05.2026 08:47', ip:'10.0.0.61'    },
  { id:5, user:'Elif Tosun',      role:'ADMIN',   action:'Kategori düzenledi',    date:'14.05.2026 08:30', ip:'192.168.1.10' },
  { id:6, user:'Fatma Çelik',    role:'CUSTOMER',action:'Ticket açtı',            date:'14.05.2026 08:18', ip:'78.45.12.200' },
  { id:7, user:'Hasan Şahin',    role:'MANAGER', action:'SLA politikası güncelledi',date:'14.05.2026 08:05',ip:'10.0.0.42' },
  { id:8, user:'Zeynep Arslan',  role:'AGENT',   action:'Ticket çözdü',           date:'14.05.2026 07:52', ip:'10.0.0.73'    },
];

const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id:1, actor:'sistem',       event:'Servis yeniden başlatıldı', target:'jBPM',         time:'09:14', severity:'error' },
  { id:2, actor:'Elif Tosun',   event:'Rol atandı',                target:'H. Şahin → MANAGER', time:'08:55', severity:'info'  },
  { id:3, actor:'sistem',       event:'MailHog gecikmesi arttı',   target:'SMTP',         time:'08:30', severity:'warn'  },
  { id:4, actor:'Elif Tosun',   event:'Kullanıcı oluşturuldu',     target:'Z. Arslan',    time:'08:10', severity:'info'  },
  { id:5, actor:'sistem',       event:'DB yedekleme tamamlandı',   target:'PostgreSQL',   time:'07:00', severity:'info'  },
  { id:6, actor:'Ahmet Yılmaz', event:'Rapor indirildi',           target:'Mayıs Raporu', time:'06:45', severity:'info'  },
];

const ROLE_DIST = [
  { role: 'Admin',    count: 2,  color: 'bg-red-500' },
  { role: 'Manager',  count: 5,  color: 'bg-orange-400' },
  { role: 'Agent',    count: 18, color: 'bg-blue-500' },
  { role: 'Customer', count: 134,color: 'bg-green-500' },
];

function statusBadge(status: ServiceStatus) {
  if (status === 'up')
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
        <CheckCircle2 size={10} /> Çalışıyor
      </span>
    );
  if (status === 'degraded')
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
        <AlertTriangle size={10} /> Yavaş
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-[10px] font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
      <XCircle size={10} /> Çevrimdışı
    </span>
  );
}

function severityDot(s: AuditLog['severity']) {
  if (s === 'error') return <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />;
  if (s === 'warn')  return <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />;
  return <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />;
}

function roleBadge(role: string) {
  const map: Record<string, string> = {
    ADMIN:    'bg-red-100 text-red-700',
    MANAGER:  'bg-orange-100 text-orange-700',
    AGENT:    'bg-blue-100 text-blue-700',
    CUSTOMER: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${map[role] ?? 'bg-gray-100 text-gray-600'}`}>
      {role}
    </span>
  );
}

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
            <button
              key={href}
              onClick={() => navigate(href)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                active
                  ? 'bg-red-50 text-red-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <Icon size={14} className={active ? 'text-red-600' : 'text-gray-400'} />
              <span className="text-xs">{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-2 py-3 border-t border-gray-100">
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={14} />
          <span className="text-xs">Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();

  const [stats] = useState({
    totalUsers:   159,
    activeTickets: 73,
    systemHealth:  87,
    todayActions: 312,
  });

  const [services]    = useState<Service[]>(MOCK_SERVICES);
  const [userActions] = useState<UserAction[]>(MOCK_USER_ACTIONS);
  const [auditLogs]   = useState<AuditLog[]>(MOCK_AUDIT_LOGS);

  const totalRoles = ROLE_DIST.reduce((s, r) => s + r.count, 0);

  useEffect(() => {
    // Future: fetch /api/admin/stats, /api/admin/services, /api/admin/audit
  }, []);

  const healthColor =
    stats.systemHealth >= 90 ? 'text-green-600' :
    stats.systemHealth >= 70 ? 'text-amber-600' : 'text-red-600';

  const STAT_CARDS = [
    { label: 'Toplam Kullanıcı',      value: stats.totalUsers,   icon: Users,       color: 'bg-blue-50 text-blue-600',   border: 'border-blue-200' },
    { label: 'Aktif Ticket',          value: stats.activeTickets,icon: Activity,    color: 'bg-orange-50 text-orange-600',border: 'border-orange-200' },
    { label: 'Sistem Sağlığı',        value: `${stats.systemHealth}%`, icon: ServerCrash, color: `bg-white ${healthColor}`, border: 'border-gray-200' },
    { label: 'Bugünkü İşlem Sayısı',  value: stats.todayActions, icon: TrendingUp,  color: 'bg-green-50 text-green-600', border: 'border-green-200' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-sm font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-[10px] text-gray-400">Sistem durumu ve kullanıcı yönetimine genel bakış</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-white text-[10px] font-bold">
              {user?.username?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold text-gray-700">{user?.username ?? 'Admin'}</p>
              <p className="text-[9px] text-red-600 font-medium">ADMIN</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Stat Cards */}
          <div className="grid grid-cols-4 gap-3">
            {STAT_CARDS.map(({ label, value, icon: Icon, color, border }) => (
              <div key={label} className={`bg-white border ${border} rounded-lg p-3 flex items-center gap-3`}>
                <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center shrink-0`}>
                  <Icon size={15} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">{label}</p>
                  <p className={`text-base font-bold ${color.includes('text-') ? color.split(' ').find(c => c.startsWith('text-')) : 'text-gray-800'}`}>
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Two-column layout */}
          <div className="flex gap-3">
            {/* LEFT 2/3 */}
            <div className="flex-1 space-y-3 min-w-0">
              {/* Sistem Durumu */}
              <div className="bg-white border border-gray-100 rounded-lg">
                <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
                  <Activity size={13} className="text-red-600" />
                  <h2 className="text-xs font-semibold text-gray-700">Sistem Durumu</h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {services.map(({ name, icon: Icon, status, latency }) => (
                    <div key={name} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Icon size={13} className="text-gray-400" />
                        <span className="text-xs text-gray-700 font-medium">{name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-gray-400">{latency}</span>
                        {statusBadge(status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Son Kullanıcı İşlemleri */}
              <div className="bg-white border border-gray-100 rounded-lg">
                <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
                  <Users size={13} className="text-red-600" />
                  <h2 className="text-xs font-semibold text-gray-700">Son Kullanıcı İşlemleri</h2>
                </div>
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400">Kullanıcı</th>
                      <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400">Rol</th>
                      <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400">İşlem</th>
                      <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400">Tarih</th>
                      <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {userActions.map(row => (
                      <tr key={row.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2 font-medium text-gray-700">{row.user}</td>
                        <td className="px-4 py-2">{roleBadge(row.role)}</td>
                        <td className="px-4 py-2 text-gray-600">{row.action}</td>
                        <td className="px-4 py-2 text-gray-400 whitespace-nowrap">{row.date}</td>
                        <td className="px-4 py-2 text-gray-400 font-mono">{row.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT 1/3 */}
            <div className="w-64 shrink-0 space-y-3">
              {/* Rol Dağılımı */}
              <div className="bg-white border border-gray-100 rounded-lg">
                <div className="px-3 py-2.5 border-b border-gray-100 flex items-center gap-2">
                  <TrendingUp size={13} className="text-red-600" />
                  <h2 className="text-xs font-semibold text-gray-700">Hızlı İstatistikler</h2>
                </div>
                <div className="px-3 py-2.5 space-y-2.5">
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Rol Dağılımı</p>
                  {ROLE_DIST.map(({ role, count, color }) => (
                    <div key={role}>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-[11px] text-gray-600">{role}</span>
                        <span className="text-[11px] font-semibold text-gray-700">{count}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`${color} h-1.5 rounded-full`}
                          style={{ width: `${(count / totalRoles) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="pt-1 border-t border-gray-50 flex justify-between">
                    <span className="text-[10px] text-gray-400">Toplam</span>
                    <span className="text-[11px] font-bold text-gray-700">{totalRoles}</span>
                  </div>
                </div>
              </div>

              {/* Son Audit Logları */}
              <div className="bg-white border border-gray-100 rounded-lg">
                <div className="px-3 py-2.5 border-b border-gray-100 flex items-center gap-2">
                  <ClipboardList size={13} className="text-red-600" />
                  <h2 className="text-xs font-semibold text-gray-700">Son Audit Logları</h2>
                </div>
                <div className="px-3 py-2.5 space-y-2.5">
                  {auditLogs.map(log => (
                    <div key={log.id} className="flex gap-2">
                      {severityDot(log.severity)}
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium text-gray-700 leading-tight truncate">{log.event}</p>
                        <p className="text-[9px] text-gray-400 truncate">
                          {log.actor} · {log.target}
                        </p>
                        <p className="text-[9px] text-gray-300">{log.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
