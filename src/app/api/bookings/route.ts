import { validateBookingPayload } from "@/lib/booking";
import type { BookingPayload } from "@/lib/booking";
import { saveCustomer } from "@/lib/customer-store";

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

/** Anything can arrive over the wire, so coerce before validating. */
function toBookingPayload(body: Record<string, unknown>): BookingPayload {
  return {
    tripType: body.tripType === "hourly" ? "hourly" : "one-way",
    durationHours: asString(body.durationHours),
    date: asString(body.date),
    time: asString(body.time),
    pickup: asString(body.pickup),
    dropoff: asString(body.dropoff),
    phone: asString(body.phone),
    firstName: asString(body.firstName),
    lastName: asString(body.lastName),
    email: asString(body.email),
    passengers: asString(body.passengers),
    stops: Array.isArray(body.stops)
      ? body.stops.filter((stop): stop is string => typeof stop === "string")
      : [],
    distance: asString(body.distance),
    estimatedTravelTime: asString(body.estimatedTravelTime),
    pickupMode: body.pickupMode === "airport" ? "airport" : "location",
    dropoffMode: body.dropoffMode === "airport" ? "airport" : "location",
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return Response.json(
      { message: "Request body must be a JSON object." },
      { status: 400 },
    );
  }

  const payload = toBookingPayload(body as Record<string, unknown>);
  const errors = validateBookingPayload(payload);

  if (Object.keys(errors).length) {
    return Response.json(
      { message: "Booking details are incomplete.", errors },
      { status: 400 },
    );
  }

  // Booking with us is how a new customer joins the directory.
  saveCustomer({
    phone: payload.phone,
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    email: payload.email.trim(),
  });

  const booking = {
    id: `booking_${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    ...payload,
  };

  return Response.json({ booking }, { status: 201 });
}
