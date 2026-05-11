import { Link, router, usePage } from '@inertiajs/react';
import {
    CheckCircle, XCircle, Clock, AlertTriangle, Download, Ban, FileText, ArrowLeft,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STATUS_STYLES = {
    approved:  'bg-emerald-100 text-emerald-700',
    rejected:  'bg-red-100 text-red-600',
    pending:   'bg-amber-100 text-amber-700',
    cancelled: 'bg-slate-100 text-slate-500',
    draft:     'bg-slate-100 text-slate-500',
};
const STATUS_LABELS = {
    approved:  'Autorizado',
    rejected:  'Rechazado',
    pending:   'Pendiente',
    cancelled: 'Anulado',
    draft:     'Borrador',
};
const STATUS_ICONS = {
    approved:  CheckCircle,
    rejected:  XCircle,
    pending:   Clock,
    cancelled: Ban,
};

const TAX_LABELS = {
    responsable_inscripto: 'Responsable Inscripto',
    consumidor_final:      'Consumidor Final',
    monotributista:        'Monotributista',
    exento:                'Exento',
};

function money(v) {
    return '$' + Number(v ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 });
}

function InfoBlock({ label, value, mono }) {
    return (
        <div>
            <p className="text-[10px] uppercase tracking-wide text-[#2B2B2B]/40 font-semibold">{label}</p>
            <p className={cn('text-sm font-semibold text-[#2B2B2B] mt-0.5', mono && 'font-mono')}>{value ?? '—'}</p>
        </div>
    );
}

