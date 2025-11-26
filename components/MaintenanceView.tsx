import React, { useState, useEffect, useRef } from 'react';
import { Activity, Cpu, Zap, AlertOctagon, CheckCircle2, RefreshCw, Gauge, Timer, History, Lock, Info, PenTool, Settings, Play, StopCircle, AlertTriangle } from 'lucide-react';
import { MachineStatus, MaintenanceInsight, Alert, Language } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { analyzeMachineHealth } from '../services/geminiService';
import { authService } from '../services/authService';
import { dataService } from '../services/dataService';
import { emailService } from '../services/emailService';
import { getTranslation } from '../services/i18nService';

interface MaintenanceViewProps {
  onAlert: (alert: Alert) => void;
  lang?: Language;
}

const MaintenanceView: React.FC<MaintenanceViewProps> = ({ onAlert, lang = 'en' }) => {
  const t = getTranslation(lang as Language).maintenance;
  const [machines, setMachines] = useState<MachineStatus[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<MachineStatus | null>(null);
  const [insight, setInsight] = useState<MaintenanceInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSensorGuide, setShowSensorGuide] = useState(false);
  
  // Downtime Logic
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionReason, setResolutionReason] = useState('');
  const [activeDowntimeDuration, setActiveDowntimeDuration] = useState<string>('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const canRunForecasts = authService.hasPermission('can_run_forecasts');
  const canEdit = authService.hasPermission('can_edit_data');

  // Load initial data
  useEffect(() => {
    const data = dataService.getMachines();
    setMachines(data);
    if (data.length > 0 && !selectedMachine) {
        setSelectedMachine(data[0]);
    }
  }, []);

  // Refresh selected machine when data updates
  useEffect(() => {
    const updatedMachines = dataService.getMachines();
    setMachines(updatedMachines);
    if (selectedMachine) {
        const updatedSelected = updatedMachines.find(m => m.id === selectedMachine.id);
        if (updatedSelected) setSelectedMachine(updatedSelected);
    }
  }, [selectedMachine?.id, activeDowntimeDuration]); 

  // Timer for active downtime
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (selectedMachine?.currentDowntimeStart) {
        const updateTimer = () => {
            const start = new Date(selectedMachine.currentDowntimeStart!).getTime();
            const now = new Date().getTime();
            const diff = now - start;
            
            const hrs = Math.floor(diff / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            
            setActiveDowntimeDuration(`${hrs}h ${mins}m ${secs}s`);
        };
        
        updateTimer(); // Initial call
        timerRef.current = setInterval(updateTimer, 1000);
    } else {
        setActiveDowntimeDuration('');
    }

    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selectedMachine?.currentDowntimeStart]);

  const handleMachineChange = (id: string) => {
    const machine = machines.find(m => m.id === id);
    if (machine) {
      setSelectedMachine(machine);
      setInsight(null);
    }
  };

  const handleStatusChange = (newStatus: MachineStatus['status']) => {
    if (!selectedMachine) return;

    if (newStatus === 'Running') {
        setShowResolveModal(true);
    } else {
        const updated = dataService.updateMachineStatus(selectedMachine.id, newStatus);
        if (updated) setSelectedMachine(updated);
    }
  };

  const submitResolution = () => {
    if (!selectedMachine) return;
    const updated = dataService.updateMachineStatus(selectedMachine.id, 'Running', resolutionReason);
    if (updated) setSelectedMachine(updated);
    setShowResolveModal(false);
    setResolutionReason('');
  };

  const handleAnalyze = async () => {
    if (!canRunForecasts || !selectedMachine) return;
    setLoading(true);
    try {
      const result = await analyzeMachineHealth(selectedMachine);
      setInsight(result);
      
      if (result.status === 'Critical' || result.status === 'Warning') {
        onAlert({
          id: Date.now().toString(),
          type: 'failure',
          message: `${result.status} Risk: ${selectedMachine.name}. ${result.recommendation.slice(0, 50)}...`,
          timestamp: new Date().toISOString(),
          severity: result.status === 'Critical' ? 'critical' : 'warning'
        });

        if (result.status === 'Critical') {
            emailService.sendAlertEmail(
                'maintenance_team',
                `CRITICAL ALERT: ${selectedMachine.name}`,
                `Machine ID: ${selectedMachine.id}<br/>Risk Level: CRITICAL<br/>Failure Probability: ${(result.failureProbability * 100).toFixed(0)}%<br/>Recommendation: ${result.recommendation}`
            );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (!selectedMachine) return <div>Loading...</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] relative">
      
      {/* Resolution Modal */}
      {showResolveModal && (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" /> {t.resolveDowntime}
                </h3>
                <p className="text-sm text-slate-400 mb-4">
                    {t.resolveDesc}
                </p>
                <textarea
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:border-emerald-500 outline-none min-h-[100px] text-sm"
                    placeholder={t.placeholderReason}
                    value={resolutionReason}
                    onChange={(e) => setResolutionReason(e.target.value)}
                />
                <div className="flex gap-3 mt-6 justify-end">
                    <button 
                        onClick={() => setShowResolveModal(false)}
                        className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                    >
                        {t.cancel}
                    </button>
                    <button 
                        onClick={submitResolution}
                        disabled={!resolutionReason.trim()}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium"
                    >
                        {t.logRestart}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Sensor Guide Modal */}
      {showSensorGuide && (
        <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-full overflow-y-auto p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <PenTool className="w-6 h-6 text-primary-500" /> {t.sensorSuite}
              </h2>
              <button onClick={() => setShowSensorGuide(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"><Info className="w-6 h-6" /></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-200 border-b border-slate-800 pb-2">Essential Sensors</h3>
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <div className="flex justify-between mb-1"><span className="font-bold text-white">Vibration (Accelerometers)</span> <span className="text-xs bg-primary-900 text-primary-300 px-2 py-1 rounded">Critical</span></div>
                  <p className="text-sm text-slate-400">Mount on bearings and gearboxes. Detects imbalance, misalignment, and bearing wear 3-4 weeks before failure.</p>
                </div>
                {/* Additional Guide Content can be localized similarly but kept English for brevity in this pass */}
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button onClick={() => setShowSensorGuide(false)} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500">{t.closeGuide}</button>
            </div>
          </div>
        </div>
      )}

      {/* Machine List */}
      <div className="w-full lg:w-1/4 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-800 bg-slate-900">
          <h3 className="font-semibold text-slate-200">{t.machineFleet}</h3>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-2">
          {machines.map(machine => (
            <button
              key={machine.id}
              onClick={() => handleMachineChange(machine.id)}
              className={`w-full p-3 rounded-lg text-left border transition-all ${
                selectedMachine.id === machine.id
                  ? 'bg-slate-800 border-primary-500/50 ring-1 ring-primary-500/50'
                  : 'bg-slate-900/50 border-transparent hover:bg-slate-800'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-slate-200 text-sm">{machine.name}</span>
                <span className={`w-2 h-2 rounded-full ${
                  machine.status === 'Running' ? 'bg-emerald-500' : 
                  machine.status === 'Warning' ? 'bg-amber-500' : 'bg-rose-500'
                }`} />
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>{machine.type}</span>
                <span>Score: {machine.healthScore}</span>
              </div>
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-slate-800">
           <button onClick={() => setShowSensorGuide(true)} className="w-full py-2 rounded-lg border border-dashed border-slate-600 text-slate-400 text-xs hover:text-white hover:border-primary-500 transition-all flex items-center justify-center gap-2">
             <Info className="w-3 h-3" /> {t.viewSensors}
           </button>
        </div>
      </div>

      {/* Detail Panel */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto">
        
        {/* Top Control Bar & Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="flex items-center gap-4">
                 <div className={`p-3 rounded-full border-4 ${
                    selectedMachine.status === 'Running' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' :
                    selectedMachine.status === 'Warning' ? 'bg-amber-500/20 border-amber-500 text-amber-500' :
                    'bg-rose-500/20 border-rose-500 text-rose-500'
                 }`}>
                    <Activity className="w-6 h-6" />
                 </div>
                 <div>
                    <h2 className="text-lg font-bold text-white">{selectedMachine.name}</h2>
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${
                             selectedMachine.status === 'Running' ? 'text-emerald-400' :
                             selectedMachine.status === 'Warning' ? 'text-amber-400' : 'text-rose-400'
                        }`}>{selectedMachine.status.toUpperCase()}</span>
                        
                        {/* Active Downtime Timer */}
                        {selectedMachine.currentDowntimeStart && (
                             <span className="px-2 py-0.5 bg-rose-900/50 text-rose-300 text-xs rounded border border-rose-800 font-mono flex items-center gap-1 animate-pulse">
                                <Timer className="w-3 h-3" /> {activeDowntimeDuration}
                             </span>
                        )}
                    </div>
                 </div>
             </div>

             {/* Status Controls */}
             {canEdit && (
                 <div className="flex items-center gap-2">
                    {selectedMachine.status === 'Running' ? (
                        <>
                            <button onClick={() => handleStatusChange('Warning')} className="px-3 py-2 bg-amber-900/30 text-amber-400 hover:bg-amber-900/50 border border-amber-900/50 rounded-lg text-xs font-medium flex items-center gap-2 transition-all">
                                <AlertTriangle className="w-3 h-3" /> {t.flagWarning}
                            </button>
                            <button onClick={() => handleStatusChange('Stopped')} className="px-3 py-2 bg-rose-900/30 text-rose-400 hover:bg-rose-900/50 border border-rose-900/50 rounded-lg text-xs font-medium flex items-center gap-2 transition-all">
                                <StopCircle className="w-3 h-3" /> {t.triggerStop}
                            </button>
                        </>
                    ) : (
                        <button onClick={() => handleStatusChange('Running')} className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-500 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-emerald-900/20 animate-pulse">
                            <Play className="w-4 h-4" /> {t.resolveRestart}
                        </button>
                    )}
                 </div>
             )}
        </div>

        {/* Telemetry Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-64">
                <h4 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">Vibration (mm/s) & Temperature (°C)</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedMachine.readings}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="timestamp" hide />
                        <YAxis yAxisId="left" stroke="#F43F5E" fontSize={10} />
                        <YAxis yAxisId="right" orientation="right" stroke="#06B6D4" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                        <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#F43F5E" dot={false} strokeWidth={2} />
                        <Line yAxisId="right" type="monotone" dataKey="vibration" stroke="#06B6D4" dot={false} strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-64">
                <h4 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">RPM & Load (Amps)</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedMachine.readings}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="timestamp" hide />
                        <YAxis yAxisId="left" stroke="#10B981" fontSize={10} domain={['auto', 'auto']} />
                        <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" fontSize={10} domain={['auto', 'auto']} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                        <Line yAxisId="left" type="monotone" dataKey="rpm" stroke="#10B981" dot={false} strokeWidth={2} />
                        <Line yAxisId="right" type="monotone" dataKey="electricCurrent" stroke="#F59E0B" dot={false} strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* AI Analysis & Maintenance History Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Panel */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-500/10 rounded-lg text-primary-500">
                            <Cpu className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">{t.predictiveAI}</h3>
                            <p className="text-xs text-slate-400">{t.realTimeAnalysis}</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleAnalyze}
                        disabled={loading || !canRunForecasts}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                            loading || !canRunForecasts
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                            : 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-900/20'
                        }`}
                    >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        {loading ? t.processing : t.runPrediction}
                    </button>
                </div>

                {insight ? (
                    <div className="space-y-4 animate-in fade-in duration-500">
                        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                            <h4 className="text-xs font-bold text-slate-300 mb-1">{t.aiSummary}</h4>
                            <p className="text-slate-300 text-xs leading-relaxed">{insight.summary}</p>
                        </div>
                        <div className="flex gap-3">
                            <div className={`flex-1 p-3 rounded border ${
                                insight.status === 'Critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                                insight.status === 'Warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            }`}>
                                <span className="text-[10px] uppercase font-bold">{t.riskLevel}</span>
                                <div className="text-lg font-bold">{insight.status}</div>
                            </div>
                            <div className="flex-1 p-3 rounded border border-slate-700 bg-slate-800/30">
                                <span className="text-[10px] uppercase font-bold text-slate-400">{t.failProb}</span>
                                <div className="text-lg font-bold text-white">{(insight.failureProbability * 100).toFixed(0)}%</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500 text-xs border-2 border-dashed border-slate-800 rounded-lg min-h-[150px]">
                        Click 'Run Prediction' to analyze sensor streams.
                    </div>
                )}
            </div>

            {/* Maintenance Log */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col h-[300px]">
                <div className="flex items-center gap-2 mb-4">
                    <History className="w-5 h-5 text-slate-400" />
                    <h3 className="font-semibold text-white">{t.maintenanceLog}</h3>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                    {selectedMachine.maintenanceLogs.length === 0 ? (
                        <p className="text-sm text-slate-500 italic">{t.noRecords}</p>
                    ) : (
                        selectedMachine.maintenanceLogs.map((log, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-sm">
                                <div className="flex justify-between mb-1">
                                    <span className="text-slate-300 font-medium">{log.date}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                        log.type === 'Corrective' ? 'bg-rose-900/30 text-rose-400' : 'bg-blue-900/30 text-blue-400'
                                    }`}>{log.type}</span>
                                </div>
                                <p className="text-slate-400 text-xs mb-1">{log.description}</p>
                                <div className="flex justify-between items-center text-[10px] text-slate-500">
                                    <span>Parts: {log.partsReplaced.join(', ') || 'None'}</span>
                                    <span>{log.downtimeMinutes} min {t.downtime}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default MaintenanceView;