import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import Input from "../components/ui/Input";
import { useAuth } from "../features/auth/AuthContext";
import type { LoginInput } from "../types/auth";

export default function LoginPage() {
  const { session, login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>();

  if (session) return <Navigate to="/" replace />;

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    setPending(true);
    try {
      await login(data);
      navigate("/", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar sesión");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-4 rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div className="text-center">
          <div className="text-3xl">📦</div>
          <h1 className="mt-2 text-xl font-bold text-slate-800">Almacén</h1>
          <p className="text-sm text-slate-500">Inicia sesión para continuar</p>
        </div>

        <Input
          label="Usuario"
          autoFocus
          autoComplete="username"
          {...register("username", { required: "El usuario es obligatorio" })}
          error={errors.username?.message}
        />

        <Input
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          {...register("password", { required: "La contraseña es obligatoria" })}
          error={errors.password?.message}
        />

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}