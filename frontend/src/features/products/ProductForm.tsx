import { useState } from "react";
import { useForm } from "react-hook-form";
import Input from "../../components/ui/Input";
import { useCreateProduct, useUpdateProduct } from "./useProducts";
import { FRACTIONS } from "../../types/product";
import type { Product, ProductInput } from "../../types/product";

interface ProductFormProps {
  product?: Product;
  onSuccess: () => void;
}

interface FormValues {
  code: string;
  name: string;
  description: string;
  barcode: string;
  cost: string;
  margin: string;
  price: string;
  minPrice: string;
  active: boolean;
  fractionable: boolean;
  fr: Record<string, { on: boolean; list: string; min: string }>;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const num = (s: string) => (s.trim() === "" ? NaN : Number(s));

export default function ProductForm({ product, onSuccess }: ProductFormProps) {
  const isEdit = !!product;
  const [localError, setLocalError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } =
    useForm<FormValues>({
      defaultValues: {
        code: product?.code ?? "",
        name: product?.name ?? "",
        description: product?.description ?? "",
        barcode: product?.barcode ?? "",
        cost: product?.cost != null ? String(product.cost) : "",
        margin: product?.marginPercent != null ? String(product.marginPercent) : "",
        price: product ? String(product.price) : "",
        minPrice: product?.minPrice != null ? String(product.minPrice) : "",
        active: product?.active ?? true,
        fractionable: product?.fractionable ?? false,
        fr: Object.fromEntries(
          FRACTIONS.map((f) => {
            const x = product?.fractions?.find((p) => p.fraction === f.code);
            return [
              f.code,
              {
                on: !!x,
                list: x ? String(x.listPrice) : "",
                min: x ? String(x.minPrice) : "",
              },
            ];
          })
        ),
      },
    });

  const create = useCreateProduct();
  const update = useUpdateProduct();
  const { isPending, error } = isEdit ? update : create;

  const cost = num(watch("cost"));
  const price = num(watch("price"));
  const minPrice = num(watch("minPrice"));

  const profit = !isNaN(cost) && !isNaN(price) ? round2(price - cost) : null;
  const floorProfit = !isNaN(cost) && !isNaN(minPrice) ? round2(minPrice - cost) : null;

  const onMarginChange = (value: string) => {
    const m = num(value);
    const c = num(watch("cost"));
    if (!isNaN(m) && !isNaN(c) && c > 0) {
      setValue("price", String(round2(c * (1 + m / 100))));
    }
  };

  const onPriceChange = (value: string) => {
    const p = num(value);
    const c = num(watch("cost"));
    if (!isNaN(p) && !isNaN(c) && c > 0) {
      setValue("margin", String(round2(((p - c) / c) * 100)));
    }
  };

  const onCostChange = (value: string) => {
    const c = num(value);
    const m = num(watch("margin"));
    if (!isNaN(c) && !isNaN(m) && c > 0) {
      setValue("price", String(round2(c * (1 + m / 100))));
    }
  };

  const money = (v: number | null) => (v === null ? "—" : `S/ ${v.toFixed(2)}`);
  const tone = (v: number | null) =>
    v === null ? "text-slate-400" : v < 0 ? "text-red-600" : "text-green-600";

  const onSubmit = (d: FormValues) => {
    setLocalError(null);

    const min = d.minPrice.trim() === "" ? null : Number(d.minPrice);
    if (min !== null && min > Number(d.price)) {
      setLocalError("El precio mínimo no puede ser mayor que el precio de lista");
      return;
    }

    const fractions = d.fractionable
      ? FRACTIONS.filter((f) => d.fr[f.code].on).map((f) => ({
          fraction: f.code,
          listPrice: Number(d.fr[f.code].list),
          minPrice: d.fr[f.code].min.trim() === "" ? null : Number(d.fr[f.code].min),
        }))
      : [];

    if (d.fractionable) {
      if (fractions.length === 0) {
        setLocalError("Marca al menos una fracción y pon su precio");
        return;
      }
      if (fractions.some((f) => !(f.listPrice > 0))) {
        setLocalError("Cada fracción marcada necesita un precio de lista");
        return;
      }
    }

    const payload: ProductInput = {
      code: d.code,
      name: d.name,
      description: d.description || null,
      barcode: d.barcode || null,
      cost: d.cost.trim() === "" ? null : Number(d.cost),
      price: Number(d.price),
      minPrice: min,
      active: d.active,
      fractionable: d.fractionable,
      fractions,
    };

    if (product) update.mutate({ id: product.id, data: payload }, { onSuccess });
    else create.mutate(payload, { onSuccess });
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
          onKeyDown={(e) => {
            // El lector envía Enter al terminar: no enviar el formulario
            if (e.key === "Enter") e.preventDefault();
          }}
          {...register("barcode")}
        />
      </div>

      <Input
        label="Nombre"
        {...register("name", { required: "El nombre es obligatorio" })}
        error={errors.name?.message}
      />

      <Input label="Descripción" {...register("description")} />

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Costo de compra"
            type="number"
            step="0.01"
            min="0"
            {...register("cost", { onChange: (e) => onCostChange(e.target.value) })}
          />
          <Input
            label="Margen %"
            type="number"
            step="0.01"
            {...register("margin", { onChange: (e) => onMarginChange(e.target.value) })}
          />
          <Input
            label="Precio de lista"
            type="number"
            step="0.01"
            min="0"
            {...register("price", {
              required: "El precio es obligatorio",
              onChange: (e) => onPriceChange(e.target.value),
            })}
            error={errors.price?.message}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-slate-500">Ganancia por unidad (a precio de lista)</span>
          <span className={`font-semibold ${tone(profit)}`}>{money(profit)}</span>
        </div>

        <div className="mt-4 border-t border-slate-200 pt-4">
          <div className="grid grid-cols-2 items-end gap-3">
            <Input
              label="Precio mínimo de venta (opcional)"
              type="number"
              step="0.01"
              min="0"
              {...register("minPrice")}
            />
            <div className="pb-2 text-sm">
              <div className="text-slate-500">Ganancia en el piso</div>
              <div className={`font-semibold ${tone(floorProfit)}`}>{money(floorProfit)}</div>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Es lo mínimo que el vendedor puede cobrar. Si lo dejas vacío, no podrá
            rebajar el precio de lista.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" {...register("fractionable")} />
          Se vende fraccionado (pinturas, etc.)
        </label>

        {watch("fractionable") && (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-[70px_1fr_1fr] gap-3 text-xs text-slate-500">
              <span>Fracción</span>
              <span>Precio de lista</span>
              <span>Mínimo (opcional)</span>
            </div>
            {FRACTIONS.map((f) => (
              <div key={f.code} className="grid grid-cols-[70px_1fr_1fr] items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register(`fr.${f.code}.on` as const)} />
                  {f.label}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="S/"
                  {...register(`fr.${f.code}.list` as const)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="S/"
                  {...register(`fr.${f.code}.min` as const)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" {...register("active")} />
        Producto activo
      </label>

      {(localError || error) && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {localError ?? error?.message}
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