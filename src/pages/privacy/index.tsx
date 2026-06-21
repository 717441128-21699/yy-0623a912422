import React, { useState } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useApp } from '@/store/AppContext';
import PrivacySwitch from '@/components/PrivacySwitch';
import type { ExportRecord } from '@/types';

type ExportType = 'full' | 'photos' | 'medical' | 'feedback';

const exportTypeOptions: { key: ExportType; name: string; icon: string; desc: string }[] = [
  { key: 'full', name: '完整档案', icon: '📋', desc: '包含所有恢复数据' },
  { key: 'photos', name: '照片记录', icon: '📷', desc: '所有恢复照片' },
  { key: 'medical', name: '医疗记录', icon: '🏥', desc: '项目和诊断信息' },
  { key: 'feedback', name: '医生反馈', icon: '💬', desc: '所有医生回复' }
];

const autoDeleteOptions = [
  { days: 90, label: '3个月' },
  { days: 180, label: '6个月' },
  { days: 365, label: '1年' },
  { days: 0, label: '永不删除' }
];

const PrivacyPage: React.FC = () => {
  const {
    user,
    privacySettings,
    updatePrivacySettings,
    isBound,
    getStats
  } = useApp();

  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedExportType, setSelectedExportType] = useState<ExportType>('full');
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportRecord[]>([
    {
      id: 'exp_001',
      type: 'full',
      generateTime: '2024-06-18 14:30',
      status: 'completed',
      fileUrl: '#',
      expireDate: '2024-07-18'
    }
  ]);

  const stats = getStats();

  usePullDownRefresh(() => {
    console.log('[PrivacyPage] 下拉刷新');
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 800);
  });

  const handlePrivacyChange = (key: string, value: boolean) => {
    console.log('[PrivacyPage] 隐私设置变更:', key, value);
    updatePrivacySettings({ [key]: value });
    Taro.vibrateShort({ type: 'light' });
  };

  const handleAutoDeleteChange = (days: number) => {
    console.log('[PrivacyPage] 自动删除设置变更:', days);
    updatePrivacySettings({ autoDeleteDays: days });
    Taro.vibrateShort({ type: 'light' });
  };

  const handleGenerateExport = async () => {
    console.log('[PrivacyPage] 生成导出文件:', selectedExportType);
    setIsGenerating(true);
    setShowExportModal(false);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newExport: ExportRecord = {
        id: `exp_${Date.now()}`,
        type: selectedExportType,
        generateTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
        status: 'completed',
        fileUrl: '#',
        expireDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
      
      setExportHistory(prev => [newExport, ...prev]);
      Taro.showToast({ title: '导出成功', icon: 'success' });
    } catch (error) {
      console.error('[PrivacyPage] 导出失败:', error);
      Taro.showToast({ title: '导出失败，请重试', icon: 'none' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (record: ExportRecord) => {
    console.log('[PrivacyPage] 下载导出文件:', record.id);
    Taro.showToast({ title: '开始下载...', icon: 'none' });
  };

  const handleShare = (record: ExportRecord) => {
    console.log('[PrivacyPage] 分享导出文件:', record.id);
    Taro.showModal({
      title: '分享恢复记录',
      content: '您确定要分享这份恢复记录吗？分享后对方将能查看您的恢复照片和数据。',
      confirmText: '确认分享',
      confirmColor: '#8B5CF6',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '分享链接已复制', icon: 'success' });
        }
      }
    });
  };

  const getPrivacyItems = () => [
    {
      key: 'allowInternalTeaching',
      title: '允许用于内部教学',
      description: '开启后，您的恢复照片可能会被匿名化处理后用于机构内部医学教学培训，帮助提升医疗服务质量。',
      value: privacySettings.allowInternalTeaching,
      sensitive: true
    },
    {
      key: 'allowCaseDisplay',
      title: '允许用于案例展示',
      description: '开启后，您的恢复案例可能会被匿名化处理后用于机构宣传案例展示，展示时会对面部进行模糊处理。',
      value: privacySettings.allowCaseDisplay,
      sensitive: true
    },
    {
      key: 'allowDataAnalysis',
      title: '允许用于数据分析',
      description: '开启后，您的匿名化恢复数据将用于医疗效果分析和研究，帮助优化治疗方案。',
      value: privacySettings.allowDataAnalysis,
      sensitive: false
    }
  ];

  const getExportTypeLabel = (type: ExportType): string => {
    const found = exportTypeOptions.find(o => o.key === type);
    return found?.name || type;
  };

  const getExportTypeIcon = (type: ExportType): string => {
    const found = exportTypeOptions.find(o => o.key === type);
    return found?.icon || '📄';
  };

  if (!isBound) {
    return (
      <ScrollView className={styles.page} scrollY>
        <View className={styles.emptyHistory}>
          <Text style={{ fontSize: 80, opacity: 0.5, display: 'block', marginBottom: 16 }}>🔒</Text>
          <Text style={{ fontSize: 28, color: '#6B7280', marginBottom: 8 }}>请先绑定复诊码</Text>
          <Text style={{ fontSize: 24, color: '#9CA3AF', lineHeight: 1.6, marginBottom: 24 }}>
            绑定后即可管理您的隐私授权和导出恢复记录
          </Text>
          <Button
            className={classnames(styles.exportBtn)}
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
        <View className={styles.headerIcon}>🔒</View>
        <Text className={styles.headerTitle}>隐私授权管理</Text>
        <Text className={styles.headerDesc}>
          您的隐私是我们的首要关切。所有照片和数据均采用端到端加密存储，
          您可以随时管理授权和导出您的数据。
        </Text>
      </View>

      <View className={styles.content}>
        <View className={styles.securityCard}>
          <View className={styles.securityIcon}>🛡️</View>
          <View className={styles.securityText}>
            <Text className={styles.securityTitle}>端到端加密保护</Text>
            <Text className={styles.securityDesc}>
              您的所有恢复照片和数据均采用银行级加密存储，
              仅您本人和主治医生有权限查看。
            </Text>
          </View>
        </View>

        <Text className={styles.sectionTitle}>
          <View className={styles.sectionIcon}>⚙️</View>
          隐私授权设置
        </Text>

        <PrivacySwitch
          items={getPrivacyItems()}
          onChange={handlePrivacyChange}
        />

        <View className={styles.autoDeleteSection}>
          <View className={styles.autoDeleteHeader}>
            <Text className={styles.autoDeleteTitle}>自动删除设置</Text>
            <Text className={styles.autoDeleteValue}>
              {privacySettings.autoDeleteDays === 0 
                ? '永不删除' 
                : `${privacySettings.autoDeleteDays}天后自动删除`}
            </Text>
          </View>
          <Text style={{ fontSize: 24, color: '#6B7280', marginBottom: 16, lineHeight: 1.6 }}>
            设置恢复照片的自动删除周期，到期后系统将自动删除您的照片和数据，进一步保护您的隐私。
          </Text>
          <View className={styles.autoDeleteOptions}>
            {autoDeleteOptions.map((option) => (
              <View
                key={option.days}
                className={classnames(
                  styles.autoDeleteOption,
                  privacySettings.autoDeleteDays === option.days && styles.selected
                )}
                onClick={() => handleAutoDeleteChange(option.days)}
              >
                {option.label}
              </View>
            ))}
          </View>
        </View>

        <Text className={styles.sectionTitle}>
          <View className={styles.sectionIcon}>📤</View>
          恢复记录导出
        </Text>

        <View className={styles.exportSection}>
          <View className={styles.exportHeader}>
            <View className={styles.exportInfo}>
              <Text className={styles.exportTitle}>导出个人恢复档案</Text>
              <Text className={styles.exportDesc}>
                您可以导出完整的个人恢复记录，包含 {stats.totalPhotos} 张照片、
                {stats.reviewedPhotos} 条医生反馈，共 {stats.completedDays} 天的恢复数据。
              </Text>
            </View>
            <Button
              className={styles.exportBtn}
              onClick={() => setShowExportModal(true)}
            >
              生成导出
            </Button>
          </View>
        </View>

        <View className={styles.exportHistory}>
          <Text className={styles.sectionTitle} style={{ margin: 0 }}>
            <View className={styles.sectionIcon}>📁</View>
            导出历史记录
          </Text>
          
          {exportHistory.length > 0 ? (
            exportHistory.map((record) => (
              <View key={record.id} className={styles.historyItem}>
                <View className={styles.historyIcon}>
                  {getExportTypeIcon(record.type)}
                </View>
                <View className={styles.historyInfo}>
                  <Text className={styles.historyType}>
                    {getExportTypeLabel(record.type)}
                  </Text>
                  <Text className={styles.historyTime}>
                    {record.generateTime} · 有效期至 {record.expireDate}
                  </Text>
                </View>
                <View className={classnames(
                  styles.historyStatus,
                  record.status === 'completed' ? styles.completed :
                  record.status === 'generating' ? styles.generating : styles.failed
                )}>
                  {record.status === 'completed' ? '已完成' :
                   record.status === 'generating' ? '生成中' : '失败'}
                </View>
                {record.status === 'completed' && (
                  <>
                    <Button
                      className={styles.historyAction}
                      onClick={() => handleDownload(record)}
                    >
                      下载
                    </Button>
                    <Button
                      className={styles.historyAction}
                      onClick={() => handleShare(record)}
                    >
                      分享
                    </Button>
                  </>
                )}
              </View>
            ))
          ) : (
            <View className={styles.emptyHistory}>
              暂无导出记录，点击上方按钮生成您的第一份恢复档案
            </View>
          )}
        </View>

        <View className={styles.privacyTips}>
          <Text className={styles.tipsTitle}>
            💡 隐私保护小贴士
          </Text>
          <View className={styles.tipsList}>
            <View className={styles.tipItem}>
              <Text className={styles.tipIcon}>•</Text>
              <Text className={styles.tipIcon}>
                请勿将恢复照片发送到微信等公共聊天平台，避免隐私泄露
              </Text>
            </View>
            <View className={styles.tipItem}>
              <Text className={styles.tipIcon}>•</Text>
              <Text className={styles.tipIcon}>
                所有照片仅存储于本小程序加密服务器，不会被用于其他用途
              </Text>
            </View>
            <View className={styles.tipItem}>
              <Text className={styles.tipIcon}>•</Text>
              <Text className={styles.tipIcon}>
                您可以随时撤回已上传但未被查看的照片
              </Text>
            </View>
            <View className={styles.tipItem}>
              <Text className={styles.tipIcon}>•</Text>
              <Text className={styles.tipIcon}>
                授权开启后，所有使用都会进行匿名化处理，保护您的个人信息
              </Text>
            </View>
          </View>
        </View>
      </View>

      {showExportModal && (
        <View className={styles.exportModal} onClick={() => setShowExportModal(false)}>
          <View className={styles.exportModalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.exportModalHeader}>
              <Text className={styles.exportModalTitle}>选择导出内容</Text>
              <View className={styles.exportModalClose} onClick={() => setShowExportModal(false)}>
                ✕
              </View>
            </View>
            
            <Text className={styles.exportModalDesc}>
              请选择您需要导出的内容类型，导出文件将在30天后自动失效。
            </Text>

            <View className={styles.exportOptions}>
              {exportTypeOptions.map((option) => (
                <View
                  key={option.key}
                  className={classnames(
                    styles.exportOption,
                    selectedExportType === option.key && styles.selected
                  )}
                  onClick={() => setSelectedExportType(option.key)}
                >
                  <Text className={styles.exportOptionIcon}>{option.icon}</Text>
                  <Text className={styles.exportOptionName}>{option.name}</Text>
                  <Text className={styles.exportOptionDesc}>{option.desc}</Text>
                </View>
              ))}
            </View>

            <View className={styles.exportModalActions}>
              <Button
                className={classnames(styles.exportModalBtn, styles.cancel)}
                onClick={() => setShowExportModal(false)}
              >
                取消
              </Button>
              <Button
                className={classnames(styles.exportModalBtn, styles.confirm)}
                onClick={handleGenerateExport}
              >
                确认生成
              </Button>
            </View>
          </View>
        </View>
      )}

      {isGenerating && (
        <View className={styles.loadingOverlay}>
          <View className={styles.loadingCard}>
            <Text className={styles.loadingIcon}>⏳</Text>
            <Text className={styles.loadingText}>正在生成导出文件</Text>
            <Text className={styles.loadingDesc}>请稍候，这可能需要几秒钟...</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default PrivacyPage;
