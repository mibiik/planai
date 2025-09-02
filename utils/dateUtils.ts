
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('tr-TR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('tr-TR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

export const getWeekDays = (date: Date): Date[] => {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  startOfWeek.setDate(diff);
  
  const weekDays: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    weekDays.push(day);
  }
  return weekDays;
};

export const getMonthGrid = (date: Date): Date[][] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  
  for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    currentWeek.push(currentDate);
    
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  
  return weeks;
};

// Repeat event generation utilities
export const generateRepeatEvents = (
  baseEvent: Omit<SchedulerEvent, 'id' | 'completed'>,
  repeat: RepeatOption,
  repeatUntil: Date,
  repeatInterval: number = 1
): SchedulerEvent[] => {
  const events: SchedulerEvent[] = [];
  let currentDate = new Date(baseEvent.start);
  let eventId = Date.now();

  while (currentDate <= repeatUntil) {
    const eventEnd = new Date(currentDate);
    eventEnd.setTime(currentDate.getTime() + (baseEvent.end.getTime() - baseEvent.start.getTime()));

    events.push({
      ...baseEvent,
      id: eventId++,
      start: new Date(currentDate),
      end: eventEnd,
      completed: false,
      repeat,
      repeatUntil,
      repeatInterval,
    });

    // Calculate next occurrence
    const nextDate = new Date(currentDate);
    switch (repeat) {
      case 'daily':
        nextDate.setDate(currentDate.getDate() + repeatInterval);
        break;
      case 'weekly':
        nextDate.setDate(currentDate.getDate() + (7 * repeatInterval));
        break;
      case 'monthly':
        nextDate.setMonth(currentDate.getMonth() + repeatInterval);
        break;
      case 'yearly':
        nextDate.setFullYear(currentDate.getFullYear() + repeatInterval);
        break;
      case 'custom':
        // For custom, we'll use daily as default but can be customized
        nextDate.setDate(currentDate.getDate() + repeatInterval);
        break;
      default:
        break;
    }
    currentDate = nextDate;
  }

  return events;
};

export const getRepeatIcon = (repeat?: RepeatOption): string => {
  switch (repeat) {
    case 'daily':
      return '🔄';
    case 'weekly':
      return '📅';
    case 'monthly':
      return '📆';
    case 'yearly':
      return '📊';
    case 'custom':
      return '⚙️';
    default:
      return '';
  }
};

export const getRepeatText = (repeat?: RepeatOption): string => {
  switch (repeat) {
    case 'daily':
      return 'Günlük';
    case 'weekly':
      return 'Haftalık';
    case 'monthly':
      return 'Aylık';
    case 'yearly':
      return 'Yıllık';
    case 'custom':
      return 'Özel';
    default:
      return '';
  }
};