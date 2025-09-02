import React, { useState, useEffect } from 'react';
import { SchedulerEvent, Category, CATEGORIES, RepeatOption, REPEAT_OPTIONS } from '../types';
import { XMarkIcon, TrashIcon } from './icons';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<SchedulerEvent, 'id'> & { id?: number }) => void;
  onDelete: (eventId: number) => void;
  event: SchedulerEvent | null;
  selectedDate: Date;
}

export const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, onDelete, event, selectedDate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [category, setCategory] = useState<Category>('work');
  const [repeat, setRepeat] = useState<RepeatOption>('none');
  const [repeatUntil, setRepeatUntil] = useState('');
  const [repeatInterval, setRepeatInterval] = useState(1);

  useEffect(() => {
    const targetEvent = event ? event : { 
        start: new Date(new Date(selectedDate).setHours(9,0,0,0)), 
        end: new Date(new Date(selectedDate).setHours(10,0,0,0))
    };
    
    setTitle(event?.title || '');
    setDescription(event?.description || '');
    setCategory(event?.category || 'work');
    setRepeat(event?.repeat || 'none');
    setRepeatInterval(event?.repeatInterval || 1);
    
    const formatInputDate = (d: Date) => d.toISOString().split('T')[0];
    const formatInputTime = (d: Date) => d.toTimeString().slice(0, 5);

    setStartDate(formatInputDate(targetEvent.start));
    setStartTime(formatInputTime(targetEvent.start));
    setEndDate(formatInputDate(targetEvent.end));
    setEndTime(formatInputTime(targetEvent.end));
    
    if (event?.repeatUntil) {
      setRepeatUntil(formatInputDate(event.repeatUntil));
    } else {
      // Default to 1 year from now
      const defaultUntil = new Date();
      defaultUntil.setFullYear(defaultUntil.getFullYear() + 1);
      setRepeatUntil(formatInputDate(defaultUntil));
    }
  }, [event, isOpen, selectedDate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
        alert("Başlık boş olamaz.");
        return;
    }
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    if (end < start) {
        alert("Bitiş zamanı başlangıç zamanından önce olamaz.");
        return;
    }
    
    const eventData: Omit<SchedulerEvent, 'id'> & { id?: number } = {
      id: event?.id,
      title,
      description,
      start,
      end,
      category,
      completed: event?.completed || false,
      repeat: repeat === 'none' ? undefined : repeat,
      repeatUntil: repeat !== 'none' && repeatUntil ? new Date(repeatUntil) : undefined,
      repeatInterval: repeat === 'custom' ? repeatInterval : undefined,
    };
    
    onSave(eventData);
  };

  const handleDelete = () => {
    if (event && event.id && window.confirm('Bu etkinliği silmek istediğinizden emin misiniz?')) {
        onDelete(event.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all animate-fade-in-up">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">{event && event.id ? 'Etkinliği Düzenle' : 'Yeni Etkinlik Ekle'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors p-1">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
            <input 
              type="text" 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Etkinlik başlığı"
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
            <textarea 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              rows={3} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Etkinlik açıklaması (isteğe bağlı)"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(CATEGORIES).map(([key, { name, bg, text, ring }]) => (
                <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key as Category)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 border border-transparent ${
                    category === key ? `ring-2 ring-offset-1 ${ring} ${bg} ${text}` : `bg-gray-100 text-gray-700 hover:bg-gray-200`
                    }`}
                >
                    {name}
                </button>
                ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
                <input 
                  type="date" 
                  id="startDate" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  required 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Saati</label>
                <input 
                  type="time" 
                  id="startTime" 
                  value={startTime} 
                  onChange={(e) => setStartTime(e.target.value)} 
                  required 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                <input 
                  type="date" 
                  id="endDate" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  required 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">Bitiş Saati</label>
                <input 
                  type="time" 
                  id="endTime" 
                  value={endTime} 
                  onChange={(e) => setEndTime(e.target.value)} 
                  required 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Repeat Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tekrarlama</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(REPEAT_OPTIONS).map(([key, { name, description }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRepeat(key as RepeatOption)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 border border-transparent text-left ${
                    repeat === key 
                      ? 'ring-2 ring-offset-1 ring-blue-500 bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-medium">{name}</div>
                  <div className="text-xs opacity-75">{description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Repeat Options */}
          {repeat === 'custom' && (
            <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <label htmlFor="repeatInterval" className="block text-sm font-medium text-gray-700 mb-1">
                  Her kaç gün/hafta/ay tekrarlansın?
                </label>
                <input
                  type="number"
                  id="repeatInterval"
                  value={repeatInterval}
                  onChange={(e) => setRepeatInterval(parseInt(e.target.value) || 1)}
                  min="1"
                  max="365"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>
          )}

          {/* Repeat Until */}
          {repeat !== 'none' && (
            <div>
              <label htmlFor="repeatUntil" className="block text-sm font-medium text-gray-700 mb-1">
                Tekrarlama Bitiş Tarihi
              </label>
              <input
                type="date"
                id="repeatUntil"
                value={repeatUntil}
                onChange={(e) => setRepeatUntil(e.target.value)}
                min={startDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              <p className="text-xs text-gray-500 mt-1">
                Bu tarihe kadar tekrarlanacak
              </p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row justify-between items-center pt-4 gap-3">
             <div className="w-full sm:w-auto">
                {event && event.id ? (
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="w-full sm:w-auto px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <TrashIcon className="w-4 h-4"/>
                        <span>Sil</span>
                    </button>
                ) : null}
             </div>
             <div className="flex w-full sm:w-auto gap-2">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="flex-1 sm:flex-none px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                  Kaydet
                </button>
             </div>
          </div>
        </form>
      </div>
    </div>
  );
};
