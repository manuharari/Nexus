import React from 'react';
import { ClipboardList, User, Clock } from 'lucide-react';
import { Language, WorkOrder } from '../types';
import { getTranslation } from '../services/i18nService';
import { dataService } from '../services/dataService';

interface WorkOrderViewProps {
  lang?: Language;
}

const WorkOrderView: React.FC<WorkOrderViewProps> = ({ lang = 'en' }) => {
  const t = getTranslation(lang as Language).workOrder;
  const tickets = dataService.getWorkOrders();

  const TicketColumn = ({ status, label, color }: { status: WorkOrder['status'], label: string, color: string }) => (
      <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl flex flex-col h-full">
          <div className={`p-3 border-b border-slate-800 font-bold text-sm uppercase tracking-wide ${color}`}>
              {label} ({tickets.filter(t => t.status === status).length})
          </div>
          <div className="p-2 space-y-2 overflow-y-auto flex-1">
              {tickets.filter(t => t.status === status).map(ticket => (
                  <div key={ticket.id} className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-sm hover:border-primary-500 cursor-pointer transition-colors group">
                      <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-slate-200 text-sm">{ticket.title}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                              ticket.priority === 'Critical' ? 'bg-rose-900 text-rose-400' :
                              ticket.priority === 'High' ? 'bg-amber-900 text-amber-400' : 'bg-blue-900 text-blue-400'
                          }`}>{ticket.priority}</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-3 line-clamp-2">{ticket.description}</p>
                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                          <div className="flex items-center gap-1">
                              <User className="w-3 h-3" /> {ticket.assignedTechnician || 'Unassigned'}
                          </div>
                          <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {ticket.createdDate}
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-full gap-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
           <ClipboardList className="w-6 h-6 text-primary-500" /> {t.ticketBoard}
       </h2>

       <div className="flex-1 flex gap-4 overflow-x-auto pb-2">
           <TicketColumn status="Open" label={t.open} color="text-slate-400" />
           <TicketColumn status="In Progress" label={t.inProgress} color="text-primary-400" />
           <TicketColumn status="Closed" label={t.closed} color="text-emerald-400" />
       </div>
    </div>
  );
};

export default WorkOrderView;