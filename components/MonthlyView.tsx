import React from 'react';
import { SchedulerEvent, CATEGORIES } from '../types';
import { getMonthGrid, isSameDay } from '../utils/dateUtils';
import { CheckIcon, TrashIcon } from './icons';

interface MonthlyViewProps {
  currentDate: Date;
  events: SchedulerEvent[];
  onEventClick: (event: SchedulerEvent) => void;
  onDateClick: (date: Date) => void;
  onToggleComplete: (eventId: number) => void;
  onEventDelete: (eventId: number) => void;
}

export const MonthlyView: React.FC<MonthlyViewProps> = ({ currentDate, events, onEventClick, onDateClick, onToggleComplete, onEventDelete }) => {
  const weeks = getMonthGrid(currentDate);
  const today = new Date();
  const weekDayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

  return (
    <div className="overflow-hidden flex flex-col h-full">
      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekDayNames.map(day => (
          <div key={day} className="py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-6 flex-grow">
        {weeks.flat().map((day, index) => {
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = isSameDay(day, today);
          const dailyEvents = events.filter(e => isSameDay(e.start, day));

          return (
            <div
              key={index}
              className={`p-1 sm:p-3 border-t border-r border-gray-200 flex flex-col relative transition-colors cursor-pointer hover:bg-gray-50 ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}`}
              onClick={() => onDateClick(day)}
            >
              <div className={`text-sm sm:text-base font-medium mb-1 sm:mb-2 self-start ${isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center' : 'text-gray-700'}`}>
                {day.getDate()}
              </div>
              <div className="flex-grow space-y-0.5 sm:space-y-1 overflow-y-auto">
                {dailyEvents.slice(0, 2).map(event => {
                  const categoryStyle = CATEGORIES[event.category] || CATEGORIES.other;
                  return (
                    <div
                      key={event.id}
                      className={`group relative ${categoryStyle.bg} ${categoryStyle.text} p-1 rounded-md text-xs sm:text-sm truncate cursor-pointer hover:opacity-80 transition-opacity ${event.completed ? 'opacity-60' : ''}`}
                    >
                      <span
                        onClick={(e) => {e.stopPropagation(); onEventClick(event);}}
                        className={`block pr-8 sm:pr-12 ${event.completed ? 'line-through' : ''}`}
                      >
                          {event.title}
                      </span>
                       <div className="absolute top-1/2 -translate-y-1/2 right-1 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <button
                            onClick={(e) => { e.stopPropagation(); onToggleComplete(event.id); }}
                            className={`w-4 h-4 sm:w-5 sm:h-5 bg-white/50 rounded flex items-center justify-center focus:outline-none focus:ring-2 ${categoryStyle.ring}`}
                            aria-label={event.completed ? 'Görevi tamamlanmadı olarak işaretle' : 'Görevi tamamlandı olarak işaretle'}
                          >
                            {event.completed && <CheckIcon className="w-3 h-3 sm:w-4 sm:h-4" />}
                          </button>
                          <button
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                if (window.confirm('Bu etkinliği silmek istediğinizden emin misiniz?')) {
                                    onEventDelete(event.id);
                                }
                            }}
                            className={`ml-1 w-4 h-4 sm:w-5 sm:h-5 bg-white/50 text-red-600 hover:bg-red-100 rounded flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-500`}
                            aria-label="Görevi sil"
                          >
                            <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4"/>
                          </button>
                      </div>
                    </div>
                  );
                })}
                {dailyEvents.length > 2 && (
                   <div className="text-xs sm:text-sm text-gray-500 mt-1">
                     + {dailyEvents.length - 2} daha
                   </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};