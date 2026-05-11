import { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Plus, Pencil, Trash2, ChevronRight,
    AlertCircle, CheckCircle, XCircle, FolderOpen,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppSelect from '@/components/ui/AppSelect';
import { cn } from '@/lib/utils';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogBody, DialogFooter,
} from '@/components/ui/dialog';

const RUBROS = ['Ferretería', 'Electricidad', 'Ropa de trabajo', 'Otros'];

const RUBRO_STYLES = {
    'Electricidad':    'bg-blue-50 text-blue-700',
    'Ferretería':      'bg-[#fef3e8] text-[#F58220]',
    'Ropa de trabajo': 'bg-emerald-50 text-emerald-700',
    'Otros':           'bg-gray-100 text-gray-600',
};

function RubroBadge({ rubro }) {
    if (!rubro) return null;
    return (
        <span className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium',
            RUBRO_STYLES[rubro] ?? 'bg-gray-100 text-gray-600'
        )}>
            {rubro}
        </span>
    );
}

function ProductCount({ count }) {
    if (!count && count !== 0) return null;
    return (
        <span className="text-[11px] text-[#2B2B2B]/35 tabular-nums">
            {count} {count === 1 ? 'producto' : 'productos'}
        </span>
    );
}

// ─── Form Modal ───────────────────────────────────────────────────────────────
function CategoryModal({ open, onClose, categories, editCategory = null, defaultParentId = null }) {
    const isEdit = !!editCategory;

    const [form, setForm] = useState({ name: '', rubro: '', parent_id: '' });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setForm({
                name:      editCategory?.name  ?? '',
                rubro:     editCategory?.rubro ?? '',
                parent_id: defaultParentId ? String(defaultParentId) : '',
            });
            setErrors({});
        }
    }, [open, editCategory?.id, defaultParentId]);

    function setField(key, val) {
        setForm(f => ({ ...f, [key]: val }));
        if (errors[key]) setErrors(e => { const n = { ...e }; delete n[key]; return n; });
    }

    function handleClose() {
        setSaving(false);
        onClose();
    }

    function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);

        const payload = {
            name:  form.name.trim(),
            rubro: form.rubro || null,
            ...(!isEdit && { parent_id: form.parent_id || null }),
        };

        const options = {
            preserveScroll: true,
            onError: errs  => { setErrors(errs); setSaving(false); },
            onSuccess: ()  => { setSaving(false); handleClose(); },
        };

        if (isEdit) {
            router.put(`/categorias/${editCategory.id}`, payload, options);
        } else {
            router.post('/categorias', payload, options);
        }
    }

    const parentOptions = categories
        .filter(c => !isEdit || c.id !== editCategory?.id)
        .map(c => ({ value: c.id, label: c.name }));

    const title = isEdit
        ? 'Editar categoría'
        : defaultParentId ? 'Nueva subcategoría' : 'Nueva categoría';

    return (
        <Dialog open={open} onOpenChange={v => !v && handleClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <DialogBody className="space-y-4">
                        <div>
                            <Label className="mb-1 block">Nombre *</Label>
                            <Input
                                value={form.name}
                                onChange={e => setField('name', e.target.value)}
                                placeholder="Ej: Cables"
                                autoFocus
                                className={errors.name ? 'border-red-400' : ''}
                            />
                            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <Label className="mb-1 block">Rubro</Label>
                            <AppSelect
                                value={form.rubro}
                                onValueChange={val => setField('rubro', val)}
                                options={RUBROS.map(r => ({ value: r, label: r }))}
                                placeholder="Sin rubro"
                            />
                        </div>

                        {!isEdit && (
                            <div>
                                <Label className="mb-1 block">Categoría padre</Label>
                                <AppSelect
                                    value={form.parent_id}
                                    onValueChange={val => setField('parent_id', val)}
                                    options={parentOptions}
                                    placeholder="Es categoría principal"
                                    className={defaultParentId ? 'opacity-60 pointer-events-none' : ''}
                                />
                                {!defaultParentId && (
                                    <p className="text-xs text-[#2B2B2B]/40 mt-1">
                                        Dejá vacío para crear una categoría de primer nivel.
                                    </p>
                                )}
                            </div>
                        )}
                    </DialogBody>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={handleClose} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={saving || !form.name.trim()}>
                            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ open, onClose, category }) {
    const [loading, setLoading] = useState(false);

    function handleDelete() {
        setLoading(true);
        router.delete(`/categorias/${category?.id}`, {
            preserveScroll: true,
            onSuccess: () => { setLoading(false); onClose(); },
            onError:   () => setLoading(false),
        });
    }

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Eliminar categoría</DialogTitle>
                </DialogHeader>
                <DialogBody>
                    <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl">
                        <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-red-700">
                            ¿Eliminar <strong>{category?.name}</strong>?
                            {category?.products_count > 0 && (
                                <span className="block mt-1 text-red-600">
                                    Tiene {category.products_count} {category.products_count === 1 ? 'producto asociado' : 'productos asociados'}.
                                </span>
                            )}
                        </p>
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
                    <Button
                        onClick={handleDelete}
                        disabled={loading}
                        className="bg-red-500 hover:bg-red-600 focus-visible:ring-red-500"
                    >
                        {loading ? 'Eliminando…' : 'Eliminar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CategoriesIndex({ categories }) {
    const { flash } = usePage().props;

    const [createOpen,      setCreateOpen]      = useState(false);
    const [defaultParentId, setDefaultParentId] = useState(null);
    const [editCategory,    setEditCategory]    = useState(null);
    const [deleteCategory,  setDeleteCategory]  = useState(null);

    function openCreate(parentId = null) {
        setDefaultParentId(parentId);
        setCreateOpen(true);
    }

    function closeCreate() {
        setCreateOpen(false);
        setDefaultParentId(null);
    }

    const totalSubcategories = categories.reduce((acc, c) => acc + c.children.length, 0);

    return (
        <AppLayout title="Categorías">
            <div className="space-y-5 max-w-3xl">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-[#2B2B2B]">Categorías</h1>
                        <p className="text-sm text-[#2B2B2B]/50 mt-0.5">
                            {categories.length} principales · {totalSubcategories} subcategorías
                        </p>
                    </div>
                    <Button onClick={() => openCreate()}>
                        <Plus size={15} />
                        Nueva categoría
                    </Button>
                </div>

                {/* Flash */}
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

                {/* Empty */}
                {categories.length === 0 && (
                    <div className="bg-white border border-[#D3D3D3] rounded-xl p-12 text-center">
                        <FolderOpen size={32} className="mx-auto mb-3 text-[#2B2B2B]/20" />
                        <p className="text-[#2B2B2B]/40 text-sm mb-4">No hay categorías todavía.</p>
                        <Button variant="outline" onClick={() => openCreate()}>
                            <Plus size={14} /> Crear la primera categoría
                        </Button>
                    </div>
                )}

                {/* List */}
                <div className="space-y-3">
                    {categories.map(cat => (
                        <div key={cat.id} className="bg-white border border-[#D3D3D3] rounded-xl overflow-hidden">

                            {/* Parent row */}
                            <div className="flex items-center gap-3 px-4 py-3 bg-[#F4F4F4]/60">
                                <ChevronRight size={14} className="text-[#2B2B2B]/30 shrink-0" />
                                <span className="font-semibold text-[#2B2B2B] flex-1 text-sm">{cat.name}</span>
                                <ProductCount count={cat.products_count} />
                                <RubroBadge rubro={cat.rubro} />
                                <div className="flex items-center gap-1 ml-1">
                                    <button
                                        onClick={() => setEditCategory(cat)}
                                        className="p-1.5 rounded-md hover:bg-[#F58220]/10 text-[#2B2B2B]/35 hover:text-[#F58220] transition-colors"
                                        title="Editar"
                                    >
                                        <Pencil size={13} />
                                    </button>
                                    <button
                                        onClick={() => setDeleteCategory(cat)}
                                        className="p-1.5 rounded-md hover:bg-red-50 text-[#2B2B2B]/35 hover:text-red-500 transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>

                            {/* Children */}
                            <div className="divide-y divide-[#D3D3D3]/40">
                                {cat.children.map(child => (
                                    <div key={child.id} className="flex items-center gap-3 px-4 py-2.5 pl-11">
                                        <span className="text-sm text-[#2B2B2B]/70 flex-1">{child.name}</span>
                                        <ProductCount count={child.products_count} />
                                        <RubroBadge rubro={child.rubro} />
                                        <div className="flex items-center gap-1 ml-1">
                                            <button
                                                onClick={() => setEditCategory(child)}
                                                className="p-1.5 rounded-md hover:bg-[#F58220]/10 text-[#2B2B2B]/35 hover:text-[#F58220] transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil size={13} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteCategory(child)}
                                                className="p-1.5 rounded-md hover:bg-red-50 text-[#2B2B2B]/35 hover:text-red-500 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {/* Add subcategory */}
                                <div className="px-4 py-2 pl-11">
                                    <button
                                        onClick={() => openCreate(cat.id)}
                                        className="flex items-center gap-1.5 text-xs text-[#2B2B2B]/30 hover:text-[#F58220] transition-colors py-0.5"
                                    >
                                        <Plus size={11} />
                                        Agregar subcategoría
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <CategoryModal
                open={createOpen}
                onClose={closeCreate}
                categories={categories}
                defaultParentId={defaultParentId}
            />
            <CategoryModal
                open={!!editCategory}
                onClose={() => setEditCategory(null)}
                categories={categories}
                editCategory={editCategory}
            />
            <DeleteModal
                open={!!deleteCategory}
                onClose={() => setDeleteCategory(null)}
                category={deleteCategory}
            />
        </AppLayout>
    );
}
