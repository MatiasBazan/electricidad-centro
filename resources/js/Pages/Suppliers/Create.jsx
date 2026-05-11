import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import SupplierForm from './Partials/SupplierForm';

export default function SupplierCreate() {
    return (
        <AppLayout title="Nuevo proveedor">
            <div className="max-w-2xl space-y-4">
                <Link href="/proveedores" className="inline-flex items-center gap-1 text-sm text-[#2B2B2B]/50 hover:text-[#2B2B2B] transition-colors">
                    <ChevronLeft size={15} /> Proveedores
                </Link>
                <h1 className="text-xl font-bold text-[#2B2B2B]">Nuevo proveedor</h1>
                <SupplierForm />
            </div>
        </AppLayout>
    );
}
