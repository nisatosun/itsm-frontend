import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard, Ticket, BarChart2, ShieldAlert, Bell, LogOut,
  ChevronRight, Search, ExternalLink, UserPlus, Clock, X, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MgrTicket {
  id: string; subject: string; category: string; priority: string;
  status: string; customerName: string; agentName: string | null;
  slaMinutesLeft: number | null; createdAt: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const AGENTS = ['Mert Yılmaz', 'Selin Demir', 'Ahmet Kaya', 'Zeynep Koç', 'Emre Şahin', 'Fatma Öztürk'];

const MOCK: MgrTicket[] = [
  { id:'TKT-1050', subject:'Exchange sunucusuna bağlanılamıyor',    category:'Yazılım', priority:'CRITICAL', status:'Açık',     customerName:'Deniz Kara',      agentName:null,           slaMinutesLeft:28,   createdAt:'14 May 2026' },
  { id:'TKT-1049', subject:'Şirket telefonu ses sorunu',            category:'Donanım', priority:'MEDIUM',   status:'Açık',     customerName:'Pelin Avcı',      agentName:null,           slaMinutesLeft:245,  createdAt:'14 May 2026' },
  { id:'TKT-1048', subject:'İki faktörlü doğrulama kodu gelmiyor', category:'Erişim',  priority:'HIGH',     status:'Açık',     customerName:'Serkan Yıldırım', agentName:'Mert Yılmaz',  slaMinutesLeft:75,   createdAt:'13 May 2026' },
  { id:'TKT-1047', subject:'Kurumsal mobil uygulama açılmıyor',    category:'Yazılım', priority:'MEDIUM',   status:'İşlemde',  customerName:'Gül Tekin',       agentName:'Selin Demir',  slaMinutesLeft:400,  createdAt:'13 May 2026' },
  { id:'TKT-1046', subject:'Ağ paylaşım klasörüne erişilemiyor',   category:'Ağ',      priority:'HIGH',     status:'Bekleyen', customerName:'Barış Polat',     agentName:'Ahmet Kaya',   slaMinutesLeft:105,  createdAt:'13 May 2026' },
  { id:'TKT-1045', subject:'Windows güncelleme döngüsüne girdi',   category:'Yazılım', priority:'HIGH',     status:'Açık',     customerName:'Naz Yılmaz',      agentName:'Ahmet Kaya',   slaMinutesLeft:-12,  createdAt:'12 May 2026' },
  { id:'TKT-1044', subject:'USB depolama cihazı tanınmıyor',       category:'Donanım', priority:'LOW',      status:'Atandı',   customerName:'Cem Bulut',       agentName:'Zeynep Koç',   slaMinutesLeft:null, createdAt:'12 May 2026' },
  { id:'TKT-1043', subject:'Departman e-posta listesi güncelleme', category:'Erişim',  priority:'LOW',      status:'Açık',     customerName:'İrem Doğan',      agentName:null,           slaMinutesLeft:720,  createdAt:'11 May 2026' },
  { id:'TKT-1042', subject:'VPN bağlantısı sürekli kopuyor',       category:'Ağ',      priority:'HIGH',     status:'Bekleyen', customerName:'Elif Nisatosun',  agentName:'Mert Yılmaz',  slaMinutesLeft:92,   createdAt:'12 May 2026' },
  { id:'TKT-1041', subject:'SAP oturumu açılmıyor',                category:'Yazılım', priority:'CRITICAL', status:'İşlemde',  customerName:'Ahmet Kaya',      agentName:'Mert Yılmaz',  slaMinutesLeft:35,   createdAt:'12 May 2026' },
  { id:'TKT-1040', subject:'Yazıcı sürücüsü kurulumu',             category:'Donanım', priority:'LOW',      status:'Açık',     customerName:'Selin Demir',     agentName:'Fatma Öztürk', slaMinutesLeft:480,  createdAt:'11 May 2026' },
  { id:'TKT-1039', subject:'Outlook e-posta gönderilemiyor',       category:'Yazılım', priority:'HIGH',     status:'Bekleyen', customerName:'Murat Yıldız',    agentName:'Emre Şahin',   slaMinutesLeft:18,   createdAt:'11 May 2026' },
  { id:'TKT-1038', subject:'Teams ses sorunu toplantılarda',       category:'Yazılım', priority:'MEDIUM',   status:'Çözüldü',  customerName:'Tolga Erdoğan',   agentName:'Selin Demir',  slaMinutesLeft:null, createdAt:'10 May 2026' },
  { id:'TKT-1036', subject:'Active Directory erişim talebi',       category:'Erişim',  priority:'MEDIUM',   status:'Açık',     customerName:'Ayşe Çelik',      agentName:'Zeynep Koç',   slaMinutesLeft:320,  createdAt:'9 May 2026'  },
  { id:'TKT-1033', subject:'ERP modülü hata veriyor',              category:'Yazılım', priority:'CRITICAL', status:'Bekleyen', customerName:'Zeynep Koç',      agentName:'Emre Şahin',   slaMinutesLeft:-45,  createdAt:'6 May 2026'  },
];

// ── Styles ────────────────────────────────────────────────────────────────────

const PRIORITY_STYLE: Record<string,{label:string;cls:string}> = {
  LOW:      {label:'Düşük',  cls:'bg-green-50 text-green-700'},
  MEDIUM:   {label:'Orta',   cls:'bg-amber-50 text-amber-700'},
  HIGH:     {label:'Yüksek', cls:'bg-orange-50 text-orange-700'},
  CRITICAL: {label:'Kritik', cls:'bg-red-50 text-red-700'},
};
const STATUS_STYLE: Record<string,{cls:string}> = {
  Açık:     {cls:'bg-red-50 text-red-700'},
  Triage:   {cls:'bg-pink-50 text-pink-700'},
  Atandı:   {cls:'bg-blue-50 text-blue-700'},
  İşlemde:  {cls:'bg-indigo-50 text-indigo-700'},
  Bekleyen: {cls:'bg-amber-50 text-amber-700'},
  Çözüldü:  {cls:'bg-green-50 text-green-700'},
};
const CATEGORY_COLOR: Record<string,string> = {
  Ağ:'bg-blue-50 text-blue-700', Yazılım:'bg-purple-50 text-purple-700',
  Erişim:'bg-indigo-50 text-indigo-700', Donanım:'bg-amber-50 text-amber-700',
};
function slaLabel(m:number|null):{text:string;cls:string} {
  if(m===null) return {text:'—',cls:'text-gray-400'};
  if(m<0)      return {text:`${Math.abs(m)}d ihlal`,cls:'text-red-600 font-semibold'};
  if(m<60)     return {text:`${m}d kaldı`,cls:'text-red-500 font-semibold'};
  if(m<120)    return {text:`${Math.floor(m/60)}s ${m%60}d`,cls:'text-amber-600 font-semibold'};
  return       {text:`${Math.floor(m/60)}s ${m%60}d`,cls:'text-green-600'};
}

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

// ── Assign Modal ──────────────────────────────────────────────────────────────

function AssignModal({ticket, onClose, onSave}: {ticket:MgrTicket; onClose:()=>void; onSave:(ticketId:string, agent:string)=>Promise<void>}) {
  const [selected, setSelected] = useState(ticket.agentName ?? '');
  const [saving,   setSaving]   = useState(false);
  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    await onSave(ticket.id, selected);
    setSaving(false);
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-sm mx-4">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Agent Ata</h2>
            <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{ticket.id} · {ticket.subject.slice(0,40)}{ticket.subject.length>40?'…':''}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition"><X size={15}/></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Agent Seç</label>
          <div className="space-y-1.5">
            {AGENTS.map((a) => (
              <button key={a} onClick={()=>setSelected(a)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left ${selected===a?'border-[#EB0A1E] bg-red-50 text-red-700':'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'}`}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{background: selected===a?'#EB0A1E':'#9CA3AF'}}>{a.charAt(0)}</div>
                {a}
                {selected===a && <span className="ml-auto text-[10px] font-semibold" style={{color:'#EB0A1E'}}>✓</span>}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition">İptal</button>
            <button onClick={handleSave} disabled={saving||!selected}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg transition-all disabled:opacity-50"
              style={{background:'#EB0A1E'}}
              onMouseEnter={e=>{if(!saving)(e.currentTarget as HTMLButtonElement).style.background='#a50015';}}
              onMouseLeave={e=>{if(!saving)(e.currentTarget as HTMLButtonElement).style.background='#EB0A1E';}}
            >
              {saving?<RefreshCw size={12} className="animate-spin"/>:<UserPlus size={12}/>}
              {saving?'Kaydediliyor...':'Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Filter pills ──────────────────────────────────────────────────────────────

function Pills({options,value,onChange}:{options:string[];value:string;onChange:(v:string)=>void}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {options.map(o=>(
        <button key={o} onClick={()=>onChange(o)}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${value===o?'text-white border-transparent':'text-gray-500 bg-gray-50 border-gray-200 hover:border-gray-300'}`}
          style={value===o?{background:'#EB0A1E',borderColor:'#EB0A1E'}:{}}
        >{o}</button>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ManagerTicketListPage() {
  const {user,token,logout}=useAuth();
  const navigate=useNavigate();
  const displayName=user?.firstName?`${user.firstName} ${user.lastName??''}`.trim():(user?.username??'Manager');

  const [tickets,       setTickets]       = useState<MgrTicket[]>(MOCK);
  const [assignTarget,  setAssignTarget]  = useState<MgrTicket|null>(null);
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('Tümü');
  const [priorityFilter,setPriorityFilter]= useState('Tümü');
  const [categoryFilter,setCategoryFilter]= useState('Tümü');
  const [agentFilter,   setAgentFilter]   = useState('Tümü');

  const STATUS_FILTERS   = ['Tümü','Açık','Triage','Atandı','İşlemde','Bekleyen','Çözüldü'];
  const PRIORITY_FILTERS = ['Tümü','Düşük','Orta','Yüksek','Kritik'];
  const CATEGORY_FILTERS = ['Tümü',...Array.from(new Set(MOCK.map(t=>t.category)))];
  const AGENT_FILTERS    = ['Tümü','Atanmadı',...AGENTS];

  const filtered = useMemo(()=>{
    const q=search.toLowerCase();
    return tickets.filter(t=>{
      const pLabel=PRIORITY_STYLE[t.priority]?.label??t.priority;
      const agentVal=t.agentName??'Atanmadı';
      return(
        (!q||t.id.toLowerCase().includes(q)||t.subject.toLowerCase().includes(q)||t.customerName.toLowerCase().includes(q))&&
        (statusFilter==='Tümü'||t.status===statusFilter)&&
        (priorityFilter==='Tümü'||pLabel===priorityFilter)&&
        (categoryFilter==='Tümü'||t.category===categoryFilter)&&
        (agentFilter==='Tümü'||agentVal===agentFilter)
      );
    });
  },[tickets,search,statusFilter,priorityFilter,categoryFilter,agentFilter]);

  async function handleAssign(ticketId:string,agent:string) {
    try {
      await axios.put(`http://localhost:8083/api/tickets/${ticketId}/assign`,{agentName:agent},{headers:{Authorization:`Bearer ${token}`}});
    } catch { /* optimistic */ }
    setTickets(prev=>prev.map(t=>t.id===ticketId?{...t,agentName:agent,status:t.status==='Açık'?'Atandı':t.status}:t));
    setAssignTarget(null);
  }

  return (
    <>
      {assignTarget && <AssignModal ticket={assignTarget} onClose={()=>setAssignTarget(null)} onSave={handleAssign}/>}
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar displayName={displayName} email={user?.email} logout={logout}/>
        <div className="flex-1 flex flex-col min-w-0">

          <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold text-gray-900">Tüm Ticketlar</h1>
              <p className="text-[10px] text-gray-400 mt-0.5">{filtered.length} kayıt</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="relative p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 transition"><Bell size={17}/><span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full border-2 border-white" style={{background:'#EB0A1E'}}/></button>
              <div className="flex items-center gap-2 pl-3 border-l border-gray-100">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{background:'#EB0A1E'}}>{displayName.charAt(0).toUpperCase()}</div>
                <div className="hidden sm:block"><p className="text-xs font-semibold text-gray-800 leading-none">{displayName}</p><p className="text-[10px] text-gray-400 mt-0.5">Manager</p></div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 space-y-4">
            {/* Filter bar */}
            <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 space-y-2.5">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                <input type="text" placeholder="Ticket no, konu veya müşteri ara..." value={search} onChange={e=>setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-[#EB0A1E] focus:ring-2 focus:ring-[#EB0A1E]/10 focus:bg-white transition"/>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                {[
                  {label:'Durum',    opts:STATUS_FILTERS,   val:statusFilter,   set:setStatusFilter},
                  {label:'Öncelik',  opts:PRIORITY_FILTERS, val:priorityFilter, set:setPriorityFilter},
                  {label:'Kategori', opts:CATEGORY_FILTERS, val:categoryFilter, set:setCategoryFilter},
                  {label:'Agent',    opts:AGENT_FILTERS,    val:agentFilter,    set:setAgentFilter},
                ].map(({label,opts,val,set},i,arr)=>(
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-gray-400 shrink-0">{label}</span>
                    <Pills options={opts} value={val} onChange={set}/>
                    {i<arr.length-1 && <div className="w-px h-4 bg-gray-200 ml-1"/>}
                  </div>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100">
              {filtered.length===0?(
                <div className="flex flex-col items-center justify-center py-16 gap-2"><Ticket size={30} className="text-gray-200"/><p className="text-sm font-medium text-gray-400">Ticket bulunamadı</p></div>
              ):(
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-50">
                          {['Ticket No','Müşteri','Konu','Kategori','Öncelik','Durum','Agent','SLA','Tarih','İşlem'].map(col=>(
                            <th key={col} className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filtered.map(t=>{
                          const p=PRIORITY_STYLE[t.priority]??{label:t.priority,cls:'bg-gray-100 text-gray-600'};
                          const s=STATUS_STYLE[t.status]??{cls:'bg-gray-100 text-gray-600'};
                          const cat=CATEGORY_COLOR[t.category]??'bg-gray-100 text-gray-600';
                          const sla=slaLabel(t.slaMinutesLeft);
                          return(
                            <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                              <td className="px-4 py-3 font-mono text-[10px] text-gray-400 whitespace-nowrap">{t.id}</td>
                              <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">{t.customerName}</td>
                              <td className="px-4 py-3 font-medium text-gray-800 max-w-[160px] truncate">{t.subject}</td>
                              <td className="px-4 py-3 whitespace-nowrap"><span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${cat}`}>{t.category}</span></td>
                              <td className="px-4 py-3 whitespace-nowrap"><span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${p.cls}`}>{p.label}</span></td>
                              <td className="px-4 py-3 whitespace-nowrap"><span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${s.cls}`}>{t.status}</span></td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {t.agentName
                                  ? <span className="text-xs text-gray-700">{t.agentName}</span>
                                  : <span className="text-[10px] text-gray-400 italic">Atanmadı</span>}
                              </td>
                              <td className={`px-4 py-3 whitespace-nowrap text-[10px] ${sla.cls}`}><span className="flex items-center gap-1"><Clock size={11}/>{sla.text}</span></td>
                              <td className="px-4 py-3 text-[10px] text-gray-400 whitespace-nowrap">{t.createdAt}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <button onClick={()=>setAssignTarget(t)}
                                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-lg border border-gray-200 text-gray-600 hover:border-[#EB0A1E] hover:text-[#EB0A1E] transition-all">
                                    <UserPlus size={10}/>Ata
                                  </button>
                                  <button onClick={()=>navigate(`/manager/tickets/${t.id}`)}
                                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-lg border border-gray-200 text-gray-600 hover:border-[#EB0A1E] hover:text-[#EB0A1E] transition-all">
                                    <ExternalLink size={10}/>Detay
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-2.5 border-t border-gray-50">
                    <p className="text-[10px] text-gray-400">{filtered.length} kayıt gösteriliyor</p>
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
