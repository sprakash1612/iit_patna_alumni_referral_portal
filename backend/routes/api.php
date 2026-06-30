<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReferralController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// Public auth routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('/resend-otp', [AuthController::class, 'resendOtp']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::patch('/profile', [ProfileController::class, 'update']);

    Route::get('/users', [UserController::class, 'index']);

    Route::post('/referrals', [ReferralController::class, 'store']);
    Route::get('/referrals/sent', [ReferralController::class, 'sent']);
    Route::get('/referrals/received', [ReferralController::class, 'received']);
    Route::patch('/referrals/mark-seen', [ReferralController::class, 'markSeen']);
});
