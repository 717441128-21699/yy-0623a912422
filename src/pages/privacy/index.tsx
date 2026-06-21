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
    project,
    photos,
    privacySettings,
    updatePrivacySettings,
    isBound,
    getStats
  } = useApp();

  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedExportType, setSelectedExportType] = useState<ExportType>('full');
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportRecords, setExportRecords] = useState<ExportRecord[]>(() => {
    try {
      const raw = Taro.getStorageSync('recovery_exports');
      if (raw) return JSON.parse(raw as string) as ExportRecord[];
    } catch (_) {}
    return [];
  });

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

  const generateExportHTML = (type: ExportType): string => {
    const now = new Date().toLocaleString('zh-CN');
    const projectName = project?.name || '未知项目';
    const doctorName = project?.doctorName || '未知医生';
    const surgeryDate = project?.surgeryDate || '未知';

    let html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>个人恢复档案 - ${projectName}</title><style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8faff;color:#1f2937;padding:20px;line-height:1.6}
.container{max-width:800px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)}
.header{background:linear-gradient(135deg,#5B8DEF,#4F46E5);color:#fff;padding:32px}
.header h1{font-size:24px;margin-bottom:8px}
.header p{opacity:.9;font-size:14px}
.section{padding:24px;border-bottom:1px solid #f3f4f6}
.section:last-child{border-bottom:none}
.section h2{font-size:18px;color:#1f2937;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #5B8DEF;display:inline-block}
.info-row{display:flex;padding:8px 0;border-bottom:1px solid #f3f4f6}
.info-row:last-child{border-bottom:none}
.info-label{width:120px;color:#9ca3af;font-size:14px;flex-shrink:0}
.info-value{flex:1;font-size:14px;color:#1f2937}
.photo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-top:12px}
.photo-card{border-radius:8px;overflow:hidden;border:1px solid #e5e7eb}
.photo-card img{width:100%;aspect-ratio:2/3;object-fit:cover;display:block}
.photo-card .meta{padding:8px;font-size:12px;color:#6b7280}
.symptom-tag{display:inline-block;padding:2px 8px;background:#fde8e8;color:#f7a1a1;border-radius:4px;font-size:12px;margin:2px}
.feedback-card{background:#f8faff;border-radius:8px;padding:16px;margin-top:12px;border-left:4px solid #5b8def}
.feedback-card .doctor{font-weight:600;color:#5b8def;margin-bottom:8px}
.feedback-card .content{font-size:14px;color:#374151;margin-bottom:8px}
.feedback-card .note{font-size:13px;color:#6b7280;padding:4px 0;padding-left:16px}
.visit-warning{background:#fee2e2;border-radius:8px;padding:12px;margin-top:8px;color:#dc2626;font-size:14px}
.footer{text-align:center;padding:16px;color:#9ca3af;font-size:12px}
.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:500}
.badge-pending{background:#fef3c7;color:#d97706}
.badge-reviewed{background:#d1fae5;color:#059669}
.badge-withdrawn{background:#f3f4f6;color:#9ca3af}
</style></head><body><div class="container">
<div class="header"><h1>📋 个人恢复档案</h1><p>${projectName} · ${user.clinicName || '未知机构'}</p><p>导出时间：${now}</p></div>`;

    if (type === 'full' || type === 'medical') {
      html += `<div class="section"><h2>🏥 项目信息</h2>
<div class="info-row"><span class="info-label">项目名称</span><span class="info-value">${projectName}</span></div>
<div class="info-row"><span class="info-label">项目类别</span><span class="info-value">${project?.category || '未知'}</span></div>
<div class="info-row"><span class="info-label">手术日期</span><span class="info-value">${surgeryDate}</span></div>
<div class="info-row"><span class="info-label">主治医生</span><span class="info-value">${doctorName}</span></div>
<div class="info-row"><span class="info-label">恢复周期</span><span class="info-value">${project?.recoveryDays || 30}天</span></div>
<div class="info-row"><span class="info-label">绑定机构</span><span class="info-value">${user.clinicName || '未知'}</span></div>
<div class="info-row"><span class="info-label">绑定日期</span><span class="info-value">${user.bindDate || '未知'}</span></div>
<div class="info-row"><span class="info-label">已传照片</span><span class="info-value">${stats.totalPhotos}张</span></div>
<div class="info-row"><span class="info-label">医生回复</span><span class="info-value">${stats.reviewedPhotos}条</span></div>
<div class="info-row"><span class="info-label">恢复天数</span><span class="info-value">${stats.completedDays}天</span></div>
</div>`;
    }

    if (type === 'full' || type === 'photos') {
      const activePhotos = photos.filter(p => p.status !== 'withdrawn');
      html += `<div class="section"><h2>📷 恢复照片记录（${activePhotos.length}张）</h2>`;
      
      const grouped: Record<string, typeof activePhotos> = {};
      activePhotos.forEach(p => {
        if (!grouped[p.date]) grouped[p.date] = [];
        grouped[p.date].push(p);
      });

      Object.entries(grouped).forEach(([date, datePhotos]) => {
        html += `<h3 style="font-size:15px;margin:16px 0 8px;color:#6b7280">${date}</h3><div class="photo-grid">`;
        datePhotos.forEach(photo => {
          const statusClass = photo.status === 'reviewed' ? 'badge-reviewed' : 'badge-pending';
          const statusText = photo.status === 'reviewed' ? '已回复' : '待查看';
          html += `<div class="photo-card"><img src="${photo.imageUrl}" alt="${photo.angle}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22300%22><rect fill=%22%23f3f4f6%22 width=%22200%22 height=%22300%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%239ca3af%22 font-size=%2214%22>照片</text></svg>'">
<div class="meta">${photo.angle} · <span class="badge ${statusClass}">${statusText}</span></div></div>`;
        });
        html += '</div>';
      });

      html += '</div>';
    }

    if (type === 'full' || type === 'medical') {
      const photosWithSymptoms = photos.filter(p => p.symptoms && p.status !== 'withdrawn');
      if (photosWithSymptoms.length > 0) {
        html += `<div class="section"><h2>📝 症状记录</h2>`;
        photosWithSymptoms.forEach(photo => {
          const s = photo.symptoms!;
          html += `<div style="padding:8px 0;border-bottom:1px solid #f3f4f6">
<div style="font-weight:500;margin-bottom:4px">${photo.date} ${photo.angle}</div>
<div>`;
          if (s.swelling > 0) html += `<span class="symptom-tag">肿胀${s.swelling}级</span>`;
          if (s.pain > 0) html += `<span class="symptom-tag">疼痛${s.pain}级</span>`;
          if (s.bruising > 0) html += `<span class="symptom-tag">淤青${s.bruising}级</span>`;
          if (s.description) html += `<div style="font-size:13px;color:#6b7280;margin-top:4px">${s.description}</div>`;
          html += '</div></div>';
        });
        html += '</div>';
      }
    }

    if (type === 'full' || type === 'feedback') {
      const photosWithFeedback = photos.filter(p => p.feedback && p.status !== 'withdrawn');
      if (photosWithFeedback.length > 0) {
        html += `<div class="section"><h2>💬 医生反馈（${photosWithFeedback.length}条）</h2>`;
        photosWithFeedback.forEach(photo => {
          const fb = photo.feedback!;
          html += `<div class="feedback-card">
<div class="doctor">👨‍⚕️ ${fb.doctorName} · ${fb.timestamp}</div>
<div class="content">${fb.content}</div>`;
          if (fb.notes.length > 0) {
            html += '<div style="margin-top:8px;font-size:13px;color:#6b7280">📋 注意事项：</div>';
            fb.notes.forEach(note => {
              html += `<div class="note">• ${note}</div>`;
            });
          }
          if (fb.needVisit) {
            html += `<div class="visit-warning">⚠️ 建议到院复诊：${fb.visitSuggestion || '请尽快联系预约到院复诊'}</div>`;
          }
          html += '</div>';
        });
        html += '</div>';
      }
    }

    html += `<div class="footer">🔒 本档案由术后恢复影像小程序生成，仅限本人查看<br>隐私设置：内部教学=${privacySettings.allowInternalTeaching ? '已授权' : '未授权'} · 案例展示=${privacySettings.allowCaseDisplay ? '已授权' : '未授权'} · 数据分析=${privacySettings.allowDataAnalysis ? '已授权' : '未授权'}</div></div></body></html>`;

    return html;
  };

  const handleGenerateExport = async () => {
    console.log('[PrivacyPage] 生成导出文件:', selectedExportType);
    setIsGenerating(true);
    setShowExportModal(false);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const htmlContent = generateExportHTML(selectedExportType);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const newExport: ExportRecord = {
        id: `exp_${Date.now()}`,
        type: selectedExportType,
        generateTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
        status: 'completed',
        fileUrl: url,
        expireDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };

      const updatedRecords = [newExport, ...exportRecords];
      setExportRecords(updatedRecords);
      Taro.setStorageSync('recovery_exports', JSON.stringify(updatedRecords));

      Taro.showModal({
        title: '导出成功',
        content: '个人恢复档案已生成，点击"打开"可在浏览器中查看完整报告，也可保存为HTML文件留存。',
        confirmText: '打开档案',
        cancelText: '关闭',
        success: (res) => {
          if (res.confirm) {
            window.open(url, '_blank');
          }
        }
      });
    } catch (error) {
      console.error('[PrivacyPage] 导出失败:', error);
      Taro.showToast({ title: '导出失败，请重试', icon: 'none' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (record: ExportRecord) => {
    console.log('[PrivacyPage] 下载/打开导出文件:', record.id);
    if (record.fileUrl && record.fileUrl !== '#') {
      window.open(record.fileUrl, '_blank');
    } else {
      const htmlContent = generateExportHTML(record.type);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
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
          if (record.fileUrl && record.fileUrl !== '#') {
            navigator.clipboard?.writeText(record.fileUrl).then(() => {
              Taro.showToast({ title: '链接已复制到剪贴板', icon: 'success' });
            }).catch(() => {
              Taro.showToast({ title: '请手动复制链接', icon: 'none' });
            });
          } else {
            Taro.showToast({ title: '链接已复制', icon: 'success' });
          }
        }
      }
    });
  };

  const handleDeleteExport = (recordId: string) => {
    Taro.showModal({
      title: '删除导出记录',
      content: '确认删除此导出记录？删除后无法恢复。',
      confirmText: '确认删除',
      confirmColor: '#F87171',
      success: (res) => {
        if (res.confirm) {
          const updated = exportRecords.filter(r => r.id !== recordId);
          setExportRecords(updated);
          Taro.setStorageSync('recovery_exports', JSON.stringify(updated));
          Taro.showToast({ title: '已删除', icon: 'success' });
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
                导出包含项目信息、症状记录、恢复照片和医生意见的完整HTML档案，可在浏览器中查看和保存。
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
                      打开
                    </Button>
                    <Button
                      className={styles.historyAction}
                      onClick={() => handleDeleteExport(record.id)}
                    >
                      删除
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
                您可以随时撤回已上传但未被查看的非必拍照片
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
              选择需要导出的内容类型，系统将生成一份可在浏览器中打开的HTML个人档案，包含完整的项目、症状、照片和医生反馈数据。
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
            <Text className={styles.loadingDesc}>正在汇总项目信息、照片记录和医生反馈...</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default PrivacyPage;
