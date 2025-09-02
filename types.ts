export const CATEGORIES = {
  work: { name: 'İş', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-500', ring: 'ring-blue-500' },
  personal: { name: 'Kişisel', bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500', ring: 'ring-green-500' },
  fitness: { name: 'Spor', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-500', ring: 'ring-orange-500' },
  meeting: { name: 'Toplantı', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-500', ring: 'ring-purple-500' },
  education: { name: 'Eğitim', bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-500', ring: 'ring-yellow-500' },
  other: { name: 'Diğer', bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-500', ring: 'ring-slate-500' },
};

export type Category = keyof typeof CATEGORIES;

export const REPEAT_OPTIONS = {
  none: { name: 'Tek Seferlik', description: 'Sadece bir kez' },
  daily: { name: 'Günlük', description: 'Her gün tekrarla' },
  weekly: { name: 'Haftalık', description: 'Her hafta tekrarla' },
  monthly: { name: 'Aylık', description: 'Her ay tekrarla' },
  yearly: { name: 'Yıllık', description: 'Her yıl tekrarla' },
  custom: { name: 'Özel', description: 'Özel tekrarlama' },
};

export type RepeatOption = keyof typeof REPEAT_OPTIONS;

export interface SchedulerEvent {
  id: number;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  category: Category;
  completed: boolean;
  repeat?: RepeatOption;
  repeatUntil?: Date;
  repeatInterval?: number; // For custom repeat (every X days/weeks/months)
}

export interface WorkSession {
  id: number;
  name: string;
  duration: number; // in seconds
  date: Date;
  type: 'Pomodoro' | 'Kronometre' | 'Akıllı Odaklanma';
}

export enum ViewType {
  Day = 'day',
  Week = 'week',
  Month = 'month',
}

// New types for Study Tracker feature
export const TOPIC_STATUSES = {
  not_started: { name: 'Başlanmadı', bg: 'bg-slate-200', text: 'text-slate-700' },
  in_progress: { name: 'Çalışılıyor', bg: 'bg-blue-200', text: 'text-blue-800' },
  needs_review: { name: 'Tekrar Gerekli', bg: 'bg-yellow-200', text: 'text-yellow-800' },
  completed: { name: 'Tamamlandı', bg: 'bg-green-200', text: 'text-green-800' },
};
export type TopicStatus = keyof typeof TOPIC_STATUSES;

export interface StudyTopic {
  id: number;
  name: string;
  status: TopicStatus;
}
export interface StudyResource {
  id: number;
  name: string;
}
export interface StudySubject {
  id: number;
  name: string;
  resources: StudyResource[];
  topics: StudyTopic[];
}
