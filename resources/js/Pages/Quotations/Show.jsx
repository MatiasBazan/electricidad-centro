import { useState } from 'react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ChevronLeft, FileText, Send, ThumbsDown, XCircle,
    ShoppingCart, CheckCircle, Clock,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import AppSelect from '@/components/ui/AppSelect';
import { cn } from '@/lib/utils';

const STATUS_MAP = {
    draft:    { label: 'Borrador',  color: 'bg-slate-100 text-slate-600' },
    sent:     { label: 'Enviado',   color: 'bg-blue-50 text-blue-700' },
    accepted: { label: 'Aceptado', color: 'bg-emerald-50 text-emerald-700' },
    rejected: { label: 'Rechazado',color: 'bg-red-50 text-red-500' },
    expired:  { label: 'Vencido',  color: 'bg-amber-50 text-amber-700' },
};

function ConvertModal({ quotation, warehouses, onClose }) {
    const { data, setData, post, processing, errors } = useForm({
        warehouse_id:      warehouses[0]?.id ?? '',
        payment_type:      'contado',
        installments:      1,
        cash_discount_pct: 0,
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
                <h2 className="text-base font-bold text-[#2B2B2B]">Convertir en orden de venta</h2>

                <form onSubmit={e => { e.preventDefault(); post(`/presupuestos/${quotation.id}/convertir`, { onSuccess: onClose }); }} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-[#2B2B2B]/70">Depósito *</label>
                        <AppSelect
                            value={data.warehouse_id}
                            onValueChange={v => setData('warehouse_id', v)}
                            options={warehouses.map(w => ({ value: String(w.id), label: w.name }))}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-[#2B2B2B]/70">Forma de pago *</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: 'contado', label: 'Contado' },
                                { value: 'cuotas', label: 'Cuotas' },
                                { value: 'cuenta_corriente', label: 'Cta. Cte.' },
                            ].map(({ value, label }) => (
                                <button key={value} type="button" onClick={() => setData('payment_type', value)}
                                    className={cn('py-2 px-3 rounded-lg border text-xs font-medium transition-all',
                                        data.payment_type === value ? 'border-[#F58220] bg-[#F58220]/10 text-[#F58220]' : 'border-[#D3D3D3] text-[#2B2B2B]/60 hover:border-[#F58220]/40')}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {data.payment_type === 'contado' && (
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-[#2B2B2B]/70">Descuento por pago en efectivo (%)</label>
                            <input type="number" min="0" max="100" step="0.5" value={data.cash_discount_pct}
                                onChange={e => setData('cash_discount_pct', e.target.value)}
                                className="flex h-9 w-full rounded-md border border-[#D3D3D3] bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F58220]/30 focus:border-[#F58220]" />
                        </div>
                    )}

                    {data.payment_type === 'cuotas' && (
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-[#2B2B2B]/70">Cantidad de cuotas</label>
                            <input type="number" min="2" max="72" value={data.installments}
                                onChange={e => setData('installments', e.target.value)}
                                className="flex h-9 w-full rounded-md border border-[#D3D3D3] bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F58220]/30 focus:border-[#F58220]" />
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creando…' : 'Crear orden de venta'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function QuotationShow({ quotation, warehouses }) {
    const { flash } = usePage().props;
    const [showConvert, setShowConvert] = useState(false);

    function changeStatus(status) {
        if (!confirm(`¿Marcar como "${STATUS_MAP[status]?.label}"?`)) return;
        router.patch(`/presupuestos/${quotation.id}/estado`, { status });
    }

    const st = STATUS_MAP[quotation.status] ?? STATUS_MAP.draft;

    return (
        <AppLayout title={quotation.number}>
            {showConvert && <ConvertModal quotation={quotation} warehouses={warehouses} onClose={() => setShowConvert(false)} />}

            <div className="space-y-5">
                {flash?.success && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                        <CheckCircle size={15} /> {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                        <XCircle size={15} /> {flash.error}
                    </div>
                )}

                <div className="flex items-start justify-between gap-4">
                    <div>
                        <Link href="/presupuestos" className="inline-flex items-center gap-1 text-sm text-[#2B2B2B]/50 hover:text-[#2B2B2B] transition-colors mb-1">
                            <ChevronLeft size={15} /> Presupuestos
                        </Link>
                        <h1 className="text-xl font-bold text-[#2B2B2B] font-mono flex items-center gap-3">
                            {quotation.number}
                            <span className={cn('text-sm font-normal px-2.5 py-0.5 rounded-full', st.color)}>{st.label}</span>
                        </h1>
                        <p className="text-sm text-[#2B2B2B]/40 mt-0.5">
                            {quotation.client.name} · {quotation.date}
                            {quotation.expiry_date && ` · Vence: ${quotation.expiry_date}`}
                        </p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                        {quotation.sales_order_id ? (
                            <Link href={`/ventas/${quotation.sales_order_id}`}>
                                <Button variant="outline" size="sm">
                                    <ShoppingCart size={14} /> Ver orden {quotation.sales_order_number}
                                </Button>
                            </Link>
                        ) : quotation.status !== 'rejected' && quotation.status !== 'expired' && (
                            <>
                                {quotation.status === 'draft' && (
                                    <Button variant="outline" size="sm" onClick={() => changeStatus('sent')}>
                                        <Send size={14} /> Marcar enviado
                                    </Button>
                                )}
                                <Button size="sm" onClick={() => setShowConvert(true)}>
                                    <ShoppingCart size={14} /> Convertir en venta
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => changeStatus('rejected')}
                                    className="text-red-500 border-red-200 hover:bg-red-50">
                                    <ThumbsDown size={14} /> Rechazar
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2">
                        <div className="bg-white border border-[#D3D3D3] rounded-xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-[#D3D3D3]/60">
                                <h2 className="text-sm font-semibold text-[#2B2B2B]">Ítems</h2>
                            </div>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-[#F4F4F4]/60 border-b border-[#D3D3D3]/40">
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#2B2B2B]/40">Descripción</th>
                                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#2B2B2B]/40">Cant.</th>
                                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#2B2B2B]/40">P. Unit.</th>
                                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#2B2B2B]/40">Desc.%</th>
                                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#2B2B2B]/40">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#D3D3D3]/30">
                                    {quotation.items.map(item => (
                                        <tr key={item.id}>
                                            <td className="px-4 py-2.5 text-[#2B2B2B]">{item.description}</td>
                                            <td className="px-4 py-2.5 text-right tabular-nums text-[#2B2B2B]/70">{item.quantity}</td>
                                            <td className="px-4 py-2.5 text-right tabular-nums text-[#2B2B2B]/70">
                                                ${item.unit_price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-2.5 text-right text-[#2B2B2B]/50 text-xs">
                                                {item.discount_pct > 0 ? `${item.discount_pct}%` : '—'}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                                                ${item.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-[#D3D3D3]/60 bg-[#F4F4F4]/40">
                                        <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-[#2B2B2B]">Subtotal</td>
                                        <td className="px-4 py-3 text-right tabular-nums font-semibold">
                                            ${quotation.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                    {quotation.discount_amount > 0 && (
                                        <tr className="bg-[#F4F4F4]/40">
                                            <td colSpan={4} className="px-4 py-1.5 text-right text-xs text-emerald-600">
                                                Descuento ({quotation.discount_pct}%)
                                            </td>
                                            <td className="px-4 py-1.5 text-right text-xs text-emerald-600 tabular-nums">
                                                -${quotation.discount_amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    )}
                                    <tr className="border-t border-[#D3D3D3]/60 bg-[#F4F4F4]/40">
                                        <td colSpan={4} className="px-4 py-3 text-right text-base font-bold text-[#2B2B2B]">Total</td>
                                        <td className="px-4 py-3 text-right text-base font-bold text-[#2B2B2B] tabular-nums">
                                            ${quotation.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-white border border-[#D3D3D3] rounded-xl p-5 space-y-3">
                            <h2 className="text-sm font-semibold text-[#2B2B2B]">Cliente</h2>
                            <Link href={`/clientes/${quotation.client.id}`} className="text-sm font-medium text-[#2D4C73] hover:underline">
                                {quotation.client.name}
                            </Link>
                            {quotation.client.tax_condition && (
                                <p className="text-xs text-[#2B2B2B]/40 capitalize">{quotation.client.tax_condition.replace('_', ' ')}</p>
                            )}
                        </div>
                        {quotation.notes && (
                            <div className="bg-white border border-[#D3D3D3] rounded-xl p-5">
                                <h2 className="text-sm font-semibold text-[#2B2B2B] mb-2">Notas</h2>
                                <p className="text-sm text-[#2B2B2B]/60 italic">{quotation.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
