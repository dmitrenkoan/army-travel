<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('military_unit_id')->nullable()->constrained('military_units')->nullOnDelete();

            // Route (filled from the "Маршрут" tab, built on Google Maps)
            $table->string('origin_address');
            $table->decimal('origin_lat', 10, 7);
            $table->decimal('origin_lng', 10, 7);
            $table->string('destination_address');
            $table->decimal('destination_lat', 10, 7);
            $table->decimal('destination_lng', 10, 7);
            // Ordered list of sampled points along the route with cumulative distance/duration,
            // used to match intermediate pickup/dropoff points during search.
            $table->json('route_path');
            $table->unsignedInteger('distance_meters');
            $table->unsignedInteger('duration_seconds');

            // Data tab fields
            $table->date('departure_date');
            $table->time('departure_time');
            $table->boolean('has_return_trip')->default(false);
            $table->date('return_date')->nullable();
            $table->time('return_time')->nullable();
            $table->unsignedSmallInteger('seats_total');
            $table->unsignedSmallInteger('seats_available');
            $table->string('car_info'); // марка та номер
            $table->string('route_adjustment')->nullable(); // наприклад "+-2 години"
            $table->string('additional_contact')->nullable();
            $table->text('notes')->nullable();

            $table->string('status')->default('active'); // active | cancelled | completed
            $table->timestamps();

            $table->index(['departure_date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trips');
    }
};
