import { NavLink } from "react-router-dom";
import { LayoutDashboard, Package, History, type LucideIcon } from "lucide-react";

interface SidebarLink {
  to: string;
  label: string;
  icon: LucideIcon;
}

const links: SidebarLink[] = [
  { to: "/", label: "Inicio", icon: LayoutDashboard },
  { to: "/productos", label: "Productos", icon: Package },
  { to: "/movimientos", label: "Movimientos", icon: History },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-60 flex-col bg-slate-900 text-slate-300">
      <div className="h-16 flex items-center px-6 text-lg font-bold text-white border-b border-slate-800">
        📦 Almacén
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-800 hover:text-white"
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