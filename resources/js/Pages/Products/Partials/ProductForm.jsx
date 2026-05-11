import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppSelect from '@/components/ui/AppSelect';
import { cn } from '@/lib/utils';
import VariantsManager from './VariantsManager';

const UNITS = ['un', 'kg', 'm', 'm²', 'm³', 'lt', 'caja', 'par', 'rollo', 'bolsa', 'set'];
const IVA_RATES = [0, 10.5, 21, 27];

function Field({ label, error, children, required }) {
    return (
        <div>
            <Label className={cn('mb-1 block', required && "after:content-['*'] after:text-red-400 after:ml-0.5")}>
                {label}
            </Label>
            {children}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}

function SectionTitle({ children }) {
    return (
        <h3 className="font-semibold text-[#2B2B2B] text-sm border-b border-[#D3D3D3]/60 pb-2 mb-4">
            {children}
        </h3>
    );
}

export default function ProductForm({
    initialData,
    categories,
    brands,
    attributeTypes,
    warehouses,
    submitUrl,
    method = 'post',
    onSuccess,
}) {
    const isEdit = method === 'put';

    const flatCategories = categories.flatMap(c => [
        { id: c.id, name: c.name, depth: 0 },
        ...(c.children ?? []).map(ch => ({ id: ch.id, name: ch.name, depth: 1 })),
    ]);

    const defaultVariant = {
        _key: 'default',
        id: null,
        sku: '',
        barcode: '',
        cost_price: '',
        sale_price: '',
        is_active: true,
        attribute_value_ids: [],
        stock: {},
    };

    const [form, setForm] = useState({
        name: initialData?.name ?? '',
        code: initialData?.code ?? '',
        barcode: initialData?.barcode ?? '',
        category_id: initialData?.category_id ?? '',
        brand_id: initialData?.brand_id ?? '',
        type: initialData?.type ?? 'simple',
        unit: initialData?.unit ?? 'un',
        min_stock: initialData?.min_stock ?? 0,
        has_iva: initialData?.has_iva ?? true,
        iva_rate: initialData?.iva_rate ?? 21,
        is_active: initialData?.is_active ?? true,
        description: initialData?.description ?? '',
        variants: initialData?.variants?.length
            ? initialData.variants.map(v => ({ ...v, _key: v.id?.toString() ?? Math.random().toString(36).slice(2) }))
            : [defaultVariant],
        bundle_components: initialData?.bundle_components ?? [],
    });

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    function setField(key, value) {
        setForm(f => ({ ...f, [key]: value }));
        if (errors[key]) setErrors(e => { const n = { ...e }; delete n[key]; return n; });
    }

    function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);

        const payload = {
            ...form,
            variants: form.variants.map(v => ({
                ...v,
                stock: Object.fromEntries(
                    Object.entries(v.stock).filter(([, qty]) => qty !== '' && Number(qty) > 0)
                ),
            })),
        };

        const callbacks = {
            onError: (errs) => { setErrors(errs); setSubmitting(false); },
            onSuccess: () => { setSubmitting(false); onSuccess?.(); },
        };
        if (method === 'put') {
            router.put(submitUrl, payload, callbacks);
        } else {
            router.post(submitUrl, payload, callbacks);
        }
    }

    const isBundle = form.type === 'bundle';
    const isVariant = form.type === 'variant';

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            {/* Información general */}
            <div className="bg-white border border-[#D3D3D3] rounded-xl p-5">
                <SectionTitle>Información general</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                        <Field label="Nombre del producto" error={errors.name} required>
                            <Input
                                value={form.name}
                                onChange={e => setField('name', e.target.value)}
                                placeholder="Ej: Cable eléctrico tipo taller 2x1"
                                className={errors.name ? 'border-red-400' : ''}
                            />
                        </Field>
                    </div>

                    <Field label="Código interno" error={errors.code} required>
                        <Input
                            value={form.code}
                            onChange={e => setField('code', e.target.value)}
                            placeholder="Ej: CABLE-001"
                            className={errors.code ? 'border-red-400' : ''}
                        />
                    </Field>

                    <Field label="Código de barras" error={errors.barcode}>
                        <Input
                            value={form.barcode}
                            onChange={e => setField('barcode', e.target.value)}
                            placeholder="Opcional"
                        />
                    </Field>

                    <Field label="Categoría" error={errors.category_id} required>
                        <AppSelect
                            value={form.category_id}
                            onValueChange={val => setField('category_id', val)}
                            options={flatCategories.map(c => ({
                                value: c.id,
                                label: c.depth > 0 ? `  ${c.name}` : c.name,
                            }))}
                            placeholder="Seleccionar categoría…"
                            error={errors.category_id}
                        />
                    </Field>

                    <Field label="Marca" error={errors.brand_id}>
                        <AppSelect
                            value={form.brand_id}
                            onValueChange={val => setField('brand_id', val)}
                            options={brands.map(b => ({ value: b.id, label: b.name }))}
                            placeholder="Sin marca"
                        />
                    </Field>

                    {/* Tipo (solo en create) */}
                    {!isEdit && (
                        <Field label="Tipo de producto" required>
                            <div className="flex gap-2">
                                {[
                                    { value: 'simple',  label: 'Simple' },
                                    { value: 'variant', label: 'Variable' },
                                    { value: 'bundle',  label: 'Bundle' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setField('type', opt.value)}
                                        className={cn(
                                            'flex-1 py-2 rounded-lg text-sm font-medium border transition-all',
                                            form.type === opt.value
                                                ? 'bg-[#F58220] text-white border-[#F58220]'
                                                : 'bg-white text-[#2B2B2B]/70 border-[#D3D3D3] hover:border-[#F58220]/50'
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </Field>
                    )}

                    <Field label="Unidad de medida" required>
                        <AppSelect
                            value={form.unit}
                            onValueChange={val => setField('unit', val)}
                            options={UNITS.map(u => ({ value: u, label: u }))}
                        />
                    </Field>

                    <Field label="Stock mínimo" error={errors.min_stock}>
                        <Input
                            type="number"
                            min="0"
                            step="any"
                            value={form.min_stock}
                            onChange={e => setField('min_stock', e.target.value)}
                        />
                    </Field>

                    <div className="sm:col-span-2">
                        <Field label="Descripción" error={errors.description}>
                            <textarea
                                value={form.description}
                                onChange={e => setField('description', e.target.value)}
                                rows={3}
                                placeholder="Opcional"
                                className="w-full text-sm border border-[#D3D3D3] rounded-lg px-3 py-2 bg-white text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#F58220]/30 resize-none"
                            />
                        </Field>
                    </div>
                </div>
            </div>

            {/* IVA */}
            <div className="bg-white border border-[#D3D3D3] rounded-xl p-5">
                <SectionTitle>Impuestos</SectionTitle>
                <div className="flex flex-wrap gap-6 items-start">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <div
                            onClick={() => setField('has_iva', !form.has_iva)}
                            className={cn(
                                'relative w-9 h-5 rounded-full transition-colors cursor-pointer',
                                form.has_iva ? 'bg-[#F58220]' : 'bg-[#D3D3D3]'
                            )}
                        >
                            <span className={cn(
                                'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                                form.has_iva ? 'translate-x-4' : ''
                            )} />
                        </div>
                        <span className="text-sm text-[#2B2B2B]">Aplica IVA</span>
                    </label>

                    {form.has_iva && (
                        <div>
                            <Label className="mb-1 block">Tasa de IVA</Label>
                            <div className="flex gap-2">
                                {IVA_RATES.map(rate => (
                                    <button
                                        key={rate}
                                        type="button"
                                        onClick={() => setField('iva_rate', rate)}
                                        className={cn(
                                            'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                                            form.iva_rate === rate
                                                ? 'bg-[#F58220] text-white border-[#F58220]'
                                                : 'bg-white text-[#2B2B2B]/70 border-[#D3D3D3] hover:border-[#F58220]/50'
                                        )}
                                    >
                                        {rate}%
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <label className="flex items-center gap-2 cursor-pointer ml-auto">
                        <div
                            onClick={() => setField('is_active', !form.is_active)}
                            className={cn(
                                'relative w-9 h-5 rounded-full transition-colors cursor-pointer',
                                form.is_active ? 'bg-[#F58220]' : 'bg-[#D3D3D3]'
                            )}
                        >
                            <span className={cn(
                                'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                                form.is_active ? 'translate-x-4' : ''
                            )} />
                        </div>
                        <span className="text-sm text-[#2B2B2B]">Producto activo</span>
                    </label>
                </div>
            </div>

            {/* Variantes */}
            {!isBundle && (
                <div className="bg-white border border-[#D3D3D3] rounded-xl p-5">
                    <VariantsManager
                        variants={form.variants}
                        attributeTypes={attributeTypes}
                        warehouses={warehouses}
                        errors={errors}
                        onChange={variants => setField('variants', variants)}
                        productType={form.type}
                    />
                </div>
            )}

            {/* Bundle components */}
            {isBundle && (
                <div className="bg-white border border-[#D3D3D3] rounded-xl p-5">
                    <SectionTitle>Componentes del bundle</SectionTitle>
                    <p className="text-sm text-[#2B2B2B]/50">
                        Los componentes del bundle se configuran después de crear el producto.
                    </p>
                </div>
            )}

            {/* Submit */}
            <div className="flex justify-end gap-3">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => window.history.back()}
                >
                    Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                    {submitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    {isEdit ? 'Guardar cambios' : 'Crear producto'}
                </Button>
            </div>
        </form>
    );
}
