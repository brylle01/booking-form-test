/**
 * Browser-side client for the mock API in `app/api`, plus the `localStorage`
 * cache that lets a returning customer be recognised without a round trip.
 */

import { normalizePhone } from "@/lib/booking";
import type { BookingPayload, CustomerRecord, FieldErrors } from "@/lib/booking";

function cacheKey(phone: string) {
  return `customer:${normalizePhone(phone)}`;
}

export function writeCachedCustomer(customer: CustomerRecord) {
  try {
    window.localStorage.setItem(
      cacheKey(customer.phone),
      JSON.stringify(customer),
    );
  } catch {
    // A full or unavailable localStorage should never break a booking.
  }
}

function readCachedCustomer(phone: string): CustomerRecord | null {
  try {
    const cached = window.localStorage.getItem(cacheKey(phone));
    return cached ? (JSON.parse(cached) as CustomerRecord) : null;
  } catch {
    return null;
  }
}

/** Cache first, then the API. Returns null when the number is unknown. */
export async function lookupCustomer(
  phone: string,
): Promise<CustomerRecord | null> {
  const cached = readCachedCustomer(phone);

  if (cached) {
    return cached;
  }

  const response = await fetch(
    `/api/customers?phone=${encodeURIComponent(normalizePhone(phone))}`,
  );
  const data = await response.json();

  return data.customer ?? null;
}

export type CreateBookingResult =
  | { ok: true; id: string }
  | { ok: false; message: string; errors: FieldErrors };

export async function createBooking(
  payload: BookingPayload,
): Promise<CreateBookingResult> {
  const response = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();

  if (!response.ok) {
    return {
      ok: false,
      message: data.message ?? "We could not submit your booking.",
      errors: data.errors ?? {},
    };
  }

  return { ok: true, id: data.booking.id };
}
