import { createContext, useContext, useState, type ReactNode } from "react";

export interface AuthUser {
  name: string;
  email: string;
  role: string;
  initials: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  loginAsAdmin: () => void;
  loginAsUser: () => void;
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Credenciais fixas do administrador
const ADMIN: AuthUser = {
  name: "Administrador",
  email: "adm@astroturviagens.com",
  role: "Gestor",
  initials: "A",
};

// Usuário demo para testes
const DEMO_USER: AuthUser = {
  name: "Maria Silva",
  email: "maria.silva@astroturviagens.com",
  role: "Usuário",
  initials: "M",
};

const ADMIN_PASSWORD = "adm@2024";
const DEMO_PASSWORD = "usuario@2024";

const STORAGE_KEY = "astrotur_user";

function loadUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function saveUser(user: AuthUser | null) {
  if (user) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else sessionStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser);

  function loginAsAdmin() {
    saveUser(ADMIN);
    setUser(ADMIN);
  }

  function loginAsUser() {
    saveUser(DEMO_USER);
    setUser(DEMO_USER);
  }

  async function login(email: string, password: string) {
    if (
      email.trim().toLowerCase() === ADMIN.email &&
      password === ADMIN_PASSWORD
    ) {
      saveUser(ADMIN);
      setUser(ADMIN);
      return { ok: true };
    }
    if (
      email.trim().toLowerCase() === DEMO_USER.email &&
      password === DEMO_PASSWORD
    ) {
      saveUser(DEMO_USER);
      setUser(DEMO_USER);
      return { ok: true };
    }
    // TODO: integrar com API de autenticação real
    return { ok: false, error: "E-mail ou senha inválidos." };
  }

  async function register(name: string, email: string, _password: string) {
    if (!name.trim() || !email.trim()) {
      return { ok: false, error: "Preencha todos os campos." };
    }
    // TODO: integrar com API de cadastro real
    const newUser: AuthUser = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: "Usuário",
      initials: name.trim()[0].toUpperCase(),
    };
    saveUser(newUser);
    setUser(newUser);
    return { ok: true };
  }

  function logout() {
    saveUser(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, loginAsAdmin, loginAsUser, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
