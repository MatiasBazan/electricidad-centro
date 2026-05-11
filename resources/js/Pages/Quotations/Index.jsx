import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { FileText, Plus, Search, Eye, CheckCircle, XCircle, Clock, Send, ThumbsUp, ThumbsDown } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppSelect from '@/components/ui/AppSelect';
import { cn } from '@/lib/utils';

const STATUS_MAP = {
    draft:    { label: 'Borrador',  color: 'bg-slate-100 text-slate-600',   icon: Clock },
    sent:     { label: 'Enviado',   color: 'bg-blue-50 text-blue-700',       icon: Send },
    accepted: { label: 'Aceptado', color: 'bg-emerald-50 text-emerald-700', icon: ThumbsUp },
    rejected: { label: 'Rechazado',color: 'bg-red-50 text-red-500',         icon: ThumbsDown },
    expired:  { label: 'Vencido',  color: 'bg-amber-50 text-amber-700',     icon: XCircle },
};

function StatCard({ label, value, status, onClick, active }) {
    const { color, icon: Icon } = STATUS_MAP[status] ?? { color: 'bg-[#2D4C73]/10 text-[#2D4C73]', icon: FileText };
    return (
        <button onClick={onClick} className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all',
            active ? 'border-[#F58220] bg-[#F58220]/5 shadow-sm' : 'border-[#D3D3D3] bg-white hover:border-[#F58220]/40'
        )}>
            <span className={cn('p-2 rounded-lg', color)}><Icon size={16} strokeWidth={1.8} /></span>
            <div>
                <p className="text-xl font-bold text-[#2B2B2B] leading-none">{value}</p>
                <p className="text-[11px] text-[#2B2B2B]/50 mt-0.5">{label}</p>
            </div>
        </button>
    );
}

function StatusBadge({ status }) {
    const { label, color } = STATUS_MAP[status] ?? STATUS_MAP.draft;
    return <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', color)}>{label}</span>;
}

export default function QuotationsIndex({ quotations, stats, clients, filters }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters.search ?? '');

    function applyFilter(extra) {
        router.get('/presupuestos', { ...filters, search, ...extra }, { preserveState: true, replace: true });
    }

    return (
        <AppLayout title="Presupuestos">
            <div className="space-y-5">
                {flash?.success && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                        <CheckCircle size={15} /> {flash.success}
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-[#2B2B2B]">Presupuestos</h1>
                        <p className="text-sm text-[#2B2B2B]/50 mt-0.5">Cotizaciones y presupuestos a clientes</p>
                    </div>
                    <Link href="/presupuestos/crear"><Button><Plus size={15} /> Nuevo presupuesto</Button></Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <StatCard label="Total" value={stats.total} status="total" onClick={() => applyFilter({ status: undefined })} active={!filters.status} />
                    {['draft', 'sent', 'accepted', 'rejected'].map(s => (
                        <StatCard key={s} label={STATUS_MAP[s].label} value={stats[s]} status={s} onClick={() => applyFilter({ status: s })} active={filters.status === s} />
                    ))}
                </div>

                <div className="bg-white border border-[#D3D3D3] rounded-xl p-4">
                    <form onSubmit={e => { e.preventDefault(); applyFilter({}); }} className="flex flex-wrap gap-2">
                        <div className="relative flex-1 min-w-48">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2B2B]/35 pointer-events-none" />
                            <Input placeholder="Buscar por número o cliente…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                        </div>
                        <Button type="submit" variant="outline">Buscar</Button>
                        <AppSelect
                            value={filters.client_id ? String(filters.client_id) : ''}
                            onValueChange={val => applyFilter({ client_id: val || undefined })}
                            options={clients.map(c => ({ value: c.id, label: c.name }))}
                            placeholder="Todos los clientes"
                        />
                        <AppSelect
                            value={filters.status ?? ''}
                            onValueChange={val => applyFilter({ status: val || undefined })}
                            options={Object.entries(STATUS_MAP).map(([v, { label }]) => ({ value: v, label }))}
                            placeholder="Todos los estados"
                        />
                        {(filters.search || filters.status || filters.client_id) && (
                            <Button type="button" variant="ghost" onClick={() => router.get('/presupuestos', {}, { replace: true })} className="text-xs text-[#2B2B2B]/50">Limpiar</Button>
                        )}
                    </form>
                </div>

                <div className="bg-white border border-[#D3D3D3] rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[#D3D3D3]/60 bg-[#F4F4F4]/60">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Número</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Cliente</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Fecha</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Vence</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Estado</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Total</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D3D3D3]/40">
                            {quotations.data.length === 0 && (
                                <tr><td colSpan={7} className="px-4 py-12 text-center text-[#2B2B2B]/35 text-sm">No se encontraron presupuestos.</td></tr>
                            )}
                            {quotations.data.map(q => (
                                <tr key={q.id} className="hover:bg-[#F4F4F4]/60 transition-colors group">
                                    <td className="px-4 py-3 font-mono text-xs text-[#2D4C73] font-semibold">
                                        <Link href={`/presupuestos/${q.id}`} className="hover:underline">{q.number}</Link>
                                    </td>
                                    <td className="px-4 py-3 text-[#2B2B2B]">{q.client}</td>
                                    <td className="px-4 py-3 text-xs text-[#2B2B2B]/60">{q.date}</td>
                                    <td className="px-4 py-3 text-xs text-[#2B2B2B]/50">{q.expiry_date ?? '—'}</td>
                                    <td className="px-4 py-3 text-center"><StatusBadge status={q.status} /></td>
                                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                                        ${q.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href={`/presupuestos/${q.id}`}>
                                                <button className="p-1.5 rounded-md hover:bg-[#2D4C73]/10 text-[#2D4C73] transition-colors"><Eye size={14} /></button>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {quotations.last_page > 1 && (
                        <div className="px-4 py-3 border-t border-[#D3D3D3]/60 flex items-center justify-between">
                            <span className="text-xs text-[#2B2B2B]/40">{quotations.from}–{quotations.to} de {quotations.total}</span>
                            <div className="flex gap-1">
                                {quotations.links.map((link, i) => (
                                    <button key={i} disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={cn('px-3 py-1 rounded-md text-xs transition-colors',
                                            link.active ? 'bg-[#F58220] text-white font-semibold'
                                                : link.url ? 'text-[#2B2B2B]/60 hover:bg-[#F4F4F4]'
                                                : 'text-[#2B2B2B]/25 cursor-default')} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
