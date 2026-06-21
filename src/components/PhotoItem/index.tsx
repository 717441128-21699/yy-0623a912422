import React from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import classnames from 'classnames';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import type { PhotoRecord } from '@/types';

interface PhotoItemProps {
  photo: PhotoRecord;
  showActions?: boolean;
  onWithdraw?: (id: string) => void;
  onViewFeedback?: (photo: PhotoRecord) => void;
  onCompare?: (photo: PhotoRecord) => void;
  isRequiredAngle?: boolean;
}

const PhotoItem: React.FC<PhotoItemProps> = ({
  photo,
  showActions = false,
  onWithdraw,
  onViewFeedback,
  onCompare,
  isRequiredAngle = false
}) => {
  const statusText: Record<string, string> = {
    pending: '待查看',
    reviewed: '已回复',
    withdrawn: '已撤回'
  };

  const canWithdraw = photo.status === 'pending' && onWithdraw && !isRequiredAngle;

  const handlePreview = () => {
    Taro.previewImage({
      urls: [photo.imageUrl],
      current: photo.imageUrl
    });
  };

  const getSymptomTags = () => {
    if (!photo.symptoms) return [];
    const tags: string[] = [];
    if (photo.symptoms.swelling > 0) {
      tags.push(`肿胀${photo.symptoms.swelling}级`);
    }
    if (photo.symptoms.pain > 0) {
      tags.push(`疼痛${photo.symptoms.pain}级`);
    }
    if (photo.symptoms.bruising > 0) {
      tags.push(`淤青${photo.symptoms.bruising}级`);
    }
    return tags;
  };

  const symptomTags = getSymptomTags();

  return (
    <View className={styles.photoCard}>
      <View className={styles.imageWrapper} onClick={handlePreview}>
        <Image
          className={styles.image}
          src={photo.thumbnail}
          mode="aspectFill"
          onError={(e) => console.error('[PhotoItem] 图片加载失败:', e)}
        />
        <View className={classnames(styles.statusOverlay, styles[photo.status])}>
          {statusText[photo.status]}
        </View>
        {isRequiredAngle && photo.status === 'pending' && (
          <View className={styles.requiredBadge}>必拍</View>
        )}
      </View>
      
      <View className={styles.info}>
        <Text className={styles.angle}>
          {photo.angle}
          {isRequiredAngle && <Text style={{ color: '#F87171', marginLeft: 8 }}>*</Text>}
        </Text>
        <Text className={styles.time}>{photo.uploadTime}</Text>
        {symptomTags.length > 0 && (
          <View className={styles.symptoms}>
            {symptomTags.map((tag, index) => (
              <Text key={index} className={styles.symptomTag}>{tag}</Text>
            ))}
          </View>
        )}
      </View>

      {showActions && photo.status !== 'withdrawn' && (
        <View className={styles.actions}>
          {photo.status === 'reviewed' && onViewFeedback && (
            <Button
              className={classnames(styles.actionBtn, styles.primary)}
              onClick={() => onViewFeedback(photo)}
            >
              查看反馈
            </Button>
          )}
          {onCompare && (
            <Button
              className={styles.actionBtn}
              onClick={() => onCompare(photo)}
            >
              对比术前
            </Button>
          )}
          {canWithdraw && (
            <Button
              className={classnames(styles.actionBtn, styles.danger)}
              onClick={() => onWithdraw(photo.id)}
            >
              撤回
            </Button>
          )}
        </View>
      )}
    </View>
  );
};

export default PhotoItem;
