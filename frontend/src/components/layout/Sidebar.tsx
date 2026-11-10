import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Package, History, Users, ShoppingCart, Paintbrush, Handshake, X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";

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
  { to: "/ventas", label: "Ventas", icon: ShoppingCart },
  { to: "/baldes", label: "Baldes abiertos", icon: Paintbrush },
  { to: "/prestamos", label: "Préstamos", icon: Handshake, adminOnly: true },
  { to: "/usuarios", label: "Usuarios", icon: Users, adminOnly: true },
];

function Menu({ onNavigate }: { onNavigate?: () => void }) {
  const { session } = useAuth();
  const visible = links.filter((l) => !l.adminOnly || session?.role === "ADMIN");

  return (
    <nav className="flex-1 space-y-1 p-3">
      {visible.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          onClick={onNavigate}
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
  );
}

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  return (
    <>
      <aside className="hidden w-60 flex-col bg-slate-900 text-slate-300 md:flex">
        <div className="flex h-16 items-center border-b border-slate-800 px-6 text-lg font-bold text-white">
          📦 Almacén
        </div>
        <Menu />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={onClose}>
          <div className="absolute inset-0 bg-black/40" />
          <aside
            className="absolute left-0 top-0 flex h-full w-64 flex-col bg-slate-900 text-slate-300 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-16 items-center justify-between border-b border-slate-800 px-6 text-lg font-bold text-white">
              <span>📦 Almacén</span>
              <button onClick={onClose} aria-label="Cerrar menú" className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <Menu onNavigate={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}