import { useForm } from "react-hook-form";
import Input from "../../components/ui/Input";
import { useCreateProduct, useUpdateProduct } from "./useProducts";
import type { Product, ProductInput } from "../../types/product";

interface ProductFormProps {
  product?: Product; // si viene, es edición
  onSuccess: () => void;
}

export default function ProductForm({ product, onSuccess }: ProductFormProps) {
  const isEdit = !!product;

  const { register, handleSubmit, formState: { errors } } = useForm<ProductInput>({
    defaultValues: product
      ? {
          code: product.code,
          name: product.name,
          description: product.description ?? "",
          barcode: product.barcode ?? "",
          price: product.price,
          active: product.active,
        }
      : { active: true },
  });

  const create = useCreateProduct();
  const update = useUpdateProduct();
  const { isPending, error } = isEdit ? update : create;

  const onSubmit = (data: ProductInput) => {
    const payload: ProductInput = {
      ...data,
      price: Number(data.price),
      barcode: data.barcode || null,
      description: data.description || null,
    };

    if (product) {
      update.mutate({ id: product.id, data: payload }, { onSuccess });
    } else {
      create.mutate(payload, { onSuccess });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Código"
          {...register("code", { required: "El código es obligatorio" })}
          error={errors.code?.message}
        />
        <Input label="Código de barras" {...register("barcode")} />
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
          {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Guardar producto"}
        </button>
      </div>
    </form>
  );
}