import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    ShoppingCart, Package, Truck, Wallet,
    Download, Search, BarChart2, TrendingUp, AlertCircle,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppSelect from '@/components/ui/AppSelect';
import { cn } from '@/lib/utils';

// ─── helpers ───────────────────────────────────────────
function money(v) {
    return '$' + Number(v ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 });
}
function num(v) {
    return Number(v ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 });
}

const REPORTS = [
    { key: 'ventas',  label: 'Ventas',   icon: ShoppingCart, color: 'text-[#F58220]',   bg: 'bg-[#F58220]/10' },
    { key: 'stock',   label: 'Stock',    icon: Package,      color: 'text-[#2D4C73]',   bg: 'bg-[#2D4C73]/10' },
    { key: 'compras', label: 'Compras',  icon: Truck,        color: 'text-purple-600',  bg: 'bg-purple-50'     },
    { key: 'caja',    label: 'Caja',     icon: Wallet,       color: 'text-emerald-600', bg: 'bg-emerald-50'    },
];

const STATUS_OPTS = {
    ventas:  [
        { value: 'pending',    label: 'Pendiente'   },
        { value: 'processing', label: 'En proceso'  },
        { value: 'partial',    label: 'Parcial'     },
        { value: 'delivered',  label: 'Entregado'   },
        { value: 'invoiced',   label: 'Facturado'   },
        { value: 'cancelled',  label: 'Cancelado'   },
    ],
    compras: [
        { value: 'draft',      label: 'Borrador'    },
        { value: 'sent',       label: 'Enviado'     },
        { value: 'partial',    label: 'Parcial'     },
        { value: 'received',   label: 'Recibido'    },
        { value: 'cancelled',  label: 'Cancelado'   },
    ],
    caja: [
        { value: 'open',   label: 'Abierta' },
        { value: 'closed', label: 'Cerrada' },
    ],
};

// ─── Filtros por tipo ───────────────────────────────────
function Filters({ report, filters, setFilters, suppliers, warehouses, onSearch }) {
    const hasDateRange  = ['ventas', 'compras', 'caja'].includes(report);
    const hasStatus     = ['ventas', 'compras', 'caja'].includes(report);
    const hasSupplier   = report === 'compras';
    const hasWarehouse  = report === 'stock';
    const statusOpts    = STATUS_OPTS[report] ?? [];

    function today() { return new Date().toISOString().slice(0, 10); }
    function firstOfMonth() { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); }

    return (
        <div className="bg-white border border-[#D3D3D3] rounded-xl p-4">
            <div className="flex flex-wrap gap-3 items-end">
                {hasDateRange && (
                    <>
                        <div className="space-y-1">
                            <Label className="text-xs">Desde</Label>
                            <Input
                                type="date"
                                value={filters.from ?? ''}
                                onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
                                className="w-36"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Hasta</Label>
                            <Input
                                type="date"
                                value={filters.to ?? ''}
                                onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
                                className="w-36"
                            />
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs text-[#2B2B2B]/50"
                            onClick={() => setFilters(f => ({ ...f, from: firstOfMonth(), to: today() }))}
                        >
                            Este mes
                        </Button>
                    </>
                )}

                {hasStatus && statusOpts.length > 0 && (
                    <div className="space-y-1">
                        <Label className="text-xs">Estado</Label>
                        <AppSelect
                            value={filters.status ?? ''}
                            onValueChange={v => setFilters(f => ({ ...f, status: v || undefined }))}
                            options={statusOpts}
                            placeholder="Todos"
                        />
                    </div>
                )}

                {hasSupplier && (
                    <div className="space-y-1">
                        <Label className="text-xs">Proveedor</Label>
                        <AppSelect
                            value={filters.supplier_id ?? ''}
                            onValueChange={v => setFilters(f => ({ ...f, supplier_id: v || undefined }))}
                            options={suppliers.map(s => ({ value: String(s.id), label: s.name }))}
                            placeholder="Todos"
                        />
                    </div>
                )}

                {hasWarehouse && (
                    <div className="space-y-1">
                        <Label className="text-xs">Depósito</Label>
                        <AppSelect
                            value={filters.warehouse_id ?? ''}
                            onValueChange={v => setFilters(f => ({ ...f, warehouse_id: v || undefined }))}
                            options={warehouses.map(w => ({ value: String(w.id), label: w.name }))}
                            placeholder="Todos"
                        />
                    </div>
                )}

                <Button onClick={onSearch} className="gap-1.5">
                    <Search size={14} /> Ver datos
                </Button>
            </div>
        </div>
    );
}

