export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface DaySchedule {
  dayKey: DayKey;
  label: string;
  isClosed: boolean;
  lunchOpen: string;
  lunchClose: string;
  hasLunch: boolean;
  dinnerOpen: string;
  dinnerClose: string;
  hasDinner: boolean;
}

export type PeakTimeOption = 'lunch_rush' | 'happy_hour' | 'dinner_rush';

export interface OnboardingHoursState {
  schedule: Record<DayKey, DaySchedule>;
  peakTimes: PeakTimeOption[];
}

export const DEFAULT_WEEK_SCHEDULE: Record<DayKey, DaySchedule> = {
  mon: {
    dayKey: 'mon',
    label: 'Mon',
    isClosed: false,
    lunchOpen: '11:30 AM',
    lunchClose: '2:30 PM',
    hasLunch: true,
    dinnerOpen: '5:00 PM',
    dinnerClose: '10:00 PM',
    hasDinner: true,
  },
  tue: {
    dayKey: 'tue',
    label: 'Tue',
    isClosed: false,
    lunchOpen: '11:30 AM',
    lunchClose: '2:30 PM',
    hasLunch: true,
    dinnerOpen: '5:00 PM',
    dinnerClose: '10:00 PM',
    hasDinner: true,
  },
  wed: {
    dayKey: 'wed',
    label: 'Wed',
    isClosed: false,
    lunchOpen: '11:30 AM',
    lunchClose: '2:30 PM',
    hasLunch: true,
    dinnerOpen: '5:00 PM',
    dinnerClose: '10:00 PM',
    hasDinner: true,
  },
  thu: {
    dayKey: 'thu',
    label: 'Thu',
    isClosed: false,
    lunchOpen: '11:30 AM',
    lunchClose: '2:30 PM',
    hasLunch: true,
    dinnerOpen: '5:00 PM',
    dinnerClose: '10:30 PM',
    hasDinner: true,
  },
  fri: {
    dayKey: 'fri',
    label: 'Fri',
    isClosed: false,
    lunchOpen: '11:30 AM',
    lunchClose: '2:30 PM',
    hasLunch: true,
    dinnerOpen: '5:00 PM',
    dinnerClose: '11:30 PM',
    hasDinner: true,
  },
  sat: {
    dayKey: 'sat',
    label: 'Sat',
    isClosed: false,
    lunchOpen: '11:00 AM',
    lunchClose: '3:00 PM',
    hasLunch: true,
    dinnerOpen: '5:00 PM',
    dinnerClose: '11:30 PM',
    hasDinner: true,
  },
  sun: {
    dayKey: 'sun',
    label: 'Sun',
    isClosed: false,
    lunchOpen: '11:00 AM',
    lunchClose: '3:00 PM',
    hasLunch: true,
    dinnerOpen: '5:00 PM',
    dinnerClose: '9:00 PM',
    hasDinner: true,
  },
};
