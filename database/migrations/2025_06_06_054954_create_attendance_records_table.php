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
        Schema::create('attendance_records', function (Blueprint $table) {
            $table->id();
            $table->string('studentnummer');
            $table->foreign('studentnummer')->references('studentnummer')->on('students');
            $table->integer('aanwezigheid'); 
            $table->integer('rooster');
            $table->integer('week');
            $table->integer('jaar');
            $table->string('bron_bestand'); 
            $table->timestamp('geimporteerd_op');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_records');
    }
};