// ─── Tarjetas de resumen ────────────────────────────────
function SummaryCards({ report, summary }) {
    if (!summary || Object.keys(summary).length === 0) return null;

    const cards = {
        ventas: [
            { label: 'Órdenes',       value: summary.total_orders,  fmt: v => v },
            { label: 'Total facturado', value: summary.total_revenue, fmt: money },
            { label: 'IVA total',      value: summary.total_tax,     fmt: money },
            { label: 'Ticket promedio',value: summary.avg_order,     fmt: money },
        ],
        stock: [
            { label: 'SKUs',           value: summary.total_skus,    fmt: v => v },
            { label: 'Valor en stock', value: summary.total_value,   fmt: money },
            { label: 'Sin stock',      value: summary.out_of_stock,  fmt: v => v, alert: summary.out_of_stock > 0 },
        ],
        compras: [
            { label: 'Órdenes',        value: summary.total_orders,  fmt: v => v },
            { label: 'Total gastado',  value: summary.total_spent,   fmt: money },
        ],
        caja: [
            { label: 'Sesiones',       value: summary.total_sessions,  fmt: v => v },
            { label: 'Sesiones cerradas', value: summary.closed_sessions, fmt: v => v },
            { label: 'Diferencia total', value: summary.total_diff,    fmt: money,
              alert: Math.abs(summary.total_diff) > 0 },
        ],
    };

    const items = cards[report] ?? [];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {items.map((c, i) => (
                <div
                    key={i}
                    className={cn(
                        'bg-white border rounded-xl px-4 py-3 text-center',
                        c.alert ? 'border-amber-200 bg-amber-50' : 'border-[#D3D3D3]',
                    )}
                >
                    {c.alert && <AlertCircle size={13} className="text-amber-500 mx-auto mb-1" />}
                    <p className={cn('text-xl font-bold tabular-nums', c.alert ? 'text-amber-600' : 'text-[#2D4C73]')}>
                        {c.fmt(c.value)}
                    </p>
                    <p className="text-xs text-[#2B2B2B]/50 mt-0.5">{c.label}</p>
                </div>
            ))}
        </div>
    );
}

