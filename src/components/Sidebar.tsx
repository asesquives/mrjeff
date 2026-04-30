import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, ClipboardList, Users, Wallet, UserCog, Sun, Moon, LogOut } from "lucide-react";
import { MictioLogo } from "./MictioLogo";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/orders", label: "Órdenes", icon: ClipboardList },
  { to: "/clients", label: "Clientes", icon: Users },
  { to: "/cash", label: "Caja", icon: Wallet },
  { to: "/operators", label: "Operadores", icon: UserCog },
];

export const Sidebar = () => {
  const { theme, setTheme } = useTheme();
  const { signOut, user } = useAuth();
  const { pathname } = useLocation();

  return (
    <aside
      className="w-[200px] shrink-0 h-screen sticky top-0 flex flex-col"
      style={{
        background: "hsl(var(--background))",
        borderRight: "1px solid hsl(var(--border))",
      }}
    >
      <div className="px-4 py-5 flex items-center gap-2.5">
        <MictioLogo size={28} />
        <div className="flex flex-col leading-tight">
          <span className="text-[13px] font-bold tracking-tight">Mr Jeff</span>
          <span className="text-[10px] text-muted">La Alborada</span>
        </div>
      </div>

      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {items.map((it) => {
          const active = pathname === it.to || (it.to !== "/" && pathname.startsWith(it.to));
          return (
            <NavLink
              key={it.to}
              to={it.to}
              className={`flex items-center gap-2.5 text-[13px] px-3 py-2 rounded-md transition-colors ${
                active
                  ? "text-foreground bg-surface border-l-2 border-accent font-medium"
                  : "text-muted hover:text-foreground hover:bg-surface/60"
              }`}
              style={active ? { borderLeftWidth: 2, borderLeftStyle: "solid", borderLeftColor: "hsl(var(--accent))" } : undefined}
            >
              <it.icon size={15} />
              <span>{it.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="px-3 pb-3 space-y-2">
        {/* theme toggle */}
        <div className="flex p-1 rounded-md border border-border bg-background">
          <button
            onClick={() => setTheme("light")}
            className={`flex-1 flex items-center justify-center gap-1 text-[11px] py-1.5 rounded transition-colors ${
              theme === "light" ? "bg-surface text-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            <Sun size={12} /> Light
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`flex-1 flex items-center justify-center gap-1 text-[11px] py-1.5 rounded transition-colors ${
              theme === "dark" ? "bg-surface text-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            <Moon size={12} /> Dark
          </button>
        </div>

        {user && (
          <div className="text-[10px] text-muted truncate px-1" title={user.email ?? ""}>
            {user.email}
          </div>
        )}

        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 text-[12px] text-muted hover:text-foreground px-2 py-1.5 rounded-md hover:bg-surface transition-colors"
        >
          <LogOut size={13} /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
};
