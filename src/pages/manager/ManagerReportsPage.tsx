import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Ticket, BarChart2, ShieldAlert, Bell, LogOut,
  ChevronRight, Download, CheckCircle2, AlertTriangle, TrendingUp, Users,
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

// ── Nav / Sidebar ─────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {icon:LayoutDashboard,label:'Dashboard',    href:'/manager/dashboard'},
  {icon:Ticket,         label:'Tüm Ticketlar',href:'/manager/tickets'},
  {icon:BarChart2,      label:'Raporlar',      href:'/manager/reports'},
  {icon:ShieldAlert,    label:'SLA Yönetimi',  href:'/manager/sla'},
  {icon:Bell,           label:'Bildirimler',   href:'/manager/notifications'},
];
function Sidebar({displayName,email,logout}:{displayName:string;email?:string;logout:()=>void}) {
  const navigate=useNavigate(); const location=useLocation();
  return (
    <aside className="w-56 shrink-0 flex flex-col" style={{background:'#EB0A1E'}}>
      <div className="px-4 py-4 border-b border-white/10 flex items-center gap-2.5">
        <div className="w-7 h-7 bg-white rounded flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
            <ellipse cx="12" cy="12" rx="10" ry="4.5" stroke="#EB0A1E" strokeWidth="1.8"/>
            <ellipse cx="12" cy="12" rx="4.5" ry="10" stroke="#EB0A1E" strokeWidth="1.8"/>
            <circle cx="12" cy="12" r="2.5" fill="#EB0A1E"/>
          </svg>
        </div>
        <div><p className="text-white font-bold text-xs leading-none">Toyota</p><p className="text-red-200 text-[10px] mt-0.5">IT Service Mgmt</p></div>
      </div>
      <nav className="flex-1 px-2.5 py-3 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({icon:Icon,label,href})=>{
          const active=location.pathname===href;
          return(<button key={label} onClick={()=>navigate(href)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${active?'bg-white/20 text-white':'text-red-100 hover:bg-white/10 hover:text-white'}`}><Icon size={15}/><span className="flex-1">{label}</span>{active&&<ChevronRight size={12}/>}</button>);
        })}
      </nav>
      <div className="px-2.5 py-3 border-t border-white/10">
        <div className="px-3 py-1.5 mb-0.5"><p className="text-white text-xs font-medium truncate">{displayName}</p><p className="text-red-200 text-[10px] truncate">{email??'Manager'}</p></div>
        <button onClick={logout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-red-100 hover:bg-white/10 hover:text-white transition-all"><LogOut size={15}/>Çıkış Yap</button>
      </div>
    </aside>
  );
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const SUMMARY_STATS = [
  {label:'Toplam Ticket',  value:221, delta:'+14%', up:true,  icon:Ticket,       color:'#2563EB',bg:'#EFF6FF'},
  {label:'Çözülen',        value:87,  delta:'+8%',  up:true,  icon:CheckCircle2, color:'#16A34A',bg:'#F0FDF4'},
  {label:'SLA İhlali',     value:9,   delta:'-3%',  up:false, icon:AlertTriangle,color:'#DC2626',bg:'#FEF2F2'},
  {label:'Ort. Çözüm',     value:'3s 12d', delta:'', up:true, icon:TrendingUp,   color:'#7C3AED',bg:'#F5F3FF'},
];

const CATEGORY_BREAKDOWN = [
  {label:'Yazılım', count:78, color:'#7C3AED'},
  {label:'Ağ',      count:52, color:'#2563EB'},
  {label:'Donanım', count:41, color:'#D97706'},
  {label:'Erişim',  count:50, color:'#6366F1'},
];

const SLA_DATA = [
  {priority:'Kritik', total:18, met:14, rate:78},
  {priority:'Yüksek', total:54, met:49, rate:91},
  {priority:'Orta',   total:82, met:79, rate:96},
  {priority:'Düşük',  total:67, met:67, rate:100},
];

const TREND_WEEKS = [
  {week:'29 Nis',  opened:34, resolved:28},
  {week:'6 May',   opened:41, resolved:35},
  {week:'13 May',  opened:38, resolved:31},
  {week:'Bu Hafta',opened:22, resolved:18},
];

const AGENT_REPORT = [
  {name:'Ahmet Kaya',   assigned:21,resolved:17,avgTime:'2s 20d',slaRate:97,csat:96},
  {name:'Mert Yılmaz',  assigned:18,resolved:14,avgTime:'2s 45d',slaRate:94,csat:93},
  {name:'Emre Şahin',   assigned:16,resolved:13,avgTime:'3s 30d',slaRate:91,csat:88},
  {name:'Fatma Öztürk', assigned:10,resolved:8, avgTime:'2s 55d',slaRate:85,csat:90},
  {name:'Selin Demir',  assigned:15,resolved:12,avgTime:'3s 10d',slaRate:88,csat:87},
  {name:'Zeynep Koç',   assigned:12,resolved:9, avgTime:'4s 05d',slaRate:79,csat:81},
];

// ── Bar chart helper ──────────────────────────────────────────────────────────

function HBar({value,max,color,height='h-4'}:{value:number;max:number;color:string;height?:string}) {
  const pct = Math.round((value/max)*100);
  return (
    <div className={`flex-1 ${height} bg-gray-50 rounded-lg overflow-hidden`}>
      <div className={`${height} rounded-lg transition-all`} style={{width:`${pct}%`,background:color,opacity:0.75,minWidth:'4px'}}/>
    </div>
  );
}

// ── Tab content components ────────────────────────────────────────────────────

function SummaryTab() {
  const maxCat = Math.max(...CATEGORY_BREAKDOWN.map(c=>c.count));
  return (
    <div className="space-y-5">
      {/* Stat row */}
      <div className="grid grid-cols-4 gap-4">
        {SUMMARY_STATS.map(({label,value,delta,up,icon:Icon,color,bg})=>(
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{background:bg}}><Icon size={17} style={{color}}/></div>
            <div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
              {delta&&<p className={`text-[10px] font-semibold mt-0.5 ${up?'text-green-600':'text-red-500'}`}>{delta}</p>}
            </div>
          </div>
        ))}
      </div>
      {/* Category distribution */}
      <div className="bg-white rounded-xl border border-gray-100 px-5 py-4">
        <h3 className="text-xs font-bold text-gray-900 mb-4">Kategori Dağılımı</h3>
        <div className="space-y-3">
          {CATEGORY_BREAKDOWN.map(c=>(
            <div key={c.label} className="flex items-center gap-3">
              <span className="text-[10px] font-medium text-gray-500 w-16 shrink-0 text-right">{c.label}</span>
              <HBar value={c.count} max={maxCat} color={c.color}/>
              <span className="text-xs font-bold text-gray-800 w-6 text-right">{c.count}</span>
              <span className="text-[10px] text-gray-400 w-10">%{((c.count/221)*100).toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlaTab() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="px-5 py-3 border-b border-gray-50">
          <h3 className="text-xs font-bold text-gray-900">Öncelik Bazında SLA Uyum</h3>
        </div>
        <table className="w-full text-xs">
          <thead><tr className="border-b border-gray-50">{['Öncelik','Toplam','Karşılanan','İhlal','Uyum %'].map(c=><th key={c} className="text-left px-5 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{c}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {SLA_DATA.map(d=>{
              const color=d.rate>=95?'#16A34A':d.rate>=80?'#D97706':'#DC2626';
              return(
                <tr key={d.priority} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-800">{d.priority}</td>
                  <td className="px-5 py-3 text-gray-600">{d.total}</td>
                  <td className="px-5 py-3 text-green-600 font-medium">{d.met}</td>
                  <td className="px-5 py-3 text-red-500 font-medium">{d.total-d.met}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${d.rate}%`,background:color}}/></div>
                      <span className="text-[10px] font-bold" style={{color}}>%{d.rate}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-gray-50">
          <p className="text-[10px] text-gray-400">Genel SLA uyum oranı: <span className="font-bold text-green-600">%91.4</span></p>
        </div>
      </div>
    </div>
  );
}

