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
  Eye,
  BookMarked,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Article {
  id: string;
  title: string;
  category: string;
  summary: string;
  views: number;
  publishedAt: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_ARTICLES: Article[] = [
  { id: 'kb-001', title: 'VPN Bağlantısı Nasıl Kurulur?',                category: 'Ağ',         summary: 'FortiClient ile kurumsal VPN bağlantısı kurma adımları ve sık karşılaşılan sorunların çözümleri.',      views: 1842, publishedAt: '3 Mar 2026' },
  { id: 'kb-002', title: 'SAP Oturumu Açılmıyor — Çözüm Rehberi',       category: 'Yazılım',    summary: 'SAP GUI bağlantı hatalarının giderilmesi, lisans sorunları ve alternatif erişim yöntemleri.',             views: 1237, publishedAt: '18 Şub 2026' },
  { id: 'kb-003', title: 'Outlook Şifre Sıfırlama Adımları',             category: 'Erişim',     summary: 'Şirket e-posta hesabı şifresini self-servis portal üzerinden nasıl sıfırlayabilirsiniz.',                views:  984, publishedAt: '10 Şub 2026' },
  { id: 'kb-004', title: 'Uzak Masaüstü (RDP) Bağlantısı Kurma',        category: 'Ağ',         summary: 'Ofis dışından Windows Uzak Masaüstü ile bilgisayarınıza güvenli bağlantı kurmanın yolu.',                views:  876, publishedAt: '5 Şub 2026' },
  { id: 'kb-005', title: 'Yazıcı Sürücüsü Kurulum Rehberi',              category: 'Donanım',    summary: 'Ağ yazıcılarını Windows ve macOS üzerinde kurma, test baskısı alma ve sorun giderme.',                   views:  753, publishedAt: '28 Oca 2026' },
  { id: 'kb-006', title: 'Microsoft Teams Toplantı Sorunları',           category: 'Yazılım',    summary: 'Ses, video ve ekran paylaşımı sorunlarını çözmek için adım adım rehber.',                                views:  691, publishedAt: '20 Oca 2026' },
  { id: 'kb-007', title: 'Yeni Kullanıcı Hesabı Açma Talebi',           category: 'Erişim',     summary: 'IT sistemleri için yeni hesap talebini nasıl oluşturacağınız ve onay süreci hakkında bilgiler.',          views:  542, publishedAt: '15 Oca 2026' },
  { id: 'kb-008', title: 'Antivirüs Yazılımı Kurulum ve Güncelleme',    category: 'Güvenlik',   summary: 'Şirket antivirüs çözümünün kurulumu, güncelleme ayarları ve tarama zamanlaması.',                         views:  488, publishedAt: '10 Oca 2026' },
  { id: 'kb-009', title: 'Disk Şifreleme (BitLocker) Aktifleştirme',    category: 'Güvenlik',   summary: 'Kurumsal veri güvenliği kapsamında dizüstü bilgisayarlarda BitLocker şifrelemesini açma rehberi.',        views:  421, publishedAt: '5 Oca 2026' },
  { id: 'kb-010', title: 'E-posta İmza Şablonu Nasıl Ayarlanır?',       category: 'Yazılım',    summary: 'Kurumsal e-posta imzanızı Outlook\'ta oluşturma ve yönetme adımları.',                                    views:  387, publishedAt: '28 Ara 2025' },
  { id: 'kb-011', title: 'Mobil Cihaz Şirket Wi-Fi Bağlantısı',         category: 'Ağ',         summary: 'Akıllı telefon ve tablet ile kurumsal kablosuz ağa bağlanma ve sertifika kurulumu.',                      views:  344, publishedAt: '20 Ara 2025' },
  { id: 'kb-012', title: 'OneDrive Senkronizasyon Sorunları',            category: 'Yazılım',    summary: 'OneDrive dosya senkronizasyon hatalarını gidermek için kontrol listesi ve çözüm adımları.',               views:  312, publishedAt: '15 Ara 2025' },
];

const ALL_CATEGORIES = ['Tümü', ...Array.from(new Set(MOCK_ARTICLES.map((a) => a.category)))];

const CATEGORY_COLOR: Record<string, string> = {
  Ağ:       'bg-blue-50 text-blue-700',
  Yazılım:  'bg-purple-50 text-purple-700',
  Erişim:   'bg-indigo-50 text-indigo-700',
  Donanım:  'bg-amber-50 text-amber-700',
  Güvenlik: 'bg-green-50 text-green-700',
};

// ── Nav ───────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',    href: '/customer/dashboard' },
  { icon: Ticket,          label: 'Ticketlarım',  href: '/customer/tickets' },
  { icon: PlusCircle,      label: 'Yeni Ticket',  href: '/customer/tickets/new' },
  { icon: BookOpen,        label: 'Bilgi Bankası', href: '/customer/knowledge-base' },
  { icon: Bell,            label: 'Bildirimler',   href: '#' },
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
          const active = href !== '#' && (
            href === '/customer/tickets'
              ? location.pathname.startsWith('/customer/tickets')
              : location.pathname.startsWith(href)
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

export default function KnowledgeBaseListPage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ''}`.trim()
    : (user?.username ?? 'Kullanıcı');

  const [articles,  setArticles]  = useState<Article[]>(MOCK_ARTICLES);
  const [loading,   setLoading]   = useState(true);
  const [fetchErr,  setFetchErr]  = useState(false);

  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('Tümü');

  // Fetch articles
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    axios
      .get<Article[]>('http://localhost:8083/api/knowledge-base', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => { if (!cancelled) { setArticles(res.data); setFetchErr(false); } })
      .catch(() => { if (!cancelled) { setArticles(MOCK_ARTICLES); setFetchErr(true); } })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [token]);

  // Search with debounced backend call (falls back to client-side)
  useEffect(() => {
    if (!search.trim()) return;
    const timer = setTimeout(() => {
      axios
        .get<Article[]>(`http://localhost:8083/api/knowledge-base/search?q=${encodeURIComponent(search)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setArticles(res.data))
        .catch(() => { /* use client-side filter */ });
    }, 400);
    return () => clearTimeout(timer);
  }, [search, token]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return articles.filter((a) => {
      const matchSearch   = !q || a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q);
      const matchCategory = category === 'Tümü' || a.category === category;
      return matchSearch && matchCategory;
    });
  }, [articles, search, category]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar displayName={displayName} email={user?.email} logout={logout} />

      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">Bilgi Bankası</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {loading ? 'Yükleniyor...' : `${filtered.length} makale`}
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
                <p className="text-[10px] text-gray-400 mt-0.5">Müşteri</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-4">

          {/* Search + category bar */}
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Makale ara..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCategory('Tümü'); }}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 outline-none focus:border-[#EB0A1E] focus:ring-2 focus:ring-[#EB0A1E]/10 focus:bg-white transition"
              />
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                    category === cat
                      ? 'text-white border-transparent'
                      : 'text-gray-500 bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                  style={category === cat ? { background: '#EB0A1E', borderColor: '#EB0A1E' } : {}}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Article grid */}
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-gray-400 text-xs">
              <RefreshCw size={15} className="animate-spin" />
              Makaleler yükleniyor...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <BookMarked size={32} className="text-gray-200" />
              <p className="text-sm font-medium text-gray-400">Makale bulunamadı</p>
              <p className="text-[10px] text-gray-300">Farklı bir arama terimi veya kategori deneyin</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filtered.map((article) => (
                <div
                  key={article.id}
                  className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-3 hover:shadow-sm hover:border-gray-200 transition-all cursor-pointer group"
                  onClick={() => navigate(`/customer/knowledge-base/${article.id}`)}
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-xs font-bold text-gray-900 leading-snug group-hover:text-[#EB0A1E] transition-colors flex-1">
                      {article.title}
                    </h2>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${CATEGORY_COLOR[article.category] ?? 'bg-gray-100 text-gray-600'}`}>
                      {article.category}
                    </span>
                  </div>

                  {/* Summary */}
                  <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">
                    {article.summary}
                  </p>

                  {/* Card footer */}
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                    <div className="flex items-center gap-3 text-[10px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <Eye size={11} />
                        {article.views.toLocaleString('tr-TR')}
                      </span>
                      <span>{article.publishedAt}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/customer/knowledge-base/${article.id}`); }}
                      className="px-2.5 py-1 text-[10px] font-semibold rounded-lg border border-gray-200 text-gray-600 hover:border-[#EB0A1E] hover:text-[#EB0A1E] transition-all"
                    >
                      Oku →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
