import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  BookOpen,
  Bell,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Eye,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  BookMarked,
  Calendar,
  User,
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ArticleDetail {
  id: string;
  title: string;
  category: string;
  author: string;
  publishedAt: string;
  views: number;
  content: string;
}

interface RelatedArticle {
  id: string;
  title: string;
  category: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_DETAIL: ArticleDetail = {
  id: 'kb-001',
  title: 'VPN Bağlantısı Nasıl Kurulur?',
  category: 'Ağ',
  author: 'IT Altyapı Ekibi',
  publishedAt: '3 Mar 2026',
  views: 1842,
  content: `## Gereksinimler

FortiClient VPN istemcisini kurmadan önce aşağıdakilerin hazır olduğundan emin olun:

- Aktif şirket kullanıcı hesabı (e-posta ve şifre)
- IT departmanından size iletilmiş VPN lisans kodu
- Windows 10/11 veya macOS 12+ işletim sistemi

---

## Kurulum Adımları

### 1. FortiClient İndirme

IT self-servis portalından kurumunuza özel FortiClient paketini indirin. Genel dağıtım kanallarından indirilen sürümler kurumsal sertifikalarla çalışmayabilir.

### 2. Kurulum Sihirbazını Çalıştırma

İndirilen kurulum dosyasını yönetici olarak çalıştırın. "VPN Only" seçeneğini tercih edin — tam Endpoint Security paketi yönetici onayı gerektirir.

### 3. VPN Profili Ekleme

Kurulum tamamlandıktan sonra:

1. FortiClient'i açın
2. **Remote Access** sekmesine tıklayın
3. **+ Yeni Bağlantı** butonuna tıklayın
4. Aşağıdaki bilgileri girin:
   - **Bağlantı Adı:** Toyota Corporate VPN
   - **Sunucu:** vpn.toyota-tr.com
   - **Port:** 443
5. **Kaydet** butonuna tıklayın

### 4. İlk Bağlantı

Kullanıcı adınız (şirket e-postanızın ön kısmı) ve şifrenizle giriş yapın. İlk bağlantıda SSL sertifikasını onaylamanız istenecektir — **Güven** seçeneğini seçin.

---

## Sık Karşılaşılan Sorunlar

**Bağlantı zaman aşımına uğrıyor:**
Güvenlik duvarı portlarının açık olup olmadığını kontrol edin. Kurumsal ağdaysanız VPN bağlantısı gerekmez.

**Kimlik doğrulama hatası:**
Active Directory şifrenizin güncel olduğundan emin olun. Şifreyi self-servis portaldan sıfırlayabilirsiniz.

**Bağlantı kurulup hemen kopuyor:**
FortiClient'i kaldırıp 7.2.x veya üzeri sürümü yeniden kurun.

---

## Destek

Bu adımlar sorununuzu çözmediyse IT Service Desk'e ticket açın ve "VPN" kategorisini seçin.`,
};

const MOCK_RELATED: RelatedArticle[] = [
  { id: 'kb-004', title: 'Uzak Masaüstü (RDP) Bağlantısı Kurma',  category: 'Ağ' },
  { id: 'kb-011', title: 'Mobil Cihaz Şirket Wi-Fi Bağlantısı',   category: 'Ağ' },
  { id: 'kb-008', title: 'Antivirüs Yazılımı Kurulum ve Güncelleme', category: 'Güvenlik' },
];

// ── Style maps ────────────────────────────────────────────────────────────────

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

// ── Markdown-like renderer (simple) ──────────────────────────────────────────

function ArticleContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      elements.push(<h2 key={key++} className="text-sm font-bold text-gray-900 mt-5 mb-2 first:mt-0">{line.slice(3)}</h2>);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={key++} className="text-xs font-bold text-gray-800 mt-4 mb-1.5">{line.slice(4)}</h3>);
    } else if (line.startsWith('---')) {
      elements.push(<hr key={key++} className="border-gray-100 my-4" />);
    } else if (line.startsWith('- ') || line.startsWith('1. ') || /^\d+\. /.test(line)) {
      const isOrdered = /^\d+\. /.test(line);
      const text = line.replace(/^(-|\d+\.)\s+/, '');
      elements.push(
        <div key={key++} className="flex gap-2 text-xs text-gray-700 leading-relaxed mb-1">
          <span className="shrink-0 text-gray-400 mt-0.5">{isOrdered ? line.match(/^\d+/)?.[0] + '.' : '•'}</span>
          <span dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
        </div>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={key++} className="h-1" />);
    } else {
      elements.push(
        <p
          key={key++}
          className="text-xs text-gray-700 leading-relaxed mb-1"
          dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }}
        />
      );
    }
  }

  return <div>{elements}</div>;
}

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

