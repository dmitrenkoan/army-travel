<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            // Free text on purpose (e.g. "200 кг або 3 м3") — drivers describe
            // free cargo space in whatever unit fits their vehicle.
            $table->string('cargo_capacity')->nullable()->after('seats_available');
        });
    }

    public function down(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            $table->dropColumn('cargo_capacity');
        });
    }
};
