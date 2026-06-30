<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Migrate existing string values into a JSON array
        DB::statement("ALTER TABLE users ALTER COLUMN previous_company TYPE json USING CASE WHEN previous_company IS NULL THEN NULL ELSE json_build_array(previous_company) END");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE users ALTER COLUMN previous_company TYPE varchar(255) USING COALESCE(previous_company->>0, NULL)");
    }
};
