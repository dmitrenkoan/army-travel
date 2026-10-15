<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trip_bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trip_id')->constrained('trips')->cascadeOnDelete();
            $table->foreignId('passenger_id')->constrained('users')->cascadeOnDelete();
            $table->string('status')->default('pending'); // pending | confirmed | rejected | cancelled
            $table->unsignedSmallInteger('seats_requested')->default(1);

            $table->string('pickup_address');
            $table->decimal('pickup_lat', 10, 7);
            $table->decimal('pickup_lng', 10, 7);
            $table->string('dropoff_address');
            $table->decimal('dropoff_lat', 10, 7);
            $table->decimal('dropoff_lng', 10, 7);
            $table->unsignedInteger('leg_duration_seconds')->nullable();
            $table->unsignedInteger('leg_distance_meters')->nullable();

            $table->text('rejection_reason')->nullable();
            $table->timestamps();

            $table->unique(['trip_id', 'passenger_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trip_bookings');
    }
};
