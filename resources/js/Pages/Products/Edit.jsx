import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import ProductForm from './Partials/ProductForm';

export default function ProductEdit({ product, categories, brands, attribute_types, warehouses }) {
    return (
        <AppLayout title="Editar producto">
            <div className="max-w-3xl space-y-4">
                <div className="flex items-center gap-3">
                    <Link href="/productos" className="flex items-center gap-1 text-sm text-[#2B2B2B]/50 hover:text-[#2B2B2B] transition-colors">
                        <ChevronLeft size={15} />
                        Productos
                    </Link>
                    <span className="text-[#2B2B2B]/25">/</span>
                    <Link href={`/productos/${product.id}`} className="text-sm text-[#2B2B2B]/50 hover:text-[#2B2B2B] transition-colors">
                        {product.name}
                    </Link>
                    <span className="text-[#2B2B2B]/25">/</span>
                    <span className="text-sm font-medium text-[#2B2B2B]">Editar</span>
                </div>

                <ProductForm
                    initialData={product}
                    categories={categories}
                    brands={brands}
                    attributeTypes={attribute_types}
                    warehouses={warehouses}
                    submitUrl={`/productos/${product.id}`}
                    method="put"
                />
            </div>
        </AppLayout>
    );
}
