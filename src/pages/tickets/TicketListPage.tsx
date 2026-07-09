import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  BookOpen,
  Bell,
  LogOut,
  ChevronRight,
  Search,
  ChevronLeft,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TicketItem {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  date: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',    href: '/customer/dashboard' },
  { icon: Ticket,          label: 'Ticketlarım',  href: '/customer/tickets' },
  { icon: PlusCircle,      label: 'Yeni Ticket',  href: '/customer/tickets/new' },
  { icon: BookOpen,        label: 'Bilgi Bankası', href: '#' },
  { icon: Bell,            label: 'Bildirimler',   href: '#' },
];

const STATUS_FILTERS  = ['Tümü', 'Açık', 'Bekleyen', 'Çözüldü', 'Kapalı'];
const PRIORITY_FILTERS = ['Tümü', 'Düşük', 'Orta', 'Yüksek', 'Kritik'];
const PAGE_SIZE = 10;

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

const MOCK_TICKETS: TicketItem[] = [
  { id: 'TKT-1042', subject: 'VPN bağlantısı sürekli kopuyor',         category: 'Ağ',      priority: 'HIGH',     status: 'Açık',     date: '12 May 2026' },
  { id: 'TKT-1041', subject: 'SAP oturumu açılmıyor',                  category: 'Yazılım', priority: 'CRITICAL', status: 'Bekleyen', date: '12 May 2026' },
  { id: 'TKT-1040', subject: 'Yazıcı sürücüsü kurulumu',               category: 'Donanım', priority: 'LOW',      status: 'Açık',     date: '11 May 2026' },
  { id: 'TKT-1039', subject: 'Outlook e-posta gönderilemiyor',         category: 'Yazılım', priority: 'HIGH',     status: 'Bekleyen', date: '11 May 2026' },
  { id: 'TKT-1038', subject: 'Teams toplantı bağlantısı çalışmıyor',  category: 'Yazılım', priority: 'MEDIUM',   status: 'Çözüldü',  date: '10 May 2026' },
  { id: 'TKT-1037', subject: 'Şirket Wi-Fi şifresi sıfırlama',        category: 'Ağ',      priority: 'LOW',      status: 'Çözüldü',  date: '10 May 2026' },
  { id: 'TKT-1036', subject: 'Active Directory erişim talebi',         category: 'Erişim',  priority: 'MEDIUM',   status: 'Açık',     date: '9 May 2026'  },
  { id: 'TKT-1035', subject: 'Outlook şifresi sıfırlama',              category: 'Erişim',  priority: 'LOW',      status: 'Çözüldü',  date: '8 May 2026'  },
  { id: 'TKT-1034', subject: 'Laptop ekran parlaklığı sorunu',         category: 'Donanım', priority: 'LOW',      status: 'Kapalı',   date: '7 May 2026'  },
  { id: 'TKT-1033', subject: 'ERP modülü hata veriyor (kod: 0x4F2)',   category: 'Yazılım', priority: 'CRITICAL', status: 'Çözüldü',  date: '6 May 2026'  },
  { id: 'TKT-1032', subject: 'Yazıcıdan renkli baskı çıkmıyor',       category: 'Donanım', priority: 'LOW',      status: 'Kapalı',   date: '5 May 2026'  },
  { id: 'TKT-1031', subject: 'Uzak masaüstü bağlantı hatası',         category: 'Ağ',      priority: 'HIGH',     status: 'Çözüldü',  date: '4 May 2026'  },
  { id: 'TKT-1030', subject: 'Yeni kullanıcı hesabı açılması',        category: 'Erişim',  priority: 'MEDIUM',   status: 'Kapalı',   date: '3 May 2026'  },
  { id: 'TKT-1029', subject: 'Antivirüs lisansı yenileme',             category: 'Yazılım', priority: 'MEDIUM',   status: 'Kapalı',   date: '2 May 2026'  },
  { id: 'TKT-1028', subject: 'SAP erişim talebi — üretim ortamı',     category: 'Erişim',  priority: 'HIGH',     status: 'Kapalı',   date: '1 May 2026'  },
];

// ── Sidebar (shared) ──────────────────────────────────────────────────────────

