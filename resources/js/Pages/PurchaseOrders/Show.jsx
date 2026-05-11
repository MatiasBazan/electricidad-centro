import { useState } from 'react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ChevronLeft, CheckCircle, XCircle, Truck, Clock,
    Package, Building2, Send, RotateCcw, Warehouse,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppSelect from '@/components/ui/AppSelect';
import { cn } from '@/lib/utils';

const STATUS_MAP = {
    draft:     { label: 'Borrador',   color: 'bg-slate-100 text-slate-600',   icon: Clock },
    sent:      { label: 'Enviada',    color: 'bg-blue-50 text-blue-700',       icon: Send },
    partial:   { label: 'Parcial',    color: 'bg-amber-50 text-amber-700',     icon: Package },
    received:  { label: 'Recibida',   color: 'bg-emerald-50 text-emerald-700', icon: CheckCircle },
    cancelled: { label: 'Cancelada',  color: 'bg-red-50 text-red-500',         icon: XCircle },
};

function StatusBadge({ status, large = false }) {
    const { label, color, icon: Icon } = STATUS_MAP[status] ?? STATUS_MAP.draft;
    return (
        <span className={cn('inline-flex items-center gap-1 font-medium rounded-full', color,
            large ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-[11px]')}>
            <Icon size={large ? 14 : 11} />
            {label}
        </span>
    );
}

function ReceiveModal({ order, warehouses, onClose }) {
    const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? '');
    const [quantities, setQuantities] = useState(
        Object.fromEntries(order.items.map(item => [item.id, item.pending]))
    );

    function submit(e) {
        e.preventDefault();
        const items = order.items
            .map(item => ({ id: item.id, quantity_received: Number(quantities[item.id] ?? 0) }))
            .filter(item => item.quantity_received > 0);

        router.post(`/compras/${order.id}/recepcionar`, {
            warehouse_id: warehouseId,
            items,
        }, { onSuccess: onClose });
    }

    const pendingItems = order.items.filter(i => i.pending > 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                <div>
                    <h2 className="text-base font-bold text-[#2B2B2B]">Recepcionar mercadería</h2>
                    <p className="text-xs text-[#2B2B2B]/50 mt-0.5">Ingresá las cantidades recibidas por producto</p>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-[#2B2B2B]/70">Depósito destino *</label>
                        <AppSelect
                            value={String(warehouseId)}
                            onValueChange={v => setWarehouseId(v)}
                            options={warehouses.map(w => ({ value: String(w.id), label: w.name }))}
                        />
                    </div>

                    <div className="space-y-2">
                        {pendingItems.map(item => (
                            <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-[#D3D3D3]/60 bg-[#F4F4F4]/40">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[#2B2B2B] truncate">{item.product_name}</p>
                                    <p className="text-[11px] text-[#2B2B2B]/40">
                                        Pedido: {item.quantity_ordered} · Recibido: {item.quantity_received} · Pendiente: {item.pending}
                                    </p>
                                </div>
                                <Input
                                    type="number"
                                    min="0"
                                    max={item.pending}
                                    step="any"
                                    value={quantities[item.id] ?? ''}
                                    onChange={e => setQuantities(q => ({ ...q, [item.id]: e.target.value }))}
                                    className="w-24 text-right"
                                />
                            </div>
                        ))}
                        {pendingItems.length === 0 && (
                            <p className="text-sm text-[#2B2B2B]/40 text-center py-4">No hay ítems pendientes.</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={pendingItems.length === 0}>
                            Registrar recepción
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function PurchaseOrderShow({ order, warehouses }) {
    const { flash } = usePage().props;
    const [showReceive, setShowReceive] = useState(false);

    function changeStatus(status) {
        if (!confirm(`¿Cambiar estado a "${STATUS_MAP[status]?.label}"?`)) return;
        router.patch(`/compras/${order.id}/estado`, { status });
    }

    const canReceive = ['sent', 'partial', 'draft'].includes(order.status);
    const canMarkSent = order.status === 'draft';
    const canCancel   = ['draft', 'sent'].includes(order.status);

    const progress = order.items.length > 0
        ? order.items.reduce((s, i) => s + i.quantity_received, 0) /
          order.items.reduce((s, i) => s + i.quantity_ordered, 0) * 100
        : 0;

    return (
        <AppLayout title={order.order_number}>
            {showReceive && (
                <ReceiveModal
                    order={order}
                    warehouses={warehouses}
                    onClose={() => setShowReceive(false)}
                />
            )}

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
                        <Link href="/compras" className="inline-flex items-center gap-1 text-sm text-[#2B2B2B]/50 hover:text-[#2B2B2B] transition-colors mb-1">
                            <ChevronLeft size={15} /> Órdenes de compra
                        </Link>
                        <h1 className="text-xl font-bold text-[#2B2B2B] font-mono flex items-center gap-3">
                            {order.order_number}
                            <StatusBadge status={order.status} large />
                        </h1>
                        <p className="text-sm text-[#2B2B2B]/40 mt-0.5">
                            Creada por {order.created_by} · {order.order_date}
                            {order.received_at && ` · Recibida: ${order.received_at}`}
                        </p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                        {canReceive && (
                            <Button onClick={() => setShowReceive(true)}>
                                <Truck size={14} /> Recepcionar
                            </Button>
                        )}
                        {canMarkSent && (
                            <Button variant="outline" onClick={() => changeStatus('sent')}>
                                <Send size={14} /> Marcar enviada
                            </Button>
                        )}
                        {canCancel && (
                            <Button variant="outline" onClick={() => changeStatus('cancelled')}
                                className="text-red-500 border-red-200 hover:bg-red-50">
                                <XCircle size={14} /> Cancelar
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* Ítems */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Progress */}
                        {order.status !== 'draft' && order.status !== 'cancelled' && (
                            <div className="bg-white border border-[#D3D3D3] rounded-xl p-4 space-y-2">
                                <div className="flex justify-between text-xs text-[#2B2B2B]/60">
                                    <span>Progreso de recepción</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                                <div className="h-2 bg-[#F4F4F4] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#F58220] rounded-full transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="bg-white border border-[#D3D3D3] rounded-xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-[#D3D3D3]/60">
                                <h2 className="text-sm font-semibold text-[#2B2B2B]">Ítems de la orden</h2>
                            </div>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-[#F4F4F4]/60 border-b border-[#D3D3D3]/40">
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#2B2B2B]/40">Producto</th>
                                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#2B2B2B]/40">Pedido</th>
                                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#2B2B2B]/40">Recibido</th>
                                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#2B2B2B]/40">Pendiente</th>
                                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#2B2B2B]/40">P. unitario</th>
                                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#2B2B2B]/40">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#D3D3D3]/30">
                                    {order.items.map(item => (
                                        <tr key={item.id} className={cn(
                                            'transition-colors',
                                            item.pending === 0 && item.quantity_received > 0
                                                ? 'bg-emerald-50/30'
                                                : item.quantity_received > 0 ? 'bg-amber-50/30' : ''
                                        )}>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-[#2B2B2B]">{item.product_name}</div>
                                                <div className="text-[11px] text-[#2B2B2B]/40">{item.product_code} · SKU: {item.sku}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums text-[#2B2B2B]/70">
                                                {item.quantity_ordered} <span className="text-[10px] text-[#2B2B2B]/30">{item.unit}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums text-emerald-600 font-medium">
                                                {item.quantity_received > 0 ? item.quantity_received : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums">
                                                <span className={cn(
                                                    'font-medium',
                                                    item.pending > 0 ? 'text-amber-600' : 'text-[#2B2B2B]/30'
                                                )}>
                                                    {item.pending > 0 ? item.pending : '✓'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums text-[#2B2B2B]/70">
                                                ${Number(item.unit_price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums font-semibold text-[#2B2B2B]">
                                                ${Number(item.subtotal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-[#D3D3D3]/60 bg-[#F4F4F4]/40">
                                        <td colSpan={5} className="px-4 py-3 text-right text-sm font-semibold text-[#2B2B2B]">Total</td>
                                        <td className="px-4 py-3 text-right text-base font-bold text-[#2B2B2B] tabular-nums">
                                            ${order.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Panel lateral */}
                    <div className="space-y-4">
                        {/* Proveedor */}
                        <div className="bg-white border border-[#D3D3D3] rounded-xl p-5 space-y-3">
                            <h2 className="text-sm font-semibold text-[#2B2B2B]">Proveedor</h2>
                            <div className="flex items-start gap-2">
                                <Building2 size={14} className="text-[#2B2B2B]/30 mt-0.5 shrink-0" />
                                <div>
                                    <Link href={`/proveedores/${order.supplier.id}`} className="text-sm font-medium text-[#2D4C73] hover:underline">
                                        {order.supplier.name}
                                    </Link>
                                    {order.supplier.cuit && (
                                        <p className="text-xs text-[#2B2B2B]/40 font-mono">{order.supplier.cuit}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Detalles */}
                        <div className="bg-white border border-[#D3D3D3] rounded-xl p-5 space-y-3">
                            <h2 className="text-sm font-semibold text-[#2B2B2B]">Detalles</h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-[#2B2B2B]/50">Fecha de orden</span>
                                    <span className="font-medium">{order.order_date}</span>
                                </div>
                                {order.expected_date && (
                                    <div className="flex justify-between">
                                        <span className="text-[#2B2B2B]/50">Entrega estimada</span>
                                        <span className="font-medium">{order.expected_date}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-[#2B2B2B]/50">Subtotal</span>
                                    <span className="font-medium tabular-nums">
                                        ${order.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="flex justify-between border-t border-[#D3D3D3]/60 pt-2">
                                    <span className="font-semibold text-[#2B2B2B]">Total</span>
                                    <span className="font-bold text-[#2B2B2B] tabular-nums text-base">
                                        ${order.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {order.notes && (
                            <div className="bg-white border border-[#D3D3D3] rounded-xl p-5 space-y-2">
                                <h2 className="text-sm font-semibold text-[#2B2B2B]">Notas</h2>
                                <p className="text-sm text-[#2B2B2B]/60 italic">{order.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
