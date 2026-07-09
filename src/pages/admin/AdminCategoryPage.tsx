import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Tag, ClipboardList, Bell, LogOut,
  Plus, Pencil, Trash2, Check, X, Folder,
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',          href: '/admin/dashboard' },
  { icon: Users,           label: 'Kullanıcı Yönetimi', href: '/admin/users' },
  { icon: Tag,             label: 'Kategori Yönetimi',  href: '/admin/categories' },
  { icon: ClipboardList,   label: 'Audit Log',          href: '/admin/audit' },
  { icon: Bell,            label: 'Bildirimler',        href: '/admin/notifications' },
];

interface Category {
  id: number;
  name: string;
  description: string;
  activeTickets: number;
  color: string;
}

const COLOR_OPTIONS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500',
  'bg-green-600', 'bg-blue-500', 'bg-purple-500', 'bg-gray-500',
];

const INITIAL_CATEGORIES: Category[] = [
  { id:1, name:'Donanım',           description:'Bilgisayar, klavye, mouse ve diğer fiziksel ekipman sorunları',  activeTickets: 12, color:'bg-blue-500' },
  { id:2, name:'Yazılım',           description:'Kurulum, güncelleme ve uygulama hataları ile ilgili talepler',   activeTickets: 27, color:'bg-purple-500' },
  { id:3, name:'Ağ / VPN',          description:'İnternet bağlantısı, VPN erişimi ve ağ altyapısı sorunları',    activeTickets:  8, color:'bg-green-600' },
  { id:4, name:'Erişim & Yetki',    description:'Sistem erişimi, şifre sıfırlama ve rol yönetimi talepleri',     activeTickets: 19, color:'bg-orange-500' },
  { id:5, name:'E-posta',           description:'Mail hesabı, dağıtım listesi ve spam sorunları',                activeTickets:  5, color:'bg-amber-500' },
  { id:6, name:'Diğer',             description:'Yukarıdaki kategorilere girmeyen genel IT destek talepleri',     activeTickets:  2, color:'bg-gray-500' },
];

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

interface FormState { name: string; description: string; color: string; }
const EMPTY_FORM: FormState = { name: '', description: '', color: 'bg-blue-500' };

