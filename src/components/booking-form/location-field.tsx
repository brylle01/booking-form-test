"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { placeToAddress, searchPlaces } from "@/lib/places";
import type { PlacePrediction } from "@/lib/places";
import { cn } from "@/lib/utils";
import { ChevronIcon, PinIcon } from "@/components/ui/icons";
import {
  FIELD_ERROR,
  FIELD_ERROR_BORDER,
  FIELD_ICON,
  FIELD_INPUT,
  FIELD_SHELL,
  FLOATING_LABEL,
  SegmentedTabs,
} from "@/components/ui/fields";
import type {
  LocationFieldProps,
  LocationModeTabsProps,
  SuggestionListProps,
} from "@/components/booking-form/types";

const LOCATION_TAB =
  "h-[28px] whitespace-nowrap px-[8px] text-[15px] leading-[20px] text-[#767676]";

/** The pin sits tighter to the edge and smaller than a TextField icon. */
const LOCATION_ICON_SIZE = "left-[6px] h-[13px] w-[10px] text-[13px]";

/** Sits above the fields below it, so `z-20` beats their `z-2` labels. */
const SUGGESTION_PANEL =
  "absolute left-0 right-0 top-[40px] z-20 overflow-hidden rounded-[4px] border border-field-border bg-white shadow-[0_6px_18px_rgba(17,17,17,0.12)]";

/** Picks which set of places a `LocationField` alongside it offers. */
export function LocationModeTabs({
  value,
  onChange,
  label,
  className,
}: LocationModeTabsProps) {
  return (
    <SegmentedTabs
      label={`${label} type`}
      value={value}
      onChange={onChange}
      // 140px, not 138: the tabs below are 74 + 64, and `border-box` sizing
      // means the 1px borders come out of that width. At 138 the second tab
      // overflowed by 2px and `overflow-hidden` shaved its right border off.
      className={cn(
        "h-[30px] w-[140px] rounded-[8px] border border-[#dddddd] bg-white",
        className,
      )}
      options={[
        {
          value: "location",
          label: "Location",
          className: `${LOCATION_TAB} w-[74px] shrink-0`,
          activeClassName: "rounded-l-[7px]",
        },
        {
          value: "airport",
          label: "Airport",
          className: `${LOCATION_TAB} w-[64px] shrink-0`,
          activeClassName: "rounded-r-[7px]",
        },
      ]}
    />
  );
}

function SuggestionList({
  listId,
  suggestions,
  activeIndex,
  onHighlight,
  onSelect,
}: SuggestionListProps) {
  const activeRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!suggestions.length) {
    return (
      <div className={cn(SUGGESTION_PANEL, "px-[12px] py-[10px]")}>
        <p className="m-0 text-[12px] leading-[16px] text-muted">
          No matching places — you can still type any address.
        </p>
      </div>
    );
  }

  return (
    <ul
      className={cn(SUGGESTION_PANEL, "max-h-[212px] list-none overflow-y-auto p-0")}
      id={listId}
      role="listbox"
    >
      {suggestions.map((place, index) => {
        const isActive = index === activeIndex;

        return (
          <li
            key={place.id}
            id={`${listId}-${index}`}
            ref={isActive ? activeRef : null}
            role="option"
            aria-selected={isActive}
            className={cn(
              "flex cursor-pointer items-start gap-[9px] px-[11px] py-[8px] text-[13px] leading-[17px]",
              isActive ? "bg-gold-wash" : "bg-white",
            )}
            // Keep focus in the input so the click lands as a selection.
            onMouseDown={(event) => event.preventDefault()}
            onMouseEnter={() => onHighlight(index)}
            onClick={() => onSelect(place)}
          >
            <span className="mt-[2px] flex h-[13px] w-[10px] shrink-0 items-center justify-center text-[13px] text-gold">
              <PinIcon />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-field-text">
                {place.mainText}
              </span>
              <span className="block truncate text-[12px] leading-[16px] text-muted">
                {place.secondaryText}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * A Places-style combobox: free text with a suggestion list, keyboard
 * navigation and selection. Suggestions come from mock data — `searchPlaces`
 * is the seam to swap in a real service. Both modes are pickers over disjoint
 * sets, airports on one and everything else on the other, so a suggestion can
 * never contradict the selected tab.
 */
export function LocationField({
  label,
  value,
  mode,
  error,
  onChange,
  className,
  placeholder = "Address or place",
}: LocationFieldProps) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const suggestions = useMemo(() => searchPlaces(value, mode), [value, mode]);

  const close = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
  }, []);

  // Any click outside the field dismisses the list.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        close();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen, close]);

  const selectSuggestion = useCallback(
    (place: PlacePrediction) => {
      onChange(placeToAddress(place));
      close();
    },
    [onChange, close],
  );

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      close();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();

      if (!isOpen) {
        setIsOpen(true);
        setActiveIndex(0);
        return;
      }

      if (!suggestions.length) {
        return;
      }

      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex(
        (current) => (current + step + suggestions.length) % suggestions.length,
      );
      return;
    }

    if (event.key === "Enter" && isOpen && activeIndex >= 0) {
      // Choose the highlighted place instead of submitting the form.
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    }
  }

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <div className={cn(FIELD_SHELL, error && FIELD_ERROR_BORDER)}>
        <span className={FLOATING_LABEL}>
          {mode === "airport" ? "Airport" : label}
        </span>
        <span className={cn(FIELD_ICON, LOCATION_ICON_SIZE)}>
          <PinIcon />
        </span>
        <input
          aria-label={label}
          aria-invalid={Boolean(error)}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listId : undefined}
          aria-activedescendant={
            activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
          }
          autoComplete="off"
          className={cn(
            FIELD_INPUT,
            "relative top-[-2px] pl-[30px] pr-[34px] tracking-[-0.08px] text-ellipsis",
          )}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={mode === "airport" ? "Search airports" : placeholder}
        />
        <span
          className={cn(
            "pointer-events-none absolute right-[13px] top-1/2 flex h-[8px] w-[12px] -translate-y-1/2 items-center text-[8px] text-[#7d7d7d] transition-transform",
            isOpen && "rotate-180",
          )}
        >
          <ChevronIcon />
        </span>
      </div>
      {isOpen ? (
        <SuggestionList
          listId={listId}
          suggestions={suggestions}
          activeIndex={activeIndex}
          onHighlight={setActiveIndex}
          onSelect={selectSuggestion}
        />
      ) : null}
      {error ? <p className={FIELD_ERROR}>{error}</p> : null}
    </div>
  );
}
