import dayjs from 'dayjs';

export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

export const formatTime = (date: string | Date): string => {
  return dayjs(date).format('HH:mm');
};

export const getDaysDiff = (date1: string | Date, date2: string | Date): number => {
  return dayjs(date1).diff(dayjs(date2), 'day');
};

export const addDays = (date: string | Date, days: number): string => {
  return dayjs(date).add(days, 'day').format('YYYY-MM-DD');
};

export const isToday = (date: string | Date): boolean => {
  return dayjs(date).isSame(dayjs(), 'day');
};

export const isPast = (date: string | Date): boolean => {
  return dayjs(date).isBefore(dayjs(), 'day');
};

export const isFuture = (date: string | Date): boolean => {
  return dayjs(date).isAfter(dayjs(), 'day');
};

export const getDayOfWeek = (date: string | Date): number => {
  return dayjs(date).day();
};

export const getDayOfWeekText = (date: string | Date): string => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[getDayOfWeek(date)];
};

export const getMonthDays = (year: number, month: number): string[] => {
  const days: string[] = [];
  const startDate = dayjs(`${year}-${month}-01`);
  const daysInMonth = startDate.daysInMonth();
  
  for (let i = 0; i < daysInMonth; i++) {
    days.push(startDate.add(i, 'day').format('YYYY-MM-DD'));
  }
  
  return days;
};

export const getRecoveryDayText = (surgeryDate: string, currentDate: string): string => {
  const days = getDaysDiff(currentDate, surgeryDate);
  if (days === 0) return '手术当天';
  if (days > 0) return `术后第 ${days} 天`;
  return `术前 ${Math.abs(days)} 天`;
};

export const generateCalendarDays = (surgeryDate: string, totalDays: number = 30): string[] => {
  const days: string[] = [];
  for (let i = 0; i < totalDays; i++) {
    days.push(addDays(surgeryDate, i));
  }
  return days;
};
