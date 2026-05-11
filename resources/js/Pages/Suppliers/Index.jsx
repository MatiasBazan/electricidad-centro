import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Building2, Plus, Search, Eye, Pencil, Trash2,
    CheckCircle, XCircle, Phone, Mail, ShoppingCart,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import AppSelect from '@/components/ui/AppSelect';
import { cn } from '@/lib/utils';

function StatCard({ label, value, icon: Icon, color }) {
    return (
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl border border-[#D3D3D3] bg-white">
            <span className={cn('p-2 rounded-lg', color)}>
                <Icon size={18} strokeWidth={1.8} />
            </span>
            <div>
                <p className="text-2xl font-bold text-[#2B2B2B] leading-none">{value}</p>
                <p className="text-xs text-[#2B2B2B]/50 mt-0.5">{label}</p>
            </div>
        </div>
    );
}

function BalanceBadge({ balance }) {
    if (balance === 0) return <span className="text-xs text-[#2B2B2B]/40">$0</span>;
    return (
        <span className={cn('text-sm font-semibold tabular-nums', balance > 0 ? 'text-emerald-600' : 'text-red-500')}>
            {balance > 0 ? '+' : ''}{balance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </span>
    );
}

export default function SuppliersIndex({ suppliers, stats, filters }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters.search ?? '');

    function applyFilter(extra) {
        router.get('/proveedores', { ...filters, search, ...extra }, {
            preserveState: true, replace: true,
        });
    }

    function handleSearch(e) {
        e.preventDefault();
        applyFilter({});
    }

    function confirmDelete(supplier) {
        if (confirm(`¿Eliminar "${supplier.name}"?`)) {
            router.delete(`/proveedores/${supplier.id}`);
        }
    }

    return (
        <AppLayout title="Proveedores">
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
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-[#2B2B2B]">Proveedores</h1>
                        <p className="text-sm text-[#2B2B2B]/50 mt-0.5">Gestión de proveedores y cuenta corriente</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/compras/crear">
                            <Button variant="outline">
                                <ShoppingCart size={15} />
                                Nueva compra
                            </Button>
                        </Link>
                        <Link href="/proveedores/crear">
                            <Button>
                                <Plus size={15} />
                                Nuevo proveedor
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <StatCard label="Total proveedores" value={stats.total} icon={Building2} color="bg-[#2D4C73]/10 text-[#2D4C73]" />
                    <StatCard label="Activos" value={stats.active} icon={CheckCircle} color="bg-emerald-100 text-emerald-700" />
                    <StatCard label="Inactivos" value={stats.total - stats.active} icon={XCircle} color="bg-slate-100 text-slate-500" />
                </div>

                {/* Search */}
                <div className="bg-white border border-[#D3D3D3] rounded-xl p-4 space-y-3">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2B2B]/35 pointer-events-none" />
                            <Input
                                placeholder="Buscar por nombre, CUIT o ciudad…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Button type="submit" variant="outline">Buscar</Button>
                        <AppSelect
                            value={filters.active ?? ''}
                            onValueChange={val => applyFilter({ active: val || undefined })}
                            options={[
                                { value: '1', label: 'Activos' },
                                { value: '0', label: 'Inactivos' },
                            ]}
                            placeholder="Todos"
                        />
                        {(filters.search || filters.active !== undefined) && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => router.get('/proveedores', {}, { replace: true })}
                                className="text-xs text-[#2B2B2B]/50"
                            >
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
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Proveedor</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Contacto</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Condición</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Saldo CC</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Estado</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D3D3D3]/40">
                            {suppliers.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-[#2B2B2B]/35 text-sm">
                                        No se encontraron proveedores.
                                    </td>
                                </tr>
                            )}
                            {suppliers.data.map(s => (
                                <tr key={s.id} className="hover:bg-[#F4F4F4]/60 transition-colors group">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-[#2B2B2B]">{s.name}</div>
                                        {s.cuit && <div className="text-xs text-[#2B2B2B]/40 font-mono">{s.cuit}</div>}
                                        {s.city && <div className="text-xs text-[#2B2B2B]/40">{s.city}{s.province ? `, ${s.province}` : ''}</div>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="space-y-0.5">
                                            {s.contact_name && <div className="text-xs text-[#2B2B2B]/70">{s.contact_name}</div>}
                                            {s.phone && (
                                                <div className="flex items-center gap-1 text-xs text-[#2B2B2B]/50">
                                                    <Phone size={10} /> {s.phone}
                                                </div>
                                            )}
                                            {s.email && (
                                                <div className="flex items-center gap-1 text-xs text-[#2B2B2B]/50">
                                                    <Mail size={10} /> {s.email}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-[#2B2B2B]/60">
                                        {s.payment_terms || <span className="text-[#2B2B2B]/25">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <BalanceBadge balance={s.balance} />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <Badge variant={s.is_active ? 'success' : 'secondary'}>
                                            {s.is_active ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                                            <Link href={`/proveedores/${s.id}`}>
                                                <button className="p-1.5 rounded-md hover:bg-[#2D4C73]/10 text-[#2D4C73] transition-colors" title="Ver">
                                                    <Eye size={14} />
                                                </button>
                                            </Link>
                                            <Link href={`/proveedores/${s.id}/editar`}>
                                                <button className="p-1.5 rounded-md hover:bg-[#F58220]/10 text-[#F58220] transition-colors" title="Editar">
                                                    <Pencil size={14} />
                                                </button>
                                            </Link>
                                            <button
                                                onClick={() => confirmDelete(s)}
                                                className="p-1.5 rounded-md hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {suppliers.last_page > 1 && (
                        <div className="px-4 py-3 border-t border-[#D3D3D3]/60 flex items-center justify-between">
                            <span className="text-xs text-[#2B2B2B]/40">
                                {suppliers.from}–{suppliers.to} de {suppliers.total} proveedores
                            </span>
                            <div className="flex gap-1">
                                {suppliers.links.map((link, i) => (
                                    <button
                                        key={i}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={cn(
                                            'px-3 py-1 rounded-md text-xs transition-colors',
                                            link.active
                                                ? 'bg-[#F58220] text-white font-semibold'
                                                : link.url
                                                    ? 'text-[#2B2B2B]/60 hover:bg-[#F4F4F4]'
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
