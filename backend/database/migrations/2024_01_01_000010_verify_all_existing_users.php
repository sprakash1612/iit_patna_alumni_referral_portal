<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Mark all existing users as verified since OTP email is disabled
        DB::table('users')->where('is_verified', false)->update(['is_verified' => true]);
    }

    public function down(): void
    {
        // Not reversible
    }
};
