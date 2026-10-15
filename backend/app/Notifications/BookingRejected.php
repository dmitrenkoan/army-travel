<?php

namespace App\Notifications;

use App\Models\TripBooking;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class BookingRejected extends Notification
{
    use Queueable;

    public function __construct(public TripBooking $booking)
    {
        $this->booking->loadMissing(['trip.driver']);
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Заявку відхилено',
            'message' => 'Вашу заявку на поїздку '.$this->booking->trip->origin_address.' → '
                .$this->booking->trip->destination_address.' відхилено. Причина: '.$this->booking->rejection_reason,
            'trip_id' => $this->booking->trip_id,
            'booking_id' => $this->booking->id,
            'reason' => $this->booking->rejection_reason,
        ];
    }
}
