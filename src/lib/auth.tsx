import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, ApiError, getToken, setToken } from "@/lib/api";

export interface AuthUser {
  name: string;
  email: string;
  role: string;
  initials: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "astrotur_user";

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw && getToken() ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function saveSession(user: AuthUser | null, token: string | null) {
  if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_KEY);
  setToken(token);
}

interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: "gestor" | "usuario";
}

const toAuthUser = (u: ApiUser): AuthUser => ({
  name: u.name,
  email: u.email,
  role: u.role === "gestor" ? "Gestor" : "Usuário",
  initials: u.name.trim()[0]?.toUpperCase() ?? "?",
});

interface AuthResponse {
  token: string;
  user: ApiUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser);

  // Revalida a sessão no servidor; token expirado ou inválido encerra a sessão
  useEffect(() => {
    if (!getToken()) return;
    api<{ user: ApiUser }>("/api/auth/me")
      .then(({ user }) => {
        const authUser = toAuthUser(user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
        setUser(authUser);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          saveSession(null, null);
          setUser(null);
        }
      });
  }, []);

  async function authenticate(path: string, body: unknown) {
    try {
      const { token, user: apiUser } = await api<AuthResponse>(path, {
        method: "POST",
        body: JSON.stringify(body),
      });
      const user = toAuthUser(apiUser);
      saveSession(user, token);
      setUser(user);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Erro inesperado." };
    }
  }

  const login = (email: string, password: string) =>
    authenticate("/api/auth/login", { email, password });

  const register = (name: string, email: string, password: string) =>
    authenticate("/api/auth/cadastro", { name, email, password });

  function logout() {
    saveSession(null, null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
