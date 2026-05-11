import { Link } from '@inertiajs/react';
import {
    ArrowLeft, ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle, AlertTriangle,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';

const METHOD_COLORS = {
    efectivo:        'bg-emerald-100 text-emerald-700',
    transferencia:   'bg-blue-100 text-blue-700',
    tarjeta_debito:  'bg-indigo-100 text-indigo-700',
    tarjeta_credito: 'bg-violet-100 text-violet-700',
    cheque:          'bg-amber-100 text-amber-700',
    cuenta_corriente:'bg-orange-100 text-orange-700',
    qr:              'bg-cyan-100 text-cyan-700',
};

function money(val) {
    return '$' + Number(val ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 });
}

function InfoRow({ label, value, valueClass }) {
    return (
        <div className="flex justify-between py-2 border-b border-[#D3D3D3]/40 last:border-0 text-sm">
            <span className="text-[#2B2B2B]/50">{label}</span>
            <span className={cn('font-medium text-[#2B2B2B]', valueClass)}>{value}</span>
        </div>
    );
}

export default function CashShow({ session }) {
    const diff = session.difference ?? 0;

    return (
        <AppLayout title="Detalle de caja">
            <div className="space-y-5 max-w-5xl">

                {/* Back */}
                <Link href="/caja" className="inline-flex items-center gap-1.5 text-sm text-[#2B2B2B]/50 hover:text-[#2B2B2B] transition-colors">
                    <ArrowLeft size={14} /> Volver a Caja
                </Link>

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-[#2B2B2B]">Sesión #{session.id}</h1>
                        <p className="text-sm text-[#2B2B2B]/50 mt-0.5">{session.cash_register} · {session.opened_by}</p>
                    </div>
                    <div className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium',
                        session.status === 'open'
                            ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
                            : 'bg-slate-100 border-slate-200 text-slate-600',
                    )}>
                        {session.status === 'open' ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Abierta</> : <><CheckCircle size={12} /> Cerrada</>}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* Resumen */}
                    <div className="space-y-4">
                        <div className="bg-white border border-[#D3D3D3] rounded-xl p-4">
                            <p className="text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide mb-3">Resumen</p>
                            <InfoRow label="Apertura" value={session.opened_at} />
                            {session.closed_at && <InfoRow label="Cierre" value={session.closed_at} />}
                            <InfoRow label="Fondo inicial" value={money(session.opening_amount)} />
                            {session.status === 'closed' && <>
                                <InfoRow label="Efectivo esperado" value={money(session.expected_cash)} />
                                <InfoRow label="Efectivo real" value={money(session.closing_amount)} />
                                <InfoRow
                                    label="Diferencia"
                                    value={(diff >= 0 ? '+' : '') + money(diff)}
                                    valueClass={diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : 'text-[#2B2B2B]/40'}
                                />
                            </>}
                            {session.notes && (
                                <div className="mt-3 pt-3 border-t border-[#D3D3D3]/40 text-xs text-[#2B2B2B]/50">{session.notes}</div>
                            )}
                        </div>

                        {Math.abs(diff) > 0.01 && session.status === 'closed' && (
                            <div className={cn(
                                'flex items-start gap-2 px-3 py-2.5 rounded-lg border text-sm',
                                diff > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-600',
                            )}>
                                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                {diff > 0 ? `Sobrante de ${money(diff)}` : `Faltante de ${money(Math.abs(diff))}`}
                            </div>
                        )}

                        {/* Totales por método */}
                        <div className="bg-white border border-[#D3D3D3] rounded-xl p-4">
                            <p className="text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide mb-3">Por medio de pago</p>
                            {session.totals_by_method.length === 0 ? (
                                <p className="text-xs text-[#2B2B2B]/30 text-center py-3">Sin cobros</p>
                            ) : (
                                <div className="space-y-2.5">
                                    {session.totals_by_method.map((t, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', METHOD_COLORS[t.type] ?? 'bg-slate-100 text-slate-600')}>
                                                {t.name}
                                            </span>
                                            <span className="text-sm font-semibold tabular-nums text-[#2B2B2B]">{money(t.total)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between pt-2 border-t border-[#D3D3D3]/60 font-bold text-sm">
                                        <span>Total</span>
                                        <span>{money(session.totals_by_method.reduce((s, t) => s + t.total, 0))}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Detalle */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Movimientos manuales */}
                        {session.movements.length > 0 && (
                            <div className="bg-white border border-[#D3D3D3] rounded-xl overflow-hidden">
                                <div className="px-4 py-3 border-b border-[#D3D3D3]/60">
                                    <p className="text-sm font-semibold text-[#2B2B2B]">Movimientos manuales</p>
                                </div>
                                <div className="divide-y divide-[#D3D3D3]/40">
                                    {session.movements.map(m => (
                                        <div key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                                            <span className={cn('p-1.5 rounded-lg', m.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500')}>
                                                {m.type === 'income' ? <ArrowDownCircle size={13} /> : <ArrowUpCircle size={13} />}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-[#2B2B2B] truncate">{m.description}</p>
                                                <p className="text-[11px] text-[#2B2B2B]/40">{m.user} · {m.created_at}</p>
                                            </div>
                                            <span className={cn('text-sm font-semibold tabular-nums', m.type === 'income' ? 'text-emerald-600' : 'text-red-500')}>
                                                {m.type === 'income' ? '+' : '-'}{money(m.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Cobros */}
                        <div className="bg-white border border-[#D3D3D3] rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-[#D3D3D3]/60">
                                <p className="text-sm font-semibold text-[#2B2B2B]">
                                    Cobros <span className="text-[#2B2B2B]/40 font-normal">({session.payments.length})</span>
                                </p>
                            </div>
                            {session.payments.length === 0 ? (
                                <p className="px-4 py-10 text-center text-[#2B2B2B]/30 text-sm">Sin cobros en esta sesión</p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[#D3D3D3]/60 bg-[#F4F4F4]/60">
                                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Hora</th>
                                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Origen</th>
                                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Medio</th>
                                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Importe</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#D3D3D3]/40">
                                        {session.payments.map(p => (
                                            <tr key={p.id} className="hover:bg-[#F4F4F4]/60">
                                                <td className="px-4 py-2 text-[#2B2B2B]/50 text-xs whitespace-nowrap">{p.created_at.split(' ')[1]}</td>
                                                <td className="px-4 py-2 text-xs text-[#2B2B2B]/60">
                                                    {p.payable_type} #{p.payable_id}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', METHOD_COLORS[p.method_type] ?? 'bg-slate-100 text-slate-600')}>
                                                        {p.method_name}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-right font-semibold tabular-nums">{money(p.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
