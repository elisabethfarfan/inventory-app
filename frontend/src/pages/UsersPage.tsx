import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import UserForm from "../features/users/UserForm";
import { useUsers } from "../features/users/useUsers";
import type { User } from "../types/user";

export default function UsersPage() {
  const { data, isLoading, isError, error } = useUsers();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Usuarios</h2>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} /> Nuevo usuario
        </button>
      </div>

      {isLoading && <p className="text-slate-500">Cargando usuarios...</p>}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error.message}
        </div>
      )}

      {data && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-slate-700">{u.username}</td>
                  <td className="px-4 py-3 text-slate-800">{u.fullName}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.role === "ADMIN" ? "warning" : "neutral"}>
                      {u.role === "ADMIN" ? "Administrador" : "Operador"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.active ? "success" : "neutral"}>
                      {u.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        onClick={() => setEditing(u)}
                        className="flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Pencil size={14} /> Editar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={creating} title="Nuevo usuario" onClose={() => setCreating(false)}>
        <UserForm onSuccess={() => setCreating(false)} />
      </Modal>

      <Modal open={editing !== null} title="Editar usuario" onClose={() => setEditing(null)}>
        {editing && (
          <UserForm key={editing.id} user={editing} onSuccess={() => setEditing(null)} />
        )}
      </Modal>
    </div>
  );
}