import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    FileText, Search, Eye, Download, CheckCircle, XCircle, AlertTriangle, Clock,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppSelect from '@/components/ui/AppSelect';
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

function money(v) {
    return '$' + Number(v ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 });
}

function StatCard({ label, value, icon: Icon, color }) {
    return (
        <div className="bg-white border border-[#D3D3D3] rounded-xl px-4 py-3 flex items-center gap-3">
            <span className={cn('p-2 rounded-lg', color)}><Icon size={17} strokeWidth={1.8} /></span>
            <div>
                <p className="text-xl font-bold text-[#2B2B2B] leading-none">{value}</p>
                <p className="text-[11px] text-[#2B2B2B]/50 mt-0.5">{label}</p>
            </div>
        </div>
    );
}

export default function InvoicesIndex({ invoices, stats, filters }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters.search ?? '');

    function applyFilter(extra) {
        router.get('/facturacion', { ...filters, search, ...extra }, { preserveState: true, replace: true });
    }

    return (
        <AppLayout title="Facturación">
            <div className="space-y-5">

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

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-[#2B2B2B]">Facturación AFIP</h1>
                        <p className="text-sm text-[#2B2B2B]/50 mt-0.5">Comprobantes electrónicos autorizados</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <StatCard label="Autorizados" value={stats.approved} icon={CheckCircle} color="bg-emerald-100 text-emerald-700" />
                    <StatCard label="Rechazados" value={stats.rejected} icon={XCircle} color="bg-red-100 text-red-500" />
                    <StatCard label="Facturado este mes" value={money(stats.total_month)} icon={FileText} color="bg-[#2D4C73]/10 text-[#2D4C73]" />
                </div>

                {/* Filtros */}
                <div className="bg-white border border-[#D3D3D3] rounded-xl p-4">
                    <form onSubmit={e => { e.preventDefault(); applyFilter({}); }} className="flex flex-wrap gap-2">
                        <div className="relative flex-1 min-w-48">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2B2B]/35 pointer-events-none" />
                            <Input
                                placeholder="Buscar por número, CAE o cliente…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <AppSelect
                            value={filters.type ?? ''}
                            onValueChange={v => applyFilter({ type: v || undefined })}
                            options={[{ value: 'A', label: 'Factura A' }, { value: 'B', label: 'Factura B' }]}
                            placeholder="Tipo"
                        />
                        <AppSelect
                            value={filters.status ?? ''}
                            onValueChange={v => applyFilter({ status: v || undefined })}
                            options={Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                            placeholder="Estado"
                        />
                        <Input type="date" value={filters.from ?? ''} onChange={e => applyFilter({ from: e.target.value || undefined })} className="w-36" />
                        <Input type="date" value={filters.to ?? ''} onChange={e => applyFilter({ to: e.target.value || undefined })} className="w-36" />
                        <Button type="submit" variant="outline">Buscar</Button>
                        {Object.values(filters).some(Boolean) && (
                            <Button type="button" variant="ghost" onClick={() => router.get('/facturacion', {}, { replace: true })} className="text-xs text-[#2B2B2B]/50">
                                Limpiar
                            </Button>
                        )}
                    </form>
                </div>

                {/* Tabla */}
                <div className="bg-white border border-[#D3D3D3] rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[#D3D3D3]/60 bg-[#F4F4F4]/60">
                                {['Comprobante', 'Fecha', 'Cliente', 'CAE', 'Estado', 'Total', ''].map(h => (
                                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D3D3D3]/40">
                            {invoices.data.length === 0 && (
                                <tr><td colSpan={7} className="px-4 py-12 text-center text-[#2B2B2B]/30 text-sm">Sin comprobantes.</td></tr>
                            )}
                            {invoices.data.map(inv => (
                                <tr key={inv.id} className="hover:bg-[#F4F4F4]/60 group transition-colors">
                                    <td className="px-4 py-2.5">
                                        <span className="font-mono text-xs font-semibold text-[#2D4C73]">{inv.formatted}</span>
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-[#2B2B2B]/60 whitespace-nowrap">{inv.date}</td>
                                    <td className="px-4 py-2.5 text-sm text-[#2B2B2B]">{inv.client}</td>
                                    <td className="px-4 py-2.5">
                                        {inv.cae ? (
                                            <div>
                                                <p className="font-mono text-xs text-[#2B2B2B]/70">{inv.cae}</p>
                                                {inv.cae_expiry && <p className="text-[10px] text-[#2B2B2B]/40">Vto: {inv.cae_expiry}</p>}
                                            </div>
                                        ) : <span className="text-[#2B2B2B]/25 text-xs">—</span>}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', STATUS_STYLES[inv.status] ?? 'bg-slate-100 text-slate-500')}>
                                            {STATUS_LABELS[inv.status] ?? inv.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{money(inv.total)}</td>
                                    <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                                            <Link href={`/facturacion/${inv.id}`}>
                                                <button className="p-1.5 rounded-md hover:bg-[#2D4C73]/10 text-[#2D4C73]" title="Ver">
                                                    <Eye size={13} />
                                                </button>
                                            </Link>
                                            {inv.status === 'approved' && (
                                                <a href={`/facturacion/${inv.id}/pdf`} target="_blank" rel="noreferrer">
                                                    <button className="p-1.5 rounded-md hover:bg-[#F58220]/10 text-[#F58220]" title="PDF">
                                                        <Download size={13} />
                                                    </button>
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {invoices.last_page > 1 && (
                        <div className="px-4 py-3 border-t border-[#D3D3D3]/60 flex items-center justify-between">
                            <span className="text-xs text-[#2B2B2B]/40">{invoices.from}–{invoices.to} de {invoices.total}</span>
                            <div className="flex gap-1">
                                {invoices.links.map((link, i) => (
                                    <button
                                        key={i}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={cn(
                                            'px-3 py-1 rounded-md text-xs transition-colors',
                                            link.active ? 'bg-[#F58220] text-white font-semibold'
                                                : link.url ? 'text-[#2B2B2B]/60 hover:bg-[#F4F4F4]'
                                                : 'text-[#2B2B2B]/25 cursor-default',
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
