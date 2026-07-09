import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Tag, ClipboardList, Bell, LogOut,
  Plus, Search, X, Check, Pencil, UserX, UserCheck,
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',          href: '/admin/dashboard' },
  { icon: Users,           label: 'Kullanıcı Yönetimi', href: '/admin/users' },
  { icon: Tag,             label: 'Kategori Yönetimi',  href: '/admin/categories' },
  { icon: ClipboardList,   label: 'Audit Log',          href: '/admin/audit' },
  { icon: Bell,            label: 'Bildirimler',        href: '/admin/notifications' },
];

type Role   = 'ADMIN' | 'MANAGER' | 'AGENT' | 'CUSTOMER';
type Status = 'active' | 'passive';

interface AppUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  status: Status;
  lastLogin: string;
}

const INITIAL_USERS: AppUser[] = [
  { id:1,  firstName:'Elif',    lastName:'Tosun',   email:'elif@toyota.com',    role:'ADMIN',    status:'active',  lastLogin:'14.05.2026 09:12' },
  { id:2,  firstName:'Ahmet',   lastName:'Yılmaz',  email:'ahmet@toyota.com',   role:'MANAGER',  status:'active',  lastLogin:'14.05.2026 08:47' },
  { id:3,  firstName:'Mehmet',  lastName:'Kaya',    email:'mehmet@toyota.com',  role:'AGENT',    status:'active',  lastLogin:'14.05.2026 08:30' },
  { id:4,  firstName:'Ayşe',    lastName:'Demir',   email:'ayse@toyota.com',    role:'AGENT',    status:'active',  lastLogin:'13.05.2026 17:55' },
  { id:5,  firstName:'Fatma',   lastName:'Çelik',   email:'fatma@toyota.com',   role:'CUSTOMER', status:'active',  lastLogin:'14.05.2026 07:20' },
  { id:6,  firstName:'Hasan',   lastName:'Şahin',   email:'hasan@toyota.com',   role:'MANAGER',  status:'passive', lastLogin:'10.05.2026 14:00' },
  { id:7,  firstName:'Zeynep',  lastName:'Arslan',  email:'zeynep@toyota.com',  role:'AGENT',    status:'active',  lastLogin:'14.05.2026 09:00' },
  { id:8,  firstName:'Emre',    lastName:'Çetin',   email:'emre@toyota.com',    role:'CUSTOMER', status:'passive', lastLogin:'01.05.2026 11:30' },
  { id:9,  firstName:'Selin',   lastName:'Doğan',   email:'selin@toyota.com',   role:'AGENT',    status:'active',  lastLogin:'13.05.2026 16:10' },
  { id:10, firstName:'Burak',   lastName:'Yıldız',  email:'burak@toyota.com',   role:'CUSTOMER', status:'active',  lastLogin:'14.05.2026 06:45' },
];

const ROLE_COLORS: Record<Role, string> = {
  ADMIN:    'bg-red-100 text-red-700',
  MANAGER:  'bg-orange-100 text-orange-700',
  AGENT:    'bg-blue-100 text-blue-700',
  CUSTOMER: 'bg-green-100 text-green-700',
};

const ROLES: Role[] = ['ADMIN', 'MANAGER', 'AGENT', 'CUSTOMER'];

function initials(u: AppUser) {
  return (u.firstName[0] + u.lastName[0]).toUpperCase();
}

function avatarColor(role: Role) {
  const map: Record<Role, string> = {
    ADMIN: 'bg-red-600', MANAGER: 'bg-orange-500', AGENT: 'bg-blue-500', CUSTOMER: 'bg-green-600',
  };
  return map[role];
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
            <button key={href} onClick={() => navigate(href)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${active ? 'bg-red-50 text-red-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}`}>
              <Icon size={14} className={active ? 'text-red-600' : 'text-gray-400'} />
              <span className="text-xs">{label}</span>
            </button>
          );
        })}
      </nav>
      <div className="px-2 py-3 border-t border-gray-100">
        <button onClick={logout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
          <LogOut size={14} /><span className="text-xs">Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );
}

interface EditFormState { firstName: string; lastName: string; email: string; role: Role; }

