import React, { useState, useCallback } from 'react';
import { View, Text, Image, Button, Input, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useApp } from '@/store/AppContext';
import CalendarDayComponent from '@/components/CalendarDay';
import { getRecoveryDayText, formatDate, getDaysDiff } from '@/utils/date';
import type { CalendarDay, PhotoAngle } from '@/types';
import dayjs from 'dayjs';

const CalendarPage: React.FC = () => {
  const {
    user,
    project,
    calendarDays,
    isBound,
    bindClinicCode,
    getStats,
    getTodayPhotos,
    getTodayReminders
  } = useApp();

  const [bindCode, setBindCode] = useState('');
  const [isBinding, setIsBinding] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const stats = getStats();
  const todayPhotos = getTodayPhotos();
  const todayReminders = getTodayReminders();
  const surgeryDate = project?.surgeryDate || '2024-06-15';
  const today = dayjs().format('YYYY-MM-DD');
  const recoveryDay = getDaysDiff(today, surgeryDate);

  usePullDownRefresh(() => {
    console.log('[CalendarPage] 下拉刷新');
    setTimeout(() => {
      Taro.stopPullDownRefresh();
      Taro.showToast({ title: '已刷新', icon: 'success' });
    }, 1000);
  });

  const handleBind = async () => {
    if (!bindCode.trim()) {
      Taro.showToast({ title: '请输入复诊码', icon: 'none' });
      return;
    }

    setIsBinding(true);
    try {
      const success = await bindClinicCode(bindCode.trim().toUpperCase());
      if (success) {
        Taro.showToast({ title: '绑定成功', icon: 'success' });
        setBindCode('');
      } else {
        Taro.showToast({ title: '复诊码无效，请检查', icon: 'none' });
      }
    } catch (error) {
      console.error('[CalendarPage] 绑定失败:', error);
      Taro.showToast({ title: '绑定失败，请重试', icon: 'none' });
    } finally {
      setIsBinding(false);
    }
  };

  const handleGoToCamera = useCallback(() => {
    Taro.switchTab({ url: '/pages/camera/index' });
  }, []);

  const handleDateClick = (day: CalendarDay) => {
    console.log('[CalendarPage] 点击日期:', day.date);
    setSelectedDate(day.date);
    Taro.showToast({
      title: `术后第 ${getDaysDiff(day.date, surgeryDate)} 天`,
      icon: 'none'
    });
  };

  const isAngleCompleted = (angle: PhotoAngle): boolean => {
    return todayPhotos.some(p => p.angleId === angle.id && p.status !== 'withdrawn');
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  if (!isBound) {
    return (
      <ScrollView className={styles.page} scrollY>
        <View className={styles.header}>
          <View className={styles.userInfo}>
            <Image
              className={styles.avatar}
              src={user.avatar || 'https://picsum.photos/id/64/200/200'}
              mode="aspectFill"
              onError={(e) => console.error('[CalendarPage] 头像加载失败:', e)}
            />
            <View className={styles.userText}>
              <Text className={styles.userName}>您好</Text>
              <Text className={styles.clinicInfo}>请先绑定复诊码</Text>
            </View>
          </View>
        </View>

        <View className={styles.content}>
          <View className={styles.bindSection}>
            <View className={styles.bindIcon}>🔗</View>
            <Text className={styles.bindTitle}>绑定复诊码</Text>
            <Text className={styles.bindDesc}>
              请输入您的机构复诊码，绑定后即可查看您的术后恢复计划和接收医生指导。
              {'\n'}复诊码可在您的术后须知单或机构客服处获取。
            </Text>
            <Input
              className={styles.bindInput}
              placeholder="请输入复诊码（如：MEI20240615001）"
              value={bindCode}
              onInput={(e) => setBindCode(e.detail.value)}
              maxlength={20}
              placeholderStyle="color: #9CA3AF"
            />
            <Button
              className={styles.actionBtn}
              loading={isBinding}
              disabled={isBinding}
              onClick={handleBind}
            >
              {isBinding ? '绑定中...' : '立即绑定'}
            </Button>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <View className={styles.userInfo}>
          <Image
            className={styles.avatar}
            src={user.avatar || 'https://picsum.photos/id/64/200/200'}
            mode="aspectFill"
            onError={(e) => console.error('[CalendarPage] 头像加载失败:', e)}
          />
          <View className={styles.userText}>
            <Text className={styles.userName}>{user.name}</Text>
            <Text className={styles.clinicInfo}>🏥 {user.clinicName}</Text>
          </View>
        </View>

        <View className={styles.projectCard}>
          <Text className={styles.projectName}>{project?.name || '综合鼻整形术'}</Text>
          <Text className={styles.recoveryDay}>{recoveryDay > 0 ? recoveryDay : 0}</Text>
          <Text className={styles.recoveryDayLabel}>术后第 {recoveryDay > 0 ? recoveryDay : 0} 天</Text>
          <Text className={styles.surgeryDate}>
            手术日期：{formatDate(surgeryDate)} · 主治医生：{project?.doctorName || '李医生'}
          </Text>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.statsGrid}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.completedDays}</Text>
            <Text className={styles.statLabel}>已完成/天</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.totalPhotos}</Text>
            <Text className={styles.statLabel}>已传照片</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.reviewedPhotos}</Text>
            <Text className={styles.statLabel}>医生回复</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.totalDays - stats.completedDays}</Text>
            <Text className={styles.statLabel}>剩余/天</Text>
          </View>
        </View>

        <View className={styles.calendarSection}>
          <View className={styles.calendarHeader}>
            <Text className={styles.calendarTitle}>恢复日历</Text>
            <View className={styles.monthNav}>
              <Text>{dayjs(surgeryDate).format('YYYY年M月')}</Text>
            </View>
          </View>

          <View className={styles.weekDays}>
            {weekDays.map((day) => (
              <Text key={day} className={styles.weekDay}>{day}</Text>
            ))}
          </View>

          <View className={styles.calendarGrid}>
            {calendarDays.slice(0, 28).map((day) => (
              <CalendarDayComponent
                key={day.date}
                day={day}
                onClick={handleDateClick}
              />
            ))}
          </View>

          <View className={styles.legend}>
            <View className={styles.legendItem}>
              <View className={classnames(styles.legendDot, styles.completed)} />
              <Text>已完成</Text>
            </View>
            <View className={styles.legendItem}>
              <View className={classnames(styles.legendDot, styles.today)} />
              <Text>今天</Text>
            </View>
            <View className={styles.legendItem}>
              <View className={classnames(styles.legendDot, styles.pending)} />
              <Text>待上传</Text>
            </View>
            <View className={styles.legendItem}>
              <View className={classnames(styles.legendDot, styles.missed)} />
              <Text>漏拍</Text>
            </View>
          </View>
        </View>

        <View className={styles.todaySection}>
          <View className={styles.sectionTitle}>
            <Text>今日拍摄任务</Text>
            <View className={styles.sectionBadge}>
              {todayPhotos.filter(p => p.status !== 'withdrawn').length}/{project?.photoAngles?.length || 3}
            </View>
          </View>

          <View className={styles.angleList}>
            {project?.photoAngles?.slice(0, 3).map((angle) => {
              const completed = isAngleCompleted(angle);
              return (
                <View key={angle.id} className={styles.angleItem}>
                  <View className={styles.angleInfo}>
                    <View className={styles.angleIcon}>
                      {angle.name.charAt(0)}
                    </View>
                    <View>
                      <Text className={styles.angleText}>
                        {angle.name}
                        {angle.required && <Text style={{ color: '#F87171', marginLeft: 8 }}>*</Text>}
                      </Text>
                      <Text className={styles.angleDesc}>{angle.description}</Text>
                    </View>
                  </View>
                  <View className={classnames(styles.angleStatus, completed ? styles.completed : styles.pending)}>
                    <View className={classnames(styles.checkIcon, completed ? styles.completed : styles.pending)}>
                      {completed ? '✓' : ''}
                    </View>
                    <Text>{completed ? '已上传' : '待拍摄'}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <Button className={styles.actionBtn} onClick={handleGoToCamera}>
            立即拍摄
          </Button>
        </View>

        {todayReminders.length > 0 && (
          <View className={styles.todaySection}>
            <View className={styles.sectionTitle}>
              <Text>今日提醒</Text>
              <View className={styles.sectionBadge}>{todayReminders.length}条</View>
            </View>
            {todayReminders.map((reminder) => (
              <View key={reminder.id} className={styles.angleItem}>
                <View className={styles.angleInfo}>
                  <View className={styles.angleIcon}>
                    {reminder.type === 'suture' ? '拆线' : reminder.type === 'medication' ? '药' : '护'}
                  </View>
                  <View>
                    <Text className={styles.angleText}>{reminder.title}</Text>
                    <Text className={styles.angleDesc}>{reminder.time} · {reminder.description}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default CalendarPage;
