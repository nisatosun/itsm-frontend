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
  Search,
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
  slaMinutesLeft: number | null;
  createdAt: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_TICKETS: AgentTicket[] = [
  { id: 'TKT-1042', subject: 'VPN bağlantısı sürekli kopuyor',        priority: 'HIGH',     status: 'Bekleyen', customerName: 'Elif Nisatosun', slaMinutesLeft: 92,   createdAt: '12 May 2026' },
  { id: 'TKT-1041', subject: 'SAP oturumu açılmıyor',                 priority: 'CRITICAL', status: 'Açık',     customerName: 'Ahmet Kaya',     slaMinutesLeft: 35,   createdAt: '12 May 2026' },
  { id: 'TKT-1040', subject: 'Yazıcı sürücüsü kurulumu',              priority: 'LOW',      status: 'Açık',     customerName: 'Selin Demir',    slaMinutesLeft: 480,  createdAt: '11 May 2026' },
  { id: 'TKT-1039', subject: 'Outlook e-posta gönderilemiyor',        priority: 'HIGH',     status: 'Bekleyen', customerName: 'Murat Yıldız',   slaMinutesLeft: 18,   createdAt: '11 May 2026' },
  { id: 'TKT-1036', subject: 'Active Directory erişim talebi',        priority: 'MEDIUM',   status: 'Açık',     customerName: 'Ayşe Çelik',     slaMinutesLeft: 320,  createdAt: '9 May 2026'  },
  { id: 'TKT-1034', subject: 'Laptop ekran parlaklığı sorunu',        priority: 'LOW',      status: 'Açık',     customerName: 'Burak Arslan',   slaMinutesLeft: null, createdAt: '7 May 2026'  },
  { id: 'TKT-1033', subject: 'ERP modülü hata veriyor (kod: 0x4F2)',  priority: 'CRITICAL', status: 'Bekleyen', customerName: 'Zeynep Koç',     slaMinutesLeft: -45,  createdAt: '6 May 2026'  },
  { id: 'TKT-1031', subject: 'Uzak masaüstü bağlantı hatası',        priority: 'HIGH',     status: 'Açık',     customerName: 'Emre Şahin',     slaMinutesLeft: 210,  createdAt: '4 May 2026'  },
  { id: 'TKT-1030', subject: 'Yeni kullanıcı hesabı açılması',       priority: 'MEDIUM',   status: 'Açık',     customerName: 'Fatma Öztürk',   slaMinutesLeft: 600,  createdAt: '3 May 2026'  },
  { id: 'TKT-1029', subject: 'Antivirüs lisansı yenileme',            priority: 'MEDIUM',   status: 'Bekleyen', customerName: 'Can Aydın',      slaMinutesLeft: 55,   createdAt: '2 May 2026'  },
  { id: 'TKT-1027', subject: 'Wi-Fi bağlantı kesintisi — 3. kat',    priority: 'HIGH',     status: 'Açık',     customerName: 'Hande Güler',    slaMinutesLeft: 110,  createdAt: '1 May 2026'  },
  { id: 'TKT-1025', subject: 'Teams ses sorunu toplantılarda',        priority: 'MEDIUM',   status: 'Çözüldü',  customerName: 'Tolga Erdoğan',  slaMinutesLeft: null, createdAt: '30 Nis 2026' },
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

function slaLabel(min: number | null): { text: string; cls: string } {
  if (min === null) return { text: '—',                              cls: 'text-gray-400' };
  if (min < 0)      return { text: `${Math.abs(min)}d ihlal`,       cls: 'text-red-600 font-semibold' };
  if (min < 60)     return { text: `${min}d kaldı`,                 cls: 'text-red-500 font-semibold' };
  if (min < 120)    return { text: `${Math.floor(min/60)}s ${min%60}d`, cls: 'text-amber-600 font-semibold' };
  return { text: `${Math.floor(min/60)}s ${min%60}d`,               cls: 'text-green-600' };
}

function slaFilterMatch(min: number | null, f: string) {
  if (f === 'Tümü')    return true;
  if (f === 'İhlal')   return min !== null && min < 0;
  if (f === 'Kritik')  return min !== null && min >= 0 && min < 60;
  if (f === 'Yaklaşan')return min !== null && min >= 60 && min < 120;
  if (f === 'Güvende') return min === null || min >= 120;
  return true;
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

// ── Filter constants ──────────────────────────────────────────────────────────

const STATUS_FILTERS   = ['Tümü', 'Açık', 'Bekleyen', 'Çözüldü', 'Kapalı'];
const PRIORITY_FILTERS = ['Tümü', 'Düşük', 'Orta', 'Yüksek', 'Kritik'];
const SLA_FILTERS      = ['Tümü', 'İhlal', 'Kritik', 'Yaklaşan', 'Güvende'];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AgentTicketListPage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ''}`.trim()
    : (user?.username ?? 'Agent');

  const [tickets,  setTickets]  = useState<AgentTicket[]>(MOCK_TICKETS);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState(false);

  const [search,          setSearch]          = useState('');
  const [statusFilter,    setStatusFilter]    = useState('Tümü');
  const [priorityFilter,  setPriorityFilter]  = useState('Tümü');
  const [slaFilter,       setSlaFilter]       = useState('Tümü');

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

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tickets.filter((t) => {
      const pLabel = PRIORITY_STYLE[t.priority]?.label ?? t.priority;
      const sLabel = STATUS_STYLE[t.status]?.label     ?? t.status;
      return (
        (!q || t.id.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q) || t.customerName.toLowerCase().includes(q)) &&
        (statusFilter   === 'Tümü' || sLabel === statusFilter) &&
        (priorityFilter === 'Tümü' || pLabel === priorityFilter) &&
        slaFilterMatch(t.slaMinutesLeft, slaFilter)
      );
    });
  }, [tickets, search, statusFilter, priorityFilter, slaFilter]);

  function FilterPills({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {options.map((o) => (
          <button key={o} onClick={() => onChange(o)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${value === o ? 'text-white border-transparent' : 'text-gray-500 bg-gray-50 border-gray-200 hover:border-gray-300'}`}
            style={value === o ? { background: '#EB0A1E', borderColor: '#EB0A1E' } : {}}
          >{o}</button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar displayName={displayName} email={user?.email} logout={logout} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">Atanmış Ticketlar</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {loading ? 'Yükleniyor...' : `${filtered.length} kayıt`}
              {fetchErr && <span className="ml-2 text-amber-500">· Demo verisi</span>}
            </p>
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
                <p className="text-[10px] text-gray-400 mt-0.5">Agent</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-4">
          {/* Filter bar */}
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 space-y-2.5">
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type="text" placeholder="Ticket no, konu veya müşteri ara..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 outline-none focus:border-[#EB0A1E] focus:ring-2 focus:ring-[#EB0A1E]/10 focus:bg-white transition"
              />
            </div>
            {/* Filter rows */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 font-medium shrink-0">Durum</span>
                <FilterPills options={STATUS_FILTERS} value={statusFilter} onChange={(v) => { setStatusFilter(v); }} />
              </div>
              <div className="w-px bg-gray-100 self-stretch" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 font-medium shrink-0">Öncelik</span>
                <FilterPills options={PRIORITY_FILTERS} value={priorityFilter} onChange={(v) => { setPriorityFilter(v); }} />
              </div>
              <div className="w-px bg-gray-100 self-stretch" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 font-medium shrink-0">SLA</span>
                <FilterPills options={SLA_FILTERS} value={slaFilter} onChange={(v) => { setSlaFilter(v); }} />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-100">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-gray-400 text-xs">
                <RefreshCw size={14} className="animate-spin" />Yükleniyor...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Ticket size={30} className="text-gray-200" />
                <p className="text-sm font-medium text-gray-400">Ticket bulunamadı</p>
                <p className="text-[10px] text-gray-300">Filtrelerinizi değiştirin</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-50">
                      {['Ticket No', 'Müşteri', 'Konu', 'Öncelik', 'Durum', 'SLA', 'Tarih', 'İşlem'].map((col) => (
                        <th key={col} className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((t) => {
                      const p   = PRIORITY_STYLE[t.priority] ?? { label: t.priority, cls: 'bg-gray-100 text-gray-600' };
                      const s   = STATUS_STYLE[t.status]     ?? { label: t.status,   cls: 'bg-gray-100 text-gray-600' };
                      const sla = slaLabel(t.slaMinutesLeft);
                      return (
                        <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-4 py-3 font-mono text-[10px] text-gray-400 whitespace-nowrap">{t.id}</td>
                          <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">{t.customerName}</td>
                          <td className="px-4 py-3 font-medium text-gray-800 max-w-[200px] truncate">{t.subject}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${p.cls}`}>{p.label}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${s.cls}`}>{s.label}</span>
                          </td>
                          <td className={`px-4 py-3 whitespace-nowrap text-[10px] ${sla.cls}`}>
                            <span className="flex items-center gap-1"><Clock size={11} />{sla.text}</span>
                          </td>
                          <td className="px-4 py-3 text-[10px] text-gray-400 whitespace-nowrap">{t.createdAt}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button onClick={() => navigate(`/agent/tickets/${t.id}`)}
                              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded-lg border border-gray-200 text-gray-600 hover:border-[#EB0A1E] hover:text-[#EB0A1E] transition-all"
                            >
                              <ExternalLink size={11} />İşle
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
        </main>
      </div>
    </div>
  );
}
