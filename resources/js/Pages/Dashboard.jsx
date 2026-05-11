import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { TrendingUp, AlertTriangle, Wallet, Users, ArrowRight } from 'lucide-react';

const CARDS = [
    {
        label:   'Ventas hoy',
        value:   '$0',
        sub:     '0 operaciones registradas',
        icon:    TrendingUp,
        color:   '#F58220',
        bg:      '#fef3e8',
    },
    {
        label:   'Stock bajo',
        value:   '—',
        sub:     'Sin alertas por ahora',
        icon:    AlertTriangle,
        color:   '#d97706',
        bg:      '#fef9ee',
    },
    {
        label:   'Caja',
        value:   'Cerrada',
        sub:     'Abrí la caja para operar',
        icon:    Wallet,
        color:   '#2D4C73',
        bg:      '#eef3f8',
    },
    {
        label:   'Clientes activos',
        value:   '0',
        sub:     'Registrados en el sistema',
        icon:    Users,
        color:   '#059669',
        bg:      '#ecfdf5',
    },
];

function SummaryCard({ label, value, sub, icon: Icon, color, bg }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group cursor-default">
            <div className="h-[3px] w-full" style={{ backgroundColor: color }} />
            <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{label}</p>
                    <div className="p-2 rounded-xl" style={{ backgroundColor: bg }}>
                        <Icon size={18} style={{ color }} strokeWidth={1.8} />
                    </div>
                </div>
                <p className="text-3xl font-bold tracking-tight" style={{ color: '#2B2B2B' }}>
                    {value}
                </p>
                <p className="text-xs text-gray-400 mt-2">{sub}</p>
            </div>
        </div>
    );
}

function QuickAction({ label, href, description }) {
    return (
        <a
            href={href}
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-[#F58220]/40 hover:shadow-sm transition-all group"
        >
            <div>
                <p className="text-sm font-semibold text-[#2B2B2B] group-hover:text-[#F58220] transition-colors">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{description}</p>
            </div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-[#F58220] transition-colors" />
        </a>
    );
}

export default function Dashboard() {
    const { auth } = usePage().props;
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

    return (
        <AppLayout title="Inicio">
            <Head title="Inicio" />

            <div className="space-y-7">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-[22px] font-bold tracking-tight text-[#2B2B2B]">
                            {greeting}, {auth.user?.name?.split(' ')[0]} 👋
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {CARDS.map(card => <SummaryCard key={card.label} {...card} />)}
                </div>

                {/* Acciones rápidas */}
                <div>
                    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                        Acciones rápidas
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <QuickAction label="Nueva venta"       href="/ventas/crear"       description="Crear presupuesto u orden de venta" />
                        <QuickAction label="Abrir caja"        href="/caja"               description="Registrar apertura del día" />
                        <QuickAction label="Nuevo producto"    href="/productos/crear"    description="Agregar producto al catálogo" />
                        <QuickAction label="Nuevo cliente"     href="/clientes/crear"     description="Registrar cliente en el sistema" />
                        <QuickAction label="Importar precios"  href="/proveedores"        description="Cargar lista de precios de proveedor" />
                        <QuickAction label="Ver reportes"      href="/reportes"           description="Resumen de ventas y stock" />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
