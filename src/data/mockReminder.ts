import type { Reminder } from '@/types';

export const mockReminders: Reminder[] = [
  {
    id: 'rem_001',
    type: 'suture',
    title: '拆线提醒',
    description: '鼻部缝合线拆除，请准时到达医院，拆线前24小时保持伤口干燥',
    date: '2024-06-25',
    time: '10:00',
    location: '美颐医疗美容 2楼手术室',
    doctor: '张医生',
    completed: false,
    isImportant: true
  },
  {
    id: 'rem_002',
    type: 'visit',
    title: '术后一周复查',
    description: '张医生门诊复查，检查伤口愈合情况和肿胀消退情况',
    date: '2024-06-25',
    time: '10:30',
    location: '美颐医疗美容 1楼外科门诊',
    doctor: '张医生',
    completed: false,
    isImportant: true
  },
  {
    id: 'rem_003',
    type: 'medication',
    title: '服用消炎药',
    description: '头孢克洛 0.25g，每日两次，饭后服用，连续服用7天',
    date: '2024-06-21',
    time: '08:00',
    completed: true,
    isImportant: false
  },
  {
    id: 'rem_004',
    type: 'care',
    title: '伤口护理提醒',
    description: '用生理盐水轻轻清洁伤口，然后涂抹抗生素软膏，保持伤口干燥',
    date: '2024-06-21',
    time: '20:00',
    completed: false,
    isImportant: false
  },
  {
    id: 'rem_005',
    type: 'visit',
    title: '术后两周复查',
    description: '复查恢复情况，评估手术效果，确定后续护理方案',
    date: '2024-07-02',
    time: '14:00',
    location: '美颐医疗美容 1楼外科门诊',
    doctor: '张医生',
    completed: false,
    isImportant: false
  },
  {
    id: 'rem_006',
    type: 'care',
    title: '开始热敷',
    description: '拆线后开始热敷，每日两次，每次15分钟，促进消肿',
    date: '2024-06-26',
    time: '10:00',
    completed: false,
    isImportant: false
  },
  {
    id: 'rem_007',
    type: 'medication',
    title: '涂抹祛疤膏',
    description: '拆线后开始使用硅酮凝胶祛疤膏，每日早晚各一次，连续使用3个月',
    date: '2024-06-26',
    time: '09:00',
    completed: false,
    isImportant: false
  },
  {
    id: 'rem_008',
    type: 'visit',
    title: '术后一个月复查',
    description: '全面复查恢复情况，确认最终效果',
    date: '2024-07-16',
    time: '10:00',
    location: '美颐医疗美容 1楼外科门诊',
    doctor: '张医生',
    completed: false,
    isImportant: true
  },
  {
    id: 'rem_009',
    type: 'care',
    title: '防晒提醒',
    description: '外出时请涂抹SPF30+防晒霜，佩戴遮阳帽，避免色素沉着',
    date: '2024-06-21',
    time: '07:00',
    completed: true,
    isImportant: false
  },
  {
    id: 'rem_010',
    type: 'medication',
    title: '服用消肿药',
    description: '迈之灵片 2片，每日两次，饭后服用，促进静脉回流减轻肿胀',
    date: '2024-06-21',
    time: '20:00',
    completed: true,
    isImportant: false
  }
];

export const getReminderTypeLabels: Record<Reminder['type'], string> = {
  suture: '拆线',
  visit: '复诊',
  care: '护理',
  medication: '用药'
};

export const getRemindersByDate = (date: string): Reminder[] => {
  return mockReminders.filter(r => r.date === date);
};

export const getImportantReminders = (): Reminder[] => {
  return mockReminders.filter(r => r.isImportant && !r.completed);
};

export const getUncompletedReminders = (): Reminder[] => {
  return mockReminders.filter(r => !r.completed);
};
