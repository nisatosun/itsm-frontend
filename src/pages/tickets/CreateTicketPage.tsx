import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
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
  Upload,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

// ── Constants ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',     href: '/customer/dashboard' },
  { icon: Ticket,          label: 'Ticketlarım',   href: '/customer/tickets' },
  { icon: PlusCircle,      label: 'Yeni Ticket',   href: '/customer/tickets/new' },
  { icon: BookOpen,        label: 'Bilgi Bankası',  href: '#' },
  { icon: Bell,            label: 'Bildirimler',    href: '#' },
];

const CATEGORIES = ['Yazılım', 'Donanım', 'Ağ', 'Erişim', 'Diğer'];

const PRIORITIES: { label: string; value: string; color: string; bg: string; border: string }[] = [
  { label: 'Düşük',   value: 'LOW',      color: '#16A34A', bg: '#F0FDF4', border: '#86EFAC' },
  { label: 'Orta',    value: 'MEDIUM',   color: '#D97706', bg: '#FFFBEB', border: '#FCD34D' },
  { label: 'Yüksek',  value: 'HIGH',     color: '#EA580C', bg: '#FFF7ED', border: '#FDBA74' },
  { label: 'Kritik',  value: 'CRITICAL', color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5' },
];

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain', 'application/octet-stream'];
const ALLOWED_EXTS  = ['.pdf', '.jpg', '.jpeg', '.png', '.txt', '.log'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isAllowed(file: File) {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  return ALLOWED_EXTS.includes(ext) || ALLOWED_TYPES.includes(file.type);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreateTicketPage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Form state
  const [subject,     setSubject]     = useState('');
  const [category,    setCategory]    = useState('');
  const [priority,    setPriority]    = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [files,       setFiles]       = useState<File[]>([]);
  const [dragOver,    setDragOver]    = useState(false);

  // UI state
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [success,   setSuccess]   = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ''}`.trim()
    : (user?.username ?? 'Kullanıcı');

  // ── File handling ────────────────────────────────────────────────────────

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    setFileError(null);
    const next: File[] = [];
    const rejected: string[] = [];

    Array.from(incoming).forEach((f) => {
      if (!isAllowed(f))               rejected.push(`${f.name}: geçersiz tür`);
      else if (f.size > MAX_FILE_SIZE) rejected.push(`${f.name}: 10 MB sınırı aşıldı`);
      else if (files.some((x) => x.name === f.name)) rejected.push(`${f.name}: zaten eklendi`);
      else next.push(f);
    });

    if (rejected.length) setFileError(rejected.join(' · '));
    setFiles((prev) => [...prev, ...next]);
  }

  function removeFile(name: string) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }

  // ── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (description.trim().length < 20) {
      setError('Açıklama en az 20 karakter olmalıdır.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('subject',     subject.trim());
      formData.append('category',    category || 'Diğer');
      formData.append('priority',    priority);
      formData.append('description', description.trim());
      files.forEach((f) => formData.append('attachments', f));

      await axios.post('http://localhost:8083/api/tickets', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(true);
      setTimeout(() => navigate('/customer/tickets'), 1500);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Ticket gönderilemedi. Lütfen tekrar deneyin.');
      } else {
        setError('Beklenmeyen bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
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

        {/* Nav */}
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

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">Yeni Ticket</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">Destek talebinizi oluşturun</p>
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

        {/* Content */}
        <main className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">

            {/* Success banner */}
            {success && (
              <div className="mb-4 flex items-center gap-2.5 px-4 py-2.5 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs">
                <CheckCircle2 size={15} className="shrink-0" />
                Ticket başarıyla oluşturuldu! Yönlendiriliyorsunuz...
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="mb-4 flex items-start gap-2.5 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* Form card */}
            <form onSubmit={handleSubmit}>
              <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">

                {/* ── Konu ── */}
                <div className="px-5 py-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Konu <span style={{ color: '#EB0A1E' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Sorununuzu kısaca özetleyin"
                    required
                    maxLength={120}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB0A1E] focus:ring-2 focus:ring-[#EB0A1E]/10 focus:bg-white"
                  />
                  <p className="mt-1 text-[10px] text-gray-400 text-right">{subject.length}/120</p>
                </div>

                {/* ── Kategori + Öncelik ── */}
                <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Kategori */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Kategori
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-700 outline-none transition focus:border-[#EB0A1E] focus:ring-2 focus:ring-[#EB0A1E]/10 focus:bg-white appearance-none cursor-pointer"
                    >
                      <option value="">Kategori seçin</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Öncelik */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Öncelik
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PRIORITIES.map((p) => {
                        const selected = priority === p.value;
                        return (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => setPriority(p.value)}
                            className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all"
                            style={{
                              background:  selected ? p.bg     : '#F9FAFB',
                              color:       selected ? p.color  : '#6B7280',
                              borderColor: selected ? p.border : '#E5E7EB',
                              boxShadow:   selected ? `0 0 0 2px ${p.border}` : 'none',
                            }}
                          >
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ── Açıklama ── */}
                <div className="px-5 py-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Açıklama <span style={{ color: '#EB0A1E' }}>*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Sorunu detaylı açıklayın. Ne zaman başladı, hangi adımları denediniz?"
                    required
                    rows={4}
                    className="w-full px-3 py-2.5 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB0A1E] focus:ring-2 focus:ring-[#EB0A1E]/10 focus:bg-white resize-none"
                  />
                  <div className="mt-1 flex items-center justify-between">
                    {description.length > 0 && description.length < 20
                      ? <p className="text-[10px]" style={{ color: '#EB0A1E' }}>En az 20 karakter gerekli</p>
                      : <span />
                    }
                    <p className="text-[10px] text-gray-400 ml-auto">{description.length} karakter</p>
                  </div>
                </div>

                {/* ── Dosya Ekle ── */}
                <div className="px-5 py-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Dosya Ekle
                    <span className="ml-2 text-[10px] font-normal text-gray-400">
                      pdf, jpg, png, txt, log · maks. 10 MB
                    </span>
                  </label>

                  {/* Drop zone */}
                  <div
                    onDragOver={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-1.5 px-5 py-6 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
                      dragOver
                        ? 'border-[#EB0A1E] bg-red-50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <Upload size={18} className={dragOver ? 'text-[#EB0A1E]' : 'text-gray-400'} />
                    <p className="text-xs text-gray-500">
                      Dosyaları buraya sürükleyin veya{' '}
                      <span className="font-medium" style={{ color: '#EB0A1E' }}>dosya seçin</span>
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.txt,.log"
                      className="hidden"
                      onChange={(e: ChangeEvent<HTMLInputElement>) => addFiles(e.target.files)}
                    />
                  </div>

                  {/* File error */}
                  {fileError && (
                    <p className="mt-1.5 text-[10px] flex items-center gap-1" style={{ color: '#EB0A1E' }}>
                      <AlertCircle size={11} />
                      {fileError}
                    </p>
                  )}

                  {/* File list */}
                  {files.length > 0 && (
                    <ul className="mt-2.5 flex flex-col gap-1.5">
                      {files.map((f) => (
                        <li
                          key={f.name}
                          className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100"
                        >
                          <FileText size={13} className="text-gray-400 shrink-0" />
                          <span className="flex-1 text-xs text-gray-700 truncate">{f.name}</span>
                          <span className="text-[10px] text-gray-400 shrink-0">{formatBytes(f.size)}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(f.name)}
                            className="text-gray-400 hover:text-red-500 transition"
                          >
                            <X size={13} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* ── Actions ── */}
                <div className="px-5 py-3 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => navigate('/customer/dashboard')}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={loading || success}
                    className="px-5 py-2 text-xs font-semibold text-white rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{ background: '#EB0A1E' }}
                    onMouseEnter={e => { if (!loading && !success) (e.currentTarget as HTMLButtonElement).style.background = '#a50015'; }}
                    onMouseLeave={e => { if (!loading && !success) (e.currentTarget as HTMLButtonElement).style.background = '#EB0A1E'; }}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        Gönderiliyor...
                      </>
                    ) : (
                      'Gönder'
                    )}
                  </button>
                </div>

              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
