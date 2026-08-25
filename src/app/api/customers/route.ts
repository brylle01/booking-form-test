import { isValidPhone, validateCustomer } from "@/lib/booking";
import type { CustomerRecord } from "@/lib/booking";
import { findCustomer, saveCustomer } from "@/lib/customer-store";

/** Phone number lookup — `{ customer: null }` when the number is unknown. */
export async function GET(request: Request) {
  const phone = new URL(request.url).searchParams.get("phone") ?? "";

  if (!isValidPhone(phone)) {
    return Response.json(
      { message: "A valid phone number is required." },
      { status: 400 },
    );
  }

  return Response.json({ customer: findCustomer(phone) });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return Response.json(
      { message: "Request body must be a JSON object." },
      { status: 400 },
    );
  }

  const fields = body as Record<string, unknown>;
  const asTrimmed = (value: unknown) =>
    typeof value === "string" ? value.trim() : "";
  const customer: CustomerRecord = {
    phone: typeof fields.phone === "string" ? fields.phone : "",
    firstName: asTrimmed(fields.firstName),
    lastName: asTrimmed(fields.lastName),
    email: asTrimmed(fields.email),
  };
  const errors = validateCustomer(customer);

  if (Object.keys(errors).length) {
    return Response.json(
      { message: "Customer details are incomplete.", errors },
      { status: 400 },
    );
  }

  return Response.json({ customer: saveCustomer(customer) }, { status: 201 });
}
