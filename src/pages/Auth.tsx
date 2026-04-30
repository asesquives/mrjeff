import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { MictioLogo } from "@/components/MictioLogo";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

export default function AuthPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Cuenta creada");
        nav("/");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav("/");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Error de autenticación");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-[380px] animate-fade-up">
        <div className="flex flex-col items-center mb-8">
          <MictioLogo size={44} />
          <h1 className="mt-4 text-[20px] font-bold tracking-tight">Mr Jeff · La Alborada</h1>
          <p className="text-[12px] text-muted mt-1">CRM operativo de lavandería</p>
        </div>

        <div className="mictio-card p-6">
          <div className="flex p-1 rounded-md border border-border mb-5">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 text-[12px] py-1.5 rounded transition-colors ${mode === "login" ? "bg-surface text-foreground" : "text-muted"}`}
            >Iniciar sesión</button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 text-[12px] py-1.5 rounded transition-colors ${mode === "signup" ? "bg-surface text-foreground" : "text-muted"}`}
            >Crear cuenta</button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="eyebrow block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-[13px] focus:outline-none focus:border-accent"
                required
              />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-[13px] focus:outline-none focus:border-accent"
                required
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-foreground text-background font-semibold text-[13px] py-2.5 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {busy ? "..." : mode === "login" ? "Entrar" : "Registrarme"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
