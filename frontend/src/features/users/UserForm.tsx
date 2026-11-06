import { useForm } from "react-hook-form";
import Input from "../../components/ui/Input";
import { useCreateUser, useUpdateUser } from "./useUsers";
import type { User } from "../../types/user";
import type { Role } from "../../types/auth";

interface UserFormProps {
  user?: User;
  onSuccess: () => void;
}

interface FormValues {
  username: string;
  fullName: string;
  password: string;
  role: Role;
  active: boolean;
}

export default function UserForm({ user, onSuccess }: UserFormProps) {
  const isEdit = !!user;

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: user
      ? { username: user.username, fullName: user.fullName, password: "", role: user.role, active: user.active }
      : { role: "OPERATOR", active: true },
  });

  const create = useCreateUser();
  const update = useUpdateUser();
  const { isPending, error } = isEdit ? update : create;

  const onSubmit = (d: FormValues) => {
    if (user) {
      update.mutate(
        {
          id: user.id,
          data: {
            fullName: d.fullName,
            role: d.role,
            active: d.active,
            password: d.password || undefined,
          },
        },
        { onSuccess }
      );
    } else {
      create.mutate(
        { username: d.username, fullName: d.fullName, password: d.password, role: d.role },
        { onSuccess }
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Usuario"
        disabled={isEdit}
        {...register("username", { required: "El usuario es obligatorio" })}
        error={errors.username?.message}
      />
      <Input
        label="Nombre completo"
        {...register("fullName", { required: "El nombre es obligatorio" })}
        error={errors.fullName?.message}
      />
      <Input
        label={isEdit ? "Nueva contraseña (opcional)" : "Contraseña"}
        type="password"
        autoComplete="new-password"
        {...register("password", {
          required: isEdit ? false : "La contraseña es obligatoria",
          minLength: { value: 8, message: "Mínimo 8 caracteres" },
          validate: (v) => v === "" || v.length >= 8 || "Mínimo 8 caracteres",
        })}
        error={errors.password?.message}
      />

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Rol</span>
        <select
          {...register("role")}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="OPERATOR">Operador</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </label>

      {isEdit && (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" {...register("active")} />
          Usuario activo
        </label>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error.message}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear usuario"}
        </button>
      </div>
    </form>
  );
}