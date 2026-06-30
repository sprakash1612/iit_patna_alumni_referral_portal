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
            ->map(function ($user) use ($currentUserId) {
                return [
                    'id'               => $user->id,
                    'name'             => $user->name,
                    'college_email'    => $user->college_email,
                    'current_company'  => $user->current_company,
                    'previous_company' => $user->previous_company,
                    'designation'      => $user->designation,
                    'total_experience' => $user->total_experience,
                    'skills'           => $user->skills->pluck('name'),
                ];
            });

        return response()->json(['users' => $users]);
    }
}
