<?php

namespace App\Services;

class RouteMatcher
{
    /**
     * Max allowed distance (meters) between a searched point and the nearest point on the route.
     */
    public const DEFAULT_THRESHOLD_METERS = 8000;

    /**
     * Try to match a search origin/destination against a trip's sampled route path.
     *
     * The route path is an ordered list of points sampled along the driver's route
     * (origin -> destination), each carrying the cumulative distance/duration from the
     * route's start: [{lat, lng, distance, duration}, ...].
     *
     * A match requires both the search origin and destination to lie within the threshold
     * distance of the route, AND the origin must occur *before* the destination along the
     * route (so the passenger's leg is a valid sub-segment of the driver's direction of travel).
     *
     * @param  array<int, array{lat: float, lng: float, distance: float, duration: float}>  $routePath
     * @return array{pickup: array, dropoff: array, leg_distance_meters: int, leg_duration_seconds: int}|null
     */
    public function match(
        array $routePath,
        float $searchOriginLat,
        float $searchOriginLng,
        float $searchDestLat,
        float $searchDestLng,
        int $thresholdMeters = self::DEFAULT_THRESHOLD_METERS
    ): ?array {
        if (count($routePath) < 2) {
            return null;
        }

        [$originIndex, $originDistance] = $this->nearestPoint($routePath, $searchOriginLat, $searchOriginLng);
        [$destIndex, $destDistance] = $this->nearestPoint($routePath, $searchDestLat, $searchDestLng);

        if ($originDistance > $thresholdMeters || $destDistance > $thresholdMeters) {
            return null;
        }

        if ($originIndex >= $destIndex) {
            return null;
        }

        $originPoint = $routePath[$originIndex];
        $destPoint = $routePath[$destIndex];

        return [
            'pickup' => $originPoint,
            'dropoff' => $destPoint,
            'leg_distance_meters' => (int) round($destPoint['distance'] - $originPoint['distance']),
            'leg_duration_seconds' => (int) round($destPoint['duration'] - $originPoint['duration']),
            'origin_offset_meters' => (int) round($originDistance),
            'destination_offset_meters' => (int) round($destDistance),
        ];
    }

    /**
     * @param  array<int, array{lat: float, lng: float}>  $routePath
     * @return array{0: int, 1: float} [nearestIndex, distanceMeters]
     */
    private function nearestPoint(array $routePath, float $lat, float $lng): array
    {
        $bestIndex = 0;
        $bestDistance = INF;

        foreach ($routePath as $index => $point) {
            $distance = $this->haversine($lat, $lng, (float) $point['lat'], (float) $point['lng']);

            if ($distance < $bestDistance) {
                $bestDistance = $distance;
                $bestIndex = $index;
            }
        }

        return [$bestIndex, $bestDistance];
    }

    private function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371000; // meters

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