export default function AdminUserManagementPage() {
  const { user } = useAuth();
  const [users, setUsers]         = useState<AppUser[]>(INITIAL_USERS);
  const [search, setSearch]       = useState('');
  const [filterRole, setFilterRole]     = useState<Role | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<Status | 'ALL'>('ALL');

  const [editTarget, setEditTarget]   = useState<AppUser | null>(null);
  const [editForm, setEditForm]       = useState<EditFormState>({ firstName:'', lastName:'', email:'', role:'CUSTOMER' });
  const [showCreate, setShowCreate]   = useState(false);
  const [createForm, setCreateForm]   = useState<EditFormState & { password: string }>({
    firstName:'', lastName:'', email:'', role:'CUSTOMER', password:'',
  });
  const [savedId, setSavedId]         = useState<number | null>(null);

  const filtered = useMemo(() => users.filter(u => {
    const matchSearch = search === '' ||
      `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchRole   = filterRole   === 'ALL' || u.role   === filterRole;
    const matchStatus = filterStatus === 'ALL' || u.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  }), [users, search, filterRole, filterStatus]);

  function openEdit(u: AppUser) {
    setEditTarget(u);
    setEditForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, role: u.role });
  }

  function saveEdit() {
    if (!editTarget) return;
    setUsers(prev => prev.map(u => u.id === editTarget.id ? { ...u, ...editForm } : u));
    setSavedId(editTarget.id);
    setEditTarget(null);
    setTimeout(() => setSavedId(null), 2000);
  }

  function toggleStatus(id: number) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'passive' : 'active' } : u));
  }

  function createUser() {
    const newUser: AppUser = {
      id: Date.now(),
      firstName: createForm.firstName,
      lastName:  createForm.lastName,
      email:     createForm.email,
      role:      createForm.role,
      status:    'active',
      lastLogin: '—',
    };
    setUsers(prev => [newUser, ...prev]);
    setShowCreate(false);
    setCreateForm({ firstName:'', lastName:'', email:'', role:'CUSTOMER', password:'' });
  }

  const canCreate = createForm.firstName && createForm.lastName && createForm.email && createForm.password;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-sm font-bold text-gray-800">Kullanıcı Yönetimi</h1>
            <p className="text-[10px] text-gray-400">{users.length} kullanıcı</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
              <Plus size={13} /> Yeni Kullanıcı
            </button>
            <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-white text-[10px] font-bold">
              {user?.username?.[0]?.toUpperCase() ?? 'A'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Filters */}
          <div className="bg-white border border-gray-100 rounded-lg px-4 py-2.5 flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ad, soyad veya e-posta..."
                className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-red-400" />
            </div>
            <select value={filterRole} onChange={e => setFilterRole(e.target.value as Role | 'ALL')}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-red-400 text-gray-600">
              <option value="ALL">Tüm Roller</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as Status | 'ALL')}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-red-400 text-gray-600">
              <option value="ALL">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="passive">Pasif</option>
            </select>
            {(search || filterRole !== 'ALL' || filterStatus !== 'ALL') && (
              <button onClick={() => { setSearch(''); setFilterRole('ALL'); setFilterStatus('ALL'); }}
                className="text-[10px] text-gray-400 hover:text-red-500 flex items-center gap-1">
                <X size={11} /> Temizle
              </button>
            )}
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Kullanıcı','E-posta','Rol','Durum','Son Giriş','İşlem'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => (
                  <tr key={u.id} className={`hover:bg-gray-50/50 ${savedId === u.id ? 'bg-green-50/40' : ''}`}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full ${avatarColor(u.role)} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>
                          {initials(u)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">{u.firstName} {u.lastName}</p>
                          {savedId === u.id && <p className="text-[9px] text-green-600 flex items-center gap-0.5"><Check size={9}/> Kaydedildi</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">{u.email}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${ROLE_COLORS[u.role]}`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {u.status === 'active' ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">{u.lastLogin}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(u)}
                          className="flex items-center gap-1 text-[10px] text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors">
                          <Pencil size={10}/> Düzenle
                        </button>
                        <button onClick={() => toggleStatus(u.id)}
                          className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded transition-colors ${u.status === 'active' ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}>
                          {u.status === 'active' ? <><UserX size={10}/> Pasif Yap</> : <><UserCheck size={10}/> Aktif Yap</>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-gray-400">Kullanıcı bulunamadı.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-80 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-800">Kullanıcı Düzenle</h3>
              <button onClick={() => setEditTarget(null)} className="text-gray-400 hover:text-gray-600"><X size={15}/></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 font-medium">Ad</label>
                  <input value={editForm.firstName} onChange={e => setEditForm(f => ({...f, firstName: e.target.value}))}
                    className="w-full mt-0.5 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-red-400"/>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-medium">Soyad</label>
                  <input value={editForm.lastName} onChange={e => setEditForm(f => ({...f, lastName: e.target.value}))}
                    className="w-full mt-0.5 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-red-400"/>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-medium">E-posta</label>
                <input value={editForm.email} onChange={e => setEditForm(f => ({...f, email: e.target.value}))}
                  className="w-full mt-0.5 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-red-400"/>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-medium">Rol</label>
                <select value={editForm.role} onChange={e => setEditForm(f => ({...f, role: e.target.value as Role}))}
                  className="w-full mt-0.5 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-red-400">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditTarget(null)}
                className="flex-1 text-xs py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
                İptal
              </button>
              <button onClick={saveEdit}
                className="flex-1 text-xs py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-80 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-800">Yeni Kullanıcı</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X size={15}/></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 font-medium">Ad</label>
                  <input value={createForm.firstName} onChange={e => setCreateForm(f => ({...f, firstName: e.target.value}))}
                    className="w-full mt-0.5 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-red-400"/>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-medium">Soyad</label>
                  <input value={createForm.lastName} onChange={e => setCreateForm(f => ({...f, lastName: e.target.value}))}
                    className="w-full mt-0.5 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-red-400"/>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-medium">E-posta</label>
                <input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({...f, email: e.target.value}))}
                  className="w-full mt-0.5 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-red-400"/>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-medium">Şifre</label>
                <input type="password" value={createForm.password} onChange={e => setCreateForm(f => ({...f, password: e.target.value}))}
                  className="w-full mt-0.5 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-red-400"/>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-medium">Rol</label>
                <select value={createForm.role} onChange={e => setCreateForm(f => ({...f, role: e.target.value as Role}))}
                  className="w-full mt-0.5 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-red-400">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowCreate(false)}
                className="flex-1 text-xs py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
                İptal
              </button>
              <button onClick={createUser} disabled={!canCreate}
                className="flex-1 text-xs py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-lg font-medium transition-colors">
                Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
