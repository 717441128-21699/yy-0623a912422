import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { DoctorFeedback } from '@/types';

interface StatusCardProps {
  title: string;
  status?: 'pending' | 'reviewed' | 'warning' | 'attention';
  content: string;
  doctorName?: string;
  timestamp?: string;
  notes?: string[];
  needVisit?: boolean;
  visitSuggestion?: string;
  onClick?: () => void;
}

const StatusCard: React.FC<StatusCardProps> = ({
  title,
  status = 'pending',
  content,
  doctorName,
  timestamp,
  notes = [],
  needVisit = false,
  visitSuggestion,
  onClick
}) => {
  const statusText: Record<string, string> = {
    pending: '待查看',
    reviewed: '已回复',
    warning: '需关注',
    attention: '需复诊'
  };

  return (
    <View className={styles.card} onClick={onClick}>
      <View className={styles.header}>
        <Text className={styles.title}>{title}</Text>
        <View className={classnames(styles.badge, styles[status])}>
          {statusText[status]}
        </View>
      </View>
      
      <Text className={styles.content}>{content}</Text>
      
      {notes.length > 0 && (
        <View className={styles.notes}>
          {notes.map((note, index) => (
            <Text key={index} className={styles.noteTag}>{note}</Text>
          ))}
        </View>
      )}
      
      {needVisit && (
        <View className={styles.visitWarning}>
          {visitSuggestion || '建议尽快到院复诊'}
        </View>
      )}
      
      {(doctorName || timestamp) && (
        <View className={styles.meta}>
          {doctorName && (
            <Text className={styles.doctor}>{doctorName}</Text>
          )}
          {timestamp && (
            <Text className={styles.time}>{timestamp}</Text>
          )}
        </View>
      )}
    </View>
  );
};

export default StatusCard;
