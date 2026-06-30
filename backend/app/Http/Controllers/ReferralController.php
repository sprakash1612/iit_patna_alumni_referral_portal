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
            'referee_id'  => 'required|integer|exists:users,id',
            'job_post_id' => 'nullable|integer|exists:job_posts,id',
            'message'     => 'nullable|string|max:1000',
        ]);

        $requester  = $request->user();
        $refereeId  = $request->referee_id;
        $jobPostId  = $request->job_post_id ?? null;

        if ($requester->id === $refereeId) {
            return response()->json(['message' => 'You cannot request a referral from yourself.'], 422);
        }

        $referee = User::find($refereeId);
        if (!$referee || !$referee->is_verified) {
            return response()->json(['message' => 'Referee not found.'], 404);
        }

        // Duplicate check scoped to the same job_post_id (null = dashboard referral)
        $existing = ReferralRequest::where('requester_id', $requester->id)
            ->where('referee_id', $refereeId)
            ->where('job_post_id', $jobPostId)
            ->first();

        if ($existing) {
            $context = $jobPostId ? 'this job post' : 'this person';
            return response()->json(['message' => "You have already sent a referral request for {$context}."], 422);
        }

        ReferralRequest::create([
            'requester_id' => $requester->id,
            'referee_id'   => $refereeId,
            'job_post_id'  => $jobPostId,
            'message'      => $request->message,
            'status'       => 'sent',
            'is_seen'      => false,
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
            ->with(['requester:id,name,college_email,personal_email,mobile,show_mobile,current_company,designation,total_experience'])
            ->latest()
            ->get()
            ->map(function ($r) {
                $req = $r->requester;
                return [
                    'id'          => $r->id,
                    'job_post_id' => $r->job_post_id,
                    'message'     => $r->message,
                    'status'      => $r->status,
                    'is_seen'     => $r->is_seen,
                    'created_at'  => $r->created_at,
                    'requester'   => [
                        'id'               => $req->id,
                        'name'             => $req->name,
                        'college_email'    => $req->college_email,
                        'personal_email'   => $req->personal_email,
                        'mobile'           => $req->show_mobile ? $req->mobile : null,
                        'current_company'  => $req->current_company,
                        'designation'      => $req->designation,
                        'total_experience' => $req->total_experience,
                    ],
                ];
            });

        return response()->json(['requests' => $requests]);
    }

    public function markSeen(Request $request)
    {
        $request->user()
            ->referralRequestsReceived()
            ->where('is_seen', false)
            ->update(['is_seen' => true]);

        return response()->json(['message' => 'Notifications marked as seen.']);
    }
}
