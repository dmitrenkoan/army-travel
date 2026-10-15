<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $actor = $request->user();

        $query = User::query()->with('militaryUnit')->latest();

        if ($actor->isSuperAdmin()) {
            $query->where('role', User::ROLE_UNIT_ADMIN);

            if ($request->filled('military_unit_id')) {
                $query->where('military_unit_id', $request->integer('military_unit_id'));
            }
        } elseif ($actor->isUnitAdmin()) {
            $query->where('role', User::ROLE_USER)
                ->where('military_unit_id', $actor->military_unit_id);
        } else {
            abort(403);
        }

        return UserResource::collection($query->paginate(50));
    }

    public function store(Request $request)
    {
        $actor = $request->user();

        if ($actor->isSuperAdmin()) {
            $data = $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'phone' => ['required', 'string', 'max:30', 'unique:users,phone'],
                'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
                'password' => ['required', 'string', 'min:6'],
                'military_unit_id' => ['required', 'exists:military_units,id'],
            ]);
            $data['role'] = User::ROLE_UNIT_ADMIN;
        } elseif ($actor->isUnitAdmin()) {
            if (! $actor->military_unit_id) {
                abort(422, 'Вам не призначено військову частину.');
            }

            $data = $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'phone' => ['required', 'string', 'max:30', 'unique:users,phone'],
                'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
                'password' => ['required', 'string', 'min:6'],
            ]);
            $data['role'] = User::ROLE_USER;
            $data['military_unit_id'] = $actor->military_unit_id;
        } else {
            abort(403);
        }

        $data['password'] = Hash::make($data['password']);
        $data['created_by'] = $actor->id;

        $user = User::create($data);

        return new UserResource($user->load('militaryUnit'));
    }

    public function update(Request $request, User $user)
    {
        $actor = $request->user();
        $this->authorizeManagement($actor, $user);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['sometimes', 'required', 'string', 'max:30', 'unique:users,phone,'.$user->id],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'password' => ['nullable', 'string', 'min:6'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (! empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        return new UserResource($user->load('militaryUnit'));
    }

    public function destroy(Request $request, User $user)
    {
        $actor = $request->user();
        $this->authorizeManagement($actor, $user);

        $user->delete();

        return response()->json(['message' => 'Користувача видалено.']);
    }

    private function authorizeManagement(User $actor, User $target): void
    {
        if ($actor->isSuperAdmin() && $target->role === User::ROLE_UNIT_ADMIN) {
            return;
        }

        if ($actor->isUnitAdmin() && $target->role === User::ROLE_USER && $target->military_unit_id === $actor->military_unit_id) {
            return;
        }

        abort(403, 'Недостатньо прав для керування цим користувачем.');
    }
}
