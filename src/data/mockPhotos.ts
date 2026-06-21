import type { PhotoRecord, DoctorFeedback } from '@/types';

const photoIds = [177, 338, 1027, 64, 91, 177, 338, 1027, 64, 91];

export const mockPhotos: PhotoRecord[] = [
  {
    id: 'photo_001',
    date: '2024-06-15',
    angle: '正面',
    angleId: 'angle_001',
    imageUrl: `https://picsum.photos/id/${photoIds[0]}/400/600`,
    thumbnail: `https://picsum.photos/id/${photoIds[0]}/200/300`,
    uploadTime: '2024-06-15 10:30',
    status: 'reviewed',
    feedback: {
      id: 'fb_001',
      photoId: 'photo_001',
      doctorName: '李医生',
      content: '术后第一天，肿胀正常，注意冰敷消肿，避免剧烈运动。',
      needVisit: false,
      notes: ['保持伤口清洁', '按时服用消炎药', '睡眠时垫高头部'],
      timestamp: '2024-06-15 15:20',
      status: 'normal'
    },
    symptoms: {
      swelling: 3,
      pain: 2,
      bruising: 1,
      description: '有点肿胀，轻微疼痛',
      timestamp: '2024-06-15 10:30'
    }
  },
  {
    id: 'photo_002',
    date: '2024-06-15',
    angle: '左侧45°',
    angleId: 'angle_002',
    imageUrl: `https://picsum.photos/id/${photoIds[1]}/400/600`,
    thumbnail: `https://picsum.photos/id/${photoIds[1]}/200/300`,
    uploadTime: '2024-06-15 10:32',
    status: 'reviewed',
    feedback: {
      id: 'fb_002',
      photoId: 'photo_002',
      doctorName: '李医生',
      content: '左侧肿胀明显，属于正常术后反应，继续观察。',
      needVisit: false,
      notes: ['左侧适当多冰敷', '避免左侧卧位'],
      timestamp: '2024-06-15 15:25',
      status: 'normal'
    }
  },
  {
    id: 'photo_003',
    date: '2024-06-15',
    angle: '右侧45°',
    angleId: 'angle_003',
    imageUrl: `https://picsum.photos/id/${photoIds[2]}/400/600`,
    thumbnail: `https://picsum.photos/id/${photoIds[2]}/200/300`,
    uploadTime: '2024-06-15 10:35',
    status: 'reviewed',
    feedback: {
      id: 'fb_003',
      photoId: 'photo_003',
      doctorName: '李医生',
      content: '右侧恢复良好，继续保持。',
      needVisit: false,
      notes: [],
      timestamp: '2024-06-15 15:30',
      status: 'normal'
    }
  },
  {
    id: 'photo_004',
    date: '2024-06-16',
    angle: '正面',
    angleId: 'angle_001',
    imageUrl: `https://picsum.photos/id/${photoIds[3]}/400/600`,
    thumbnail: `https://picsum.photos/id/${photoIds[3]}/200/300`,
    uploadTime: '2024-06-16 09:15',
    status: 'reviewed',
    feedback: {
      id: 'fb_004',
      photoId: 'photo_004',
      doctorName: '李医生',
      content: '肿胀较昨天略有加重，属于正常高峰期，不用过于担心。',
      needVisit: false,
      notes: ['继续冰敷', '饮食清淡', '避免辛辣刺激食物'],
      timestamp: '2024-06-16 14:00',
      status: 'normal'
    },
    symptoms: {
      swelling: 4,
      pain: 2,
      bruising: 2,
      description: '肿胀比昨天明显，有轻微淤青',
      timestamp: '2024-06-16 09:15'
    }
  },
  {
    id: 'photo_005',
    date: '2024-06-16',
    angle: '左侧45°',
    angleId: 'angle_002',
    imageUrl: `https://picsum.photos/id/${photoIds[4]}/400/600`,
    thumbnail: `https://picsum.photos/id/${photoIds[4]}/200/300`,
    uploadTime: '2024-06-16 09:17',
    status: 'reviewed',
    feedback: {
      id: 'fb_005',
      photoId: 'photo_005',
      doctorName: '李医生',
      content: '左侧淤青开始显现，这是正常现象，会逐渐消退。',
      needVisit: false,
      notes: ['72小时后可以热敷促进淤青消退'],
      timestamp: '2024-06-16 14:05',
      status: 'normal'
    }
  },
  {
    id: 'photo_006',
    date: '2024-06-16',
    angle: '右侧45°',
    angleId: 'angle_003',
    imageUrl: `https://picsum.photos/id/${photoIds[5]}/400/600`,
    thumbnail: `https://picsum.photos/id/${photoIds[5]}/200/300`,
    uploadTime: '2024-06-16 09:20',
    status: 'reviewed',
    feedback: {
      id: 'fb_006',
      photoId: 'photo_006',
      doctorName: '李医生',
      content: '右侧情况良好。',
      needVisit: false,
      notes: [],
      timestamp: '2024-06-16 14:10',
      status: 'normal'
    }
  },
  {
    id: 'photo_007',
    date: '2024-06-20',
    angle: '正面',
    angleId: 'angle_001',
    imageUrl: `https://picsum.photos/id/${photoIds[6]}/400/600`,
    thumbnail: `https://picsum.photos/id/${photoIds[6]}/200/300`,
    uploadTime: '2024-06-20 11:00',
    status: 'pending',
    symptoms: {
      swelling: 2,
      pain: 1,
      bruising: 1,
      description: '肿胀消退很多',
      timestamp: '2024-06-20 11:00'
    }
  }
];

export const getPhotosByDate = (date: string): PhotoRecord[] => {
  return mockPhotos.filter(p => p.date === date);
};

export const getPhotoById = (id: string): PhotoRecord | undefined => {
  return mockPhotos.find(p => p.id === id);
};

export const getPendingPhotos = (): PhotoRecord[] => {
  return mockPhotos.filter(p => p.status === 'pending');
};

export const getReviewedPhotos = (): PhotoRecord[] => {
  return mockPhotos.filter(p => p.status === 'reviewed');
};
