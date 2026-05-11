import { useState, useMemo } from 'react';
import { Search, Package, Trash2, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

function ProductSearch({ products, onSelect, excludeIds = [] }) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);

    const filtered = useMemo(() => {
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        return products
            .filter(p => !excludeIds.includes(p.id))
            .filter(p =>
                p.name?.toLowerCase().includes(q) ||
                p.code?.toLowerCase().includes(q) ||
                p.sku?.toLowerCase().includes(q)
            )
            .slice(0, 10);
    }, [query, products, excludeIds]);

    function select(product) {
        onSelect(product);
        setQuery('');
        setOpen(false);
    }

    return (
        <div className="relative">
            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2B2B]/35 pointer-events-none" />
                <Input
                    placeholder="Buscar producto por nombre, código o SKU…"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setTimeout(() => setOpen(false), 150)}
                    className="pl-9"
                />
            </div>
            {open && filtered.length > 0 && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[#D3D3D3] rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
                    {filtered.map(p => (
                        <button
                            key={p.id}
                            type="button"
                            onMouseDown={() => select(p)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F4F4F4] text-left transition-colors"
                        >
                            <Package size={14} className="text-[#2B2B2B]/30 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-[#2B2B2B] font-medium truncate">{p.name}</p>
                                <p className="text-xs text-[#2B2B2B]/40">
                                    {p.code} · SKU: {p.sku}
                                    {p.sale_price > 0 && ` · $${Number(p.sale_price).toFixed(2)}`}
                                </p>
                            </div>
                            {p.unit && <span className="text-xs text-[#2B2B2B]/30">{p.unit}</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export function calcItemSubtotal(item) {
    return (Number(item.quantity) || 0) * (Number(item.unit_price) || 0) * (1 - (Number(item.discount_pct) || 0) / 100);
}

export default function ItemsEditor({ items, onChange, products, priceField = 'sale_price', error }) {
    const excludeIds = items.map(i => i.product_variant_id).filter(Boolean);

    function addFromProduct(product) {
        onChange([...items, {
            product_variant_id: product.id,
            description:        product.name,
            quantity:           1,
            unit_price:         product[priceField] ?? 0,
            discount_pct:       0,
        }]);
    }

    function addFreeText() {
        onChange([...items, {
            product_variant_id: null,
            description:        '',
            quantity:           1,
            unit_price:         0,
            discount_pct:       0,
        }]);
    }

    function update(index, field, value) {
        const next = [...items];
        next[index] = { ...next[index], [field]: value };
        onChange(next);
    }

    function remove(index) {
        onChange(items.filter((_, i) => i !== index));
    }

    const subtotal = items.reduce((s, i) => s + calcItemSubtotal(i), 0);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#2B2B2B]">
                    Ítems
                    {error && <span className="ml-2 text-xs font-normal text-red-500">{error}</span>}
                </h2>
                <button
                    type="button"
                    onClick={addFreeText}
                    className="flex items-center gap-1 text-xs text-[#2B2B2B]/50 hover:text-[#2B2B2B] transition-colors px-2 py-1 rounded border border-dashed border-[#D3D3D3] hover:border-[#2B2B2B]/30"
                >
                    <Plus size={12} /> Línea libre
                </button>
            </div>

            <ProductSearch
                products={products}
                onSelect={addFromProduct}
                excludeIds={excludeIds}
            />

            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-[#2B2B2B]/25 border border-dashed border-[#D3D3D3] rounded-xl">
                    <Package size={28} strokeWidth={1.2} />
                    <p className="text-sm mt-2">Buscá un producto o agregá una línea libre</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[#D3D3D3]/60">
                                <th className="pb-2 text-left text-xs font-semibold text-[#2B2B2B]/40">Descripción</th>
                                <th className="pb-2 text-right text-xs font-semibold text-[#2B2B2B]/40 w-24">Cant.</th>
                                <th className="pb-2 text-right text-xs font-semibold text-[#2B2B2B]/40 w-32">P. unitario</th>
                                <th className="pb-2 text-right text-xs font-semibold text-[#2B2B2B]/40 w-20">Desc.%</th>
                                <th className="pb-2 text-right text-xs font-semibold text-[#2B2B2B]/40 w-28">Subtotal</th>
                                <th className="pb-2 w-8" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D3D3D3]/30">
                            {items.map((item, i) => {
                                const sub = calcItemSubtotal(item);
                                return (
                                    <tr key={i}>
                                        <td className="py-1.5 pr-2">
                                            <Input
                                                value={item.description}
                                                onChange={e => update(i, 'description', e.target.value)}
                                                placeholder="Descripción del ítem"
                                                className="text-sm"
                                            />
                                        </td>
                                        <td className="py-1.5 pr-2">
                                            <Input
                                                type="number" min="0.001" step="any"
                                                value={item.quantity}
                                                onChange={e => update(i, 'quantity', e.target.value)}
                                                className="text-right w-24"
                                            />
                                        </td>
                                        <td className="py-1.5 pr-2">
                                            <div className="relative">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#2B2B2B]/40 text-xs">$</span>
                                                <Input
                                                    type="number" min="0" step="0.01"
                                                    value={item.unit_price}
                                                    onChange={e => update(i, 'unit_price', e.target.value)}
                                                    className="pl-5 text-right w-32"
                                                />
                                            </div>
                                        </td>
                                        <td className="py-1.5 pr-2">
                                            <div className="relative">
                                                <Input
                                                    type="number" min="0" max="100" step="0.5"
                                                    value={item.discount_pct}
                                                    onChange={e => update(i, 'discount_pct', e.target.value)}
                                                    className="text-right pr-6 w-20"
                                                />
                                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#2B2B2B]/40 text-xs">%</span>
                                            </div>
                                        </td>
                                        <td className="py-1.5 text-right font-semibold tabular-nums text-[#2B2B2B]">
                                            ${sub.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-1.5 pl-2">
                                            <button
                                                type="button"
                                                onClick={() => remove(i)}
                                                className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="border-t border-[#D3D3D3]/60">
                                <td colSpan={4} className="pt-2.5 text-right text-sm font-semibold text-[#2B2B2B]">Subtotal</td>
                                <td className="pt-2.5 text-right text-base font-bold text-[#2B2B2B] tabular-nums">
                                    ${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </td>
                                <td />
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
}
