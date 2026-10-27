import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import {
  Check,
  KeyRound,
  Moon,
  Pencil,
  Plus,
  Settings,
  Shield,
  Sun,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { PortalLayout } from "@/components/PortalLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Astrotur" }] }),
  component: SettingsPage,
});

type Role = "gestor" | "usuario";
type ManagedUser = { id: string; name: string; email: string; role: Role; active: boolean };

function SettingsPage() {
  const { user } = useAuth();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [profile, setProfile] = useState({ name: user?.name ?? "", email: user?.email ?? "" });
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [userDialog, setUserDialog] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("astrotur_theme");
    const next = stored === "dark" ? "dark" : "light";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }, []);

  useEffect(() => {
    if (user) setProfile({ name: user.name, email: user.email });
  }, [user]);

  useEffect(() => {
    if (user?.role !== "gestor") return;
    api<{ users: ManagedUser[] }>("/api/admin/users")
      .then(({ users: nextUsers }) => setUsers(nextUsers))
      .catch((error: Error) => toast.error(error.message));
  }, [user?.role]);

  function changeTheme(next: "light" | "dark") {
    setTheme(next);
    localStorage.setItem("astrotur_theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await api("/api/me/profile", { method: "PUT", body: JSON.stringify(profile) });
      toast.success("Perfil atualizado com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o perfil.");
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api("/api/me/password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: form.get("currentPassword"),
          newPassword: form.get("newPassword"),
          confirmPassword: form.get("confirmPassword"),
        }),
      });
      event.currentTarget.reset();
      toast.success("Senha alterada com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível alterar a senha.");
    }
  }

  async function refreshUsers() {
    const result = await api<{ users: ManagedUser[] }>("/api/admin/users");
    setUsers(result.users);
  }

  async function updateRole(id: string, role: Role) {
    try {
      await api(`/api/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) });
      await refreshUsers();
      toast.success("Papel atualizado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o papel.");
    }
  }

  async function deleteUser() {
    if (!deleteTarget) return;
    try {
      await api(`/api/admin/users/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      await refreshUsers();
      toast.success("Usuário inativado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível inativar o usuário.");
    }
  }

  if (!user) {
    return <PortalLayout><p className="mx-auto max-w-6xl text-muted-foreground">Faça login para acessar suas configurações.</p></PortalLayout>;
  }

  return (
    <PortalLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3 text-primary"><Settings className="h-6 w-6" /></div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Configurações</h1>
              <p className="mt-1 text-sm text-muted-foreground">Personalize sua conta e gerencie os acessos do portal.</p>
            </div>
          </div>
        </header>

        <Tabs defaultValue="perfil" orientation="vertical" className="flex flex-col gap-6 lg:flex-row">
          <TabsList className="h-auto w-full shrink-0 flex-col items-stretch justify-start gap-1 bg-transparent p-0 lg:w-64">
            <TabsTrigger value="perfil" className="justify-start gap-3 px-4 py-3 data-[state=active]:bg-card"><UserRound className="h-4 w-4" />Meu perfil</TabsTrigger>
            <TabsTrigger value="aparencia" className="justify-start gap-3 px-4 py-3 data-[state=active]:bg-card"><Sun className="h-4 w-4" />Aparência e preferências</TabsTrigger>
            {user.role === "gestor" && <TabsTrigger value="usuarios" className="justify-start gap-3 px-4 py-3 data-[state=active]:bg-card"><Users className="h-4 w-4" />Usuários e acessos</TabsTrigger>}
          </TabsList>

          <div className="min-w-0 flex-1">
            <TabsContent value="perfil" className="mt-0 space-y-6">
              <Card><CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5 text-primary" />Dados pessoais</CardTitle></CardHeader><CardContent>
                <form onSubmit={saveProfile} className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="name">Nome</Label><Input id="name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required /></div>
                  <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} required /></div>
                  <div className="md:col-span-2"><Button type="submit">Salvar alterações</Button></div>
                </form>
              </CardContent></Card>
              <Card><CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" />Alterar senha</CardTitle></CardHeader><CardContent>
                <form onSubmit={changePassword} className="grid gap-4 md:grid-cols-3">
                  <PasswordField id="currentPassword" label="Senha atual" />
                  <PasswordField id="newPassword" label="Nova senha" minLength={8} />
                  <PasswordField id="confirmPassword" label="Confirmar nova senha" minLength={8} />
                  <div className="md:col-span-3"><Button type="submit">Atualizar senha</Button></div>
                </form>
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="aparencia" className="mt-0">
              <Card><CardHeader><CardTitle>Aparência e preferências</CardTitle></CardHeader><CardContent>
                <div className="flex flex-col justify-between gap-4 rounded-lg border p-4 sm:flex-row sm:items-center">
                  <div><p className="font-medium">Tema do portal</p><p className="text-sm text-muted-foreground">A escolha fica salva neste dispositivo.</p></div>
                  <div className="flex gap-2">
                    <Button type="button" variant={theme === "light" ? "default" : "outline"} onClick={() => changeTheme("light")}><Sun className="mr-2 h-4 w-4" />Claro</Button>
                    <Button type="button" variant={theme === "dark" ? "default" : "outline"} onClick={() => changeTheme("dark")}><Moon className="mr-2 h-4 w-4" />Escuro</Button>
                  </div>
                </div>
              </CardContent></Card>
            </TabsContent>

            {user.role === "gestor" && <TabsContent value="usuarios" className="mt-0">
              <Card><CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Usuários e acessos</CardTitle><p className="mt-1 text-sm text-muted-foreground">Controle quem pode acessar o portal.</p></div><Button onClick={() => { setEditing(null); setUserDialog("create"); }}><Plus className="mr-2 h-4 w-4" />Criar usuário</Button></CardHeader><CardContent>
                <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead><tr className="border-b text-xs uppercase text-muted-foreground"><th className="px-3 py-3">Usuário</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Papel</th><th className="px-3 py-3 text-right">Ações</th></tr></thead><tbody>
                  {users.map((managed) => <tr key={managed.id} className="border-b last:border-0"><td className="px-3 py-4"><p className="font-medium">{managed.name}</p><p className="text-muted-foreground">{managed.email}</p></td><td className="px-3 py-4"><Badge variant={managed.active ? "default" : "secondary"}>{managed.active ? "Ativo" : "Inativo"}</Badge></td><td className="px-3 py-4"><Select value={managed.role} onValueChange={(value) => updateRole(managed.id, value as Role)}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="gestor">Gestor</SelectItem><SelectItem value="usuario">Usuário</SelectItem></SelectContent></Select></td><td className="px-3 py-4 text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" aria-label="Editar usuário" onClick={() => { setEditing(managed); setUserDialog("edit"); }}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" aria-label="Inativar usuário" onClick={() => setDeleteTarget(managed)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></td></tr>)}
                </tbody></table></div>
              </CardContent></Card>
            </TabsContent>}
          </div>
        </Tabs>
      </div>
      <UserDialog mode={userDialog} user={editing} onClose={() => setUserDialog(null)} onSaved={async () => { setUserDialog(null); await refreshUsers(); }} />
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}><DialogContent><DialogHeader><DialogTitle>Inativar usuário?</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">O acesso de {deleteTarget?.name} será bloqueado, mas o cadastro será preservado.</p><DialogFooter><Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button><Button variant="destructive" onClick={deleteUser}>Inativar</Button></DialogFooter></DialogContent></Dialog>
    </PortalLayout>
  );
}

