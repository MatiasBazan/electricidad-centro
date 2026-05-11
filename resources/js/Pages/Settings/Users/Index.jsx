import { useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader, DialogBody,
    DialogFooter, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import AppSelect from '@/components/ui/AppSelect';
import {
    UserPlus, Search, Pencil, Trash2,
    ShieldCheck, Store, AlertCircle,
} from 'lucide-react';

// ─── Form Modal ──────────────────────────────────────────────────────────────
function UserFormModal({ open, onClose, roles, user = null }) {
    const isEdit = !!user;

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name:      user?.name      ?? '',
        email:     user?.email     ?? '',
        role_id:   user?.role_id   ? String(user.role_id) : '',
        password:  '',
        is_active: user?.is_active ?? true,
    });

    function handleSubmit(e) {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => { reset(); onClose(); },
        };
        if (isEdit) {
            router.put(`/configuracion/usuarios/${user.id}`, data, options);
        } else {
            router.post('/configuracion/usuarios', data, options);
        }
    }

    function handleClose() {
        reset();
        onClose();
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? 'Modificá los datos del usuario.' : 'Completá el formulario para crear un usuario.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <DialogBody className="space-y-4">
                        {/* Nombre */}
                        <div>
                            <Label htmlFor="name" className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                                Nombre completo
                            </Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                placeholder="Juan García"
                                autoFocus
                            />
                            {errors.name && <FieldError message={errors.name} />}
                        </div>

                        {/* Email */}
                        <div>
                            <Label htmlFor="email" className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                                Correo electrónico
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={e => setData('email', e.target.value)}
                                placeholder="juan@electricidadcentro.com"
                            />
                            {errors.email && <FieldError message={errors.email} />}
                        </div>

                        {/* Rol */}
                        <div>
                            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                                Rol
                            </Label>
                            <AppSelect
                                value={data.role_id}
                                onValueChange={v => setData('role_id', v)}
                                options={roles.map(r => ({ value: String(r.id), label: r.name }))}
                                placeholder="Seleccionar rol..."
                                error={errors.role_id}
                            />
                            {errors.role_id && <FieldError message={errors.role_id} />}
                        </div>

                        {/* Contraseña */}
                        <div>
                            <Label htmlFor="password" className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                                {isEdit ? 'Nueva contraseña' : 'Contraseña'}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                placeholder={isEdit ? 'Dejá vacío para no cambiar' : 'Mínimo 8 caracteres'}
                            />
                            {errors.password && <FieldError message={errors.password} />}
                        </div>

                        {/* Estado */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div>
                                <p className="text-sm font-medium text-[#2B2B2B]">Usuario activo</p>
                                <p className="text-xs text-gray-400">Puede iniciar sesión en el sistema</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setData('is_active', !data.is_active)}
                                className={[
                                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
                                    data.is_active ? 'bg-[#F58220]' : 'bg-gray-200',
                                ].join(' ')}
                            >
                                <span className={[
                                    'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
                                    data.is_active ? 'translate-x-6' : 'translate-x-1',
                                ].join(' ')} />
                            </button>
                        </div>
                    </DialogBody>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose} disabled={processing}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ open, onClose, user }) {
    const [loading, setLoading] = useState(false);

    function handleDelete() {
        setLoading(true);
        router.delete(`/configuracion/usuarios/${user?.id}`, {
            preserveScroll: true,
            onSuccess: () => { setLoading(false); onClose(); },
            onError: () => setLoading(false),
        });
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Eliminar usuario</DialogTitle>
                    <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
                </DialogHeader>
                <DialogBody>
                    <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl">
                        <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-red-700">
                            ¿Estás seguro de que querés eliminar a <strong>{user?.name}</strong>?
                        </p>
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
                    <Button
                        onClick={handleDelete}
                        disabled={loading}
                        className="bg-red-500 hover:bg-red-600 focus-visible:ring-red-500"
                    >
                        {loading ? 'Eliminando...' : 'Eliminar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function FieldError({ message }) {
    return (
        <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
            <AlertCircle size={11} />
            {message}
        </p>
    );
}

// ─── Role Badge ───────────────────────────────────────────────────────────────
function RoleBadge({ slug, name }) {
    if (slug === 'admin') {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#fef3e8] text-[#F58220]">
                <ShieldCheck size={11} />
                {name}
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-[#2D4C73]">
            <Store size={11} />
            {name}
        </span>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function UsersIndex({ users, roles, filters }) {
    const { flash } = usePage().props;

    const [search, setSearch]         = useState(filters.search);
    const [createOpen, setCreateOpen] = useState(false);
    const [editUser, setEditUser]     = useState(null);
    const [deleteUser, setDeleteUser] = useState(null);

    function handleSearch(e) {
        setSearch(e.target.value);
        router.get('/configuracion/usuarios', { search: e.target.value }, {
            preserveState: true, replace: true,
        });
    }

    const filtered = search
        ? users.filter(u =>
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
          )
        : users;

    return (
        <AppLayout title="Usuarios">
            <Head title="Usuarios" />

            <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-[#2B2B2B]">Usuarios</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {users.length} {users.length === 1 ? 'usuario registrado' : 'usuarios registrados'}
                        </p>
                    </div>
                    <Button onClick={() => setCreateOpen(true)} className="gap-2">
                        <UserPlus size={16} />
                        Nuevo usuario
                    </Button>
                </div>

                {/* Flash */}
                {flash?.success && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                        <span>✓</span> {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        <AlertCircle size={14} /> {flash.error}
                    </div>
                )}

                {/* Tabla */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Toolbar */}
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                        <div className="relative flex-1 max-w-xs">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Buscar por nombre o email..."
                                value={search}
                                onChange={handleSearch}
                                className="pl-9 h-9 text-sm"
                            />
                        </div>
                        <span className="text-xs text-gray-400 ml-auto">
                            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Usuario
                                    </th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Rol
                                    </th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Creado
                                    </th>
                                    <th className="px-5 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-400">
                                            No se encontraron usuarios
                                        </td>
                                    </tr>
                                ) : filtered.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                                                    style={{ backgroundColor: user.role_slug === 'admin' ? '#F58220' : '#2D4C73' }}
                                                >
                                                    {user.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-[#2B2B2B]">
                                                        {user.name}
                                                        {user.is_self && (
                                                            <span className="ml-2 text-[10px] text-gray-400 font-normal">(vos)</span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-gray-400">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <RoleBadge slug={user.role_slug} name={user.role_name} />
                                        </td>
                                        <td className="px-5 py-4">
                                            {user.is_active ? (
                                                <Badge variant="success">Activo</Badge>
                                            ) : (
                                                <Badge variant="danger">Inactivo</Badge>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-gray-400 text-xs">{user.created_at}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => setEditUser(user)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-[#F58220] hover:bg-[#fef3e8] transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                {!user.is_self && (
                                                    <button
                                                        onClick={() => setDeleteUser(user)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <UserFormModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                roles={roles}
            />
            <UserFormModal
                open={!!editUser}
                onClose={() => setEditUser(null)}
                roles={roles}
                user={editUser}
            />
            <DeleteModal
                open={!!deleteUser}
                onClose={() => setDeleteUser(null)}
                user={deleteUser}
            />
        </AppLayout>
    );
}
