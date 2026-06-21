import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import Taro from '@tarojs/taro';
import type { UserInfo, ProjectInfo, PhotoRecord, CalendarDay, Reminder, PrivacySettings, SymptomRecord, ExportRecord } from '@/types';
import { mockUnboundUser, mockProject, mockPrivacySettings } from '@/data/mockUser';
import { mockCalendarDays, mockPreOpPhoto } from '@/data/mockCalendar';
import { mockPhotos } from '@/data/mockPhotos';
import { mockReminders } from '@/data/mockReminder';

const VALID_CLINIC_CODES = new Set([
  'MEI20240615001',
  'MEI20240615002',
  'MEI20240615003',
  'MEI20240620001'
]);

const STORAGE_KEYS = {
  USER: 'recovery_user',
  IS_BOUND: 'recovery_is_bound',
  PROJECT: 'recovery_project',
  PHOTOS: 'recovery_photos',
  CALENDAR: 'recovery_calendar',
  PRIVACY: 'recovery_privacy',
  EXPORTS: 'recovery_exports',
  EXPORT_CONTENTS: 'recovery_export_contents'
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = Taro.getStorageSync(key);
    if (raw) return JSON.parse(raw as string) as T;
  } catch (e) {
    console.warn('[Storage] read failed:', key, e);
  }
  return fallback;
}

