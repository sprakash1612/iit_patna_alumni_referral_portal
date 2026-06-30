<?php

namespace App\Http\Controllers;

// use App\Mail\ReferralRequestMail;
use App\Models\ReferralRequest;
use App\Models\User;
use Illuminate\Http\Request;
// use Illuminate\Support\Facades\Mail;

class ReferralController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'referee_id' => 'required|integer|exists:users,id',
            'message'    => 'nullable|string|max:1000',
        ]);

        $requester = $request->user();
        $refereeId = $request->referee_id;

        if ($requester->id === $refereeId) {
            return response()->json(['message' => 'You cannot request a referral from yourself.'], 422);
        }

        $referee = User::find($refereeId);
        if (!$referee || !$referee->is_verified) {
            return response()->json(['message' => 'Referee not found.'], 404);
        }

        $existing = ReferralRequest::where('requester_id', $requester->id)
            ->where('referee_id', $refereeId)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'You have already sent a referral request to this person.'], 422);
        }

        $referralRequest = ReferralRequest::create([
            'requester_id' => $requester->id,
            'referee_id'   => $refereeId,
            'message'      => $request->message,
            'status'       => 'sent',
        ]);

        // Email notification disabled temporarily — uncomment when domain is verified on Resend
        // Mail::to($referee->college_email)->send(
        //     new ReferralRequestMail($requester->load('skills'), $referee, $request->message)
        // );

        return response()->json([
            'message' => "Referral request sent to {$referee->name} successfully!",
        ], 201);
    }

    public function sent(Request $request)
    {
        $requests = $request->user()
            ->referralRequestsSent()
            ->with(['referee:id,name,college_email,current_company,designation'])
            ->latest()
            ->get();

        return response()->json(['requests' => $requests]);
    }

    public function received(Request $request)
    {
        $requests = $request->user()
            ->referralRequestsReceived()
            ->with(['requester:id,name,college_email,current_company,designation'])
            ->latest()
            ->get();

        return response()->json(['requests' => $requests]);
    }
}
