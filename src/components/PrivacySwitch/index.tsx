import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';

interface PrivacyItem {
  key: string;
  title: string;
  description: string;
  value: boolean;
  sensitive?: boolean;
}

interface PrivacySwitchProps {
  items: PrivacyItem[];
  onChange?: (key: string, value: boolean) => void;
}

const PrivacySwitch: React.FC<PrivacySwitchProps> = ({ items, onChange }) => {
  const handleToggle = (key: string, currentValue: boolean) => {
    const newValue = !currentValue;
    console.log('[PrivacySwitch] 切换:', key, newValue);
    
    if (newValue && key !== 'allowDataAnalysis' && key !== 'allowExport') {
      Taro.showModal({
        title: '隐私授权确认',
        content: getPrivacyWarning(key),
        confirmText: '确认授权',
        confirmColor: '#8B5CF6',
        success: (res) => {
          if (res.confirm) {
            onChange?.(key, newValue);
            Taro.vibrateShort({ type: 'light' });
          }
        }
      });
    } else {
      onChange?.(key, newValue);
      Taro.vibrateShort({ type: 'light' });
    }
  };

  const getPrivacyWarning = (key: string): string => {
    const warnings: Record<string, string> = {
      allowInternalTeaching: '开启后，您的恢复照片可能会被用于机构内部医学教学和培训。所有教学使用均会进行匿名化处理，您的个人信息将被严格保密。',
      allowCaseDisplay: '开启后，您的恢复案例可能会被用于机构的案例展示。所有展示均会进行面部模糊或匿名化处理，保护您的隐私。',
    };
    return warnings[key] || '确认开启此授权？';
  };

  return (
    <View className={styles.container}>
      {items.map((item) => (
        <View key={item.key} className={styles.item}>
          <View className={styles.header}>
            <View style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <Text className={styles.title}>{item.title}</Text>
              {item.sensitive && (
                <Text className={styles.privacyBadge}>隐私敏感</Text>
              )}
            </View>
            <View
              className={classnames(styles.switch, item.value && styles.active)}
              onClick={() => handleToggle(item.key, item.value)}
            >
              <View className={styles.switchKnob} />
            </View>
          </View>
          <Text className={styles.description}>{item.description}</Text>
        </View>
      ))}
    </View>
  );
};

export default PrivacySwitch;
