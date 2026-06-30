<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $currentUserId = $request->user()->id;

        $users = User::with('skills')
            ->where('is_verified', true)
            ->where('id', '!=', $currentUserId)
            ->orderBy('name')
            ->get()
            ->map(function ($user) {
                return [
                    'id'               => $user->id,
                    'name'             => $user->name,
                    'college_email'    => $user->college_email,
                    'personal_email'   => $user->personal_email,
                    'mobile'           => $user->show_mobile ? $user->mobile : $this->maskMobile($user->mobile),
                    'show_mobile'      => $user->show_mobile,
                    'current_company'  => $user->current_company,
                    'previous_company' => $user->previous_company ?? [],
                    'designation'      => $user->designation,
                    'total_experience' => $user->total_experience,
                    'skills'           => $user->skills->pluck('name'),
                ];
            });

        return response()->json(['users' => $users]);
    }

    private function maskMobile(?string $mobile): ?string
    {
        if (!$mobile) return null;
        // Keep first 3 and last 2 chars, mask the rest
        $stripped = preg_replace('/\D/', '', $mobile);
        if (strlen($stripped) < 6) return '••••••••••';
        return substr($mobile, 0, 3) . str_repeat('•', max(0, strlen($mobile) - 5)) . substr($mobile, -2);
    }
}
