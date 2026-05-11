import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    ChevronLeft, Pencil, Package, Tag, Layers,
    Warehouse, CheckCircle, XCircle, AlertTriangle,
    SlidersHorizontal,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import StockAdjustModal from './Partials/StockAdjustModal';

function InfoRow({ label, value }) {
    if (!value && value !== 0) return null;
    return (
        <div className="flex items-start gap-2 py-2 border-b border-[#D3D3D3]/40 last:border-0">
            <span className="text-xs text-[#2B2B2B]/45 w-32 shrink-0 pt-0.5">{label}</span>
            <span className="text-sm text-[#2B2B2B] font-medium">{value}</span>
        </div>
    );
}

function StockBar({ quantity, min }) {
    const ratio = min > 0 ? Math.min(quantity / min, 2) : 1;
    const pct = Math.min(ratio * 50, 100);
    const color = quantity <= 0 ? 'bg-red-400' : quantity <= min ? 'bg-amber-400' : 'bg-emerald-400';
    return (
        <div className="h-1.5 w-24 bg-[#D3D3D3]/50 rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
        </div>
    );
}

export default function ProductShow({ product, warehouses }) {
    const { flash } = usePage().props;
    const [adjustModal, setAdjustModal] = useState({ open: false, variant: null });

    const totalStock = product.variants.reduce(
        (sum, v) => sum + v.stock.reduce((s, s2) => s + (s2.quantity ?? 0), 0), 0
    );

    const stockStatus = totalStock <= 0 ? 'out' : totalStock <= product.min_stock ? 'low' : 'ok';

    return (
        <AppLayout title={product.name}>
            <div className="max-w-4xl space-y-5">

                {/* Flash */}
                {flash?.success && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                        <CheckCircle size={15} /> {flash.success}
                    </div>
                )}

                {/* Breadcrumb */}
                <div className="flex items-center gap-3">
                    <Link href="/productos" className="flex items-center gap-1 text-sm text-[#2B2B2B]/50 hover:text-[#2B2B2B] transition-colors">
                        <ChevronLeft size={15} />
                        Productos
                    </Link>
                    <span className="text-[#2B2B2B]/25">/</span>
                    <span className="text-sm font-medium text-[#2B2B2B]">{product.name}</span>
                </div>

                {/* Header card */}
                <div className="bg-white border border-[#D3D3D3] rounded-xl p-5 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#2D4C73]/10 flex items-center justify-center shrink-0">
                            <Package size={22} strokeWidth={1.6} className="text-[#2D4C73]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-lg font-bold text-[#2B2B2B]">{product.name}</h1>
                                {!product.is_active && <Badge variant="danger">Inactivo</Badge>}
                            </div>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <span className="font-mono text-xs text-[#2B2B2B]/40">{product.code}</span>
                                {product.category && (
                                    <span className="text-xs text-[#2B2B2B]/40 flex items-center gap-1">
                                        <Tag size={11} />
                                        {product.category}
                                    </span>
                                )}
                                {product.brand && (
                                    <span className="text-xs text-[#2B2B2B]/40">{product.brand}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                                <span className={cn(
                                    'text-2xl font-bold tabular-nums',
                                    stockStatus === 'out' ? 'text-red-500' :
                                    stockStatus === 'low' ? 'text-amber-600' :
                                    'text-[#2B2B2B]'
                                )}>
                                    {totalStock}
                                </span>
                                <span className="text-sm text-[#2B2B2B]/40">{product.unit} en stock</span>
                                {stockStatus === 'low' && (
                                    <span className="flex items-center gap-1 text-xs text-amber-600">
                                        <AlertTriangle size={12} /> Stock bajo
                                    </span>
                                )}
                                {stockStatus === 'out' && (
                                    <span className="flex items-center gap-1 text-xs text-red-500">
                                        <XCircle size={12} /> Sin stock
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <Link href={`/productos/${product.id}/editar`}>
                        <Button variant="outline">
                            <Pencil size={14} />
                            Editar
                        </Button>
                    </Link>
                </div>

                {/* Details + Variants */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {/* Left: details */}
                    <div className="bg-white border border-[#D3D3D3] rounded-xl p-5">
                        <h2 className="font-semibold text-sm text-[#2B2B2B] mb-3">Detalles</h2>
                        <InfoRow label="Tipo" value={product.type} />
                        <InfoRow label="Unidad" value={product.unit} />
                        <InfoRow label="Stock mínimo" value={product.min_stock} />
                        <InfoRow label="IVA" value={product.has_iva ? `${product.iva_rate}%` : 'No aplica'} />
                        <InfoRow label="Código de barras" value={product.barcode} />
                        {product.description && (
                            <div className="mt-3 pt-3 border-t border-[#D3D3D3]/40">
                                <p className="text-xs text-[#2B2B2B]/45 mb-1">Descripción</p>
                                <p className="text-sm text-[#2B2B2B]/70">{product.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Right: variants */}
                    <div className="sm:col-span-2 bg-white border border-[#D3D3D3] rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-sm text-[#2B2B2B]">
                                {product.type === 'simple' ? 'Precios y stock' : `Variantes (${product.variants.length})`}
                            </h2>
                        </div>

                        <div className="space-y-3">
                            {product.variants.map(variant => (
                                <div key={variant.id} className={cn(
                                    'border rounded-xl overflow-hidden',
                                    !variant.is_active ? 'opacity-60 border-dashed' : 'border-[#D3D3D3]'
                                )}>
                                    {/* Variant header */}
                                    <div className="flex items-center justify-between px-4 py-2.5 bg-[#F4F4F4]/50">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-mono text-xs text-[#2B2B2B]/50">{variant.sku}</span>
                                            {variant.attribute_values?.map((av, i) => (
                                                <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[#2D4C73]/10 text-[#2D4C73] font-medium">
                                                    {av.value}
                                                </span>
                                            ))}
                                            {!variant.is_active && <Badge variant="danger" className="text-[10px]">Inactiva</Badge>}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setAdjustModal({ open: true, variant })}
                                            className="gap-1 text-xs"
                                        >
                                            <SlidersHorizontal size={12} />
                                            Ajustar stock
                                        </Button>
                                    </div>

                                    {/* Prices + stock */}
                                    <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        <div>
                                            <p className="text-[10px] text-[#2B2B2B]/40 uppercase tracking-wide">Costo</p>
                                            <p className="font-semibold text-sm text-[#2B2B2B]">
                                                ${Number(variant.cost_price).toLocaleString('es-AR')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-[#2B2B2B]/40 uppercase tracking-wide">Venta</p>
                                            <p className="font-semibold text-sm text-[#F58220]">
                                                ${Number(variant.sale_price).toLocaleString('es-AR')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-[#2B2B2B]/40 uppercase tracking-wide">Stock total</p>
                                            <p className="font-semibold text-sm text-[#2B2B2B]">{variant.total_stock}</p>
                                        </div>
                                    </div>

                                    {/* Stock per warehouse */}
                                    {variant.stock.length > 0 && (
                                        <div className="px-4 pb-3">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                                {variant.stock.map(s => (
                                                    <div key={s.warehouse_id} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-[#F4F4F4]">
                                                        <span className="flex items-center gap-1.5 text-[#2B2B2B]/60">
                                                            <Warehouse size={11} />
                                                            {s.warehouse_name}
                                                        </span>
                                                        <span className="font-semibold tabular-nums text-[#2B2B2B]">
                                                            {s.quantity}
                                                            {s.reserved > 0 && (
                                                                <span className="text-[#2B2B2B]/35 font-normal ml-1">
                                                                    ({s.reserved} reserv.)
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <StockAdjustModal
                open={adjustModal.open}
                onClose={() => setAdjustModal({ open: false, variant: null })}
                variant={adjustModal.variant}
                warehouses={warehouses}
                currentStock={adjustModal.variant?.stock ?? []}
            />
        </AppLayout>
    );
}