// ─── Tablas de preview ──────────────────────────────────
function VentasTable({ rows }) {
    const STATUS_COLOR = {
        pending:'bg-slate-100 text-slate-500', processing:'bg-blue-100 text-blue-700',
        partial:'bg-amber-100 text-amber-700', delivered:'bg-emerald-100 text-emerald-700',
        invoiced:'bg-green-100 text-green-700', cancelled:'bg-red-100 text-red-500',
    };
    return (
        <table className="w-full text-sm">
            <thead>
                <tr className="border-b border-[#D3D3D3]/60 bg-[#F4F4F4]/60">
                    {['#Orden','Fecha','Cliente','Vendedor','Estado','Tipo pago','Subtotal','Descuento','IVA','Total'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-[#D3D3D3]/40">
                {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-[#F4F4F4]/60">
                        <td className="px-3 py-2 font-mono text-xs text-[#2B2B2B]/70">{r.number}</td>
                        <td className="px-3 py-2 text-xs whitespace-nowrap">{r.date}</td>
                        <td className="px-3 py-2 max-w-[180px] truncate">{r.client}</td>
                        <td className="px-3 py-2 text-xs text-[#2B2B2B]/60">{r.user}</td>
                        <td className="px-3 py-2">
                            <span className={cn('text-[11px] font-medium px-1.5 py-0.5 rounded-full', STATUS_COLOR[r.status] ?? 'bg-slate-100 text-slate-500')}>{r.status}</span>
                        </td>
                        <td className="px-3 py-2 text-xs text-[#2B2B2B]/60 capitalize">{r.payment_type}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-xs">{money(r.subtotal)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-xs text-red-400">{r.discount_amount > 0 ? '-' + money(r.discount_amount) : '—'}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-xs">{money(r.tax_amount)}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold">{money(r.total)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function StockTable({ rows }) {
    return (
        <table className="w-full text-sm">
            <thead>
                <tr className="border-b border-[#D3D3D3]/60 bg-[#F4F4F4]/60">
                    {['Código','SKU','Producto','Categoría','Depósito','Cantidad','Reservado','Disponible','P.Costo','P.Venta','Valor'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-[#D3D3D3]/40">
                {rows.map((r, i) => (
                    <tr key={i} className={cn('hover:bg-[#F4F4F4]/60', r.available <= 0 && 'bg-red-50/40')}>
                        <td className="px-3 py-2 font-mono text-xs text-[#2B2B2B]/70">{r.code}</td>
                        <td className="px-3 py-2 font-mono text-xs">{r.sku}</td>
                        <td className="px-3 py-2 max-w-[200px] truncate">{r.name}</td>
                        <td className="px-3 py-2 text-xs text-[#2B2B2B]/50">{r.category}</td>
                        <td className="px-3 py-2 text-xs">{r.warehouse}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-xs">{num(r.quantity)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-xs text-amber-500">{num(r.reserved)}</td>
                        <td className={cn('px-3 py-2 text-right tabular-nums font-semibold text-xs', r.available <= 0 ? 'text-red-500' : 'text-emerald-600')}>{num(r.available)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-xs">{money(r.cost_price)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-xs">{money(r.sale_price)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-xs font-medium text-[#2D4C73]">{money(r.value)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function ComprasTable({ rows }) {
    const STATUS_COLOR = {
        draft:'bg-slate-100 text-slate-500', sent:'bg-blue-100 text-blue-700',
        partial:'bg-amber-100 text-amber-700', received:'bg-emerald-100 text-emerald-700',
        cancelled:'bg-red-100 text-red-500',
    };
    return (
        <table className="w-full text-sm">
            <thead>
                <tr className="border-b border-[#D3D3D3]/60 bg-[#F4F4F4]/60">
                    {['#Orden','Fecha','Proveedor','Solicitó','Estado','F. Esperada','Subtotal','IVA','Total'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-[#D3D3D3]/40">
                {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-[#F4F4F4]/60">
                        <td className="px-3 py-2 font-mono text-xs text-[#2B2B2B]/70">{r.order_number}</td>
                        <td className="px-3 py-2 text-xs whitespace-nowrap">{r.date}</td>
                        <td className="px-3 py-2 max-w-[180px] truncate">{r.supplier}</td>
                        <td className="px-3 py-2 text-xs text-[#2B2B2B]/60">{r.user}</td>
                        <td className="px-3 py-2">
                            <span className={cn('text-[11px] font-medium px-1.5 py-0.5 rounded-full', STATUS_COLOR[r.status] ?? 'bg-slate-100 text-slate-500')}>{r.status}</span>
                        </td>
                        <td className="px-3 py-2 text-xs text-[#2B2B2B]/50">{r.expected_date}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-xs">{money(r.subtotal)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-xs">{money(r.tax_amount)}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold">{money(r.total)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function CajaTable({ rows }) {
    return (
        <table className="w-full text-sm">
            <thead>
                <tr className="border-b border-[#D3D3D3]/60 bg-[#F4F4F4]/60">
                    {['#','Apertura','Cierre','Operador','Caja','Estado','Fondo inicial','Esperado','Real','Diferencia'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-[#D3D3D3]/40">
                {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-[#F4F4F4]/60">
                        <td className="px-3 py-2 text-xs text-[#2B2B2B]/50">{r.id}</td>
                        <td className="px-3 py-2 text-xs whitespace-nowrap">{r.opened_at}</td>
                        <td className="px-3 py-2 text-xs whitespace-nowrap text-[#2B2B2B]/50">{r.closed_at}</td>
                        <td className="px-3 py-2 text-xs">{r.user}</td>
                        <td className="px-3 py-2 text-xs text-[#2B2B2B]/60">{r.cash_register}</td>
                        <td className="px-3 py-2">
                            <span className={cn('text-[11px] font-medium px-1.5 py-0.5 rounded-full', r.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                                {r.status === 'open' ? 'Abierta' : 'Cerrada'}
                            </span>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-xs">{money(r.opening_amount)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-xs">{money(r.expected_cash)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-xs">{money(r.closing_amount)}</td>
                        <td className={cn('px-3 py-2 text-right tabular-nums font-semibold text-xs', r.difference > 0 ? 'text-emerald-600' : r.difference < 0 ? 'text-red-500' : 'text-[#2B2B2B]/30')}>
                            {r.difference !== 0 ? (r.difference > 0 ? '+' : '') + money(r.difference) : '—'}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

const TABLES = { ventas: VentasTable, stock: StockTable, compras: ComprasTable, caja: CajaTable };

// ─── Página principal ───────────────────────────────────
export default function ReportsIndex({ report, filters: initFilters, rows, total_rows, summary, suppliers, warehouses }) {
    const [activeReport, setActiveReport] = useState(report || '');
    const [filters, setFilters] = useState(initFilters ?? {});

    function selectReport(key) {
        setActiveReport(key);
        setFilters({});
        router.get('/reportes', { report: key }, { preserveState: false, replace: true });
    }

    function search() {
        router.get('/reportes', { report: activeReport, ...filters }, { preserveState: true, replace: true });
    }

    function exportUrl() {
        const params = new URLSearchParams({ ...filters });
        return `/reportes/${activeReport}/exportar?${params.toString()}`;
    }

    const TableComponent = TABLES[activeReport];

    return (
        <AppLayout title="Reportes">
            <div className="space-y-5">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-[#2B2B2B]">Reportes</h1>
                        <p className="text-sm text-[#2B2B2B]/50 mt-0.5">Consultá y exportá datos del sistema a Excel</p>
                    </div>
                    {activeReport && rows?.length > 0 && (
                        <a href={exportUrl()}>
                            <Button variant="outline" className="gap-1.5">
                                <Download size={14} /> Exportar Excel
                            </Button>
                        </a>
                    )}
                </div>

                {/* Selector de reporte */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {REPORTS.map(r => {
                        const Icon = r.icon;
                        const isActive = activeReport === r.key;
                        return (
                            <button
                                key={r.key}
                                onClick={() => selectReport(r.key)}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all',
                                    isActive
                                        ? 'border-[#F58220] bg-[#F58220]/5 shadow-sm'
                                        : 'border-[#D3D3D3] bg-white hover:border-[#F58220]/40',
                                )}
                            >
                                <span className={cn('p-2 rounded-lg', r.bg, r.color)}>
                                    <Icon size={17} strokeWidth={1.8} />
                                </span>
                                <div>
                                    <p className="font-semibold text-sm text-[#2B2B2B]">{r.label}</p>
                                    <p className="text-[11px] text-[#2B2B2B]/40">Exportar</p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Filtros */}
                {activeReport && (
                    <Filters
                        report={activeReport}
                        filters={filters}
                        setFilters={setFilters}
                        suppliers={suppliers}
                        warehouses={warehouses}
                        onSearch={search}
                    />
                )}

                {/* Resumen */}
                {activeReport && rows?.length > 0 && (
                    <SummaryCards report={activeReport} summary={summary} />
                )}

                {/* Tabla de datos */}
                {activeReport && (
                    <div className="bg-white border border-[#D3D3D3] rounded-xl overflow-hidden">
                        {rows?.length > 0 ? (
                            <>
                                <div className="flex items-center justify-between px-4 py-3 border-b border-[#D3D3D3]/60">
                                    <p className="text-sm font-semibold text-[#2B2B2B]">
                                        Vista previa
                                        <span className="text-[#2B2B2B]/40 font-normal ml-2 text-xs">
                                            {rows.length} de {total_rows} registros{total_rows > 300 && ' — exportá para ver todos'}
                                        </span>
                                    </p>
                                    <a href={exportUrl()}>
                                        <Button size="sm" variant="outline" className="gap-1 h-7 text-xs">
                                            <Download size={12} /> Excel
                                        </Button>
                                    </a>
                                </div>
                                <div className="overflow-x-auto">
                                    {TableComponent && <TableComponent rows={rows} />}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-14 text-[#2B2B2B]/30 gap-2">
                                <BarChart2 size={32} strokeWidth={1.2} />
                                <p className="text-sm">Aplicá filtros y hacé clic en "Ver datos"</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Estado inicial */}
                {!activeReport && (
                    <div className="flex flex-col items-center justify-center py-20 text-[#2B2B2B]/25 gap-3">
                        <TrendingUp size={40} strokeWidth={1} />
                        <p className="text-sm">Seleccioná un tipo de reporte para comenzar</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
