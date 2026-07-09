import { createContext, useEffect, useState, type ReactNode } from 'react';
import keycloak from './keycloak';

interface AuthUser {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  token: string | undefined;
  user: AuthUser | null;
  roles: string[];
  login: () => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

let initPromise: Promise<boolean> | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    if (!initPromise) {
      initPromise = keycloak.init({ onLoad: 'check-sso', checkLoginIframe: false });
    }

    initPromise
      .then((authenticated) => {
        setIsAuthenticated(authenticated);

        if (authenticated) {
          const parsed = keycloak.tokenParsed;
          setToken(keycloak.token);
          setUser({
            id: parsed?.sub ?? '',
            username: parsed?.preferred_username ?? '',
            email: parsed?.email,
            firstName: parsed?.given_name,
            lastName: parsed?.family_name,
          });

          console.log('[Keycloak] tokenParsed:', parsed);

          const realmRoles: string[] = parsed?.realm_access?.roles ?? [];
          const clientRoles: string[] = parsed?.resource_access?.['itsm-frontend']?.roles ?? [];
          const normalized = [...new Set([...realmRoles, ...clientRoles])].map(r => r.toUpperCase());

          console.log('[Keycloak] okunan roller (normalized):', normalized);
          setRoles(normalized);
        }
      })
      .catch((err) => {
        console.error('[Keycloak] init failed:', err);
      })
      .finally(() => setLoading(false));

    keycloak.onTokenExpired = () => {
      keycloak.updateToken(30).catch(() => keycloak.logout());
    };
  }, []);

  const login = () => keycloak.login();
  const logout = () =>
    keycloak.logout({ redirectUri: window.location.origin + '/login' });

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, token, user, roles, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
