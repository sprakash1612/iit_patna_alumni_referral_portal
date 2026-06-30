<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('referral_requests', function (Blueprint $table) {
            // Drop old unique constraint (requester_id, referee_id)
            $table->dropUnique(['requester_id', 'referee_id']);

            $table->foreignId('job_post_id')->nullable()->after('referee_id')
                ->constrained('job_posts')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('referral_requests', function (Blueprint $table) {
            $table->dropForeign(['job_post_id']);
            $table->dropColumn('job_post_id');
            $table->unique(['requester_id', 'referee_id']);
        });
    }
};