export default function InvoiceShow({ invoice }) {
    const { flash } = usePage().props;

    const StatusIcon = STATUS_ICONS[invoice.status] ?? FileText;

    function handleCancel() {
        if (!confirm('¿Anular este comprobante? La acción no genera nota de crédito ante AFIP.')) return;
        router.post(`/facturacion/${invoice.id}/anular`);
    }

    const afipErrors = invoice.afip_result?.errores ?? invoice.afip_result?.observaciones ?? [];

    return (
        <AppLayout title={invoice.formatted}>
            <div className="max-w-3xl space-y-5">

                {flash?.success && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                        <CheckCircle size={15} /> {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                        <XCircle size={15} /> {flash.error}
                    </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <Link href="/facturacion" className="inline-flex items-center gap-1 text-xs text-[#2B2B2B]/40 hover:text-[#2B2B2B]/70 mb-2">
                            <ArrowLeft size={12} /> Facturación
                        </Link>
                        <h1 className="text-xl font-bold text-[#2B2B2B] font-mono">{invoice.formatted}</h1>
                        <p className="text-sm text-[#2B2B2B]/50 mt-0.5">{invoice.date}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className={cn('flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg', STATUS_STYLES[invoice.status])}>
                            <StatusIcon size={14} />
                            {STATUS_LABELS[invoice.status] ?? invoice.status}
                        </span>
                        {invoice.status === 'approved' && (
                            <a href={`/facturacion/${invoice.id}/pdf`} target="_blank" rel="noreferrer">
                                <Button variant="outline" size="sm" className="gap-1.5">
                                    <Download size={14} /> PDF
                                </Button>
                            </a>
                        )}
                        {invoice.status === 'approved' && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                                onClick={handleCancel}
                            >
                                <Ban size={14} /> Anular
                            </Button>
                        )}
                    </div>
                </div>

                {/* AFIP rechazado */}
                {invoice.status === 'rejected' && (
                    <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm space-y-1">
                        <p className="font-semibold flex items-center gap-2"><AlertTriangle size={14} /> AFIP rechazó este comprobante</p>
                        {afipErrors.length > 0 && (
                            <ul className="list-disc list-inside text-xs space-y-0.5 mt-1">
                                {afipErrors.map((e, i) => (
                                    <li key={i}>{e.Msg ?? e.msg ?? JSON.stringify(e)}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {/* Info principal */}
                <div className="bg-white border border-[#D3D3D3] rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <InfoBlock label="Tipo" value={`Factura ${invoice.invoice_type}`} />
                    <InfoBlock label="Punto de venta" value={invoice.pos?.number ? `${invoice.pos.number}${invoice.pos.name ? ' · ' + invoice.pos.name : ''}` : null} />
                    <InfoBlock label="Emitido por" value={invoice.user} />
                    {invoice.sales_order && (
                        <div>
                            <p className="text-[10px] uppercase tracking-wide text-[#2B2B2B]/40 font-semibold">Venta origen</p>
                            <Link
                                href={`/ventas/${invoice.sales_order.id}`}
                                className="text-sm font-semibold text-[#2D4C73] hover:underline mt-0.5 block"
                            >
                                #{invoice.sales_order.number}
                            </Link>
                        </div>
                    )}
                </div>

                {/* Cliente */}
                <div className="bg-white border border-[#D3D3D3] rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-wide text-[#2B2B2B]/40 font-semibold mb-3">Receptor</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <InfoBlock label="Razón social" value={invoice.client.name} />
                        <InfoBlock label="CUIT/CUIL" value={invoice.client.cuit_cuil} mono />
                        <InfoBlock label="Cond. IVA" value={TAX_LABELS[invoice.client.tax_condition] ?? invoice.client.tax_condition} />
                        {invoice.client.address && (
                            <InfoBlock label="Domicilio" value={invoice.client.address} />
                        )}
                    </div>
                </div>

                {/* Ítems */}
                <div className="bg-white border border-[#D3D3D3] rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#D3D3D3]/60 bg-[#F4F4F4]/60">
                        <p className="text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Detalle</p>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[#D3D3D3]/60">
                                {['Descripción', 'Cant.', 'Precio neto', invoice.invoice_type === 'A' ? 'IVA' : null, 'Total']
                                    .filter(Boolean)
                                    .map(h => (
                                        <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-[#2B2B2B]/50">{h}</th>
                                    ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D3D3D3]/40">
                            {invoice.items.map((item, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-2">{item.description}</td>
                                    <td className="px-4 py-2 tabular-nums">{item.quantity}</td>
                                    <td className="px-4 py-2 tabular-nums">{money(item.unit_price)}</td>
                                    {invoice.invoice_type === 'A' && (
                                        <td className="px-4 py-2 tabular-nums text-[#2B2B2B]/50">
                                            {item.iva_rate}% · {money(item.iva_amount)}
                                        </td>
                                    )}
                                    <td className="px-4 py-2 tabular-nums font-medium">{money(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totales */}
                    <div className="px-4 py-3 border-t border-[#D3D3D3]/60 flex justify-end">
                        <div className="w-60 space-y-1 text-sm">
                            {invoice.net_taxed > 0 && (
                                <div className="flex justify-between text-[#2B2B2B]/60">
                                    <span>Neto gravado</span>
                                    <span className="tabular-nums">{money(invoice.net_taxed)}</span>
                                </div>
                            )}
                            {invoice.net_exempt > 0 && (
                                <div className="flex justify-between text-[#2B2B2B]/60">
                                    <span>Exento / No gravado</span>
                                    <span className="tabular-nums">{money(invoice.net_exempt)}</span>
                                </div>
                            )}
                            {invoice.iva_amount > 0 && (
                                <div className="flex justify-between text-[#2B2B2B]/60">
                                    <span>IVA</span>
                                    <span className="tabular-nums">{money(invoice.iva_amount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-[#2B2B2B] text-base pt-1 border-t border-[#D3D3D3]/60">
                                <span>TOTAL</span>
                                <span className="tabular-nums">{money(invoice.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CAE */}
                {invoice.cae && (
                    <div className="bg-white border border-[#D3D3D3] rounded-xl p-4">
                        <p className="text-[10px] uppercase tracking-wide text-[#2B2B2B]/40 font-semibold mb-3">Código de Autorización Electrónico (CAE)</p>
                        <p className="font-mono text-lg font-bold text-[#2D4C73] tracking-widest">{invoice.cae}</p>
                        {invoice.cae_expiry && (
                            <p className="text-xs text-[#2B2B2B]/50 mt-1">Vto: {invoice.cae_expiry}</p>
                        )}
                    </div>
                )}

                {/* Notas */}
                {invoice.notes && (
                    <div className="bg-[#F4F4F4] border border-[#D3D3D3] rounded-xl px-4 py-3 text-sm text-[#2B2B2B]/60 whitespace-pre-wrap">
                        {invoice.notes}
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
