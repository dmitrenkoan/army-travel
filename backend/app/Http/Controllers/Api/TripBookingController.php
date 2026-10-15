<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TripBookingResource;
use App\Models\Trip;
use App\Models\TripBooking;
use App\Notifications\BookingConfirmed;
use App\Notifications\BookingRejected;
use App\Notifications\BookingRequested;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TripBookingController extends Controller
{
    public function store(Request $request, Trip $trip)
    {
        $user = $request->user();

        if ($trip->user_id === $user->id) {
            abort(422, 'Ви не можете забронювати місце у власній поїздці.');
        }

        if ($trip->status !== Trip::STATUS_ACTIVE || $trip->seats_available < 1) {
            abort(422, 'У цій поїздці більше немає вільних місць.');
        }

        if ($trip->bookings()->where('passenger_id', $user->id)->whereIn('status', [TripBooking::STATUS_PENDING, TripBooking::STATUS_CONFIRMED])->exists()) {
            abort(422, 'Ви вже подали заявку на цю поїздку.');
        }

        $data = $request->validate([
            'pickup_address' => ['required', 'string', 'max:255'],
            'pickup_lat' => ['required', 'numeric', 'between:-90,90'],
            'pickup_lng' => ['required', 'numeric', 'between:-180,180'],
            'dropoff_address' => ['required', 'string', 'max:255'],
            'dropoff_lat' => ['required', 'numeric', 'between:-90,90'],
            'dropoff_lng' => ['required', 'numeric', 'between:-180,180'],
            'leg_duration_seconds' => ['nullable', 'integer', 'min:0'],
            'leg_distance_meters' => ['nullable', 'integer', 'min:0'],
            'seats_requested' => ['nullable', 'integer', 'min:1', 'max:20'],
        ]);

        $data['trip_id'] = $trip->id;
        $data['passenger_id'] = $user->id;
        $data['seats_requested'] = $data['seats_requested'] ?? 1;
        $data['status'] = TripBooking::STATUS_PENDING;

        $booking = TripBooking::create($data);

        $trip->driver->notify(new BookingRequested($booking));

        return new TripBookingResource($booking->load(['trip.driver', 'passenger']));
    }

    public function mine(Request $request)
    {
        $bookings = TripBooking::query()
            ->where('passenger_id', $request->user()->id)
            ->with(['trip.driver.militaryUnit', 'trip.militaryUnit'])
            ->latest()
            ->get();

        return TripBookingResource::collection($bookings);
    }

    public function incoming(Request $request)
    {
        $query = TripBooking::query()
            ->whereHas('trip', fn ($q) => $q->where('user_id', $request->user()->id))
            ->with(['trip', 'passenger.militaryUnit'])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return TripBookingResource::collection($query->get());
    }

    public function confirm(Request $request, TripBooking $booking)
    {
        $booking->load('trip');

        if ($booking->trip->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($booking->status !== TripBooking::STATUS_PENDING) {
            abort(422, 'Цю заявку вже опрацьовано.');
        }

        if ($booking->trip->seats_available < $booking->seats_requested) {
            abort(422, 'Недостатньо вільних місць для підтвердження заявки.');
        }

        DB::transaction(function () use ($booking) {
            $booking->update(['status' => TripBooking::STATUS_CONFIRMED]);
            $booking->trip->decrement('seats_available', $booking->seats_requested);
        });

        $booking->passenger->notify(new BookingConfirmed($booking));

        return new TripBookingResource($booking->fresh(['trip.driver', 'passenger']));
    }

    public function reject(Request $request, TripBooking $booking)
    {
        $booking->load('trip');

        if ($booking->trip->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($booking->status !== TripBooking::STATUS_PENDING) {
            abort(422, 'Цю заявку вже опрацьовано.');
        }

        $data = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:1000'],
        ]);

        $booking->update([
            'status' => TripBooking::STATUS_REJECTED,
            'rejection_reason' => $data['rejection_reason'],
        ]);

        $booking->passenger->notify(new BookingRejected($booking));

        return new TripBookingResource($booking->fresh(['trip.driver', 'passenger']));
    }

    public function cancel(Request $request, TripBooking $booking)
    {
        if ($booking->passenger_id !== $request->user()->id) {
            abort(403);
        }

        if (! in_array($booking->status, [TripBooking::STATUS_PENDING, TripBooking::STATUS_CONFIRMED], true)) {
            abort(422, 'Цю заявку вже неможливо скасувати.');
        }

        DB::transaction(function () use ($booking) {
            if ($booking->status === TripBooking::STATUS_CONFIRMED) {
                $booking->trip()->increment('seats_available', $booking->seats_requested);
            }

            $booking->update(['status' => TripBooking::STATUS_CANCELLED]);
        });

        return new TripBookingResource($booking->fresh());
    }
}
