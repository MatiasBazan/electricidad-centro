import { useState } from 'react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ChevronLeft, Pencil, Trash2, Building2, User,
    Phone, Mail, MapPin, CreditCard, ShoppingCart,
    TrendingUp, TrendingDown, Plus, CheckCircle, XCircle,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const TAX_LABELS = {
    consumidor_final:      'Consumidor Final',
    responsable_inscripto: 'Responsable Inscripto',
    monotributista:        'Monotributista',
    exento:                'Exento',
};

const SALE_STATUS = {
    draft:      { label: 'Borrador',   color: 'bg-slate-100 text-slate-600' },
    confirmed:  { label: 'Confirmada', color: 'bg-blue-50 text-blue-700' },
    delivered:  { label: 'Entregada',  color: 'bg-emerald-50 text-emerald-700' },
    cancelled:  { label: 'Cancelada',  color: 'bg-red-50 text-red-500' },
    invoiced:   { label: 'Facturada',  color: 'bg-purple-50 text-purple-700' },
};

function InfoRow({ label, value, children }) {
    if (!value && !children) return null;
    return (
        <div className="flex gap-2">
            <span className="text-xs text-[#2B2B2B]/40 w-32 shrink-0 pt-0.5">{label}</span>
            <span className="text-sm text-[#2B2B2B]">{children ?? value}</span>
        </div>
    );
}

function MovementModal({ clientId, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        type:        'debit',
        amount:      '',
        description: '',
        due_date:    '',
    });

    function submit(e) {
        e.preventDefault();
        post(`/clientes/${clientId}/movimiento`, {
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
                                { value: 'debit',  label: 'Cargo (debe)',      icon: TrendingUp,   cls: 'border-red-400 bg-red-50 text-red-600' },
                                { value: 'credit', label: 'Pago / Crédito',    icon: TrendingDown, cls: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
                            ].map(({ value, label, icon: Icon, cls }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setData('type', value)}
                                    className={cn(
                                        'flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all',
                                        data.type === value ? cls : 'border-[#D3D3D3] text-[#2B2B2B]/60 hover:border-[#2B2B2B]/30'
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
                            type="number" min="0.01" step="0.01"
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
                            placeholder="Concepto del movimiento…"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs">Fecha de vencimiento</Label>
                        <Input
                            type="date"
                            value={data.due_date}
                            onChange={e => setData('due_date', e.target.value)}
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

export default function ClientShow({ client, recent_sales }) {
    const { flash } = usePage().props;
    const [showMovModal, setShowMovModal] = useState(false);

    function confirmDelete() {
        if (confirm(`¿Eliminar "${client.name}"?`)) {
            router.delete(`/clientes/${client.id}`, {
                onSuccess: () => router.visit('/clientes'),
            });
        }
    }

    const balance = client.balance;
    const TypeIcon = client.type === 'empresa' ? Building2 : User;

    return (
        <AppLayout title={client.name}>
            {showMovModal && (
                <MovementModal clientId={client.id} onClose={() => setShowMovModal(false)} />
            )}

            <div className="space-y-5">
                {flash?.success && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                        <CheckCircle size={15} /> {flash.success}
                    </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <Link href="/clientes" className="inline-flex items-center gap-1 text-sm text-[#2B2B2B]/50 hover:text-[#2B2B2B] transition-colors mb-1">
                            <ChevronLeft size={15} /> Clientes
                        </Link>
                        <h1 className="text-xl font-bold text-[#2B2B2B] flex items-center gap-2">
                            <TypeIcon size={18} className={client.type === 'empresa' ? 'text-blue-600' : 'text-slate-400'} />
                            {client.name}
                            <Badge variant={client.is_active ? 'success' : 'secondary'}>
                                {client.is_active ? 'Activo' : 'Inactivo'}
                            </Badge>
                        </h1>
                        {client.fantasy_name && (
                            <p className="text-sm text-[#2B2B2B]/40 mt-0.5">{client.fantasy_name}</p>
                        )}
                        <p className="text-xs text-[#2B2B2B]/30 mt-0.5">{TAX_LABELS[client.tax_condition]}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <Link href={`/ventas/crear?client_id=${client.id}`}>
                            <Button variant="outline" size="sm">
                                <ShoppingCart size={14} /> Nueva venta
                            </Button>
                        </Link>
                        <Link href={`/clientes/${client.id}/editar`}>
                            <Button variant="outline" size="sm">
                                <Pencil size={14} /> Editar
                            </Button>
                        </Link>
                        <button
                            onClick={confirmDelete}
                            className="p-2 rounded-md border border-[#D3D3D3] hover:bg-red-50 hover:border-red-200 text-[#2B2B2B]/40 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* Datos + ventas recientes */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Datos */}
                        <div className="bg-white border border-[#D3D3D3] rounded-xl p-5 space-y-3">
                            <h2 className="text-sm font-semibold text-[#2B2B2B]">Información</h2>
                            <div className="space-y-2">
                                {(client.document_type || client.document_number) && (
                                    <InfoRow label="Documento">
                                        <span className="uppercase text-xs font-mono">
                                            {client.document_type} {client.document_number}
                                        </span>
                                    </InfoRow>
                                )}
                                {client.cuit_cuil && <InfoRow label="CUIT / CUIL" value={client.cuit_cuil} />}
                                {client.phone && (
                                    <div className="flex gap-2 items-center">
                                        <span className="text-xs text-[#2B2B2B]/40 w-32 shrink-0">Teléfono</span>
                                        <a href={`tel:${client.phone}`} className="text-sm text-[#2D4C73] hover:underline flex items-center gap-1">
                                            <Phone size={12} /> {client.phone}
                                        </a>
                                    </div>
                                )}
                                {client.mobile && (
                                    <div className="flex gap-2 items-center">
                                        <span className="text-xs text-[#2B2B2B]/40 w-32 shrink-0">Celular</span>
                                        <a href={`tel:${client.mobile}`} className="text-sm text-[#2D4C73] hover:underline flex items-center gap-1">
                                            <Phone size={12} /> {client.mobile}
                                        </a>
                                    </div>
                                )}
                                {client.email && (
                                    <div className="flex gap-2 items-center">
                                        <span className="text-xs text-[#2B2B2B]/40 w-32 shrink-0">Email</span>
                                        <a href={`mailto:${client.email}`} className="text-sm text-[#2D4C73] hover:underline flex items-center gap-1">
                                            <Mail size={12} /> {client.email}
                                        </a>
                                    </div>
                                )}
                                {(client.address || client.city) && (
                                    <div className="flex gap-2 items-start">
                                        <span className="text-xs text-[#2B2B2B]/40 w-32 shrink-0 pt-0.5">Dirección</span>
                                        <span className="text-sm text-[#2B2B2B] flex items-start gap-1">
                                            <MapPin size={12} className="mt-0.5 shrink-0" />
                                            {[client.address, client.city, client.province, client.postal_code].filter(Boolean).join(', ')}
                                        </span>
                                    </div>
                                )}
                                {client.credit_limit > 0 && (
                                    <InfoRow label="Límite de crédito">
                                        <span className="font-semibold text-[#2D4C73]">
                                            ${client.credit_limit.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </InfoRow>
                                )}
                                {client.notes && (
                                    <div className="flex gap-2 items-start">
                                        <span className="text-xs text-[#2B2B2B]/40 w-32 shrink-0 pt-0.5">Notas</span>
                                        <span className="text-sm text-[#2B2B2B]/70 italic">{client.notes}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Ventas recientes */}
                        <div className="bg-white border border-[#D3D3D3] rounded-xl p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-[#2B2B2B]">Últimas ventas</h2>
                                <Link href={`/ventas?client_id=${client.id}`} className="text-xs text-[#2D4C73] hover:underline">
                                    Ver todas
                                </Link>
                            </div>
                            {recent_sales.length === 0 ? (
                                <p className="text-sm text-[#2B2B2B]/35 py-4 text-center">Sin ventas registradas.</p>
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
                                        {recent_sales.map(s => {
                                            const st = SALE_STATUS[s.status] ?? SALE_STATUS.draft;
                                            return (
                                                <tr key={s.id} className="hover:bg-[#F4F4F4]/40">
                                                    <td className="py-2 font-mono text-xs text-[#2D4C73]">{s.order_number}</td>
                                                    <td className="py-2 text-xs text-[#2B2B2B]/60">{s.created_at}</td>
                                                    <td className="py-2">
                                                        <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', st.color)}>
                                                            {st.label}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 text-right font-semibold tabular-nums">
                                                        ${s.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
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
                                balance > 0 ? 'bg-red-50' : balance < 0 ? 'bg-emerald-50' : 'bg-[#F4F4F4]'
                            )}>
                                <p className="text-xs text-[#2B2B2B]/50 mb-1">Saldo actual</p>
                                <p className={cn(
                                    'text-2xl font-bold tabular-nums',
                                    balance > 0 ? 'text-red-500' : balance < 0 ? 'text-emerald-600' : 'text-[#2B2B2B]/40'
                                )}>
                                    ${Math.abs(balance).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </p>
                                {balance !== 0 && (
                                    <p className="text-[11px] text-[#2B2B2B]/40 mt-1">
                                        {balance > 0 ? 'El cliente nos debe' : 'A favor del cliente'}
                                    </p>
                                )}
                            </div>

                            {client.credit_limit > 0 && balance > 0 && (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-[#2B2B2B]/50">
                                        <span>Límite utilizado</span>
                                        <span>{Math.min(100, Math.round((balance / client.credit_limit) * 100))}%</span>
                                    </div>
                                    <div className="h-1.5 bg-[#F4F4F4] rounded-full overflow-hidden">
                                        <div
                                            className={cn('h-full rounded-full transition-all', balance > client.credit_limit ? 'bg-red-500' : 'bg-[#F58220]')}
                                            style={{ width: `${Math.min(100, (balance / client.credit_limit) * 100)}%` }}
                                        />
                                    </div>
                                    {balance > client.credit_limit && (
                                        <p className="text-[11px] text-red-500">Límite de crédito superado</p>
                                    )}
                                </div>
                            )}

                            {/* Movimientos */}
                            <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                                {client.movements.length === 0 ? (
                                    <p className="text-xs text-[#2B2B2B]/35 text-center py-4">Sin movimientos.</p>
                                ) : (
                                    client.movements.map(m => (
                                        <div key={m.id} className="py-1.5 border-b border-[#D3D3D3]/30 last:border-0">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {m.type === 'debit'
                                                        ? <TrendingUp size={13} className="text-red-400 shrink-0" />
                                                        : <TrendingDown size={13} className="text-emerald-500 shrink-0" />
                                                    }
                                                    <div>
                                                        <p className="text-xs text-[#2B2B2B]/70 leading-tight">
                                                            {m.description || (m.type === 'debit' ? 'Cargo' : 'Pago')}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[10px] text-[#2B2B2B]/30">{m.created_at}</p>
                                                            {m.due_date && (
                                                                <p className="text-[10px] text-amber-500">Vence: {m.due_date}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={cn(
                                                    'text-sm font-semibold tabular-nums shrink-0 ml-2',
                                                    m.type === 'debit' ? 'text-red-500' : 'text-emerald-600'
                                                )}>
                                                    {m.type === 'debit' ? '+' : '-'}${Number(m.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
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
