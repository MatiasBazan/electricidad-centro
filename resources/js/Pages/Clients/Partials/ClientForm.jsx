import { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppSelect from '@/components/ui/AppSelect';
import { cn } from '@/lib/utils';

const PROVINCES = [
    'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
    'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
    'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
    'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
    'Tierra del Fuego', 'Tucumán',
];

const TAX_CONDITIONS = [
    { value: 'consumidor_final',    label: 'Consumidor Final' },
    { value: 'responsable_inscripto', label: 'Responsable Inscripto' },
    { value: 'monotributista',       label: 'Monotributista' },
    { value: 'exento',               label: 'Exento' },
];

const DOC_TYPES = [
    { value: 'dni',       label: 'DNI' },
    { value: 'cuit',      label: 'CUIT' },
    { value: 'cuil',      label: 'CUIL' },
    { value: 'pasaporte', label: 'Pasaporte' },
];

function Field({ label, error, children, className }) {
    return (
        <div className={cn('space-y-1', className)}>
            <Label className="text-xs font-medium text-[#2B2B2B]/70">{label}</Label>
            {children}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}


export default function ClientForm({ client = null, onCancel }) {
    const isEmpresa = (type) => type === 'empresa';

    const defaults = {
        type:            'consumidor_final',
        name:            '',
        fantasy_name:    '',
        cuit_cuil:       '',
        document_type:   'dni',
        document_number: '',
        tax_condition:   'consumidor_final',
        address:         '',
        city:            '',
        province:        '',
        postal_code:     '',
        phone:           '',
        mobile:          '',
        email:           '',
        credit_limit:    0,
        notes:           '',
        is_active:       true,
        ...client,
    };

    const { data, setData, post, put, processing, errors } = useForm(defaults);

    // Cuando cambia el tipo, ajustar condición fiscal por defecto
    useEffect(() => {
        if (data.type === 'empresa' && data.tax_condition === 'consumidor_final') {
            setData('tax_condition', 'responsable_inscripto');
        } else if (data.type === 'consumidor_final' && data.tax_condition !== 'consumidor_final') {
            setData('tax_condition', 'consumidor_final');
        }
    }, [data.type]);

    function submit(e) {
        e.preventDefault();
        if (client?.id) {
            put(`/clientes/${client.id}`);
        } else {
            post('/clientes');
        }
    }

    return (
        <form onSubmit={submit} className="space-y-5">

            {/* Tipo de cliente */}
            <div className="bg-white border border-[#D3D3D3] rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-[#2B2B2B]">Tipo de cliente</h2>

                <div className="flex gap-3">
                    {[
                        { value: 'consumidor_final', label: 'Consumidor Final', desc: 'Persona física, DNI' },
                        { value: 'empresa',          label: 'Empresa / Monotributista', desc: 'CUIT, factura A/B' },
                    ].map(({ value, label, desc }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setData('type', value)}
                            className={cn(
                                'flex-1 text-left px-4 py-3 rounded-xl border transition-all',
                                data.type === value
                                    ? 'border-[#F58220] bg-[#F58220]/5 shadow-sm'
                                    : 'border-[#D3D3D3] hover:border-[#F58220]/40'
                            )}
                        >
                            <p className="text-sm font-semibold text-[#2B2B2B]">{label}</p>
                            <p className="text-xs text-[#2B2B2B]/50 mt-0.5">{desc}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Datos principales */}
            <div className="bg-white border border-[#D3D3D3] rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-[#2B2B2B]">Datos principales</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label={isEmpresa(data.type) ? 'Razón social *' : 'Nombre y apellido *'} error={errors.name}>
                        <Input
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            placeholder={isEmpresa(data.type) ? 'Razón social' : 'Nombre completo'}
                        />
                    </Field>

                    {isEmpresa(data.type) && (
                        <Field label="Nombre de fantasía" error={errors.fantasy_name}>
                            <Input
                                value={data.fantasy_name}
                                onChange={e => setData('fantasy_name', e.target.value)}
                                placeholder="Nombre comercial"
                            />
                        </Field>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="Tipo de documento" error={errors.document_type}>
                        <AppSelect
                            value={data.document_type}
                            onValueChange={v => setData('document_type', v)}
                            options={DOC_TYPES}
                        />
                    </Field>
                    <Field label="Número de documento" error={errors.document_number}>
                        <Input
                            value={data.document_number}
                            onChange={e => setData('document_number', e.target.value)}
                            placeholder="Nro. de documento"
                        />
                    </Field>
                    <Field label="CUIT / CUIL" error={errors.cuit_cuil}>
                        <Input
                            value={data.cuit_cuil}
                            onChange={e => setData('cuit_cuil', e.target.value)}
                            placeholder="XX-XXXXXXXX-X"
                            maxLength={13}
                        />
                    </Field>
                </div>

                <Field label="Condición fiscal" error={errors.tax_condition}>
                    <AppSelect
                        value={data.tax_condition}
                        onValueChange={v => setData('tax_condition', v)}
                        options={TAX_CONDITIONS}
                        error={errors.tax_condition}
                    />
                </Field>
            </div>

            {/* Contacto */}
            <div className="bg-white border border-[#D3D3D3] rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-[#2B2B2B]">Contacto</h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="Teléfono" error={errors.phone}>
                        <Input value={data.phone} onChange={e => setData('phone', e.target.value)} placeholder="+54 9 ..." />
                    </Field>
                    <Field label="Celular" error={errors.mobile}>
                        <Input value={data.mobile} onChange={e => setData('mobile', e.target.value)} placeholder="+54 9 ..." />
                    </Field>
                    <Field label="Email" error={errors.email}>
                        <Input type="email" value={data.email} onChange={e => setData('email', e.target.value)} placeholder="cliente@ejemplo.com" />
                    </Field>
                </div>
            </div>

            {/* Dirección */}
            <div className="bg-white border border-[#D3D3D3] rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-[#2B2B2B]">Dirección</h2>

                <Field label="Calle y número" error={errors.address}>
                    <Input value={data.address} onChange={e => setData('address', e.target.value)} placeholder="Dirección completa" />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="Ciudad" error={errors.city}>
                        <Input value={data.city} onChange={e => setData('city', e.target.value)} placeholder="Ciudad" />
                    </Field>
                    <Field label="Provincia" error={errors.province}>
                        <AppSelect
                            value={data.province}
                            onValueChange={v => setData('province', v)}
                            options={PROVINCES.map(p => ({ value: p, label: p }))}
                            placeholder="Seleccionar"
                            error={errors.province}
                        />
                    </Field>
                    <Field label="Código postal" error={errors.postal_code}>
                        <Input value={data.postal_code} onChange={e => setData('postal_code', e.target.value)} placeholder="CP" />
                    </Field>
                </div>
            </div>

            {/* Crédito y notas */}
            <div className="bg-white border border-[#D3D3D3] rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-[#2B2B2B]">Crédito y notas</h2>

                <Field label="Límite de crédito ($)" error={errors.credit_limit}>
                    <div className="relative w-48">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2B2B]/40 text-sm">$</span>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={data.credit_limit}
                            onChange={e => setData('credit_limit', e.target.value)}
                            className="pl-7"
                        />
                    </div>
                    <p className="text-xs text-[#2B2B2B]/40 mt-0.5">Dejá en 0 para sin límite de crédito.</p>
                </Field>

                <Field label="Notas" error={errors.notes}>
                    <textarea
                        value={data.notes}
                        onChange={e => setData('notes', e.target.value)}
                        rows={3}
                        placeholder="Observaciones…"
                        className="flex w-full rounded-md border border-[#D3D3D3] bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F58220]/30 focus:border-[#F58220] resize-none"
                    />
                </Field>

                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={data.is_active}
                        onChange={e => setData('is_active', e.target.checked)}
                        className="rounded border-[#D3D3D3] accent-[#F58220]"
                    />
                    <span className="text-sm text-[#2B2B2B]">Cliente activo</span>
                </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                )}
                <Button type="submit" disabled={processing}>
                    {processing ? 'Guardando…' : client?.id ? 'Actualizar cliente' : 'Crear cliente'}
                </Button>
            </div>
        </form>
    );
}
