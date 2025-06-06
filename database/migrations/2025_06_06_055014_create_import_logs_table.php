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
            $table->string('bestandsnaam');
            $table->enum('status', ['success', 'error', 'warning']);
            $table->text('bericht');
            $table->integer('aantal_records')->default(0);
            $table->integer('aantal_nieuwe_studenten')->default(0);
            $table->integer('aantal_updates')->default(0);
            $table->timestamp('geimporteerd_op');
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