function TrendTab() {
  const maxOpen = Math.max(...TREND_WEEKS.map(w=>w.opened));
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 px-5 py-4">
        <h3 className="text-xs font-bold text-gray-900 mb-4">Haftalık Ticket Trendi</h3>
        <div className="space-y-4">
          {TREND_WEEKS.map(w=>(
            <div key={w.week}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-gray-600">{w.week}</span>
                <span className="text-[10px] text-gray-400">Açılan {w.opened} · Çözülen {w.resolved}</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 w-14 shrink-0 text-right">Açılan</span>
                  <HBar value={w.opened} max={maxOpen} color="#EB0A1E" height="h-3"/>
                  <span className="text-[10px] font-bold text-gray-700 w-6">{w.opened}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 w-14 shrink-0 text-right">Çözülen</span>
                  <HBar value={w.resolved} max={maxOpen} color="#16A34A" height="h-3"/>
                  <span className="text-[10px] font-bold text-gray-700 w-6">{w.resolved}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-4 text-[10px] text-gray-400">
          <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full inline-block" style={{background:'#EB0A1E'}}/> Açılan</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full inline-block" style={{background:'#16A34A'}}/> Çözülen</span>
        </div>
      </div>
    </div>
  );
}

function AgentTab() {
  return (
    <div className="bg-white rounded-xl border border-gray-100">
      <div className="px-5 py-3 border-b border-gray-50">
        <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5"><Users size={13} className="text-gray-400"/>Agent Performans Raporu</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-gray-50">{['Agent','Atanmış','Çözülen','Kapanma %','Ort. Süre','SLA Uyum','CSAT'].map(c=><th key={c} className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{c}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {AGENT_REPORT.map(a=>{
              const closeRate=Math.round((a.resolved/a.assigned)*100);
              const slaColor=a.slaRate>=90?'#16A34A':a.slaRate>=80?'#D97706':'#DC2626';
              const csatColor=a.csat>=90?'#16A34A':a.csat>=80?'#D97706':'#DC2626';
              return(
                <tr key={a.name} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{background:'#EB0A1E'}}>{a.name.charAt(0)}</div>
                      <span className="font-medium text-gray-800">{a.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.assigned}</td>
                  <td className="px-4 py-3 text-gray-600">{a.resolved}</td>
                  <td className="px-4 py-3"><span className={`font-semibold ${closeRate>=80?'text-green-600':closeRate>=60?'text-amber-600':'text-red-500'}`}>%{closeRate}</span></td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{a.avgTime}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${a.slaRate}%`,background:slaColor}}/></div>
                      <span className="text-[10px] font-bold" style={{color:slaColor}}>%{a.slaRate}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="text-xs font-semibold" style={{color:csatColor}}>%{a.csat}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type TabKey = 'summary'|'sla'|'trend'|'agent';
const TABS: {key:TabKey;label:string;icon:React.ElementType}[] = [
  {key:'summary',label:'Özet',               icon:BarChart2},
  {key:'sla',    label:'SLA Uyum',            icon:ShieldAlert},
  {key:'trend',  label:'Ticket Trendleri',    icon:TrendingUp},
  {key:'agent',  label:'Agent Performansı',   icon:Users},
];
const DATE_RANGES = ['Bu Hafta','Bu Ay','Son 3 Ay'];

export default function ManagerReportsPage() {
  const {user,logout}=useAuth();
  const displayName=user?.firstName?`${user.firstName} ${user.lastName??''}`.trim():(user?.username??'Manager');
  const [activeTab,  setActiveTab]  = useState<TabKey>('summary');
  const [dateRange,  setDateRange]  = useState('Bu Ay');
  const [exporting,  setExporting]  = useState(false);

  function handleExport() {
    setExporting(true);
    setTimeout(()=>setExporting(false),1200);
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar displayName={displayName} email={user?.email} logout={logout}/>
      <div className="flex-1 flex flex-col min-w-0">

        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">Raporlar</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">Performans ve analiz raporları</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Date range */}
            <div className="flex items-center gap-1 bg-gray-50 rounded-lg border border-gray-200 p-0.5">
              {DATE_RANGES.map(r=>(
                <button key={r} onClick={()=>setDateRange(r)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${dateRange===r?'text-white shadow-sm':'text-gray-500 hover:text-gray-700'}`}
                  style={dateRange===r?{background:'#EB0A1E'}:{}}
                >{r}</button>
              ))}
            </div>
            {/* Export */}
            <button onClick={handleExport} disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-60"
            >
              {exporting
                ? <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"/>
                : <Download size={13}/>
              }
              {exporting?'Hazırlanıyor...':'Dışa Aktar'}
            </button>
            <button className="relative p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 transition"><Bell size={17}/><span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full border-2 border-white" style={{background:'#EB0A1E'}}/></button>
            <div className="flex items-center gap-2 pl-3 border-l border-gray-100">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{background:'#EB0A1E'}}>{displayName.charAt(0).toUpperCase()}</div>
              <div className="hidden sm:block"><p className="text-xs font-semibold text-gray-800 leading-none">{displayName}</p><p className="text-[10px] text-gray-400 mt-0.5">Manager</p></div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-4">
          {/* Tabs */}
          <div className="bg-white rounded-xl border border-gray-100 px-4 pt-3 flex items-center gap-0">
            {TABS.map(({key,label,icon:Icon})=>{
              const active=activeTab===key;
              return(
                <button key={key} onClick={()=>setActiveTab(key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all -mb-px ${active?'border-[#EB0A1E] text-[#EB0A1E]':'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                  <Icon size={13}/>{label}
                </button>
              );
            })}
            <div className="flex-1 border-b-2 border-gray-100 -mb-px ml-2"/>
          </div>

          {/* Tab content */}
          {activeTab==='summary' && <SummaryTab/>}
          {activeTab==='sla'     && <SlaTab/>}
          {activeTab==='trend'   && <TrendTab/>}
          {activeTab==='agent'   && <AgentTab/>}
        </main>
      </div>
    </div>
  );
}
