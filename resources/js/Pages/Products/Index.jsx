import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Package, Plus, Search, Filter, AlertTriangle,
    ChevronDown, ArrowUpDown, Eye, Pencil, Trash2,
    Layers, Box, GitMerge, CheckCircle, XCircle,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import AppSelect from '@/components/ui/AppSelect';
import { cn } from '@/lib/utils';

const TYPE_LABELS = {
    simple:  { label: 'Simple',   icon: Box,      color: 'bg-slate-100 text-slate-700' },
    variant: { label: 'Variable', icon: Layers,    color: 'bg-blue-50 text-blue-700' },
    bundle:  { label: 'Bundle',   icon: GitMerge,  color: 'bg-purple-50 text-purple-700' },
};

const STOCK_LABELS = {
    ok:  { label: 'OK',      variant: 'success' },
    low: { label: 'Bajo',    variant: 'warning' },
    out: { label: 'Sin stock', variant: 'danger' },
};

const RUBROS = ['Ferretería', 'Electricidad', 'Ropa de trabajo', 'Otros'];

function StatCard({ label, value, icon: Icon, color, onClick, active }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'flex items-center gap-3 px-5 py-4 rounded-xl border text-left transition-all',
                active
                    ? 'border-[#F58220] bg-[#F58220]/5 shadow-sm'
                    : 'border-[#D3D3D3] bg-white hover:border-[#F58220]/40 hover:shadow-sm',
            )}
        >
            <span className={cn('p-2 rounded-lg', color)}>
                <Icon size={18} strokeWidth={1.8} />
            </span>
            <div>
                <p className="text-2xl font-bold text-[#2B2B2B] leading-none">{value}</p>
                <p className="text-xs text-[#2B2B2B]/50 mt-0.5">{label}</p>
            </div>
        </button>
    );
}

function TypeBadge({ type }) {
    const { label, icon: Icon, color } = TYPE_LABELS[type] ?? TYPE_LABELS.simple;
    return (
        <span className={cn('inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full', color)}>
            <Icon size={11} />
            {label}
        </span>
    );
}