export default function AdminCategoryPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);

  const [editId, setEditId]       = useState<number | null>(null);
  const [editForm, setEditForm]   = useState<FormState>(EMPTY_FORM);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(EMPTY_FORM);
  const [savedId, setSavedId]     = useState<number | null>(null);
  const [deleteId, setDeleteId]   = useState<number | null>(null);

  function startEdit(c: Category) {
    setEditId(c.id);
    setEditForm({ name: c.name, description: c.description, color: c.color });
  }

  function saveEdit() {
    if (editId === null) return;
    setCategories(prev => prev.map(c => c.id === editId ? { ...c, ...editForm } : c));
    setSavedId(editId);
    setEditId(null);
    setTimeout(() => setSavedId(null), 2000);
  }

  function createCategory() {
    const next: Category = { id: Date.now(), ...createForm, activeTickets: 0 };
    setCategories(prev => [...prev, next]);
    setShowCreate(false);
    setCreateForm(EMPTY_FORM);
  }

  function confirmDelete(id: number) { setDeleteId(id); }
  function doDelete() {
    setCategories(prev => prev.filter(c => c.id !== deleteId));
    setDeleteId(null);
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-sm font-bold text-gray-800">Kategori Yönetimi</h1>
            <p className="text-[10px] text-gray-400">{categories.length} kategori</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { setShowCreate(true); setCreateForm(EMPTY_FORM); }}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
              <Plus size={13} /> Yeni Kategori
            </button>
            <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-white text-[10px] font-bold">
              {user?.username?.[0]?.toUpperCase() ?? 'A'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-3 gap-3">
            {categories.map(cat => (
              <div key={cat.id}
                className={`bg-white border rounded-lg overflow-hidden transition-shadow hover:shadow-sm ${savedId === cat.id ? 'border-green-300' : 'border-gray-100'}`}>
                {editId === cat.id ? (
                  /* Inline Edit Form */
                  <div className="p-4 space-y-3">
                    <div>
                      <label className="text-[10px] text-gray-500 font-medium">Kategori Adı</label>
                      <input value={editForm.name} onChange={e => setEditForm(f => ({...f, name: e.target.value}))}
                        className="w-full mt-0.5 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-red-400"/>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-medium">Açıklama</label>
                      <textarea value={editForm.description} onChange={e => setEditForm(f => ({...f, description: e.target.value}))}
                        rows={2} className="w-full mt-0.5 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-red-400 resize-none"/>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-medium block mb-1.5">Renk</label>
                      <div className="flex gap-1.5 flex-wrap">
                        {COLOR_OPTIONS.map(c => (
                          <button key={c} onClick={() => setEditForm(f => ({...f, color: c}))}
                            className={`w-5 h-5 rounded-full ${c} ${editForm.color === c ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}/>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setEditId(null)}
                        className="flex-1 text-[10px] py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">
                        İptal
                      </button>
                      <button onClick={saveEdit} disabled={!editForm.name}
                        className="flex-1 text-[10px] py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-200 text-white rounded-lg font-medium">
                        Kaydet
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display */
                  <>
                    <div className={`h-1.5 w-full ${cat.color}`} />
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-lg ${cat.color} flex items-center justify-center shrink-0`}>
                            <Folder size={12} className="text-white"/>
                          </div>
                          <p className="text-xs font-semibold text-gray-800">{cat.name}</p>
                          {savedId === cat.id && <Check size={12} className="text-green-500"/>}
                        </div>
                        <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                          {cat.activeTickets} ticket
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-relaxed mb-3">{cat.description}</p>
                      <div className="flex gap-1.5">
                        <button onClick={() => startEdit(cat)}
                          className="flex items-center gap-1 text-[10px] text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors">
                          <Pencil size={10}/> Düzenle
                        </button>
                        <button onClick={() => confirmDelete(cat.id)}
                          className="flex items-center gap-1 text-[10px] text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors">
                          <Trash2 size={10}/> Sil
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* New category placeholder card */}
            {!showCreate && (
              <button onClick={() => { setShowCreate(true); setCreateForm(EMPTY_FORM); }}
                className="border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2 py-8 hover:border-red-300 hover:bg-red-50/30 transition-colors">
                <Plus size={18} className="text-gray-300"/>
                <span className="text-xs text-gray-400">Yeni Kategori Ekle</span>
              </button>
            )}
          </div>
        </main>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-80 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-800">Yeni Kategori</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X size={15}/></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-500 font-medium">Kategori Adı</label>
                <input value={createForm.name} onChange={e => setCreateForm(f => ({...f, name: e.target.value}))}
                  placeholder="Örn: Donanım"
                  className="w-full mt-0.5 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-red-400"/>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-medium">Açıklama</label>
                <textarea value={createForm.description} onChange={e => setCreateForm(f => ({...f, description: e.target.value}))}
                  rows={2} placeholder="Kategori açıklaması..."
                  className="w-full mt-0.5 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-red-400 resize-none"/>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-medium block mb-1.5">Renk</label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_OPTIONS.map(c => (
                    <button key={c} onClick={() => setCreateForm(f => ({...f, color: c}))}
                      className={`w-5 h-5 rounded-full ${c} ${createForm.color === c ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}/>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowCreate(false)}
                className="flex-1 text-xs py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">İptal</button>
              <button onClick={createCategory} disabled={!createForm.name}
                className="flex-1 text-xs py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-lg font-medium">
                Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-72 p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-2">Kategoriyi Sil</h3>
            <p className="text-xs text-gray-500 mb-5">
              <span className="font-medium text-gray-700">"{categories.find(c => c.id === deleteId)?.name}"</span> kategorisi
              silinecek. Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 text-xs py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">İptal</button>
              <button onClick={doDelete}
                className="flex-1 text-xs py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
