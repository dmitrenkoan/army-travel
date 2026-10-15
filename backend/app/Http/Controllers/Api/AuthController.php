<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $data = $request->validate([
            'phone' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('phone', $data['phone'])->first();

        if (! $user || ! Auth::guard('web')->getProvider()->validateCredentials($user, ['password' => $data['password']])) {
            throw ValidationException::withMessages([
                'phone' => 'Невірний номер телефону або пароль.',
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'phone' => 'Обліковий запис деактивовано. Зверніться до адміністратора.',
            ]);
        }

        $token = $user->createToken('frontend')->plainTextToken;

        return response()->json([
            'user' => new UserResource($user->load('militaryUnit')),
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Ви вийшли з системи.']);
    }

    public function me(Request $request)
    {
        return new UserResource($request->user()->load('militaryUnit'));
    }
}
