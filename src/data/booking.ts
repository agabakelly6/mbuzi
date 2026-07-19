// src/data/booking.ts

export interface TimeSlot {
  value: string;
  label: string;
}

export const TIME_SLOTS: TimeSlot[] = [
  { value: "11:00", label: "11:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "13:00", label: "1:00 PM" },
  { value: "14:00", label: "2:00 PM" },
  { value: "18:00", label: "6:00 PM" },
  { value: "19:00", label: "7:00 PM" },
  { value: "20:00", label: "8:00 PM" },
  { value: "21:00", label: "9:00 PM" },
];

export interface PartySizeOption {
  value: number;
  label: string;
}

export const PARTY_SIZES: PartySizeOption[] = [
  { value: 1, label: "1 Guest" },
  { value: 2, label: "2 Guests" },
  { value: 3, label: "3 Guests" },
  { value: 4, label: "4 Guests" },
  { value: 5, label: "5 Guests" },
  { value: 6, label: "6 Guests" },
  { value: 7, label: "7 Guests" },
  { value: 8, label: "8 Guests" },
  { value: 9, label: "9+ Guests (Group)" },
];

export interface OccasionOption {
  value: string;
  label: string;
}

export const OCCASION_TYPES: OccasionOption[] = [
  { value: "casual", label: "Casual Dining" },
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "business", label: "Business Meal" },
  { value: "family", label: "Family Gathering" },
  { value: "other", label: "Other" },
];

export interface ReservationPolicy {
  title: string;
  description: string;
}

export const RESERVATION_POLICIES: ReservationPolicy[] = [
  {
    title: "Securing Your Booking",
    description:
      "Reservations are secured with a mobile money merchant code payment (see below). Cash is accepted only for in-person dining at the restaurant, not to hold a reservation remotely.",
  },
  {
    title: "Arrival Time",
    description:
      "Please arrive within 15 minutes of your reservation time — tables held longer may be released to walk-in guests.",
  },
  {
    title: "Cancellation Policy",
    description:
      "Cancel or reschedule up to 3 hours before your reservation at no charge, via WhatsApp or phone.",
  },
  {
    title: "Group Reservations",
    description:
      "Parties of 9 or more should contact us directly on WhatsApp or by phone to confirm availability.",
  },
];

export interface MerchantPaymentOption {
  provider: string;
  merchantCode: string;
  merchantName: string;
  instructions: string;
}

/**
 * PLACEHOLDER merchant codes — replace with your real MTN/Airtel
 * merchant codes before going live. These are the numbers customers
 * will actually dial to send real money; shipping placeholders here
 * would send a guest's payment nowhere.
 */
export const MERCHANT_PAYMENT_OPTIONS: MerchantPaymentOption[] = [
  {
    provider: "MTN Mobile Money",
    merchantCode: "000000",
    merchantName: "YPA Mbuzi Choma",
    instructions: "Dial *165*3#, select Pay Merchant, and enter the code above.",
  },
  {
    provider: "Airtel Money",
    merchantCode: "000000",
    merchantName: "YPA Mbuzi Choma",
    instructions: "Dial *185*9#, select Pay Merchant, and enter the code above.",
  },
];