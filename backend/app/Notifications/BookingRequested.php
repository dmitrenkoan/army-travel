<?php

namespace App\Notifications;

use App\Models\TripBooking;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class BookingRequested extends Notification
{
    use Queueable;

    public function __construct(public TripBooking $booking)
    {
        $this->booking->loadMissing(['passenger', 'trip']);
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Нова заявка на пасажирське місце',
            'message' => $this->booking->passenger->name.' подав(ла) заявку на вашу поїздку '
                .$this->booking->trip->origin_address.' → '.$this->booking->trip->destination_address,
            'trip_id' => $this->booking->trip_id,
            'booking_id' => $this->booking->id,
            'passenger_name' => $this->booking->passenger->name,
        ];
    }
}
