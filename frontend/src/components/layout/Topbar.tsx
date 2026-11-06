import { LogOut } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";

export default function Topbar() {
  const { session, logout } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <h1 className="text-lg font-semibold text-slate-800">Sistema de inventario</h1>
      <div className="flex items-center gap-4 text-sm text-slate-600">
        <span>
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