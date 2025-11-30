
import React, { useState, useEffect } from 'react';
import { ClipboardList, User, Clock, Plus, X, AlertTriangle, Hammer, Factory } from 'lucide-react';
import { Language, WorkOrder, WorkOrderCategory } from '../types';
import { getTranslation } from '../services/i18nService';
import { dataService } from '../services/dataService';
import { authService } from '../services/authService';

interface WorkOrderViewProps {
  lang?: Language;
}

const WorkOrderView: React.FC<WorkOrderViewProps> = ({ lang = 'en' }) => {
  const t = getTranslation(lang as Language).workOrder;
  const [tickets, setTickets] = useState<WorkOrder[]>([]);
  const [filterType, setFilterType] = useState<WorkOrderCategory | 'All'>('All');
  
  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<WorkOrderCategory>('Maintenance');
  const [newMachine, setNewMachine] = useState('');
  const [newPriority, setNewPriority] = useState<WorkOrder['priority']>('Medium');
  const [newDesc, setNewDesc] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [conflictWarning, setConflictWarning] = useState(false);

  const currentUser = authService.getCurrentUser();
  const machines = dataService.getMachines();

  useEffect(() => {
    setTickets(dataService.getWorkOrders());
    // Auto-set filter based on role for better UX
    if (currentUser?.role === 'sales') setFilterType('Production');
    if (currentUser?.email.includes('maintenance')) setFilterType('Maintenance');
  }, []);

  const handleCreate = () => {
      if (!newTitle || !newMachine) return;
      
      const machineName = machines.find(m => m.id === newMachine)?.name || 'Unknown Machine';
      
      const result = dataService.createWorkOrder({
          machineId: newMachine,
          machineName: machineName,
          category: newCategory,
          title: newTitle,
          description: newDesc,
          priority: newPriority,
          status: 'Open',
          startDate: newStart,
          endDate: newEnd
      });

      if (result.conflict) {
          alert(t.conflictAlert);
      }

      setTickets([...dataService.getWorkOrders()]);
      setIsModalOpen(false);
      resetForm();
  };

  const checkConflict = () => {
      if (newMachine && newStart && newEnd) {
          const hasConflict = dataService.checkResourceConflict(newMachine, newStart, newEnd);
          setConflictWarning(hasConflict);
      } else {
          setConflictWarning(false);
      }
  };

  useEffect(() => {
      checkConflict();
  }, [newMachine, newStart, newEnd]);

  const resetForm = () => {
      setNewTitle('');
      setNewDesc('');
      setNewStart('');
      setNewEnd('');
      setConflictWarning(false);
  };

  const filteredTickets = tickets.filter(t => filterType === 'All' || t.category === filterType);

  const TicketColumn = ({ status, label, color }: { status: WorkOrder['status'], label: string, color: string }) => (
      <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl flex flex-col h-full overflow-hidden">
          <div className={`p-3 border-b border-slate-800 font-bold text-sm uppercase tracking-wide flex justify-between items-center ${color}`}>
              <span>{label}</span>
              <span className="bg-slate-900 px-2 py-0.5 rounded text-xs">{filteredTickets.filter(t => t.status === status).length}</span>
          </div>
          <div className="p-2 space-y-2 overflow-y-auto flex-1 custom-scrollbar">
              {filteredTickets.filter(t => t.status === status).map(ticket => (
                  <div key={ticket.id} className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-sm hover:border-primary-500 cursor-pointer transition-colors group relative overflow-hidden">
                      {/* Category Stripe */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${ticket.category === 'Maintenance' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                      
                      <div className="pl-3">
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-slate-200 text-sm truncate">{ticket.title}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold shrink-0 ${
                                ticket.priority === 'Critical' ? 'bg-rose-900 text-rose-400' :
                                ticket.priority === 'High' ? 'bg-amber-900 text-amber-400' : 'bg-blue-900 text-blue-400'
                            }`}>{ticket.priority}</span>
                        </div>
                        
                        <div className="flex gap-2 mb-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                                ticket.category === 'Maintenance' 
                                ? 'bg-orange-900/20 text-orange-400 border-orange-900/50' 
                                : 'bg-blue-900/20 text-blue-400 border-blue-900/50'
                            }`}>
                                {ticket.category === 'Maintenance' ? <Hammer className="w-3 h-3" /> : <Factory className="w-3 h-3" />}
                                {ticket.category}
                            </span>
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded truncate max-w-[100px]">{ticket.machineName}</span>
                        </div>

                        <p className="text-xs text-slate-400 mb-3 line-clamp-2">{ticket.description}</p>
                        
                        <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-800 pt-2">
                            <div className="flex items-center gap-1">
                                <User className="w-3 h-3" /> {ticket.assignedTechnician || 'Unassigned'}
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {ticket.startDate ? ticket.startDate : ticket.createdDate}
                            </div>
                        </div>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-full gap-6">
        {/* Create Modal */}
        {isModalOpen && (
            <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white">{t.createTicket}</h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t.category}</label>
                                <select value={newCategory} onChange={e => setNewCategory(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none">
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Production">Production</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t.priority}</label>
                                <select value={newPriority} onChange={e => setNewPriority(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none">
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Critical">Critical</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t.ticketTitle}</label>
                            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none" placeholder="e.g. Belt Replacement" />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t.resource}</label>
                            <select value={newMachine} onChange={e => setNewMachine(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none">
                                <option value="">Select Resource...</option>
                                {machines.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t.startDate}</label>
                                <input type="date" value={newStart} onChange={e => setNewStart(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t.endDate}</label>
                                <input type="date" value={newEnd} onChange={e => setNewEnd(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none" />
                            </div>
                        </div>

                        {conflictWarning && (
                            <div className="bg-rose-900/20 border border-rose-900/50 p-3 rounded-lg flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-rose-500" />
                                <span className="text-xs text-rose-300 font-bold">{t.conflictWarning}</span>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t.desc}</label>
                            <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none h-20" />
                        </div>

                        <button onClick={handleCreate} className="w-full bg-primary-600 hover:bg-primary-500 text-white py-2 rounded-lg font-bold">
                            {t.submitTicket}
                        </button>
                    </div>
                </div>
            </div>
        )}

        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-primary-500" /> {t.ticketBoard}
            </h2>
            <div className="flex gap-4">
                <div className="bg-slate-900 rounded-lg p-1 border border-slate-800 flex">
                    {(['All', 'Maintenance', 'Production'] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                                filterType === type ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary-900/20"
                >
                    <Plus className="w-4 h-4" /> {t.newTicket}
                </button>
            </div>
       </div>

       <div className="flex-1 flex gap-4 overflow-x-auto pb-2">
           <TicketColumn status="Open" label={t.open} color="text-slate-400" />
           <TicketColumn status="In Progress" label={t.inProgress} color="text-primary-400" />
           <TicketColumn status="Closed" label={t.closed} color="text-emerald-400" />
       </div>
    </div>
  );
};

export default WorkOrderView;
