import { Link } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';

const STATUS_STYLES = {
    completed: 'bg-emerald-100 text-emerald-700',
    failed:    'bg-red-100 text-red-600',
    processing:'bg-blue-100 text-blue-700',
    pending:   'bg-slate-100 text-slate-500',
};

const STATUS_LABELS = {
    completed: 'Completado',
    failed:    'Error',
    processing:'Procesando',
    pending:   'Pendiente',
};

function StatBox({ label, value, color }) {
    return (
        <div className="bg-white border border-[#D3D3D3] rounded-xl px-4 py-3 text-center">
            <p className={cn('text-2xl font-bold tabular-nums', color)}>{value}</p>
            <p className="text-xs text-[#2B2B2B]/50 mt-0.5">{label}</p>
        </div>
    );
}

export default function LogDetail({ log }) {
    return (
        <AppLayout title="Detalle de importación">
            <div className="space-y-5 max-w-4xl">

                <Link href="/importacion" className="inline-flex items-center gap-1.5 text-sm text-[#2B2B2B]/50 hover:text-[#2B2B2B] transition-colors">
                    <ArrowLeft size={14} /> Volver a Importaciones
                </Link>

                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-[#2B2B2B]">Importación #{log.id}</h1>
                        <p className="text-sm text-[#2B2B2B]/50 mt-0.5">{log.supplier} · {log.config}</p>
                    </div>
                    <span className={cn('text-xs font-medium px-3 py-1.5 rounded-full', STATUS_STYLES[log.status] ?? 'bg-slate-100 text-slate-500')}>
                        {STATUS_LABELS[log.status] ?? log.status}
                    </span>
                </div>

                {/* Info */}
                <div className="bg-white border border-[#D3D3D3] rounded-xl p-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
                    <div><span className="text-[#2B2B2B]/40">Archivo</span> <span className="font-medium ml-2">{log.file_name}</span></div>
                    <div><span className="text-[#2B2B2B]/40">Operador</span> <span className="font-medium ml-2">{log.user}</span></div>
                    {log.imported_at && (
                        <div className="flex items-center gap-1 text-[#2B2B2B]/50"><Clock size={12} /> {log.imported_at}</div>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatBox label="Total filas" value={log.rows_total} color="text-[#2B2B2B]" />
                    <StatBox label="Actualizados" value={log.rows_updated} color="text-emerald-600" />
                    <StatBox label="Sin cambios" value={log.rows_skipped} color="text-[#2B2B2B]/40" />
                    <StatBox label="Con error" value={log.rows_failed} color={log.rows_failed > 0 ? 'text-red-500' : 'text-[#2B2B2B]/25'} />
                </div>

                {/* Errores */}
                {log.error_details?.length > 0 && (
                    <div className="bg-white border border-[#D3D3D3] rounded-xl overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#D3D3D3]/60 bg-red-50">
                            <AlertTriangle size={14} className="text-red-500" />
                            <p className="text-sm font-semibold text-red-700">{log.error_details.length} error{log.error_details.length !== 1 ? 'es' : ''}</p>
                        </div>
                        <div className="divide-y divide-[#D3D3D3]/40">
                            {log.error_details.map((err, i) => (
                                <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                                    <XCircle size={13} className="text-red-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-mono text-[#2B2B2B]/60">
                                            Fila {err.row}{err.identifier ? ` · ${err.identifier}` : ''}
                                        </p>
                                        <p className="text-sm text-[#2B2B2B]">{err.error}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {log.status === 'completed' && log.rows_failed === 0 && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                        <CheckCircle size={15} /> Importación completada sin errores.
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
