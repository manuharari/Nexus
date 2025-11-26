
import React, { useState, useEffect } from 'react';
import { Activity, Server, Network, Shield, Terminal, Cpu, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { telemetryService } from '../services/telemetryService';
import { edgeService } from '../services/edgeService';
import { securityService } from '../services/securityService';
import { configService } from '../services/configService';
import { SystemMetric, TraceLog } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const SystemHealthView: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [traces, setTraces] = useState<TraceLog[]>([]);
  const [edgeStatus, setEdgeStatus] = useState(edgeService.getBufferStatus());
  const [rateLimit, setRateLimit] = useState({ tokens: 0, lastRefill: 0 });
  
  const client = configService.getClientConfig();

  useEffect(() => {
    const refresh = () => {
        setMetrics([...telemetryService.getMetrics()]);
        setTraces([...telemetryService.getRecentTraces()]);
        setEdgeStatus(edgeService.getBufferStatus());
        setRateLimit(securityService.getRateLimitStatus(client.clientId));
    };

    refresh();
    const interval = setInterval(refresh, 1000);
    return () => clearInterval(interval);
  }, [client.clientId]);

  // Helper to add dummy load
  const simulateTraffic = () => {
      for(let i=0; i<50; i++) { // Massive burst to show buffer filling
          edgeService.ingestReading('SIM-M1', { temp: 20 + i });
          telemetryService.startSpan('simulator', 'packet_gen', { i });
      }
  };

  const toggleNetwork = () => {
      edgeService.toggleConnection();
      setEdgeStatus(edgeService.getBufferStatus()); // Immediate update
  };

  return (
    <div className="flex flex-col h-full gap-6 font-mono text-xs">
        
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 mb-2 uppercase tracking-wider font-bold">
                    <div className="flex items-center gap-2"><Server className="w-4 h-4" /> Edge Buffer</div>
                    <button 
                        onClick={toggleNetwork}
                        title={edgeStatus.isConnected ? "Disconnect Network" : "Connect Network"}
                        className={`p-1 rounded hover:bg-slate-800 ${edgeStatus.isConnected ? 'text-emerald-500' : 'text-rose-500'}`}
                    >
                        {edgeStatus.isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                    </button>
                </div>
                <div className="flex items-end justify-between mb-2">
                    <div className="text-2xl font-bold text-white">{edgeStatus.used} / {edgeStatus.size}</div>
                    <div className={`h-2 w-24 rounded-full bg-slate-800 overflow-hidden border border-slate-700`}>
                        <div 
                            className={`h-full transition-all duration-300 ${
                                edgeStatus.used > edgeStatus.size * 0.9 ? 'bg-rose-500' : 
                                edgeStatus.used > edgeStatus.size * 0.5 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`} 
                            style={{ width: `${(edgeStatus.used / edgeStatus.size) * 100}%` }}
                        ></div>
                    </div>
                </div>
                <div className="flex justify-between text-[10px]">
                    <span className={edgeStatus.dropped > 0 ? "text-rose-500 animate-pulse font-bold" : "text-slate-600"}>
                        Dropped: {edgeStatus.dropped}
                    </span>
                    <span className={edgeStatus.isConnected ? "text-emerald-500" : "text-rose-500 font-bold"}>
                        {edgeStatus.isConnected ? "ONLINE" : "OFFLINE (BUFFERING)"}
                    </span>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-slate-400 mb-2 uppercase tracking-wider font-bold">
                    <Shield className="w-4 h-4" /> API Rate Limit
                </div>
                <div className="text-2xl font-bold text-blue-400">{Math.floor(rateLimit.tokens)} <span className="text-xs text-slate-500">tokens</span></div>
                <div className="text-slate-500 mt-1">Max: {client.rateLimitPerMinute}/min</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-slate-400 mb-2 uppercase tracking-wider font-bold">
                    <Network className="w-4 h-4" /> P95 Latency
                </div>
                <div className="text-2xl font-bold text-emerald-400">
                    {metrics[metrics.length - 1]?.apiLatencyP95.toFixed(0) || 0} ms
                </div>
                <div className="text-slate-500 mt-1">SLO: &lt; 500ms</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-slate-400 mb-2 uppercase tracking-wider font-bold">
                    <Cpu className="w-4 h-4" /> Active Connections
                </div>
                <div className="text-2xl font-bold text-purple-400">
                    {metrics[metrics.length - 1]?.activeConnections || 0}
                </div>
                <div className="text-slate-500 mt-1">Nodes: 3</div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
            
            {/* Live Metrics Chart */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-300 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> System Telemetry (Real-time)
                    </h3>
                    <button 
                        onClick={simulateTraffic} 
                        className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
                    >
                        <RefreshCw className="w-3 h-3" /> Simulate Heavy Load
                    </button>
                </div>
                <div className="flex-1 min-h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={metrics}>
                            <defs>
                                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorBuffer" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="timestamp" hide />
                            <YAxis stroke="#64748b" />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                            <Area type="monotone" dataKey="cpuLoad" stroke="#8884d8" fillOpacity={1} fill="url(#colorCpu)" name="CPU %" />
                            <Area type="monotone" dataKey="edgeBufferFillPct" stroke="#f97316" fillOpacity={1} fill="url(#colorBuffer)" name="Edge Buffer %" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Trace Log / Console */}
            <div className="bg-black border border-slate-800 rounded-xl p-4 flex flex-col font-mono shadow-inner">
                <div className="flex items-center gap-2 text-green-500 mb-2 border-b border-slate-800 pb-2">
                    <Terminal className="w-4 h-4" /> Live Trace Log
                </div>
                <div className="flex-1 overflow-y-auto space-y-1 p-2 custom-scrollbar">
                    {traces.map((t, i) => (
                        <div key={i} className="text-[10px] break-all hover:bg-slate-900 p-1 rounded cursor-default border-l-2 border-transparent hover:border-slate-700">
                            <span className="text-slate-500">{new Date(t.timestamp).toLocaleTimeString()}</span> 
                            <span className="text-blue-400 mx-1">[{t.service}]</span> 
                            <span className="text-yellow-300">{t.operation}</span> 
                            <span className="text-slate-600 mx-1">id:{t.traceId.slice(0,6)}</span>
                            <span className={t.status === 'OK' ? 'text-green-500' : 'text-red-500'}>{t.status}</span>
                            <span className="text-slate-500 ml-1">({t.durationMs}ms)</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

export default SystemHealthView;
