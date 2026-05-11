import { useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppSelect from '@/components/ui/AppSelect';
import ItemsEditor, { calcItemSubtotal } from '@/Pages/Sales/Partials/ItemsEditor';
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

export default function QuotationCreate({ clients, products, preselect_client }) {
    const { data, setData, post, processing, errors } = useForm({
        client_id:    preselect_client ?? '',
        date:         new Date().toISOString().split('T')[0],
        expiry_date:  '',
        discount_pct: 0,
        notes:        '',
        items:        [],
    });

    const subtotal       = data.items.reduce((s, i) => s + calcItemSubtotal(i), 0);
    const discountAmount = subtotal * (Number(data.discount_pct) || 0) / 100;
    const total          = subtotal - discountAmount;

    function submit(e) {
        e.preventDefault();
        post('/presupuestos');
    }

    return (
        <AppLayout title="Nuevo presupuesto">
            <div className="max-w-4xl space-y-5">
                <Link href="/presupuestos" className="inline-flex items-center gap-1 text-sm text-[#2B2B2B]/50 hover:text-[#2B2B2B] transition-colors">
                    <ChevronLeft size={15} /> Presupuestos
                </Link>
                <h1 className="text-xl font-bold text-[#2B2B2B]">Nuevo presupuesto</h1>

                <form onSubmit={submit} className="space-y-5">
                    {/* Cabecera */}
                    <div className="bg-white border border-[#D3D3D3] rounded-xl p-5 space-y-4">
                        <h2 className="text-sm font-semibold text-[#2B2B2B]">Datos del presupuesto</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Cliente *" error={errors.client_id}>
                                <AppSelect
                                    value={data.client_id}
                                    onValueChange={v => setData('client_id', v)}
                                    options={clients.map(c => ({ value: String(c.id), label: c.name }))}
                                    placeholder="Seleccionar cliente"
                                    error={errors.client_id}
                                />
                            </Field>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Fecha *" error={errors.date}>
                                    <Input type="date" value={data.date} onChange={e => setData('date', e.target.value)} />
                                </Field>
                                <Field label="Vencimiento" error={errors.expiry_date}>
                                    <Input type="date" value={data.expiry_date} onChange={e => setData('expiry_date', e.target.value)} />
                                </Field>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Field label="Descuento global (%)" error={errors.discount_pct}>
                                <div className="relative">
                                    <Input type="number" min="0" max="100" step="0.5" value={data.discount_pct}
                                        onChange={e => setData('discount_pct', e.target.value)} className="pr-7" />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2B2B2B]/40 text-xs">%</span>
                                </div>
                            </Field>
                            <Field label="Notas" error={errors.notes} className="sm:col-span-2">
                                <Input value={data.notes} onChange={e => setData('notes', e.target.value)} placeholder="Condiciones, observaciones…" />
                            </Field>
                        </div>
                    </div>

                    {/* Ítems */}
                    <div className="bg-white border border-[#D3D3D3] rounded-xl p-5">
                        <ItemsEditor
                            items={data.items}
                            onChange={items => setData('items', items)}
                            products={products}
                            priceField="sale_price"
                            error={errors.items}
                        />

                        {/* Totales */}
                        {data.items.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-[#D3D3D3]/60 flex justify-end">
                                <div className="space-y-1 text-sm w-56">
                                    <div className="flex justify-between text-[#2B2B2B]/60">
                                        <span>Subtotal</span>
                                        <span className="tabular-nums">${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    {discountAmount > 0 && (
                                        <div className="flex justify-between text-emerald-600">
                                            <span>Descuento ({data.discount_pct}%)</span>
                                            <span className="tabular-nums">-${discountAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-bold text-[#2B2B2B] text-base border-t border-[#D3D3D3]/60 pt-1">
                                        <span>Total</span>
                                        <span className="tabular-nums">${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3">
                        <Link href="/presupuestos"><Button type="button" variant="outline">Cancelar</Button></Link>
                        <Button type="submit" disabled={processing || data.items.length === 0}>
                            {processing ? 'Guardando…' : 'Crear presupuesto'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
