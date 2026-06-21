import React, { useState, useCallback } from 'react';
import { View, Text, Image, Button, ScrollView, Swiper, SwiperItem } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useApp } from '@/store/AppContext';
import SymptomSelector from '@/components/SymptomSelector';
import type { PhotoAngle, SymptomRecord } from '@/types';

const CameraPage: React.FC = () => {
  const { project, getTodayPhotos, uploadPhoto, isBound } = useApp();
  
  const [selectedAngle, setSelectedAngle] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState<SymptomRecord | null>(null);
  const [distanceStatus, setDistanceStatus] = useState<'good' | 'warning'>('good');
  const [lightStatus, setLightStatus] = useState<'good' | 'warning'>('good');

  const todayPhotos = getTodayPhotos();
  const angles = project?.photoAngles?.slice(0, 3) || [];
  const currentAngle = angles[selectedAngle];

  usePullDownRefresh(() => {
    console.log('[CameraPage] 下拉刷新');
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 800);
  });

  const isAngleCompleted = useCallback((angle: PhotoAngle): boolean => {
    return todayPhotos.some(p => p.angleId === angle.id && p.status !== 'withdrawn');
  }, [todayPhotos]);

  const handleCapture = async () => {
    if (!isBound) {
      Taro.showToast({ title: '请先绑定复诊码', icon: 'none' });
      return;
    }

    setIsCapturing(true);
    Taro.vibrateShort({ type: 'medium' });

    try {
      const res = await Taro.chooseImage({
        count: 1,
        sourceType: ['camera', 'album'],
        sizeType: ['compressed']
      });
      
      console.log('[CameraPage] 选择照片:', res.tempFilePaths);
      setCapturedImage(res.tempFilePaths[0] || `https://picsum.photos/id/${177 + selectedAngle}/400/600`);
      
    } catch (error) {
      console.error('[CameraPage] 拍摄失败:', error);
      setCapturedImage(`https://picsum.photos/id/${177 + selectedAngle}/400/600`);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSymptomChange = (value: SymptomRecord) => {
    setSymptoms(value);
  };

  const handleSubmit = async () => {
    if (!capturedImage) {
      Taro.showToast({ title: '请先拍摄照片', icon: 'none' });
      return;
    }

    if (!symptoms) {
      Taro.showToast({ title: '请描述今日症状', icon: 'none' });
      return;
    }

    setIsUploading(true);
    console.log('[CameraPage] 提交照片:', { angle: currentAngle, symptoms });

    try {
      const success = await uploadPhoto(
        currentAngle.id,
        capturedImage,
        symptoms
      );

      if (success) {
        setShowSuccess(true);
        setCapturedImage(null);
        setSymptoms(null);
        
        const nextIncomplete = angles.findIndex((a, i) => i > selectedAngle && !isAngleCompleted(a));
        if (nextIncomplete !== -1) {
          setSelectedAngle(nextIncomplete);
        }

        setTimeout(() => {
          setShowSuccess(false);
        }, 2500);
      } else {
        Taro.showToast({ title: '上传失败，请重试', icon: 'none' });
      }
    } catch (error) {
      console.error('[CameraPage] 上传失败:', error);
      Taro.showToast({ title: '上传失败，请重试', icon: 'none' });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePreviewPhoto = (url: string) => {
    const urls = todayPhotos.map(p => p.imageUrl);
    Taro.previewImage({
      urls,
      current: url
    });
  };

  const getGuideSteps = () => {
    if (!currentAngle) return [];
    
    const baseSteps = [
      '请将面部对准虚线轮廓内',
      '保持表情自然，不要戴眼镜',
      '确保光线充足，面部无阴影',
      '请保持适当拍摄距离（约50cm）'
    ];

    if (currentAngle.name.includes('45°')) {
      baseSteps[0] = `请将面部向${currentAngle.name.includes('左') ? '左' : '右'}转45度，对准轮廓线`;
    } else if (currentAngle.name.includes('90°')) {
      baseSteps[0] = `请将面部完全侧向${currentAngle.name.includes('左') ? '左' : '右'}边`;
    }

    return baseSteps;
  };

  if (!isBound) {
    return (
      <ScrollView className={styles.page} scrollY>
        <View className={styles.emptyState}>
          <Text>请先绑定复诊码后再使用拍照功能</Text>
          <Button
            className={styles.submitBtn}
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
      <View className={styles.angleSelector}>
        <ScrollView className={styles.angleScroll} scrollX showScrollbar={false}>
          <View className={styles.angleTabs}>
            {angles.map((angle, index) => {
              const completed = isAngleCompleted(angle);
              return (
                <View
                  key={angle.id}
                  className={classnames(
                    styles.angleTab,
                    selectedAngle === index && styles.active,
                    completed && styles.completed
                  )}
                  onClick={() => setSelectedAngle(index)}
                >
                  {angle.required && <Text className={styles.requiredBadge}>*</Text>}
                  <View className={styles.angleTabIcon}>
                    {angle.name.charAt(0)}
                  </View>
                  <Text className={styles.angleTabName}>{angle.name}</Text>
                  {completed && (
                    <View className={styles.angleTabStatus}>✓</View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View className={styles.content}>
        <View className={styles.cameraArea}>
          <View className={styles.mockBackground} />
          <View className={styles.cameraGrid}>
            <View className={classnames(styles.gridLine, styles.h1)} />
            <View className={classnames(styles.gridLine, styles.h2)} />
            <View className={classnames(styles.gridLine, styles.v1)} />
            <View className={classnames(styles.gridLine, styles.v2)} />
          </View>
          <View className={styles.faceOutline} />
          
          <View className={styles.switchCameraBtn}>⟲</View>
          
          <View className={classnames(styles.lightIndicator, lightStatus)}>
            <Text className={styles.lightIcon}>💡</Text>
            <Text className={styles.lightText}>
              {lightStatus === 'good' ? '光线良好' : '光线不足'}
            </Text>
          </View>
          
          <View className={classnames(styles.distanceIndicator, distanceStatus)}>
            <Text className={styles.distanceIcon}>
              {distanceStatus === 'good' ? '✓' : '⚠'}
            </Text>
            <Text className={styles.distanceText}>
              {distanceStatus === 'good' ? '距离适中' : '请调整距离'}
            </Text>
          </View>
        </View>

        <View className={styles.guideCard}>
          <View className={styles.guideTitle}>
            <View className={styles.guideTipIcon}>!</View>
            <Text>{currentAngle?.name}拍摄指引</Text>
          </View>
          <View className={styles.guideList}>
            {getGuideSteps().map((step, index) => (
              <View key={index} className={styles.guideItem}>
                <View className={styles.guideNumber}>{index + 1}</View>
                <Text className={styles.guideText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>

        {capturedImage && (
          <SymptomSelector onChange={handleSymptomChange} />
        )}

        <View className={styles.captureSection}>
          <View
            className={classnames(styles.captureBtn, capturedImage && styles.disabled)}
            onClick={!capturedImage ? handleCapture : undefined}
          >
            {!capturedImage && <View className={styles.captureInner} />}
          </View>
          <Text className={styles.captureHint}>
            {capturedImage ? '已拍摄，请填写症状后提交' : '点击拍摄按钮'}
          </Text>
        </View>

        {capturedImage && (
          <Button
            className={classnames(styles.submitBtn, !symptoms && styles.disabled)}
            loading={isUploading}
            disabled={isUploading || !symptoms}
            onClick={handleSubmit}
          >
            {isUploading ? '上传中...' : '提交照片'}
          </Button>
        )}

        <View className={styles.todayPhotos}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>今日已拍摄</Text>
            <View className={styles.sectionCount}>
              {todayPhotos.filter(p => p.status !== 'withdrawn').length}/{angles.length}
            </View>
          </View>

          {todayPhotos.length > 0 ? (
            <View className={styles.photosGrid}>
              {todayPhotos.map((photo) => (
                <View
                  key={photo.id}
                  className={styles.photoPreview}
                  onClick={() => handlePreviewPhoto(photo.imageUrl)}
                >
                  <Image
                    className={styles.previewImage}
                    src={photo.thumbnail}
                    mode="aspectFill"
                    onError={(e) => console.error('[CameraPage] 预览图加载失败:', e)}
                  />
                  <View className={styles.previewAngle}>{photo.angle}</View>
                  <View className={classnames(
                    styles.previewStatus,
                    photo.status === 'pending' && styles.pending,
                    photo.status === 'reviewed' && styles.reviewed
                  )}>
                    {photo.status === 'pending' ? '待查看' : 
                     photo.status === 'reviewed' ? '已回复' : '已撤回'}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className={styles.emptyState}>
              <Text>今日还没有拍摄照片</Text>
              <Text style={{ fontSize: 24, marginTop: 8 }}>
                按照上方指引拍摄您的恢复照片
              </Text>
            </View>
          )}
        </View>
      </View>

      {isUploading && (
        <View className={styles.uploadingOverlay}>
          <View className={styles.uploadingCard}>
            <Text className={styles.uploadingIcon}>📤</Text>
            <Text className={styles.uploadingText}>正在上传</Text>
            <Text className={styles.uploadingDesc}>照片加密上传中，请稍候...</Text>
          </View>
        </View>
      )}

      {showSuccess && (
        <View className={styles.uploadingOverlay}>
          <View className={styles.successToast}>
            <Text className={styles.successTitle}>✓ 提交成功</Text>
            <Text className={styles.successDesc}>已提交待查看，医生会尽快回复</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default CameraPage;
