<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ComplaintResource;
use App\Models\Complaint;
use App\Models\Trip;
use Illuminate\Http\Request;

class ComplaintController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'trip_id' => ['nullable', 'exists:trips,id'],
            'message' => ['required', 'string', 'min:5', 'max:2000'],
        ]);

        $trip = isset($data['trip_id']) ? Trip::findOrFail($data['trip_id']) : null;

        if ($trip && $trip->user_id === $request->user()->id) {
            abort(422, 'Ви не можете залишити скаргу на власну поїздку.');
        }

        $complaint = Complaint::create([
            'reported_by' => $request->user()->id,
            'trip_id' => $trip?->id,
            'reported_user_id' => $trip?->user_id,
            'message' => $data['message'],
        ]);

        return new ComplaintResource($complaint->load(['reporter.militaryUnit', 'reportedUser.militaryUnit', 'trip']));
    }

    public function index()
    {
        $complaints = Complaint::query()
            ->with(['reporter.militaryUnit', 'reportedUser.militaryUnit', 'trip'])
            ->latest()
            ->paginate(50);

        return ComplaintResource::collection($complaints);
    }
}
