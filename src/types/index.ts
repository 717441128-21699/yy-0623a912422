export interface UserInfo {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  clinicCode: string;
  clinicName: string;
  isBound: boolean;
  bindDate: string;
}

export interface ProjectInfo {
  id: string;
  name: string;
  category: string;
  surgeryDate: string;
  recoveryDays: number;
  doctorName: string;
  photoAngles: PhotoAngle[];
}

export interface PhotoAngle {
  id: string;
  name: string;
  description: string;
  required: boolean;
  icon: string;
}

export interface CalendarDay {
  date: string;
  dayOfWeek: number;
  status: 'pending' | 'completed' | 'today' | 'future' | 'missed';
  photosRequired: number;
  photosUploaded: number;
  hasFeedback: boolean;
  isRestricted: boolean;
}

export interface PhotoRecord {
  id: string;
  date: string;
  angle: string;
  angleId: string;
  imageUrl: string;
  thumbnail: string;
  uploadTime: string;
  status: 'pending' | 'reviewed' | 'withdrawn';
  feedback?: DoctorFeedback;
  symptoms?: SymptomRecord;
}

export interface SymptomRecord {
  swelling: number;
  pain: number;
  bruising: number;
  description: string;
  timestamp: string;
}

export interface DoctorFeedback {
  id: string;
  photoId: string;
  doctorName: string;
  content: string;
  needVisit: boolean;
  visitSuggestion?: string;
  notes: string[];
  timestamp: string;
  status: 'normal' | 'warning' | 'attention';
}

export interface Reminder {
  id: string;
  type: 'visit' | 'suture' | 'care' | 'medication';
  title: string;
  description: string;
  date: string;
  time?: string;
  location?: string;
  doctor?: string;
  completed: boolean;
  isImportant?: boolean;
}

export interface PrivacySettings {
  allowInternalTeaching: boolean;
  allowCaseDisplay: boolean;
  allowDataAnalysis: boolean;
  autoDeleteDays: number;
  allowExport: boolean;
}

export interface ExportRecord {
  id: string;
  type: 'full' | 'photos' | 'medical' | 'feedback';
  generateTime: string;
  status: 'generating' | 'completed' | 'failed';
  fileUrl?: string;
  expireDate: string;
}
