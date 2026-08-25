import {
  AS_DIRECTED,
  HOURLY_MAX_HOURS,
  HOURLY_MIN_HOURS,
} from "@/lib/booking";
import { cn } from "@/lib/utils";
import { HourglassIcon } from "@/components/ui/icons";
import {
  FOCUS_RING,
  SECTION_HEADING,
  TextField,
} from "@/components/ui/fields";
import { ScheduleFields } from "@/components/booking-form/schedule-fields";
import {
  LocationField,
  LocationModeTabs,
} from "@/components/booking-form/location-field";
import type {
  RouteSummaryProps,
  TripDetailsProps,
} from "@/components/booking-form/types";

/*
 * Where and when. Placeholder text throughout is sample copy — the form starts
 * empty, so nothing shown as a hint is ever submitted.
 */

const SUMMARY_BOX =
  "mt-[12px] flex flex-wrap gap-x-[22px] gap-y-[8px] rounded-[4px] border border-[#e5dcc3] bg-[#fffdf7] px-[11px] py-[9px] text-[12px] leading-[16px] text-[#5f5a4b]";

const SUMMARY_LABEL = "font-semibold text-[#8a6b23]";

const CALCULATING = "Calculating...";

/**
 * Two different quotes. A one-way is priced off the route, so distance and
 * travel time are the summary. An hourly hire is priced off the block of time,
 * so the hours lead and the route — if a drop off was named at all — is only
 * context.
 */
function RouteSummary({
  estimate,
  loading,
  tripType,
  durationHours,
}: RouteSummaryProps) {
  const hours = Number(durationHours);
  const showHours =
    tripType === "hourly" && Number.isInteger(hours) && hours > 0;

  if (!showHours && !estimate && !loading) {
    return null;
  }

  return (
    <div className={SUMMARY_BOX} role="status" aria-live="polite">
      {showHours ? (
        <span>
          <strong className={SUMMARY_LABEL}>Hire duration</strong> {hours}{" "}
          {hours === 1 ? "hour" : "hours"}
        </span>
      ) : null}
      {estimate || loading ? (
        <>
          <span>
            <strong className={SUMMARY_LABEL}>Distance</strong>{" "}
            {loading ? CALCULATING : estimate?.distance}
          </span>
          <span>
            <strong className={SUMMARY_LABEL}>
              {tripType === "hourly"
                ? "Estimated driving time"
                : "Estimated travel time"}
            </strong>{" "}
            {loading ? CALCULATING : estimate?.duration}
          </span>
        </>
      ) : null}
      {!loading && estimate?.source === "estimate" ? (
        <small className="w-full text-[11px] text-[#8b877c]">
          Approximate until Google Maps is configured.
        </small>
      ) : null}
    </div>
  );
}

export function TripDetails({
  form,
  errors,
  stopIds,
  pickupMode,
  dropoffMode,
  estimate,
  estimateLoading,
  onFieldChange,
  onPickupModeChange,
  onDropoffModeChange,
  onAddStop,
  onRemoveStop,
  onStopChange,
}: TripDetailsProps) {
  // On an hourly hire the car stays with the passenger, so a destination is
  // something they may name or leave to the driver on the day.
  const dropoffOptional = form.tripType === "hourly";

  return (
    <>
      <section className="mt-[25px]" aria-labelledby="pickup-heading">
        <h2 id="pickup-heading" className={SECTION_HEADING}>
          Pickup
        </h2>
        <ScheduleFields
          date={form.date}
          time={form.time}
          dateError={errors.date}
          timeError={errors.time}
          onDateChange={(value) => onFieldChange("date", value)}
          onTimeChange={(value) => onFieldChange("time", value)}
        />

        {/* An hourly hire is sold by the block, so the length replaces the
            destination as the thing the quote is built from. */}
        {form.tripType === "hourly" ? (
          <TextField
            label="Duration (hours)"
            ariaLabel="Hire duration in hours"
            value={form.durationHours}
            error={errors.durationHours}
            icon={<HourglassIcon />}
            type="number"
            inputMode="numeric"
            min={HOURLY_MIN_HOURS}
            max={HOURLY_MAX_HOURS}
            placeholder="4"
            onChange={(value) => onFieldChange("durationHours", value)}
            className="mt-[20px] w-[132px]"
          />
        ) : null}

        <LocationModeTabs
          label="Pickup"
          value={pickupMode}
          onChange={onPickupModeChange}
          className="mt-[15px]"
        />
        <LocationField
          label="Location"
          value={form.pickup}
          mode={pickupMode}
          error={errors.pickup}
          onChange={(value) => onFieldChange("pickup", value)}
          className="mt-[15px]"
          placeholder="Clintons Bar & Grille, High Street, Clinton, MA, USA"
        />
        <button
          className={cn(
            "mt-[19px] ml-[7px] block h-[18px] cursor-pointer border-0 bg-transparent p-0 text-[13px] leading-[18px] text-gold hover:underline focus-visible:underline",
            FOCUS_RING,
          )}
          type="button"
          onClick={onAddStop}
        >
          + Add a stop
        </button>
        {form.stops.map((stop, index) => (
          <div className="relative" key={stopIds[index]}>
            <LocationField
              label={`Stop ${index + 1}`}
              value={stop}
              mode="location"
              onChange={(value) => onStopChange(index, value)}
              className="mt-[12px]"
            />
            <button
              className={cn(
                "absolute right-[10px] top-[8px] cursor-pointer border-0 bg-transparent text-[11px] text-[#a87525]",
                FOCUS_RING,
              )}
              type="button"
              onClick={() => onRemoveStop(index)}
              aria-label={`Remove stop ${index + 1}`}
            >
              Remove
            </button>
          </div>
        ))}
        {/* One message for the whole list: the rule is about the set of stops,
            not about any single one of them. */}
        {errors.stops ? (
          <p className="mt-[6px] text-[11px] leading-[14px] text-[#b74336]">
            {errors.stops}
          </p>
        ) : null}
      </section>

      <section className="mt-[35px]" aria-labelledby="dropoff-heading">
        <h2 id="dropoff-heading" className={SECTION_HEADING}>
          Drop off
        </h2>
        {dropoffOptional ? (
          <p className="mt-[5px] text-[12px] leading-[16px] text-muted">
            Optional — leave it blank to be driven as directed.
          </p>
        ) : null}
        <LocationModeTabs
          label="Drop off"
          value={dropoffMode}
          onChange={onDropoffModeChange}
          className="mt-[7px]"
        />
        <LocationField
          label={dropoffOptional ? "Location (optional)" : "Location"}
          value={form.dropoff}
          mode={dropoffMode}
          error={errors.dropoff}
          onChange={(value) => onFieldChange("dropoff", value)}
          className="mt-[14px]"
          placeholder={
            dropoffOptional
              ? AS_DIRECTED
              : "Logan Airport Terminal B, Boston, MA, USA"
          }
        />
      </section>

      <RouteSummary
        estimate={estimate}
        loading={estimateLoading}
        tripType={form.tripType}
        durationHours={form.durationHours}
      />
    </>
  );
}
