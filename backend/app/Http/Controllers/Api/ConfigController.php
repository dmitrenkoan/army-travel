<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

class ConfigController extends Controller
{
    /**
     * Public runtime config for the frontend. Deliberately unauthenticated:
     * a Google Maps JS key is visible in the browser network tab regardless
     * of how it's delivered, so there's no access-control benefit to gating
     * this behind a login. Read from the server's real environment at
     * request time, so it works even on hosts that only let you set env
     * vars at runtime (not at the frontend's build step).
     */
    public function index()
    {
        return response()->json([
            'google_maps_api_key' => config('services.google_maps.key', ''),
        ]);
    }
}
