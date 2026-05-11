import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

function newVariant() {
    return {
        _key: Math.random().toString(36).slice(2),
        id: null,
        sku: '',
        barcode: '',
        cost_price: '',
        sale_price: '',
        is_active: true,
        attribute_value_ids: [],
        stock: {},
    };
}

function AttributeSelector({ attributeTypes, selected, onChange }) {
    return (
        <div className="space-y-2">
            {attributeTypes.map(type => (
                <div key={type.id}>
                    <p className="text-[11px] font-semibold text-[#2B2B2B]/50 uppercase tracking-wide mb-1">{type.name}</p>
                    <div className="flex flex-wrap gap-1.5">
                        {type.values.map(val => {
                            const active = selected.includes(val.id);
                            return (
                                <button
                                    key={val.id}
                                    type="button"
                                    onClick={() => onChange(
                                        active
                                            ? selected.filter(id => id !== val.id)
                                            : [...selected, val.id]
                                    )}
                                    className={cn(
                                        'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                                        active
                                            ? 'bg-[#F58220] text-white border-[#F58220]'
                                            : 'bg-white text-[#2B2B2B]/60 border-[#D3D3D3] hover:border-[#F58220]/50',
                                    )}
                                >
                                    {val.value}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

function VariantRow({ variant, index, attributeTypes, warehouses, errors, onChange, onRemove, canRemove }) {
    const [expanded, setExpanded] = useState(true);

    function field(key, value) {
        onChange({ ...variant, [key]: value });
    }

    const hasErrors = Object.keys(errors ?? {}).some(k => k.startsWith(`variants.${index}.`));

    return (
        <div className={cn(
            'border rounded-xl overflow-hidden transition-colors',
            hasErrors ? 'border-red-300' : 'border-[#D3D3D3]'
        )}>
            {/* Header row */}
            <div
                className="flex items-center gap-3 px-4 py-2.5 bg-[#F4F4F4]/80 cursor-pointer select-none"
                onClick={() => setExpanded(v => !v)}
            >
                <button type="button" className="text-[#2B2B2B]/40 hover:text-[#2B2B2B] transition-colors">
                    {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </button>
                <span className="text-sm font-medium text-[#2B2B2B] flex-1">
                    {variant.sku || `Variante ${index + 1}`}
                </span>
                {!variant.is_active && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D3D3D3] text-[#2B2B2B]/50">Inactiva</span>
                )}
                {canRemove && (
                    <button
                        type="button"
                        onClick={e => { e.stopPropagation(); onRemove(); }}
                        className="p-1 rounded hover:bg-red-50 text-[#2B2B2B]/30 hover:text-red-500 transition-colors"
                    >
                        <Trash2 size={13} />
                    </button>
                )}
            </div>

            {expanded && (
                <div className="p-4 space-y-4">
                    {/* Attributes */}
                    {attributeTypes.length > 0 && (
                        <div>
                            <Label className="mb-2 block">Atributos</Label>
                            <AttributeSelector
                                attributeTypes={attributeTypes}
                                selected={variant.attribute_value_ids}
                                onChange={ids => field('attribute_value_ids', ids)}
                            />
                        </div>
                    )}

                    {/* SKU / Barcode / Prices */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                            <Label htmlFor={`sku-${index}`}>SKU *</Label>
                            <Input
                                id={`sku-${index}`}
                                value={variant.sku}
                                onChange={e => field('sku', e.target.value)}
                                placeholder="Ej: PRD-001"
                                className={errors?.[`variants.${index}.sku`] ? 'border-red-400' : ''}
                            />
                            {errors?.[`variants.${index}.sku`] && (
                                <p className="text-xs text-red-500 mt-1">{errors[`variants.${index}.sku`]}</p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor={`barcode-${index}`}>Código de barras</Label>
                            <Input
                                id={`barcode-${index}`}
                                value={variant.barcode}
                                onChange={e => field('barcode', e.target.value)}
                                placeholder="Opcional"
                            />
                        </div>
                        <div>
                            <Label htmlFor={`cost-${index}`}>Precio de costo *</Label>
                            <Input
                                id={`cost-${index}`}
                                type="number"
                                min="0"
                                step="0.01"
                                value={variant.cost_price}
                                onChange={e => field('cost_price', e.target.value)}
                                placeholder="0.00"
                                className={errors?.[`variants.${index}.cost_price`] ? 'border-red-400' : ''}
                            />
                        </div>
                        <div>
                            <Label htmlFor={`sale-${index}`}>Precio de venta *</Label>
                            <Input
                                id={`sale-${index}`}
                                type="number"
                                min="0"
                                step="0.01"
                                value={variant.sale_price}
                                onChange={e => field('sale_price', e.target.value)}
                                placeholder="0.00"
                                className={errors?.[`variants.${index}.sale_price`] ? 'border-red-400' : ''}
                            />
                        </div>
                    </div>

                    {/* Stock por depósito (solo para variantes nuevas) */}
                    {!variant.id && warehouses.length > 0 && (
                        <div>
                            <Label className="mb-2 block">Stock inicial por depósito</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {warehouses.map(wh => (
                                    <div key={wh.id} className="flex items-center gap-2">
                                        <span className="text-xs text-[#2B2B2B]/60 w-24 truncate">{wh.name}</span>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={variant.stock[wh.id] ?? ''}
                                            onChange={e => field('stock', { ...variant.stock, [wh.id]: e.target.value })}
                                            placeholder="0"
                                            className="w-20 text-center"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Activa toggle */}
                    {variant.id && (
                        <label className="flex items-center gap-2 cursor-pointer w-fit">
                            <div
                                onClick={() => field('is_active', !variant.is_active)}
                                className={cn(
                                    'relative w-9 h-5 rounded-full transition-colors',
                                    variant.is_active ? 'bg-[#F58220]' : 'bg-[#D3D3D3]'
                                )}
                            >
                                <span className={cn(
                                    'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                                    variant.is_active ? 'translate-x-4' : ''
                                )} />
                            </div>
                            <span className="text-sm text-[#2B2B2B]/70">Variante activa</span>
                        </label>
                    )}
                </div>
            )}
        </div>
    );
}

export default function VariantsManager({ variants, attributeTypes, warehouses, errors, onChange, productType }) {
    function addVariant() {
        onChange([...variants, newVariant()]);
    }

    function updateVariant(index, updated) {
        onChange(variants.map((v, i) => i === index ? updated : v));
    }

    function removeVariant(index) {
        onChange(variants.filter((_, i) => i !== index));
    }

    const isSimple = productType === 'simple';

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-[#2B2B2B]">
                        {isSimple ? 'Precios y stock' : 'Variantes'}
                    </h3>
                    {!isSimple && (
                        <p className="text-xs text-[#2B2B2B]/40 mt-0.5">
                            Cada variante tiene su propio SKU, precio y stock.
                        </p>
                    )}
                </div>
                {!isSimple && (
                    <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                        <Plus size={14} />
                        Agregar variante
                    </Button>
                )}
            </div>

            {variants.map((variant, i) => (
                <VariantRow
                    key={variant._key ?? variant.id ?? i}
                    variant={variant}
                    index={i}
                    attributeTypes={isSimple ? [] : attributeTypes}
                    warehouses={warehouses}
                    errors={errors}
                    onChange={updated => updateVariant(i, updated)}
                    onRemove={() => removeVariant(i)}
                    canRemove={!isSimple && variants.length > 1}
                />
            ))}

            {errors?.variants && (
                <p className="text-xs text-red-500">{errors.variants}</p>
            )}
        </div>
    );
}
