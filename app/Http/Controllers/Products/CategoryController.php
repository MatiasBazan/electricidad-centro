<?php

namespace App\Http\Controllers\Products;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        $categories = Category::with(['children' => fn ($q) => $q->withCount('products')])
            ->withCount('products')
            ->whereNull('parent_id')
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($c) => [
                'id'             => $c->id,
                'name'           => $c->name,
                'rubro'          => $c->rubro,
                'products_count' => $c->products_count,
                'children'       => $c->children->map(fn ($ch) => [
                    'id'             => $ch->id,
                    'name'           => $ch->name,
                    'rubro'          => $ch->rubro,
                    'products_count' => $ch->products_count,
                ])->values(),
            ]);

        return Inertia::render('Products/Categories', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name'      => ['required', 'string', 'max:100'],
            'rubro'     => ['nullable', 'string', 'max:60'],
            'parent_id' => ['nullable', 'exists:categories,id'],
        ]);

        Category::create($request->only(['name', 'rubro', 'parent_id']));

        return back()->with('success', 'Categoría creada.');
    }

    public function update(Request $request, Category $category): RedirectResponse
    {
        $request->validate([
            'name'  => ['required', 'string', 'max:100'],
            'rubro' => ['nullable', 'string', 'max:60'],
        ]);

        $category->update($request->only(['name', 'rubro']));

        return back()->with('success', 'Categoría actualizada.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        if ($category->children()->exists() || $category->products()->exists()) {
            return back()->with('error', 'No se puede eliminar: tiene subcategorías o productos asociados.');
        }

        $category->delete();

        return back()->with('success', 'Categoría eliminada.');
    }
}
