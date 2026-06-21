import type { DoctorFeedback } from '@/types';

export const mockFeedbackList: DoctorFeedback[] = [
  {
    id: 'fb_001',
    photoId: 'photo_001',
    doctorName: '李医生',
    content: '术后第一天，肿胀正常，注意冰敷消肿，避免剧烈运动。',
    needVisit: false,
    notes: ['保持伤口清洁', '按时服用消炎药', '睡眠时垫高头部'],
    timestamp: '2024-06-15 15:20',
    status: 'normal'
  },
  {
    id: 'fb_002',
    photoId: 'photo_002',
    doctorName: '李医生',
    content: '左侧肿胀明显，属于正常术后反应，继续观察。',
    needVisit: false,
    notes: ['左侧适当多冰敷', '避免左侧卧位'],
    timestamp: '2024-06-15 15:25',
    status: 'normal'
  },
  {
    id: 'fb_003',
    photoId: 'photo_003',
    doctorName: '李医生',
    content: '右侧恢复良好，继续保持。',
    needVisit: false,
    notes: [],
    timestamp: '2024-06-15 15:30',
    status: 'normal'
  },
  {
    id: 'fb_004',
    photoId: 'photo_004',
    doctorName: '李医生',
    content: '肿胀较昨天略有加重，属于正常高峰期，不用过于担心。',
    needVisit: false,
    notes: ['继续冰敷', '饮食清淡', '避免辛辣刺激食物'],
    timestamp: '2024-06-16 14:00',
    status: 'normal'
  },
  {
    id: 'fb_005',
    photoId: 'photo_005',
    doctorName: '李医生',
    content: '左侧淤青开始显现，这是正常现象，会逐渐消退。',
    needVisit: false,
    notes: ['72小时后可以热敷促进淤青消退'],
    timestamp: '2024-06-16 14:05',
    status: 'normal'
  },
  {
    id: 'fb_006',
    photoId: 'photo_006',
    doctorName: '李医生',
    content: '右侧情况良好。',
    needVisit: false,
    notes: [],
    timestamp: '2024-06-16 14:10',
    status: 'normal'
  }
];

export const getFeedbackByPhotoId = (photoId: string): DoctorFeedback | undefined => {
  return mockFeedbackList.find(f => f.photoId === photoId);
};

export const getFeedbackByStatus = (status: DoctorFeedback['status']): DoctorFeedback[] => {
  return mockFeedbackList.filter(f => f.status === status);
};
