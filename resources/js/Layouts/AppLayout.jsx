import { Link, router, usePage } from '@inertiajs/react';
import {
    LayoutDashboard, Package, ShoppingCart, Truck,
    Users, Building2, Wallet, BarChart2, Settings, LogOut, ChevronRight, FolderOpen, FileUp, Receipt,
} from 'lucide-react';

const NAV_ITEMS = [
    { label: 'Inicio',        href: '/dashboard',     icon: LayoutDashboard },
    { label: 'Productos',     href: '/productos',      icon: Package         },
    { label: 'Categorías',    href: '/categorias',     icon: FolderOpen      },
    { label: 'Ventas',        href: '/ventas',         icon: ShoppingCart    },
    { label: 'Compras',       href: '/compras',        icon: Truck           },
    { label: 'Clientes',      href: '/clientes',       icon: Users           },
    { label: 'Proveedores',   href: '/proveedores',    icon: Building2       },
    { label: 'Caja',          href: '/caja',           icon: Wallet          },
    { label: 'Importar precios', href: '/importacion',  icon: FileUp          },
    { label: 'Facturación',   href: '/facturacion',    icon: Receipt         },
    { label: 'Reportes',      href: '/reportes',       icon: BarChart2       },
    { label: 'Configuración', href: '/configuracion/usuarios', icon: Settings },
];

function NavItem({ item }) {
    const { url } = usePage();
    const isActive = url === item.href || url.startsWith(item.href + '/');
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            className={[
                'group flex items-center gap-3 mx-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-all duration-150',
                isActive
                    ? 'bg-[#F58220] text-white shadow-sm'
                    : 'text-white/70 hover:bg-white/10 hover:text-white',
            ].join(' ')}
        >
            <Icon
                size={17}
                strokeWidth={isActive ? 2.2 : 1.8}
                className="shrink-0"
            />
            <span className="flex-1">{item.label}</span>
            {isActive && <ChevronRight size={14} className="opacity-60" />}
        </Link>
    );
}

function Sidebar() {
    return (
        <aside
            className="fixed inset-y-0 left-0 z-30 flex flex-col"
            style={{ width: 240, background: 'linear-gradient(180deg, #2D4C73 0%, #1f3550 100%)' }}
        >
            {/* Logo */}
            <div className="flex items-center justify-center px-6 py-6">
                <img
                    src="/images/logo.jpeg"
                    alt="Electricidad Centro"
                    width={136}
                    className="object-contain"
                />
            </div>

            {/* Separador */}
            <div className="mx-5 mb-4 rounded-full" style={{ height: 2, backgroundColor: '#F58220', opacity: 0.8 }} />

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-1 space-y-0.5">
                {NAV_ITEMS.map(item => (
                    <NavItem key={item.href} item={item} />
                ))}
            </nav>

            {/* Footer sidebar */}
            <div className="mx-5 mb-5 mt-3 pt-3 border-t border-white/10">
                <p className="text-[10px] text-white/30 text-center tracking-widest uppercase">
                    Sistema de Gestión
                </p>
            </div>
        </aside>
    );
}

function Header({ title }) {
    const { auth } = usePage().props;

    function handleLogout(e) {
        e.preventDefault();
        router.post('/logout');
    }

    const initials = auth.user?.name
        ?.split(' ')
        .slice(0, 2)
        .map(n => n[0])
        .join('')
        .toUpperCase() ?? '?';

    return (
        <header
            className="fixed top-0 right-0 z-20 flex items-center justify-between px-6 border-b border-white/5"
            style={{ left: 240, height: 56, backgroundColor: '#2B2B2B' }}
        >
            {/* Título */}
            <div className="flex items-center gap-2">
                <span className="text-white/40 text-xs">Electricidad Centro</span>
                <span className="text-white/30 text-xs">/</span>
                <span className="text-white text-sm font-medium">{title}</span>
            </div>

            {/* Usuario */}
            <div className="flex items-center gap-3">
                {/* Avatar */}
                <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                    style={{ backgroundColor: '#F58220' }}
                >
                    {initials}
                </div>
                <span className="text-white/80 text-sm hidden sm:block">{auth.user?.name}</span>
                <span className="text-white/20 text-xs hidden sm:block">·</span>
                <span className="text-white/50 text-xs hidden sm:block capitalize">{auth.user?.role}</span>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="ml-1 flex items-center gap-1.5 text-white/50 hover:text-white/90 text-xs transition-colors px-2 py-1 rounded-md hover:bg-white/10"
                    title="Cerrar sesión"
                >
                    <LogOut size={14} />
                    <span>Salir</span>
                </button>
            </div>
        </header>
    );
}

export default function AppLayout({ children, title = 'Inicio' }) {
    return (
        <div className="min-h-screen" style={{ backgroundColor: '#F4F4F4' }}>
            <Sidebar />
            <Header title={title} />
            <main style={{ marginLeft: 240, paddingTop: 56 }}>
                <div className="p-6 max-w-[1400px]">
                    {children}
                </div>
            </main>
        </div>
    );
}
