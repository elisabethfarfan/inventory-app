import { useForm } from "react-hook-form";
import Input from "../../components/ui/Input";
import { useCreateProduct } from "./useProducts";
import type { ProductInput } from "../../types/product";

interface ProductFormProps {
  onSuccess: () => void;
}

export default function ProductForm({ onSuccess }: ProductFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<ProductInput>({
    defaultValues: { active: true },
  });
  const { mutate, isPending, error } = useCreateProduct();

  const onSubmit = (data: ProductInput) => {
    mutate(
      { ...data, price: Number(data.price), barcode: data.barcode || null },
      { onSuccess }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Código"
          {...register("code", { required: "El código es obligatorio" })}
          error={errors.code?.message}
        />
        <Input
          label="Código de barras"
          {...register("barcode")}
        />
      </div>

      <Input
        label="Nombre"
        {...register("name", { required: "El nombre es obligatorio" })}
        error={errors.name?.message}
      />

      <Input label="Descripción" {...register("description")} />

      <Input
        label="Precio"
        type="number"
        step="0.01"
        {...register("price", { required: "El precio es obligatorio" })}
        error={errors.price?.message}
      />

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" {...register("active")} />
        Producto activo
      </label>

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
          {isPending ? "Guardando..." : "Guardar producto"}
        </button>
      </div>
    </form>
  );
}