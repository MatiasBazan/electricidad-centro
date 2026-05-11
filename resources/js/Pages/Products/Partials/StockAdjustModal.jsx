import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Loader2, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppSelect from '@/components/ui/AppSelect';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog';

export default function StockAdjustModal({ open, onClose, variant, warehouses, currentStock }) {
    const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? '');
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const currentQty = currentStock?.find(s => String(s.warehouse_id) === String(warehouseId))?.quantity ?? 0;

    function handleSubmit(e) {
        e.preventDefault();
        if (!variant || !warehouseId) return;
        setSubmitting(true);
        router.post('/productos/stock/ajustar', {
            product_variant_id: variant.id,
            warehouse_id: warehouseId,
            quantity,
            reason,
        }, {
            onSuccess: () => {
                setSubmitting(false);
                setQuantity('');
                setReason('');
                onClose();
            },
            onError: () => setSubmitting(false),
        });
    }

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Ajustar stock</DialogTitle>
                </DialogHeader>
                <DialogBody>
                    <form id="stock-adjust-form" onSubmit={handleSubmit} className="space-y-4">
                        {variant && (
                            <div className="px-3 py-2 bg-[#F4F4F4] rounded-lg text-sm text-[#2B2B2B]/70">
                                <span className="font-medium text-[#2B2B2B]">{variant.sku}</span>
                                {variant.attribute_values?.length > 0 && (
                                    <span className="ml-2 text-xs">
                                        {variant.attribute_values.map(av => av.value).join(' / ')}
                                    </span>
                                )}
                            </div>
                        )}

                        <div>
                            <Label className="mb-1 block">Depósito</Label>
                            <AppSelect
                                value={String(warehouseId)}
                                onValueChange={val => setWarehouseId(val)}
                                options={warehouses.map(wh => ({ value: wh.id, label: wh.name }))}
                            />
                            <p className="text-xs text-[#2B2B2B]/40 mt-1">
                                Stock actual: <span className="font-semibold text-[#2B2B2B]">{currentQty}</span>
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="adj-qty" className="mb-1 block">Nueva cantidad</Label>
                            <Input
                                id="adj-qty"
                                type="number"
                                min="0"
                                step="any"
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                                placeholder="Ej: 50"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="adj-reason" className="mb-1 block">Motivo (opcional)</Label>
                            <Input
                                id="adj-reason"
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder="Ej: Inventario físico"
                                maxLength={200}
                            />
                        </div>
                    </form>
                </DialogBody>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" form="stock-adjust-form" disabled={submitting || !quantity}>
                        {submitting ? <Loader2 size={14} className="animate-spin" /> : <Warehouse size={14} />}
                        Ajustar stock
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
