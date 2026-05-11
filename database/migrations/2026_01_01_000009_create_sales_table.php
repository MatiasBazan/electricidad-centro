<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quotations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained();
            $table->foreignId('user_id')->constrained();
            $table->string('number', 20)->unique();
            $table->enum('status', ['draft', 'sent', 'accepted', 'rejected', 'expired'])->default('draft');
            $table->date('date');
            $table->date('expiry_date')->nullable();
            $table->text('notes')->nullable();
            $table->decimal('subtotal', 14, 2)->default(0);
            $table->decimal('discount_pct', 5, 2)->default(0);
            $table->decimal('discount_amount', 14, 2)->default(0);
            $table->decimal('tax_amount', 14, 2)->default(0);
            $table->decimal('total', 14, 2)->default(0);
            $table->timestamps();

            $table->index('client_id');
            $table->index('status');
        });

        Schema::create('quotation_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quotation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_variant_id')->nullable()->constrained()->nullOnDelete();
            $table->string('description', 300);
            $table->decimal('quantity', 10, 2);
            $table->decimal('unit_price', 12, 2);
            $table->decimal('discount_pct', 5, 2)->default(0);
            $table->decimal('subtotal', 14, 2);
            $table->unsignedSmallInteger('sort_order')->default(0);
        });

        Schema::create('sales_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quotation_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('client_id')->constrained();
            $table->foreignId('user_id')->constrained();
            $table->unsignedSmallInteger('warehouse_id')->nullable();
            $table->string('number', 20)->unique();
            $table->enum('status', [
                'pending', 'processing', 'partial', 'delivered', 'invoiced', 'cancelled',
            ])->default('pending');
            $table->date('date');
            $table->enum('payment_type', ['contado', 'cuotas', 'cuenta_corriente'])->default('contado');
            $table->unsignedTinyInteger('installments')->default(1);
            $table->decimal('cash_discount_pct', 5, 2)->default(0);
            $table->text('notes')->nullable();
            $table->decimal('subtotal', 14, 2)->default(0);
            $table->decimal('discount_amount', 14, 2)->default(0);
            $table->decimal('tax_amount', 14, 2)->default(0);
            $table->decimal('total', 14, 2)->default(0);
            $table->timestamps();

            $table->foreign('warehouse_id')->references('id')->on('warehouses')->nullOnDelete();
            $table->index('client_id');
            $table->index('status');
            $table->index('date');
        });

        Schema::create('sales_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_variant_id')->nullable()->constrained()->nullOnDelete();
            $table->string('description', 300);
            $table->decimal('quantity', 10, 2);
            $table->decimal('quantity_delivered', 10, 2)->default(0);
            $table->decimal('unit_price', 12, 2);
            $table->decimal('discount_pct', 5, 2)->default(0);
            $table->decimal('subtotal', 14, 2);
            $table->unsignedSmallInteger('sort_order')->default(0);
        });

        Schema::create('delivery_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_order_id')->constrained();
            $table->foreignId('user_id')->constrained();
            $table->unsignedSmallInteger('warehouse_id');
            $table->string('number', 20)->unique();
            $table->enum('status', ['pending', 'dispatched', 'returned'])->default('pending');
            $table->date('date');
            $table->text('notes')->nullable();
            $table->timestamp('dispatched_at')->nullable();
            $table->timestamps();

            $table->foreign('warehouse_id')->references('id')->on('warehouses');
        });

        Schema::create('delivery_note_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('delivery_note_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sales_order_item_id')->constrained();
            $table->foreignId('product_variant_id')->constrained();
            $table->decimal('quantity', 10, 2);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_note_items');
        Schema::dropIfExists('delivery_notes');
        Schema::dropIfExists('sales_order_items');
        Schema::dropIfExists('sales_orders');
        Schema::dropIfExists('quotation_items');
        Schema::dropIfExists('quotations');
    }
};
