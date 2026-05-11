import { useRef, useState } from 'react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Upload, Plus, Pencil, Trash2, CheckCircle, XCircle, AlertTriangle,
    FileSpreadsheet, Clock, Eye, X, Settings2,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppSelect from '@/components/ui/AppSelect';
import {
    Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter,
    DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const STATUS_STYLES = {
    completed:  'bg-emerald-100 text-emerald-700',
    failed:     'bg-red-100 text-red-600',
    processing: 'bg-blue-100 text-blue-700',
    pending:    'bg-slate-100 text-slate-500',
};

const STATUS_LABELS = {
    completed:  'Completado',
    failed:     'Error',
    processing: 'Procesando',
    pending:    'Pendiente',
};

const ID_TYPE_LABELS = {
    sku:     'SKU',
    barcode: 'Código de barras',
    code:    'Código de producto',
};

function FlashBanner() {
    const { flash } = usePage().props;
    if (flash?.success) return (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            <CheckCircle size={15} /> {flash.success}
        </div>
    );
    if (flash?.warning) return (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
            <AlertTriangle size={15} /> {flash.warning}
        </div>
    );
    if (flash?.error) return (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <XCircle size={15} /> {flash.error}
        </div>
    );
    return null;
}

// ─── Formulario config ───────────────────────────────
const EMPTY_CONFIG = {
    supplier_id: '',
    name: '',
    file_type: 'excel',
    sheet_index: '0',
    header_row: '1',
    data_start_row: '2',
    csv_delimiter: ';',
    csv_encoding: 'UTF-8',
    price_list_id: '',
    markup_pct: '',
    column_mappings: {
        identifier_type: 'sku',
        identifier: '',
        cost_price: '',
        sale_price: '',
    },
};

function ConfigDialog({ open, onClose, suppliers, priceLists, editing }) {
    const isEdit   = !!editing;
    const initial  = isEdit ? {
        supplier_id:     editing.supplier_id?.toString() ?? '',
        name:            editing.name ?? '',
        file_type:       editing.file_type ?? 'excel',
        sheet_index:     String(editing.sheet_index ?? 0),
        header_row:      String(editing.header_row ?? 1),
        data_start_row:  String(editing.data_start_row ?? 2),
        csv_delimiter:   editing.csv_delimiter ?? ';',
        csv_encoding:    editing.csv_encoding ?? 'UTF-8',
        price_list_id:   editing.price_list_id?.toString() ?? '',
        markup_pct:      editing.markup_pct ? String(editing.markup_pct) : '',
        column_mappings: {
            identifier_type: editing.column_mappings?.identifier_type ?? 'sku',
            identifier:      editing.column_mappings?.identifier ? String(editing.column_mappings.identifier) : '',
            cost_price:      editing.column_mappings?.cost_price  ? String(editing.column_mappings.cost_price)  : '',
            sale_price:      editing.column_mappings?.sale_price  ? String(editing.column_mappings.sale_price)  : '',
        },
    } : { ...EMPTY_CONFIG };

    const { data, setData, post, put, processing, errors, reset } = useForm(initial);

    function setMapping(key, val) {
        setData('column_mappings', { ...data.column_mappings, [key]: val });
    }

    function handleClose() {
        reset();
        onClose();
    }

    function submit(e) {
        e.preventDefault();
        if (isEdit) {
            put(`/importacion/configs/${editing.id}`, { onSuccess: handleClose });
        } else {
            post('/importacion/configs', { onSuccess: handleClose });
        }
    }

    return (
        <Dialog open={open} onOpenChange={v => !v && handleClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Editar configuración' : 'Nueva configuración de importación'}</DialogTitle>
                    <DialogDescription>Definí cómo leer el archivo de lista de precios de este proveedor.</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit}>
                    <DialogBody className="space-y-5">

                        {/* Básicos */}
                        <div className="grid grid-cols-2 gap-4">
                            {!isEdit && (
                                <div className="col-span-2 space-y-1.5">
                                    <Label>Proveedor</Label>
                                    <AppSelect
                                        value={data.supplier_id}
                                        onValueChange={v => setData('supplier_id', v)}
                                        options={suppliers.map(s => ({ value: String(s.id), label: s.name }))}
                                        placeholder="Seleccionar proveedor"
                                    />
                                    {errors.supplier_id && <p className="text-xs text-red-500">{errors.supplier_id}</p>}
                                </div>
                            )}
                            <div className="col-span-2 space-y-1.5">
                                <Label>Nombre de la configuración</Label>
                                <Input
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    placeholder="Ej: Lista de precios mensual"
                                />
                                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Tipo de archivo</Label>
                                <AppSelect
                                    value={data.file_type}
                                    onValueChange={v => setData('file_type', v)}
                                    options={[{ value: 'excel', label: 'Excel (.xlsx / .xls)' }, { value: 'csv', label: 'CSV' }]}
                                />
                            </div>
                            {data.file_type === 'excel' ? (
                                <div className="space-y-1.5">
                                    <Label>Hoja (0 = primera)</Label>
                                    <Input type="number" min="0" value={data.sheet_index} onChange={e => setData('sheet_index', e.target.value)} />
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <Label>Separador CSV</Label>
                                    <Input value={data.csv_delimiter} onChange={e => setData('csv_delimiter', e.target.value)} maxLength={1} placeholder=";" />
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <Label>Fila de encabezados</Label>
                                <Input type="number" min="1" value={data.header_row} onChange={e => setData('header_row', e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Primera fila de datos</Label>
                                <Input type="number" min="1" value={data.data_start_row} onChange={e => setData('data_start_row', e.target.value)} />
                            </div>
                        </div>

                        {/* Mapeo de columnas */}
                        <div className="rounded-xl border border-[#D3D3D3] p-4 space-y-4">
                            <p className="text-sm font-semibold text-[#2B2B2B]">Mapeo de columnas <span className="text-[#2B2B2B]/40 font-normal text-xs">(número de columna, empezando en 1)</span></p>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Identificar por</Label>
                                    <AppSelect
                                        value={data.column_mappings.identifier_type}
                                        onValueChange={v => setMapping('identifier_type', v)}
                                        options={[
                                            { value: 'sku',     label: 'SKU' },
                                            { value: 'barcode', label: 'Código de barras' },
                                            { value: 'code',    label: 'Código de producto' },
                                        ]}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Columna de {ID_TYPE_LABELS[data.column_mappings.identifier_type]}</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        placeholder="Ej: 1"
                                        value={data.column_mappings.identifier}
                                        onChange={e => setMapping('identifier', e.target.value)}
                                    />
                                    {errors['column_mappings.identifier'] && <p className="text-xs text-red-500">{errors['column_mappings.identifier']}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Columna de precio costo <span className="text-[#2B2B2B]/40">(opcional)</span></Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        placeholder="Ej: 3"
                                        value={data.column_mappings.cost_price}
                                        onChange={e => setMapping('cost_price', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Columna de precio venta <span className="text-[#2B2B2B]/40">(opcional)</span></Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        placeholder="Ej: 4"
                                        value={data.column_mappings.sale_price}
                                        onChange={e => setMapping('sale_price', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Lista de precios y markup */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Lista de precios destino <span className="text-[#2B2B2B]/40">(opcional)</span></Label>
                                <AppSelect
                                    value={data.price_list_id}
                                    onValueChange={v => setData('price_list_id', v)}
                                    options={priceLists.map(p => ({ value: String(p.id), label: p.name }))}
                                    placeholder="No asignar"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Markup sobre costo % <span className="text-[#2B2B2B]/40">(si no hay col. venta)</span></Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Ej: 30"
                                    value={data.markup_pct}
                                    onChange={e => setData('markup_pct', e.target.value)}
                                />
                            </div>
                        </div>
                    </DialogBody>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={handleClose}>Cancelar</Button>
                        <Button type="submit" disabled={processing}>
                            {isEdit ? 'Guardar cambios' : 'Crear configuración'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── Upload dialog ───────────────────────────────────
function UploadDialog({ open, onClose, config }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef(null);

    function handleClose() {
        setFile(null);
        onClose();
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (!file) return;
        setUploading(true);
        const form = new FormData();
        form.append('file', file);
        router.post(`/importacion/configs/${config.id}/importar`, form, {
            onFinish: () => { setUploading(false); handleClose(); },
        });
    }

    return (
        <Dialog open={open} onOpenChange={v => !v && handleClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Importar lista de precios</DialogTitle>
                    <DialogDescription>{config?.name}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <DialogBody className="space-y-4">
                        <div
                            onClick={() => inputRef.current?.click()}
                            className={cn(
                                'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
                                file ? 'border-[#F58220] bg-[#F58220]/5' : 'border-[#D3D3D3] hover:border-[#F58220]/50',
                            )}
                        >
                            <FileSpreadsheet size={32} className={cn('mx-auto mb-2', file ? 'text-[#F58220]' : 'text-[#2B2B2B]/20')} />
                            {file ? (
                                <div>
                                    <p className="text-sm font-medium text-[#2B2B2B]">{file.name}</p>
                                    <p className="text-xs text-[#2B2B2B]/40 mt-0.5">{(file.size / 1024).toFixed(0)} KB</p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm text-[#2B2B2B]/60">Hacé clic para seleccionar el archivo</p>
                                    <p className="text-xs text-[#2B2B2B]/35 mt-1">.xlsx · .xls · .csv — máx. 20 MB</p>
                                </div>
                            )}
                            <input
                                ref={inputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv,.txt"
                                className="hidden"
                                onChange={e => setFile(e.target.files[0] ?? null)}
                            />
                        </div>

                        {config && (
                            <div className="rounded-lg bg-[#F4F4F4] px-3 py-2.5 text-xs text-[#2B2B2B]/60 space-y-1">
                                <div className="flex justify-between">
                                    <span>Identificador</span>
                                    <span className="font-medium text-[#2B2B2B]">{ID_TYPE_LABELS[config.column_mappings?.identifier_type]} · col {config.column_mappings?.identifier}</span>
                                </div>
                                {config.column_mappings?.cost_price && (
                                    <div className="flex justify-between">
                                        <span>Precio costo</span>
                                        <span className="font-medium text-[#2B2B2B]">col {config.column_mappings.cost_price}</span>
                                    </div>
                                )}
                                {config.column_mappings?.sale_price && (
                                    <div className="flex justify-between">
                                        <span>Precio venta</span>
                                        <span className="font-medium text-[#2B2B2B]">col {config.column_mappings.sale_price}</span>
                                    </div>
                                )}
                                {config.markup_pct > 0 && !config.column_mappings?.sale_price && (
                                    <div className="flex justify-between">
                                        <span>Markup</span>
                                        <span className="font-medium text-[#2B2B2B]">{config.markup_pct}%</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span>Datos desde fila</span>
                                    <span className="font-medium text-[#2B2B2B]">{config.data_start_row}</span>
                                </div>
                            </div>
                        )}
                    </DialogBody>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={handleClose}>Cancelar</Button>
                        <Button type="submit" disabled={!file || uploading}>
                            <Upload size={14} /> {uploading ? 'Procesando…' : 'Importar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── Página principal ────────────────────────────────
export default function ImportsIndex({ suppliers, recent_logs, price_lists }) {
    const [configDialog, setConfigDialog] = useState({ open: false, editing: null, supplierId: null });
    const [uploadDialog, setUploadDialog] = useState({ open: false, config: null });

    function openNewConfig(supplierId) {
        setConfigDialog({ open: true, editing: null, supplierId });
    }

    function openEditConfig(config, supplierId) {
        setConfigDialog({ open: true, editing: { ...config, supplier_id: supplierId }, supplierId });
    }

    function deleteConfig(config) {
        if (!confirm(`¿Eliminar la configuración "${config.name}"?`)) return;
        router.delete(`/importacion/configs/${config.id}`);
    }

    const allSuppliers = suppliers.map(s => ({ id: s.id, name: s.name }));

    return (
        <AppLayout title="Importación de precios">
            <div className="space-y-5">
                <FlashBanner />

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-[#2B2B2B]">Importación de precios</h1>
                        <p className="text-sm text-[#2B2B2B]/50 mt-0.5">Actualizá precios desde archivos Excel o CSV de tus proveedores</p>
                    </div>
                    <Button onClick={() => setConfigDialog({ open: true, editing: null, supplierId: null })}>
                        <Plus size={15} /> Nueva configuración
                    </Button>
                </div>

                {/* Proveedores con configs */}
                {suppliers.length === 0 ? (
                    <div className="bg-white border border-[#D3D3D3] rounded-xl p-10 text-center text-[#2B2B2B]/40 text-sm">
                        No hay proveedores activos. <Link href="/proveedores/crear" className="text-[#F58220] hover:underline">Crear proveedor</Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {suppliers.map(supplier => (
                            <div key={supplier.id} className="bg-white border border-[#D3D3D3] rounded-xl overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-[#D3D3D3]/50 bg-[#F4F4F4]/60">
                                    <p className="font-semibold text-[#2B2B2B] text-sm">{supplier.name}</p>
                                    <button
                                        onClick={() => openNewConfig(supplier.id)}
                                        className="flex items-center gap-1 text-xs text-[#F58220] hover:text-[#d4701a] font-medium transition-colors"
                                    >
                                        <Plus size={12} /> Agregar config
                                    </button>
                                </div>

                                {supplier.configs.length === 0 ? (
                                    <p className="px-4 py-4 text-xs text-[#2B2B2B]/35 italic">Sin configuraciones. Agregá una para importar precios.</p>
                                ) : (
                                    <div className="divide-y divide-[#D3D3D3]/40">
                                        {supplier.configs.map(config => (
                                            <div key={config.id} className="flex items-center gap-4 px-4 py-3 hover:bg-[#F4F4F4]/40 group">
                                                <Settings2 size={15} className="text-[#2B2B2B]/30 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-sm font-medium text-[#2B2B2B]">{config.name}</span>
                                                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase font-mono">
                                                            {config.file_type}
                                                        </span>
                                                        {!config.is_active && (
                                                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-red-50 text-red-400">inactiva</span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-[#2B2B2B]/40 mt-0.5 flex flex-wrap gap-x-3">
                                                        <span>{ID_TYPE_LABELS[config.column_mappings?.identifier_type]} en col {config.column_mappings?.identifier}</span>
                                                        {config.column_mappings?.cost_price && <span>Costo: col {config.column_mappings.cost_price}</span>}
                                                        {config.column_mappings?.sale_price && <span>Venta: col {config.column_mappings.sale_price}</span>}
                                                        {config.markup_pct > 0 && !config.column_mappings?.sale_price && <span>Markup {config.markup_pct}%</span>}
                                                        {config.price_list && <span>→ {config.price_list}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setUploadDialog({ open: true, config })}
                                                        className="h-7 text-xs gap-1"
                                                    >
                                                        <Upload size={12} /> Importar
                                                    </Button>
                                                    <button
                                                        onClick={() => openEditConfig(config, supplier.id)}
                                                        className="p-1.5 rounded-md hover:bg-[#F58220]/10 text-[#F58220] transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Editar"
                                                    >
                                                        <Pencil size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteConfig(config)}
                                                        className="p-1.5 rounded-md hover:bg-red-50 text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Log de importaciones */}
                <div className="bg-white border border-[#D3D3D3] rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#D3D3D3]/60">
                        <p className="text-sm font-semibold text-[#2B2B2B]">Historial de importaciones</p>
                    </div>
                    {recent_logs.length === 0 ? (
                        <p className="px-4 py-10 text-center text-[#2B2B2B]/30 text-sm">Sin importaciones registradas</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#D3D3D3]/60 bg-[#F4F4F4]/60">
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Fecha</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Proveedor / Config</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Archivo</th>
                                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Estado</th>
                                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Actualizados</th>
                                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Saltados</th>
                                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-[#2B2B2B]/50 uppercase tracking-wide">Errores</th>
                                    <th className="px-4 py-2.5" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#D3D3D3]/40">
                                {recent_logs.map(log => (
                                    <tr key={log.id} className="hover:bg-[#F4F4F4]/60">
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-1.5 text-xs text-[#2B2B2B]/60 whitespace-nowrap">
                                                <Clock size={11} /> {log.imported_at ?? log.created_at}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <div className="text-sm font-medium text-[#2B2B2B]">{log.supplier}</div>
                                            {log.config && <div className="text-xs text-[#2B2B2B]/40">{log.config}</div>}
                                        </td>
                                        <td className="px-4 py-2.5 max-w-[200px]">
                                            <p className="text-xs text-[#2B2B2B]/60 truncate" title={log.file_name}>{log.file_name}</p>
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', STATUS_STYLES[log.status] ?? 'bg-slate-100 text-slate-500')}>
                                                {STATUS_LABELS[log.status] ?? log.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-center text-sm tabular-nums font-semibold text-emerald-600">
                                            {log.rows_updated > 0 ? log.rows_updated : <span className="text-[#2B2B2B]/25">—</span>}
                                        </td>
                                        <td className="px-4 py-2.5 text-center text-sm tabular-nums text-[#2B2B2B]/40">
                                            {log.rows_skipped > 0 ? log.rows_skipped : <span className="text-[#2B2B2B]/25">—</span>}
                                        </td>
                                        <td className="px-4 py-2.5 text-center text-sm tabular-nums font-semibold text-red-500">
                                            {log.rows_failed > 0 ? log.rows_failed : <span className="text-[#2B2B2B]/25">—</span>}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            {log.has_errors && (
                                                <Link href={`/importacion/logs/${log.id}`}>
                                                    <button className="p-1.5 rounded-md hover:bg-[#2D4C73]/10 text-[#2D4C73] transition-colors" title="Ver errores">
                                                        <Eye size={13} />
                                                    </button>
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Dialogs */}
            <ConfigDialog
                open={configDialog.open}
                onClose={() => setConfigDialog({ open: false, editing: null, supplierId: null })}
                suppliers={allSuppliers}
                priceLists={price_lists}
                editing={configDialog.editing}
            />

            <UploadDialog
                open={uploadDialog.open}
                onClose={() => setUploadDialog({ open: false, config: null })}
                config={uploadDialog.config}
            />
        </AppLayout>
    );
}
