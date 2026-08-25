"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { TIME_OPTIONS, formatDate, parseDate } from "@/lib/booking";
import { cn } from "@/lib/utils";
import { CalendarIcon, ClockIcon } from "@/components/ui/icons";
import { FIELD_ERROR_BORDER } from "@/components/ui/fields";
import { CalendarPanel } from "@/components/booking-form/calendar-panel";
import type { ScheduleFieldsProps } from "@/components/booking-form/types";

const SCHEDULE_CONTROL =
  "relative h-[62px] rounded-[4px] border border-field-border bg-white";

const SCHEDULE_ICON =
  "pointer-events-none absolute left-[8px] top-1/2 z-1 flex h-[14px] w-[14px] -translate-y-1/2 items-center justify-center text-[14px] text-gold";

/** Both schedule fields are a bordered box floated inside the outer control. */
const SCHEDULE_INPUT =
  "absolute top-[15px] h-[30px] border border-[#8e8e8e] bg-transparent px-[8px] text-[15.3px] leading-[28px] text-[#53596a] outline-0 placeholder:text-[#c1c1c1] placeholder:opacity-100";

/**
 * When the car is wanted: a typed date backed by a calendar, and a
 * quarter-hourly time.
 *
 * The calendar's `cursor` doubles as its open state — a Date means open and
 * focused on that day, null means closed. It starts null so the server render
 * never calls `new Date()`, whose disagreement with the client clock would
 * surface as a hydration mismatch.
 */
export function ScheduleFields({
  date,
  time,
  dateError,
  timeError,
  onDateChange,
  onTimeChange,
}: ScheduleFieldsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [cursor, setCursor] = useState<Date | null>(null);
  // Opening with the keyboard moves focus into the grid; opening with a click
  // leaves it in the input so typing a date still works.
  const [focusGrid, setFocusGrid] = useState(false);
  // Handing focus back to the input fires its focus handler, which would
  // otherwise reopen the panel we just closed.
  const skipNextOpenRef = useRef(false);

  const selected = useMemo(() => parseDate(date), [date]);
  const isOpen = cursor !== null;

  const close = useCallback(() => {
    setCursor(null);
    setFocusGrid(false);
  }, []);

  const open = useCallback(
    (options?: { focusGrid?: boolean }) => {
      setFocusGrid(Boolean(options?.focusGrid));
      setCursor(
        (current) => current ?? (selected ? new Date(selected) : new Date()),
      );
    },
    [selected],
  );

  /** Escape and picking a day both hand focus back to the field. */
  const dismiss = useCallback(() => {
    close();
    skipNextOpenRef.current = true;
    inputRef.current?.focus();
  }, [close]);

  // Any click outside the field or panel dismisses the calendar.
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

  function handleInputFocus() {
    if (skipNextOpenRef.current) {
      skipNextOpenRef.current = false;
      return;
    }

    open();
  }

  function handleInputChange(next: string) {
    onDateChange(next);

    // Follow along as a valid date is typed, without opening the panel.
    const typed = parseDate(next);
    if (typed) {
      setCursor((current) => (current ? typed : current));
    }
  }

  /**
   * Arrow keys inside the text field would fight the caret, so the input only
   * opens and closes — day-by-day navigation lives in the grid.
   */
  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      close();
      return;
    }

    // Down arrow opens the calendar, and hands it focus whether it opened just
    // now or was already showing from a click.
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (isOpen) {
        setFocusGrid(true);
      } else {
        open({ focusGrid: true });
      }
    }
  }

  return (
    <>
      {/* Date column shrinks first, then the time column, as the page narrows. */}
      <div className="mt-[18px] grid h-[62px] grid-cols-[239px_132px] gap-[11px] max-[560px]:grid-cols-[minmax(0,1fr)_132px] max-[430px]:grid-cols-[minmax(0,1fr)_minmax(112px,132px)] max-[430px]:gap-[10px] max-[350px]:grid-cols-[minmax(0,1fr)_112px]">
        <div
          className={cn(SCHEDULE_CONTROL, dateError && FIELD_ERROR_BORDER)}
          ref={containerRef}
        >
          <span className={SCHEDULE_ICON}>
            <CalendarIcon />
          </span>
          <input
            ref={inputRef}
            aria-label="Pickup date"
            aria-invalid={Boolean(dateError)}
            aria-haspopup="dialog"
            className={cn(
              SCHEDULE_INPUT,
              "right-[15px] w-[187px] cursor-pointer max-[560px]:w-[calc(100%-51px)]",
            )}
            value={date}
            onChange={(event) => handleInputChange(event.target.value)}
            onFocus={handleInputFocus}
            onClick={() => open()}
            onKeyDown={handleInputKeyDown}
            placeholder="05/13/2023"
            inputMode="numeric"
            autoComplete="off"
          />
          {cursor ? (
            <CalendarPanel
              cursor={cursor}
              selected={selected}
              focusGrid={focusGrid}
              onSelect={(day) => {
                onDateChange(formatDate(day));
                dismiss();
              }}
              onCursorChange={setCursor}
              onClose={dismiss}
            />
          ) : null}
        </div>
        <div className={cn(SCHEDULE_CONTROL, timeError && FIELD_ERROR_BORDER)}>
          <span className={SCHEDULE_ICON}>
            <ClockIcon />
          </span>
          <select
            aria-label="Pickup time"
            aria-invalid={Boolean(timeError)}
            className={cn(
              SCHEDULE_INPUT,
              "left-[29px] right-[10px] max-[430px]:left-[27px] max-[430px]:text-[14px] max-[350px]:left-[24px] max-[350px]:right-[6px] max-[350px]:text-[13px] cursor-pointer appearance-none border-0",
            )}
            value={time}
            onChange={(event) => onTimeChange(event.target.value)}
          >
            {TIME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {dateError || timeError ? (
        <p className="mt-[5px] mb-[-5px] text-[12px] leading-[16px] text-[#b74336]">
          {dateError ?? timeError}
        </p>
      ) : null}
    </>
  );
}
