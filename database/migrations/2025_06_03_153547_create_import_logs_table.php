<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('import_logs', function (Blueprint $table) {
            $table->id();
						$table->string('bestandscode')->nullable();
						$table->integer('week');
						$table->integer('jaar');
						$table->enum('status', ['geslaagd', 'gedeeltelijk', 'mislukt']);
						$table->integer('aantal_verwerkt')->default(0);
						$table->text('fouten')->nullable();
						$table->string('bestandstype');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('import_logs');
    }
};
