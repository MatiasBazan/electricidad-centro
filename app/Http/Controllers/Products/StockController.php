<?php

namespace App\Http\Controllers\Products;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Stock;
use App\Models\Warehouse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StockController extends Controller
{
    public function alerts(): Response
    {
        $products = Product::with(['category', 'variants.stockItems'])
            ->where('is_active', true)
            ->get()
            ->map(fn (Product $p) => [
                'id'          => $p->id,
                'code'        => $p->code,
                'name'        => $p->name,
                'category'    => $p->category?->name,
                'min_stock'   => (float) $p->min_stock,
                'total_stock' => (float) $p->variants->sum(fn ($v) => $v->stockItems->sum('quantity')),
            ])
            ->filter(fn ($p) => $p['total_stock'] <= $p['min_stock'])
            ->sortBy('total_stock')
            ->values();

        return Inertia::render('Products/StockAlerts', [
            'products' => $products,
        ]);
    }

    public function adjust(Request $request): RedirectResponse
    {
        $request->validate([
            'product_variant_id' => ['required', 'exists:product_variants,id'],
            'warehouse_id'       => ['required', 'exists:warehouses,id'],
            'quantity'           => ['required', 'numeric'],
            'reason'             => ['nullable', 'string', 'max:200'],
        ]);

        $stock = Stock::firstOrNew([
            'product_variant_id' => $request->product_variant_id,
            'warehouse_id'       => $request->warehouse_id,
        ]);

        $stock->quantity   = max(0, (float) $request->quantity);
        $stock->updated_at = now();
        $stock->save();

        return back()->with('success', 'Stock actualizado correctamente.');
    }
}
