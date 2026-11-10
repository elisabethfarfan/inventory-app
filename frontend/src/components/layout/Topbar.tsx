import { LogOut, Menu } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";

export default function Topbar({ onMenu }: { onMenu: () => void }) {
  const { session, logout } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenu}
          aria-label="Abrir menú"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
        >
          <Menu size={22} />
        </button>
        <h1 className="text-lg font-semibold text-slate-800">
          <span className="hidden sm:inline">Sistema de inventario</span>
          <span className="sm:hidden">Almacén</span>
        </h1>
      </div>

      <div className="flex items-center gap-3 text-sm text-slate-600">
        <span className="hidden sm:inline">
          {session?.fullName}{" "}
          <span className="text-xs text-slate-400">({session?.role})</span>
        </span>
        <button
          onClick={logout}
          className="flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <LogOut size={14} /> Salir
        </button>
      </div>
    </header>
  );
}