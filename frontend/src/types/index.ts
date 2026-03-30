export interface User {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  avatarUrl?: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
}

export interface Media {
  id: number;
  url: string;
  mediaType: "IMAGE" | "VIDEO";
}

export interface Listing {
  id: number;
  name: string;
  description: string;
  price: number;
  location: string;
  maxGuests: number;
  avgRating: number;
  ratingCount: number;
  eventType?: string;
  amenities: string[];
  media: Media[];
  owner: User;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  user: User;
  createdAt: string;
}

export interface Booking {
  id: number;
  listingId: number;
  listingName: string;
  listingLocation: string;
  user: User;
  eventDate: string;
  guestCount: number;
  totalPrice: number;
  status: string;
  notes?: string;
  createdAt: string;
}

export interface Payment {
  id: number;
  bookingId: number;
  amount: number;
  status: string;
  paymentMethod: string;
  transactionId: string;
  createdAt: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  type: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
