/**
 * The booking domain: what a booking is, and every rule for parsing,
 * formatting and validating one. Shared by the form and the mock API routes,
 * so it must stay free of both React and server-only APIs.
 */

export type TripType = "one-way" | "hourly";
export type LocationMode = "location" | "airport";

export type CustomerRecord = {
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type BookingPayload = {
  tripType: TripType;
  /** Hours of hire. Only read when `tripType` is `"hourly"`. */
  durationHours: string;
  date: string;
  time: string;
  pickup: string;
  dropoff: string;
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
  passengers: string;
  stops: string[];
  distance?: string;
  estimatedTravelTime?: string;
  pickupMode?: LocationMode;
  dropoffMode?: LocationMode;
};

export type FieldName = keyof BookingPayload;

/** Field name to message, as produced by the validators below. */
export type FieldErrors = Partial<Record<FieldName, string>>;

/**
 * An hourly booking is an as-directed hire: the car and driver stay with the
 * passenger for a block of time, so the hire length is what's required and the
 * drop off is optional. A one-way is the mirror image — a fixed A-to-B, so the
 * drop off is required and the duration means nothing.
 */
export const HOURLY_MIN_HOURS = 3;
export const HOURLY_MAX_HOURS = 24;

export const MIN_PASSENGERS = 1;
export const MAX_PASSENGERS = 20;

/** What a drop off reads as when an hourly hire names none. */
export const AS_DIRECTED = "As directed";

export const PHONE_DIGITS = 10;

export const EMPTY_BOOKING: BookingPayload = {
  tripType: "one-way",
  durationHours: "",
  date: "",
  time: "",
  pickup: "",
  dropoff: "",
  phone: "",
  firstName: "",
  lastName: "",
  email: "",
  passengers: "",
  stops: [],
};

export function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }

  return digits;
}

export function isValidPhone(phone: string) {
  return normalizePhone(phone).length === PHONE_DIGITS;
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Parses the MM/DD/YYYY the date field speaks. Returns null for anything
 * malformed or for a calendar-impossible day such as 02/30 — `new Date` rolls
 * those over silently, so the round-trip below is what actually rejects them.
 */
export function parseDate(date: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date.trim());

  if (!match) {
    return null;
  }

  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

/** The inverse of `parseDate` — what the date field and payload store. */
export function formatDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${month}/${day}/${date.getFullYear()}`;
}

export function isValidDate(date: string) {
  return parseDate(date) !== null;
}

/**
 * The time field stores 24-hour `HH:MM`. One unambiguous value to validate,
 * submit and sort by — `formatTime12h` is what the customer actually reads.
 */
export function isValidTime(time: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time.trim());
}

/** `"15:30"` -> `"3:30 PM"`. Empty for anything `isValidTime` rejects. */
export function formatTime12h(time: string) {
  if (!isValidTime(time)) {
    return "";
  }

  const [hour, minute] = time.trim().split(":").map(Number);
  const suffix = hour < 12 ? "AM" : "PM";

  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

/** The hour we are currently in, as the 24-hour value the time field stores. */
export function currentHourTime(now = new Date()) {
  return `${String(now.getHours()).padStart(2, "0")}:00`;
}

const TIME_STEP_MINUTES = 15;
const MINUTES_PER_DAY = 24 * 60;

/** Quarter-hour pickup slots, midnight to 11:45 PM, as value/label pairs. */
export const TIME_OPTIONS = Array.from(
  { length: MINUTES_PER_DAY / TIME_STEP_MINUTES },
  (_, slot) => {
    const minutes = slot * TIME_STEP_MINUTES;
    const value = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
      minutes % 60,
    ).padStart(2, "0")}`;

    return { value, label: formatTime12h(value) };
  },
);

/** The contact details every booking carries, validated on their own. */
export function validateCustomer(customer: Partial<CustomerRecord>) {
  const errors: FieldErrors = {};

  if (!isValidPhone(customer.phone ?? "")) {
    errors.phone = "Enter a valid phone number";
  }
  if (!customer.firstName?.trim()) {
    errors.firstName = "First name is required";
  }
  if (!customer.lastName?.trim()) {
    errors.lastName = "Last name is required";
  }
  if (!customer.email?.trim()) {
    errors.email = "Email is required";
  } else if (!isValidEmail(customer.email)) {
    errors.email = "Enter a valid email address";
  }

  return errors;
}

export function validateBookingPayload(payload: Partial<BookingPayload>) {
  const errors: FieldErrors = validateCustomer(payload);

  if (!payload.date || !isValidDate(payload.date)) {
    errors.date = "Enter a date as MM/DD/YYYY";
  }
  if (!payload.time || !isValidTime(payload.time)) {
    errors.time = "Select a pickup time";
  }
  if (!payload.pickup?.trim()) {
    errors.pickup = "Pickup location is required";
  }

  if (payload.tripType === "hourly") {
    const hours = Number(payload.durationHours);

    if (
      !Number.isInteger(hours) ||
      hours < HOURLY_MIN_HOURS ||
      hours > HOURLY_MAX_HOURS
    ) {
      errors.durationHours = `Enter ${HOURLY_MIN_HOURS} to ${HOURLY_MAX_HOURS} hours`;
    }
  } else if (!payload.dropoff?.trim()) {
    errors.dropoff = "Drop off location is required";
  }

  const passengers = Number(payload.passengers);
  if (
    !Number.isInteger(passengers) ||
    passengers < MIN_PASSENGERS ||
    passengers > MAX_PASSENGERS
  ) {
    errors.passengers = `Enter ${MIN_PASSENGERS} to ${MAX_PASSENGERS} passengers`;
  }

  if (payload.stops?.some((stop) => !stop.trim())) {
    errors.stops = "Complete or remove each stop";
  }

  return errors;
}
