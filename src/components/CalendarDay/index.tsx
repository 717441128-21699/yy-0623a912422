import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { CalendarDay } from '@/types';
import dayjs from 'dayjs';

interface CalendarDayProps {
  day: CalendarDay;
  onClick?: (day: CalendarDay) => void;
}

const CalendarDayComponent: React.FC<CalendarDayProps> = ({ day, onClick }) => {
  const dayNumber = dayjs(day.date).format('D');
  const recoveryDay = dayjs(day.date).diff(dayjs('2024-06-15'), 'day');

  return (
    <View
      className={classnames(
        styles.dayItem,
        styles[day.status],
        day.isRestricted && styles.restricted
      )}
      onClick={() => onClick?.(day)}
    >
      <Text className={styles.dayNumber}>{dayNumber}</Text>
      {day.photosRequired > 0 && (
        <Text className={styles.photoProgress}>
          {day.photosUploaded}/{day.photosRequired}
        </Text>
      )}
      {day.hasFeedback && <View className={styles.feedbackDot} />}
    </View>
  );
};

export default CalendarDayComponent;