export default function ProductsIndex({ products, stats, categories, filters }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters.search ?? '');
    const [showFilters, setShowFilters] = useState(
        !!(filters.category_id || filters.rubro || filters.type || filters.stock_status)
    );
    const [deleting, setDeleting] = useState(null);

    function applyFilter(extra) {
        router.get('/productos', { ...filters, search, ...extra }, {
            preserveState: true,
            replace: true,
        });
    }

    function handleSearch(e) {
        e.preventDefault();
        applyFilter({});
    }

    function clearFilter(key) {
        const next = { ...filters };
        delete next[key];
        router.get('/productos', { ...next, search }, { preserveState: true, replace: true });
    }

    function confirmDelete(product) {
        if (confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) {
            router.delete(`/productos/${product.id}`, {
                onSuccess: () => setDeleting(null),
            });
        }
    }

    const flatCategories = categories.flatMap(c => [
        { id: c.id, name: c.name, depth: 0 },
        ...(c.children ?? []).map(ch => ({ id: ch.id, name: ch.name, depth: 1 })),
    ]);

    return (
        <AppLayout title="Productos">
            <div className="space-y-5">

                {/* Flash */}
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
                        <h1 className="text-xl font-bold text-[#2B2B2B]">Productos</h1>
                        <p className="text-sm text-[#2B2B2B]/50 mt-0.5">Gestión de productos, variantes y stock</p>
                    </div>
                    <Link href="/productos/crear">
                        <Button>
                            <Plus size={15} />
                            Nuevo producto
                        </Button>
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard
                        label="Total productos"
                        value={stats.total}
                        icon={Package}
                        color="bg-[#2D4C73]/10 text-[#2D4C73]"
                        onClick={() => applyFilter({ active: undefined })}
                        active={!filters.stock_status}
                    />
                    <StatCard
                        label="Activos"
                        value={stats.active}
                        icon={CheckCircle}
                        color="bg-emerald-100 text-emerald-700"
                        onClick={() => applyFilter({ stock_status: undefined })}
                        active={filters.active === 'true'}
                    />
                    <StatCard
                        label="Stock bajo"
                        value={stats.low_stock}
                        icon={AlertTriangle}
                        color="bg-amber-100 text-amber-700"
                        onClick={() => applyFilter({ stock_status: 'low' })}
                        active={filters.stock_status === 'low'}
                    />
                    <StatCard
                        label="Sin stock"
                        value={stats.no_stock}
                        icon={XCircle}
                        color="bg-red-100 text-red-600"
                        onClick={() => applyFilter({ stock_status: 'out' })}
                        active={filters.stock_status === 'out'}
                    />
                </div>

                {/* Search + Filters bar */}
                <div className="bg-white border border-[#D3D3D3] rounded-xl p-4 space-y-3">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2B2B]/35 pointer-events-none" />
                            <Input
                                placeholder="Buscar por nombre, código o código de barras…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Button type="submit" variant="outline">Buscar</Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowFilters(v => !v)}
                            className="gap-1.5"
                        >
                            <Filter size={14} />
                            Filtros
                            <ChevronDown size={13} className={cn('transition-transform', showFilters && 'rotate-180')} />
                        </Button>
                    </form>

                    {showFilters && (
                        <div className="flex flex-wrap gap-2 pt-1 border-t border-[#D3D3D3]/60">
                            {/* Rubro */}
                            <AppSelect
                                value={filters.rubro || ''}
                                onValueChange={val => applyFilter({ rubro: val || undefined })}
                                options={RUBROS.map(r => ({ value: r, label: r }))}
                                placeholder="Todos los rubros"
                                className="w-auto"
                            />

                            {/* Categoría */}
                            <AppSelect
                                value={filters.category_id || ''}
                                onValueChange={val => applyFilter({ category_id: val || undefined })}
                                options={flatCategories.map(c => ({
                                    value: c.id,
                                    label: c.depth > 0 ? `  ${c.name}` : c.name,
                                }))}
                                placeholder="Todas las categorías"
                                className="w-auto"
                            />

                            {/* Tipo */}
                            <AppSelect
                                value={filters.type || ''}
                                onValueChange={val => applyFilter({ type: val || undefined })}
                                options={[
                                    { value: 'simple', label: 'Simple' },
                                    { value: 'variant', label: 'Variable' },
                                    { value: 'bundle', label: 'Bundle' },
                                ]}
                                placeholder="Todos los tipos"
                                className="w-auto"
                            />

                            {/* Stock status */}
                            <AppSelect
                                value={filters.stock_status || ''}
                                onValueChange={val => applyFilter({ stock_status: val || undefined })}
                                options={[
                                    { value: 'low', label: 'Stock bajo' },
                                    { value: 'out', label: 'Sin stock' },
                                ]}
                                placeholder="Todos los estados"
                                className="w-auto"
                            />

                            {Object.keys(filters).length > 0 && (
                                <button
                                    onClick={() => router.get('/productos', {}, { replace: true })}
                                    className="text-xs text-[#2B2B2B]/50 hover:text-red-500 transition-colors px-2 py-1 rounded-md hover:bg-red-50"
                                >
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="bg-white border border-[#D3D3D3] rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[#D3D3D3]/60 bg-[#F4F4F4]/60">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Código</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Producto</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Categoría</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Tipo</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Stock</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Estado</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D3D3D3]/40">
                            {products.data.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-[#2B2B2B]/35 text-sm">
                                        No se encontraron productos con los filtros actuales.
                                    </td>
                                </tr>
                            )}
                            {products.data.map(p => (
                                <tr key={p.id} className="hover:bg-[#F4F4F4]/60 transition-colors group">
                                    <td className="px-4 py-3 font-mono text-xs text-[#2B2B2B]/60">{p.code}</td>
                                    <td className="px-4 py-3">
                                        <div>
                                            <span className="font-medium text-[#2B2B2B]">{p.name}</span>
                                            {p.brand && (
                                                <span className="text-xs text-[#2B2B2B]/40 ml-1.5">{p.brand}</span>
                                            )}
                                        </div>
                                        {p.variants_count > 1 && (
                                            <span className="text-[11px] text-[#2B2B2B]/40">{p.variants_count} variantes</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-[#2B2B2B]/60 text-xs">{p.category}</td>
                                    <td className="px-4 py-3"><TypeBadge type={p.type} /></td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={cn(
                                            'font-semibold tabular-nums',
                                            p.stock_status === 'out' ? 'text-red-500' :
                                            p.stock_status === 'low' ? 'text-amber-600' :
                                            'text-[#2B2B2B]'
                                        )}>
                                            {p.total_stock}
                                        </span>
                                        <span className="text-[10px] text-[#2B2B2B]/30 ml-1">{p.unit}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <StockBadge status={p.stock_status} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                                            <Link href={`/productos/${p.id}`}>
                                                <button className="p-1.5 rounded-md hover:bg-[#2D4C73]/10 text-[#2D4C73] transition-colors" title="Ver">
                                                    <Eye size={14} />
                                                </button>
                                            </Link>
                                            <Link href={`/productos/${p.id}/editar`}>
                                                <button className="p-1.5 rounded-md hover:bg-[#F58220]/10 text-[#F58220] transition-colors" title="Editar">
                                                    <Pencil size={14} />
                                                </button>
                                            </Link>
                                            <button
                                                onClick={() => confirmDelete(p)}
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

                    {/* Pagination */}
                    {products.last_page > 1 && (
                        <div className="px-4 py-3 border-t border-[#D3D3D3]/60 flex items-center justify-between">
                            <span className="text-xs text-[#2B2B2B]/40">
                                {products.from}–{products.to} de {products.total} productos
                            </span>
                            <div className="flex gap-1">
                                {products.links.map((link, i) => (
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

function StockBadge({ status }) {
    const { label, variant } = STOCK_LABELS[status] ?? STOCK_LABELS.ok;
    return <Badge variant={variant}>{label}</Badge>;
}
