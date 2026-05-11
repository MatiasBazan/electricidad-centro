import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Users, Plus, Search, Eye, Pencil, Trash2,
    Building2, User, CheckCircle, XCircle, CreditCard,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import AppSelect from '@/components/ui/AppSelect';
import { cn } from '@/lib/utils';

const TAX_LABELS = {
    consumidor_final:      'Cons. Final',
    responsable_inscripto: 'Resp. Inscripto',
    monotributista:        'Monotributo',
    exento:                'Exento',
};

const TAX_COLORS = {
    consumidor_final:      'bg-slate-100 text-slate-600',
    responsable_inscripto: 'bg-blue-50 text-blue-700',
    monotributista:        'bg-purple-50 text-purple-700',
    exento:                'bg-amber-50 text-amber-700',
};

function StatCard({ label, value, icon: Icon, color, onClick, active }) {
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
                <Icon size={17} strokeWidth={1.8} />
            </span>
            <div>
                <p className="text-xl font-bold text-[#2B2B2B] leading-none">{value}</p>
                <p className="text-[11px] text-[#2B2B2B]/50 mt-0.5">{label}</p>
            </div>
        </button>
    );
}

function BalanceBadge({ balance }) {
    if (balance === 0) return <span className="text-xs text-[#2B2B2B]/30">—</span>;
    return (
        <span className={cn('text-sm font-semibold tabular-nums', balance > 0 ? 'text-red-500' : 'text-emerald-600')}>
            ${Math.abs(balance).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            <span className="text-[10px] font-normal ml-1 text-[#2B2B2B]/40">
                {balance > 0 ? 'debe' : 'favor'}
            </span>
        </span>
    );
}

export default function ClientsIndex({ clients, stats, filters }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters.search ?? '');

    function applyFilter(extra) {
        router.get('/clientes', { ...filters, search, ...extra }, {
            preserveState: true, replace: true,
        });
    }

    function handleSearch(e) {
        e.preventDefault();
        applyFilter({});
    }

    function confirmDelete(client) {
        if (confirm(`¿Eliminar "${client.name}"?`)) {
            router.delete(`/clientes/${client.id}`);
        }
    }

    return (
        <AppLayout title="Clientes">
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
                        <h1 className="text-xl font-bold text-[#2B2B2B]">Clientes</h1>
                        <p className="text-sm text-[#2B2B2B]/50 mt-0.5">ABM de clientes y cuenta corriente</p>
                    </div>
                    <Link href="/clientes/crear">
                        <Button>
                            <Plus size={15} /> Nuevo cliente
                        </Button>
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <StatCard
                        label="Total clientes"
                        value={stats.total}
                        icon={Users}
                        color="bg-[#2D4C73]/10 text-[#2D4C73]"
                        onClick={() => applyFilter({ type: undefined })}
                        active={!filters.type}
                    />
                    <StatCard
                        label="Empresas"
                        value={stats.empresa}
                        icon={Building2}
                        color="bg-blue-50 text-blue-700"
                        onClick={() => applyFilter({ type: 'empresa' })}
                        active={filters.type === 'empresa'}
                    />
                    <StatCard
                        label="Cons. Final"
                        value={stats.consumidor_final}
                        icon={User}
                        color="bg-slate-100 text-slate-600"
                        onClick={() => applyFilter({ type: 'consumidor_final' })}
                        active={filters.type === 'consumidor_final'}
                    />
                    <StatCard
                        label="Activos"
                        value={stats.active}
                        icon={CheckCircle}
                        color="bg-emerald-100 text-emerald-700"
                        onClick={() => applyFilter({ active: '1' })}
                        active={filters.active === '1'}
                    />
                    <StatCard
                        label="Con saldo CC"
                        value={stats.with_balance}
                        icon={CreditCard}
                        color="bg-amber-50 text-amber-700"
                        onClick={() => applyFilter({})}
                        active={false}
                    />
                </div>

                {/* Search */}
                <div className="bg-white border border-[#D3D3D3] rounded-xl p-4">
                    <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
                        <div className="relative flex-1 min-w-48">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2B2B]/35 pointer-events-none" />
                            <Input
                                placeholder="Buscar por nombre, DNI, CUIT, teléfono o email…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Button type="submit" variant="outline">Buscar</Button>
                        <AppSelect
                            value={filters.type ?? ''}
                            onValueChange={val => applyFilter({ type: val || undefined })}
                            options={[
                                { value: 'empresa', label: 'Empresas' },
                                { value: 'consumidor_final', label: 'Consumidor Final' },
                            ]}
                            placeholder="Todos los tipos"
                        />
                        <AppSelect
                            value={filters.tax_condition ?? ''}
                            onValueChange={val => applyFilter({ tax_condition: val || undefined })}
                            options={[
                                { value: 'consumidor_final',      label: 'Cons. Final' },
                                { value: 'responsable_inscripto', label: 'Resp. Inscripto' },
                                { value: 'monotributista',         label: 'Monotributista' },
                                { value: 'exento',                 label: 'Exento' },
                            ]}
                            placeholder="Condición fiscal"
                        />
                        {(filters.search || filters.type || filters.tax_condition || filters.active) && (
                            <Button type="button" variant="ghost" onClick={() => router.get('/clientes', {}, { replace: true })} className="text-xs text-[#2B2B2B]/50">
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
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Cliente</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Documento</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Condición fiscal</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Contacto</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Saldo CC</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Estado</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D3D3D3]/40">
                            {clients.data.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-[#2B2B2B]/35 text-sm">
                                        No se encontraron clientes.
                                    </td>
                                </tr>
                            )}
                            {clients.data.map(c => (
                                <tr key={c.id} className="hover:bg-[#F4F4F4]/60 transition-colors group">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className={cn('p-1 rounded', c.type === 'empresa' ? 'text-blue-600' : 'text-slate-400')}>
                                                {c.type === 'empresa' ? <Building2 size={13} /> : <User size={13} />}
                                            </span>
                                            <div>
                                                <div className="font-medium text-[#2B2B2B]">{c.name}</div>
                                                {c.fantasy_name && (
                                                    <div className="text-xs text-[#2B2B2B]/40">{c.fantasy_name}</div>
                                                )}
                                                {c.city && (
                                                    <div className="text-[11px] text-[#2B2B2B]/30">{c.city}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-xs font-mono text-[#2B2B2B]/70 uppercase">
                                            {c.document_type} {c.document_number}
                                        </div>
                                        {c.cuit_cuil && (
                                            <div className="text-[11px] text-[#2B2B2B]/40 font-mono">CUIT: {c.cuit_cuil}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', TAX_COLORS[c.tax_condition] ?? 'bg-slate-100 text-slate-600')}>
                                            {TAX_LABELS[c.tax_condition] ?? c.tax_condition}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-[#2B2B2B]/60 space-y-0.5">
                                        {c.phone && <div>{c.phone}</div>}
                                        {c.mobile && !c.phone && <div>{c.mobile}</div>}
                                        {c.email && <div className="text-[#2B2B2B]/40">{c.email}</div>}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <BalanceBadge balance={c.balance} />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <Badge variant={c.is_active ? 'success' : 'secondary'}>
                                            {c.is_active ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                                            <Link href={`/clientes/${c.id}`}>
                                                <button className="p-1.5 rounded-md hover:bg-[#2D4C73]/10 text-[#2D4C73] transition-colors" title="Ver">
                                                    <Eye size={14} />
                                                </button>
                                            </Link>
                                            <Link href={`/clientes/${c.id}/editar`}>
                                                <button className="p-1.5 rounded-md hover:bg-[#F58220]/10 text-[#F58220] transition-colors" title="Editar">
                                                    <Pencil size={14} />
                                                </button>
                                            </Link>
                                            <button
                                                onClick={() => confirmDelete(c)}
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

                    {clients.last_page > 1 && (
                        <div className="px-4 py-3 border-t border-[#D3D3D3]/60 flex items-center justify-between">
                            <span className="text-xs text-[#2B2B2B]/40">
                                {clients.from}–{clients.to} de {clients.total} clientes
                            </span>
                            <div className="flex gap-1">
                                {clients.links.map((link, i) => (
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
