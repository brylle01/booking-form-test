"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { FormEvent } from "react";
import {
  EMPTY_BOOKING,
  PHONE_DIGITS,
  currentHourTime,
  isValidPhone,
  normalizePhone,
  validateBookingPayload,
} from "@/lib/booking";
import type {
  BookingPayload,
  CustomerRecord,
  FieldErrors,
  FieldName,
  LocationMode,
  TripType,
} from "@/lib/booking";
import {
  createBooking,
  lookupCustomer,
  writeCachedCustomer,
} from "@/lib/booking-api";
import { getRouteEstimate } from "@/lib/route-estimate";
import type { RouteEstimate } from "@/lib/route-estimate";
import type {
  CustomerStatus,
  SubmitState,
} from "@/components/booking-form/types";

const CUSTOMER_LOOKUP_DELAY_MS = 300;
const ROUTE_ESTIMATE_DELAY_MS = 400;

/** The hour is read once, at hydration — there is nothing to subscribe to. */
const subscribeToNothing = () => () => {};
const emptyTime = () => "";

/**
 * Owns every piece of booking form state: the values, the validation errors,
 * the customer lookup, the route estimate and the submission. `BookingForm` is
 * a pure render of what this returns.
 */
export function useBookingForm() {
  const [formState, setForm] = useState<BookingPayload>(EMPTY_BOOKING);
  const [errors, setErrors] = useState<FieldErrors>({});
  // Stops are keyed by identity, not position, so removing one from the middle
  // cannot hand its open suggestion list to the field that shifts up into it.
  const [stopIds, setStopIds] = useState<string[]>([]);
  const nextStopId = useRef(0);
  const [pickupMode, setPickupMode] = useState<LocationMode>("location");
  const [dropoffMode, setDropoffMode] = useState<LocationMode>("location");
  const [customer, setCustomer] = useState<CustomerRecord | null>(null);
  const [customerStatus, setCustomerStatus] = useState<CustomerStatus>("new");
  const [estimate, setEstimate] = useState<RouteEstimate | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  /** Inline text under the form. Errors only — success opens the modal. */
  const [submitMessage, setSubmitMessage] = useState("");
  // Set once the booking lands — its presence is what opens the modal.
  const [bookingId, setBookingId] = useState<string | null>(null);

  // The time field defaults to the hour we're in. The prerendered HTML can't
  // know the visitor's clock, so the server snapshot is empty and the real hour
  // arrives at hydration — neither side has to guess and then correct itself.
  const defaultTime = useSyncExternalStore(
    subscribeToNothing,
    currentHourTime,
    emptyTime,
  );
  const form = useMemo(
    () => (formState.time ? formState : { ...formState, time: defaultTime }),
    [formState, defaultTime],
  );

  // Look the caller up once they've typed a full phone number.
  useEffect(() => {
    if (!isValidPhone(form.phone)) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setCustomerStatus("checking");

      const found = await lookupCustomer(form.phone).catch(() => null);

      if (cancelled) {
        return;
      }

      setCustomer(found);
      setCustomerStatus(found ? "recognized" : "new");

      if (found) {
        setForm((current) => ({
          ...current,
          firstName: found.firstName,
          lastName: found.lastName,
          email: found.email,
        }));
      }
    }, CUSTOMER_LOOKUP_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [form.phone]);

  // Price the route as the addresses change rather than on blur: either end can
  // change without focus ever leaving it — picking a suggestion, say — and a
  // route only means anything once both ends are named. An hourly hire is
  // quoted by the hour, so it never asks for one.
  useEffect(() => {
    const pickup = form.pickup.trim();
    const dropoff = form.dropoff.trim();

    if (form.tripType !== "one-way" || !pickup || !dropoff) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setEstimateLoading(true);

      const next = await getRouteEstimate(pickup, dropoff);

      // A later edit already superseded this request.
      if (cancelled) {
        return;
      }

      setEstimate(next);
      setEstimateLoading(false);
    }, ROUTE_ESTIMATE_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [form.pickup, form.dropoff, form.tripType]);

  /** Drops the error on a field the customer has just corrected. */
  const clearError = useCallback((field: FieldName) => {
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  }, []);

  const onFieldChange = useCallback(
    (field: FieldName, value: string) => {
      setForm((current) => ({ ...current, [field]: value }));
      clearError(field);

      if (field === "pickup" || field === "dropoff") {
        setEstimate(null);
        setEstimateLoading(false);
      }
    },
    [clearError],
  );

  const onPhoneChange = useCallback(
    (value: string) => {
      onFieldChange("phone", value);
      setCustomer(null);
      setCustomerStatus("new");

      // Clearing the number clears whatever the lookup filled in for us.
      if (normalizePhone(value).length < PHONE_DIGITS) {
        setForm((current) => ({
          ...current,
          firstName: "",
          lastName: "",
          email: "",
        }));
      }
    },
    [onFieldChange],
  );

  // Switching tab clears the field: an address is never an airport, and
  // carrying one across would leave the mode flag contradicting the value.
  const onPickupModeChange = useCallback(
    (mode: LocationMode) => {
      if (mode === pickupMode) {
        return;
      }

      setPickupMode(mode);
      onFieldChange("pickup", "");
    },
    [pickupMode, onFieldChange],
  );

  const onDropoffModeChange = useCallback(
    (mode: LocationMode) => {
      if (mode === dropoffMode) {
        return;
      }

      setDropoffMode(mode);
      onFieldChange("dropoff", "");
    },
    [dropoffMode, onFieldChange],
  );

  // Each trip type requires a field the other doesn't, so retire the error the
  // switch just made irrelevant rather than leaving it on screen.
  const onTripTypeChange = useCallback(
    (tripType: TripType) => {
      setForm((current) => ({ ...current, tripType }));

      if (tripType === "hourly") {
        setEstimate(null);
        setEstimateLoading(false);
      }

      clearError(tripType === "hourly" ? "dropoff" : "durationHours");
    },
    [clearError],
  );

  const onAddStop = useCallback(() => {
    setForm((current) => ({ ...current, stops: [...current.stops, ""] }));
    setStopIds((current) => [...current, `stop-${nextStopId.current++}`]);
  }, []);

  // The one stops error covers the whole list, so any edit to the list retires
  // it — the next submit is what decides whether it comes back.
  const onRemoveStop = useCallback(
    (index: number) => {
      setForm((current) => ({
        ...current,
        stops: current.stops.filter((_, stopIndex) => stopIndex !== index),
      }));
      setStopIds((current) => current.filter((_, idIndex) => idIndex !== index));
      clearError("stops");
    },
    [clearError],
  );

  const onStopChange = useCallback(
    (index: number, value: string) => {
      setForm((current) => ({
        ...current,
        stops: current.stops.map((stop, stopIndex) =>
          stopIndex === index ? value : stop,
        ),
      }));
      clearError("stops");
    },
    [clearError],
  );

  const onDismissSuccess = useCallback(() => {
    setBookingId(null);
  }, []);

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmitMessage("");

      const nextErrors = validateBookingPayload(form);

      if (Object.keys(nextErrors).length) {
        setErrors(nextErrors);
        setSubmitMessage("Please check the highlighted fields.");
        return;
      }

      setSubmitState("submitting");

      try {
        // Only a one-way is priced off its route, and validation has already
        // insisted on both ends of it by here.
        const routeEstimate =
          form.tripType === "one-way"
            ? (estimate ?? (await getRouteEstimate(form.pickup, form.dropoff)))
            : null;
        const result = await createBooking({
          ...form,
          distance: routeEstimate?.distance,
          estimatedTravelTime: routeEstimate?.duration,
          pickupMode,
          dropoffMode,
        });

        if (!result.ok) {
          setErrors(result.errors);
          setSubmitMessage(result.message);
          setSubmitState("idle");
          return;
        }

        const savedCustomer: CustomerRecord = {
          phone: form.phone,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
        };

        writeCachedCustomer(savedCustomer);
        setCustomer(savedCustomer);
        setCustomerStatus("recognized");
        setEstimate(routeEstimate);
        setSubmitState("success");
        setBookingId(result.id);
      } catch {
        setSubmitState("idle");
        setSubmitMessage(
          "The mock booking service is unavailable. Please try again.",
        );
      }
    },
    [dropoffMode, estimate, form, pickupMode],
  );

  return {
    form,
    errors,
    stopIds,
    pickupMode,
    dropoffMode,
    customer,
    customerStatus,
    estimate,
    estimateLoading,
    submitState,
    submitMessage,
    bookingId,
    onFieldChange,
    onPhoneChange,
    onTripTypeChange,
    onPickupModeChange,
    onDropoffModeChange,
    onAddStop,
    onRemoveStop,
    onStopChange,
    onDismissSuccess,
    onSubmit,
  };
}
