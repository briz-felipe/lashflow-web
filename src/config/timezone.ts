/**
 * UTC offset of the backend server (in hours).
 *
 * The backend stores naive datetimes without timezone info.
 * This offset compensates when creating appointments so the stored
 * value matches what the user typed — preventing the double-offset
 * display bug (times appearing 3h ahead).
 *
 * Values:
 *   -3  →  BRT (Brazil Standard Time, UTC-3) — current backend
 *    0  →  UTC (if backend ever returns proper UTC+Z timestamps)
 *
 * To change: update this single constant. All appointment creation
 * flows read from here.
 */
export const BACKEND_UTC_OFFSET_HOURS = -3;

/**
 * Converts user-input date + time strings into a Date adjusted
 * for the backend's naive datetime storage.
 *
 * Example (browser in UTC-3):
 *   user types "09:00" → local Date = 12:00 UTC
 *   adjusted by -3h   → 09:00 UTC
 *   backend stores "09:00" naive → returned as "09:00" → displayed "09:00" ✓
 */
export function toBackendDate(dateStr: string, timeStr: string): Date {
  const local = new Date(`${dateStr}T${timeStr}:00`);
  return new Date(local.getTime() + BACKEND_UTC_OFFSET_HOURS * 3_600_000);
}
