import { NavLink } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
  import { LayoutDashboard, Package, History, Users, ShoppingCart, type LucideIcon } from "lucide-react";
import { Paintbrush } from "lucide-react"; // súmalo al import de lucide-react

interface SidebarLink {
  to: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

const links: SidebarLink[] = [
  { to: "/", label: "Inicio", icon: LayoutDashboard },
  { to: "/productos", label: "Productos", icon: Package },
  { to: "/movimientos", label: "Movimientos", icon: History },
  { to: "/usuarios", label: "Usuarios", icon: Users, adminOnly: true },
  { to: "/ventas", label: "Ventas", icon: ShoppingCart },
  { to: "/baldes", label: "Baldes abiertos", icon: Paintbrush },
];

export default function Sidebar() {
  const { session } = useAuth();
  const visible = links.filter((l) => !l.adminOnly || session?.role === "ADMIN");

  return (
    <aside className="hidden md:flex w-60 flex-col bg-slate-900 text-slate-300">
      <div className="h-16 flex items-center px-6 text-lg font-bold text-white border-b border-slate-800">
        📦 Almacén
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {visible.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive ? "bg-blue-600 text-white" : "hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}