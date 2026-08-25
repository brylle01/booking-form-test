import { useEffect, useRef } from "react";
import type { MouseEvent } from "react";
import { AS_DIRECTED, formatTime12h } from "@/lib/booking";
import type { BookingPayload } from "@/lib/booking";
import type { RouteEstimate } from "@/lib/route-estimate";
import { CheckIcon } from "@/components/ui/icons";
import { FOCUS_RING } from "@/components/ui/fields";
import type { SuccessModalProps } from "@/components/booking-form/types";

/** What the customer just agreed to, read back to them. */
function summaryRows(form: BookingPayload, estimate: RouteEstimate | null) {
  const rows = [
    { label: "Pickup", value: `${form.date} at ${formatTime12h(form.time)}` },
    { label: "From", value: form.pickup },
    { label: "To", value: form.dropoff || AS_DIRECTED },
  ];

  if (form.tripType === "hourly") {
    const hours = Number(form.durationHours);

    rows.push({
      label: "Hire duration",
      value: `${hours} ${hours === 1 ? "hour" : "hours"}`,
    });
  } else if (estimate) {
    rows.push({
      label: "Distance",
      value: `${estimate.distance} · about ${estimate.duration}`,
    });
  }

  rows.push({ label: "Passengers", value: form.passengers });

  return rows;
}

/**
 * Mounted only once a booking exists, so it can open itself and stay open —
 * `showModal` is what makes the page behind it inert and Esc close it.
 */
export function SuccessModal({
  bookingId,
  form,
  estimate,
  onClose,
}: SuccessModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  // A click that lands on the dialog itself landed on the backdrop: the
  // content sits in a child, so nothing inside can produce this target.
  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-[min(408px,calc(100%-32px))] rounded-[8px] border border-[#e5dcc3] bg-white p-0 text-[#111111] backdrop:bg-[#111111]/40"
      aria-labelledby="booking-success-heading"
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      <div className="px-[24px] py-[26px]">
        <span
          className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-gold-wash text-[20px] text-gold"
          aria-hidden="true"
        >
          <CheckIcon />
        </span>
        <h2
          id="booking-success-heading"
          className="mt-[14px] mb-0 text-[19px] font-bold leading-[24px]"
        >
          You&apos;re booked
        </h2>
        <p className="mt-[6px] text-[13px] leading-[18px] text-muted">
          Confirmation{" "}
          <strong className="font-semibold text-[#8a6b23]">{bookingId}</strong>{" "}
          is on its way to {form.email.trim()}.
        </p>

        <dl className="mt-[18px] mb-0 grid grid-cols-[92px_minmax(0,1fr)] gap-x-[12px] gap-y-[8px] rounded-[4px] border border-[#e5dcc3] bg-[#fffdf7] px-[12px] py-[11px] text-[12px] leading-[16px]">
          {summaryRows(form, estimate).map((row) => (
            <div key={row.label} className="contents">
              <dt className="font-semibold text-[#8a6b23]">{row.label}</dt>
              <dd className="m-0 text-[#5f5a4b] break-words">{row.value}</dd>
            </div>
          ))}
        </dl>

        <button
          type="button"
          className={`mt-[20px] block h-[35px] w-full cursor-pointer rounded-[4px] border-0 bg-gold p-0 text-[12px] font-bold leading-[35px] text-white hover:bg-[#c4a447] ${FOCUS_RING}`}
          onClick={onClose}
          autoFocus
        >
          Done
        </button>
      </div>
    </dialog>
  );
}
