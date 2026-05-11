<?php

namespace App\Http\Controllers\Products;

use App\Http\Controllers\Controller;
use App\Http\Requests\Products\StoreProductRequest;
use App\Http\Requests\Products\UpdateProductRequest;
use App\Models\Brand;
use App\Models\BundleComponent;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductAttributeType;
use App\Models\ProductBundle;
use App\Models\ProductVariant;
use App\Models\PriceList;
use App\Models\Stock;
use App\Models\Warehouse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Product::with(['category', 'brand'])
            ->withCount('variants')
            ->withSum('variants as total_stock', DB::raw(
                '(SELECT COALESCE(SUM(quantity),0) FROM stock WHERE stock.product_variant_id = product_variants.id)'
            ));

        // Filters
        if ($request->search) {
            $query->where(fn ($q) => $q
                ->where('name', 'like', "%{$request->search}%")
                ->orWhere('code', 'like', "%{$request->search}%")
                ->orWhere('barcode', 'like', "%{$request->search}%")
            );
        }
        if ($request->category_id) {
            $query->where('category_id', $request->category_id);
        }
        if ($request->rubro) {
            $query->whereHas('category', fn ($q) => $q->where('rubro', $request->rubro));
        }
        if ($request->type) {
            $query->where('type', $request->type);
        }
        if ($request->stock_status === 'low') {
            $query->havingRaw('total_stock <= products.min_stock AND total_stock > 0');
        } elseif ($request->stock_status === 'out') {
            $query->havingRaw('total_stock = 0');
        }
        if ($request->active !== null) {
            $query->where('is_active', $request->boolean('active'));
        }

        $products = $query->orderBy('name')->paginate(25)->withQueryString()
            ->through(fn (Product $p) => [
                'id'             => $p->id,
                'code'           => $p->code,
                'name'           => $p->name,
                'category'       => $p->category?->name,
                'rubro'          => $p->category?->rubro,
                'brand'          => $p->brand?->name,
                'type'           => $p->type,
                'unit'           => $p->unit,
                'min_stock'      => (float) $p->min_stock,
                'total_stock'    => (float) ($p->total_stock ?? 0),
                'variants_count' => $p->variants_count,
                'is_active'      => $p->is_active,
                'sale_price'     => null, // se carga en show
                'stock_status'   => $this->stockStatus($p),
            ]);

        $stats = [
            'total'     => Product::count(),
            'active'    => Product::where('is_active', true)->count(),
            'low_stock' => $this->countLowStock(),
            'no_stock'  => $this->countNoStock(),
        ];

        return Inertia::render('Products/Index', [
            'products'   => $products,
            'stats'      => $stats,
            'categories' => Category::orderBy('name')->get(['id', 'name', 'rubro', 'parent_id']),
            'filters'    => $request->only(['search', 'category_id', 'rubro', 'type', 'stock_status']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Products/Create', $this->formData());
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            $product = Product::create($request->only([
                'name', 'code', 'barcode', 'category_id', 'brand_id',
                'type', 'unit', 'min_stock', 'has_iva', 'iva_rate', 'is_active', 'description',
            ]));

            $this->syncVariants($product, $request->variants ?? []);

            if ($product->type === 'bundle' && ! empty($request->bundle_components)) {
                $bundle = ProductBundle::create(['product_id' => $product->id]);
                foreach ($request->bundle_components as $comp) {
                    BundleComponent::create([
                        'bundle_id'          => $bundle->id,
                        'product_variant_id' => $comp['product_variant_id'],
                        'quantity'           => $comp['quantity'],
                    ]);
                }
            }
        });

        return redirect()->route('products.index')->with('success', 'Producto creado correctamente.');
    }

    public function show(Product $product): Response
    {
        $product->load([
            'category', 'brand',
            'variants.attributeValues.type',
            'variants.stockItems.warehouse',
            'bundle.components.variant.product',
        ]);

        $warehouses = Warehouse::where('is_active', true)->get(['id', 'name', 'code']);

        return Inertia::render('Products/Show', [
            'product'    => $this->serializeProduct($product),
            'warehouses' => $warehouses,
        ]);
    }

    public function edit(Product $product): Response
    {
        $product->load(['variants.attributeValues', 'bundle.components']);
        return Inertia::render('Products/Edit', array_merge(
            ['product' => $this->serializeProductForForm($product)],
            $this->formData()
        ));
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        DB::transaction(function () use ($request, $product) {
            $product->update($request->only([
                'name', 'code', 'barcode', 'category_id', 'brand_id',
                'unit', 'min_stock', 'has_iva', 'iva_rate', 'is_active', 'description',
            ]));

            $this->syncVariants($product, $request->variants ?? []);

            if ($product->type === 'bundle') {
                $bundle = $product->bundle ?? ProductBundle::create(['product_id' => $product->id]);
                $bundle->components()->delete();
                foreach ($request->bundle_components ?? [] as $comp) {
                    BundleComponent::create([
                        'bundle_id'          => $bundle->id,
                        'product_variant_id' => $comp['product_variant_id'],
                        'quantity'           => $comp['quantity'],
                    ]);
                }
            }
        });

        return redirect()->route('products.show', $product)->with('success', 'Producto actualizado.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $product->delete();
        return redirect()->route('products.index')->with('success', 'Producto eliminado.');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function syncVariants(Product $product, array $variants): void
    {
        $keepIds = [];

        foreach ($variants as $variantData) {
            $variantId = $variantData['id'] ?? null;

            $variant = $variantId
                ? ProductVariant::find($variantId)
                : new ProductVariant(['product_id' => $product->id]);

            $variant->fill([
                'sku'        => $variantData['sku'],
                'barcode'    => $variantData['barcode'] ?? null,
                'cost_price' => $variantData['cost_price'],
                'sale_price' => $variantData['sale_price'],
                'is_active'  => $variantData['is_active'] ?? true,
            ])->save();

            // Sync attribute values
            $variant->attributeValues()->sync($variantData['attribute_value_ids'] ?? []);

            // Create initial stock if new variant
            if (! $variantId && ! empty($variantData['stock'])) {
                foreach ($variantData['stock'] as $warehouseId => $qty) {
                    if ($qty > 0) {
                        Stock::updateOrCreate(
                            ['product_variant_id' => $variant->id, 'warehouse_id' => $warehouseId],
                            ['quantity' => $qty, 'updated_at' => now()]
                        );
                    }
                }
            }

            $keepIds[] = $variant->id;
        }

        // Soft-deactivate removed variants (don't hard-delete — history)
        $product->variants()
            ->whereNotIn('id', $keepIds)
            ->update(['is_active' => false]);
    }

    private function formData(): array
    {
        return [
            'categories'      => $this->categoriesTree(),
            'brands'          => Brand::orderBy('name')->where('is_active', true)->get(['id', 'name']),
            'attribute_types' => ProductAttributeType::with('values')->get()->map(fn ($t) => [
                'id'     => $t->id,
                'name'   => $t->name,
                'slug'   => $t->slug,
                'values' => $t->values->map(fn ($v) => ['id' => $v->id, 'value' => $v->value])->values(),
            ]),
            'warehouses'  => Warehouse::where('is_active', true)->get(['id', 'name', 'code']),
            'price_lists' => PriceList::all(['id', 'name', 'is_default']),
        ];
    }

    private function categoriesTree(): array
    {
        return Category::with('children')
            ->whereNull('parent_id')
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($c) => [
                'id'       => $c->id,
                'name'     => $c->name,
                'rubro'    => $c->rubro,
                'children' => $c->children->map(fn ($ch) => [
                    'id'    => $ch->id,
                    'name'  => $ch->name,
                    'rubro' => $ch->rubro,
                ])->values()->all(),
            ])
            ->all();
    }

    private function serializeProduct(Product $product): array
    {
        return [
            'id'          => $product->id,
            'code'        => $product->code,
            'barcode'     => $product->barcode,
            'name'        => $product->name,
            'description' => $product->description,
            'category'    => $product->category?->name,
            'rubro'       => $product->category?->rubro,
            'brand'       => $product->brand?->name,
            'type'        => $product->type,
            'unit'        => $product->unit,
            'min_stock'   => $product->min_stock,
            'has_iva'     => $product->has_iva,
            'iva_rate'    => $product->iva_rate,
            'is_active'   => $product->is_active,
            'variants'    => $product->variants->map(fn (ProductVariant $v) => [
                'id'              => $v->id,
                'sku'             => $v->sku,
                'barcode'         => $v->barcode,
                'cost_price'      => $v->cost_price,
                'sale_price'      => $v->sale_price,
                'is_active'       => $v->is_active,
                'attribute_values'=> $v->attributeValues->map(fn ($av) => [
                    'type'  => $av->type?->name,
                    'value' => $av->value,
                ])->values(),
                'stock' => $v->stockItems->map(fn ($s) => [
                    'warehouse_id'   => $s->warehouse_id,
                    'warehouse_name' => $s->warehouse?->name,
                    'quantity'       => $s->quantity,
                    'reserved'       => $s->reserved_quantity,
                    'available'      => $s->quantity - $s->reserved_quantity,
                ])->values(),
                'total_stock' => $v->stockItems->sum('quantity'),
            ])->values(),
        ];
    }

    private function serializeProductForForm(Product $product): array
    {
        return [
            'id'          => $product->id,
            'code'        => $product->code,
            'barcode'     => $product->barcode,
            'name'        => $product->name,
            'description' => $product->description,
            'category_id' => $product->category_id,
            'brand_id'    => $product->brand_id,
            'type'        => $product->type,
            'unit'        => $product->unit,
            'min_stock'   => $product->min_stock,
            'has_iva'     => $product->has_iva,
            'iva_rate'    => $product->iva_rate,
            'is_active'   => $product->is_active,
            'variants'    => $product->variants->map(fn (ProductVariant $v) => [
                'id'                  => $v->id,
                'sku'                 => $v->sku,
                'barcode'             => $v->barcode,
                'cost_price'          => $v->cost_price,
                'sale_price'          => $v->sale_price,
                'is_active'           => $v->is_active,
                'attribute_value_ids' => $v->attributeValues->pluck('id')->values()->all(),
            ])->values()->all(),
            'bundle_components' => $product->bundle?->components->map(fn ($c) => [
                'product_variant_id' => $c->product_variant_id,
                'quantity'           => $c->quantity,
            ])->values()->all() ?? [],
        ];
    }

    private function stockStatus(Product $product): string
    {
        $total = $product->total_stock ?? 0;
        if ($total <= 0) return 'out';
        if ($total <= $product->min_stock) return 'low';
        return 'ok';
    }

    private function countLowStock(): int
    {
        return Product::whereHas('variants', fn ($q) =>
            $q->whereHas('stockItems', fn ($sq) =>
                $sq->whereRaw('quantity > 0 AND quantity <= (SELECT min_stock FROM products WHERE products.id = product_variants.product_id)')
            )
        )->count();
    }

    private function countNoStock(): int
    {
        return Product::whereDoesntHave('variants', fn ($q) =>
            $q->whereHas('stockItems', fn ($sq) => $sq->where('quantity', '>', 0))
        )->count();
    }
}
