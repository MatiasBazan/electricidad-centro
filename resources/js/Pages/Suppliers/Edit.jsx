import { Link, router } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import SupplierForm from './Partials/SupplierForm';

export default function SupplierEdit({ supplier }) {
    return (
        <AppLayout title="Editar proveedor">
            <div className="max-w-2xl space-y-4">
                <Link href={`/proveedores/${supplier.id}`} className="inline-flex items-center gap-1 text-sm text-[#2B2B2B]/50 hover:text-[#2B2B2B] transition-colors">
                    <ChevronLeft size={15} /> {supplier.name}
                </Link>
                <h1 className="text-xl font-bold text-[#2B2B2B]">Editar proveedor</h1>
                <SupplierForm
                    supplier={supplier}
                    onCancel={() => router.visit(`/proveedores/${supplier.id}`)}
                />
            </div>
        </AppLayout>
    );
}
