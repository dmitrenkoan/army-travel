<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ComplaintController;
use App\Http\Controllers\Api\ConfigController;
use App\Http\Controllers\Api\MilitaryUnitController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\TripBookingController;
use App\Http\Controllers\Api\TripController;
use App\Http\Controllers\Api\UserController;
use App\Models\User;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

// Public runtime config (e.g. Google Maps key) — see ConfigController for why
// this is intentionally unauthenticated.
Route::get('/config', [ConfigController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Military units — super admin manages units & unit admins.
    Route::get('/military-units', [MilitaryUnitController::class, 'index']);
    Route::middleware('role:'.User::ROLE_SUPER_ADMIN)->group(function () {
        Route::post('/military-units', [MilitaryUnitController::class, 'store']);
        Route::put('/military-units/{militaryUnit}', [MilitaryUnitController::class, 'update']);
        Route::delete('/military-units/{militaryUnit}', [MilitaryUnitController::class, 'destroy']);
    });

    // Users — super admin creates unit admins, unit admin creates users within their unit.
    Route::middleware('role:'.User::ROLE_SUPER_ADMIN.','.User::ROLE_UNIT_ADMIN)->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
    });

    // Trips.
    Route::get('/trips', [TripController::class, 'index']);
    Route::post('/trips', [TripController::class, 'store']);
    Route::get('/trips/mine', [TripController::class, 'mine']);
    Route::get('/trips/{trip}', [TripController::class, 'show']);
    Route::delete('/trips/{trip}', [TripController::class, 'destroy']);

    // Bookings.
    Route::post('/trips/{trip}/bookings', [TripBookingController::class, 'store']);
    Route::get('/bookings/mine', [TripBookingController::class, 'mine']);
    Route::get('/bookings/incoming', [TripBookingController::class, 'incoming']);
    Route::post('/bookings/{booking}/confirm', [TripBookingController::class, 'confirm']);
    Route::post('/bookings/{booking}/reject', [TripBookingController::class, 'reject']);
    Route::post('/bookings/{booking}/cancel', [TripBookingController::class, 'cancel']);

    // Complaints — anyone may file one, only the super admin reviews them.
    Route::post('/complaints', [ComplaintController::class, 'store']);
    Route::get('/complaints', [ComplaintController::class, 'index'])
        ->middleware('role:'.User::ROLE_SUPER_ADMIN);

    // Notifications.
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
});
