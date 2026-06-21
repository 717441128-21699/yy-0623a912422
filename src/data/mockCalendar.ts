import type { CalendarDay } from '@/types';
import { isToday, isPast, isFuture, getDayOfWeek } from '@/utils/date';
import dayjs from 'dayjs';

const surgeryDate = '2024-06-15';

const generateCalendarDays = (): CalendarDay[] => {
  const days: CalendarDay[] = [];
  const today = dayjs().format('YYYY-MM-DD');
  
  for (let i = 0; i < 30; i++) {
    const date = dayjs(surgeryDate).add(i, 'day').format('YYYY-MM-DD');
    let status: CalendarDay['status'];
    let photosRequired = 0;
    let photosUploaded = 0;
    let hasFeedback = false;
    let isRestricted = false;

    if (i < 7) {
      photosRequired = 3;
    } else if (i < 14) {
      photosRequired = 2;
    } else if (i < 21) {
      photosRequired = 1;
    } else {
      photosRequired = 1;
    }

    if (isToday(date)) {
      status = 'today';
      photosUploaded = 1;
    } else if (isPast(date)) {
      if (i < 5) {
        status = 'completed';
        photosUploaded = photosRequired;
        hasFeedback = true;
      } else if (i === 5) {
        status = 'missed';
        photosUploaded = 1;
        hasFeedback = true;
      } else {
        status = 'pending';
        photosUploaded = 0;
      }
    } else {
      status = 'future';
    }

    if (i === 6 || i === 13) {
      isRestricted = true;
    }

    days.push({
      date,
      dayOfWeek: getDayOfWeek(date),
      status,
      photosRequired,
      photosUploaded,
      hasFeedback,
      isRestricted
    });
  }
  
  return days;
};

export const mockCalendarDays: CalendarDay[] = generateCalendarDays();

export const mockPreOpPhoto = 'https://picsum.photos/id/177/400/600';
