import React, { useState, useMemo } from 'react';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useApp } from '@/store/AppContext';
import PhotoItem from '@/components/PhotoItem';
import type { PhotoRecord } from '@/types';
import { getDaysDiff, formatDate } from '@/utils/date';

type FilterType = 'all' | 'pending' | 'reviewed';

const FeedbackPage: React.FC = () => {
  const {
    photos,
    preOpPhoto,
    withdrawPhoto,
    isBound,
    getStats,
    project,
    isAngleRequired
  } = useApp();

  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoRecord | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const stats = getStats();
  const surgeryDate = project?.surgeryDate || '2024-06-15';

  usePullDownRefresh(() => {
    console.log('[FeedbackPage] 下拉刷新');
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 800);
  });

  const filteredPhotos = useMemo(() => {
    let result = photos.filter(p => p.status !== 'withdrawn');
    if (filter === 'pending') {
      result = result.filter(p => p.status === 'pending');
    } else if (filter === 'reviewed') {
      result = result.filter(p => p.status === 'reviewed');
    }
    return result.sort((a, b) => new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime());
  }, [photos, filter]);

  const groupedPhotos = useMemo(() => {
    const groups: Record<string, PhotoRecord[]> = {};
    filteredPhotos.forEach(photo => {
      if (!groups[photo.date]) {
        groups[photo.date] = [];
      }
      groups[photo.date].push(photo);
    });
    return groups;
  }, [filteredPhotos]);

  const pendingCount = photos.filter(p => p.status === 'pending').length;
  const reviewedCount = photos.filter(p => p.status === 'reviewed').length;

  const handleViewFeedback = (photo: PhotoRecord) => {
    setSelectedPhoto(photo);
    setShowFeedback(true);
  };

  const handleCompare = (photo: PhotoRecord) => {
    setSelectedPhoto(photo);
    setShowCompare(true);
  };

  const handleWithdrawClick = (photo: PhotoRecord) => {
    setSelectedPhoto(photo);
    setShowWithdrawConfirm(true);
  };

  const handleWithdraw = async () => {
    if (!selectedPhoto) return;
    
    setIsWithdrawing(true);
    try {
      const success = await withdrawPhoto(selectedPhoto.id);
      if (success) {
        Taro.showToast({ title: '已撤回', icon: 'success' });
        setShowWithdrawConfirm(false);
        setSelectedPhoto(null);
      } else {
        Taro.showToast({ title: '撤回失败', icon: 'none' });
      }
    } catch (error) {
      console.error('[FeedbackPage] 撤回失败:', error);
      Taro.showToast({ title: '撤回失败', icon: 'none' });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const getSymptomTags = (photo: PhotoRecord) => {
    if (!photo.symptoms) return [];
    const tags: string[] = [];
    if (photo.symptoms.swelling > 0) tags.push(`肿胀${photo.symptoms.swelling}级`);
    if (photo.symptoms.pain > 0) tags.push(`疼痛${photo.symptoms.pain}级`);
    if (photo.symptoms.bruising > 0) tags.push(`淤青${photo.symptoms.bruising}级`);
    return tags;
  };

  if (!isBound) {
    return (
      <ScrollView className={styles.page} scrollY>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>🔒</Text>
          <Text className={styles.emptyText}>请先绑定复诊码</Text>
          <Text className={styles.emptyDesc}>绑定后即可查看医生对您恢复照片的反馈</Text>
          <Button
            className={classnames(styles.actionBtn, styles.primary)}
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
      <View className={styles.filterTabs}>
        <View
          className={classnames(styles.filterTab, filter === 'all' && styles.active)}
          onClick={() => setFilter('all')}
        >
          全部
          <Text className={styles.tabCount}>{filteredPhotos.length}</Text>
        </View>
        <View
          className={classnames(styles.filterTab, filter === 'pending' && styles.active)}
          onClick={() => setFilter('pending')}
        >
          待查看
          <Text className={styles.tabCount}>{pendingCount}</Text>
        </View>
        <View
          className={classnames(styles.filterTab, filter === 'reviewed' && styles.active)}
          onClick={() => setFilter('reviewed')}
        >
          已回复
          <Text className={styles.tabCount}>{reviewedCount}</Text>
        </View>
      </View>

      {pendingCount > 0 && (
        <View className={styles.pendingBanner}>
          <Text>⏳</Text>
          <Text className={styles.pendingText}>
            您有 {pendingCount} 张照片等待医生查看，医生会在24小时内回复
          </Text>
        </View>
      )}

      <View className={styles.content}>
        <View className={styles.statsCard}>
          <Text className={styles.statsTitle}>恢复数据概览</Text>
          <View className={styles.statsRow}>
            <View className={styles.statItem}>
              <Text className={styles.statNumber}>{stats.totalPhotos}</Text>
              <Text className={styles.statLabel}>上传照片</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statNumber}>{stats.reviewedPhotos}</Text>
              <Text className={styles.statLabel}>医生回复</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statNumber}>{pendingCount}</Text>
              <Text className={styles.statLabel}>待查看</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statNumber}>{stats.completedDays}</Text>
              <Text className={styles.statLabel}>恢复天数</Text>
            </View>
          </View>
        </View>

        {Object.keys(groupedPhotos).length > 0 ? (
          <View className={styles.photosList}>
            {Object.entries(groupedPhotos).map(([date, datePhotos]) => {
              const recoveryDay = getDaysDiff(date, surgeryDate);
              return (
                <View key={date} className={styles.dateGroup}>
                  <View className={styles.dateHeader}>
                    <Text className={styles.dateText}>{formatDate(date)}</Text>
                    <Text className={styles.dateRecovery}>
                      术后第 {recoveryDay} 天
                    </Text>
                  </View>
                  <View className={styles.photosGrid}>
                    {datePhotos.map((photo) => (
                      <PhotoItem
                        key={photo.id}
                        photo={photo}
                        showActions
                        onViewFeedback={photo.status === 'reviewed' ? handleViewFeedback : undefined}
                        onCompare={handleCompare}
                        onWithdraw={
                          photo.status === 'pending' && !isAngleRequired(photo.angleId)
                            ? handleWithdrawClick
                            : undefined
                        }
                        isRequiredAngle={isAngleRequired(photo.angleId)}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📷</Text>
            <Text className={styles.emptyText}>
              {filter === 'pending' ? '暂无待查看的照片' : 
               filter === 'reviewed' ? '暂无已回复的照片' : '暂无上传的照片'}
            </Text>
            <Text className={styles.emptyDesc}>
              {filter === 'all' ? '上传您的恢复照片，医生会及时给予专业反馈' : '切换筛选条件查看其他照片'}
            </Text>
            {filter === 'all' && (
              <Button
                className={classnames(styles.actionBtn, styles.primary)}
                onClick={() => Taro.switchTab({ url: '/pages/camera/index' })}
              >
                上传照片
              </Button>
            )}
          </View>
        )}
      </View>

      {showFeedback && selectedPhoto && (
        <View className={styles.feedbackModal} onClick={() => setShowFeedback(false)}>
          <View className={styles.feedbackContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.feedbackHeader}>
              <Text style={{ fontSize: 32, fontWeight: 600 }}>反馈详情</Text>
              <Text className={styles.feedbackClose} onClick={() => setShowFeedback(false)}>✕</Text>
            </View>
            
            <ScrollView className={styles.feedbackBody} scrollY>
              <View className={styles.feedbackPhoto}>
                <Image
                  className={styles.feedbackImg}
                  src={selectedPhoto.imageUrl}
                  mode="aspectFill"
                  onError={(e) => console.error('[FeedbackPage] 图片加载失败:', e)}
                />
              </View>

              <View className={styles.feedbackMeta}>
                <View>
                  <Text className={styles.feedbackAngle}>{selectedPhoto.angle}</Text>
                  <Text className={styles.feedbackTime}>{selectedPhoto.uploadTime}</Text>
                </View>
                <View className={classnames(
                  styles.feedbackStatus,
                  selectedPhoto.status === 'reviewed' ? styles.reviewed : styles.pending
                )}>
                  {selectedPhoto.status === 'pending' ? '待查看' : '已回复'}
                </View>
              </View>

              {selectedPhoto.symptoms && (
                <View className={styles.symptomsSection}>
                  <Text className={styles.symptomsTitle}>您描述的症状</Text>
                  <View className={styles.symptomsTags}>
                    {getSymptomTags(selectedPhoto).map((tag, i) => (
                      <Text key={i} className={styles.symptomTag}>{tag}</Text>
                    ))}
                    {selectedPhoto.symptoms.description && (
                      <Text style={{ 
                        width: '100%', 
                        fontSize: 24, 
                        color: '#6B7280', 
                        marginTop: 8 
                      }}>
                        {selectedPhoto.symptoms.description}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {selectedPhoto.feedback && (
                <View className={styles.doctorSection}>
                  <View className={styles.doctorHeader}>
                    <View className={styles.doctorAvatar}>
                      {selectedPhoto.feedback.doctorName.charAt(0)}
                    </View>
                    <View className={styles.doctorInfo}>
                      <Text className={styles.doctorName}>{selectedPhoto.feedback.doctorName}</Text>
                      <Text className={styles.doctorTitle}>主治医师 · {selectedPhoto.feedback.timestamp}</Text>
                    </View>
                  </View>
                  
                  <Text className={styles.feedbackText}>
                    {selectedPhoto.feedback.content}
                  </Text>

                  {selectedPhoto.feedback.notes.length > 0 && (
                    <View className={styles.notesSection}>
                      <Text className={styles.notesTitle}>📋 注意事项</Text>
                      <View className={styles.notesList}>
                        {selectedPhoto.feedback.notes.map((note, i) => (
                          <View key={i} className={styles.noteItem}>
                            <Text className={styles.noteIcon}>•</Text>
                            <Text className={styles.noteText}>{note}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {selectedPhoto.feedback.needVisit && (
                    <View className={styles.visitWarning}>
                      <Text className={styles.visitTitle}>⚠️ 建议到院复诊</Text>
                      <Text className={styles.visitDesc}>
                        {selectedPhoto.feedback.visitSuggestion || '请尽快联系预约到院复诊'}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {showCompare && selectedPhoto && (
        <View className={styles.compareModal}>
          <View className={styles.modalHeader}>
            <Text className={styles.modalTitle}>术前术后对比</Text>
            <View className={styles.closeBtn} onClick={() => setShowCompare(false)}>✕</View>
          </View>

          <View className={styles.compareContainer}>
            <View className={styles.comparePane}>
              <Text className={styles.compareLabel}>术前</Text>
              <View className={styles.compareImage}>
                <Image
                  className={styles.compareImg}
                  src={preOpPhoto}
                  mode="aspectFill"
                  onError={(e) => console.error('[FeedbackPage] 术前照加载失败:', e)}
                />
              </View>
              <Text className={styles.compareInfo}>手术前</Text>
            </View>
            
            <View className={styles.comparePane}>
              <Text className={styles.compareLabel}>
                术后第 {getDaysDiff(selectedPhoto.date, surgeryDate)} 天
              </Text>
              <View className={styles.compareImage}>
                <Image
                  className={styles.compareImg}
                  src={selectedPhoto.imageUrl}
                  mode="aspectFill"
                  onError={(e) => console.error('[FeedbackPage] 术后照加载失败:', e)}
                />
              </View>
              <Text className={styles.compareInfo}>{selectedPhoto.angle} · {selectedPhoto.date}</Text>
            </View>
          </View>

          <Text style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', fontSize: 24 }}>
            🔒 对比照片仅您本人可见
          </Text>
        </View>
      )}

      {showWithdrawConfirm && selectedPhoto && (
        <View className={styles.feedbackModal} onClick={() => setShowWithdrawConfirm(false)}>
          <View className={styles.feedbackContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.withdrawConfirm}>
              <Text className={styles.withdrawTitle}>确认撤回照片？</Text>
              <Text className={styles.withdrawDesc}>
                撤回后该照片将从医生待查看列表中移除，
                {'\n'}已被医生查看的照片无法撤回。
              </Text>
              <View className={styles.withdrawActions}>
                <Button
                  className={classnames(styles.withdrawBtn, styles.cancel)}
                  onClick={() => setShowWithdrawConfirm(false)}
                >
                  取消
                </Button>
                <Button
                  className={classnames(styles.withdrawBtn, styles.confirm)}
                  loading={isWithdrawing}
                  disabled={isWithdrawing}
                  onClick={handleWithdraw}
                >
                  {isWithdrawing ? '撤回中...' : '确认撤回'}
                </Button>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default FeedbackPage;
