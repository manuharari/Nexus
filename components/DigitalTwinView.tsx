
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { Language, MachineStatus, TileType, MapTile } from '../types';
import { getTranslation } from '../services/i18nService';
import { Zap, Edit, Save, Trash2, PlusCircle, Grid, X, PaintBucket, BoxSelect } from 'lucide-react';
import { authService } from '../services/authService';

interface DigitalTwinViewProps {
  lang?: Language;
}

const DigitalTwinView: React.FC<DigitalTwinViewProps> = ({ lang = 'en' }) => {
  const t = getTranslation(lang as Language).twin;
  const [machines, setMachines] = useState<MachineStatus[]>([]);
  const [tiles, setTiles] = useState<MapTile[]>([]);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTool, setEditTool] = useState<'place' | 'paint'>('place');
  const [paintType, setPaintType] = useState<TileType>('walkway');
  
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  
  // Add Asset Modal State
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetType, setNewAssetType] = useState('');
  const [newWidth, setNewWidth] = useState(1);
  const [newHeight, setNewHeight] = useState(1);

  const canEdit = authService.hasPermission('can_edit_data');

  useEffect(() => {
      refreshData();
  }, []);

  const refreshData = () => {
      setMachines([...dataService.getMachines()]);
      setTiles([...dataService.getMapTiles()]);
  };

  // 10x6 Grid
  const gridWidth = 10;
  const gridHeight = 6;

  // Helper: Find which machine occupies a specific x,y (checks full dimension rect)
  const getMachineOccupying = (x: number, y: number) => {
    return machines.find(m => {
        if (!m.gridPosition) return false;
        const w = m.dimensions?.width || 1;
        const h = m.dimensions?.height || 1;
        
        return (
            x >= m.gridPosition.x && x < m.gridPosition.x + w &&
            y >= m.gridPosition.y && y < m.gridPosition.y + h
        );
    });
  };

  const getTileAt = (x: number, y: number) => tiles.find(t => t.x === x && t.y === y);

  const handleGridClick = (x: number, y: number) => {
      if (!isEditMode) return;

      if (editTool === 'paint') {
          // Paint Logic
          dataService.setTileType(x, y, paintType);
          refreshData();
          return;
      }

      // Placement Logic
      const occupyingMachine = getMachineOccupying(x, y);

      if (occupyingMachine) {
          // Remove if clicked
          dataService.updateMachinePosition(occupyingMachine.id, undefined, undefined);
      } else if (selectedAssetId) {
          // Place if empty and asset selected
          // Note: dataService checks for overlap collision internally
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

  const handleAddAsset = () => {
      if (!newAssetName || !newAssetType) return;
      dataService.addMachine({
          name: newAssetName,
          type: newAssetType,
          width: newWidth,
          height: newHeight
      });
      refreshData();
      setIsAddAssetModalOpen(false);
      setNewAssetName('');
      setNewAssetType('');
      setNewWidth(1);
      setNewHeight(1);
  };

  const unplacedMachines = machines.filter(m => !m.gridPosition);

  // Render Logic: We need to build the grid cells. 
  // If a machine originates at x,y, we render it with col-span.
  // If a cell is part of a machine but NOT the origin, we render NOTHING (so the span covers it).
  const renderGrid = () => {
      const gridElements = [];
      const skipCells = new Set<string>(); // Keep track of cells covered by spans

      for (let y = 0; y < gridHeight; y++) {
          for (let x = 0; x < gridWidth; x++) {
              const key = `${x},${y}`;
              
              if (skipCells.has(key)) continue;

              const machine = machines.find(m => m.gridPosition?.x === x && m.gridPosition?.y === y);
              const tile = getTileAt(x, y);
              const isSelectedTarget = isEditMode && editTool === 'place' && selectedAssetId && !machine && !getMachineOccupying(x,y);

              // If this is the origin of a machine
              if (machine) {
                  const w = machine.dimensions?.width || 1;
                  const h = machine.dimensions?.height || 1;
                  
                  // Mark covered cells to skip rendering them
                  for (let dy = 0; dy < h; dy++) {
                      for (let dx = 0; dx < w; dx++) {
                          if (dx === 0 && dy === 0) continue;
                          skipCells.add(`${x+dx},${y+dy}`);
                      }
                  }

                  gridElements.push(
                      <div 
                          key={key}
                          onClick={() => handleGridClick(x, y)}
                          style={{ gridColumn: `span ${w}`, gridRow: `span ${h}` }}
                          className={`
                              rounded-lg border relative group transition-all duration-200 flex flex-col items-center justify-center p-2 z-10 shadow-sm
                              ${isEditMode ? 'cursor-pointer hover:border-white/50' : ''}
                              ${machine.status === 'Running' ? 'bg-emerald-900/40 border-emerald-500/50 hover:bg-emerald-900/60' 
                              : machine.status === 'Warning' ? 'bg-amber-900/40 border-amber-500/50 hover:bg-amber-900/60'
                              : 'bg-rose-900/40 border-rose-500/50 hover:bg-rose-900/60 animate-pulse'}
                          `}
                      >
                          {isEditMode && (
                              <div className="absolute top-1 right-1 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 rounded-full p-0.5 z-20">
                                  <Trash2 className="w-3 h-3" />
                              </div>
                          )}
                          
                          <div className="text-center w-full overflow-hidden">
                              <span className="text-[10px] lg:text-xs font-bold text-white block truncate px-1">{machine.name}</span>
                              <div className="flex flex-col items-center justify-center gap-0.5 text-[9px] text-slate-300 mt-1">
                                  <span>{machine.type}</span>
                                  {!isEditMode && (
                                      <div className="flex items-center gap-1 bg-slate-950/50 px-1.5 py-0.5 rounded-full mt-1">
                                          <Zap className="w-2 h-2 text-yellow-400" /> {machine.energyUsageKwh}
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>
                  );
              } else {
                  // Empty Cell (or Tile)
                  // Check if this cell is occupied by a machine originating elsewhere (handled by skipCells, but double check for safety)
                  const occupier = getMachineOccupying(x, y);
                  if (occupier) continue; // Should be handled by skipCells, but failsafe

                  // Tile Styling
                  let tileClass = "bg-slate-950/40 border-slate-800/50";
                  let tileContent = null;

                  if (tile?.type === 'walkway') {
                      tileClass = "bg-yellow-500/10 border-yellow-500/20";
                      tileContent = (
                          <div className="w-full h-full opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, #fbbf24 5px, #fbbf24 10px)' }}></div>
                      );
                  } else if (tile?.type === 'restricted') {
                      tileClass = "bg-rose-500/10 border-rose-500/20";
                      tileContent = (
                          <div className="w-full h-full opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 5px, #f43f5e 5px, #f43f5e 10px)' }}></div>
                      );
                  }

                  gridElements.push(
                      <div 
                          key={key} 
                          onClick={() => handleGridClick(x, y)}
                          className={`rounded-lg border relative flex items-center justify-center
                              ${isEditMode ? 'cursor-pointer hover:border-slate-600' : ''}
                              ${isSelectedTarget ? 'bg-amber-900/20 border-amber-500/50 border-dashed animate-pulse' : tileClass}
                          `}
                      >
                          {tileContent}
                          {!machine && isEditMode && (
                              <span className="text-[8px] text-slate-800 font-mono select-none absolute bottom-1 right-1">{x},{y}</span>
                          )}
                      </div>
                  );
              }
          }
      }
      return gridElements;
  };

  return (
    <div className="h-full flex flex-col gap-4 relative">
       
       {/* Add Asset Modal */}
       {isAddAssetModalOpen && (
           <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
               <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
                   <div className="flex justify-between items-center mb-4">
                       <h3 className="text-lg font-bold text-white">Create New Asset</h3>
                       <button onClick={() => setIsAddAssetModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                   </div>
                   <div className="space-y-4">
                       <div>
                           <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Asset Name</label>
                           <input 
                                value={newAssetName} 
                                onChange={e => setNewAssetName(e.target.value)} 
                                placeholder="e.g. Robot Arm 05"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:border-primary-500 outline-none" 
                           />
                       </div>
                       <div>
                           <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Type / Category</label>
                           <input 
                                value={newAssetType} 
                                onChange={e => setNewAssetType(e.target.value)} 
                                placeholder="e.g. CNC, Conveyor, Mixer"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:border-primary-500 outline-none" 
                           />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Width (Grid Cells)</label>
                                <input 
                                        type="number" min="1" max="5"
                                        value={newWidth} 
                                        onChange={e => setNewWidth(parseInt(e.target.value))} 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:border-primary-500 outline-none" 
                                />
                           </div>
                           <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Height (Grid Cells)</label>
                                <input 
                                        type="number" min="1" max="5"
                                        value={newHeight} 
                                        onChange={e => setNewHeight(parseInt(e.target.value))} 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:border-primary-500 outline-none" 
                                />
                           </div>
                       </div>
                       <button 
                           onClick={handleAddAsset} 
                           disabled={!newAssetName || !newAssetType}
                           className="w-full py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                           Add to Inventory
                       </button>
                   </div>
               </div>
           </div>
       )}

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
                  <div className="absolute top-4 right-4 z-10 flex gap-2">
                      <div className="bg-slate-950 border border-slate-700 rounded-lg p-1 flex">
                          <button 
                            onClick={() => setEditTool('place')}
                            className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 ${editTool === 'place' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}
                          >
                              <BoxSelect className="w-3 h-3" /> Place
                          </button>
                          <button 
                            onClick={() => setEditTool('paint')}
                            className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 ${editTool === 'paint' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}
                          >
                              <PaintBucket className="w-3 h-3" /> Paint
                          </button>
                      </div>
                      
                      <button onClick={handleClearMap} className="bg-rose-900/30 hover:bg-rose-900/50 text-rose-400 px-3 py-1.5 rounded text-xs font-bold border border-rose-900/50 flex items-center gap-2 transition-colors">
                          <Trash2 className="w-3 h-3" /> Clear Map
                      </button>
                  </div>
              )}

              <div className="grid gap-3 h-full w-full" style={{ gridTemplateColumns: `repeat(${gridWidth}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${gridHeight}, minmax(0, 1fr))` }}>
                  {renderGrid()}
              </div>
          </div>

          {/* Sidebar (Edit Mode Only) */}
          {isEditMode && (
              <div className="w-64 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden animate-in slide-in-from-right-4">
                  {editTool === 'place' ? (
                      <>
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
                                        <div className="text-[10px] opacity-70 flex justify-between">
                                            <span>{m.type}</span>
                                            <span>{m.dimensions?.width || 1}x{m.dimensions?.height || 1}</span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                        <div className="p-2 border-t border-slate-800">
                            <button 
                                onClick={() => setIsAddAssetModalOpen(true)}
                                className="w-full p-2 border border-dashed border-slate-600 rounded-lg text-xs text-slate-400 hover:text-white hover:border-primary-500 flex items-center justify-center gap-2 transition-all"
                            >
                                <PlusCircle className="w-4 h-4" /> Create New Asset
                            </button>
                        </div>
                      </>
                  ) : (
                      <>
                        <div className="p-4 border-b border-slate-800 bg-slate-950/50">
                            <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                <PaintBucket className="w-4 h-4 text-primary-500" /> Tile Painter
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Click cells to paint floor.</p>
                        </div>
                        <div className="p-4 space-y-2">
                            {(['floor', 'walkway', 'restricted'] as const).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setPaintType(type)}
                                    className={`w-full p-3 rounded-lg text-left text-xs border transition-all flex items-center gap-3 ${
                                        paintType === type 
                                        ? 'bg-slate-800 border-white text-white' 
                                        : 'bg-slate-950 border-slate-800 text-slate-400'
                                    }`}
                                >
                                    <div className={`w-4 h-4 rounded border ${
                                        type === 'walkway' ? 'bg-yellow-500/50 border-yellow-500' :
                                        type === 'restricted' ? 'bg-rose-500/50 border-rose-500' :
                                        'bg-slate-900 border-slate-700'
                                    }`}></div>
                                    <span className="capitalize">{type}</span>
                                </button>
                            ))}
                        </div>
                      </>
                  )}
              </div>
          )}
       </div>
    </div>
  );
};

export default DigitalTwinView;
