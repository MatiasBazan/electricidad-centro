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

export default function SalesOrderCreate({ clients, products, warehouses, preselect_client, from_quotation }) {
    const initialItems = from_quotation?.items?.map(i => ({
        product_variant_id: i.product_variant_id,
        description:        i.description,
        quantity:           i.quantity,
        unit_price:         i.unit_price,
        discount_pct:       i.discount_pct,
    })) ?? [];

    const { data, setData, post, processing, errors } = useForm({
        client_id:         from_quotation?.client_id ?? preselect_client ?? '',
        warehouse_id:      warehouses[0]?.id ?? '',
        quotation_id:      from_quotation?.id ?? null,
        date:              new Date().toISOString().split('T')[0],
        payment_type:      'contado',
        installments:      1,
        cash_discount_pct: 0,
        notes:             '',
        items:             initialItems,
    });

    const subtotal       = data.items.reduce((s, i) => s + calcItemSubtotal(i), 0);
    const cashDiscount   = data.payment_type === 'contado' ? subtotal * (Number(data.cash_discount_pct) || 0) / 100 : 0;
    const total          = subtotal - cashDiscount;

    const selectedClient = clients.find(c => String(c.id) === String(data.client_id));

    function submit(e) {
        e.preventDefault();
        post('/ventas');
    }

    return (
        <AppLayout title="Nueva venta">
            <div className="max-w-4xl space-y-5">
                <Link href="/ventas" className="inline-flex items-center gap-1 text-sm text-[#2B2B2B]/50 hover:text-[#2B2B2B] transition-colors">
                    <ChevronLeft size={15} /> Ventas
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-[#2B2B2B]">Nueva orden de venta</h1>
                    {from_quotation && (
                        <p className="text-sm text-[#2B2B2B]/40 mt-0.5">
                            Desde presupuesto <span className="font-mono">{from_quotation.number}</span> · {from_quotation.client}
                        </p>
                    )}
                </div>

                <form onSubmit={submit} className="space-y-5">
                    {/* Cabecera */}
                    <div className="bg-white border border-[#D3D3D3] rounded-xl p-5 space-y-4">
                        <h2 className="text-sm font-semibold text-[#2B2B2B]">Datos de la venta</h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Cliente *" error={errors.client_id}>
                                <AppSelect
                                    value={data.client_id}
                                    onValueChange={v => setData('client_id', v)}
                                    options={clients.map(c => ({ value: String(c.id), label: c.name }))}
                                    placeholder="Seleccionar cliente"
                                    error={errors.client_id}
                                />
                                {selectedClient?.credit_limit > 0 && (
                                    <p className="text-xs text-[#2B2B2B]/40 mt-0.5">
                                        Límite de crédito: ${Number(selectedClient.credit_limit).toLocaleString('es-AR')}
                                    </p>
                                )}
                            </Field>

                            <Field label="Depósito *" error={errors.warehouse_id}>
                                <AppSelect
                                    value={data.warehouse_id}
                                    onValueChange={v => setData('warehouse_id', v)}
                                    options={warehouses.map(w => ({ value: String(w.id), label: w.name }))}
                                    error={errors.warehouse_id}
                                />
                            </Field>
                        </div>

                        <Field label="Fecha *" error={errors.date} className="w-48">
                            <Input type="date" value={data.date} onChange={e => setData('date', e.target.value)} />
                        </Field>
                    </div>

                    {/* Forma de pago */}
                    <div className="bg-white border border-[#D3D3D3] rounded-xl p-5 space-y-4">
                        <h2 className="text-sm font-semibold text-[#2B2B2B]">Forma de pago</h2>

                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { value: 'contado', label: 'Contado', desc: 'Pago inmediato' },
                                { value: 'cuotas', label: 'Cuotas', desc: 'Financiado' },
                                { value: 'cuenta_corriente', label: 'Cuenta Corriente', desc: 'Cargo a CC' },
                            ].map(({ value, label, desc }) => (
                                <button key={value} type="button" onClick={() => setData('payment_type', value)}
                                    className={cn('text-left px-4 py-3 rounded-xl border transition-all',
                                        data.payment_type === value
                                            ? 'border-[#F58220] bg-[#F58220]/5 shadow-sm'
                                            : 'border-[#D3D3D3] hover:border-[#F58220]/40')}>
                                    <p className="text-sm font-semibold text-[#2B2B2B]">{label}</p>
                                    <p className="text-xs text-[#2B2B2B]/40 mt-0.5">{desc}</p>
                                </button>
                            ))}
                        </div>

                        {data.payment_type === 'contado' && (
                            <Field label="Descuento por pago en efectivo (%)" error={errors.cash_discount_pct} className="w-48">
                                <div className="relative">
                                    <Input type="number" min="0" max="100" step="0.5" value={data.cash_discount_pct}
                                        onChange={e => setData('cash_discount_pct', e.target.value)} className="pr-7" />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2B2B2B]/40 text-xs">%</span>
                                </div>
                            </Field>
                        )}

                        {data.payment_type === 'cuotas' && (
                            <Field label="Cantidad de cuotas" error={errors.installments} className="w-48">
                                <Input type="number" min="2" max="72" value={data.installments}
                                    onChange={e => setData('installments', e.target.value)} />
                            </Field>
                        )}

                        {data.payment_type === 'cuenta_corriente' && (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs">
                                Se registrará automáticamente un cargo en la cuenta corriente del cliente.
                            </div>
                        )}

                        <Field label="Notas" error={errors.notes}>
                            <Input value={data.notes} onChange={e => setData('notes', e.target.value)} placeholder="Instrucciones de entrega, observaciones…" />
                        </Field>
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

                        {data.items.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-[#D3D3D3]/60 flex justify-end">
                                <div className="space-y-1 text-sm w-64">
                                    <div className="flex justify-between text-[#2B2B2B]/60">
                                        <span>Subtotal</span>
                                        <span className="tabular-nums">${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    {cashDiscount > 0 && (
                                        <div className="flex justify-between text-emerald-600">
                                            <span>Desc. efectivo ({data.cash_discount_pct}%)</span>
                                            <span className="tabular-nums">-${cashDiscount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-bold text-[#2B2B2B] text-base border-t border-[#D3D3D3]/60 pt-1">
                                        <span>Total</span>
                                        <span className="tabular-nums">${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    {data.payment_type === 'cuotas' && data.installments > 1 && total > 0 && (
                                        <p className="text-xs text-[#2B2B2B]/40 text-right">
                                            {data.installments} cuotas de ${(total / data.installments).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3">
                        <Link href="/ventas"><Button type="button" variant="outline">Cancelar</Button></Link>
                        <Button type="submit" disabled={processing || data.items.length === 0}>
                            {processing ? 'Creando…' : 'Crear orden de venta'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
