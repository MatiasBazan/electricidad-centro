<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('category_id');
            $table->unsignedSmallInteger('brand_id')->nullable();
            $table->string('code', 50)->unique();
            $table->string('barcode', 60)->nullable()->unique();
            $table->string('name', 200);
            $table->text('description')->nullable();
            $table->enum('type', ['simple', 'variant', 'bundle'])->default('simple');
            $table->string('unit', 20)->default('unidad');
            $table->decimal('min_stock', 10, 2)->default(0);
            $table->boolean('has_iva')->default(true);
            $table->decimal('iva_rate', 5, 2)->default(21.00);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('category_id')->references('id')->on('categories');
            $table->foreign('brand_id')->references('id')->on('brands')->nullOnDelete();
            $table->index('category_id');
            $table->fullText(['name', 'code']);
        });

        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('sku', 80)->unique();
            $table->string('barcode', 60)->nullable()->unique();
            $table->decimal('cost_price', 12, 2)->default(0);
            $table->decimal('sale_price', 12, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('product_id');
        });

        Schema::create('variant_attribute_values', function (Blueprint $table) {
            $table->foreignId('product_variant_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('product_attribute_value_id');
            $table->primary(['product_variant_id', 'product_attribute_value_id']);

            $table->foreign('product_attribute_value_id')
                ->references('id')->on('product_attribute_values');
        });

        Schema::create('stock', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_variant_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('warehouse_id');
            $table->decimal('quantity', 10, 2)->default(0);
            $table->decimal('reserved_quantity', 10, 2)->default(0);
            $table->timestamp('updated_at')->nullable();

            $table->foreign('warehouse_id')->references('id')->on('warehouses');
            $table->unique(['product_variant_id', 'warehouse_id']);
            $table->index('quantity');
        });

        Schema::create('product_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_variant_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('price_list_id');
            $table->decimal('price', 12, 2);
            $table->timestamp('updated_at')->nullable();

            $table->foreign('price_list_id')->references('id')->on('price_lists')->cascadeOnDelete();
            $table->unique(['product_variant_id', 'price_list_id']);
        });

        Schema::create('product_bundles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->unique()->constrained()->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('bundle_components', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bundle_id')->constrained('product_bundles')->cascadeOnDelete();
            $table->foreignId('product_variant_id')->constrained();
            $table->decimal('quantity', 10, 2)->default(1);

            $table->unique(['bundle_id', 'product_variant_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bundle_components');
        Schema::dropIfExists('product_bundles');
        Schema::dropIfExists('product_prices');
        Schema::dropIfExists('stock');
        Schema::dropIfExists('variant_attribute_values');
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('products');
    }
};
