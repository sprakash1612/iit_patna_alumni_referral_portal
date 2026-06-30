<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobPost extends Model
{
    protected $fillable = [
        'user_id',
        'job_title',
        'company',
        'location',
        'job_type',
        'description',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
