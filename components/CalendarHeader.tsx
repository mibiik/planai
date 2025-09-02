import React, { useState, useRef, useEffect } from 'react';
import { ViewType, Category, CATEGORIES } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, BoltIcon, FilterIcon, SunIcon, MagnifyingGlassIcon, SparklesIcon } from './icons';

interface CalendarHeaderProps {
  currentDate: Date;
  view: ViewType;
  onViewChange: (view: ViewType) => void;
  onDateChange: (date: Date) => void;
  onAddEvent: () => void;
  onQuickAdd: () => void;
  onToggleProductivityTools: () => void;
  onShowDailyBriefing: () => void;
  activeCategories: Category[];
  onActiveCategoriesChange: (categories: Category[]) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

const ViewButton: React.FC<{
    onClick: () => void;
    isActive: boolean;
    children: React.ReactNode;
}> = ({ onClick, isActive, children }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            isActive
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-600 hover:bg-slate-200'
        }`}
    >
        {children}
    </button>
);

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  view,
  onViewChange,
  onDateChange,
  onAddEvent,
  onQuickAdd,
  onToggleProductivityTools,
  onShowDailyBriefing,
  activeCategories,
  onActiveCategoriesChange,
  searchQuery,
  onSearchQueryChange,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
            setIsFilterOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (view === ViewType.Day) newDate.setDate(newDate.getDate() - 1);
    else if (view === ViewType.Week) newDate.setDate(newDate.getDate() - 7);
    else newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === ViewType.Day) newDate.setDate(newDate.getDate() + 1);
    else if (view === ViewType.Week) newDate.setDate(newDate.getDate() + 7);
    else newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };
  
  const handleToday = () => {
    onDateChange(new Date());
  }

  const getHeaderText = () => {
    switch(view) {
        case ViewType.Day:
            return currentDate.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        case ViewType.Week:
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            return `${startOfWeek.toLocaleDateString('tr-TR', {month: 'short', day: 'numeric'})} - ${endOfWeek.toLocaleDateString('tr-TR', {month: 'short', day: 'numeric', year: 'numeric'})}`;
        case ViewType.Month:
            return currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    }
  }
  
  const handleCategoryToggle = (category: Category) => {
      const newActive = activeCategories.includes(category)
        ? activeCategories.filter(c => c !== category)
        : [...activeCategories, category];
      onActiveCategoriesChange(newActive);
  };

  return (
    <header className="p-4 flex flex-col xl:flex-row items-center justify-between gap-4 z-20 relative">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 whitespace-nowrap">{getHeaderText()}</h1>
            <div className="flex items-center gap-2 text-slate-600">
                <button onClick={handlePrev} className="p-2 rounded-full hover:bg-slate-200 transition-colors" aria-label="Önceki"><ChevronLeftIcon /></button>
                <button onClick={handleToday} className="px-3 py-1.5 text-sm font-medium rounded-md text-slate-600 hover:bg-slate-200 transition-colors">Bugün</button>
                <button onClick={handleNext} className="p-2 rounded-full hover:bg-slate-200 transition-colors" aria-label="Sonraki"><ChevronRightIcon /></button>
                <button onClick={onShowDailyBriefing} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md text-slate-600 hover:bg-slate-200 transition-colors" title="Günün Özeti">
                    <SunIcon className="w-5 h-5"/>
                    <span>Günün Özeti</span>
                </button>
            </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto">
             <div className="relative w-full sm:w-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="w-5 h-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    placeholder="Etkinlik ara..."
                    value={searchQuery}
                    onChange={(e) => onSearchQueryChange(e.target.value)}
                    className="w-full sm:w-48 bg-slate-50 border border-slate-200 rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
            </div>
            <div ref={filterRef} className="relative">
                <button onClick={() => setIsFilterOpen(prev => !prev)} className="p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-600" aria-label="Filtrele" title="Kategorileri Filtrele">
                    <FilterIcon />
                </button>
                {isFilterOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-2xl z-30 border border-slate-200 animate-fade-in-up-sm">
                        <div className="p-3 border-b border-slate-200">
                            <h4 className="font-semibold text-slate-800">Kategorileri Filtrele</h4>
                        </div>
                        <div className="p-3 space-y-2">
                           {Object.entries(CATEGORIES).map(([key, { name, ring }]) => (
                                <label key={key} className="flex items-center space-x-3 cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={activeCategories.includes(key as Category)}
                                        onChange={() => handleCategoryToggle(key as Category)}
                                        className={`h-4 w-4 rounded border-slate-300 text-indigo-600 focus:${ring}`}
                                    />
                                    <span className="text-sm text-slate-700">{name}</span>
                                </label>
                           ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                <ViewButton onClick={() => onViewChange(ViewType.Day)} isActive={view === ViewType.Day}>Gün</ViewButton>
                <ViewButton onClick={() => onViewChange(ViewType.Week)} isActive={view === ViewType.Week}>Hafta</ViewButton>
                <ViewButton onClick={() => onViewChange(ViewType.Month)} isActive={view === ViewType.Month}>Ay</ViewButton>
            </div>
            <button onClick={onQuickAdd} className="p-2 text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200 transition-colors shadow-sm" title="Akıllı Ekle">
                <SparklesIcon className="w-5 h-5"/>
            </button>
            <button onClick={onAddEvent} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-md">
                <PlusIcon className="w-5 h-5"/>
                <span className="hidden sm:inline">Etkinlik</span>
            </button>
            <button onClick={onToggleProductivityTools} className="hidden lg:flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-200 transition-colors" title="Verimlilik Araçları">
                <BoltIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Araçlar</span>
            </button>
        </div>
    </header>
  );
};