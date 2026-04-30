import { Outlet, Navigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/lib/auth";

export const AppLayout = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted text-sm">Cargando…</div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar />
      <main className="flex-1 min-w-0 px-8 py-8 max-w-[1400px]">
        <Outlet />
      </main>
    </div>
  );
};
