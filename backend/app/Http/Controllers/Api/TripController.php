<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TripResource;
use App\Models\Trip;
use App\Models\TripBooking;
use App\Services\RouteMatcher;
use Illuminate\Http\Request;

class TripController extends Controller
{
    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'origin_address' => ['required', 'string', 'max:255'],
            'origin_lat' => ['required', 'numeric', 'between:-90,90'],
            'origin_lng' => ['required', 'numeric', 'between:-180,180'],
            'destination_address' => ['required', 'string', 'max:255'],
            'destination_lat' => ['required', 'numeric', 'between:-90,90'],
            'destination_lng' => ['required', 'numeric', 'between:-180,180'],
            'route_path' => ['required', 'array', 'min:2'],
            'route_path.*.lat' => ['required', 'numeric'],
            'route_path.*.lng' => ['required', 'numeric'],
            'route_path.*.distance' => ['required', 'numeric'],
            'route_path.*.duration' => ['required', 'numeric'],
            'distance_meters' => ['required', 'integer', 'min:0'],
            'duration_seconds' => ['required', 'integer', 'min:0'],

            'departure_date' => ['required', 'date', 'after_or_equal:today'],
            'departure_time' => ['required', 'date_format:H:i'],
            'has_return_trip' => ['required', 'boolean'],
            'return_date' => ['nullable', 'required_if:has_return_trip,true', 'date', 'after_or_equal:departure_date'],
            'return_time' => ['nullable', 'required_if:has_return_trip,true', 'date_format:H:i'],
            'seats_total' => ['required', 'integer', 'min:1', 'max:20'],
            'car_info' => ['required', 'string', 'max:255'],
            'cargo_capacity' => ['nullable', 'string', 'max:255'],
            'route_adjustment' => ['nullable', 'string', 'max:255'],
            'additional_contact' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $data['user_id'] = $user->id;
        $data['military_unit_id'] = $user->military_unit_id;
        $data['seats_available'] = $data['seats_total'];
        $data['status'] = Trip::STATUS_ACTIVE;

        $trip = Trip::create($data);

        return new TripResource($trip->load(['driver.militaryUnit', 'militaryUnit']));
    }

    public function update(Request $request, Trip $trip)
    {
        $user = $request->user();

        if ($trip->user_id !== $user->id) {
            abort(403);
        }

        if ($trip->status !== Trip::STATUS_ACTIVE) {
            abort(422, 'Можна редагувати лише активні поїздки.');
        }

        $data = $request->validate([
            'origin_address' => ['required', 'string', 'max:255'],
            'origin_lat' => ['required', 'numeric', 'between:-90,90'],
            'origin_lng' => ['required', 'numeric', 'between:-180,180'],
            'destination_address' => ['required', 'string', 'max:255'],
            'destination_lat' => ['required', 'numeric', 'between:-90,90'],
            'destination_lng' => ['required', 'numeric', 'between:-180,180'],
            'route_path' => ['required', 'array', 'min:2'],
            'route_path.*.lat' => ['required', 'numeric'],
            'route_path.*.lng' => ['required', 'numeric'],
            'route_path.*.distance' => ['required', 'numeric'],
            'route_path.*.duration' => ['required', 'numeric'],
            'distance_meters' => ['required', 'integer', 'min:0'],
            'duration_seconds' => ['required', 'integer', 'min:0'],

            'departure_date' => ['required', 'date', 'after_or_equal:today'],
            'departure_time' => ['required', 'date_format:H:i'],
            'has_return_trip' => ['required', 'boolean'],
            'return_date' => ['nullable', 'required_if:has_return_trip,true', 'date', 'after_or_equal:departure_date'],
            'return_time' => ['nullable', 'required_if:has_return_trip,true', 'date_format:H:i'],
            'seats_total' => ['required', 'integer', 'min:1', 'max:20'],
            'car_info' => ['required', 'string', 'max:255'],
            'cargo_capacity' => ['nullable', 'string', 'max:255'],
            'route_adjustment' => ['nullable', 'string', 'max:255'],
            'additional_contact' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        // Keep already-confirmed seats booked: shifting seats_total only moves
        // the *available* count, it can never eat into seats riders already hold.
        $bookedSeats = $trip->seats_total - $trip->seats_available;

        if ($data['seats_total'] < $bookedSeats) {
            return response()->json([
                'message' => "Неможливо зменшити кількість місць менше вже підтверджених ({$bookedSeats}).",
                'errors' => ['seats_total' => ["Неможливо зменшити кількість місць менше вже підтверджених ({$bookedSeats})."]],
            ], 422);
        }

        $data['seats_available'] = $data['seats_total'] - $bookedSeats;

        $trip->update($data);

        return new TripResource($trip->load(['driver.militaryUnit', 'militaryUnit']));
    }

    public function index(Request $request, RouteMatcher $matcher)
    {
        $hasSearch = $request->filled('origin_lat') && $request->filled('destination_lat');

        $query = Trip::query()
            ->with(['driver.militaryUnit', 'militaryUnit'])
            ->where('status', Trip::STATUS_ACTIVE)
            ->where('seats_available', '>', 0)
            ->where('departure_date', '>=', now()->toDateString())
            ->orderBy('departure_date')
            ->orderBy('departure_time');

        if ($request->filled('date')) {
            $query->whereDate('departure_date', $request->date('date'));
        }

        if ($request->boolean('exclude_mine') && $request->user()) {
            $query->where('user_id', '!=', $request->user()->id);
        }

        $trips = $query->get();

        if (! $hasSearch) {
            return TripResource::collection($trips);
        }

        $request->validate([
            'origin_lat' => ['required', 'numeric', 'between:-90,90'],
            'origin_lng' => ['required', 'numeric', 'between:-180,180'],
            'destination_lat' => ['required', 'numeric', 'between:-90,90'],
            'destination_lng' => ['required', 'numeric', 'between:-180,180'],
        ]);

        $matches = [];

        foreach ($trips as $trip) {
            $result = $matcher->match(
                $trip->route_path,
                (float) $request->input('origin_lat'),
                (float) $request->input('origin_lng'),
                (float) $request->input('destination_lat'),
                (float) $request->input('destination_lng'),
            );

            if ($result === null) {
                continue;
            }

            $trip->match = $result;
            $matches[] = $trip;
        }

        usort($matches, fn ($a, $b) => $a->match['leg_duration_seconds'] <=> $b->match['leg_duration_seconds']);

        return TripResource::collection(collect($matches));
    }

    public function show(Trip $trip)
    {
        $trip->load(['driver.militaryUnit', 'militaryUnit', 'bookings.passenger']);

        return new TripResource($trip);
    }

    public function mine(Request $request)
    {
        $trips = Trip::query()
            ->where('user_id', $request->user()->id)
            ->withCount('bookings')
            ->with(['bookings' => fn ($q) => $q->whereIn('status', [
                TripBooking::STATUS_PENDING,
                TripBooking::STATUS_CONFIRMED,
                TripBooking::STATUS_REJECTED,
            ])->with('passenger')->latest()])
            ->latest('departure_date')
            ->get();

        return TripResource::collection($trips);
    }

    public function destroy(Request $request, Trip $trip)
    {
        if ($trip->user_id !== $request->user()->id) {
            abort(403);
        }

        $trip->update(['status' => Trip::STATUS_CANCELLED]);

        $trip->bookings()
            ->where('status', TripBooking::STATUS_PENDING)
            ->update([
                'status' => TripBooking::STATUS_REJECTED,
                'rejection_reason' => 'Поїздку скасовано водієм.',
            ]);

        return response()->json(['message' => 'Поїздку скасовано.']);
    }
}
