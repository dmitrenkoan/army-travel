<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TripBookingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'seats_requested' => $this->seats_requested,
            'pickup_address' => $this->pickup_address,
            'pickup_lat' => (float) $this->pickup_lat,
            'pickup_lng' => (float) $this->pickup_lng,
            'dropoff_address' => $this->dropoff_address,
            'dropoff_lat' => (float) $this->dropoff_lat,
            'dropoff_lng' => (float) $this->dropoff_lng,
            'leg_duration_seconds' => $this->leg_duration_seconds,
            'leg_distance_meters' => $this->leg_distance_meters,
            'rejection_reason' => $this->rejection_reason,
            'passenger' => new UserResource($this->whenLoaded('passenger')),
            'trip' => new TripResource($this->whenLoaded('trip')),
            'created_at' => $this->created_at,
        ];
    }
}
