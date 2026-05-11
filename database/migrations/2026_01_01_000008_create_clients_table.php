<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['consumidor_final', 'empresa'])->default('consumidor_final');
            $table->string('name', 150);
            $table->string('fantasy_name', 150)->nullable();
            $table->string('cuit_cuil', 13)->nullable()->unique();
            $table->enum('document_type', ['dni', 'cuit', 'cuil', 'pasaporte'])->default('dni');
            $table->string('document_number', 20)->nullable();
            $table->enum('tax_condition', [
                'consumidor_final', 'responsable_inscripto', 'monotributista', 'exento',
            ])->default('consumidor_final');
            $table->string('address', 200)->nullable();
            $table->string('city', 100)->nullable();
            $table->string('province', 100)->nullable();
            $table->string('postal_code', 10)->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('mobile', 30)->nullable();
            $table->string('email', 100)->nullable();
            $table->decimal('credit_limit', 14, 2)->default(0);
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('type');
            $table->fullText(['name', 'fantasy_name', 'document_number']);
        });

        Schema::create('client_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->unique()->constrained();
            $table->decimal('balance', 14, 2)->default(0);
            $table->timestamp('updated_at')->nullable();
        });

        Schema::create('client_account_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_account_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['debit', 'credit']);
            $table->decimal('amount', 14, 2);
            $table->string('description', 200)->nullable();
            $table->string('reference_type', 50)->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->date('due_date')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index('client_account_id');
            $table->index('due_date');
            $table->index(['reference_type', 'reference_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_account_movements');
        Schema::dropIfExists('client_accounts');
        Schema::dropIfExists('clients');
    }
};
