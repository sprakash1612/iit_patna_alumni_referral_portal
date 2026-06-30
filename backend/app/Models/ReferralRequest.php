<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReferralRequest extends Model
{
    protected $fillable = [
        'requester_id',
        'referee_id',
        'message',
        'status',
        'is_seen',
    ];

    protected $casts = [
        'is_seen' => 'boolean',
    ];

    public function requester()
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function referee()
    {
        return $this->belongsTo(User::class, 'referee_id');
    }
}
