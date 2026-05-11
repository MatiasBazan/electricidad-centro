<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Cash\CashController;
use App\Http\Controllers\Products\CategoryController;
use App\Http\Controllers\Products\BrandController;
use App\Http\Controllers\Products\ProductController;
use App\Http\Controllers\Products\StockController;
use App\Http\Controllers\Settings\UserController;
use App\Http\Controllers\Clients\ClientController;
use App\Http\Controllers\Sales\QuotationController;
use App\Http\Controllers\Sales\SalesOrderController;
use App\Http\Controllers\Suppliers\SupplierController;
use App\Http\Controllers\Suppliers\PurchaseOrderController;
use App\Http\Controllers\Suppliers\PriceImportController;
use App\Http\Controllers\Reports\ReportController;
use App\Http\Controllers\Invoicing\InvoiceController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Rutas públicas
Route::middleware('guest')->group(function () {
    Route::get('/',       [AuthController::class, 'showLogin'])->name('home');
    Route::get('/login',  [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
});

Route::post('/logout', [AuthController::class, 'logout'])
    ->name('logout')
    ->middleware('auth');

// Rutas protegidas
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', fn () => Inertia::render('Dashboard'))->name('dashboard');

    // Productos
    Route::prefix('productos')->name('products.')->group(function () {
        // Rutas estáticas primero (antes del wildcard {product})
        Route::get('/',               [ProductController::class, 'index'])->name('index');
        Route::get('/crear',          [ProductController::class, 'create'])->name('create');
        Route::post('/',              [ProductController::class, 'store'])->name('store');
        Route::get('/alertas/stock',  [StockController::class, 'alerts'])->name('stock.alerts');
        Route::post('/stock/ajustar', [StockController::class, 'adjust'])->name('stock.adjust');
        // Wildcard
        Route::get('/{product}',         [ProductController::class, 'show'])->name('show');
        Route::get('/{product}/editar',  [ProductController::class, 'edit'])->name('edit');
        Route::put('/{product}',         [ProductController::class, 'update'])->name('update');
        Route::delete('/{product}',      [ProductController::class, 'destroy'])->name('destroy');
    });

    // Categorías & Marcas (selects/typeahead)
    Route::prefix('categorias')->name('categories.')->group(function () {
        Route::get('/',           [CategoryController::class, 'index'])->name('index');
        Route::post('/',          [CategoryController::class, 'store'])->name('store');
        Route::put('/{category}', [CategoryController::class, 'update'])->name('update');
        Route::delete('/{category}', [CategoryController::class, 'destroy'])->name('destroy');
    });
    Route::prefix('marcas')->name('brands.')->group(function () {
        Route::get('/',        [BrandController::class, 'index'])->name('index');
        Route::post('/',       [BrandController::class, 'store'])->name('store');
        Route::put('/{brand}', [BrandController::class, 'update'])->name('update');
        Route::delete('/{brand}', [BrandController::class, 'destroy'])->name('destroy');
    });

    // Presupuestos
    Route::prefix('presupuestos')->name('quotations.')->group(function () {
        Route::get('/',                            [QuotationController::class, 'index'])->name('index');
        Route::get('/crear',                       [QuotationController::class, 'create'])->name('create');
        Route::post('/',                           [QuotationController::class, 'store'])->name('store');
        Route::get('/{quotation}',                 [QuotationController::class, 'show'])->name('show');
        Route::patch('/{quotation}/estado',        [QuotationController::class, 'updateStatus'])->name('status');
        Route::post('/{quotation}/convertir',      [QuotationController::class, 'convert'])->name('convert');
    });

    // Ventas
    Route::prefix('ventas')->name('sales-orders.')->group(function () {
        Route::get('/',                            [SalesOrderController::class, 'index'])->name('index');
        Route::get('/crear',                       [SalesOrderController::class, 'create'])->name('create');
        Route::post('/',                           [SalesOrderController::class, 'store'])->name('store');
        Route::get('/{salesOrder}',                [SalesOrderController::class, 'show'])->name('show');
        Route::post('/{salesOrder}/entregar',      [SalesOrderController::class, 'dispatch'])->name('dispatch');
        Route::post('/{salesOrder}/cancelar',      [SalesOrderController::class, 'cancel'])->name('cancel');
    });

    // Clientes
    Route::prefix('clientes')->name('clients.')->group(function () {
        Route::get('/',                        [ClientController::class, 'index'])->name('index');
        Route::get('/crear',                   [ClientController::class, 'create'])->name('create');
        Route::post('/',                       [ClientController::class, 'store'])->name('store');
        Route::get('/{client}',                [ClientController::class, 'show'])->name('show');
        Route::get('/{client}/editar',         [ClientController::class, 'edit'])->name('edit');
        Route::put('/{client}',                [ClientController::class, 'update'])->name('update');
        Route::delete('/{client}',             [ClientController::class, 'destroy'])->name('destroy');
        Route::post('/{client}/movimiento',    [ClientController::class, 'addMovement'])->name('movement');
    });

    // Proveedores
    Route::prefix('proveedores')->name('suppliers.')->group(function () {
        Route::get('/',                              [SupplierController::class, 'index'])->name('index');
        Route::get('/crear',                         [SupplierController::class, 'create'])->name('create');
        Route::post('/',                             [SupplierController::class, 'store'])->name('store');
        Route::get('/{supplier}',                    [SupplierController::class, 'show'])->name('show');
        Route::get('/{supplier}/editar',             [SupplierController::class, 'edit'])->name('edit');
        Route::put('/{supplier}',                    [SupplierController::class, 'update'])->name('update');
        Route::delete('/{supplier}',                 [SupplierController::class, 'destroy'])->name('destroy');
        Route::post('/{supplier}/movimiento',        [SupplierController::class, 'addMovement'])->name('movement');
    });

    // Órdenes de compra
    Route::prefix('compras')->name('purchase-orders.')->group(function () {
        Route::get('/',                              [PurchaseOrderController::class, 'index'])->name('index');
        Route::get('/crear',                         [PurchaseOrderController::class, 'create'])->name('create');
        Route::post('/',                             [PurchaseOrderController::class, 'store'])->name('store');
        Route::get('/{purchaseOrder}',               [PurchaseOrderController::class, 'show'])->name('show');
        Route::post('/{purchaseOrder}/recepcionar',  [PurchaseOrderController::class, 'receive'])->name('receive');
        Route::patch('/{purchaseOrder}/estado',      [PurchaseOrderController::class, 'updateStatus'])->name('status');
    });

    // Importación de precios
    Route::prefix('importacion')->name('imports.')->group(function () {
        Route::get('/',                               [PriceImportController::class, 'index'])->name('index');
        Route::post('/configs',                       [PriceImportController::class, 'storeConfig'])->name('configs.store');
        Route::put('/configs/{config}',               [PriceImportController::class, 'updateConfig'])->name('configs.update');
        Route::delete('/configs/{config}',            [PriceImportController::class, 'destroyConfig'])->name('configs.destroy');
        Route::post('/configs/{config}/importar',     [PriceImportController::class, 'upload'])->name('upload');
        Route::get('/logs/{log}',                     [PriceImportController::class, 'showLog'])->name('logs.show');
    });

    // Caja
    Route::prefix('caja')->name('cash.')->group(function () {
        Route::get('/',                              [CashController::class, 'index'])->name('index');
        Route::post('/abrir',                        [CashController::class, 'open'])->name('open');
        Route::post('/{session}/cerrar',             [CashController::class, 'close'])->name('close');
        Route::post('/{session}/movimiento',         [CashController::class, 'addMovement'])->name('movement');
        Route::get('/{session}',                     [CashController::class, 'show'])->name('show');
    });

    // Facturación AFIP
    Route::prefix('facturacion')->name('invoices.')->group(function () {
        Route::get('/',                       [InvoiceController::class, 'index'])->name('index');
        Route::get('/crear',                  [InvoiceController::class, 'create'])->name('create');
        Route::post('/',                      [InvoiceController::class, 'store'])->name('store');
        Route::get('/{invoice}',              [InvoiceController::class, 'show'])->name('show');
        Route::get('/{invoice}/pdf',          [InvoiceController::class, 'pdf'])->name('pdf');
        Route::post('/{invoice}/anular',      [InvoiceController::class, 'cancel'])->name('cancel');
    });

    // Reportes
    Route::prefix('reportes')->name('reports.')->group(function () {
        Route::get('/',              [ReportController::class, 'index'])->name('index');
        Route::get('/{type}/exportar', [ReportController::class, 'export'])->name('export');
    });

    // Configuración — solo admin
    Route::prefix('configuracion')->name('settings.')->middleware('role:admin')->group(function () {
        Route::get('/usuarios',                   [UserController::class, 'index'])->name('users.index');
        Route::post('/usuarios',                  [UserController::class, 'store'])->name('users.store');
        Route::put('/usuarios/{user}',            [UserController::class, 'update'])->name('users.update');
        Route::delete('/usuarios/{user}',         [UserController::class, 'destroy'])->name('users.destroy');
    });
});
