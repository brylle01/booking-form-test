/**
 * The mock server-side customer directory, keyed by normalized phone number.
 * In memory on purpose: it is a stand-in for a real datastore and resets with
 * the server. `+1 617 555 0100` is seeded so the recognized path is demoable.
 */

import { normalizePhone } from "@/lib/booking";
import type { CustomerRecord } from "@/lib/booking";

const customers = new Map<string, CustomerRecord>([
  [
    "6175550100",
    {
      phone: "+1 617 555 0100",
      firstName: "Alex",
      lastName: "Morgan",
      email: "alex.morgan@example.com",
    },
  ],
]);

export function findCustomer(phone: string) {
  return customers.get(normalizePhone(phone)) ?? null;
}

export function saveCustomer(customer: CustomerRecord) {
  customers.set(normalizePhone(customer.phone), customer);
  return customer;
}
