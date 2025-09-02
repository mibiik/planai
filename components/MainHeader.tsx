import React from 'react';
import { CalendarDaysIcon, BookOpenIcon } from './icons';

type MainView = 'calendar' | 'study';

interface MainHeaderProps {
    activeView: MainView;
    onViewChange: (view: MainView) => void;
}

const NavButton: React.FC<{
    onClick: () => void;
    isActive: boolean;
    icon: React.ReactNode;
    children: React.ReactNode;
}> = ({ onClick, isActive, icon, children }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-colors ${
            isActive
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200'
        }`}
    >
        {icon}
        <span>{children}</span>
    </button>
);


export const MainHeader: React.FC<MainHeaderProps> = ({ activeView, onViewChange }) => {
    return (
        <header className="flex-shrink-0 bg-white shadow-sm p-3 flex justify-between items-center z-20 border-b">
            <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800">Plan AI</h1>
            </div>
            <nav className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                <NavButton
                    onClick={() => onViewChange('calendar')}
                    isActive={activeView === 'calendar'}
                    icon={<CalendarDaysIcon className="w-5 h-5" />}
                >
                    Takvim
                </NavButton>
                <NavButton
                    onClick={() => onViewChange('study')}
                    isActive={activeView === 'study'}
                    icon={<BookOpenIcon className="w-5 h-5" />}
                >
                    Çalışma Planlayıcı
                </NavButton>
            </nav>
        </header>
    );
};