export default function KnowledgeBaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ''}`.trim()
    : (user?.username ?? 'Kullanıcı');

  const [article,  setArticle]  = useState<ArticleDetail | null>(null);
  const [related]              = useState<RelatedArticle[]>(MOCK_RELATED);
  const [loading,  setLoading]  = useState(true);

  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setFeedback(null);
    setFeedbackSent(false);

    axios
      .get<ArticleDetail>(`http://localhost:8083/api/knowledge-base/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => { if (!cancelled) setArticle(res.data); })
      .catch(() => { if (!cancelled) setArticle({ ...MOCK_DETAIL, id: id ?? MOCK_DETAIL.id }); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [id, token]);

  function handleFeedback(vote: 'up' | 'down') {
    if (feedbackSent) return;
    setFeedback(vote);
    setFeedbackSent(true);
    axios
      .post(
        `http://localhost:8083/api/knowledge-base/${id}/feedback`,
        { helpful: vote === 'up' },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .catch(() => { /* silently ignore */ });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar displayName={displayName} email={user?.email} logout={logout} />
        <div className="flex-1 flex items-center justify-center gap-2 text-gray-400 text-xs">
          <RefreshCw size={15} className="animate-spin" />
          Yükleniyor...
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar displayName={displayName} email={user?.email} logout={logout} />
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-400">
          <BookMarked size={32} className="text-gray-200" />
          <p className="text-sm font-medium">Makale bulunamadı</p>
          <button onClick={() => navigate('/customer/knowledge-base')} className="mt-1 text-xs font-semibold" style={{ color: '#EB0A1E' }}>
            ← Bilgi Bankasına dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar displayName={displayName} email={user?.email} logout={logout} />

      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/customer/knowledge-base')}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition shrink-0"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900 truncate">{article.title}</h1>
              <p className="text-[10px] text-gray-400 mt-0.5">Bilgi Bankası</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
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

        {/* Two-column content */}
        <main className="flex-1 p-6">
          <div className="flex gap-5 items-start">

            {/* ── LEFT: Article ───────────────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-4">

              {/* Article card */}
              <div className="bg-white rounded-xl border border-gray-100 px-6 py-5">

                {/* Meta */}
                <div className="flex items-start gap-3 flex-wrap mb-4 pb-4 border-b border-gray-50">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-bold text-gray-900 leading-snug mb-2">{article.title}</h2>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${CATEGORY_COLOR[article.category] ?? 'bg-gray-100 text-gray-600'}`}>
                        {article.category}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-gray-400">
                        <User size={10} />
                        {article.author}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-gray-400">
                        <Calendar size={10} />
                        {article.publishedAt}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-gray-400">
                        <Eye size={10} />
                        {article.views.toLocaleString('tr-TR')} görüntülenme
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <ArticleContent content={article.content} />
              </div>

              {/* Feedback card */}
              <div className="bg-white rounded-xl border border-gray-100 px-5 py-4">
                <p className="text-xs font-semibold text-gray-700 mb-3">Bu makale faydalı oldu mu?</p>
                {feedbackSent ? (
                  <div className="flex items-center gap-2 text-xs text-green-700">
                    <span className="text-base">{feedback === 'up' ? '👍' : '👎'}</span>
                    Geri bildiriminiz için teşekkürler!
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleFeedback('up')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-700 hover:bg-green-50 transition-all"
                    >
                      <ThumbsUp size={13} />
                      Evet, faydalı oldu
                    </button>
                    <button
                      onClick={() => handleFeedback('down')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all"
                    >
                      <ThumbsDown size={13} />
                      Hayır, yardımcı olmadı
                    </button>
                    <span className="text-[10px] text-gray-400 ml-1">
                      Sorununuz devam ediyorsa{' '}
                      <button
                        onClick={() => navigate('/customer/tickets/new')}
                        className="font-semibold hover:underline"
                        style={{ color: '#EB0A1E' }}
                      >
                        ticket açın
                      </button>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT: Related articles ──────────────────────────── */}
            <div className="w-64 shrink-0 space-y-4">

              <div className="bg-white rounded-xl border border-gray-100 px-4 py-4">
                <h3 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                  <BookMarked size={13} className="text-gray-400" />
                  İlgili Makaleler
                </h3>
                {related.length === 0 ? (
                  <p className="text-[10px] text-gray-400">İlgili makale yok.</p>
                ) : (
                  <ul className="space-y-2">
                    {related.map((r) => (
                      <li key={r.id}>
                        <button
                          onClick={() => navigate(`/customer/knowledge-base/${r.id}`)}
                          className="w-full text-left px-3 py-2.5 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all group"
                        >
                          <p className="text-[11px] font-medium text-gray-800 leading-snug group-hover:text-[#EB0A1E] transition-colors">
                            {r.title}
                          </p>
                          <span className={`inline-flex mt-1.5 items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${CATEGORY_COLOR[r.category] ?? 'bg-gray-100 text-gray-600'}`}>
                            {r.category}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Quick action */}
              <div className="bg-white rounded-xl border border-gray-100 px-4 py-4">
                <h3 className="text-xs font-bold text-gray-700 mb-2">Yardım Bulamadınız mı?</h3>
                <p className="text-[10px] text-gray-500 leading-relaxed mb-3">
                  IT destek ekibimiz sorununuzu çözmek için hazır.
                </p>
                <button
                  onClick={() => navigate('/customer/tickets/new')}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white rounded-lg transition-all"
                  style={{ background: '#EB0A1E' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#a50015')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#EB0A1E')}
                >
                  <Ticket size={13} />
                  Ticket Aç
                </button>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