function PasswordField({ id, label, minLength }: { id: string; label: string; minLength?: number }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} name={id} type="password" minLength={minLength} required /></div>;
}

function UserDialog({ mode, user, onClose, onSaved }: { mode: "create" | "edit" | null; user: ManagedUser | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  useEffect(() => setSaving(false), [mode, user]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = mode === "create"
      ? { name: form.get("name"), email: form.get("email"), password: form.get("password"), role: form.get("role") }
      : { name: form.get("name"), email: form.get("email"), is_active: form.get("is_active") === "true" };
    setSaving(true);
    try {
      await api(mode === "create" ? "/api/admin/users" : `/api/admin/users/${user?.id}`, { method: mode === "create" ? "POST" : "PUT", body: JSON.stringify(body) });
      toast.success(mode === "create" ? "Usuário criado." : "Usuário atualizado.");
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o usuário.");
    } finally { setSaving(false); }
  }
  return <Dialog open={Boolean(mode)} onOpenChange={(open) => !open && onClose()}><DialogContent><DialogHeader><DialogTitle>{mode === "create" ? "Criar usuário" : "Editar usuário"}</DialogTitle></DialogHeader><form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="managed-name">Nome</Label><Input id="managed-name" name="name" defaultValue={user?.name} required /></div><div className="space-y-2"><Label htmlFor="managed-email">E-mail</Label><Input id="managed-email" name="email" type="email" defaultValue={user?.email} required /></div>{mode === "create" ? <><div className="space-y-2"><Label htmlFor="managed-password">Senha inicial</Label><Input id="managed-password" name="password" type="password" minLength={8} required /></div><div className="space-y-2"><Label>Papel</Label><Select name="role" defaultValue="usuario"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="gestor">Gestor</SelectItem><SelectItem value="usuario">Usuário</SelectItem></SelectContent></Select></div></> : <div className="space-y-2"><Label>Status</Label><Select name="is_active" defaultValue={user?.active ? "true" : "false"}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="true">Ativo</SelectItem><SelectItem value="false">Inativo</SelectItem></SelectContent></Select></div>}<DialogFooter><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "Salvando..." : <><Check className="mr-2 h-4 w-4" />Salvar</>}</Button></DialogFooter></form></DialogContent></Dialog>;
}
