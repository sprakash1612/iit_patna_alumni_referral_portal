<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'name',
        'college_email',
        'personal_email',
        'mobile',
        'show_mobile',
        'current_company',
        'previous_company',
        'designation',
        'total_experience',
        'password',
        'is_verified',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'is_verified'  => 'boolean',
        'show_mobile'  => 'boolean',
        'password'     => 'hashed',
    ];

    public function skills()
    {
        return $this->belongsToMany(Skill::class, 'user_skills');
    }

    public function referralRequestsSent()
    {
        return $this->hasMany(ReferralRequest::class, 'requester_id');
    }

    public function referralRequestsReceived()
    {
        return $this->hasMany(ReferralRequest::class, 'referee_id');
    }
}
