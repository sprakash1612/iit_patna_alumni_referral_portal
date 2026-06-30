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
