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
  UserPlus,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

// ── Types ─────────────────────────────────────────────────────────────────────

interface QueueTicket {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  customerName: string;
  slaMinutesLeft: number | null;
  createdAt: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_QUEUE: QueueTicket[] = [
  { id: 'TKT-1050', subject: 'Exchange sunucusuna bağlanılamıyor',      category: 'Yazılım', priority: 'CRITICAL', status: 'Açık', customerName: 'Deniz Kara',      slaMinutesLeft: 28,   createdAt: '14 May 2026' },
  { id: 'TKT-1049', subject: 'Şirket telefonu ses sorunu',              category: 'Donanım', priority: 'MEDIUM',   status: 'Açık', customerName: 'Pelin Avcı',      slaMinutesLeft: 245,  createdAt: '14 May 2026' },
  { id: 'TKT-1048', subject: 'İki faktörlü doğrulama kodu gelmiyor',   category: 'Erişim',  priority: 'HIGH',     status: 'Açık', customerName: 'Serkan Yıldırım', slaMinutesLeft: 75,   createdAt: '13 May 2026' },
  { id: 'TKT-1047', subject: 'Kurumsal mobil uygulama açılmıyor',      category: 'Yazılım', priority: 'MEDIUM',   status: 'Açık', customerName: 'Gül Tekin',       slaMinutesLeft: 400,  createdAt: '13 May 2026' },
  { id: 'TKT-1046', subject: 'Ağ paylaşım klasörüne erişilemiyor',     category: 'Ağ',      priority: 'HIGH',     status: 'Açık', customerName: 'Barış Polat',     slaMinutesLeft: 105,  createdAt: '13 May 2026' },
  { id: 'TKT-1045', subject: 'Windows güncelleme döngüsüne girdi',     category: 'Yazılım', priority: 'HIGH',     status: 'Açık', customerName: 'Naz Yılmaz',      slaMinutesLeft: -12,  createdAt: '12 May 2026' },
  { id: 'TKT-1044', subject: 'USB depolama cihazı tanınmıyor',         category: 'Donanım', priority: 'LOW',      status: 'Açık', customerName: 'Cem Bulut',       slaMinutesLeft: null, createdAt: '12 May 2026' },
  { id: 'TKT-1043', subject: 'Departman e-posta listesi güncelleme',   category: 'Erişim',  priority: 'LOW',      status: 'Açık', customerName: 'İrem Doğan',      slaMinutesLeft: 720,  createdAt: '11 May 2026' },
];

// ── Style helpers ─────────────────────────────────────────────────────────────

const PRIORITY_STYLE: Record<string, { label: string; cls: string }> = {
  LOW:      { label: 'Düşük',  cls: 'bg-green-50 text-green-700' },
  MEDIUM:   { label: 'Orta',   cls: 'bg-amber-50 text-amber-700' },
  HIGH:     { label: 'Yüksek', cls: 'bg-orange-50 text-orange-700' },
  CRITICAL: { label: 'Kritik', cls: 'bg-red-50 text-red-700' },
};

const CATEGORY_COLOR: Record<string, string> = {
  Ağ:       'bg-blue-50 text-blue-700',
  Yazılım:  'bg-purple-50 text-purple-700',
  Erişim:   'bg-indigo-50 text-indigo-700',
  Donanım:  'bg-amber-50 text-amber-700',
};

function slaLabel(min: number | null): { text: string; cls: string } {
  if (min === null) return { text: '—',                                  cls: 'text-gray-400' };
  if (min < 0)      return { text: `${Math.abs(min)}d ihlal`,           cls: 'text-red-600 font-semibold' };
  if (min < 60)     return { text: `${min}d kaldı`,                     cls: 'text-red-500 font-semibold' };
  if (min < 120)    return { text: `${Math.floor(min/60)}s ${min%60}d`, cls: 'text-amber-600 font-semibold' };
  return { text: `${Math.floor(min/60)}s ${min%60}d`,                   cls: 'text-green-600' };
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AgentQueuePage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ''}`.trim()
    : (user?.username ?? 'Agent');

  const [queue,         setQueue]         = useState<QueueTicket[]>(MOCK_QUEUE);
  const [loading,       setLoading]       = useState(true);
  const [fetchErr,      setFetchErr]      = useState(false);
  const [claimingId,    setClaimingId]    = useState<string | null>(null);
  const [,             setClaimedIds]    = useState<Set<string>>(new Set());
  const [search,        setSearch]        = useState('');
  const [priorityFilter,setPriorityFilter]= useState('Tümü');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    axios
      .get<QueueTicket[]>('http://localhost:8083/api/tickets', {
        params: { assignee: 'none', status: 'Açık' },
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => { if (!cancelled) { setQueue(res.data); setFetchErr(false); } })
      .catch(() => { if (!cancelled) { setQueue(MOCK_QUEUE); setFetchErr(true); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  async function claimTicket(id: string) {
    setClaimingId(id);
    try {
      await axios.put(
        `http://localhost:8083/api/tickets/${id}/claim`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      // optimistic — remove from queue regardless
    } finally {
      setClaimedIds((prev) => new Set(prev).add(id));
      setQueue((prev) => prev.filter((t) => t.id !== id));
      setClaimingId(null);
      // Navigate to the claimed ticket after a brief moment
      setTimeout(() => navigate(`/agent/tickets/${id}`), 600);
    }
  }

  const PRIORITY_FILTERS = ['Tümü', 'Düşük', 'Orta', 'Yüksek', 'Kritik'];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return queue
      .filter((t) => {
        const pLabel = PRIORITY_STYLE[t.priority]?.label ?? t.priority;
        return (
          (!q || t.id.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q) || t.customerName.toLowerCase().includes(q)) &&
          (priorityFilter === 'Tümü' || pLabel === priorityFilter)
        );
      })
      // sort: SLA breached/critical first, then by slaMinutesLeft ascending
      .sort((a, b) => {
        const aMin = a.slaMinutesLeft ?? 9999;
        const bMin = b.slaMinutesLeft ?? 9999;
        return aMin - bMin;
      });
  }, [queue, search, priorityFilter]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar displayName={displayName} email={user?.email} logout={logout} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">Ticket Havuzu</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {loading ? 'Yükleniyor...' : `${filtered.length} atanmamış ticket`}
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
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type="text" placeholder="Ticket no, konu veya müşteri ara..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 outline-none focus:border-[#EB0A1E] focus:ring-2 focus:ring-[#EB0A1E]/10 focus:bg-white transition"
              />
            </div>
            <div className="flex items-center gap-1">
              {PRIORITY_FILTERS.map((f) => (
                <button key={f} onClick={() => setPriorityFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${priorityFilter === f ? 'text-white border-transparent' : 'text-gray-500 bg-gray-50 border-gray-200 hover:border-gray-300'}`}
                  style={priorityFilter === f ? { background: '#EB0A1E', borderColor: '#EB0A1E' } : {}}
                >{f}</button>
              ))}
            </div>
          </div>

          {/* Queue table */}
          <div className="bg-white rounded-xl border border-gray-100">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-gray-400 text-xs">
                <RefreshCw size={14} className="animate-spin" />Yükleniyor...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <CheckCircle2 size={30} className="text-green-200" />
                <p className="text-sm font-medium text-gray-400">Havuz boş</p>
                <p className="text-[10px] text-gray-300">
                  {search || priorityFilter !== 'Tümü'
                    ? 'Filtrelerinizi değiştirin'
                    : 'Atanmamış ticket bulunmuyor'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-50">
                      {['Ticket No', 'Müşteri', 'Konu', 'Kategori', 'Öncelik', 'SLA', 'Tarih', 'İşlem'].map((col) => (
                        <th key={col} className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((t) => {
                      const p   = PRIORITY_STYLE[t.priority] ?? { label: t.priority, cls: 'bg-gray-100 text-gray-600' };
                      const cat = CATEGORY_COLOR[t.category]  ?? 'bg-gray-100 text-gray-600';
                      const sla = slaLabel(t.slaMinutesLeft);
                      const isClaiming = claimingId === t.id;
                      const isBreached = (t.slaMinutesLeft ?? 0) < 0;
                      return (
                        <tr key={t.id}
                          className={`transition-colors ${isBreached ? 'bg-red-50/30 hover:bg-red-50/60' : 'hover:bg-gray-50/60'}`}
                        >
                          <td className="px-4 py-3 font-mono text-[10px] text-gray-400 whitespace-nowrap">{t.id}</td>
                          <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">{t.customerName}</td>
                          <td className="px-4 py-3 font-medium text-gray-800 max-w-[190px] truncate">{t.subject}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${cat}`}>{t.category}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${p.cls}`}>{p.label}</span>
                          </td>
                          <td className={`px-4 py-3 whitespace-nowrap text-[10px] ${sla.cls}`}>
                            <span className="flex items-center gap-1"><Clock size={11} />{sla.text}</span>
                          </td>
                          <td className="px-4 py-3 text-[10px] text-gray-400 whitespace-nowrap">{t.createdAt}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() => claimTicket(t.id)}
                              disabled={isClaiming}
                              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white border-transparent"
                              style={{ background: '#EB0A1E' }}
                              onMouseEnter={e => { if (!isClaiming) (e.currentTarget as HTMLButtonElement).style.background = '#a50015'; }}
                              onMouseLeave={e => { if (!isClaiming) (e.currentTarget as HTMLButtonElement).style.background = '#EB0A1E'; }}
                            >
                              {isClaiming
                                ? <RefreshCw size={11} className="animate-spin" />
                                : <UserPlus size={11} />
                              }
                              {isClaiming ? 'Üstleniliyor...' : 'Üstlen'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer count */}
            {!loading && filtered.length > 0 && (
              <div className="px-4 py-2.5 border-t border-gray-50">
                <p className="text-[10px] text-gray-400">{filtered.length} ticket gösteriliyor</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
