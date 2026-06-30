<?php

namespace App\Http\Controllers;

use App\Models\Skill;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function update(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name'               => 'required|string|max:255',
            'personal_email'     => 'nullable|email',
            'mobile'             => 'nullable|string|max:15',
            'show_mobile'        => 'nullable|boolean',
            'current_company'    => 'nullable|string|max:255',
            'previous_company'   => 'nullable|array',
            'previous_company.*' => 'string|max:255',
            'designation'        => 'nullable|string|max:255',
            'total_experience'   => 'nullable|string|max:50',
            'skills'             => 'nullable|array',
            'skills.*'           => 'string|max:100',
            'current_password'   => 'nullable|string',
            'password'           => 'nullable|string|min:8|confirmed|required_with:current_password',
        ]);

        // Password change — verify current password first
        if ($request->filled('current_password')) {
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'message' => 'Current password is incorrect.',
                    'errors'  => ['current_password' => ['Current password is incorrect.']],
                ], 422);
            }
        }

        $user->update([
            'name'             => $request->name,
            'personal_email'   => $request->personal_email,
            'mobile'           => $request->mobile,
            'show_mobile'      => $request->input('show_mobile', $user->show_mobile),
            'current_company'  => $request->current_company,
            'previous_company' => $request->input('previous_company', []),
            'designation'      => $request->designation,
            'total_experience' => $request->total_experience,
            ...($request->filled('password') ? ['password' => $request->password] : []),
        ]);

        // Sync skills
        if ($request->has('skills')) {
            $skillIds = [];
            foreach ($request->skills as $skillName) {
                $skill = Skill::firstOrCreate(['name' => strtolower(trim($skillName))]);
                $skillIds[] = $skill->id;
            }
            $user->skills()->sync($skillIds);
        }

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user'    => $user->fresh()->load('skills'),
        ]);
    }
}
