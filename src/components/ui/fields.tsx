import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The form primitives and the class strings shared by more than one of them.
 * Anything used once lives inline at its call site.
 */

export const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7884c3]";

export const SECTION_HEADING =
  "m-0 h-[19px] text-[15px] leading-[19px] text-[#0e0e0e] font-bold";

/** The bordered box a single-line field sits in. Width comes from the wrapper. */
export const FIELD_SHELL =
  "relative h-[38px] w-full rounded-[4px] border border-field-border bg-white";

export const FIELD_ERROR_BORDER = "border-[#c76c5e]";

export const FIELD_INPUT =
  "h-[36px] w-full bg-transparent px-[12px] text-[15px] leading-[20px] text-field-text outline-0 placeholder:text-[#c3c3c3] placeholder:opacity-100";

/** The small caption that straddles a field's top border. */
export const FLOATING_LABEL =
  "absolute left-[10px] top-[-8px] z-2 h-[14px] whitespace-nowrap bg-white px-[2px] text-[11px] font-normal leading-[14px] text-muted";

/**
 * Icons are react-icons, which size themselves at 1em, so the wrapper's
 * font-size is what actually scales them.
 */
export const FIELD_ICON =
  "pointer-events-none absolute top-1/2 z-1 flex -translate-y-1/2 items-center justify-center text-gold";

/** Offset + size for the icon inside a labelled TextField. */
export const FIELD_ICON_SIZE = "left-[14px] h-[10px] w-[10px] text-[16px]";

/**
 * In the flow, not absolute — an absolute message reserves no space, so the
 * next field would overlap it and paint over half the text.
 */
export const FIELD_ERROR = "mt-[3px] text-[11px] leading-[14px] text-[#b74336]";

/** Segmented control: shared button chrome, plus the selected treatment. */
const TAB_BUTTON = `cursor-pointer border-0 bg-white ${FOCUS_RING}`;

/**
 * An inset ring, not a border: a real border would shrink the button's content
 * box by 2px on selection, and the labels are wide enough that the text has no
 * slack to absorb it — it would visibly jump sideways as you switch tabs.
 */
const TAB_BUTTON_ACTIVE =
  "inset-ring-2 inset-ring-gold-dark bg-gold-wash text-gold";

type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: ReactNode;
  /** Sizing and type for this tab. */
  className?: string;
  /** Corner rounding, matched to the container's radius. */
  activeClassName?: string;
};

/** A row of mutually exclusive tabs, one of which is always selected. */
export function SegmentedTabs<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<SegmentedOption<T>>;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn("flex overflow-hidden", className)}
      role="group"
      aria-label={label}
    >
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            className={cn(
              TAB_BUTTON,
              option.className,
              isActive && `${TAB_BUTTON_ACTIVE} ${option.activeClassName ?? ""}`,
            )}
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
          >
            {option.icon}
            {option.icon ? <span>{option.label}</span> : option.label}
          </button>
        );
      })}
    </div>
  );
}

export function TextField({
  label,
  value,
  placeholder,
  icon,
  error,
  type = "text",
  inputMode,
  autoComplete,
  min,
  max,
  onChange,
  className,
  inputClassName,
  ariaLabel,
}: {
  label?: string;
  value: string;
  placeholder?: string;
  icon?: ReactNode;
  error?: string;
  type?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  min?: string | number;
  max?: string | number;
  onChange: (value: string) => void;
  className?: string;
  inputClassName?: string;
  ariaLabel?: string;
}) {
  return (
    <div className={className}>
      <div className={cn(FIELD_SHELL, error && FIELD_ERROR_BORDER)}>
        {label ? <span className={FLOATING_LABEL}>{label}</span> : null}
        {icon ? (
          <span className={cn(FIELD_ICON, FIELD_ICON_SIZE)}>{icon}</span>
        ) : null}
        <input
          aria-label={ariaLabel ?? label ?? placeholder}
          aria-invalid={Boolean(error)}
          className={cn(
            FIELD_INPUT,
            label && "relative top-[-2px] pl-[34px] tracking-[-0.35px]",
            inputClassName,
          )}
          type={type}
          inputMode={inputMode}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          min={min}
          max={max}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      {error ? <p className={FIELD_ERROR}>{error}</p> : null}
    </div>
  );
}
