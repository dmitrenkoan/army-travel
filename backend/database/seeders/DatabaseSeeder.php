<?php

namespace Database\Seeders;

use App\Models\MilitaryUnit;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $superAdmin = User::create([
            'name' => 'Супер Адміністратор',
            'phone' => '+380000000000',
            'email' => 'superadmin@army-travel.local',
            'password' => Hash::make('password'),
            'role' => User::ROLE_SUPER_ADMIN,
            'is_active' => true,
        ]);

        $unit = MilitaryUnit::create([
            'name' => 'Військова частина A0000',
            'code' => 'A0000',
            'city' => 'Київ',
            'created_by' => $superAdmin->id,
        ]);

        $unitAdmin = User::create([
            'name' => 'Адміністратор Частини',
            'phone' => '+380000000001',
            'email' => 'unitadmin@army-travel.local',
            'password' => Hash::make('password'),
            'role' => User::ROLE_UNIT_ADMIN,
            'military_unit_id' => $unit->id,
            'created_by' => $superAdmin->id,
            'is_active' => true,
        ]);

        User::create([
            'name' => 'Іван Петренко',
            'phone' => '+380000000002',
            'email' => 'user@army-travel.local',
            'password' => Hash::make('password'),
            'role' => User::ROLE_USER,
            'military_unit_id' => $unit->id,
            'created_by' => $unitAdmin->id,
            'is_active' => true,
        ]);
    }
}
