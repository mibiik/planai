import React, { useState } from 'react';
import { WorkSession } from '../types';
import { XMarkIcon } from './icons';
import { PomodoroTimer } from './PomodoroTimer';
import { Stopwatch } from './Stopwatch';
import { SessionLog } from './SessionLog';
import { SmartFocus } from './SmartFocus';

interface ProductivityToolsProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: WorkSession[];
  onAddSession: (session: Omit<WorkSession, 'id'>) => void;
  onClearSessions: () => void;
}

type ActiveTool = 'pomodoro' | 'stopwatch' | 'log' | 'smartFocus';

const ToolButton: React.FC<{
  onClick: () => void;
  isActive: boolean;
  children: React.ReactNode;
}> = ({ onClick, isActive, children }) => (
    <button
        onClick={onClick}
        className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors focus:outline-none flex-grow text-center ${
            isActive
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-800'
        }`}
    >
        {children}
    </button>
);

export const ProductivityTools: React.FC<ProductivityToolsProps> = ({ isOpen, onClose, sessions, onAddSession, onClearSessions }) => {
  const [activeTool, setActiveTool] = useState<ActiveTool>('pomodoro');
  
  return (
    <>
      <div 
        className={`fixed inset-0 bg-black bg-opacity-30 z-30 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>
      <aside className={`fixed top-0 right-0 h-full bg-gray-50 w-full max-w-sm shadow-2xl transform transition-transform z-40 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Verimlilik Araçları</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1">
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </header>
            <nav className="flex justify-around border-b border-gray-200 bg-gray-100">
                <ToolButton onClick={() => setActiveTool('pomodoro')} isActive={activeTool === 'pomodoro'}>Pomodoro</ToolButton>
                <ToolButton onClick={() => setActiveTool('stopwatch')} isActive={activeTool === 'stopwatch'}>Kronometre</ToolButton>
                <ToolButton onClick={() => setActiveTool('log')} isActive={activeTool === 'log'}>Geçmiş</ToolButton>
                <ToolButton onClick={() => setActiveTool('smartFocus')} isActive={activeTool === 'smartFocus'}>Akıllı Odaklanma</ToolButton>
            </nav>
            <div className="flex-grow p-4 sm:p-6 overflow-y-auto">
                {activeTool === 'pomodoro' && <PomodoroTimer onSessionComplete={onAddSession} />}
                {activeTool === 'stopwatch' && <Stopwatch onSaveSession={onAddSession} />}
                {activeTool === 'log' && <SessionLog sessions={sessions} onClear={onClearSessions} />}
                {activeTool === 'smartFocus' && <SmartFocus onSaveSession={onAddSession} />}
            </div>
        </div>
      </aside>
    </>
  );
};