/**
 * Every type the booking form speaks in: the two pieces of flow state, and the
 * props of each component in this folder. Domain types (`BookingPayload`,
 * `FieldErrors`, ...) stay in `lib/booking`, which the API routes share.
 */

import type {
  BookingPayload,
  CustomerRecord,
  FieldErrors,
  FieldName,
  LocationMode,
  TripType,
} from "@/lib/booking";
import type { PlacePrediction } from "@/lib/places";
import type { RouteEstimate } from "@/lib/route-estimate";

/** Where the phone lookup has got to. */
export type CustomerStatus = "new" | "recognized" | "checking";

/** Where the submission has got to. Drives the button's label. */
export type SubmitState = "idle" | "submitting" | "success";

export type TripDetailsProps = {
  form: BookingPayload;
  errors: FieldErrors;
  /** Keys for the stop fields, parallel to `form.stops`. */
  stopIds: string[];
  pickupMode: LocationMode;
  dropoffMode: LocationMode;
  estimate: RouteEstimate | null;
  estimateLoading: boolean;
  onFieldChange: (field: FieldName, value: string) => void;
  onPickupModeChange: (mode: LocationMode) => void;
  onDropoffModeChange: (mode: LocationMode) => void;
  onAddStop: () => void;
  onRemoveStop: (index: number) => void;
  onStopChange: (index: number, value: string) => void;
};

export type RouteSummaryProps = {
  estimate: RouteEstimate | null;
  loading: boolean;
  tripType: TripType;
  durationHours: string;
};

export type ContactDetailsProps = {
  form: BookingPayload;
  errors: FieldErrors;
  customer: CustomerRecord | null;
  customerStatus: CustomerStatus;
  onFieldChange: (field: FieldName, value: string) => void;
  onPhoneChange: (value: string) => void;
};

export type ScheduleFieldsProps = {
  /** MM/DD/YYYY when it parses; whatever was typed otherwise. */
  date: string;
  /** 24-hour `HH:MM`. Every label the customer sees is 12-hour. */
  time: string;
  dateError?: string;
  timeError?: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
};

export type CalendarPanelProps = {
  /** The keyboard-focused day; its month is the one on screen. */
  cursor: Date;
  selected: Date | null;
  /** True once the keyboard is driving, at which point the grid takes focus. */
  focusGrid: boolean;
  onSelect: (date: Date) => void;
  onCursorChange: (date: Date) => void;
  onClose: () => void;
};

export type LocationModeTabsProps = {
  value: LocationMode;
  onChange: (value: LocationMode) => void;
  label: string;
  className?: string;
};

export type LocationFieldProps = {
  label: string;
  value: string;
  mode: LocationMode;
  error?: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
};

export type SuggestionListProps = {
  listId: string;
  suggestions: PlacePrediction[];
  activeIndex: number;
  onHighlight: (index: number) => void;
  onSelect: (place: PlacePrediction) => void;
};

export type SuccessModalProps = {
  bookingId: string;
  form: BookingPayload;
  estimate: RouteEstimate | null;
  onClose: () => void;
};