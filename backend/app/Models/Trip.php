<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id', 'military_unit_id',
    'origin_address', 'origin_lat', 'origin_lng',
    'destination_address', 'destination_lat', 'destination_lng',
    'route_path', 'distance_meters', 'duration_seconds',
    'departure_date', 'departure_time', 'has_return_trip', 'return_date', 'return_time',
    'seats_total', 'seats_available', 'car_info', 'route_adjustment',
    'additional_contact', 'notes', 'status',
])]
class Trip extends Model
{
    public const STATUS_ACTIVE = 'active';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_COMPLETED = 'completed';

    protected function casts(): array
    {
        return [
            'origin_lat' => 'decimal:7',
            'origin_lng' => 'decimal:7',
            'destination_lat' => 'decimal:7',
            'destination_lng' => 'decimal:7',
            'route_path' => 'array',
            'departure_date' => 'date',
            'return_date' => 'date',
            'has_return_trip' => 'boolean',
        ];
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function militaryUnit(): BelongsTo
    {
        return $this->belongsTo(MilitaryUnit::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(TripBooking::class);
    }
}
