<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trip_bookings', function (Blueprint $table) {
            $table->dropUnique(['trip_id', 'passenger_id']);
            $table->index(['trip_id', 'passenger_id']);
        });
    }

    public function down(): void
    {
        Schema::table('trip_bookings', function (Blueprint $table) {
            $table->dropIndex(['trip_id', 'passenger_id']);
            $table->unique(['trip_id', 'passenger_id']);
        });
    }
};
