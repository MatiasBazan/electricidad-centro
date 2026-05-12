import { Link, usePage } from '@inertiajs/react';
import {
    TrendingUp, AlertTriangle, Wallet, Users,
    FileText, ClipboardList, ArrowRight, CheckCircle, Clock, Package,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';

const STATUS_STYLES = {
    pending:    'bg-amber-100 text-amber-700',
    processing: 'bg-blue-100 text-blue-700',
    partial:    'bg-orange-100 text-orange-700',
    delivered:  'bg-emerald-100 text-emerald-700',
    invoiced:   'bg-purple-100 text-purple-700',
    cancelled:  'bg-slate-100 text-slate-500',
};
const STATUS_LABELS = {
    pending:    'Pendiente',
    processing: 'En proceso',
    partial:    'Parcial',
    delivered:  'Entregado',
    invoiced:   'Facturado',
    cancelled:  'Cancelado',
};

function money(v) {
    return '$' + Number(v ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 });
}

function StatCard({ label, value, sub, icon: Icon, color, bg, href }) {
    const content = (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
            <div className="h-[3px] w-full" style={{ backgroundColor: color }} />
            <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{label}</p>
                    <div className="p-2 rounded-xl" style={{ backgroundColor: bg }}>
                        <Icon size={18} style={{ color }} strokeWidth={1.8} />
                    </div>
                </div>
                <p className="text-3xl font-bold tracking-tight text-[#2B2B2B]">{value}</p>
                <p className="text-xs text-gray-400 mt-2">{sub}</p>
            </div>
        </div>
    );
    return href ? <Link href={href}>{content}</Link> : content;
}

function QuickAction({ label, href, description }) {
    return (
        <Link
            href={href}
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-[#F58220]/40 hover:shadow-sm transition-all group"
        >
            <div>
                <p className="text-sm font-semibold text-[#2B2B2B] group-hover:text-[#F58220] transition-colors">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{description}</p>
            </div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-[#F58220] transition-colors" />
        </Link>
    );
}

export default function Dashboard({ stats, recentSales }) {
    const { auth } = usePage().props;
    const hour     = new Date().getHours();
    const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

    const cashValue = stats.cash_open
        ? money(stats.cash_expected)
        : 'Cerrada';
    const cashSub = stats.cash_open
        ? `${stats.cash_register} · efectivo esperado`
        : 'Abrí la caja para operar';

    return (
        <AppLayout title="Inicio">
            <div className="space-y-7">

                {/* Saludo */}
                <div>
                    <h1 className="text-[22px] font-bold tracking-tight text-[#2B2B2B]">
                        {greeting}, {auth.user?.name?.split(' ')[0]}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard
                        label="Ventas hoy"
                        value={money(stats.sales_today)}
                        sub={`${stats.sales_today_count} ${stats.sales_today_count === 1 ? 'operación' : 'operaciones'}`}
                        icon={TrendingUp}
                        color="#F58220"
                        bg="#fef3e8"
                        href="/ventas"
                    />
                    <StatCard
                        label="Caja"
                        value={cashValue}
                        sub={cashSub}
                        icon={Wallet}
                        color={stats.cash_open ? '#059669' : '#2D4C73'}
                        bg={stats.cash_open ? '#ecfdf5' : '#eef3f8'}
                        href="/caja"
                    />
                    <StatCard
                        label="Stock bajo"
                        value={stats.low_stock_count}
                        sub={stats.low_stock_count === 0 ? 'Sin alertas' : `${stats.low_stock_count === 1 ? 'producto bajo mínimo' : 'productos bajo mínimo'}`}
                        icon={AlertTriangle}
                        color={stats.low_stock_count > 0 ? '#d97706' : '#6b7280'}
                        bg={stats.low_stock_count > 0 ? '#fef9ee' : '#f9fafb'}
                        href="/productos/alertas/stock"
                    />
                    <StatCard
                        label="Clientes activos"
                        value={stats.active_clients}
                        sub="Registrados en el sistema"
                        icon={Users}
                        color="#2D4C73"
                        bg="#eef3f8"
                        href="/clientes"
                    />
                </div>

                {/* Segunda fila de stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-amber-50">
                            <Clock size={18} className="text-amber-600" strokeWidth={1.8} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#2B2B2B]">{stats.pending_orders}</p>
                            <p className="text-xs text-gray-400">Órdenes pendientes de entrega</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-purple-50">
                            <ClipboardList size={18} className="text-purple-600" strokeWidth={1.8} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#2B2B2B]">{stats.pending_quotations}</p>
                            <p className="text-xs text-gray-400">Presupuestos sin confirmar</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-emerald-50">
                            <FileText size={18} className="text-emerald-600" strokeWidth={1.8} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#2B2B2B]">{money(stats.invoiced_month)}</p>
                            <p className="text-xs text-gray-400">Facturado este mes (AFIP)</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Últimas ventas */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-[#2B2B2B]">Últimas ventas</h2>
                            <Link href="/ventas" className="text-xs text-[#F58220] hover:underline">Ver todas</Link>
                        </div>
                        {recentSales.length === 0 ? (
                            <div className="px-5 py-10 text-center text-sm text-gray-400">Sin ventas registradas</div>
                        ) : (
                            <table className="w-full text-sm">
                                <tbody className="divide-y divide-gray-50">
                                    {recentSales.map(sale => (
                                        <tr key={sale.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-5 py-3">
                                                <Link href={`/ventas/${sale.id}`} className="font-mono text-xs font-semibold text-[#2D4C73] hover:underline">
                                                    {sale.number}
                                                </Link>
                                            </td>
                                            <td className="px-5 py-3 text-[#2B2B2B]/70 text-xs">{sale.client}</td>
                                            <td className="px-5 py-3 text-xs text-[#2B2B2B]/50">{sale.date}</td>
                                            <td className="px-5 py-3">
                                                <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', STATUS_STYLES[sale.status])}>
                                                    {STATUS_LABELS[sale.status] ?? sale.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right font-semibold tabular-nums text-sm">
                                                {money(sale.total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Acciones rápidas */}
                    <div className="space-y-3">
                        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Acciones rápidas</h2>
                        <QuickAction label="Nueva venta"      href="/ventas/crear"         description="Crear orden de venta" />
                        <QuickAction label="Nuevo presupuesto" href="/presupuestos/crear"  description="Armar presupuesto para cliente" />
                        <QuickAction label="Abrir / ver caja" href="/caja"                description="Gestionar caja del día" />
                        <QuickAction label="Nuevo cliente"    href="/clientes/crear"       description="Registrar cliente" />
                        <QuickAction label="Facturación AFIP" href="/facturacion"         description="Emitir comprobantes electrónicos" />
                        <QuickAction label="Ver reportes"     href="/reportes"             description="Resumen de ventas y stock" />
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
