<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ComplaintResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'message' => $this->message,
            'created_at' => $this->created_at,
            'reporter' => new UserResource($this->whenLoaded('reporter')),
            'reported_user' => new UserResource($this->whenLoaded('reportedUser')),
            // Deliberately a compact summary rather than TripResource: the full
            // resource carries route_path, which is thousands of points per trip.
            'trip' => $this->whenLoaded('trip', fn () => $this->trip ? [
                'id' => $this->trip->id,
                'origin_address' => $this->trip->origin_address,
                'destination_address' => $this->trip->destination_address,
                'departure_date' => $this->trip->departure_date?->toDateString(),
                'departure_time' => substr((string) $this->trip->departure_time, 0, 5),
                'car_info' => $this->trip->car_info,
                'status' => $this->trip->status,
            ] : null),
        ];
    }
}
