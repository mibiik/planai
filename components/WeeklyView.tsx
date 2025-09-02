import React, { useState, useEffect, useRef } from 'react';
import { SchedulerEvent, CATEGORIES } from '../types';
import { getWeekDays, isSameDay, formatTime } from '../utils/dateUtils';
import { CheckIcon, TrashIcon } from './icons';

interface WeeklyViewProps {
  currentDate: Date;
  events: SchedulerEvent[];
  onEventClick: (event: SchedulerEvent) => void;
  onEventDrop: (eventId: number, newStart: Date, newEnd: Date) => void;
  onTimeSlotClick: (date: Date) => void;
  onToggleComplete: (eventId: number) => void;
  onEventDelete: (eventId: number) => void;
}

const TimeGutter: React.FC = () => (
  <div className="w-12 flex-shrink-0">
    <div className="h-8 sticky top-0 bg-white z-10"></div>
    {Array.from({ length: 24 }).map((_, i) => (
      <div key={i} className="h-12 relative">
        <span className="text-xs text-gray-500 absolute -top-1.5 right-2">
          {`${i.toString().padStart(2, '0')}:00`}
        </span>
      </div>
    ))}
  </div>
);

const DayColumn: React.FC<{ day: Date; dayEvents: SchedulerEvent[]; events: SchedulerEvent[]; onEventClick: (event: SchedulerEvent) => void; onEventDrop: (eventId: number, newStart: Date, newEnd: Date) => void; onTimeSlotClick: (date: Date) => void; onToggleComplete: (eventId: number) => void; onEventDelete: (eventId: number) => void; }> = ({ day, dayEvents, events, onEventClick, onEventDrop, onTimeSlotClick, onToggleComplete, onEventDelete }) => {
    const today = new Date();
    const isToday = isSameDay(day, today);
    const [currentTimeTop, setCurrentTimeTop] = useState<number | null>(null);

    useEffect(() => {
        if (!isToday) {
            setCurrentTimeTop(null);
            return;
        }

        const updateIndicator = () => {
            const now = new Date();
            const startOfDay = new Date(now);
            startOfDay.setHours(0, 0, 0, 0);
            const totalMinutesInDay = 24 * 60;
            const minutesSinceMidnight = (now.getTime() - startOfDay.getTime()) / 60000;
            const topPercent = (minutesSinceMidnight / totalMinutesInDay) * 100;
            setCurrentTimeTop(topPercent);
        };

        updateIndicator();
        const intervalId = setInterval(updateIndicator, 60000);

        return () => clearInterval(intervalId);
    }, [isToday]);
  
    const calculatePosition = (event: SchedulerEvent) => {
      const startOfDay = new Date(event.start);
      startOfDay.setHours(0, 0, 0, 0);
      
      const totalMinutesInDay = 24 * 60;
      const startMinutes = (event.start.getTime() - startOfDay.getTime()) / 60000;
      const endMinutes = (event.end.getTime() - startOfDay.getTime()) / 60000;

      const top = (startMinutes / totalMinutesInDay) * 100;
      const height = ((endMinutes - startMinutes) / totalMinutesInDay) * 100;

      return { top: `${top}%`, height: `${height}%` };
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, event: SchedulerEvent) => {
        const dragData = {
            type: 'move',
            eventId: event.id,
            dragStartOffsetY: e.nativeEvent.offsetY,
        };
        e.dataTransfer.setData('application/json', JSON.stringify(dragData));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleResizeDragStart = (e: React.DragEvent<HTMLDivElement>, eventId: number, handle: 'top' | 'bottom') => {
        e.stopPropagation();
        const dragData = {
            type: 'resize',
            eventId: eventId,
            handle: handle,
        };
        e.dataTransfer.setData('application/json', JSON.stringify(dragData));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const dataString = e.dataTransfer.getData('application/json');
        if (!dataString) return;

        const data = JSON.parse(dataString);
        const originalEvent = events.find(ev => ev.id === data.eventId);
        if (!originalEvent) return;

        const container = e.currentTarget as HTMLDivElement;
        const rect = container.getBoundingClientRect();
        
        const totalHeight = container.offsetHeight;
        const minutesPerPixel = (24 * 60) / totalHeight;

        if (data.type === 'move') {
            let correctedY = e.clientY - rect.top - data.dragStartOffsetY;
            if (correctedY < 0) correctedY = 0;

            let newStartMinutes = Math.round((correctedY * minutesPerPixel) / 15) * 15;

            const duration = originalEvent.end.getTime() - originalEvent.start.getTime();
            const maxMinutes = (24 * 60) - (duration / 60000);
            if (newStartMinutes > maxMinutes) newStartMinutes = maxMinutes;

            const newStartDate = new Date(day);
            newStartDate.setHours(0, 0, 0, 0);
            newStartDate.setMinutes(newStartMinutes);

            const newEndDate = new Date(newStartDate.getTime() + duration);
            
            onEventDrop(data.eventId, newStartDate, newEndDate);
        } else if (data.type === 'resize') {
            const y = e.clientY - rect.top;
            let timeInMinutes = Math.round((y * minutesPerPixel) / 15) * 15;
            if (timeInMinutes < 0) timeInMinutes = 0;
            if (timeInMinutes >= 24 * 60) timeInMinutes = 24 * 60 - 15;
            
            const newTime = new Date(day);
            newTime.setHours(0, 0, 0, 0);
            newTime.setMinutes(timeInMinutes);

            let newStart = new Date(originalEvent.start);
            let newEnd = new Date(originalEvent.end);

            if (data.handle === 'top') {
                newStart = newTime;
            } else {
                newEnd = newTime;
            }

            if (newEnd.getTime() - newStart.getTime() < 15 * 60 * 1000) {
                 if (data.handle === 'top') {
                    newStart = new Date(newEnd.getTime() - 15 * 60 * 1000);
                } else {
                    newEnd = new Date(newStart.getTime() + 15 * 60 * 1000);
                }
            }
            onEventDrop(data.eventId, newStart, newEnd);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleTimeSlotClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('[draggable="true"]')) {
            return;
        }
        
        const container = e.currentTarget as HTMLDivElement;
        const rect = container.getBoundingClientRect();
        const y = e.clientY - rect.top;

        const totalHeight = container.offsetHeight;
        const minutesPerPixel = (24 * 60) / totalHeight;
        const clickedMinutes = Math.round((y * minutesPerPixel) / 15) * 15;

        const newEventDate = new Date(day);
        newEventDate.setHours(0, 0, 0, 0);
        newEventDate.setMinutes(clickedMinutes);

        onTimeSlotClick(newEventDate);
    };

    return (
        <div className="flex-1 border-l border-gray-200 relative">
          <div className="text-center py-1.5 sticky top-0 bg-white z-10 border-b border-gray-200">
            <p className="text-xs text-gray-500">{day.toLocaleDateString('tr-TR', { weekday: 'short' })}</p>
            <p className={`text-sm font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>{day.getDate()}</p>
          </div>
          <div className="relative h-[calc(24*3rem)]" onDrop={handleDrop} onDragOver={handleDragOver} onClick={handleTimeSlotClick}>
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="h-12 border-b border-gray-200"></div>
            ))}
            {currentTimeTop !== null && (
                <div className="absolute left-0 right-0 flex items-center" style={{ top: `${currentTimeTop}%`, zIndex: 20 }}>
                    <div className="w-2 h-2 bg-red-500 rounded-full z-10 -ml-1 ring-1 ring-white"></div>
                    <div className="w-full h-0.5 bg-red-500"></div>
                </div>
            )}
            {dayEvents.map(event => {
                const { top, height } = calculatePosition(event);
                const categoryStyle = CATEGORIES[event.category] || CATEGORIES.other;
                return (
                    <div
                        key={event.id}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, event)}
                        className={`group absolute left-0.5 right-0.5 p-1 ${categoryStyle.bg} border-l-3 ${categoryStyle.border} rounded-r-md cursor-pointer overflow-hidden transition-opacity ${event.completed ? 'opacity-60' : ''}`}
                        style={{ top, height: `max(1.5rem, ${height})` }}
                    >
                        <div className="flex justify-between items-start h-full gap-1">
                            <div className="flex-grow overflow-hidden min-w-0" onClick={(e) => { e.stopPropagation(); onEventClick(event); }}>
                                <p className={`font-semibold text-xs ${categoryStyle.text} truncate ${event.completed ? 'line-through' : ''}`}>{event.title}</p>
                                <p className={`text-xs ${categoryStyle.text} opacity-80 ${event.completed ? 'line-through' : ''}`}>{formatTime(event.start)} - {formatTime(event.end)}</p>
                            </div>
                            <div className="flex-shrink-0 flex flex-col items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onToggleComplete(event.id); }}
                                    className={`w-4 h-4 bg-white/50 rounded-full flex items-center justify-center focus:outline-none focus:ring-1 ${categoryStyle.ring}`}
                                    aria-label={event.completed ? 'Görevi tamamlanmadı olarak işaretle' : 'Görevi tamamlandı olarak işaretle'}
                                >
                                    {event.completed && <CheckIcon className="w-2.5 h-2.5" />}
                                </button>
                                <button
                                     onClick={(e) => { 
                                        e.stopPropagation(); 
                                        if (window.confirm('Bu etkinliği silmek istediğinizden emin misiniz?')) {
                                            onEventDelete(event.id);
                                        }
                                    }}
                                    className={`w-4 h-4 bg-white/50 text-red-600 hover:bg-red-100 rounded-full flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-red-500`}
                                    aria-label="Görevi sil"
                                >
                                    <TrashIcon className="w-2.5 h-2.5" />
                                </button>
                            </div>
                        </div>
                        
                        {/* Resize handles */}
                        <div
                            draggable="true"
                            onDragStart={(e) => handleResizeDragStart(e, event.id, 'top')}
                            className="absolute top-0 left-0 w-full h-1 cursor-ns-resize hidden sm:block"
                        />
                        <div
                            draggable="true"
                            onDragStart={(e) => handleResizeDragStart(e, event.id, 'bottom')}
                            className="absolute bottom-0 left-0 w-full h-1 cursor-ns-resize hidden sm:block"
                        />
                    </div>
                );
            })}
          </div>
        </div>
    );
};

export const WeeklyView: React.FC<WeeklyViewProps> = ({ currentDate, events, onEventClick, onEventDrop, onTimeSlotClick, onToggleComplete, onEventDelete }) => {
  const weekDays = getWeekDays(currentDate);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const weekContainsToday = weekDays.some(day => isSameDay(day, new Date()));
    if (weekContainsToday && scrollContainerRef.current) {
      setTimeout(() => {
        if (!scrollContainerRef.current) return;
        const now = new Date();
        const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
        const topPositionInRem = (minutesSinceMidnight / 60) * 3;
        const remInPixels = parseFloat(getComputedStyle(document.documentElement).fontSize);
        const scrollTop = topPositionInRem * remInPixels - scrollContainerRef.current.clientHeight / 2;
        scrollContainerRef.current.scrollTo({
          top: scrollTop > 0 ? scrollTop : 0,
          behavior: 'smooth',
        });
      }, 100);
    }
  }, [currentDate, weekDays]);

  return (
    <div ref={scrollContainerRef} className="overflow-auto h-full">
      <div className="flex">
        <TimeGutter />
        {weekDays.map(day => {
          const dayEvents = events.filter(e => isSameDay(e.start, day));
          return <DayColumn key={day.toISOString()} day={day} dayEvents={dayEvents} events={events} onEventClick={onEventClick} onEventDrop={onEventDrop} onTimeSlotClick={onTimeSlotClick} onToggleComplete={onToggleComplete} onEventDelete={onEventDelete}/>;
        })}
      </div>
    </div>
  );
};