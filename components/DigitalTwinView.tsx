
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { Language, MachineStatus } from '../types';
import { getTranslation } from '../services/i18nService';
import { Zap, AlertTriangle, CheckCircle, Info, Edit, Save, Trash2, PlusCircle, Grid } from 'lucide-react';
import { authService } from '../services/authService';

interface DigitalTwinViewProps {
  lang?: Language;
}

const DigitalTwinView: React.FC<DigitalTwinViewProps> = ({ lang = 'en' }) => {
  const t = getTranslation(lang as Language).twin;
  const [machines, setMachines] = useState<MachineStatus[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  
  const canEdit = authService.hasPermission('can_edit_data');

  useEffect(() => {
      refreshData();
  }, []);

  const refreshData = () => {
      setMachines([...dataService.getMachines()]);
  };

  // 10x6 Grid
  const gridWidth = 10;
  const gridHeight = 6;

  const getMachineAt = (x: number, y: number) => {
    return machines.find(m => m.gridPosition?.x === x && m.gridPosition?.y === y);
  };

  const handleGridClick = (x: number, y: number) => {
      if (!isEditMode) return;

      const existingMachine = getMachineAt(x, y);

      if (existingMachine) {
          // Remove if clicked while occupied
          dataService.updateMachinePosition(existingMachine.id, undefined, undefined);
      } else if (selectedAssetId) {
          // Place if empty and asset selected
          dataService.updateMachinePosition(selectedAssetId, x, y);
          setSelectedAssetId(null); // Deselect after place
      }
      refreshData();
  };

  const handleClearMap = () => {
      if (confirm("Are you sure you want to clear the entire map?")) {
          dataService.resetFactoryMap();
          refreshData();
      }
  };

  const unplacedMachines = machines.filter(m => !m.gridPosition);

  return (
    <div className="h-full flex flex-col gap-4">
       <div className="flex justify-between items-end">
         <div>
            <h2 className="text-2xl font-bold text-white">{t.factoryMap}</h2>
            <p className="text-slate-400 mt-1 flex items-center gap-2">
                {isEditMode ? (
                    <span className="text-amber-400 font-bold flex items-center gap-1"><Edit className="w-3 h-3" /> EDITOR MODE ACTIVE</span>
                ) : (
                    "Real-time spatial visualization of machine status and energy draw."
                )}
            </p>
         </div>
         <div className="flex gap-4 items-center">
             {!isEditMode && (
                 <div className="flex gap-4 text-sm mr-4">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span> {t.running}</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 bg-rose-500 rounded-full"></span> {t.stopped}</div>
                 </div>
             )}
             
             {canEdit && (
                 <button 
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
                        isEditMode 
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20' 
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                    }`}
                 >
                     {isEditMode ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                     {isEditMode ? "Save Layout" : "Edit Blueprint"}
                 </button>
             )}
         </div>
       </div>

       <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Floor Grid */}
          <div className={`flex-1 bg-slate-900 border rounded-xl p-6 overflow-hidden relative flex flex-col ${isEditMode ? 'border-amber-500/30' : 'border-slate-800'}`}>
              {isEditMode && (
                  <div className="absolute top-4 right-4 z-10">
                      <button onClick={handleClearMap} className="bg-rose-900/30 hover:bg-rose-900/50 text-rose-400 px-3 py-1.5 rounded text-xs font-bold border border-rose-900/50 flex items-center gap-2 transition-colors">
                          <Trash2 className="w-3 h-3" /> Clear Map
                      </button>
                  </div>
              )}

              <div className="grid grid-cols-10 grid-rows-6 gap-3 h-full w-full">
                {Array.from({ length: gridHeight }).map((_, y) => (
                    Array.from({ length: gridWidth }).map((_, x) => {
                        const machine = getMachineAt(x, y);
                        const isSelectedTarget = isEditMode && selectedAssetId && !machine;
                        
                        return (
                            <div 
                                key={`${x}-${y}`} 
                                onClick={() => handleGridClick(x, y)}
                                className={`rounded-lg border relative group transition-all duration-200 flex flex-col items-center justify-center p-1
                                    ${isEditMode ? 'cursor-pointer hover:border-white/50' : ''}
                                    ${isSelectedTarget ? 'bg-amber-900/10 border-amber-500/50 border-dashed animate-pulse' : ''}
                                    ${machine 
                                    ? machine.status === 'Running' ? 'bg-emerald-900/20 border-emerald-500/50 hover:bg-emerald-900/40' 
                                    : machine.status === 'Warning' ? 'bg-amber-900/20 border-amber-500/50 hover:bg-amber-900/40'
                                    : 'bg-rose-900/20 border-rose-500/50 hover:bg-rose-900/40 animate-pulse'
                                    : 'bg-slate-950/40 border-slate-800/50'
                                }`}
                            >
                                {machine && (
                                    <>
                                        {isEditMode && (
                                            <div className="absolute top-1 right-1 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 rounded-full p-0.5">
                                                <Trash2 className="w-3 h-3" />
                                            </div>
                                        )}
                                        <div className="text-center w-full">
                                            <span className="text-[10px] font-bold text-white block truncate px-1">{machine.name}</span>
                                            {!isEditMode && (
                                                <div className="flex items-center justify-center gap-1 text-[9px] text-slate-400 mt-1">
                                                    <Zap className="w-2 h-2 text-yellow-400" /> {machine.energyUsageKwh}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Tooltip (Only in View Mode) */}
                                        {!isEditMode && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-slate-800 border border-slate-700 p-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                                <h4 className="font-bold text-white text-xs mb-1">{machine.name}</h4>
                                                <div className="space-y-0.5">
                                                    <div className="flex justify-between text-[10px] text-slate-400"><span>Status:</span> <span className="text-white">{machine.status}</span></div>
                                                    <div className="flex justify-between text-[10px] text-slate-400"><span>Health:</span> <span className="text-white">{machine.healthScore}%</span></div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                                
                                {/* Coordinates */}
                                {!machine && isEditMode && (
                                    <span className="text-[9px] text-slate-700 font-mono select-none">{x},{y}</span>
                                )}
                            </div>
                        );
                    })
                ))}
              </div>
          </div>

          {/* Asset Sidebar (Edit Mode Only) */}
          {isEditMode && (
              <div className="w-64 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden animate-in slide-in-from-right-4">
                  <div className="p-4 border-b border-slate-800 bg-slate-950/50">
                      <h3 className="font-bold text-white text-sm flex items-center gap-2">
                          <Grid className="w-4 h-4 text-primary-500" /> Unplaced Assets
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Select an asset to place it.</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                      {unplacedMachines.length === 0 ? (
                          <div className="text-center text-slate-500 text-xs mt-10">All assets placed.</div>
                      ) : (
                          unplacedMachines.map(m => (
                              <button
                                  key={m.id}
                                  onClick={() => setSelectedAssetId(selectedAssetId === m.id ? null : m.id)}
                                  className={`w-full p-3 rounded-lg text-left text-xs border transition-all ${
                                      selectedAssetId === m.id 
                                      ? 'bg-primary-900/20 border-primary-500 text-white shadow-sm' 
                                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                                  }`}
                              >
                                  <div className="font-bold truncate">{m.name}</div>
                                  <div className="text-[10px] opacity-70">{m.type}</div>
                              </button>
                          ))
                      )}
                  </div>
              </div>
          )}
       </div>
    </div>
  );
};

export default DigitalTwinView;
