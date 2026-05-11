<?php

namespace App\Http\Controllers\Products;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BrandController extends Controller
{
    public function index(): Response
    {
        $brands = Brand::orderBy('name')->get(['id', 'name', 'is_active']);

        return Inertia::render('Products/Brands', [
            'brands' => $brands,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name'      => ['required', 'string', 'max:100', 'unique:brands,name'],
            'is_active' => ['boolean'],
        ]);

        Brand::create([
            'name'      => $request->name,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return back()->with('success', 'Marca creada.');
    }

    public function update(Request $request, Brand $brand): RedirectResponse
    {
        $request->validate([
            'name'      => ['required', 'string', 'max:100', "unique:brands,name,{$brand->id}"],
            'is_active' => ['boolean'],
        ]);

        $brand->update([
            'name'      => $request->name,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return back()->with('success', 'Marca actualizada.');
    }

    public function destroy(Brand $brand): RedirectResponse
    {
        if ($brand->products()->exists()) {
            return back()->with('error', 'No se puede eliminar: tiene productos asociados.');
        }

        $brand->delete();

        return back()->with('success', 'Marca eliminada.');
    }
}
