import { useState } from 'react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ChevronLeft, Pencil, Trash2, Building2, Phone, Mail,
    MapPin, FileText, ShoppingCart, TrendingUp, TrendingDown,
    Plus, CheckCircle, XCircle, Clock,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STATUS_MAP = {
    draft:     { label: 'Borrador',   color: 'bg-slate-100 text-slate-600' },
    sent:      { label: 'Enviada',    color: 'bg-blue-50 text-blue-700' },
    partial:   { label: 'Parcial',    color: 'bg-amber-50 text-amber-700' },
    received:  { label: 'Recibida',   color: 'bg-emerald-50 text-emerald-700' },
    cancelled: { label: 'Cancelada',  color: 'bg-red-50 text-red-500' },
};

function InfoRow({ label, value }) {
    if (!value) return null;
    return (
        <div className="flex gap-2">
            <span className="text-xs text-[#2B2B2B]/40 w-28 shrink-0 pt-0.5">{label}</span>
            <span className="text-sm text-[#2B2B2B]">{value}</span>
        </div>
    );
}

function MovementModal({ supplierId, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        type: 'credit',
        amount: '',
        description: '',
    });

    function submit(e) {
        e.preventDefault();
        post(`/proveedores/${supplierId}/movimiento`, {
            onSuccess: () => { reset(); onClose(); },
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
                <h2 className="text-base font-bold text-[#2B2B2B]">Registrar movimiento</h2>

                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1">
                        <Label className="text-xs">Tipo</Label>
                        <div className="flex gap-2">
                            {[
                                { value: 'credit', label: 'Crédito (nos deben)', icon: TrendingUp },
                                { value: 'debit', label: 'Débito (debemos)', icon: TrendingDown },
                            ].map(({ value, label, icon: Icon }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setData('type', value)}
                                    className={cn(
                                        'flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all',
                                        data.type === value
                                            ? value === 'credit'
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                : 'border-red-400 bg-red-50 text-red-600'
                                            : 'border-[#D3D3D3] text-[#2B2B2B]/60 hover:border-[#2B2B2B]/30'
                                    )}
                                >
                                    <Icon size={14} />
                                    <span className="text-xs font-medium">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs">Monto *</Label>
                        <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={data.amount}
                            onChange={e => setData('amount', e.target.value)}
                            placeholder="0.00"
                        />
                        {errors.amount && <p className="text-xs text-red-500">{errors.amount}</p>}
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs">Descripción</Label>
                        <Input
                            value={data.description}
                            onChange={e => setData('description', e.target.value)}
                            placeholder="Motivo del movimiento…"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Guardando…' : 'Registrar'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function SupplierShow({ supplier, recent_orders }) {
    const { flash } = usePage().props;
    const [showMovModal, setShowMovModal] = useState(false);

    function confirmDelete() {
        if (confirm(`¿Eliminar "${supplier.name}"?`)) {
            router.delete(`/proveedores/${supplier.id}`, {
                onSuccess: () => router.visit('/proveedores'),
            });
        }
    }

    const balance = supplier.balance;

    return (
        <AppLayout title={supplier.name}>
            {showMovModal && (
                <MovementModal supplierId={supplier.id} onClose={() => setShowMovModal(false)} />
            )}

            <div className="space-y-5">
                {/* Flash */}
                {flash?.success && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                        <CheckCircle size={15} /> {flash.success}
                    </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <Link href="/proveedores" className="inline-flex items-center gap-1 text-sm text-[#2B2B2B]/50 hover:text-[#2B2B2B] transition-colors mb-1">
                            <ChevronLeft size={15} /> Proveedores
                        </Link>
                        <h1 className="text-xl font-bold text-[#2B2B2B] flex items-center gap-2">
                            {supplier.name}
                            <Badge variant={supplier.is_active ? 'success' : 'secondary'}>
                                {supplier.is_active ? 'Activo' : 'Inactivo'}
                            </Badge>
                        </h1>
                        {supplier.cuit && (
                            <p className="text-sm text-[#2B2B2B]/40 font-mono mt-0.5">CUIT: {supplier.cuit}</p>
                        )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <Link href={`/compras/crear?supplier_id=${supplier.id}`}>
                            <Button variant="outline" size="sm">
                                <ShoppingCart size={14} /> Nueva compra
                            </Button>
                        </Link>
                        <Link href={`/proveedores/${supplier.id}/editar`}>
                            <Button variant="outline" size="sm">
                                <Pencil size={14} /> Editar
                            </Button>
                        </Link>
                        <button
                            onClick={confirmDelete}
                            className="p-2 rounded-md border border-[#D3D3D3] hover:bg-red-50 hover:border-red-200 text-[#2B2B2B]/40 hover:text-red-500 transition-colors"
                            title="Eliminar"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* Datos del proveedor */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white border border-[#D3D3D3] rounded-xl p-5 space-y-3">
                            <h2 className="text-sm font-semibold text-[#2B2B2B]">Información</h2>
                            <div className="space-y-2">
                                {supplier.contact_name && (
                                    <InfoRow label="Contacto" value={supplier.contact_name} />
                                )}
                                {supplier.phone && (
                                    <div className="flex gap-2 items-center">
                                        <span className="text-xs text-[#2B2B2B]/40 w-28 shrink-0">Teléfono</span>
                                        <a href={`tel:${supplier.phone}`} className="text-sm text-[#2D4C73] hover:underline flex items-center gap-1">
                                            <Phone size={12} /> {supplier.phone}
                                        </a>
                                    </div>
                                )}
                                {supplier.email && (
                                    <div className="flex gap-2 items-center">
                                        <span className="text-xs text-[#2B2B2B]/40 w-28 shrink-0">Email</span>
                                        <a href={`mailto:${supplier.email}`} className="text-sm text-[#2D4C73] hover:underline flex items-center gap-1">
                                            <Mail size={12} /> {supplier.email}
                                        </a>
                                    </div>
                                )}
                                {(supplier.address || supplier.city) && (
                                    <div className="flex gap-2 items-start">
                                        <span className="text-xs text-[#2B2B2B]/40 w-28 shrink-0 pt-0.5">Dirección</span>
                                        <span className="text-sm text-[#2B2B2B] flex items-start gap-1">
                                            <MapPin size={12} className="mt-0.5 shrink-0" />
                                            {[supplier.address, supplier.city, supplier.province].filter(Boolean).join(', ')}
                                        </span>
                                    </div>
                                )}
                                <InfoRow label="Cond. de pago" value={supplier.payment_terms} />
                                {supplier.notes && (
                                    <div className="flex gap-2 items-start">
                                        <span className="text-xs text-[#2B2B2B]/40 w-28 shrink-0 pt-0.5">Notas</span>
                                        <span className="text-sm text-[#2B2B2B]/70 italic">{supplier.notes}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Órdenes recientes */}
                        <div className="bg-white border border-[#D3D3D3] rounded-xl p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-[#2B2B2B]">Últimas órdenes de compra</h2>
                                <Link href={`/compras?supplier_id=${supplier.id}`} className="text-xs text-[#2D4C73] hover:underline">
                                    Ver todas
                                </Link>
                            </div>
                            {recent_orders.length === 0 ? (
                                <p className="text-sm text-[#2B2B2B]/35 py-4 text-center">Sin órdenes de compra aún.</p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[#D3D3D3]/60">
                                            <th className="pb-2 text-left text-xs font-semibold text-[#2B2B2B]/40">Nro.</th>
                                            <th className="pb-2 text-left text-xs font-semibold text-[#2B2B2B]/40">Fecha</th>
                                            <th className="pb-2 text-left text-xs font-semibold text-[#2B2B2B]/40">Estado</th>
                                            <th className="pb-2 text-right text-xs font-semibold text-[#2B2B2B]/40">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#D3D3D3]/30">
                                        {recent_orders.map(o => {
                                            const st = STATUS_MAP[o.status] ?? STATUS_MAP.draft;
                                            return (
                                                <tr key={o.id} className="hover:bg-[#F4F4F4]/40">
                                                    <td className="py-2">
                                                        <Link href={`/compras/${o.id}`} className="text-[#2D4C73] hover:underline font-mono text-xs">
                                                            {o.order_number}
                                                        </Link>
                                                    </td>
                                                    <td className="py-2 text-xs text-[#2B2B2B]/60">{o.order_date}</td>
                                                    <td className="py-2">
                                                        <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', st.color)}>
                                                            {st.label}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 text-right font-semibold tabular-nums">
                                                        ${o.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Cuenta corriente */}
                    <div className="space-y-4">
                        <div className="bg-white border border-[#D3D3D3] rounded-xl p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-[#2B2B2B]">Cuenta corriente</h2>
                                <button
                                    onClick={() => setShowMovModal(true)}
                                    className="flex items-center gap-1 text-xs text-[#F58220] hover:text-[#d4701c] transition-colors"
                                >
                                    <Plus size={13} /> Movimiento
                                </button>
                            </div>

                            <div className={cn(
                                'rounded-lg p-4 text-center',
                                balance > 0 ? 'bg-emerald-50' : balance < 0 ? 'bg-red-50' : 'bg-[#F4F4F4]'
                            )}>
                                <p className="text-xs text-[#2B2B2B]/50 mb-1">Saldo actual</p>
                                <p className={cn(
                                    'text-2xl font-bold tabular-nums',
                                    balance > 0 ? 'text-emerald-600' : balance < 0 ? 'text-red-500' : 'text-[#2B2B2B]/40'
                                )}>
                                    ${Math.abs(balance).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </p>
                                {balance !== 0 && (
                                    <p className="text-[11px] text-[#2B2B2B]/40 mt-1">
                                        {balance > 0 ? 'A favor nuestro' : 'Adeudamos'}
                                    </p>
                                )}
                            </div>

                            {/* Movimientos */}
                            <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                                {supplier.movements.length === 0 ? (
                                    <p className="text-xs text-[#2B2B2B]/35 text-center py-4">Sin movimientos.</p>
                                ) : (
                                    supplier.movements.map(m => (
                                        <div key={m.id} className="flex items-center justify-between py-1.5 border-b border-[#D3D3D3]/30 last:border-0">
                                            <div className="flex items-center gap-2">
                                                {m.type === 'credit'
                                                    ? <TrendingUp size={13} className="text-emerald-500 shrink-0" />
                                                    : <TrendingDown size={13} className="text-red-400 shrink-0" />
                                                }
                                                <div>
                                                    <p className="text-xs text-[#2B2B2B]/70 leading-tight">
                                                        {m.description || (m.type === 'credit' ? 'Crédito' : 'Débito')}
                                                    </p>
                                                    <p className="text-[10px] text-[#2B2B2B]/30">{m.created_at}</p>
                                                </div>
                                            </div>
                                            <span className={cn(
                                                'text-sm font-semibold tabular-nums shrink-0 ml-2',
                                                m.type === 'credit' ? 'text-emerald-600' : 'text-red-500'
                                            )}>
                                                {m.type === 'credit' ? '+' : '-'}${Number(m.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
