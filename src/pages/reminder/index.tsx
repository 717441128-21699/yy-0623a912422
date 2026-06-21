import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useApp } from '@/store/AppContext';
import type { Reminder } from '@/types';

type FilterType = 'all' | 'visit' | 'suture' | 'care' | 'medication';

const filterOptions: { key: FilterType; name: string; icon: string }[] = [
  { key: 'all', name: '全部', icon: '📋' },
  { key: 'visit', name: '复诊', icon: '🏥' },
  { key: 'suture', name: '拆线', icon: '✂️' },
  { key: 'care', name: '护理', icon: '💊' },
  { key: 'medication', name: '用药', icon: '💉' }
];

const ReminderPage: React.FC = () => {
  const { reminders, completeReminder, isBound, getStats } = useApp();

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const stats = getStats();

  usePullDownRefresh(() => {
    console.log('[ReminderPage] 下拉刷新');
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 800);
  });

  const filteredReminders = useMemo(() => {
    let result = [...reminders];
    
    if (activeFilter !== 'all') {
      result = result.filter(r => r.type === activeFilter);
    }
    
    return result.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [reminders, activeFilter]);

  const groupedReminders = useMemo(() => {
    const groups: { [key: string]: Reminder[] } = {};
    
    filteredReminders.forEach(reminder => {
      const date = reminder.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(reminder);
    });
    
    return Object.entries(groups).sort(([a], [b]) => 
      new Date(a).getTime() - new Date(b).getTime()
    );
  }, [filteredReminders]);

  const nextAppointment = useMemo(() => {
    const now = new Date();
    const upcoming = reminders
      .filter(r => !r.completed && (r.type === 'visit' || r.type === 'suture'))
      .filter(r => new Date(r.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return upcoming[0] || null;
  }, [reminders]);

  const countdown = useMemo(() => {
    if (!nextAppointment) return { days: 0, hours: 0, minutes: 0 };
    
    const now = new Date();
    const apptDate = new Date(`${nextAppointment.date}T${nextAppointment.time || '09:00'}`);
    const diff = apptDate.getTime() - now.getTime();
    
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { days, hours, minutes };
  }, [nextAppointment]);

  const getFilterCount = (type: FilterType): number => {
    if (type === 'all') return reminders.filter(r => !r.completed).length;
    return reminders.filter(r => r.type === type && !r.completed).length;
  };

  const getTypeIcon = (type: string): string => {
    const found = filterOptions.find(o => o.key === type);
    return found?.icon || '📋';
  };

  const getTypeName = (type: string): string => {
    const found = filterOptions.find(o => o.key === type);
    return found?.name || type;
  };

  const formatDateDisplay = (dateStr: string): { day: string; month: string; text: string; isToday: boolean; isTomorrow: boolean } => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    let text = '';
    if (isToday) {
      text = '今天';
    } else if (isTomorrow) {
      text = '明天';
    } else {
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      text = weekdays[date.getDay()];
    }
    
    return {
      day: date.getDate().toString(),
      month: `${date.getMonth() + 1}月`,
      text,
      isToday,
      isTomorrow
    };
  };

  const getDateTag = (dateStr: string, completed: boolean): string | null => {
    const { isToday, isTomorrow } = formatDateDisplay(dateStr);
    if (completed) return null;
    if (isToday) return '今天';
    if (isTomorrow) return '明天';
    return null;
  };

  const handleComplete = async (reminder: Reminder) => {
    if (reminder.completed) return;
    
    console.log('[ReminderPage] 标记完成:', reminder.id);
    const success = await completeReminder(reminder.id);
    if (success) {
      Taro.showToast({ title: '已标记完成', icon: 'success' });
      Taro.vibrateShort({ type: 'light' });
    }
  };

  const handleViewDetail = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setShowDetailModal(true);
  };

  const handleContactDoctor = () => {
    console.log('[ReminderPage] 联系医生');
    Taro.showToast({ title: '正在联系医生...', icon: 'none' });
  };

  const getCareTips = (type: string): { icon: string; text: string }[] => {
    const tips: { [key: string]: { icon: string; text: string }[] } = {
      suture: [
        { icon: '⚠️', text: '拆线前24小时请保持伤口干燥，避免沾水' },
        { icon: '🚫', text: '拆线后3天内避免剧烈运动和面部夸张表情' },
        { icon: '☀️', text: '注意防晒，避免色素沉着' },
        { icon: '💧', text: '可使用医生推荐的祛疤产品' }
      ],
      visit: [
        { icon: '📋', text: '请携带好之前的检查报告和病历资料' },
        { icon: '⏰', text: '建议提前15分钟到达医院' },
        { icon: '💬', text: '提前准备好要咨询医生的问题清单' },
        { icon: '👤', text: '复诊时请携带身份证和复诊卡' }
      ],
      care: [
        { icon: '🧼', text: '保持伤口清洁，用生理盐水轻轻擦拭' },
        { icon: '🧴', text: '按照医嘱涂抹药膏，每天2-3次' },
        { icon: '🚫', text: '避免辛辣刺激食物和烟酒' },
        { icon: '😴', text: '保证充足睡眠，有利于恢复' }
      ],
      medication: [
        { icon: '💊', text: '请按照医嘱按时服药，不要自行增减剂量' },
        { icon: '🍽️', text: '部分药物需要饭后服用，请仔细阅读说明书' },
        { icon: '🚫', text: '服药期间避免饮酒和食用 grapefruit' },
        { icon: '📝', text: '如出现不适，请及时联系医生' }
      ]
    };
    return tips[type] || [];
  };

  const completedCount = reminders.filter(r => r.completed).length;
  const pendingCount = reminders.filter(r => !r.completed).length;

  if (!isBound) {
    return (
      <ScrollView className={styles.page} scrollY>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>🔔</Text>
          <Text className={styles.emptyTitle}>请先绑定复诊码</Text>
          <Text className={styles.emptyDesc}>
            绑定后即可查看您的复诊日程和恢复提醒
          </Text>
          <Button
            className={styles.completeBtn}
            style={{ marginTop: 32 }}
            onClick={() => Taro.switchTab({ url: '/pages/calendar/index' })}
          >
            前往绑定
          </Button>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <View className={styles.headerIcon}>🔔</View>
        <Text className={styles.headerTitle}>复诊提醒</Text>
        <Text className={styles.headerDesc}>
          按时复诊，安心恢复。系统会在重要时间节点提醒您。
        </Text>
      </View>

      {nextAppointment && (
        <View className={styles.nextAppointment}>
          <View className={styles.nextAppointmentHeader}>
            <View className={styles.nextAppointmentLabel}>
              {getTypeIcon(nextAppointment.type)}
              下次{getTypeName(nextAppointment.type)}
            </View>
            <View className={styles.nextAppointmentBadge}>
              {countdown.days}天后
            </View>
          </View>

          <View className={styles.nextAppointmentCountdown}>
            <View className={styles.countdownNumber}>
              <Text className={styles.countdownValue}>{countdown.days}</Text>
              <Text className={styles.countdownLabel}>天</Text>
            </View>
            <Text className={styles.countdownDivider}>:</Text>
            <View className={styles.countdownNumber}>
              <Text className={styles.countdownValue}>{countdown.hours}</Text>
              <Text className={styles.countdownLabel}>时</Text>
            </View>
            <Text className={styles.countdownDivider}>:</Text>
            <View className={styles.countdownNumber}>
              <Text className={styles.countdownValue}>{countdown.minutes}</Text>
              <Text className={styles.countdownLabel}>分</Text>
            </View>
          </View>

          <View className={styles.nextAppointmentInfo}>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>日期</Text>
              <Text className={styles.infoValue}>{nextAppointment.date}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>时间</Text>
              <Text className={styles.infoValue}>{nextAppointment.time || '09:00'}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>医生</Text>
              <Text className={styles.infoValue}>{nextAppointment.doctor || '张医生'}</Text>
            </View>
          </View>
        </View>
      )}

      <View className={styles.content}>
        <View className={styles.statsRow}>
          <View className={styles.statsCard}>
            <Text className={styles.statsValue}>{stats.totalReminders}</Text>
            <Text className={styles.statsLabel}>总提醒数</Text>
          </View>
          <View className={styles.statsCard}>
            <Text className={styles.statsValue}>{completedCount}</Text>
            <Text className={styles.statsLabel}>已完成</Text>
          </View>
          <View className={styles.statsCard}>
            <Text className={styles.statsValue}>{pendingCount}</Text>
            <Text className={styles.statsLabel}>待完成</Text>
          </View>
        </View>

        <View className={styles.filterTabs}>
          {filterOptions.map((option) => (
            <View
              key={option.key}
              className={classnames(
                styles.filterTab,
                activeFilter === option.key && styles.active
              )}
              onClick={() => setActiveFilter(option.key)}
            >
              {option.icon} {option.name}
              <Text className={styles.filterCount}>
                ({getFilterCount(option.key)})
              </Text>
            </View>
          ))}
        </View>

        {groupedReminders.length > 0 ? (
          <View className={styles.reminderList}>
            {groupedReminders.map(([date, items]) => {
              const dateDisplay = formatDateDisplay(date);
              const dateTag = getDateTag(date, items.every(i => i.completed));
              
              return (
                <View key={date} className={styles.dateGroup}>
                  <View className={styles.dateHeader}>
                    <View className={styles.dateBadge}>
                      <Text className={styles.dateDay}>{dateDisplay.day}</Text>
                      <Text className={styles.dateMonth}>{dateDisplay.month}</Text>
                    </View>
                    <Text className={styles.dateText}>{dateDisplay.text}</Text>
                    {dateTag && (
                      <View className={styles.dateTag}>{dateTag}</View>
                    )}
                  </View>

                  {items.map((reminder) => (
                    <View
                      key={reminder.id}
                      className={classnames(
                        styles.reminderItem,
                        reminder.completed && styles.completed
                      )}
                    >
                      <View className={classnames(
                        styles.reminderIcon,
                        reminder.type
                      )}>
                        {getTypeIcon(reminder.type)}
                      </View>

                      <View className={styles.reminderContent}>
                        <Text className={classnames(
                          styles.reminderTitle,
                          reminder.completed && styles.completed
                        )}>
                          {reminder.title}
                          <View className={classnames(
                            styles.reminderType,
                            reminder.type
                          )}>
                            {getTypeName(reminder.type)}
                          </View>
                        </Text>

                        <View className={styles.reminderTime}>
                          🕐 {reminder.time || '全天'}
                          {reminder.location && ` | 📍 ${reminder.location}`}
                        </View>

                        <Text className={styles.reminderDesc}>
                          {reminder.description}
                        </Text>
                      </View>

                      <View className={styles.reminderActions}>
                        <View
                          className={classnames(
                            styles.completeCheckbox,
                            reminder.completed && styles.checked
                          )}
                          onClick={() => handleComplete(reminder)}
                        >
                          {reminder.completed && '✓'}
                        </View>
                        <Button
                          className={styles.detailBtn}
                          onClick={() => handleViewDetail(reminder)}
                        >
                          详情
                        </Button>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>🎉</Text>
            <Text className={styles.emptyTitle}>暂无相关提醒</Text>
            <Text className={styles.emptyDesc}>
              所有提醒都已完成，继续保持！
            </Text>
          </View>
        )}

        <Text className={styles.sectionTitle} style={{ marginTop: 32, marginBottom: 16 }}>
          📅 恢复时间轴
        </Text>

        <View className={styles.timeline}>
          {reminders
            .filter(r => r.type === 'visit' || r.type === 'suture')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((reminder, index, array) => {
              const now = new Date();
              const remDate = new Date(`${reminder.date}T${reminder.time || '09:00'}`);
              let status: 'completed' | 'current' | 'upcoming' = 'upcoming';
              
              if (reminder.completed || remDate < now) {
                status = 'completed';
              } else if (index > 0 && array[index - 1].completed) {
                status = 'current';
              }

              return (
                <View key={reminder.id} className={styles.timelineItem}>
                  <View className={classnames(
                    styles.timelineDot,
                    status
                  )} />
                  <View className={styles.timelineContent}>
                    <Text className={styles.timelineDate}>
                      {reminder.date} {reminder.time || ''}
                    </Text>
                    <Text className={styles.timelineTitle}>
                      {getTypeIcon(reminder.type)} {reminder.title}
                    </Text>
                    <Text className={styles.timelineDesc}>
                      {reminder.description}
                    </Text>
                    <View className={classnames(
                      styles.timelineStatus,
                      status
                    )}>
                      {status === 'completed' ? '已完成' : 
                       status === 'current' ? '进行中' : '即将到来'}
                    </View>
                  </View>
                </View>
              );
            })}
        </View>
      </View>

      {showDetailModal && selectedReminder && (
        <View className={styles.detailModal} onClick={() => setShowDetailModal(false)}>
          <View className={styles.detailModalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.detailModalHeader}>
              <Text className={styles.detailModalTitle}>
                {getTypeIcon(selectedReminder.type)}
                {selectedReminder.title}
              </Text>
              <View className={styles.detailModalClose} onClick={() => setShowDetailModal(false)}>
                ✕
              </View>
            </View>

            <ScrollView className={styles.detailModalBody} scrollY>
              <View className={styles.detailSection}>
                <Text className={styles.detailSectionTitle}>
                  <View className={styles.detailSectionIcon}>📅</View>
                  基本信息
                </Text>
                <View className={styles.detailInfoRow}>
                  <Text className={styles.detailInfoLabel}>提醒类型</Text>
                  <View className={classnames(
                    styles.reminderType,
                    selectedReminder.type
                  )}>
                    {getTypeName(selectedReminder.type)}
                  </View>
                </View>
                <View className={styles.detailInfoRow}>
                  <Text className={styles.detailInfoLabel}>日期</Text>
                  <Text className={styles.detailInfoValue}>{selectedReminder.date}</Text>
                </View>
                <View className={styles.detailInfoRow}>
                  <Text className={styles.detailInfoLabel}>时间</Text>
                  <Text className={styles.detailInfoValue}>{selectedReminder.time || '全天'}</Text>
                </View>
                {selectedReminder.location && (
                  <View className={styles.detailInfoRow}>
                    <Text className={styles.detailInfoLabel}>地点</Text>
                    <Text className={styles.detailInfoValue}>{selectedReminder.location}</Text>
                  </View>
                )}
                {selectedReminder.doctor && (
                  <View className={styles.detailInfoRow}>
                    <Text className={styles.detailInfoLabel}>主治医生</Text>
                    <Text className={styles.detailInfoValue}>{selectedReminder.doctor}</Text>
                  </View>
                )}
              </View>

              <View className={styles.detailSection}>
                <Text className={styles.detailSectionTitle}>
                  <View className={styles.detailSectionIcon}>📝</View>
                  详细说明
                </Text>
                <Text style={{ 
                  fontSize: 28, 
                  color: '#374151', 
                  lineHeight: 1.6,
                  padding: 16,
                  background: '#F3F4F6',
                  borderRadius: 12
                }}>
                  {selectedReminder.description}
                </Text>
              </View>

              {getCareTips(selectedReminder.type).length > 0 && (
                <View className={styles.detailSection}>
                  <Text className={styles.detailSectionTitle}>
                    <View className={styles.detailSectionIcon}>💡</View>
                    注意事项
                  </Text>
                  <View className={styles.careTipsList}>
                    {getCareTips(selectedReminder.type).map((tip, index) => (
                      <View key={index} className={styles.careTipItem}>
                        <Text className={styles.careTipIcon}>{tip.icon}</Text>
                        <Text className={styles.careTipText}>{tip.text}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>

            <View className={styles.detailModalFooter}>
              {!selectedReminder.completed ? (
                <Button
                  className={styles.completeBtn}
                  onClick={() => {
                    handleComplete(selectedReminder);
                    setShowDetailModal(false);
                  }}
                >
                  ✓ 标记为已完成
                </Button>
              ) : (
                <Button
                  className={classnames(styles.completeBtn, styles.completed)}
                  disabled
                >
                  ✓ 已完成
                </Button>
              )}
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default ReminderPage;
