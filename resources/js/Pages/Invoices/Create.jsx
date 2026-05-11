import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle, FileText, Send } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import AppSelect from '@/components/ui/AppSelect';
import { cn } from '@/lib/utils';

const TAX_LABELS = {
    responsable_inscripto: 'Responsable Inscripto',
    consumidor_final:      'Consumidor Final',
    monotributista:        'Monotributista',
    exento:                'Exento',
};

function money(v) {
    return '$' + Number(v ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 });
}

export default function InvoiceCreate({ order, invoice_type, already_invoiced, pos_list, afip_configured }) {
    const { flash } = usePage().props;
    const [posId,    setPosId]    = useState(pos_list[0]?.id?.toString() ?? '');
    const [concepto, setConcepto] = useState('1');
    const [loading,  setLoading]  = useState(false);

    function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        router.post('/facturacion', {
            sales_order_id: order.id,
            pos_id:         posId,
            concepto:       concepto,
        }, {
            onFinish: () => setLoading(false),
        });
    }

    return (
        <AppLayout title="Emitir comprobante">
            <div className="max-w-3xl space-y-5">

                {flash?.error && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                        <AlertTriangle size={15} /> {flash.error}
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-[#2B2B2B]">Emitir comprobante AFIP</h1>
                        <p className="text-sm text-[#2B2B2B]/50 mt-0.5">
                            Venta #{order.number} · {order.date}
                        </p>
                    </div>
                    <span className={cn(
                        'text-sm font-bold px-4 py-1.5 rounded-lg border-2',
                        invoice_type === 'A'
                            ? 'border-[#2D4C73] text-[#2D4C73]'
                            : 'border-[#F58220] text-[#F58220]',
                    )}>
                        Factura {invoice_type}
                    </span>
                </div>

                {!afip_configured && (
                    <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                        <span>AFIP no está configurado. Completá <code>AFIP_CUIT</code>, <code>AFIP_CERT_PATH</code> y <code>AFIP_KEY_PATH</code> en el <code>.env</code>.</span>
                    </div>
                )}

                {already_invoiced && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                        <AlertTriangle size={15} /> Esta venta ya tiene un comprobante autorizado.
                    </div>
                )}

                {/* Cliente */}
                <div className="bg-white border border-[#D3D3D3] rounded-xl p-4 space-y-1">
                    <p className="text-xs text-[#2B2B2B]/50 uppercase tracking-wide font-semibold mb-2">Cliente</p>
                    <p className="font-semibold text-[#2B2B2B]">{order.client.name}</p>
                    {order.client.cuit_cuil && (
                        <p className="text-sm text-[#2B2B2B]/60">CUIT/CUIL: {order.client.cuit_cuil}</p>
                    )}
                    <p className="text-sm text-[#2B2B2B]/60">
                        Cond. IVA: {TAX_LABELS[order.client.tax_condition] ?? order.client.tax_condition}
                    </p>
                </div>

                {/* Ítems */}
                <div className="bg-white border border-[#D3D3D3] rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#D3D3D3]/60 bg-[#F4F4F4]/60">
                        <p className="text-xs text-[#2B2B2B]/50 uppercase tracking-wide font-semibold">Ítems de la venta</p>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[#D3D3D3]/60">
                                {['Descripción', 'Cant.', 'P. Unit.', 'IVA', 'Subtotal'].map(h => (
                                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-[#2B2B2B]/50">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D3D3D3]/40">
                            {order.items.map((item, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-2">{item.description}</td>
                                    <td className="px-4 py-2 tabular-nums">{item.quantity}</td>
                                    <td className="px-4 py-2 tabular-nums">{money(item.unit_price)}</td>
                                    <td className="px-4 py-2 tabular-nums text-[#2B2B2B]/50">
                                        {item.has_iva ? `${item.iva_rate}%` : 'Exento'}
                                    </td>
                                    <td className="px-4 py-2 tabular-nums font-medium">{money(item.subtotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="px-4 py-3 border-t border-[#D3D3D3]/60 flex justify-end gap-8 text-sm">
                        <span className="text-[#2B2B2B]/50">Subtotal: <strong className="text-[#2B2B2B]">{money(order.subtotal)}</strong></span>
                        {order.tax_amount > 0 && (
                            <span className="text-[#2B2B2B]/50">IVA: <strong className="text-[#2B2B2B]">{money(order.tax_amount)}</strong></span>
                        )}
                        <span className="text-[#2B2B2B]/50">Total: <strong className="text-[#2B2B2B] text-base">{money(order.total)}</strong></span>
                    </div>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="bg-white border border-[#D3D3D3] rounded-xl p-4 space-y-4">
                    <p className="text-xs text-[#2B2B2B]/50 uppercase tracking-wide font-semibold">Parámetros AFIP</p>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-[#2B2B2B]/70">Punto de venta</label>
                            <AppSelect
                                value={posId}
                                onValueChange={setPosId}
                                options={pos_list.map(p => ({ value: p.id.toString(), label: `${String(p.number).padStart(5, '0')}${p.name ? ' · ' + p.name : ''}` }))}
                                placeholder="Seleccionar POS"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-[#2B2B2B]/70">Concepto</label>
                            <AppSelect
                                value={concepto}
                                onValueChange={setConcepto}
                                options={[
                                    { value: '1', label: 'Productos' },
                                    { value: '2', label: 'Servicios' },
                                    { value: '3', label: 'Productos y Servicios' },
                                ]}
                                placeholder="Concepto"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#D3D3D3]/60">
                        <div className="flex items-center gap-2 text-xs text-[#2B2B2B]/40">
                            <FileText size={13} />
                            Se emitirá una <strong className="text-[#2B2B2B]/60">Factura {invoice_type}</strong> electrónica ante AFIP
                        </div>
                        <Button
                            type="submit"
                            disabled={loading || !afip_configured || !posId}
                            className="bg-[#2D4C73] hover:bg-[#2D4C73]/90 text-white gap-2"
                        >
                            <Send size={14} />
                            {loading ? 'Enviando a AFIP…' : 'Emitir comprobante'}
                        </Button>
                    </div>
                </form>

            </div>
        </AppLayout>
    );
}
