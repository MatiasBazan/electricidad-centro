import { useState } from 'react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ChevronLeft, Truck, XCircle, CheckCircle, Clock,
    Building2, FileText, CreditCard, Package, FileCheck,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const STATUS_MAP = {
    pending:    { label: 'Pendiente',  color: 'bg-amber-50 text-amber-700' },
    processing: { label: 'En proceso', color: 'bg-blue-50 text-blue-700' },
    partial:    { label: 'Parcial',    color: 'bg-orange-50 text-orange-600' },
    delivered:  { label: 'Entregada',  color: 'bg-emerald-50 text-emerald-700' },
    invoiced:   { label: 'Facturada',  color: 'bg-purple-50 text-purple-700' },
    cancelled:  { label: 'Cancelada',  color: 'bg-red-50 text-red-500' },
};

const PAYMENT_LABELS = {
    contado:          'Contado',
    cuotas:           'Cuotas',
    cuenta_corriente: 'Cuenta Corriente',
};

function DispatchModal({ order, onClose }) {
    const [quantities, setQuantities] = useState(
        Object.fromEntries(order.items.filter(i => i.pending > 0).map(i => [i.id, i.pending]))
    );
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const pendingItems = order.items.filter(i => i.pending > 0);

    function submit(e) {
        e.preventDefault();
        const items = pendingItems
            .map(i => ({ sales_order_item_id: i.id, quantity: Number(quantities[i.id] ?? 0) }))
            .filter(i => i.quantity > 0);

        if (!items.length) return;
        setLoading(true);
        router.post(`/ventas/${order.id}/entregar`, { items, notes }, {
            onFinish: () => { setLoading(false); onClose(); },
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div>
                    <h2 className="text-base font-bold text-[#2B2B2B]">Registrar entrega</h2>
                    <p className="text-xs text-[#2B2B2B]/50 mt-0.5">
                        Depósito: {order.warehouse} · Se generará el remito automáticamente
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-3">
                    {pendingItems.map(item => (
                        <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-[#D3D3D3]/60 bg-[#F4F4F4]/40">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[#2B2B2B] truncate">{item.description}</p>
                                <p className="text-[11px] text-[#2B2B2B]/40">
                                    Total: {item.quantity} · Entregado: {item.quantity_delivered} · Pendiente: {item.pending}
                                </p>
                            </div>
                            <Input type="number" min="0" max={item.pending} step="any"
                                value={quantities[item.id] ?? ''}
                                onChange={e => setQuantities(q => ({ ...q, [item.id]: e.target.value }))}
                                className="w-24 text-right" />
                        </div>
                    ))}

                    {pendingItems.length === 0 && (
                        <p className="text-sm text-[#2B2B2B]/40 text-center py-4">No hay ítems pendientes de entrega.</p>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-[#2B2B2B]/70">Notas del remito</label>
                        <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observaciones de la entrega…" />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={loading || pendingItems.length === 0}>
                            {loading ? 'Registrando…' : 'Confirmar entrega'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function SalesOrderShow({ order, warehouses }) {
    const { flash } = usePage().props;
    const [showDispatch, setShowDispatch] = useState(false);

    const st = STATUS_MAP[order.status] ?? STATUS_MAP.pending;
    const canDeliver = ['pending', 'processing', 'partial'].includes(order.status);
    const canCancel  = ['pending', 'processing', 'partial'].includes(order.status);

    const progress = order.items.length > 0
        ? order.items.reduce((s, i) => s + i.quantity_delivered, 0) /
          order.items.reduce((s, i) => s + i.quantity, 0) * 100
        : 0;

    function confirmCancel() {
        if (!confirm('¿Cancelar esta orden? Se liberará el stock reservado.')) return;
        router.post(`/ventas/${order.id}/cancelar`);
    }

    return (
        <AppLayout title={order.number}>
            {showDispatch && <DispatchModal order={order} onClose={() => setShowDispatch(false)} />}

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

                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <Link href="/ventas" className="inline-flex items-center gap-1 text-sm text-[#2B2B2B]/50 hover:text-[#2B2B2B] transition-colors mb-1">
                            <ChevronLeft size={15} /> Ventas
                        </Link>
                        <h1 className="text-xl font-bold text-[#2B2B2B] font-mono flex items-center gap-3">
                            {order.number}
                            <span className={cn('text-sm font-normal px-2.5 py-0.5 rounded-full', st.color)}>{st.label}</span>
                        </h1>
                        <p className="text-sm text-[#2B2B2B]/40 mt-0.5">
                            {order.client.name} · {order.date}
                            {order.quotation_number && ` · Pres. ${order.quotation_number}`}
                        </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        {canDeliver && (
                            <Button onClick={() => setShowDispatch(true)}>
                                <Truck size={14} /> Registrar entrega
                            </Button>
                        )}
                        {canCancel && (
                            <Button variant="outline" onClick={confirmCancel} className="text-red-500 border-red-200 hover:bg-red-50">
                                <XCircle size={14} /> Cancelar
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2 space-y-4">

                        {/* Progress bar */}
                        {!['pending', 'cancelled'].includes(order.status) && (
                            <div className="bg-white border border-[#D3D3D3] rounded-xl p-4 space-y-2">
                                <div className="flex justify-between text-xs text-[#2B2B2B]/60">
                                    <span>Progreso de entrega</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                                <div className="h-2 bg-[#F4F4F4] rounded-full overflow-hidden">
                                    <div className="h-full bg-[#F58220] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        )}

                        {/* Ítems */}
                        <div className="bg-white border border-[#D3D3D3] rounded-xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-[#D3D3D3]/60">
                                <h2 className="text-sm font-semibold text-[#2B2B2B]">Ítems de la orden</h2>
                            </div>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-[#F4F4F4]/60 border-b border-[#D3D3D3]/40">
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#2B2B2B]/40">Descripción</th>
                                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#2B2B2B]/40">Cant.</th>
                                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#2B2B2B]/40">Entregado</th>
                                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#2B2B2B]/40">Pendiente</th>
                                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#2B2B2B]/40">P. Unit.</th>
                                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#2B2B2B]/40">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#D3D3D3]/30">
                                    {order.items.map(item => (
                                        <tr key={item.id} className={cn(
                                            item.pending === 0 ? 'bg-emerald-50/30' : item.quantity_delivered > 0 ? 'bg-amber-50/20' : ''
                                        )}>
                                            <td className="px-4 py-2.5 text-[#2B2B2B]">{item.description}</td>
                                            <td className="px-4 py-2.5 text-right tabular-nums text-[#2B2B2B]/70">{item.quantity}</td>
                                            <td className="px-4 py-2.5 text-right tabular-nums text-emerald-600 font-medium">
                                                {item.quantity_delivered > 0 ? item.quantity_delivered : '—'}
                                            </td>
                                            <td className="px-4 py-2.5 text-right tabular-nums">
                                                <span className={cn('font-medium', item.pending > 0 ? 'text-amber-600' : 'text-[#2B2B2B]/30')}>
                                                    {item.pending > 0 ? item.pending : '✓'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-right tabular-nums text-[#2B2B2B]/70">
                                                ${item.unit_price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                {item.discount_pct > 0 && <span className="text-[10px] text-emerald-600 ml-1">-{item.discount_pct}%</span>}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                                                ${item.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-[#D3D3D3]/60 bg-[#F4F4F4]/40">
                                        <td colSpan={5} className="px-4 py-2 text-right text-sm text-[#2B2B2B]/60">Subtotal</td>
                                        <td className="px-4 py-2 text-right tabular-nums font-semibold">
                                            ${order.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                    {order.discount_amount > 0 && (
                                        <tr className="bg-[#F4F4F4]/40">
                                            <td colSpan={5} className="px-4 py-1 text-right text-xs text-emerald-600">
                                                Desc. efectivo ({order.cash_discount_pct}%)
                                            </td>
                                            <td className="px-4 py-1 text-right text-xs text-emerald-600 tabular-nums">
                                                -${order.discount_amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    )}
                                    <tr className="border-t border-[#D3D3D3]/60 bg-[#F4F4F4]/40">
                                        <td colSpan={5} className="px-4 py-3 text-right text-base font-bold text-[#2B2B2B]">Total</td>
                                        <td className="px-4 py-3 text-right text-base font-bold tabular-nums">
                                            ${order.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Remitos */}
                        {order.deliveries.length > 0 && (
                            <div className="bg-white border border-[#D3D3D3] rounded-xl p-5 space-y-3">
                                <h2 className="text-sm font-semibold text-[#2B2B2B]">Remitos generados</h2>
                                <div className="space-y-2">
                                    {order.deliveries.map(d => (
                                        <div key={d.id} className="flex items-start gap-3 p-3 rounded-lg border border-[#D3D3D3]/60 bg-[#F4F4F4]/30">
                                            <FileText size={14} className="text-[#2B2B2B]/30 mt-0.5 shrink-0" />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-mono font-semibold text-[#2D4C73]">{d.number}</span>
                                                    <span className="text-xs text-[#2B2B2B]/40">{d.dispatched_at ?? d.date}</span>
                                                </div>
                                                <div className="mt-1 space-y-0.5">
                                                    {d.items.map((di, i) => (
                                                        <p key={i} className="text-xs text-[#2B2B2B]/60">
                                                            {di.description} <span className="font-mono">×{di.quantity}</span>
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Panel lateral */}
                    <div className="space-y-4">
                        <div className="bg-white border border-[#D3D3D3] rounded-xl p-5 space-y-3">
                            <h2 className="text-sm font-semibold text-[#2B2B2B]">Cliente</h2>
                            <Link href={`/clientes/${order.client.id}`} className="text-sm font-medium text-[#2D4C73] hover:underline">
                                {order.client.name}
                            </Link>
                        </div>

                        <div className="bg-white border border-[#D3D3D3] rounded-xl p-5 space-y-3">
                            <h2 className="text-sm font-semibold text-[#2B2B2B]">Detalles</h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-[#2B2B2B]/50">Depósito</span>
                                    <span className="font-medium">{order.warehouse}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#2B2B2B]/50">Forma de pago</span>
                                    <span className="font-medium">{PAYMENT_LABELS[order.payment_type]}</span>
                                </div>
                                {order.payment_type === 'cuotas' && (
                                    <div className="flex justify-between">
                                        <span className="text-[#2B2B2B]/50">Cuotas</span>
                                        <span className="font-medium">{order.installments}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-[#2B2B2B]/50">Fecha</span>
                                    <span className="font-medium">{order.date}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-[#D3D3D3]/60">
                                    <span className="font-bold text-[#2B2B2B]">Total</span>
                                    <span className="font-bold text-[#2B2B2B] tabular-nums text-base">
                                        ${order.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {order.notes && (
                            <div className="bg-white border border-[#D3D3D3] rounded-xl p-5">
                                <h2 className="text-sm font-semibold text-[#2B2B2B] mb-2">Notas</h2>
                                <p className="text-sm text-[#2B2B2B]/60 italic">{order.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