function saveToStorage(key: string, value: unknown): void {
  try {
    Taro.setStorageSync(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[Storage] write failed:', key, e);
  }
}

interface AppState {
  user: UserInfo;
  project: ProjectInfo | null;
  calendarDays: CalendarDay[];
  photos: PhotoRecord[];
  reminders: Reminder[];
  privacySettings: PrivacySettings;
  preOpPhoto: string;
  isBound: boolean;
  exportRecords: ExportRecord[];
  exportContents: Record<string, string>;
}

interface AppContextType extends AppState {
  bindClinicCode: (code: string) => Promise<{ success: boolean; message: string }>;
  uploadPhoto: (angleId: string, imageUrl: string, symptoms: SymptomRecord) => Promise<boolean>;
  withdrawPhoto: (photoId: string) => Promise<boolean>;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => void;
  markReminderCompleted: (reminderId: string) => void;
  completeReminder: (reminderId: string) => Promise<boolean>;
  getTodayPhotos: () => PhotoRecord[];
  getPendingFeedbackCount: () => number;
  getTodayReminders: () => Reminder[];
  isAngleRequired: (angleId: string) => boolean;
  getStats: () => {
    totalDays: number;
    completedDays: number;
    totalPhotos: number;
    reviewedPhotos: number;
    totalReminders: number;
  };
  addExportRecord: (record: ExportRecord, content: string) => void;
  getExportContent: (recordId: string) => string | undefined;
  deleteExportRecord: (recordId: string) => void;
  openExportRecord: (recordId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isBound, setIsBound] = useState<boolean>(() => loadFromStorage(STORAGE_KEYS.IS_BOUND, false));
  const [user, setUser] = useState<UserInfo>(() => loadFromStorage(STORAGE_KEYS.USER, mockUnboundUser));
  const [project, setProject] = useState<ProjectInfo | null>(() => loadFromStorage<ProjectInfo | null>(STORAGE_KEYS.PROJECT, null));
  const [photos, setPhotos] = useState<PhotoRecord[]>(() => loadFromStorage(STORAGE_KEYS.PHOTOS, []));
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>(() => loadFromStorage(STORAGE_KEYS.CALENDAR, []));
  const [reminders] = useState<Reminder[]>(mockReminders);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(() => loadFromStorage(STORAGE_KEYS.PRIVACY, mockPrivacySettings));
  const [preOpPhoto] = useState(mockPreOpPhoto);
  const [exportRecords, setExportRecords] = useState<ExportRecord[]>(() => loadFromStorage(STORAGE_KEYS.EXPORTS, []));
  const [exportContents, setExportContents] = useState<Record<string, string>>(() => loadFromStorage(STORAGE_KEYS.EXPORT_CONTENTS, {}));

  useEffect(() => { saveToStorage(STORAGE_KEYS.IS_BOUND, isBound); }, [isBound]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.USER, user); }, [user]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.PROJECT, project); }, [project]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.PHOTOS, photos); }, [photos]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.CALENDAR, calendarDays); }, [calendarDays]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.PRIVACY, privacySettings); }, [privacySettings]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.EXPORTS, exportRecords); }, [exportRecords]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.EXPORT_CONTENTS, exportContents); }, [exportContents]);

  const bindClinicCode = useCallback(async (code: string): Promise<{ success: boolean; message: string }> => {
    console.log('[AppContext] 绑定复诊码:', code);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const trimmed = code.trim().toUpperCase();

    if (!trimmed) {
      return { success: false, message: '请输入复诊码' };
    }

    if (trimmed.length < 6) {
      return { success: false, message: '复诊码格式不正确，复诊码至少6位' };
    }

    if (!trimmed.startsWith('MEI')) {
      return { success: false, message: '复诊码无效，请检查是否正确输入。复诊码以MEI开头，可在术后须知单或机构客服处获取' };
    }

    if (!VALID_CLINIC_CODES.has(trimmed)) {
      return {
        success: false,
        message: `复诊码「${trimmed}」无效。请确认机构给出的正确复诊码，或联系客服核实。正确的复诊码如 MEI20240615001，可在术后须知单上找到。`
      };
    }

    const boundUser: UserInfo = {
      ...mockUnboundUser,
      id: `user_${Date.now()}`,
      name: '张女士',
      phone: '138****8888',
      avatar: 'https://picsum.photos/id/64/200/200',
      isBound: true,
      clinicCode: trimmed,
      clinicName: '美颐医疗美容',
      bindDate: new Date().toISOString().split('T')[0]
    };

    const boundProject: ProjectInfo = { ...mockProject };

    const today = new Date().toISOString().split('T')[0];
    const initialPhotos: PhotoRecord[] = mockPhotos.filter(p => p.date <= today);

    const initialCalendar: CalendarDay[] = mockCalendarDays.map(day => {
      const dayPhotos = initialPhotos.filter(p => p.date === day.date && p.status !== 'withdrawn');
      return {
        ...day,
        photosUploaded: dayPhotos.length,
        status: dayPhotos.length >= day.photosRequired
          ? 'completed'
          : dayPhotos.length > 0
            ? 'today'
            : day.status
      };
    });

    setUser(boundUser);
    setProject(boundProject);
    setPhotos(initialPhotos);
    setCalendarDays(initialCalendar);
    setIsBound(true);

    return { success: true, message: '绑定成功' };
  }, []);

  const uploadPhoto = useCallback(async (angleId: string, imageUrl: string, symptoms: SymptomRecord): Promise<boolean> => {
    console.log('[AppContext] 上传照片:', { angleId, symptoms });
    await new Promise(resolve => setTimeout(resolve, 500));

    const angle = project?.photoAngles.find(a => a.id === angleId);
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const newPhoto: PhotoRecord = {
      id: `photo_${Date.now()}`,
      date: today,
      angle: angle?.name || '未知角度',
      angleId,
      imageUrl,
      thumbnail: imageUrl,
      uploadTime: now,
      status: 'pending',
      symptoms
    };

    setPhotos(prev => [...prev, newPhoto]);
    setCalendarDays(prev => prev.map(day => {
      if (day.date === today) {
        const newUploaded = day.photosUploaded + 1;
        return {
          ...day,
          photosUploaded: newUploaded,
          status: newUploaded >= day.photosRequired ? 'completed' : 'today'
        };
      }
      return day;
    }));

    return true;
  }, [project?.photoAngles]);

  const withdrawPhoto = useCallback(async (photoId: string): Promise<boolean> => {
    console.log('[AppContext] 撤回照片:', photoId);
    await new Promise(resolve => setTimeout(resolve, 300));

    const photoToWithdraw = photos.find(p => p.id === photoId);
    if (!photoToWithdraw) {
      console.warn('[AppContext] 未找到要撤回的照片:', photoId);
      return false;
    }

    const withdrawnDate = photoToWithdraw.date;

    setPhotos(prev => prev.map(p => {
      if (p.id === photoId) {
        return { ...p, status: 'withdrawn' };
      }
      return p;
    }));

    if (withdrawnDate) {
      setCalendarDays(prev => {
        return prev.map(day => {
          if (day.date === withdrawnDate) {
            const activePhotosAfterWithdraw = photos.filter(p => 
              p.date === withdrawnDate && p.status !== 'withdrawn' && p.id !== photoId
            );
            const newUploaded = activePhotosAfterWithdraw.length;
            const today = new Date().toISOString().split('T')[0];
            let newStatus: CalendarDay['status'] = 'pending';

            if (newUploaded >= day.photosRequired) {
              newStatus = 'completed';
            } else if (newUploaded > 0 || day.date === today) {
              newStatus = 'today';
            } else if (day.date < today) {
              newStatus = 'missed';
            } else {
              newStatus = 'pending';
            }

            return {
              ...day,
              photosUploaded: newUploaded,
              status: newStatus
            };
          }
          return day;
        });
      });
    }

    return true;
  }, [photos]);

  const updatePrivacySettings = useCallback((settings: Partial<PrivacySettings>) => {
    console.log('[AppContext] 更新隐私设置:', settings);
    setPrivacySettings(prev => ({ ...prev, ...settings }));
  }, []);

  const markReminderCompleted = useCallback((reminderId: string) => {
    console.log('[AppContext] 标记提醒完成:', reminderId);
  }, []);

  const completeReminder = useCallback(async (reminderId: string): Promise<boolean> => {
    console.log('[AppContext] 完成提醒:', reminderId);
    await new Promise(resolve => setTimeout(resolve, 300));
    return true;
  }, []);

  const getTodayPhotos = useCallback((): PhotoRecord[] => {
    const today = new Date().toISOString().split('T')[0];
    return photos.filter(p => p.date === today && p.status !== 'withdrawn');
  }, [photos]);

  const getPendingFeedbackCount = useCallback((): number => {
    return photos.filter(p => p.status === 'pending').length;
  }, [photos]);

  const getTodayReminders = useCallback((): Reminder[] => {
    const today = new Date().toISOString().split('T')[0];
    return reminders.filter(r => r.date === today);
  }, [reminders]);

  const isAngleRequired = useCallback((angleId: string): boolean => {
    const angle = project?.photoAngles.find(a => a.id === angleId);
    return angle?.required ?? false;
  }, [project?.photoAngles]);

  const getStats = useCallback(() => {
    const totalDays = calendarDays.length;
    const completedDays = calendarDays.filter(d => d.status === 'completed').length;
    const totalPhotos = photos.filter(p => p.status !== 'withdrawn').length;
    const reviewedPhotos = photos.filter(p => p.status === 'reviewed').length;
    const totalReminders = reminders.length;

    return { totalDays, completedDays, totalPhotos, reviewedPhotos, totalReminders };
  }, [calendarDays, photos, reminders]);

  const addExportRecord = useCallback((record: ExportRecord, content: string) => {
    console.log('[AppContext] 添加导出记录:', record.id);
    setExportRecords(prev => [record, ...prev]);
    setExportContents(prev => ({ ...prev, [record.id]: content }));
  }, []);

  const getExportContent = useCallback((recordId: string): string | undefined => {
    return exportContents[recordId];
  }, [exportContents]);

  const deleteExportRecord = useCallback((recordId: string) => {
    console.log('[AppContext] 删除导出记录:', recordId);
    setExportRecords(prev => prev.filter(r => r.id !== recordId));
    setExportContents(prev => {
      const next = { ...prev };
      delete next[recordId];
      return next;
    });
  }, []);

  const openExportRecord = useCallback((recordId: string) => {
    console.log('[AppContext] 打开导出记录:', recordId);
    const content = exportContents[recordId];
    if (!content) {
      Taro.showToast({ title: '档案内容已过期，请重新生成', icon: 'none' });
      return;
    }
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }, [exportContents]);

  const value: AppContextType = {
    user,
    project,
    calendarDays,
    photos,
    reminders,
    privacySettings,
    preOpPhoto,
    isBound,
    exportRecords,
    exportContents,
    bindClinicCode,
    uploadPhoto,
    withdrawPhoto,
    updatePrivacySettings,
    markReminderCompleted,
    completeReminder,
    getTodayPhotos,
    getPendingFeedbackCount,
    getTodayReminders,
    isAngleRequired,
    getStats,
    addExportRecord,
    getExportContent,
    deleteExportRecord,
    openExportRecord
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
