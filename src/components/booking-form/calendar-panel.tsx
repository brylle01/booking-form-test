"use client";

import { useEffect, useMemo, useRef } from "react";
import type { KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { ChevronIcon } from "@/components/ui/icons";
import { FOCUS_RING } from "@/components/ui/fields";
import type { CalendarPanelProps } from "@/components/booking-form/types";

const NAV_BUTTON = cn(
  "flex h-[24px] w-[24px] cursor-pointer items-center justify-center rounded-[4px] border-0 bg-transparent p-0 text-[9px] text-[#53596a] hover:bg-gold-wash",
  FOCUS_RING,
);

const DAY_CELL = cn(
  "flex h-[28px] w-[32px] cursor-pointer items-center justify-center rounded-[4px] border-0 bg-transparent p-0 text-[13px] leading-[17px] text-field-text hover:bg-gold-wash",
  FOCUS_RING,
);

/** Fixed to en-US because the field itself is MM/DD/YYYY. */
const MONTH_LABEL = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

const FULL_DAY_LABEL = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** Six rows always, so the panel never changes height between months. */
const WEEKS = 6;

const ARROW_STEPS: Record<string, number> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -7,
  ArrowDown: 7,
};

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  // Clamp to the last day of the target month so 03/31 → 02/28 rather than
  // rolling forward into March again.
  const next = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(date.getDate(), lastDay));
  return next;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildWeeks(month: Date) {
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  // Back up to the Sunday on or before the 1st.
  const gridStart = addDays(firstOfMonth, -firstOfMonth.getDay());

  return Array.from({ length: WEEKS }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(gridStart, week * 7 + day)),
  );
}

/**
 * The month grid itself: a roving-tabindex calendar driven entirely by the
 * `cursor` its owner holds. Mounted only while the picker is open.
 */
export function CalendarPanel({
  cursor,
  selected,
  focusGrid,
  onSelect,
  onCursorChange,
  onClose,
}: CalendarPanelProps) {
  const cursorRef = useRef<HTMLButtonElement>(null);
  const followCursorRef = useRef(false);

  const weeks = useMemo(() => buildWeeks(cursor), [cursor]);
  // Client-only: the panel is never open on the first render, so reading the
  // clock here cannot disagree with the server's.
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    if (focusGrid) {
      cursorRef.current?.focus();
    }
  }, [focusGrid]);

  useEffect(() => {
    // Only arrow keys ask focus to follow the cursor. A click that merely
    // opened the panel must leave focus in the input so typing still works,
    // and crossing a month boundary re-keys the whole grid — the old button
    // unmounts and focus lands on <body> — so the flag, not the DOM, is what
    // says whether the keyboard was driving.
    if (followCursorRef.current) {
      followCursorRef.current = false;
      cursorRef.current?.focus();
    }
  }, [cursor]);

  function handleGridKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    const step = ARROW_STEPS[event.key];
    if (step) {
      event.preventDefault();
      followCursorRef.current = true;
      onCursorChange(addDays(cursor, step));
      return;
    }

    if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      followCursorRef.current = true;
      onCursorChange(addMonths(cursor, event.key === "PageUp" ? -1 : 1));
    }
  }

  return (
    <div
      className="absolute left-0 top-[52px] z-20 w-[244px] rounded-[4px] border border-field-border bg-white p-[10px] shadow-[0_6px_18px_rgba(17,17,17,0.12)]"
      role="dialog"
      aria-label="Choose pickup date"
      // Keep focus where it is so clicking chrome never blurs the field.
      onMouseDown={(event) => event.preventDefault()}
    >
      <div className="mb-[6px] flex items-center justify-between">
        <button
          type="button"
          className={cn(NAV_BUTTON, "rotate-90")}
          onClick={() => onCursorChange(addMonths(cursor, -1))}
          aria-label="Previous month"
        >
          <ChevronIcon />
        </button>
        <span
          className="text-[13px] font-bold leading-[17px] text-[#0e0e0e]"
          aria-live="polite"
        >
          {MONTH_LABEL.format(cursor)}
        </span>
        <button
          type="button"
          className={cn(NAV_BUTTON, "-rotate-90")}
          onClick={() => onCursorChange(addMonths(cursor, 1))}
          aria-label="Next month"
        >
          <ChevronIcon />
        </button>
      </div>

      <div className="grid grid-cols-7" aria-hidden="true">
        {WEEKDAYS.map((weekday) => (
          <span
            key={weekday}
            className="flex h-[20px] w-[32px] items-center justify-center text-[11px] leading-[14px] text-muted"
          >
            {weekday}
          </span>
        ))}
      </div>

      {/* Roving tabindex: only the cursor day is tabbable, arrows move it. */}
      <div className="grid grid-cols-7" onKeyDown={handleGridKeyDown}>
        {weeks.flat().map((day) => {
          const isCursor = isSameDay(day, cursor);
          const isSelected = Boolean(selected && isSameDay(day, selected));
          const isOutside = day.getMonth() !== cursor.getMonth();

          return (
            <button
              key={day.toDateString()}
              ref={isCursor ? cursorRef : null}
              type="button"
              tabIndex={isCursor ? 0 : -1}
              aria-pressed={isSelected}
              aria-label={FULL_DAY_LABEL.format(day)}
              className={cn(
                DAY_CELL,
                isOutside && "text-[#c1c1c1]",
                isSameDay(day, today) && "font-bold text-gold",
                isSelected && "bg-gold text-white hover:bg-gold",
              )}
              onClick={() => onSelect(day)}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
