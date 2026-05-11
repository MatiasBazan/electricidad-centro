import { useState, useMemo } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { ChevronLeft, Plus, Trash2, Search, Package } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppSelect from '@/components/ui/AppSelect';
import { cn } from '@/lib/utils';

function Field({ label, error, children, className }) {
    return (
        <div className={cn('space-y-1', className)}>
            <Label className="text-xs font-medium text-[#2B2B2B]/70">{label}</Label>
            {children}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

function ProductSearch({ products, onSelect, excludeIds = [] }) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);

    const filtered = useMemo(() => {
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        return products
            .filter(p => !excludeIds.includes(p.id))
            .filter(p =>
                p.name?.toLowerCase().includes(q) ||
                p.code?.toLowerCase().includes(q) ||
                p.sku?.toLowerCase().includes(q)
            )
            .slice(0, 8);
    }, [query, products, excludeIds]);

    function select(product) {
        onSelect(product);
        setQuery('');
        setOpen(false);
    }

    return (
        <div className="relative">
            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2B2B]/35 pointer-events-none" />
                <Input
                    placeholder="Buscar producto por nombre, código o SKU…"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setTimeout(() => setOpen(false), 150)}
                    className="pl-9"
                />
            </div>
            {open && filtered.length > 0 && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[#D3D3D3] rounded-xl shadow-lg overflow-hidden">
                    {filtered.map(p => (
                        <button
                            key={p.id}
                            type="button"
                            onMouseDown={() => select(p)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F4F4F4] text-left transition-colors"
                        >
                            <Package size={14} className="text-[#2B2B2B]/30 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-[#2B2B2B] font-medium truncate">{p.name}</p>
                                <p className="text-xs text-[#2B2B2B]/40">{p.code} · SKU: {p.sku} · Costo: ${Number(p.cost_price).toFixed(2)}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function PurchaseOrderCreate({ suppliers, products, warehouses, preselect_supplier }) {
    const { data, setData, post, processing, errors } = useForm({
        supplier_id:   preselect_supplier ?? '',
        order_date:    new Date().toISOString().split('T')[0],
        expected_date: '',
        notes:         '',
        items:         [],
    });

    function addItem(product) {
        setData('items', [
            ...data.items,
            {
                product_variant_id: product.id,
                name:               product.name,
                code:               product.code,
                unit:               product.unit,
                quantity_ordered:   1,
                unit_price:         product.cost_price,
            },
        ]);
    }

    function updateItem(index, field, value) {
        const items = [...data.items];
        items[index] = { ...items[index], [field]: value };
        setData('items', items);
    }

    function removeItem(index) {
        setData('items', data.items.filter((_, i) => i !== index));
    }

    const subtotal = data.items.reduce(
        (sum, item) => sum + (Number(item.quantity_ordered) * Number(item.unit_price) || 0),
        0
    );

    function submit(e) {
        e.preventDefault();
        post('/compras');
    }

    const selectedSupplier = suppliers.find(s => String(s.id) === String(data.supplier_id));
    const excludeIds = data.items.map(i => i.product_variant_id);

    return (
        <AppLayout title="Nueva orden de compra">
            <div className="max-w-4xl space-y-5">
                <Link href="/compras" className="inline-flex items-center gap-1 text-sm text-[#2B2B2B]/50 hover:text-[#2B2B2B] transition-colors">
                    <ChevronLeft size={15} /> Órdenes de compra
                </Link>
                <h1 className="text-xl font-bold text-[#2B2B2B]">Nueva orden de compra</h1>

                <form onSubmit={submit} className="space-y-5">

                    {/* Cabecera */}
                    <div className="bg-white border border-[#D3D3D3] rounded-xl p-5 space-y-4">
                        <h2 className="text-sm font-semibold text-[#2B2B2B]">Datos de la orden</h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Proveedor *" error={errors.supplier_id}>
                                <AppSelect
                                    value={data.supplier_id}
                                    onValueChange={v => setData('supplier_id', v)}
                                    options={suppliers.map(s => ({ value: String(s.id), label: s.name }))}
                                    placeholder="Seleccionar proveedor"
                                    error={errors.supplier_id}
                                />
                                {selectedSupplier?.payment_terms && (
                                    <p className="text-xs text-[#2B2B2B]/40 mt-0.5">Condición: {selectedSupplier.payment_terms}</p>
                                )}
                            </Field>

                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Fecha de orden *" error={errors.order_date}>
                                    <Input
                                        type="date"
                                        value={data.order_date}
                                        onChange={e => setData('order_date', e.target.value)}
                                    />
                                </Field>
                                <Field label="Entrega estimada" error={errors.expected_date}>
                                    <Input
                                        type="date"
                                        value={data.expected_date}
                                        onChange={e => setData('expected_date', e.target.value)}
                                    />
                                </Field>
                            </div>
                        </div>

                        <Field label="Notas" error={errors.notes}>
                            <textarea
                                value={data.notes}
                                onChange={e => setData('notes', e.target.value)}
                                rows={2}
                                placeholder="Instrucciones u observaciones…"
                                className="flex w-full rounded-md border border-[#D3D3D3] bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F58220]/30 focus:border-[#F58220] resize-none"
                            />
                        </Field>
                    </div>

                    {/* Ítems */}
                    <div className="bg-white border border-[#D3D3D3] rounded-xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-[#2B2B2B]">Productos</h2>
                            {errors.items && <p className="text-xs text-red-500">{errors.items}</p>}
                        </div>

                        <ProductSearch
                            products={products}
                            onSelect={addItem}
                            excludeIds={excludeIds}
                        />

                        {data.items.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[#D3D3D3]/60">
                                            <th className="pb-2 text-left text-xs font-semibold text-[#2B2B2B]/40">Producto</th>
                                            <th className="pb-2 text-right text-xs font-semibold text-[#2B2B2B]/40 w-28">Cantidad</th>
                                            <th className="pb-2 text-right text-xs font-semibold text-[#2B2B2B]/40 w-32">P. unitario</th>
                                            <th className="pb-2 text-right text-xs font-semibold text-[#2B2B2B]/40 w-28">Subtotal</th>
                                            <th className="pb-2 w-10" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#D3D3D3]/30">
                                        {data.items.map((item, i) => {
                                            const sub = (Number(item.quantity_ordered) * Number(item.unit_price)) || 0;
                                            return (
                                                <tr key={i}>
                                                    <td className="py-2 pr-3">
                                                        <div className="font-medium text-[#2B2B2B] leading-tight">{item.name}</div>
                                                        <div className="text-[11px] text-[#2B2B2B]/40">{item.code}</div>
                                                    </td>
                                                    <td className="py-2 pr-2">
                                                        <Input
                                                            type="number"
                                                            min="0.01"
                                                            step="any"
                                                            value={item.quantity_ordered}
                                                            onChange={e => updateItem(i, 'quantity_ordered', e.target.value)}
                                                            className="text-right w-28"
                                                        />
                                                    </td>
                                                    <td className="py-2 pr-2">
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2B2B]/40 text-xs">$</span>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={item.unit_price}
                                                                onChange={e => updateItem(i, 'unit_price', e.target.value)}
                                                                className="pl-6 text-right w-32"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="py-2 text-right font-semibold tabular-nums text-[#2B2B2B]">
                                                        ${sub.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="py-2 pl-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeItem(i)}
                                                            className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t border-[#D3D3D3]/60">
                                            <td colSpan={3} className="pt-3 text-right text-sm font-semibold text-[#2B2B2B]">
                                                Total
                                            </td>
                                            <td className="pt-3 text-right text-base font-bold text-[#2B2B2B] tabular-nums">
                                                ${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td />
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}

                        {data.items.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8 text-[#2B2B2B]/25">
                                <Package size={32} strokeWidth={1.2} />
                                <p className="text-sm mt-2">Buscá y agregá productos a la orden</p>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <Link href="/compras">
                            <Button type="button" variant="outline">Cancelar</Button>
                        </Link>
                        <Button type="submit" disabled={processing || data.items.length === 0}>
                            {processing ? 'Creando…' : 'Crear orden de compra'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
