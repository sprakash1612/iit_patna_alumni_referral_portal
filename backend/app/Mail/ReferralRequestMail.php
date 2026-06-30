<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ReferralRequestMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly User $requester,
        public readonly User $referee,
        public readonly ?string $personalMessage = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "{$this->requester->name} is requesting a referral - IITP Referral Portal",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.referral_request',
        );
    }
}
