import React, { useState, useCallback, useMemo } from 'react';
import { SchedulerEvent, ViewType, WorkSession, Category, CATEGORIES, StudySubject, StudyTopic, RepeatOption } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { CalendarHeader } from './components/CalendarHeader';
import { MonthlyView } from './components/MonthlyView';
import { WeeklyView } from './components/WeeklyView';
import { DailyView } from './components/DailyView';
import { EventModal } from './components/EventModal';
import { ProductivityTools } from './components/ProductivityTools';
import { DailyBriefingModal } from './components/DailyBriefingModal';
import { QuickAddModal } from './components/QuickAddModal';
import { ScheduleFromTextModal } from './components/ScheduleFromTextModal';
import { ScheduleInputBar } from './components/ScheduleInputBar';
import { StudyTracker } from './components/StudyTracker';
import { MainHeader } from './components/MainHeader';
import { generateRepeatEvents } from './utils/dateUtils';

const ALL_CATEGORIES = Object.keys(CATEGORIES) as Category[];

type MainView = 'calendar' | 'study';


type ParsedEventData = {
  title: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  category: Category;
};

const isValidCategory = (cat: any): cat is Category => Object.keys(CATEGORIES).includes(cat);

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useLocalStorage('scheduler-current-date', new Date());
  const [view, setView] = useLocalStorage<ViewType>('scheduler-view', ViewType.Day);
  const [events, setEvents] = useLocalStorage<SchedulerEvent[]>('scheduler-events', []);
  const [workSessions, setWorkSessions] = useLocalStorage<WorkSession[]>('work-sessions', []);
  const [subjects, setSubjects] = useLocalStorage<StudySubject[]>('study-subjects', []);
  const [activeView, setActiveView] = useLocalStorage<MainView>('main-app-view', 'calendar');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SchedulerEvent | null>(null);
  const [isProductivityPanelOpen, setIsProductivityPanelOpen] = useState(false);
  const [isBriefingModalOpen, setIsBriefingModalOpen] = useState(false);
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [isScheduleFromTextModalOpen, setIsScheduleFromTextModalOpen] = useState(false);
  const [initialScheduleText, setInitialScheduleText] = useState('');
  const [activeCategories, setActiveCategories] = useLocalStorage<Category[]>('scheduler-active-categories', ALL_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);


  const allEvents = useMemo(() => {
    const expandedEvents: SchedulerEvent[] = [];
    
    events.forEach(event => {

      expandedEvents.push(event);
      

      if (event.repeat && event.repeat !== 'none' && event.repeatUntil) {
        const repeatEvents = generateRepeatEvents(
          {
            title: event.title,
            description: event.description,
            start: event.start,
            end: event.end,
            category: event.category,
          },
          event.repeat,
          event.repeatUntil,
          event.repeatInterval
        );
        

        expandedEvents.push(...repeatEvents.slice(1));
      }
    });
    
    return expandedEvents;
  }, [events]);

  const filteredEvents = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    return allEvents
      .filter(event => activeCategories.includes(event.category))
      .filter(event => {
        if (!searchQuery.trim()) return true;
        return (
          event.title.toLowerCase().includes(lowercasedQuery) ||
          (event.description && event.description.toLowerCase().includes(lowercasedQuery))
        );
      });
  }, [allEvents, activeCategories, searchQuery]);

  const handleAddEventClick = useCallback(() => {
    setSelectedEvent(null);
    setIsModalOpen(true);
  }, []);
  
  const handleEventClick = useCallback((event: SchedulerEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  }, []);

  const handleDateClick = useCallback((date: Date) => {
    setCurrentDate(date);
    setView(ViewType.Day);
  }, [setCurrentDate, setView]);
  
  const handleTimeSlotClick = useCallback((date: Date) => {
    const newEnd = new Date(date.getTime() + 60 * 60 * 1000);
    const newEvent: Omit<SchedulerEvent, 'id' | 'completed'> = {
        title: '',
        description: '',
        start: date,
        end: newEnd,
        category: 'work',
    };
    setSelectedEvent(newEvent as SchedulerEvent);
    setIsModalOpen(true);
  }, []);

  const handleSaveEvent = useCallback((eventData: Omit<SchedulerEvent, 'id'> & { id?: number }) => {
    setEvents(prevEvents => {
      if (eventData.id) {

        return prevEvents.map(e => e.id === eventData.id ? { ...e, ...eventData } as SchedulerEvent : e);
      } else {

        const newEvent: SchedulerEvent = {
          title: eventData.title,
          description: eventData.description,
          start: eventData.start,
          end: eventData.end,
          category: eventData.category,
          id: Date.now(),
          completed: false,
          repeat: eventData.repeat,
          repeatUntil: eventData.repeatUntil,
          repeatInterval: eventData.repeatInterval,
        };
        return [...prevEvents, newEvent];
      }
    });
    setIsModalOpen(false);
    setSelectedEvent(null);
  }, [setEvents]);
  
  const handleDeleteEvent = useCallback((eventId: number) => {
    setEvents(prevEvents => prevEvents.filter(e => e.id !== eventId));
    if (selectedEvent && selectedEvent.id === eventId) {
      setIsModalOpen(false);
      setSelectedEvent(null);
    }
  }, [setEvents, selectedEvent]);

  const handleEventDrop = useCallback((eventId: number, newStart: Date, newEnd: Date) => {
    setEvents(prevEvents => prevEvents.map(e => e.id === eventId ? {...e, start: newStart, end: newEnd} : e));
  }, [setEvents]);

  const handleAddSession = useCallback((session: Omit<WorkSession, 'id'>) => {
    setWorkSessions(prev => [...prev, { ...session, id: Date.now() }].sort((a,b) => b.date.getTime() - a.date.getTime()));
  }, [setWorkSessions]);

  const handleClearSessions = useCallback(() => {
    setWorkSessions([]);
  }, [setWorkSessions]);

  const handleQuickAddEvent = useCallback((data: ParsedEventData) => {
    const start = new Date(`${data.startDate}T${data.startTime}`);
    const end = new Date(`${data.endDate}T${data.endTime}`);
    const category = isValidCategory(data.category) ? data.category : 'other';

    const newEvent: Omit<SchedulerEvent, 'id' | 'completed'> = {
      title: data.title,
      description: 'Akıllı Ekle ile oluşturuldu',
      start,
      end,
      category,
    };
    
    setIsQuickAddModalOpen(false);
    setSelectedEvent(newEvent as SchedulerEvent);
    setIsModalOpen(true);
  }, []);

  const handleAddBulkEvents = useCallback((parsedEvents: ParsedEventData[]) => {
    const newEvents: SchedulerEvent[] = parsedEvents.map(data => {
      const start = new Date(`${data.startDate}T${data.startTime}`);
      const end = new Date(`${data.endDate}T${data.endTime}`);
      const category = isValidCategory(data.category) ? data.category : 'other';
      return {
        id: Date.now() + Math.random(),
        title: data.title,
        description: 'Metinden Planla ile oluşturuldu',
        start,
        end,
        category,
        completed: false,
      };
    });

    setEvents(prev => [...prev, ...newEvents]);
  }, [setEvents]);

  const handleScheduleFromText = (text: string) => {
    setInitialScheduleText(text);
    setIsScheduleFromTextModalOpen(true);
  };
  
  const handleToggleEventComplete = useCallback((eventId: number) => {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, completed: !e.completed } : e));
  }, [setEvents]);

  const handleScheduleStudySession = useCallback((subject: StudySubject, topic: StudyTopic) => {
    const now = new Date(currentDate);
    const targetHour = new Date().getHours() + 1;
    now.setHours(targetHour > 23 ? 9 : targetHour, 0, 0, 0);
    
    const newEvent: Omit<SchedulerEvent, 'id' | 'completed'> = {
        title: `${subject.name}: ${topic.name} Çalışması`,
        description: `"${subject.name}" dersinin "${topic.name}" konusuna odaklanma zamanı.`,
        start: now,
        end: new Date(now.getTime() + 60 * 60 * 1000),
        category: 'education',
    };
    setSelectedEvent(newEvent as SchedulerEvent);
    setActiveView('calendar');
    setIsModalOpen(true);
    if(isProductivityPanelOpen) setIsProductivityPanelOpen(false);
  }, [currentDate, isProductivityPanelOpen, setActiveView]);

  const renderCalendarView = () => {
    switch (view) {
      case ViewType.Day:
        return <DailyView currentDate={currentDate} events={filteredEvents} onEventClick={handleEventClick} onEventDrop={handleEventDrop} onTimeSlotClick={handleTimeSlotClick} onToggleComplete={handleToggleEventComplete} onEventDelete={handleDeleteEvent} />;
      case ViewType.Week:
        return <WeeklyView currentDate={currentDate} events={filteredEvents} onEventClick={handleEventClick} onEventDrop={handleEventDrop} onTimeSlotClick={handleTimeSlotClick} onToggleComplete={handleToggleEventComplete} onEventDelete={handleDeleteEvent} />;
      case ViewType.Month:
      default:
        return <MonthlyView currentDate={currentDate} events={filteredEvents} onEventClick={handleEventClick} onDateClick={handleDateClick} onToggleComplete={handleToggleEventComplete} onEventDelete={handleDeleteEvent} />;
    }
  };

  return (
    <div className="flex flex-col h-screen font-sans bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Plan AI</h1>
          <div className="flex items-center space-x-2">
            {/* Search Icon */}
            <button
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button
              onClick={() => setIsProductivityPanelOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Verimlilik</span>
            </button>
          </div>
        </div>
        
        {/* Expanded Search Bar */}
        {isSearchExpanded && (
          <div className="mt-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Etkinlik ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Navigation - Minimal */}
      <nav className="bg-white border-b border-gray-200 px-3 py-2">
        <div className="flex space-x-0.5 bg-gray-100 rounded-md p-0.5">
          <button
            onClick={() => setActiveView('calendar')}
            className={`flex-1 py-1 px-2 rounded-md text-xs font-medium transition-all duration-200 ${
              activeView === 'calendar'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            Takvim
          </button>
          <button
            onClick={() => setActiveView('study')}
            className={`flex-1 py-1 px-2 rounded-md text-xs font-medium transition-all duration-200 ${
              activeView === 'study'
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            Çalışma
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {activeView === 'calendar' && (
          <div className="h-full flex flex-col">
            {/* Calendar Header - Compact design */}
            <div className="bg-white px-4 py-2 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const newDate = new Date(currentDate);
                      newDate.setDate(newDate.getDate() - 1);
                      setCurrentDate(newDate);
                    }}
                    className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h2 className="text-base font-semibold text-gray-900">
                    {currentDate.toLocaleDateString('tr-TR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h2>
                  <button
                    onClick={() => {
                      const newDate = new Date(currentDate);
                      newDate.setDate(newDate.getDate() + 1);
                      setCurrentDate(newDate);
                    }}
                    className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Bugün
                </button>
              </div>
              
              {/* View Toggle - Compact */}
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setView(ViewType.Day)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    view === ViewType.Day
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Günlük
                </button>
                <button
                  onClick={() => setView(ViewType.Week)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    view === ViewType.Week
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Haftalık
                </button>
                <button
                  onClick={() => setView(ViewType.Month)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    view === ViewType.Month
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Aylık
                </button>
              </div>
            </div>

            {/* AI-Powered Schedule Input - Minimal */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
              <ScheduleInputBar onSchedule={handleScheduleFromText} />
            </div>

            {/* Calendar Content */}
            <div className="flex-1 overflow-auto bg-gray-50">
              {renderCalendarView()}
            </div>
          </div>
        )}

        {activeView === 'study' && (
          <div className="h-full bg-gray-50 overflow-hidden">
            <StudyTracker 
              subjects={subjects} 
              onSubjectsChange={setSubjects} 
              onScheduleStudySession={handleScheduleStudySession}
            />
          </div>
        )}
      </main>

      {/* Floating Action Button - Only for Calendar View */}
      {activeView === 'calendar' && (
        <button
          onClick={handleAddEventClick}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 z-50 hover:scale-110"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {/* Modals */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        event={selectedEvent}
        selectedDate={currentDate}
      />
      <ProductivityTools
        isOpen={isProductivityPanelOpen}
        onClose={() => setIsProductivityPanelOpen(false)}
        sessions={workSessions}
        onAddSession={handleAddSession}
        onClearSessions={handleClearSessions}
      />
      <DailyBriefingModal 
        isOpen={isBriefingModalOpen}
        onClose={() => setIsBriefingModalOpen(false)}
        currentDate={currentDate}
        eventsForDay={events.filter(e => new Date(e.start).toDateString() === currentDate.toDateString())}
        onEventSelect={handleEventClick}
      />
      <QuickAddModal 
        isOpen={isQuickAddModalOpen}
        onClose={() => setIsQuickAddModalOpen(false)}
        onEventParsed={handleQuickAddEvent}
      />
      <ScheduleFromTextModal
        isOpen={isScheduleFromTextModalOpen}
        onClose={() => setIsScheduleFromTextModalOpen(false)}
        onAddEvents={handleAddBulkEvents}
        initialText={initialScheduleText}
      />
    </div>
  );
};

export default App;