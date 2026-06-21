import type { UserInfo, ProjectInfo, PrivacySettings } from '@/types';

export const mockUser: UserInfo = {
  id: 'user_001',
  name: '张女士',
  phone: '138****8888',
  avatar: 'https://picsum.photos/id/64/200/200',
  clinicCode: 'MEI20240615001',
  clinicName: '美颐医疗美容',
  isBound: true,
  bindDate: '2024-06-15'
};

export const mockUnboundUser: UserInfo = {
  id: 'user_002',
  name: '',
  phone: '139****9999',
  avatar: '',
  clinicCode: '',
  clinicName: '',
  isBound: false,
  bindDate: ''
};

export const mockProject: ProjectInfo = {
  id: 'proj_001',
  name: '综合鼻整形术',
  category: '鼻部整形',
  surgeryDate: '2024-06-15',
  recoveryDays: 30,
  doctorName: '李医生',
  photoAngles: [
    {
      id: 'angle_001',
      name: '正面',
      description: '面部正对镜头，表情自然',
      required: true,
      icon: 'front'
    },
    {
      id: 'angle_002',
      name: '左侧45°',
      description: '面部向左转45度，保持自然',
      required: true,
      icon: 'left45'
    },
    {
      id: 'angle_003',
      name: '右侧45°',
      description: '面部向右转45度，保持自然',
      required: true,
      icon: 'right45'
    },
    {
      id: 'angle_004',
      name: '左侧90°',
      description: '面部完全侧向左边',
      required: false,
      icon: 'left90'
    },
    {
      id: 'angle_005',
      name: '右侧90°',
      description: '面部完全侧向右边',
      required: false,
      icon: 'right90'
    }
  ]
};

export const mockPrivacySettings: PrivacySettings = {
  allowInternalTeaching: false,
  allowCaseDisplay: false,
  allowDataAnalysis: true,
  autoDeleteDays: 180,
  allowExport: true
};
