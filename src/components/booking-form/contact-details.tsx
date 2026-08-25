import { MAX_PASSENGERS, MIN_PASSENGERS } from "@/lib/booking";
import { cn } from "@/lib/utils";
import {
  EmailIcon,
  FlagIcon,
  HashIcon,
  PersonIcon,
} from "@/components/ui/icons";
import { SECTION_HEADING, TextField } from "@/components/ui/fields";
import type { ContactDetailsProps } from "@/components/booking-form/types";

/** Wraps onto a second line rather than clipping on narrow screens. */
const LOOKUP_MESSAGE =
  "relative top-[1px] mt-[10px] mb-0 h-[18px] whitespace-nowrap text-[12.8px] leading-[18px] tracking-[-0.12px] max-[560px]:h-auto max-[560px]:min-h-[18px] max-[560px]:whitespace-normal";

function LookupMessage({
  customer,
  customerStatus,
}: Pick<ContactDetailsProps, "customer" | "customerStatus">) {
  if (customerStatus === "recognized" && customer) {
    return (
      <p className={cn(LOOKUP_MESSAGE, "text-[#887027]")}>
        Welcome back, {customer.firstName}.
      </p>
    );
  }

  return (
    <p className={cn(LOOKUP_MESSAGE, "text-muted")}>
      {customerStatus === "checking"
        ? "Checking your phone number..."
        : "We don't have that phone number on file. Please provide additional contact information."}
    </p>
  );
}

/** Who is travelling. A recognized caller has their details filled in for them. */
export function ContactDetails({
  form,
  errors,
  customer,
  customerStatus,
  onFieldChange,
  onPhoneChange,
}: ContactDetailsProps) {
  return (
    <section className="mt-[24px]" aria-labelledby="contact-heading">
      <h2 id="contact-heading" className={SECTION_HEADING}>
        Contact Information
      </h2>
      {/* The flag is anchored to the field's top edge, so an error message
          growing underneath cannot drag it out of place. */}
      <div className="relative mt-[13px]">
        <TextField
          value={form.phone}
          placeholder="+1 774 415 3244"
          ariaLabel="Phone number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          inputClassName="relative top-[-1px] pl-[61px] text-[15.7px] text-[#515969]"
          error={errors.phone}
          onChange={onPhoneChange}
        />
        <FlagIcon className="absolute left-[20px] top-[9px]" />
      </div>
      <LookupMessage customer={customer} customerStatus={customerStatus} />
      {customerStatus !== "recognized" ? (
        <>
          <div className="mt-[17px] grid grid-cols-2 gap-[14px] max-[430px]:grid-cols-1 max-[430px]:gap-[11px]">
            <TextField
              label="First name"
              value={form.firstName}
              placeholder="First name"
              icon={<PersonIcon />}
              autoComplete="given-name"
              className="w-full"
              error={errors.firstName}
              onChange={(value) => onFieldChange("firstName", value)}
            />
            <TextField
              label="Last name"
              value={form.lastName}
              placeholder="Last name"
              icon={<PersonIcon />}
              autoComplete="family-name"
              className="w-full"
              error={errors.lastName}
              onChange={(value) => onFieldChange("lastName", value)}
            />
          </div>
          <TextField
            label="Email"
            value={form.email}
            placeholder="name@example.com"
            icon={<EmailIcon />}
            type="email"
            autoComplete="email"
            className="mt-[11px]"
            inputClassName="tracking-[-0.48px]"
            error={errors.email}
            onChange={(value) => onFieldChange("email", value)}
          />
        </>
      ) : null}
      <p className="mt-[11px] mb-0 h-[19px] text-[13px] leading-[19px] text-[#6d6d6d]">
        How many passengers are expected for the trip?
      </p>
      <TextField
        label="# Passengers"
        value={form.passengers}
        placeholder=""
        icon={<HashIcon />}
        type="number"
        inputMode="numeric"
        min={MIN_PASSENGERS}
        max={MAX_PASSENGERS}
        className="mt-[16px] w-[186px]"
        error={errors.passengers}
        onChange={(value) => onFieldChange("passengers", value)}
      />
    </section>
  );
}
