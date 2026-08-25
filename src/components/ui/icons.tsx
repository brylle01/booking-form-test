import { cn } from "@/lib/utils";
import { BsCaretDownFill } from "react-icons/bs";
import { FaLocationDot, FaUser } from "react-icons/fa6";
import { FiAtSign, FiCalendar, FiCheck, FiClock, FiHash } from "react-icons/fi";
import { MdArrowCircleRight, MdOutlineHourglassTop } from "react-icons/md";

/*
 * react-icons render at 1em, so the icons below carry no size of their own —
 * whatever wrapper they land in sets the font-size that scales them.
 */

export function BrandLogo() {
  return (
    <div
      className="relative left-[2px] flex h-[22px] items-center justify-center gap-[6px] text-[20px] font-bold leading-[22px] tracking-[-0.65px] text-[#5968b5]"
      aria-label="ExampleIQ"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 96 76"
        fill="none"
        aria-hidden="true"
        focusable="false"
        className="h-[22px] w-[28px] shrink-0"
      >
        <g stroke="#5264B5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7.5 67.5V48C7.5 25.8 25.6 7.5 48 7.5S88.5 25.8 88.5 48v19.5" />
          <path d="M7.5 67.5h81" />
          <path d="M14.5 55.5V48C14.5 29.5 29.5 14.5 48 14.5S81.5 29.5 81.5 48v7.5" opacity=".9" />
          <path d="M16 47.5h6" />
          <path d="M20.8 30.5l5.2 3" />
          <path d="M34 18.8l3 5.2" />
          <path d="M48 16v6" />
          <path d="M62 18.8l-3 5.2" />
          <path d="M75.2 30.5l-5.2 3" />
          <path d="M80 47.5h-6" />
          <path d="M48 47.5V27.5" />
        </g>
        <circle cx="48" cy="48" r="4.2" fill="white" stroke="#5264B5" strokeWidth="2.5" />
      </svg>
      <span className="inline-block origin-left scale-x-[0.945]">ExampleIQ</span>
    </div>
  );
}

export function OneWayIcon() {
  return (
    <span className="inline-flex h-[18px] w-[18px] text-[18px] text-gold" aria-hidden="true">
      <MdArrowCircleRight />
    </span>
  );
}

export function HourglassIcon() {
  return <MdOutlineHourglassTop aria-hidden="true" className="h-[18px] w-[18px] text-muted" />;
}

export function CalendarIcon() {
  return <FiCalendar aria-hidden="true" />;
}

export function ClockIcon() {
  return <FiClock aria-hidden="true" />;
}

export function PinIcon() {
  return <FaLocationDot aria-hidden="true" />;
}

export function PersonIcon() {
  return <FaUser aria-hidden="true" />;
}

export function EmailIcon() {
  return <FiAtSign aria-hidden="true" />;
}

export function HashIcon() {
  return <FiHash aria-hidden="true" />;
}

export function CheckIcon() {
  return <FiCheck aria-hidden="true" />;
}

export function ChevronIcon() {
  return <BsCaretDownFill aria-hidden="true" />;
}

/** Stripes and star field are gradients — see `.us-flag` in globals.css. */
export function FlagIcon({ className }: { className?: string }) {
  return (
    <span className={cn("us-flag", className)} aria-hidden="true">
      <span className="flag-canton" />
    </span>
  );
}
