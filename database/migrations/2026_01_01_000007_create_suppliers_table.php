<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('suppliers', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name', 150);
            $table->string('cuit', 13)->nullable()->unique();
            $table->string('address', 200)->nullable();
            $table->string('city', 100)->nullable();
            $table->string('province', 100)->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('email', 100)->nullable();
            $table->string('contact_name', 100)->nullable();
            $table->string('payment_terms', 100)->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('supplier_accounts', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('supplier_id')->unique();
            $table->decimal('balance', 14, 2)->default(0);
            $table->timestamp('updated_at')->nullable();

            $table->foreign('supplier_id')->references('id')->on('suppliers');
        });

        Schema::create('supplier_account_movements', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('supplier_account_id');
            $table->enum('type', ['debit', 'credit']);
            $table->decimal('amount', 14, 2);
            $table->string('description', 200)->nullable();
            $table->string('reference_type', 50)->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->foreign('supplier_account_id')->references('id')->on('supplier_accounts');
            $table->index('supplier_account_id');
            $table->index(['reference_type', 'reference_id']);
        });

        Schema::create('supplier_price_import_configs', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('supplier_id');
            $table->string('name', 100);
            $table->enum('file_type', ['excel', 'csv'])->default('excel');
            $table->unsignedTinyInteger('sheet_index')->default(0);
            $table->unsignedTinyInteger('header_row')->default(1);
            $table->unsignedTinyInteger('data_start_row')->default(2);
            $table->char('csv_delimiter', 1)->default(',');
            $table->string('csv_encoding', 20)->default('UTF-8');
            $table->json('column_mappings');
            $table->unsignedSmallInteger('price_list_id')->nullable();
            $table->decimal('markup_pct', 6, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('supplier_id')->references('id')->on('suppliers')->cascadeOnDelete();
            $table->foreign('price_list_id')->references('id')->on('price_lists')->nullOnDelete();
        });

        Schema::create('price_import_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('supplier_id');
            $table->unsignedInteger('config_id')->nullable();
            $table->foreignId('user_id')->constrained();
            $table->string('file_name', 255);
            $table->string('file_path', 500);
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->unsignedInteger('rows_total')->default(0);
            $table->unsignedInteger('rows_processed')->default(0);
            $table->unsignedInteger('rows_created')->default(0);
            $table->unsignedInteger('rows_updated')->default(0);
            $table->unsignedInteger('rows_skipped')->default(0);
            $table->unsignedInteger('rows_failed')->default(0);
            $table->json('error_details')->nullable();
            $table->timestamp('imported_at')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->foreign('supplier_id')->references('id')->on('suppliers');
            $table->foreign('config_id')->references('id')->on('supplier_price_import_configs')->nullOnDelete();
        });

        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('supplier_id');
            $table->foreignId('user_id')->constrained();
            $table->string('order_number', 30)->unique();
            $table->enum('status', ['draft', 'sent', 'partial', 'received', 'cancelled'])->default('draft');
            $table->date('order_date');
            $table->date('expected_date')->nullable();
            $table->text('notes')->nullable();
            $table->decimal('subtotal', 14, 2)->default(0);
            $table->decimal('tax_amount', 14, 2)->default(0);
            $table->decimal('total', 14, 2)->default(0);
            $table->timestamp('received_at')->nullable();
            $table->timestamps();

            $table->foreign('supplier_id')->references('id')->on('suppliers');
            $table->index('supplier_id');
            $table->index('status');
        });

        Schema::create('purchase_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_variant_id')->constrained();
            $table->decimal('quantity_ordered', 10, 2);
            $table->decimal('quantity_received', 10, 2)->default(0);
            $table->decimal('unit_price', 12, 2);
            $table->decimal('subtotal', 14, 2);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_order_items');
        Schema::dropIfExists('purchase_orders');
        Schema::dropIfExists('price_import_logs');
        Schema::dropIfExists('supplier_price_import_configs');
        Schema::dropIfExists('supplier_account_movements');
        Schema::dropIfExists('supplier_accounts');
        Schema::dropIfExists('suppliers');
    }
};
