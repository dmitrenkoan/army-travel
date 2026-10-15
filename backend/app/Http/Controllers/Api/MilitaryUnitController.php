<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MilitaryUnitResource;
use App\Models\MilitaryUnit;
use Illuminate\Http\Request;

class MilitaryUnitController extends Controller
{
    public function index(Request $request)
    {
        $units = MilitaryUnit::withCount('users')->orderBy('name')->get();

        return MilitaryUnitResource::collection($units);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:military_units,code'],
            'city' => ['nullable', 'string', 'max:255'],
        ]);

        $data['created_by'] = $request->user()->id;

        $unit = MilitaryUnit::create($data);

        return new MilitaryUnitResource($unit);
    }

    public function update(Request $request, MilitaryUnit $militaryUnit)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => ['sometimes', 'required', 'string', 'max:50', 'unique:military_units,code,'.$militaryUnit->id],
            'city' => ['nullable', 'string', 'max:255'],
        ]);

        $militaryUnit->update($data);

        return new MilitaryUnitResource($militaryUnit);
    }

    public function destroy(MilitaryUnit $militaryUnit)
    {
        $militaryUnit->delete();

        return response()->json(['message' => 'Військову частину видалено.']);
    }
}
