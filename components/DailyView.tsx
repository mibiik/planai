import React, { useState, useEffect, useRef } from 'react';
import { SchedulerEvent, CATEGORIES } from '../types';
import { formatTime, isSameDay } from '../utils/dateUtils';
import { CheckIcon, TrashIcon } from './icons';

interface DailyViewProps {
  currentDate: Date;
  events: SchedulerEvent[];
  onEventClick: (event: SchedulerEvent) => void;
  onEventDrop: (eventId: number, newStart: Date, newEnd: Date) => void;
  onTimeSlotClick: (date: Date) => void;  
  onToggleComplete: (eventId: number) => void;
  onEventDelete: (eventId: number) => void;
  isDarkMode?: boolean;
}

export const DailyView: React.FC<DailyViewProps> = ({ currentDate, events, onEventClick, onEventDrop, onTimeSlotClick, onToggleComplete, onEventDelete, isDarkMode = false }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentTimeTop, setCurrentTimeTop] = useState<number | null>(null);

  useEffect(() => {
    const isToday = isSameDay(currentDate, new Date());

    if (isToday && scrollContainerRef.current) {
      setTimeout(() => {
        if (!scrollContainerRef.current) return;
        const now = new Date();
        const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
        const topPositionInRem = (minutesSinceMidnight / 60) * 4;
        const remInPixels = parseFloat(getComputedStyle(document.documentElement).fontSize);
        const scrollTop = topPositionInRem * remInPixels - scrollContainerRef.current.clientHeight / 2;
        scrollContainerRef.current.scrollTo({
          top: scrollTop > 0 ? scrollTop : 0,
          behavior: 'smooth',
        });
      }, 100);
    }
    
    if (!isToday) {
        setCurrentTimeTop(null);
        return;
    }

    const updateIndicator = () => {
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const minutesSinceMidnight = (now.getTime() - startOfDay.getTime()) / 60000;
        const topPosition = (minutesSinceMidnight / 60) * 4;
        setCurrentTimeTop(topPosition);
    };

    updateIndicator();
    const intervalId = setInterval(updateIndicator, 60000);

    return () => clearInterval(intervalId);
  }, [currentDate]);

  const dayEvents = events.filter(e => 
    e.start.getFullYear() === currentDate.getFullYear() &&
    e.start.getMonth() === currentDate.getMonth() &&
    e.start.getDate() === currentDate.getDate()
  ).sort((a,b) => a.start.getTime() - b.start.getTime());

  const calculatePosition = (event: SchedulerEvent) => {
      const startOfDay = new Date(event.start);
      startOfDay.setHours(0, 0, 0, 0);
      
      const totalMinutesInDay = 24 * 60;
      const startMinutes = (event.start.getTime() - startOfDay.getTime()) / 60000;
      const endMinutes = (event.end.getTime() - startOfDay.getTime()) / 60000;
      let duration = endMinutes - startMinutes;
      if (duration < 15) duration = 15;

      const top = (startMinutes / 60) * 4;
      const height = (duration / 60) * 4;

      return { top: `${top}rem`, height: `${height}rem` };
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
    const originalEvent = dayEvents.find(ev => ev.id === data.eventId);
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

        const newStartDate = new Date(currentDate);
        newStartDate.setHours(0, 0, 0, 0);
        newStartDate.setMinutes(newStartMinutes);

        const newEndDate = new Date(newStartDate.getTime() + duration);
        
        onEventDrop(data.eventId, newStartDate, newEndDate);

    } else if (data.type === 'resize') {
        const y = e.clientY - rect.top;
        let timeInMinutes = Math.round((y * minutesPerPixel) / 15) * 15;
        if (timeInMinutes < 0) timeInMinutes = 0;
        if (timeInMinutes >= 24 * 60) timeInMinutes = 24 * 60 - 15;

        const newTime = new Date(currentDate);
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
    const remInPixels = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const totalHeightInRem = totalHeight / remInPixels;
    
    const minutesPerRem = (24 * 60) / totalHeightInRem;
    const yInRem = y / remInPixels;

    const clickedMinutes = Math.round((yInRem * minutesPerRem) / 15) * 15;

    const newEventDate = new Date(currentDate);
    newEventDate.setHours(0, 0, 0, 0);
    newEventDate.setMinutes(clickedMinutes);
    
    onTimeSlotClick(newEventDate);
  };

  return (
    <div ref={scrollContainerRef} className="overflow-auto h-full">
      <div className="flex">
        {/* Time Gutter - Mobile Optimized */}
        <div className="w-16 sm:w-20 text-right pr-2 sm:pr-4 flex-shrink-0">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="h-16 relative">
              <span className={`text-xs sm:text-sm absolute -top-2.5 right-2 sm:right-4 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {`${i.toString().padStart(2, '0')}:00`}
              </span>
            </div>
          ))}
        </div>
        
        {/* Events Pane - Mobile Optimized */}
        <div className={`flex-grow border-l relative transition-colors ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} onDrop={handleDrop} onDragOver={handleDragOver} onClick={handleTimeSlotClick}>
          {/* Hour lines */}
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className={`h-16 border-b transition-colors ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
          ))}
          
          {/* Current Time Indicator */}
          {currentTimeTop !== null && (
            <div className="absolute left-0 right-0 flex items-center" style={{ top: `${currentTimeTop}rem`, zIndex: 20 }}>
              <div className="w-3 h-3 bg-red-500 rounded-full z-10 -ml-[6px] ring-2 ring-white"></div>
              <div className="w-full h-0.5 bg-red-500"></div>
            </div>
          )}

          {/* Events - Mobile Optimized */}
          {dayEvents.map(event => {
            const { top, height } = calculatePosition(event);
            const categoryStyle = CATEGORIES[event.category] || CATEGORIES.other;
            return (
              <div
                key={event.id}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, event)}
                className={`group absolute left-1 right-1 sm:left-2 sm:right-2 p-2 sm:p-3 ${categoryStyle.bg} border-l-4 ${categoryStyle.border} rounded-r-md cursor-pointer overflow-hidden hover:opacity-90 transition-all ${event.completed ? 'opacity-60' : ''}`}
                style={{ top, height }}
              >
                <div className="flex justify-between items-start gap-1 sm:gap-2 h-full">
                  <div className="flex-grow overflow-hidden min-w-0" onClick={(e) => { e.stopPropagation(); onEventClick(event); }}>
                      <h3 className={`font-bold text-sm sm:text-md ${categoryStyle.text} ${event.completed ? 'line-through' : ''} truncate`}>{event.title}</h3>
                      <p className={`text-xs sm:text-sm ${categoryStyle.text} opacity-80 ${event.completed ? 'line-through' : ''}`}>{formatTime(event.start)} - {formatTime(event.end)}</p>
                      {event.description && (
                        <p className={`text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${categoryStyle.text} opacity-70 line-clamp-2`}>
                          {event.description}
                        </p>
                      )}
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleComplete(event.id); }}
                        className={`w-6 h-6 sm:w-7 sm:h-7 bg-white/50 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 ${categoryStyle.ring}`}
                        aria-label={event.completed ? 'Görevi tamamlanmadı olarak işaretle' : 'Görevi tamamlandı olarak işaretle'}
                    >
                        {event.completed && <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                    <button
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            if (window.confirm('Bu etkinliği silmek istediğinizden emin misiniz?')) {
                                onEventDelete(event.id);
                            }
                        }}
                        className={`w-6 h-6 sm:w-7 sm:h-7 bg-white/50 text-red-600 hover:bg-red-100 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-500`}
                        aria-label="Görevi sil"
                    >
                        <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Resize handles - Hidden on mobile for better UX */}
                <div
                    draggable="true"
                    onDragStart={(e) => handleResizeDragStart(e, event.id, 'top')}
                    className="absolute top-0 left-0 w-full h-2 cursor-ns-resize hidden sm:block"
                />
                <div
                    draggable="true"
                    onDragStart={(e) => handleResizeDragStart(e, event.id, 'bottom')}
                    className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize hidden sm:block"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};