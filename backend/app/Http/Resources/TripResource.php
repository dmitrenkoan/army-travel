<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TripResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'driver' => new UserResource($this->whenLoaded('driver')),
            'military_unit' => new MilitaryUnitResource($this->whenLoaded('militaryUnit')),

            'origin_address' => $this->origin_address,
            'origin_lat' => (float) $this->origin_lat,
            'origin_lng' => (float) $this->origin_lng,
            'destination_address' => $this->destination_address,
            'destination_lat' => (float) $this->destination_lat,
            'destination_lng' => (float) $this->destination_lng,
            'waypoints' => $this->waypoints ?? [],
            'route_path' => $this->route_path,
            'distance_meters' => $this->distance_meters,
            'duration_seconds' => $this->duration_seconds,

            'departure_date' => $this->departure_date?->toDateString(),
            'departure_time' => substr((string) $this->departure_time, 0, 5),
            'has_return_trip' => $this->has_return_trip,
            'return_date' => $this->return_date?->toDateString(),
            'return_time' => $this->return_time ? substr((string) $this->return_time, 0, 5) : null,

            'seats_total' => $this->seats_total,
            'seats_available' => $this->seats_available,
            'car_info' => $this->car_info,
            'cargo_capacity' => $this->cargo_capacity,
            'route_adjustment' => $this->route_adjustment,
            'additional_contact' => $this->additional_contact,
            'notes' => $this->notes,

            'bookings_count' => $this->whenCounted('bookings'),
            'bookings' => TripBookingResource::collection($this->whenLoaded('bookings')),

            // Present only on search results: the matched sub-leg of this driver's route.
            'match' => $this->when(isset($this->match), fn () => $this->match),

            'created_at' => $this->created_at,
        ];
    }
}
