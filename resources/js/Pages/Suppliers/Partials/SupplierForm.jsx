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

function Field({ label, error, children }) {
    return (
        <div className="space-y-1">
            <Label className="text-xs font-medium text-[#2B2B2B]/70">{label}</Label>
            {children}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

export default function SupplierForm({ supplier = null, onCancel }) {
    const defaults = {
        name: '', cuit: '', address: '', city: '', province: '',
        phone: '', email: '', contact_name: '', payment_terms: '', notes: '',
        is_active: true,
        ...supplier,
    };

    const { data, setData, post, put, processing, errors } = useForm(defaults);

    function submit(e) {
        e.preventDefault();
        if (supplier?.id) {
            put(`/proveedores/${supplier.id}`);
        } else {
            post('/proveedores');
        }
    }

    return (
        <form onSubmit={submit} className="space-y-6">
            {/* Datos básicos */}
            <div className="bg-white border border-[#D3D3D3] rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-[#2B2B2B]">Datos del proveedor</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Razón social *" error={errors.name}>
                        <Input
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            placeholder="Nombre o razón social"
                        />
                    </Field>
                    <Field label="CUIT" error={errors.cuit}>
                        <Input
                            value={data.cuit}
                            onChange={e => setData('cuit', e.target.value)}
                            placeholder="XX-XXXXXXXX-X"
                            maxLength={13}
                        />
                    </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                        <Field label="Dirección" error={errors.address}>
                            <Input
                                value={data.address}
                                onChange={e => setData('address', e.target.value)}
                                placeholder="Calle y número"
                            />
                        </Field>
                    </div>
                    <Field label="Ciudad" error={errors.city}>
                        <Input
                            value={data.city}
                            onChange={e => setData('city', e.target.value)}
                            placeholder="Ciudad"
                        />
                    </Field>
                </div>

                <Field label="Provincia" error={errors.province}>
                    <AppSelect
                        value={data.province}
                        onValueChange={v => setData('province', v)}
                        options={PROVINCES.map(p => ({ value: p, label: p }))}
                        placeholder="Seleccionar provincia"
                        error={errors.province}
                    />
                </Field>
            </div>

            {/* Contacto */}
            <div className="bg-white border border-[#D3D3D3] rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-[#2B2B2B]">Contacto</h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="Nombre de contacto" error={errors.contact_name}>
                        <Input
                            value={data.contact_name}
                            onChange={e => setData('contact_name', e.target.value)}
                            placeholder="Nombre y apellido"
                        />
                    </Field>
                    <Field label="Teléfono" error={errors.phone}>
                        <Input
                            value={data.phone}
                            onChange={e => setData('phone', e.target.value)}
                            placeholder="+54 9 ..."
                        />
                    </Field>
                    <Field label="Email" error={errors.email}>
                        <Input
                            type="email"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            placeholder="proveedor@ejemplo.com"
                        />
                    </Field>
                </div>
            </div>

            {/* Condiciones */}
            <div className="bg-white border border-[#D3D3D3] rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-[#2B2B2B]">Condiciones y notas</h2>

                <Field label="Condiciones de pago" error={errors.payment_terms}>
                    <Input
                        value={data.payment_terms}
                        onChange={e => setData('payment_terms', e.target.value)}
                        placeholder="Ej: 30 días, Contado, etc."
                    />
                </Field>

                <Field label="Notas" error={errors.notes}>
                    <textarea
                        value={data.notes}
                        onChange={e => setData('notes', e.target.value)}
                        rows={3}
                        placeholder="Observaciones adicionales…"
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
                    <span className="text-sm text-[#2B2B2B]">Proveedor activo</span>
                </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancelar
                    </Button>
                )}
                <Button type="submit" disabled={processing}>
                    {processing ? 'Guardando…' : supplier?.id ? 'Actualizar proveedor' : 'Crear proveedor'}
                </Button>
            </div>
        </form>
    );
}
