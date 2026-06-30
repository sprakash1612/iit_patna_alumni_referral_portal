<?php

namespace App\Http\Controllers;

use App\Mail\OtpMail;
use App\Models\OtpVerification;
use App\Models\Skill;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name'             => 'required|string|max:255',
            'college_email'    => 'required|email|unique:users,college_email',
            'personal_email'   => 'nullable|email',
            'mobile'           => 'nullable|string|max:15',
            'current_company'  => 'nullable|string|max:255',
            'previous_company' => 'nullable|string|max:255',
            'designation'      => 'nullable|string|max:255',
            'total_experience' => 'nullable|string|max:50',
            'password'         => 'required|string|min:8|confirmed',
            'skills'           => 'nullable|array',
            'skills.*'         => 'string|max:100',
        ]);

        if (!str_ends_with(strtolower($request->college_email), '@iitp.ac.in')) {
            return response()->json([
                'message' => 'Only @iitp.ac.in email addresses are allowed.',
                'errors'  => ['college_email' => ['Only @iitp.ac.in email addresses are allowed.']],
            ], 422);
        }

        $user = User::create([
            'name'             => $request->name,
            'college_email'    => strtolower($request->college_email),
            'personal_email'   => $request->personal_email,
            'mobile'           => $request->mobile,
            'current_company'  => $request->current_company,
            'previous_company' => $request->previous_company,
            'designation'      => $request->designation,
            'total_experience' => $request->total_experience,
            'password'         => $request->password,
            'is_verified'      => false,
        ]);

        if ($request->skills) {
            foreach ($request->skills as $skillName) {
                $skill = Skill::firstOrCreate(['name' => strtolower(trim($skillName))]);
                $user->skills()->syncWithoutDetaching([$skill->id]);
            }
        }

        $this->sendOtp($request->college_email, $user->name);

        return response()->json([
            'message' => 'Registration successful. Check your @iitp.ac.in email for the OTP.',
            'email'   => $user->college_email,
        ], 201);
    }

    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp'   => 'required|string|size:6',
        ]);

        $record = OtpVerification::where('email', strtolower($request->email))
            ->where('otp_code', $request->otp)
            ->where('used', false)
            ->where('expires_at', '>', Carbon::now())
            ->first();

        if (!$record) {
            return response()->json(['message' => 'Invalid or expired OTP. Please try again.'], 422);
        }

        $user = User::where('college_email', strtolower($request->email))->first();
        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        $user->update(['is_verified' => true]);
        $record->update(['used' => true]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Email verified successfully. Welcome!',
            'token'   => $token,
            'user'    => $user->load('skills'),
        ]);
    }

    public function resendOtp(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('college_email', strtolower($request->email))->first();

        if (!$user) {
            return response()->json(['message' => 'No account found with this email.'], 404);
        }

        if ($user->is_verified) {
            return response()->json(['message' => 'This account is already verified.'], 422);
        }

        $this->sendOtp($request->email, $user->name);

        return response()->json(['message' => 'OTP resent successfully.']);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('college_email', strtolower($request->email))->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid email or password.'], 401);
        }

        if (!$user->is_verified) {
            return response()->json([
                'message'           => 'Please verify your email before logging in.',
                'needs_verification' => true,
                'email'             => $user->college_email,
            ], 403);
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $user->load('skills'),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user()->load('skills'));
    }

    private function sendOtp(string $email, string $name): void
    {
        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        OtpVerification::updateOrCreate(
            ['email' => strtolower($email)],
            [
                'otp_code'   => $otp,
                'expires_at' => Carbon::now()->addMinutes(10),
                'used'       => false,
            ]
        );

        Mail::to($email)->send(new OtpMail($otp, $name));
    }
}
