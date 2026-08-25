"use client";

import { BrandLogo, HourglassIcon, OneWayIcon } from "@/components/ui/icons";
import { FOCUS_RING, SegmentedTabs } from "@/components/ui/fields";
import { cn } from "@/lib/utils";
import { useBookingForm } from "@/components/booking-form/hooks/use-booking-form";
import type { SubmitState } from "@/components/booking-form/types";
import { TripDetails } from "@/components/booking-form/trip-details";
import { ContactDetails } from "@/components/booking-form/contact-details";
import { SuccessModal } from "@/components/booking-form/success-modal";

const SUBMIT_LABELS: Record<SubmitState, string> = {
  idle: "Continue",
  submitting: "Submitting...",
  success: "Booked",
};

const TRIP_TAB =
  "flex h-[29px] w-1/2 items-center justify-center gap-[10px] text-[15px] leading-[20px] text-[#747474]";

const SUBMIT_BUTTON = cn(
  "mt-[21px] block h-[35px] w-full cursor-pointer rounded-[4px] border-0 bg-gold p-0 text-[12px] font-bold leading-[35px] text-white hover:bg-[#c4a447] disabled:cursor-wait",
  FOCUS_RING,
);

/**
 * The whole booking flow: trip type, the trip itself, who is travelling, and
 * the confirmation. State lives in `useBookingForm`; everything here renders
 * it and hands interactions back.
 */
export function BookingForm() {
  const {
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
  } = useBookingForm();

  return (
    <main className="min-h-screen w-full bg-white px-[16px] pt-[15px] pb-[35px]">
      <div className="relative left-[-1px] mx-auto w-[min(518px,100%)]">
        <BrandLogo />
        <h1 className="mt-[39px] mb-[23px] h-[26px] text-[22px] font-normal leading-[26px] tracking-[-0.04px] text-[#111111]">
          Let&apos;s get you on your way!
        </h1>
        <SegmentedTabs
          label="Trip type"
          value={form.tripType}
          onChange={onTripTypeChange}
          className="h-[31px] w-full rounded-[7px] border border-[#e3e3e3]"
          options={[
            {
              value: "one-way",
              label: "One-way",
              icon: <OneWayIcon />,
              className: TRIP_TAB,
              activeClassName: "rounded-l-[6px]",
            },
            {
              value: "hourly",
              label: "Hourly",
              icon: <HourglassIcon />,
              className: TRIP_TAB,
              activeClassName: "rounded-r-[6px]",
            },
          ]}
        />

        <form className="w-full" onSubmit={onSubmit} noValidate>
          <TripDetails
            form={form}
            errors={errors}
            stopIds={stopIds}
            pickupMode={pickupMode}
            dropoffMode={dropoffMode}
            estimate={estimate}
            estimateLoading={estimateLoading}
            onFieldChange={onFieldChange}
            onPickupModeChange={onPickupModeChange}
            onDropoffModeChange={onDropoffModeChange}
            onAddStop={onAddStop}
            onRemoveStop={onRemoveStop}
            onStopChange={onStopChange}
          />

          <ContactDetails
            form={form}
            errors={errors}
            customer={customer}
            customerStatus={customerStatus}
            onFieldChange={onFieldChange}
            onPhoneChange={onPhoneChange}
          />

          {submitMessage ? (
            <p
              className="mt-[16px] mb-[-8px] text-[12px] leading-[16px] text-[#b74336]"
              role="alert"
            >
              {submitMessage}
            </p>
          ) : null}
          <button
            className={SUBMIT_BUTTON}
            type="submit"
            disabled={submitState === "submitting"}
          >
            {SUBMIT_LABELS[submitState]}
          </button>
        </form>
      </div>

      {bookingId ? (
        <SuccessModal
          bookingId={bookingId}
          form={form}
          estimate={estimate}
          onClose={onDismissSuccess}
        />
      ) : null}
    </main>
  );
}
