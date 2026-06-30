<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('referral_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requester_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('referee_id')->constrained('users')->onDelete('cascade');
            $table->text('message')->nullable();
            $table->string('status')->default('pending'); // pending, sent
            $table->timestamps();

            $table->unique(['requester_id', 'referee_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referral_requests');
    }
};
