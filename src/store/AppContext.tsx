import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { UserInfo, ProjectInfo, PhotoRecord, CalendarDay, Reminder, PrivacySettings, DoctorFeedback, SymptomRecord } from '@/types';
import { mockUser, mockProject, mockPrivacySettings } from '@/data/mockUser';
import { mockCalendarDays, mockPreOpPhoto } from '@/data/mockCalendar';
import { mockPhotos, getPhotosByDate } from '@/data/mockPhotos';
import { mockReminders, getUncompletedReminders, getImportantReminders } from '@/data/mockReminder';

interface AppState {
  user: UserInfo;
  project: ProjectInfo | null;
  calendarDays: CalendarDay[];
  photos: PhotoRecord[];
  reminders: Reminder[];
  privacySettings: PrivacySettings;
  preOpPhoto: string;
  isBound: boolean;
}

interface AppContextType extends AppState {
  bindClinicCode: (code: string) => Promise<boolean>;
  uploadPhoto: (angleId: string, imageUrl: string, symptoms: SymptomRecord) => Promise<boolean>;
  withdrawPhoto: (photoId: string) => Promise<boolean>;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => void;
  markReminderCompleted: (reminderId: string) => void;
  completeReminder: (reminderId: string) => Promise<boolean>;
  getTodayPhotos: () => PhotoRecord[];
  getPendingFeedbackCount: () => number;
  getTodayReminders: () => Reminder[];
  getStats: () => {
    totalDays: number;
    completedDays: number;
    totalPhotos: number;
    reviewedPhotos: number;
    totalReminders: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    user: mockUser,
    project: mockProject,
    calendarDays: mockCalendarDays,
    photos: mockPhotos,
    reminders: mockReminders,
    privacySettings: mockPrivacySettings,
    preOpPhoto: mockPreOpPhoto,
    isBound: true
  });

  const bindClinicCode = useCallback(async (code: string): Promise<boolean> => {
    console.log('[AppContext] 绑定复诊码:', code);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (code.startsWith('MEI')) {
      setState(prev => ({
        ...prev,
        user: {
          ...prev.user,
          isBound: true,
          clinicCode: code,
          clinicName: '美颐医疗美容',
          bindDate: new Date().toISOString().split('T')[0]
        },
        isBound: true
      }));
      return true;
    }
    return false;
  }, []);

  const uploadPhoto = useCallback(async (angleId: string, imageUrl: string, symptoms: SymptomRecord): Promise<boolean> => {
    console.log('[AppContext] 上传照片:', { angleId, symptoms });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const angle = state.project?.photoAngles.find(a => a.id === angleId);
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
    
    setState(prev => ({
      ...prev,
      photos: [...prev.photos, newPhoto],
      calendarDays: prev.calendarDays.map(day => {
        if (day.date === today) {
          return {
            ...day,
            photosUploaded: day.photosUploaded + 1,
            status: day.photosUploaded + 1 >= day.photosRequired ? 'completed' : 'today'
          };
        }
        return day;
      })
    }));
    
    return true;
  }, [state.project?.photoAngles]);

  const withdrawPhoto = useCallback(async (photoId: string): Promise<boolean> => {
    console.log('[AppContext] 撤回照片:', photoId);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setState(prev => ({
      ...prev,
      photos: prev.photos.map(p => 
        p.id === photoId ? { ...p, status: 'withdrawn' } : p
      )
    }));
    
    return true;
  }, []);

  const updatePrivacySettings = useCallback((settings: Partial<PrivacySettings>) => {
    console.log('[AppContext] 更新隐私设置:', settings);
    setState(prev => ({
      ...prev,
      privacySettings: { ...prev.privacySettings, ...settings }
    }));
  }, []);

  const markReminderCompleted = useCallback((reminderId: string) => {
    console.log('[AppContext] 标记提醒完成:', reminderId);
    setState(prev => ({
      ...prev,
      reminders: prev.reminders.map(r => 
        r.id === reminderId ? { ...r, completed: true } : r
      )
    }));
  }, []);

  const completeReminder = useCallback(async (reminderId: string): Promise<boolean> => {
    console.log('[AppContext] 完成提醒:', reminderId);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setState(prev => ({
      ...prev,
      reminders: prev.reminders.map(r => 
        r.id === reminderId ? { ...r, completed: true } : r
      )
    }));
    
    return true;
  }, []);

  const getTodayPhotos = useCallback((): PhotoRecord[] => {
    const today = new Date().toISOString().split('T')[0];
    return getPhotosByDate(today);
  }, []);

  const getPendingFeedbackCount = useCallback((): number => {
    return state.photos.filter(p => p.status === 'pending').length;
  }, [state.photos]);

  const getTodayReminders = useCallback((): Reminder[] => {
    const today = new Date().toISOString().split('T')[0];
    return state.reminders.filter(r => r.date === today);
  }, [state.reminders]);

  const getStats = useCallback(() => {
    const totalDays = state.calendarDays.length;
    const completedDays = state.calendarDays.filter(d => d.status === 'completed').length;
    const totalPhotos = state.photos.filter(p => p.status !== 'withdrawn').length;
    const reviewedPhotos = state.photos.filter(p => p.status === 'reviewed').length;
    const totalReminders = state.reminders.length;
    
    return { totalDays, completedDays, totalPhotos, reviewedPhotos, totalReminders };
  }, [state.calendarDays, state.photos, state.reminders]);

  const value: AppContextType = {
    ...state,
    bindClinicCode,
    uploadPhoto,
    withdrawPhoto,
    updatePrivacySettings,
    markReminderCompleted,
    completeReminder,
    getTodayPhotos,
    getPendingFeedbackCount,
    getTodayReminders,
    getStats
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
