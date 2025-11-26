import React from 'react';
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Alert, Language } from '../types';
import { getTranslation } from '../services/i18nService';

interface AlertsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: Alert[];
  lang?: Language;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ isOpen, onClose, alerts, lang = 'en' }) => {
  const t = getTranslation(lang as Language).alerts;
  return (
    <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 border-l border-slate-800 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="h-full flex flex-col">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm">
          <h2 className="font-semibold text-slate-100">{t.notifications}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center text-slate-500 mt-10">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>{t.allNominal}</p>
            </div>
          ) : (
            alerts.map(alert => (
              <div key={alert.id} className={`p-4 rounded-lg border relative overflow-hidden ${
                alert.severity === 'critical' ? 'bg-rose-950/20 border-rose-900/50' :
                alert.severity === 'warning' ? 'bg-amber-950/20 border-amber-900/50' :
                'bg-slate-800/50 border-slate-700'
              }`}>
                <div className="flex gap-3">
                   <div className={`mt-1 ${
                      alert.severity === 'critical' ? 'text-rose-500' :
                      alert.severity === 'warning' ? 'text-amber-500' :
                      'text-primary-500'
                   }`}>
                      {alert.severity === 'critical' ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                   </div>
                   <div>
                      <p className={`text-sm font-medium ${
                        alert.severity === 'critical' ? 'text-rose-200' :
                        alert.severity === 'warning' ? 'text-amber-200' :
                        'text-slate-200'
                      }`}>
                        {alert.message}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </p>
                   </div>
                </div>
                
                {/* Simulated Notification Badges */}
                {(alert.severity === 'warning' || alert.severity === 'critical') && (
                    <div className="mt-3 flex gap-2">
                        <span className="px-2 py-1 bg-green-900/30 text-green-400 text-[10px] rounded border border-green-900/50">WhatsApp Sent</span>
                        <span className="px-2 py-1 bg-blue-900/30 text-blue-400 text-[10px] rounded border border-blue-900/50">Email Sent</span>
                    </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertsPanel;