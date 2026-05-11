import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    ShoppingCart, Plus, Search, Eye, CheckCircle, XCircle,
    Clock, Package, Truck,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppSelect from '@/components/ui/AppSelect';
import { cn } from '@/lib/utils';

const STATUS_MAP = {
    draft:     { label: 'Borrador',   color: 'bg-slate-100 text-slate-600',    icon: Clock },
    sent:      { label: 'Enviada',    color: 'bg-blue-50 text-blue-700',        icon: Truck },
    partial:   { label: 'Parcial',    color: 'bg-amber-50 text-amber-700',      icon: Package },
    received:  { label: 'Recibida',   color: 'bg-emerald-50 text-emerald-700',  icon: CheckCircle },
    cancelled: { label: 'Cancelada',  color: 'bg-red-50 text-red-500',          icon: XCircle },
};

function StatCard({ label, value, status, onClick, active }) {
    const { color, icon: Icon } = STATUS_MAP[status] ?? { color: 'bg-[#2D4C73]/10 text-[#2D4C73]', icon: ShoppingCart };
    return (
        <button
            onClick={onClick}
            className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all',
                active
                    ? 'border-[#F58220] bg-[#F58220]/5 shadow-sm'
                    : 'border-[#D3D3D3] bg-white hover:border-[#F58220]/40',
            )}
        >
            <span className={cn('p-2 rounded-lg', color)}>
                <Icon size={16} strokeWidth={1.8} />
            </span>
            <div>
                <p className="text-xl font-bold text-[#2B2B2B] leading-none">{value}</p>
                <p className="text-[11px] text-[#2B2B2B]/50 mt-0.5">{label}</p>
            </div>
        </button>
    );
}

function StatusBadge({ status }) {
    const { label, color } = STATUS_MAP[status] ?? STATUS_MAP.draft;
    return (
        <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', color)}>{label}</span>
    );
}

export default function PurchaseOrdersIndex({ orders, stats, suppliers, filters }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters.search ?? '');

    function applyFilter(extra) {
        router.get('/compras', { ...filters, search, ...extra }, {
            preserveState: true, replace: true,
        });
    }

    function handleSearch(e) {
        e.preventDefault();
        applyFilter({});
    }

    return (
        <AppLayout title="Órdenes de compra">
            <div className="space-y-5">

                {flash?.success && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                        <CheckCircle size={15} /> {flash.success}
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-[#2B2B2B]">Órdenes de compra</h1>
                        <p className="text-sm text-[#2B2B2B]/50 mt-0.5">Seguimiento de compras a proveedores</p>
                    </div>
                    <Link href="/compras/crear">
                        <Button>
                            <Plus size={15} /> Nueva orden
                        </Button>
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <StatCard
                        label="Total"
                        value={stats.total}
                        status="total"
                        onClick={() => applyFilter({ status: undefined })}
                        active={!filters.status}
                    />
                    {['draft', 'sent', 'partial', 'received'].map(s => (
                        <StatCard
                            key={s}
                            label={STATUS_MAP[s].label}
                            value={stats[s]}
                            status={s}
                            onClick={() => applyFilter({ status: s })}
                            active={filters.status === s}
                        />
                    ))}
                </div>

                {/* Search & Filters */}
                <div className="bg-white border border-[#D3D3D3] rounded-xl p-4">
                    <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
                        <div className="relative flex-1 min-w-48">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2B2B]/35 pointer-events-none" />
                            <Input
                                placeholder="Buscar por número o proveedor…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Button type="submit" variant="outline">Buscar</Button>
                        <AppSelect
                            value={filters.supplier_id ? String(filters.supplier_id) : ''}
                            onValueChange={val => applyFilter({ supplier_id: val || undefined })}
                            options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                            placeholder="Todos los proveedores"
                        />
                        <AppSelect
                            value={filters.status ?? ''}
                            onValueChange={val => applyFilter({ status: val || undefined })}
                            options={Object.entries(STATUS_MAP).map(([v, { label }]) => ({ value: v, label }))}
                            placeholder="Todos los estados"
                        />
                        {(filters.search || filters.status || filters.supplier_id) && (
                            <Button type="button" variant="ghost" onClick={() => router.get('/compras', {}, { replace: true })} className="text-xs text-[#2B2B2B]/50">
                                Limpiar
                            </Button>
                        )}
                    </form>
                </div>

                {/* Table */}
                <div className="bg-white border border-[#D3D3D3] rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[#D3D3D3]/60 bg-[#F4F4F4]/60">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Nro.</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Proveedor</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Fecha</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Entrega est.</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Estado</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Total</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D3D3D3]/40">
                            {orders.data.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-[#2B2B2B]/35 text-sm">
                                        No se encontraron órdenes de compra.
                                    </td>
                                </tr>
                            )}
                            {orders.data.map(o => (
                                <tr key={o.id} className="hover:bg-[#F4F4F4]/60 transition-colors group">
                                    <td className="px-4 py-3 font-mono text-xs text-[#2D4C73] font-semibold">
                                        <Link href={`/compras/${o.id}`} className="hover:underline">{o.order_number}</Link>
                                    </td>
                                    <td className="px-4 py-3 text-[#2B2B2B]">{o.supplier}</td>
                                    <td className="px-4 py-3 text-xs text-[#2B2B2B]/60">{o.order_date}</td>
                                    <td className="px-4 py-3 text-xs text-[#2B2B2B]/50">{o.expected_date ?? '—'}</td>
                                    <td className="px-4 py-3 text-center"><StatusBadge status={o.status} /></td>
                                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                                        ${o.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                                            <Link href={`/compras/${o.id}`}>
                                                <button className="p-1.5 rounded-md hover:bg-[#2D4C73]/10 text-[#2D4C73] transition-colors" title="Ver">
                                                    <Eye size={14} />
                                                </button>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {orders.last_page > 1 && (
                        <div className="px-4 py-3 border-t border-[#D3D3D3]/60 flex items-center justify-between">
                            <span className="text-xs text-[#2B2B2B]/40">
                                {orders.from}–{orders.to} de {orders.total} órdenes
                            </span>
                            <div className="flex gap-1">
                                {orders.links.map((link, i) => (
                                    <button
                                        key={i}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={cn(
                                            'px-3 py-1 rounded-md text-xs transition-colors',
                                            link.active ? 'bg-[#F58220] text-white font-semibold'
                                                : link.url ? 'text-[#2B2B2B]/60 hover:bg-[#F4F4F4]'
                                                : 'text-[#2B2B2B]/25 cursor-default',
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
