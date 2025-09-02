
import React from 'react';
import { WorkSession } from '../types';

interface SessionLogProps {
    sessions: WorkSession[];
    onClear: () => void;
}

export const SessionLog: React.FC<SessionLogProps> = ({ sessions, onClear }) => {
    
    const formatDuration = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        let result = '';
        if (hours > 0) result += `${hours}s `;
        if (minutes > 0) result += `${minutes}d `;
        if (seconds > 0 || (hours === 0 && minutes === 0)) result += `${seconds}sn`;
        
        return result.trim();
    };

    const getSessionTypeStyle = (type: WorkSession['type']) => {
        switch (type) {
            case 'Pomodoro':
                return 'bg-indigo-100 text-indigo-800';
            case 'Kronometre':
                return 'bg-teal-100 text-teal-800';
            case 'Akıllı Odaklanma':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-slate-100 text-slate-800';
        }
    }
    
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-slate-700">Oturum Geçmişi</h3>
                {sessions.length > 0 && (
                    <button 
                        onClick={() => { if (window.confirm('Tüm oturum geçmişini silmek istediğinizden emin misiniz?')) onClear(); }}
                        className="text-sm text-red-500 hover:text-red-700 font-medium"
                    >
                        Tümünü Temizle
                    </button>
                )}
            </div>
            {sessions.length === 0 ? (
                <p className="text-center text-slate-500 py-8">Henüz tamamlanmış bir oturum yok.</p>
            ) : (
                <ul className="space-y-3">
                    {sessions.map(session => (
                        <li key={session.id} className="p-4 bg-white rounded-lg shadow-sm border border-slate-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-slate-800">{session.name}</p>
                                    <p className="text-sm text-slate-500">{formatDuration(session.duration)}</p>
                                </div>
                                <div className="text-right flex-shrink-0 ml-2">
                                     <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getSessionTypeStyle(session.type)}`}>
                                        {session.type}
                                    </span>
                                    <p className="text-xs text-slate-400 mt-1">{session.date.toLocaleDateString('tr-TR')}</p>
                               </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};