<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->unique()->after('name');
            $table->string('role')->default('user')->after('phone'); // super_admin | unit_admin | user
            $table->foreignId('military_unit_id')->nullable()->after('role')
                ->constrained('military_units')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->after('military_unit_id')
                ->constrained('users')->nullOnDelete();
            $table->boolean('is_active')->default(true)->after('created_by');
            $table->string('email')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('military_unit_id');
            $table->dropConstrainedForeignId('created_by');
            $table->dropColumn(['phone', 'role', 'is_active']);
        });
    }
};
