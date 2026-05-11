import { useState } from 'react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Wallet, Plus, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown,
    ArrowDownCircle, ArrowUpCircle, Eye, AlertTriangle, Lock, Unlock,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppSelect from '@/components/ui/AppSelect';
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

function FlashBanner() {
    const { flash } = usePage().props;
    if (flash?.success) return (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            <CheckCircle size={15} /> {flash.success}
        </div>
    );
    if (flash?.error) return (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <XCircle size={15} /> {flash.error}
        </div>
    );
    return null;
}

// ──────────────────────────────────────────────
// Panel: caja cerrada → formulario de apertura
// ──────────────────────────────────────────────
function OpenForm({ registers }) {
    const { data, setData, post, processing, errors } = useForm({
        cash_register_id: registers[0]?.id?.toString() ?? '',
        opening_amount: '',
        notes: '',
    });

    function submit(e) {
        e.preventDefault();
        post('/caja/abrir');
    }

    return (
        <div className="bg-white border border-[#D3D3D3] rounded-xl p-6 max-w-md">
            <div className="flex items-center gap-3 mb-5">
                <span className="p-2.5 rounded-lg bg-[#2D4C73]/10 text-[#2D4C73]">
                    <Unlock size={20} />
                </span>
                <div>
                    <h2 className="font-semibold text-[#2B2B2B]">Abrir caja</h2>
                    <p className="text-xs text-[#2B2B2B]/50">Ingresá el efectivo inicial en el cajón</p>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-4">
                {registers.length > 1 && (
                    <div className="space-y-1.5">
                        <Label>Caja</Label>
                        <AppSelect
                            value={data.cash_register_id}
                            onValueChange={v => setData('cash_register_id', v)}
                            options={registers.map(r => ({ value: r.id.toString(), label: r.name + (r.location ? ` — ${r.location}` : '') }))}
                            placeholder="Seleccionar caja"
                        />
                        {errors.cash_register_id && <p className="text-xs text-red-500">{errors.cash_register_id}</p>}
                    </div>
                )}

                <div className="space-y-1.5">
                    <Label>Efectivo inicial en caja</Label>
                    <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={data.opening_amount}
                        onChange={e => setData('opening_amount', e.target.value)}
                        autoFocus
                    />
                    {errors.opening_amount && <p className="text-xs text-red-500">{errors.opening_amount}</p>}
                </div>

                <div className="space-y-1.5">
                    <Label>Observaciones <span className="text-[#2B2B2B]/30">(opcional)</span></Label>
                    <Input
                        placeholder="Ej: inicio del día, cambio de turno…"
                        value={data.notes}
                        onChange={e => setData('notes', e.target.value)}
                    />
                </div>

                <Button type="submit" disabled={processing} className="w-full">
                    <Unlock size={15} /> Abrir caja
                </Button>
            </form>
        </div>
    );
}

// ──────────────────────────────────────────────
// Panel: caja abierta
// ──────────────────────────────────────────────
function MovementForm({ sessionId }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        type: 'expense',
        amount: '',
        description: '',
    });

    function submit(e) {
        e.preventDefault();
        post(`/caja/${sessionId}/movimiento`, { onSuccess: () => reset() });
    }

    return (
        <form onSubmit={submit} className="space-y-3">
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => setData('type', 'income')}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm font-medium transition-all',
                        data.type === 'income'
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                            : 'border-[#D3D3D3] text-[#2B2B2B]/50 hover:border-emerald-300',
                    )}
                >
                    <ArrowDownCircle size={14} /> Ingreso
                </button>
                <button
                    type="button"
                    onClick={() => setData('type', 'expense')}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm font-medium transition-all',
                        data.type === 'expense'
                            ? 'border-red-400 bg-red-50 text-red-600'
                            : 'border-[#D3D3D3] text-[#2B2B2B]/50 hover:border-red-300',
                    )}
                >
                    <ArrowUpCircle size={14} /> Retiro
                </button>
            </div>
            <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Importe"
                value={data.amount}
                onChange={e => setData('amount', e.target.value)}
            />
            {errors.amount && <p className="text-xs text-red-500">{errors.amount}</p>}
            <Input
                placeholder="Descripción (ej: retiro para gastos)"
                value={data.description}
                onChange={e => setData('description', e.target.value)}
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
            <Button type="submit" size="sm" disabled={processing} className="w-full">
                Registrar movimiento
            </Button>
        </form>
    );
}

