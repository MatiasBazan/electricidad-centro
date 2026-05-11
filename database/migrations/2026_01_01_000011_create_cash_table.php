<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_registers', function (Blueprint $table) {
            $table->smallIncrements('id');
            $table->string('name', 80);
            $table->string('location', 100)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('cash_sessions', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('cash_register_id');
            $table->foreignId('user_id')->constrained();
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->decimal('opening_amount', 14, 2)->default(0);
            $table->decimal('closing_amount', 14, 2)->nullable();
            $table->decimal('expected_cash', 14, 2)->nullable();
            $table->decimal('difference', 14, 2)->nullable();
            $table->timestamp('opened_at');
            $table->timestamp('closed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->foreign('cash_register_id')->references('id')->on('cash_registers');
            $table->index('status');
            $table->index('user_id');
        });

        Schema::create('payment_methods', function (Blueprint $table) {
            $table->smallIncrements('id');
            $table->string('name', 80);
            $table->enum('type', [
                'efectivo', 'transferencia', 'tarjeta_debito',
                'tarjeta_credito', 'cheque', 'cuenta_corriente', 'qr',
            ]);
            $table->decimal('surcharge_pct', 5, 2)->default(0);
            $table->boolean('requires_auth')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('checks', function (Blueprint $table) {
            $table->id();
            $table->string('bank', 100);
            $table->string('branch', 100)->nullable();
            $table->string('number', 50);
            $table->decimal('amount', 14, 2);
            $table->date('check_date');
            $table->date('due_date');
            $table->enum('type', ['received', 'issued']);
            $table->enum('status', ['on_hand', 'deposited', 'cleared', 'bounced', 'returned', 'voided'])
                ->default('on_hand');
            $table->foreignId('client_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('supplier_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('supplier_id')->references('id')->on('suppliers')->nullOnDelete();
            $table->index('due_date');
            $table->index('status');
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cash_session_id')->constrained();
            $table->string('payable_type', 50);
            $table->unsignedBigInteger('payable_id');
            $table->unsignedSmallInteger('payment_method_id');
            $table->decimal('amount', 14, 2);
            $table->char('card_last_four', 4)->nullable();
            $table->string('card_brand', 30)->nullable();
            $table->unsignedTinyInteger('installments')->default(1);
            $table->foreignId('check_id')->nullable()->constrained()->nullOnDelete();
            $table->string('notes', 200)->nullable();
            $table->timestamp('created_at')->nullable();

            $table->foreign('payment_method_id')->references('id')->on('payment_methods');
            $table->index(['payable_type', 'payable_id']);
            $table->index('cash_session_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('checks');
        Schema::dropIfExists('payment_methods');
        Schema::dropIfExists('cash_sessions');
        Schema::dropIfExists('cash_registers');
    }
};
