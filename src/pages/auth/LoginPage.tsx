import { useState, useEffect } from 'react';
import { User, Eye, EyeOff, LogIn } from 'lucide-react';
import keycloak from '../../auth/keycloak';
import { useAuth } from '../../auth/useAuth';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    keycloak.login({ loginHint: username, redirectUri: window.location.origin + '/' });
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #EB0A1E 0%, #a50015 100%)' }}
      >
        {/* Background rings */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full border border-white/40" />
          <div className="absolute top-[-40px] left-[-40px] w-[300px] h-[300px] rounded-full border border-white/40" />
          <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full border border-white/40" />
          <div className="absolute bottom-[-60px] right-[-60px] w-[380px] h-[380px] rounded-full border border-white/40" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
                <ellipse cx="12" cy="12" rx="10" ry="4.5" stroke="#EB0A1E" strokeWidth="1.8" />
                <ellipse cx="12" cy="12" rx="4.5" ry="10" stroke="#EB0A1E" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="2.5" fill="#EB0A1E" />
              </svg>
            </div>
            <span className="text-white font-semibold text-lg tracking-wide">Toyota ITSM</span>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            IT Service<br />Management
          </h1>
          <p className="text-red-100 text-base leading-relaxed max-w-sm">
            Toyota'nın kurumsal IT destek platformu. Taleplerinizi yönetin,
            sorunlarınızı takip edin ve hizmet kalitesini artırın.
          </p>

          <div className="mt-10 flex flex-col gap-3">
            {[
              { icon: '⚡', label: 'Hızlı Olay Yönetimi' },
              { icon: '📊', label: 'Gerçek Zamanlı Raporlama' },
              { icon: '🔒', label: 'Kurumsal SSO Güvenliği' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-lg">{icon}</span>
                <span className="text-red-100 text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-red-200 text-xs">
            © {new Date().getFullYear()} Toyota Motor Corporation. Tüm hakları saklıdır.
          </p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-10">
            <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: '#EB0A1E' }}>
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                <ellipse cx="12" cy="12" rx="10" ry="4.5" stroke="white" strokeWidth="1.8" />
                <ellipse cx="12" cy="12" rx="4.5" ry="10" stroke="white" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="2.5" fill="white" />
              </svg>
            </div>
            <span className="font-semibold text-gray-800">Toyota ITSM</span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Hoş Geldiniz</h2>
              <p className="text-gray-500 text-sm mt-1">
                Devam etmek için kurumsal hesabınızla giriş yapın.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Username */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Kullanıcı Adı
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="kullaniciadi@toyota.com"
                    required
                    autoComplete="username"
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB0A1E] focus:ring-2 focus:ring-[#EB0A1E]/10 focus:bg-white"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Şifre
                  </label>
                  <button
                    type="button"
                    className="text-xs font-medium transition"
                    style={{ color: '#EB0A1E' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#a50015')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#EB0A1E')}
                  >
                    Şifremi Unuttum
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full pl-4 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB0A1E] focus:ring-2 focus:ring-[#EB0A1E]/10 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 accent-[#EB0A1E] cursor-pointer"
                />
                <span className="text-sm text-gray-600">Beni Hatırla</span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                style={{ background: '#EB0A1E' }}
                onMouseEnter={e => !loading && ((e.currentTarget as HTMLButtonElement).style.background = '#a50015')}
                onMouseLeave={e => !loading && ((e.currentTarget as HTMLButtonElement).style.background = '#EB0A1E')}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Yönlendiriliyor...
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    Giriş Yap
                  </>
                )}
              </button>

            </form>

            <p className="mt-6 text-center text-xs text-gray-400 leading-relaxed">
              Kurumsal kimlik doğrulama sistemine yönlendirileceksiniz.
              <br />
              Sorun yaşıyorsanız IT Destek ile iletişime geçin.
            </p>
          </div>

          {/* Bottom badge */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="text-xs text-gray-400">
              Keycloak ile güvence altında · Toyota IT
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}
