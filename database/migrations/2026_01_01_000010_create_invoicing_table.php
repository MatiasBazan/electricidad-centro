<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('afip_pos', function (Blueprint $table) {
            $table->tinyIncrements('id');
            $table->unsignedSmallInteger('number')->unique();
            $table->string('name', 80);
            $table->string('type', 50)->default('REC');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained();
            $table->foreignId('user_id')->constrained();
            $table->foreignId('sales_order_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedTinyInteger('afip_pos_id');
            $table->enum('invoice_type', ['A', 'B', 'C', 'E', 'MiPyME_A', 'MiPyME_B']);
            $table->unsignedSmallInteger('cbte_tipo');
            $table->unsignedInteger('number');
            $table->string('cae', 14)->nullable();
            $table->date('cae_expiry')->nullable();
            $table->date('date');
            $table->string('cuit_sender', 13);
            $table->string('tax_condition_sender', 50);
            $table->string('cuit_receiver', 13)->nullable();
            $table->string('tax_condition_receiver', 50);
            $table->decimal('net_taxed', 14, 2)->default(0);
            $table->decimal('net_untaxed', 14, 2)->default(0);
            $table->decimal('net_exempt', 14, 2)->default(0);
            $table->decimal('iva_amount', 14, 2)->default(0);
            $table->decimal('other_taxes', 14, 2)->default(0);
            $table->decimal('total', 14, 2)->default(0);
            $table->enum('status', ['draft', 'pending', 'approved', 'rejected', 'cancelled'])->default('draft');
            $table->json('afip_result')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('afip_pos_id')->references('id')->on('afip_pos');
            $table->unique(['afip_pos_id', 'cbte_tipo', 'number']);
            $table->index('client_id');
            $table->index('date');
            $table->index('cae');
        });

        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->string('description', 300);
            $table->decimal('quantity', 10, 2);
            $table->decimal('unit_price', 12, 2);
            $table->decimal('iva_rate', 5, 2)->default(21.00);
            $table->decimal('iva_amount', 12, 2)->default(0);
            $table->decimal('subtotal', 14, 2);
            $table->decimal('total', 14, 2);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('afip_pos');
    }
};