function CloseForm({ session }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        closing_amount: session.expected_cash.toFixed(2),
        notes: '',
    });

    function submit(e) {
        e.preventDefault();
        if (!confirm('¿Confirmar cierre de caja?')) return;
        post(`/caja/${session.id}/cerrar`);
    }

    const diff = parseFloat(data.closing_amount || 0) - session.expected_cash;

    return (
        <div className="border border-[#D3D3D3] rounded-xl overflow-hidden">
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#F4F4F4]/80 hover:bg-[#F4F4F4] transition-colors"
            >
                <span className="flex items-center gap-2 text-sm font-medium text-[#2B2B2B]">
                    <Lock size={14} /> Cerrar caja
                </span>
                <span className="text-xs text-[#2B2B2B]/40">{open ? '▲' : '▼'}</span>
            </button>

            {open && (
                <form onSubmit={submit} className="px-4 py-4 space-y-3 bg-white">
                    <div className="space-y-1.5">
                        <Label>Efectivo contado en caja</Label>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={data.closing_amount}
                            onChange={e => setData('closing_amount', e.target.value)}
                            autoFocus
                        />
                        {errors.closing_amount && <p className="text-xs text-red-500">{errors.closing_amount}</p>}
                    </div>

                    <div className="flex justify-between text-sm px-1">
                        <span className="text-[#2B2B2B]/50">Efectivo esperado</span>
                        <span className="font-medium">{money(session.expected_cash)}</span>
                    </div>
                    <div className={cn('flex justify-between text-sm px-1 font-semibold', diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : 'text-[#2B2B2B]/50')}>
                        <span>Diferencia</span>
                        <span>{diff >= 0 ? '+' : ''}{money(diff)}</span>
                    </div>

                    {Math.abs(diff) > 0 && (
                        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs">
                            <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                            {diff > 0 ? 'Sobrante en caja.' : 'Faltante en caja.'}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label>Observaciones <span className="text-[#2B2B2B]/30">(opcional)</span></Label>
                        <Input
                            placeholder="Notas del cierre…"
                            value={data.notes}
                            onChange={e => setData('notes', e.target.value)}
                        />
                    </div>

                    <Button type="submit" disabled={processing} variant="destructive" className="w-full">
                        <Lock size={14} /> Confirmar cierre
                    </Button>
                </form>
            )}
        </div>
    );
}

function OpenSessionPanel({ session }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Columna izquierda: totales + acciones */}
            <div className="space-y-4">
                {/* Info sesión */}
                <div className="bg-white border border-[#D3D3D3] rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-sm font-semibold text-[#2B2B2B]">Caja abierta</span>
                        <span className="ml-auto text-xs text-[#2B2B2B]/40">{session.cash_register}</span>
                    </div>
                    <div className="text-xs text-[#2B2B2B]/50 space-y-1">
                        <div>Abierta por <span className="text-[#2B2B2B]/80 font-medium">{session.opened_by}</span></div>
                        <div className="flex items-center gap-1"><Clock size={11} /> {session.opened_at}</div>
                    </div>
                    <div className="pt-2 border-t border-[#D3D3D3]/60 flex justify-between text-sm">
                        <span className="text-[#2B2B2B]/50">Fondo inicial</span>
                        <span className="font-semibold">{money(session.opening_amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-[#2B2B2B]/50">Total cobrado</span>
                        <span className="font-bold text-[#2D4C73]">{money(session.total_payments)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-[#2B2B2B]/50">Efectivo esperado</span>
                        <span className="font-bold text-emerald-600">{money(session.expected_cash)}</span>
                    </div>
                </div>

                {/* Totales por método */}
                <div className="bg-white border border-[#D3D3D3] rounded-xl p-4">
                    <p className="text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide mb-3">Por medio de pago</p>
                    {session.totals_by_method.length === 0 ? (
                        <p className="text-xs text-[#2B2B2B]/30 text-center py-3">Sin cobros registrados</p>
                    ) : (
                        <div className="space-y-2">
                            {session.totals_by_method.map(t => (
                                <div key={t.id} className="flex items-center justify-between">
                                    <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', METHOD_COLORS[t.type] ?? 'bg-slate-100 text-slate-600')}>
                                        {t.name}
                                    </span>
                                    <span className="text-sm font-semibold text-[#2B2B2B] tabular-nums">{money(t.total)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Movimientos manuales */}
                <div className="bg-white border border-[#D3D3D3] rounded-xl p-4">
                    <p className="text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide mb-3">Movimiento manual</p>
                    <MovementForm sessionId={session.id} />
                </div>

                {/* Cierre */}
                <CloseForm session={session} />
            </div>

            {/* Columna derecha: historial */}
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

                {/* Pagos recientes */}
                <div className="bg-white border border-[#D3D3D3] rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#D3D3D3]/60">
                        <p className="text-sm font-semibold text-[#2B2B2B]">Cobros del día</p>
                    </div>
                    {session.recent_payments.length === 0 ? (
                        <p className="px-4 py-10 text-center text-[#2B2B2B]/30 text-sm">Sin cobros registrados</p>
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
                                {session.recent_payments.map(p => (
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
                                        <td className="px-4 py-2 text-right font-semibold tabular-nums text-[#2B2B2B]">{money(p.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────
// Historial de sesiones cerradas
// ──────────────────────────────────────────────
function SessionHistory({ sessions }) {
    if (sessions.length === 0) return null;

    return (
        <div className="bg-white border border-[#D3D3D3] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#D3D3D3]/60">
                <p className="text-sm font-semibold text-[#2B2B2B]">Cierres recientes</p>
            </div>
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-[#D3D3D3]/60 bg-[#F4F4F4]/60">
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Apertura</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Cierre</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Operador</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Efectivo esperado</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Efectivo real</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Diferencia</th>
                        <th className="px-4 py-2.5" />
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#D3D3D3]/40">
                    {sessions.map(s => (
                        <tr key={s.id} className="hover:bg-[#F4F4F4]/60 transition-colors">
                            <td className="px-4 py-2.5 text-xs text-[#2B2B2B]/70 whitespace-nowrap">{s.opened_at}</td>
                            <td className="px-4 py-2.5 text-xs text-[#2B2B2B]/70 whitespace-nowrap">{s.closed_at}</td>
                            <td className="px-4 py-2.5 text-xs text-[#2B2B2B]">{s.opened_by}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-xs text-[#2B2B2B]">{money(s.expected_cash ?? s.closing_amount)}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-xs text-[#2B2B2B]">{money(s.closing_amount)}</td>
                            <td className="px-4 py-2.5 text-right">
                                {s.difference === 0 ? (
                                    <span className="text-xs text-[#2B2B2B]/30">—</span>
                                ) : (
                                    <span className={cn('text-xs font-semibold', s.difference > 0 ? 'text-emerald-600' : 'text-red-500')}>
                                        {s.difference > 0 ? '+' : ''}{money(s.difference)}
                                    </span>
                                )}
                            </td>
                            <td className="px-4 py-2.5">
                                <Link href={`/caja/${s.id}`}>
                                    <button className="p-1.5 rounded-md hover:bg-[#2D4C73]/10 text-[#2D4C73] transition-colors" title="Ver detalle">
                                        <Eye size={14} />
                                    </button>
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ──────────────────────────────────────────────
// Página principal
// ──────────────────────────────────────────────
export default function CashIndex({ open_session, recent_sessions, registers }) {
    return (
        <AppLayout title="Caja">
            <div className="space-y-5">
                <FlashBanner />

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-[#2B2B2B]">Caja</h1>
                        <p className="text-sm text-[#2B2B2B]/50 mt-0.5">
                            {open_session ? `Sesión abierta · ${open_session.cash_register}` : 'No hay caja abierta'}
                        </p>
                    </div>
                    {open_session && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Abierta
                        </div>
                    )}
                </div>

                {open_session ? (
                    <OpenSessionPanel session={open_session} />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <OpenForm registers={registers} />
                        <SessionHistory sessions={recent_sessions} />
                    </div>
                )}

                {open_session && recent_sessions.length > 0 && (
                    <SessionHistory sessions={recent_sessions} />
                )}
            </div>
        </AppLayout>
    );
}
