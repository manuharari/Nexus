import React, { useState } from 'react';
import { analyzeImageQuality } from '../services/geminiService';
import { Language, QualityCheck } from '../types';
import { getTranslation } from '../services/i18nService';
import { Camera, Upload, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface QualityViewProps {
  lang?: Language;
}

const QualityView: React.FC<QualityViewProps> = ({ lang = 'en' }) => {
  const t = getTranslation(lang as Language).quality;
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<Omit<QualityCheck, 'id'|'date'|'batchId'|'skuId'> | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = async (ev) => {
              const base64 = ev.target?.result as string;
              setPreview(base64);
              setAnalyzing(true);
              setResult(null);
              
              try {
                  const data = await analyzeImageQuality(base64);
                  setResult(data);
              } finally {
                  setAnalyzing(false);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  return (
    <div className="flex flex-col h-full gap-6">
       <h2 className="text-2xl font-bold text-white flex items-center gap-2">
           <Camera className="w-6 h-6 text-primary-500" /> {t.visualCheck}
       </h2>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
           {/* Upload Area */}
           <div className="bg-slate-900 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-primary-500 transition-colors">
               {preview ? (
                   <img src={preview} alt="QC Target" className="w-full h-full object-contain opacity-50" />
               ) : (
                   <div className="text-center p-10">
                       <Upload className="w-16 h-16 text-slate-600 mb-4 mx-auto group-hover:text-primary-500 transition-colors" />
                       <p className="text-slate-400">{t.uploadImage}</p>
                   </div>
               )}
               <input type="file" accept="image/*" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
           </div>

           {/* Results Area */}
           <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col justify-center">
               {analyzing ? (
                   <div className="text-center">
                       <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                       <p className="text-xl font-mono text-primary-400 animate-pulse">{t.detecting}</p>
                   </div>
               ) : result ? (
                   <div className="animate-in zoom-in duration-300">
                       <div className="flex items-center justify-center mb-8">
                           {result.status === 'Pass' ? (
                               <div className="w-32 h-32 rounded-full bg-emerald-500/20 border-4 border-emerald-500 flex items-center justify-center">
                                   <span className="text-3xl font-black text-emerald-500">{t.pass}</span>
                               </div>
                           ) : (
                               <div className="w-32 h-32 rounded-full bg-rose-500/20 border-4 border-rose-500 flex items-center justify-center">
                                   <span className="text-3xl font-black text-rose-500">{t.fail}</span>
                               </div>
                           )}
                       </div>

                       <div className="space-y-4">
                           <div className="flex justify-between border-b border-slate-800 pb-2">
                               <span className="text-slate-400">{t.grade}</span>
                               <span className="text-white font-bold text-xl">{result.grade} ({result.score}%)</span>
                           </div>
                           <div>
                               <span className="text-slate-400 block mb-2">Defects Detected:</span>
                               {result.detectedDefects.length === 0 ? (
                                   <div className="flex items-center gap-2 text-emerald-400">
                                       <CheckCircle className="w-4 h-4" /> None
                                   </div>
                               ) : (
                                   <div className="flex flex-wrap gap-2">
                                       {result.detectedDefects.map(d => (
                                           <span key={d} className="px-3 py-1 bg-rose-900/40 text-rose-300 border border-rose-800 rounded-full text-sm flex items-center gap-1">
                                               <AlertTriangle className="w-3 h-3" /> {d}
                                           </span>
                                       ))}
                                   </div>
                               )}
                           </div>
                       </div>
                   </div>
               ) : (
                   <div className="text-center text-slate-600 italic">
                       Upload an image to start AI analysis.
                   </div>
               )}
           </div>
       </div>
    </div>
  );
};

export default QualityView;