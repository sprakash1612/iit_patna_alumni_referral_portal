<?php

namespace App\Http\Controllers;

use App\Models\JobPost;
use Illuminate\Http\Request;

class JobPostController extends Controller
{
    public function index()
    {
        $posts = JobPost::with(['user:id,name,college_email,designation,current_company'])
            ->latest()
            ->get()
            ->map(function ($post) {
                return [
                    'id'          => $post->id,
                    'job_title'   => $post->job_title,
                    'company'     => $post->company,
                    'location'    => $post->location,
                    'job_type'    => $post->job_type,
                    'description' => $post->description,
                    'created_at'  => $post->created_at,
                    'posted_by'   => [
                        'id'              => $post->user->id,
                        'name'            => $post->user->name,
                        'college_email'   => $post->user->college_email,
                        'designation'     => $post->user->designation,
                        'current_company' => $post->user->current_company,
                    ],
                ];
            });

        return response()->json(['posts' => $posts]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'job_title'   => 'required|string|max:255',
            'company'     => 'required|string|max:255',
            'location'    => 'nullable|string|max:255',
            'job_type'    => 'nullable|in:full-time,part-time,internship,remote,contract',
            'description' => 'nullable|string|max:2000',
        ]);

        $post = JobPost::create([
            'user_id'     => $request->user()->id,
            'job_title'   => $request->job_title,
            'company'     => $request->company,
            'location'    => $request->location,
            'job_type'    => $request->input('job_type', 'full-time'),
            'description' => $request->description,
        ]);

        $post->load('user:id,name,college_email,designation,current_company');

        return response()->json([
            'message' => 'Job post created successfully.',
            'post'    => [
                'id'          => $post->id,
                'job_title'   => $post->job_title,
                'company'     => $post->company,
                'location'    => $post->location,
                'job_type'    => $post->job_type,
                'description' => $post->description,
                'created_at'  => $post->created_at,
                'posted_by'   => [
                    'id'              => $post->user->id,
                    'name'            => $post->user->name,
                    'college_email'   => $post->user->college_email,
                    'designation'     => $post->user->designation,
                    'current_company' => $post->user->current_company,
                ],
            ],
        ], 201);
    }

    public function destroy(Request $request, $id)
    {
        $post = JobPost::find($id);

        if (!$post) {
            return response()->json(['message' => 'Post not found.'], 404);
        }

        if ($post->user_id !== $request->user()->id) {
            return response()->json(['message' => 'You can only delete your own posts.'], 403);
        }

        $post->delete();

        return response()->json(['message' => 'Post deleted.']);
    }
}
