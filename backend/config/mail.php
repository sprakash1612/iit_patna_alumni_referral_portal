<?php

return [
    'default' => env('MAIL_MAILER', 'resend'),

    'mailers' => [
        'resend' => [
            'transport' => 'resend',
        ],
        'smtp' => [
            'transport' => 'smtp',
            'scheme'    => env('MAIL_SCHEME'),
            'host'      => env('MAIL_HOST', 'smtp.mailtrap.io'),
            'port'      => env('MAIL_PORT', 587),
            'username'  => env('MAIL_USERNAME'),
            'password'  => env('MAIL_PASSWORD'),
            'timeout'   => null,
        ],
        'log' => [
            'transport' => 'log',
            'channel'   => env('MAIL_LOG_CHANNEL'),
        ],
        'array' => [
            'transport' => 'array',
        ],
    ],

    'from' => [
        'address' => env('MAIL_FROM_ADDRESS', 'onboarding@resend.dev'),
        'name'    => env('MAIL_FROM_NAME', 'IITP Referral Portal'),
    ],
];
