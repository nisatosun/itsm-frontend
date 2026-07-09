import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard, Ticket, BarChart2, ShieldAlert, Bell, LogOut,
  ChevronRight, ShieldCheck, AlertTriangle, TrendingUp,
  Pencil, X, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SLAPolicy {
  id: string;
  priority: string;
  resolutionHours: number;
  responseMinutes: number;
  activeTickets: number;
  complianceRate: number;
}

interface ViolationRecord {
  ticketId: string;
  customerName: string;
  priority: string;
  targetHours: number;
  actualHours: number;
  exceededMinutes: number;
  date: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const INIT_POLICIES: SLAPolicy[] = [
  { id: 'sla-critical', priority: 'Kritik', resolutionHours: 4,  responseMinutes: 30,  activeTickets: 9,  complianceRate: 78 },
  { id: 'sla-high',     priority: 'Yüksek', resolutionHours: 8,  responseMinutes: 60,  activeTickets: 24, complianceRate: 91 },
  { id: 'sla-medium',   priority: 'Orta',   resolutionHours: 24, responseMinutes: 240, activeTickets: 41, complianceRate: 96 },
  { id: 'sla-low',      priority: 'Düşük',  resolutionHours: 72, responseMinutes: 480, activeTickets: 18, complianceRate: 100 },
];

const VIOLATIONS: ViolationRecord[] = [
  { ticketId: 'TKT-1033', customerName: 'Zeynep Koç',      priority: 'Kritik', targetHours: 4,  actualHours: 4.75, exceededMinutes: 45,  date: '6 May 2026'  },
  { ticketId: 'TKT-1045', customerName: 'Naz Yılmaz',      priority: 'Yüksek', targetHours: 8,  actualHours: 8.2,  exceededMinutes: 12,  date: '12 May 2026' },
  { ticketId: 'TKT-1051', customerName: 'Kaan Demir',      priority: 'Kritik', targetHours: 4,  actualHours: 5.3,  exceededMinutes: 78,  date: '14 May 2026' },
  { ticketId: 'TKT-1022', customerName: 'Banu Arslan',     priority: 'Yüksek', targetHours: 8,  actualHours: 9.1,  exceededMinutes: 66,  date: '2 May 2026'  },
  { ticketId: 'TKT-1017', customerName: 'Ozan Kaya',       priority: 'Orta',   targetHours: 24, actualHours: 26.5, exceededMinutes: 150, date: '28 Nis 2026' },
  { ticketId: 'TKT-1008', customerName: 'Funda Çetin',     priority: 'Kritik', targetHours: 4,  actualHours: 4.4,  exceededMinutes: 24,  date: '21 Nis 2026' },
  { ticketId: 'TKT-0994', customerName: 'Serhat Yıldız',   priority: 'Yüksek', targetHours: 8,  actualHours: 8.9,  exceededMinutes: 54,  date: '15 Nis 2026' },
  { ticketId: 'TKT-0981', customerName: 'Tuğba Şahin',     priority: 'Orta',   targetHours: 24, actualHours: 27,   exceededMinutes: 180, date: '8 Nis 2026'  },
];

// ── Style helpers ─────────────────────────────────────────────────────────────

const PRIORITY_COLOR: Record<string, { dot: string; badge: string }> = {
  Kritik: { dot: '#DC2626', badge: 'bg-red-50 text-red-700' },
  Yüksek: { dot: '#EA580C', badge: 'bg-orange-50 text-orange-700' },
  Orta:   { dot: '#D97706', badge: 'bg-amber-50 text-amber-700' },
  Düşük:  { dot: '#16A34A', badge: 'bg-green-50 text-green-700' },
};

function complianceColor(rate: number) {
  if (rate >= 95) return '#16A34A';
  if (rate >= 80) return '#D97706';
  return '#DC2626';
}

function fmtMinutes(m: number) {
  if (m < 60) return `${m} dk`;
  return `${m / 60}s`;
}

// ── Nav / Sidebar ─────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',     href: '/manager/dashboard' },
  { icon: Ticket,          label: 'Tüm Ticketlar', href: '/manager/tickets' },
  { icon: BarChart2,       label: 'Raporlar',       href: '/manager/reports' },
  { icon: ShieldAlert,     label: 'SLA Yönetimi',   href: '/manager/sla' },
  { icon: Bell,            label: 'Bildirimler',    href: '/manager/notifications' },
];

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
          <p className="text-red-200 text-[10px] truncate">{email ?? 'Manager'}</p>
        </div>
        <button onClick={logout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-red-100 hover:bg-white/10 hover:text-white transition-all">
          <LogOut size={15} />Çıkış Yap
        </button>
      </div>
    </aside>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({
  policy,
  onClose,
  onSave,
}: {
  policy: SLAPolicy;
  onClose: () => void;
  onSave: (id: string, resolutionHours: number, responseMinutes: number) => Promise<void>;
}) {
  const [resHours, setResHours] = useState(policy.resolutionHours);
  const [resMin,   setResMin]   = useState(policy.responseMinutes);
  const [saving,   setSaving]   = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (resHours < 1 || resMin < 1) return;
    setSaving(true);
    await onSave(policy.id, resHours, resMin);
    setSaving(false);
  }

  const col = PRIORITY_COLOR[policy.priority] ?? { dot: '#6B7280', badge: 'bg-gray-100 text-gray-600' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-sm mx-4">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900">SLA Politikası Düzenle</h2>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: col.dot }} />
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${col.badge}`}>{policy.priority}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSave} className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Hedef Çözüm Süresi
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number" min={1} max={720} value={resHours}
                  onChange={e => setResHours(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-[#EB0A1E] focus:ring-2 focus:ring-[#EB0A1E]/10 focus:bg-white transition"
                />
                <span className="text-[10px] text-gray-400 shrink-0">saat</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Hedef Yanıt Süresi
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number" min={1} max={1440} value={resMin}
                  onChange={e => setResMin(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-[#EB0A1E] focus:ring-2 focus:ring-[#EB0A1E]/10 focus:bg-white transition"
                />
                <span className="text-[10px] text-gray-400 shrink-0">dk</span>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100 text-[10px] text-gray-500 space-y-1">
            <p><span className="font-semibold text-gray-700">Çözüm:</span> {resHours} saat ({resHours * 60} dakika)</p>
            <p><span className="font-semibold text-gray-700">Yanıt:</span> {resMin < 60 ? `${resMin} dakika` : `${(resMin / 60).toFixed(1)} saat`}</p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >İptal</button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg transition-all disabled:opacity-50"
              style={{ background: '#EB0A1E' }}
              onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLButtonElement).style.background = '#a50015'; }}
              onMouseLeave={e => { if (!saving) (e.currentTarget as HTMLButtonElement).style.background = '#EB0A1E'; }}
            >
              {saving ? <RefreshCw size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ManagerSLAPage() {
  const { user, token, logout } = useAuth();
  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ''}`.trim()
    : (user?.username ?? 'Manager');

  const [policies,    setPolicies]    = useState<SLAPolicy[]>(INIT_POLICIES);
  const [editTarget,  setEditTarget]  = useState<SLAPolicy | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const totalActive   = policies.reduce((s, p) => s + p.activeTickets, 0);
  const avgCompliance = Math.round(policies.reduce((s, p) => s + p.complianceRate, 0) / policies.length);

  const SUMMARY = [
    { label: 'Aktif SLA Politikası', value: policies.length, icon: ShieldCheck, color: '#2563EB', bg: '#EFF6FF' },
    { label: 'Bu Ay İhlal',          value: VIOLATIONS.length, icon: AlertTriangle, color: '#DC2626', bg: '#FEF2F2' },
    { label: 'Ortalama Uyum Oranı',  value: `%${avgCompliance}`, icon: TrendingUp, color: '#16A34A', bg: '#F0FDF4' },
  ];

  async function handleSave(id: string, resolutionHours: number, responseMinutes: number) {
    try {
      await axios.put(`http://localhost:8083/api/sla/policies/${id}`,
        { resolutionHours, responseMinutes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch { /* optimistic */ }

    setPolicies(prev => prev.map(p =>
      p.id === id ? { ...p, resolutionHours, responseMinutes } : p
    ));
    setEditTarget(null);
    setSaveSuccess(id);
    setTimeout(() => setSaveSuccess(null), 2500);
  }

  return (
    <>
      {editTarget && (
        <EditModal
          policy={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleSave}
        />
      )}

      <div className="flex min-h-screen bg-gray-50">
        <Sidebar displayName={displayName} email={user?.email} logout={logout} />

        <div className="flex-1 flex flex-col min-w-0">

          {/* Topbar */}
          <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold text-gray-900">SLA Yönetimi</h1>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {totalActive} aktif ticket · {policies.length} politika
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
                  <p className="text-[10px] text-gray-400 mt-0.5">Manager</p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 space-y-5">

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
              {SUMMARY.map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
                    <Icon size={17} style={{ color }} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{value}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* SLA Policies table */}
            <div className="bg-white rounded-xl border border-gray-100">
              <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <ShieldAlert size={13} className="text-gray-400" />
                  SLA Politikaları
                </h2>
                <p className="text-[10px] text-gray-400">Öncelik başına hedef süreler</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-50">
                      {['Öncelik', 'Hedef Çözüm', 'Hedef Yanıt', 'Aktif Ticket', 'Uyum Oranı', 'İşlem'].map(col => (
                        <th key={col} className="text-left px-5 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {policies.map(p => {
                      const col   = PRIORITY_COLOR[p.priority] ?? { dot: '#6B7280', badge: 'bg-gray-100 text-gray-600' };
                      const color = complianceColor(p.complianceRate);
                      const saved = saveSuccess === p.id;
                      return (
                        <tr key={p.id} className={`transition-colors ${saved ? 'bg-green-50/40' : 'hover:bg-gray-50/60'}`}>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: col.dot }} />
                              <span className={`font-semibold text-xs px-2 py-0.5 rounded-full ${col.badge}`}>{p.priority}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-gray-800">{p.resolutionHours} saat</p>
                            <p className="text-[10px] text-gray-400">{p.resolutionHours * 60} dakika</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-gray-800">{fmtMinutes(p.responseMinutes)}</p>
                            <p className="text-[10px] text-gray-400">{p.responseMinutes} dakika</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-semibold text-gray-800">{p.activeTickets}</span>
                            <span className="text-[10px] text-gray-400 ml-1">ticket</span>
                          </td>
                          <td className="px-5 py-3.5 min-w-[140px]">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${p.complianceRate}%`, background: color }} />
                              </div>
                              <span className="text-[10px] font-bold shrink-0" style={{ color }}>%{p.complianceRate}</span>
                            </div>
                            {saved && (
                              <p className="text-[10px] text-green-600 font-medium mt-0.5 flex items-center gap-1">
                                <ShieldCheck size={10} />Kaydedildi
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <button
                              onClick={() => setEditTarget(p)}
                              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded-lg border border-gray-200 text-gray-600 hover:border-[#EB0A1E] hover:text-[#EB0A1E] transition-all"
                            >
                              <Pencil size={11} />Düzenle
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Violation history */}
            <div className="bg-white rounded-xl border border-gray-100">
              <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-red-500" />
                  SLA İhlal Geçmişi
                </h2>
                <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full" style={{ background: '#EB0A1E' }}>
                  {VIOLATIONS.length} kayıt
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-50">
                      {['Ticket No', 'Müşteri', 'Öncelik', 'Hedef Süre', 'Gerçek Süre', 'Aşım', 'Tarih'].map(col => (
                        <th key={col} className="text-left px-5 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {VIOLATIONS.map(v => {
                      const col       = PRIORITY_COLOR[v.priority] ?? { dot: '#6B7280', badge: 'bg-gray-100 text-gray-600' };
                      const exceeded  = v.exceededMinutes;
                      const exColor   = exceeded > 60 ? '#DC2626' : '#EA580C';
                      return (
                        <tr key={v.ticketId} className="hover:bg-red-50/20 transition-colors">
                          <td className="px-5 py-3 font-mono text-[10px] text-gray-400">{v.ticketId}</td>
                          <td className="px-5 py-3 text-gray-700">{v.customerName}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: col.dot }} />
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${col.badge}`}>{v.priority}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{v.targetHours}s</td>
                          <td className="px-5 py-3 font-semibold text-red-600 whitespace-nowrap">{v.actualHours}s</td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                              style={{ background: exColor + '18', color: exColor }}
                            >
                              +{exceeded < 60 ? `${exceeded}dk` : `${(exceeded / 60).toFixed(1)}s`}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-[10px] text-gray-400 whitespace-nowrap">{v.date}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-5 py-2.5 border-t border-gray-50">
                <p className="text-[10px] text-gray-400">{VIOLATIONS.length} ihlal kaydı gösteriliyor</p>
              </div>
            </div>

          </main>
        </div>
      </div>
    </>
  );
}
