import React, { useState } from 'react';
import { View, Text, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import type { SymptomRecord } from '@/types';

interface SymptomSelectorProps {
  value?: Partial<SymptomRecord>;
  onChange?: (value: SymptomRecord) => void;
}

const symptomTypes = [
  { key: 'swelling', name: '肿胀程度', labels: ['无', '轻微', '中度', '明显', '严重'] },
  { key: 'pain', name: '疼痛程度', labels: ['无痛', '轻微', '中度', '较强', '剧烈'] },
  { key: 'bruising', name: '淤青程度', labels: ['无', '轻微', '片状', '明显', '严重'] }
] as const;

const SymptomSelector: React.FC<SymptomSelectorProps> = ({ value, onChange }) => {
  const [symptoms, setSymptoms] = useState<SymptomRecord>({
    swelling: value?.swelling || 0,
    pain: value?.pain || 0,
    bruising: value?.bruising || 0,
    description: value?.description || '',
    timestamp: new Date().toISOString()
  });

  const handleSliderClick = (key: 'swelling' | 'pain' | 'bruising', level: number) => {
    const updated = { ...symptoms, [key]: level };
    setSymptoms(updated);
    onChange?.(updated);
    Taro.vibrateShort({ type: 'light' });
  };

  const handleDescriptionChange = (e: any) => {
    const description = e.detail.value;
    const updated = { ...symptoms, description };
    setSymptoms(updated);
    onChange?.(updated);
  };

  return (
    <View className={styles.container}>
      <Text className={styles.title}>今日症状描述</Text>
      
      {symptomTypes.map((type) => (
        <View key={type.key} className={styles.symptomItem}>
          <View className={styles.symptomHeader}>
            <Text className={styles.symptomName}>{type.name}</Text>
            <Text className={styles.symptomValue}>
              {symptoms[type.key]}级 - {type.labels[symptoms[type.key]]}
            </Text>
          </View>
          
          <View className={styles.sliderContainer}>
            <View className={styles.slider}>
              <View
                className={styles.sliderTrack}
                style={{ width: `${(symptoms[type.key] / 4) * 100}%` }}
              />
              {[0, 1, 2, 3, 4].map((level) => (
                <View
                  key={level}
                  className={styles.sliderThumb}
                  style={{
                    left: `${(level / 4) * 100}%`,
                    opacity: symptoms[type.key] === level ? 1 : 0.3,
                    transform: symptoms[type.key] === level 
                      ? 'translate(-50%, -50%) scale(1.2)' 
                      : 'translate(-50%, -50%) scale(1)'
                  }}
                  onClick={() => handleSliderClick(type.key, level)}
                />
              ))}
            </View>
          </View>
          
          <View className={styles.levelLabels}>
            {type.labels.map((label, index) => (
              <Text
                key={index}
                className={styles.levelLabel}
                style={{
                  color: symptoms[type.key] === index ? '$color-primary' : undefined
                }}
              >
                {label}
              </Text>
            ))}
          </View>
        </View>
      ))}
      
      <View className={styles.descriptionInput}>
        <Text className={styles.inputLabel}>补充说明（选填）</Text>
        <Textarea
          className={styles.textarea}
          placeholder="请描述您的具体感受，如瘙痒、麻木、异常分泌物等..."
          value={symptoms.description}
          onInput={handleDescriptionChange}
          maxlength={200}
          autoHeight
        />
      </View>
    </View>
  );
};

export default SymptomSelector;