function Sidebar({
  displayName,
  email,
  logout,
}: {
  displayName: string;
  email?: string;
  logout: () => void;
}) {
  const navigate  = useNavigate();
  const location  = useLocation();

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

export default function TicketListPage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ''}`.trim()
    : (user?.username ?? 'Kullanıcı');

  // Data
  const [tickets,  setTickets]  = useState<TicketItem[]>(MOCK_TICKETS);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState(false);

  // Filters
  const [search,          setSearch]          = useState('');
  const [statusFilter,    setStatusFilter]    = useState('Tümü');
  const [priorityFilter,  setPriorityFilter]  = useState('Tümü');
  const [page,            setPage]            = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    axios
      .get<TicketItem[]>('http://localhost:8083/api/tickets/my', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (!cancelled) { setTickets(res.data); setFetchErr(false); }
      })
      .catch(() => {
        if (!cancelled) { setTickets(MOCK_TICKETS); setFetchErr(true); }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [token]);

  // Filtered + paginated
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tickets.filter((t) => {
      const statusLabel  = STATUS_STYLE[t.status]?.label  ?? t.status;
      const priorityLabel = PRIORITY_STYLE[t.priority]?.label ?? t.priority;

      const matchSearch   = !q || t.id.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q);
      const matchStatus   = statusFilter   === 'Tümü' || statusLabel   === statusFilter;
      const matchPriority = priorityFilter === 'Tümü' || priorityLabel === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage    = Math.min(page, totalPages);
  const paginated   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function handleFilterChange(setter: (v: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar displayName={displayName} email={user?.email} logout={logout} />

      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">Ticketlarım</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {loading ? 'Yükleniyor...' : `${filtered.length} kayıt`}
              {fetchErr && <span className="ml-2 text-amber-500">· Demo verisi gösteriliyor</span>}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/customer/tickets/new')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-all"
              style={{ background: '#EB0A1E' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#a50015')}
              onMouseLeave={e => (e.currentTarget.style.background = '#EB0A1E')}
            >
              <PlusCircle size={13} />
              Yeni Ticket
            </button>

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

        {/* Content */}
        <main className="flex-1 p-6 space-y-4">

          {/* Filter bar */}
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex flex-wrap items-center gap-3">

            {/* Search */}
            <div className="relative flex-1 min-w-40">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Ticket no veya konu ara..."
                value={search}
                onChange={(e) => handleFilterChange(setSearch, e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 outline-none focus:border-[#EB0A1E] focus:ring-2 focus:ring-[#EB0A1E]/10 focus:bg-white transition"
              />
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleFilterChange(setStatusFilter, s)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                    statusFilter === s
                      ? 'text-white border-transparent'
                      : 'text-gray-500 bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                  style={statusFilter === s ? { background: '#EB0A1E', borderColor: '#EB0A1E' } : {}}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Priority filter */}
            <div className="flex items-center gap-1">
              {PRIORITY_FILTERS.map((p) => (
                <button
                  key={p}
                  onClick={() => handleFilterChange(setPriorityFilter, p)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                    priorityFilter === p
                      ? 'text-white border-transparent'
                      : 'text-gray-500 bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                  style={priorityFilter === p ? { background: '#EB0A1E', borderColor: '#EB0A1E' } : {}}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-100">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-gray-400 text-xs">
                <RefreshCw size={15} className="animate-spin" />
                Ticketlar yükleniyor...
              </div>
            ) : paginated.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Ticket size={32} className="text-gray-200" />
                <p className="text-sm font-medium text-gray-400">Ticket bulunamadı</p>
                <p className="text-[10px] text-gray-300">Filtrelerinizi değiştirin veya yeni ticket oluşturun</p>
                <button
                  onClick={() => navigate('/customer/tickets/new')}
                  className="mt-2 px-3 py-1.5 text-xs font-semibold text-white rounded-lg"
                  style={{ background: '#EB0A1E' }}
                >
                  Yeni Ticket Oluştur
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-50">
                        {['Ticket No', 'Konu', 'Kategori', 'Öncelik', 'Durum', 'Tarih', 'İşlem'].map((col) => (
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
                      {paginated.map((ticket) => {
                        const p = PRIORITY_STYLE[ticket.priority] ?? { label: ticket.priority, cls: 'bg-gray-100 text-gray-600' };
                        const s = STATUS_STYLE[ticket.status]     ?? { label: ticket.status,   cls: 'bg-gray-100 text-gray-600' };
                        return (
                          <tr
                            key={ticket.id}
                            className="hover:bg-gray-50/60 transition-colors"
                          >
                            <td className="px-4 py-3 font-mono text-[10px] text-gray-400 whitespace-nowrap">
                              {ticket.id}
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">
                              {ticket.subject}
                            </td>
                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                              {ticket.category}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${p.cls}`}>
                                {p.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${s.cls}`}>
                                {s.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[10px] text-gray-400 whitespace-nowrap">
                              {ticket.date}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <button
                                onClick={() => navigate(`/customer/tickets/${ticket.id}`)}
                                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded-lg border border-gray-200 text-gray-600 hover:border-[#EB0A1E] hover:text-[#EB0A1E] transition-all"
                              >
                                <ExternalLink size={11} />
                                Detay
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-4 py-2.5 border-t border-gray-50 flex items-center justify-between">
                  <p className="text-[10px] text-gray-400">
                    {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} / {filtered.length} kayıt
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft size={12} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                      .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                        if (idx > 0 && (arr[idx - 1] as number) + 1 < p) acc.push('…');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((item, idx) =>
                        item === '…' ? (
                          <span key={`dots-${idx}`} className="w-6 h-6 flex items-center justify-center text-[10px] text-gray-300">…</span>
                        ) : (
                          <button
                            key={item}
                            onClick={() => setPage(item as number)}
                            className={`w-6 h-6 rounded text-[10px] font-medium transition ${
                              safePage === item ? 'text-white' : 'text-gray-500 hover:bg-gray-100'
                            }`}
                            style={safePage === item ? { background: '#EB0A1E' } : {}}
                          >
                            {item}
                          </button>
                        )
                      )}

                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
                      className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
