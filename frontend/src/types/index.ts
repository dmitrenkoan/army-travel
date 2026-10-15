export type Role = 'super_admin' | 'unit_admin' | 'user';

export interface MilitaryUnit {
  id: number;
  name: string;
  code: string;
  city: string | null;
  users_count?: number;
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  role: Role;
  is_active: boolean;
  military_unit: MilitaryUnit | null;
  military_unit_id: number | null;
  created_at: string;
}

export interface RoutePoint {
  lat: number;
  lng: number;
  distance: number; // cumulative meters from route start
  duration: number; // cumulative seconds from route start
}

export type TripStatus = 'active' | 'cancelled' | 'completed';

export interface TripMatch {
  pickup: RoutePoint;
  dropoff: RoutePoint;
  leg_distance_meters: number;
  leg_duration_seconds: number;
  origin_offset_meters: number;
  destination_offset_meters: number;
}

export interface Trip {
  id: number;
  status: TripStatus;
  driver: User;
  military_unit: MilitaryUnit | null;

  origin_address: string;
  origin_lat: number;
  origin_lng: number;
  destination_address: string;
  destination_lat: number;
  destination_lng: number;
  route_path: RoutePoint[];
  distance_meters: number;
  duration_seconds: number;

  departure_date: string;
  departure_time: string;
  has_return_trip: boolean;
  return_date: string | null;
  return_time: string | null;

  seats_total: number;
  seats_available: number;
  car_info: string;
  route_adjustment: string | null;
  additional_contact: string | null;
  notes: string | null;

  bookings_count?: number;
  bookings?: TripBooking[];
  match?: TripMatch;

  created_at: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled';

export interface TripBooking {
  id: number;
  status: BookingStatus;
  seats_requested: number;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  leg_duration_seconds: number | null;
  leg_distance_meters: number | null;
  rejection_reason: string | null;
  passenger: User;
  trip: Trip;
  created_at: string;
}

export interface ComplaintTripSummary {
  id: number;
  origin_address: string;
  destination_address: string;
  departure_date: string | null;
  departure_time: string;
  car_info: string;
  status: TripStatus;
}

export interface Complaint {
  id: number;
  message: string;
  created_at: string;
  reporter: User;
  reported_user: User | null;
  trip: ComplaintTripSummary | null;
}

export interface AppNotification {
  id: string;
  type: string;
  data: {
    title: string;
    message: string;
    trip_id?: number;
    booking_id?: number;
    passenger_name?: string;
    reason?: string;
  };
  read_at: string | null;
  created_at: string;
}
