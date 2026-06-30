<?php

namespace App\Http\Controllers;

// use App\Mail\OtpMail;
// use App\Models\OtpVerification;
use App\Models\Skill;
use App\Models\User;
// use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
// use Illuminate\Support\Facades\Mail;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name'             => 'required|string|max:255',
            'college_email'    => 'required|email|unique:users,college_email',
            'personal_email'   => 'nullable|email',
            'mobile'           => 'nullable|string|max:15',
            'show_mobile'      => 'nullable|boolean',
            'current_company'  => 'nullable|string|max:255',
            'previous_company'   => 'nullable|array',
            'previous_company.*' => 'string|max:255',
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
            'show_mobile'      => $request->input('show_mobile', true),
            'current_company'  => $request->current_company,
            'previous_company' => $request->previous_company,
            'designation'      => $request->designation,
            'total_experience' => $request->total_experience,
            'password'         => $request->password,
            'is_verified'      => true, // auto-verify; OTP email disabled temporarily
        ]);

        if ($request->skills) {
            foreach ($request->skills as $skillName) {
                $skill = Skill::firstOrCreate(['name' => strtolower(trim($skillName))]);
                $user->skills()->syncWithoutDetaching([$skill->id]);
            }
        }

        // OTP email disabled temporarily — uncomment when domain is verified on Resend
        // $this->sendOtp($request->college_email, $user->name);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful. You can now log in.',
            'token'   => $token,
            'user'    => $user->load('skills'),
        ], 201);
    }

    public function verifyOtp(Request $request)
    {
        // OTP verification disabled temporarily
        return response()->json(['message' => 'OTP verification is not required at this time.']);
    }

    public function resendOtp(Request $request)
    {
        // OTP resend disabled temporarily
        return response()->json(['message' => 'OTP resend is not required at this time.']);
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

        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $user->load('skills'),
        ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'college_email'         => 'required|email',
            'personal_email'        => 'required|email',
            'password'              => 'required|string|min:8|confirmed',
        ]);

        $user = User::where('college_email', strtolower($request->college_email))->first();

        if (!$user || !$user->personal_email) {
            return response()->json([
                'message' => 'No account found or no personal email on record. Please contact the admin.',
            ], 404);
        }

        if (strtolower($user->personal_email) !== strtolower($request->personal_email)) {
            return response()->json([
                'message' => 'Personal email does not match our records.',
                'errors'  => ['personal_email' => ['Personal email does not match our records.']],
            ], 422);
        }

        $user->update(['password' => $request->password]);
        $user->tokens()->delete();

        return response()->json(['message' => 'Password reset successfully. You can now log in.']);
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

    // OTP email disabled temporarily — uncomment when domain is verified on Resend
    // private function sendOtp(string $email, string $name): void
    // {
    //     $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    //     OtpVerification::updateOrCreate(
    //         ['email' => strtolower($email)],
    //         [
    //             'otp_code'   => $otp,
    //             'expires_at' => Carbon::now()->addMinutes(10),
    //             'used'       => false,
    //         ]
    //     );
    //     Mail::to($email)->send(new OtpMail($otp, $name));
    // }
}
