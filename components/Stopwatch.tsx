
import React, { useState, useEffect, useRef } from 'react';
import { WorkSession } from '../types';
import { PlayIcon, PauseIcon, ArrowPathIcon } from './icons';

interface StopwatchProps {
    onSaveSession: (session: Omit<WorkSession, 'id'>) => void;
}

export const Stopwatch: React.FC<StopwatchProps> = ({ onSaveSession }) => {
    const [time, setTime] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [sessionName, setSessionName] = useState('');
    const countRef = useRef<number | null>(null);

    useEffect(() => {
        if (isActive) {
            countRef.current = window.setInterval(() => {
                setTime(prevTime => prevTime + 1);
            }, 1000);
        } else {
            if (countRef.current) clearInterval(countRef.current);
        }
        return () => {
            if (countRef.current) clearInterval(countRef.current);
        };
    }, [isActive]);

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleToggle = () => setIsActive(!isActive);

    const handleReset = () => {
        setIsActive(false);
        setTime(0);
    };
    
    const handleSave = () => {
        if (time > 0) {
            onSaveSession({
                name: sessionName || 'İsimsiz Oturum',
                duration: time,
                date: new Date(),
                type: 'Kronometre'
            });
            handleReset();
            setSessionName('');
        }
    };

    return (
        <div className="flex flex-col items-center text-center space-y-6">
            <h3 className="text-xl font-semibold text-slate-700">Kronometre</h3>

            <div className="text-6xl font-mono font-bold text-slate-800 tracking-wider">
                {formatTime(time)}
            </div>

            <div className="w-full">
                <label htmlFor="stopwatchSessionName" className="block text-sm font-medium text-slate-700 mb-1 text-left">Oturum Adı (Opsiyonel)</label>
                <input
                    type="text"
                    id="stopwatchSessionName"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    placeholder="Hangi görevi ölçüyorsun?"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            
            <div className="flex items-center gap-4">
                <button onClick={handleToggle} className="flex items-center justify-center w-16 h-16 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-transform transform hover:scale-105">
                    {isActive ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8" />}
                </button>
                <button onClick={handleReset} className="p-4 text-slate-500 hover:text-slate-800 transition-colors">
                    <ArrowPathIcon className="w-6 h-6" />
                </button>
            </div>

            <button
                onClick={handleSave}
                disabled={time === 0 || isActive}
                className="w-full px-4 py-3 bg-teal-500 text-white font-semibold rounded-md hover:bg-teal-600 transition-colors shadow disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
                Oturumu Kaydet
            </button>
        </div>
    );
};