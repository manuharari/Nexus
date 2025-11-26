import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Truck, Wrench, Users, MapPin, Clock, CheckCircle, Plus, X, ShieldCheck, Package } from 'lucide-react';
import { CalendarEvent, CalendarEventType, Language } from '../types';
import { dataService } from '../services/dataService';
import { authService } from '../services/authService';
import { getTranslation } from '../services/i18nService';

interface CalendarViewProps {
    lang?: Language;
}

const CalendarView: React.FC<CalendarViewProps> = ({ lang = 'en' }) => {
  const t = getTranslation(lang as Language).calendar;
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [filter, setFilter] = useState<CalendarEventType | 'all'>('all');
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventType, setNewEventType] = useState<CalendarEventType>('general');
  const [newEventDesc, setNewEventDesc] = useState('');

  const currentUser = authService.getCurrentUser();
  const isMasterAdmin = currentUser?.role === 'master_admin';

  useEffect(() => {
    setEvents(dataService.getCalendarEvents());
  }, [currentDate]);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthName = currentDate.toLocaleString(lang === 'es' ? 'es-ES' : 'default', { month: 'long' });

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const filteredEvents = events.filter(e => filter === 'all' || e.type === filter);

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredEvents.filter(e => e.date === dateStr);
  };

  const getEventColor = (type: CalendarEventType, isApproved: boolean = true) => {
    const base = !isApproved ? 'opacity-60 border-dashed border border-slate-500' : '';
    switch (type) {
      case 'maintenance': return `${base} bg-rose-500 text-white`;
      case 'delivery': return `${base} bg-primary-500 text-white`;
      case 'general': return `${base} bg-slate-500 text-white`;
      case 'logistics': return `${base} bg-emerald-600 text-white`;
      default: return 'bg-slate-600';
    }
  };

  const getEventIcon = (type: CalendarEventType) => {
    switch (type) {
        case 'maintenance': return <Wrench className="w-3 h-3" />;
        case 'delivery': return <Truck className="w-3 h-3" />;
        case 'general': return <Users className="w-3 h-3" />;
        case 'logistics': return <Package className="w-3 h-3" />;
    }
  };

  const handleAddEvent = () => {
      if (!newEventTitle || !newEventDate) return;
      dataService.addCalendarEvent({
          title: newEventTitle,
          date: newEventDate,
          type: newEventType,
          description: newEventDesc,
          status: 'Pending'
      });
      setEvents(dataService.getCalendarEvents()); // Refresh
      setIsAddModalOpen(false);
      setNewEventTitle('');
      setNewEventDesc('');
  };

  const handleApproveEvent = (eventId: string) => {
      dataService.approveCalendarEvent(eventId);
      setEvents(dataService.getCalendarEvents()); // Refresh
      setSelectedEvent(null); // Close detail to refresh view
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6 relative">
      
      {/* Add Event Modal */}
      {isAddModalOpen && (
          <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-white">{t.scheduleEvent}</h3>
                      <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t.title}</label>
                          <input value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:border-primary-500 outline-none" placeholder="e.g. Team Sync" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t.date}</label>
                              <input type="date" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:border-primary-500 outline-none" />
                          </div>
                          <div>
                              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t.type}</label>
                              <select value={newEventType} onChange={e => setNewEventType(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:border-primary-500 outline-none">
                                  <option value="general">General</option>
                                  <option value="maintenance">Maintenance</option>
                                  <option value="delivery">Delivery</option>
                              </select>
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t.desc}</label>
                          <textarea value={newEventDesc} onChange={e => setNewEventDesc(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:border-primary-500 outline-none h-24" placeholder="Event details..." />
                      </div>
                      
                      <button onClick={handleAddEvent} className="w-full bg-primary-600 hover:bg-primary-500 text-white py-2 rounded-lg font-medium mt-2">
                          {isMasterAdmin ? t.addToSchedule : t.submitApproval}
                      </button>
                      {!isMasterAdmin && <p className="text-xs text-slate-500 text-center">{t.approvalNote}</p>}
                  </div>
              </div>
          </div>
      )}

      {/* Main Calendar Grid */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
            <div className="flex items-center gap-4">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></button>
                <h2 className="text-xl font-bold text-white w-32 text-center capitalize">{monthName} {year}</h2>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"><ChevronRight className="w-5 h-5" /></button>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="flex gap-2">
                    {(['all', 'maintenance', 'delivery', 'general', 'logistics'] as const).map(f => (
                        <button 
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all hidden md:block ${
                                filter === f ? 'bg-slate-700 text-white border border-slate-600' : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                    <Plus className="w-3 h-3" /> {t.addEvent}
                </button>
            </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-900">
            {(lang === 'es' 
                ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] 
                : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map(day => (
                <div key={day} className="py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">{day}</div>
            ))}
        </div>

        {/* Grid */}
        <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-slate-950 overflow-y-auto">
            {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="border-b border-r border-slate-900 bg-slate-900/30" />
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayEvents = getEventsForDay(day);
                const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

                return (
                    <div key={day} className={`min-h-[100px] border-b border-r border-slate-900 p-2 transition-colors hover:bg-slate-900/50 relative group ${isToday ? 'bg-primary-900/5' : ''}`}>
                        <span className={`text-sm font-medium block mb-2 ${isToday ? 'text-primary-400' : 'text-slate-400'}`}>{day}</span>
                        <div className="space-y-1.5">
                            {dayEvents.map(event => (
                                <button 
                                    key={event.id}
                                    onClick={() => setSelectedEvent(event)}
                                    className={`w-full text-left px-2 py-1 rounded text-[10px] font-medium truncate flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity ${getEventColor(event.type, event.isApproved)}`}
                                >
                                    {getEventIcon(event.type)}
                                    <span className="truncate">{event.title}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* Sidebar Details */}
      <div className="w-full lg:w-80 bg-slate-900 border border-slate-800 rounded-xl flex flex-col p-6">
         <div className="mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <CalIcon className="w-5 h-5 text-accent-cyan" /> {t.scheduleDetails}
            </h3>
            <p className="text-sm text-slate-400">{t.detailsDesc}</p>
         </div>

         {selectedEvent ? (
             <div className="animate-in slide-in-from-right-4">
                 <div className={`h-2 w-full rounded-full mb-4 ${getEventColor(selectedEvent.type, true)}`} />
                 
                 <div className="flex justify-between items-start">
                    <h4 className="text-xl font-bold text-white mb-2">{selectedEvent.title}</h4>
                    {!selectedEvent.isApproved && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] rounded uppercase tracking-wide font-bold">{t.pending}</span>
                    )}
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center gap-3 text-slate-300">
                        <div className="p-2 bg-slate-800 rounded-lg text-slate-400"><Clock className="w-4 h-4" /></div>
                        <div className="text-sm">
                            <span className="block text-xs text-slate-500 uppercase">{t.date}</span>
                            {new Date(selectedEvent.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                    
                    {selectedEvent.location && (
                        <div className="flex items-center gap-3 text-slate-300">
                            <div className="p-2 bg-slate-800 rounded-lg text-slate-400"><MapPin className="w-4 h-4" /></div>
                            <div className="text-sm">
                                <span className="block text-xs text-slate-500 uppercase">{t.location}</span>
                                {selectedEvent.location}
                            </div>
                        </div>
                    )}

                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-800">
                        <span className="block text-xs text-slate-500 uppercase mb-1">{t.desc}</span>
                        <p className="text-sm text-slate-300 leading-relaxed">{selectedEvent.description}</p>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-slate-500 uppercase">Status:</span>
                        <span className={`text-xs font-bold flex items-center gap-1 ${selectedEvent.isApproved ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {selectedEvent.isApproved ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {selectedEvent.status || t.confirmed}
                        </span>
                    </div>

                    {!selectedEvent.isApproved && isMasterAdmin && (
                        <button 
                            onClick={() => handleApproveEvent(selectedEvent.id)}
                            className="w-full py-2 mt-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <ShieldCheck className="w-4 h-4" /> {t.approveEvent}
                        </button>
                    )}

                    <button 
                        onClick={() => setSelectedEvent(null)}
                        className="w-full py-2 mt-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors"
                    >
                        {t.closeDetails}
                    </button>
                 </div>
             </div>
         ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                 <CalIcon className="w-12 h-12 text-slate-600 mb-3" />
                 <p className="text-sm text-slate-400">{t.selectEvent}</p>
             </div>
         )}
      </div>

    </div>
  );
};

export default CalendarView;