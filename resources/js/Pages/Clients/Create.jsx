import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import ClientForm from './Partials/ClientForm';

export default function ClientCreate() {
    return (
        <AppLayout title="Nuevo cliente">
            <div className="max-w-2xl space-y-4">
                <Link href="/clientes" className="inline-flex items-center gap-1 text-sm text-[#2B2B2B]/50 hover:text-[#2B2B2B] transition-colors">
                    <ChevronLeft size={15} /> Clientes
                </Link>
                <h1 className="text-xl font-bold text-[#2B2B2B]">Nuevo cliente</h1>
                <ClientForm />
            </div>
        </AppLayout>
    );
}
