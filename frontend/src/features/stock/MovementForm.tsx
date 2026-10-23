import { useForm } from "react-hook-form";
import Input from "../../components/ui/Input";
import { useCreateMovement } from "./useStock";
import type { ProductRow } from "../../types/product";
import type { MovementType } from "../../types/stock";

interface MovementFormProps {
  product: ProductRow;
  type: MovementType;
  onSuccess: () => void;
}

interface FormValues {
  quantity: number;
}

export default function MovementForm({ product, type, onSuccess }: MovementFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();
  const { mutate, isPending, error } = useCreateMovement();
  const isIn = type === "IN";

  const onSubmit = (data: FormValues) => {
    mutate({ productId: product.id, type, quantity: data.quantity }, { onSuccess });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="rounded-lg bg-slate-50 p-3 text-sm">
        <div className="font-medium text-slate-800">{product.name}</div>
        <div className="text-slate-500">
          {product.code} · Stock actual: <strong>{product.stock}</strong>
        </div>
      </div>

      <Input
        label="Cantidad"
        type="number"
        min={1}
        step={1}
        autoFocus
        {...register("quantity", {
          required: "La cantidad es obligatoria",
          valueAsNumber: true,
          min: { value: 1, message: "La cantidad debe ser mayor que cero" },
        })}
        error={errors.quantity?.message}
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error.message}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
            isIn ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {isPending ? "Guardando..." : isIn ? "Registrar entrada" : "Registrar salida"}
        </button>
      </div>
    </form>
  );
}