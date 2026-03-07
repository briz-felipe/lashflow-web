export interface TimeSlot {
  id: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface BlockedDate {
  id: string;
  date: string;
  reason?: string;
}
