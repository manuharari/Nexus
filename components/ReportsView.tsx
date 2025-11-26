import React, { useState } from 'react';
import { FileSpreadsheet, Download, Database, TrendingUp, History, Upload, FileText, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { generatePriceHistoryTemplate, generateMaintenanceTemplate, generateSalesInventoryTemplate, generateDailyReportCSV, downloadCSV } from '../services/csvGenerator';
import { authService } from '../services/authService';
import { dataService } from '../services/dataService';
import { emailService } from '../services/emailService';
import { getTranslation } from '../services/i18nService';
import { Language } from '../types';

interface ReportsViewProps {
    lang?: Language;
}

const ReportsView: React.FC<ReportsViewProps> = ({ lang = 'en' }) => {
  const t = getTranslation(lang as Language).reports;
  const [loading, setLoading] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{type: string, message: string, success: boolean} | null>(null);
  const canDownload = authService.hasPermission('can_download_reports');
  const canEdit = authService.hasPermission('can_edit_data');
  const currentUser = authService.getCurrentUser();

  // --- Role Based Visibility ---
  const isMaster = currentUser?.role === 'master_admin';
  const isMaintenance = currentUser?.email.includes('maintenance') || isMaster; 
  const isProcurement = currentUser?.email.includes('purchasing') || isMaster;
  const isSales = currentUser?.role === 'sales' || isMaster;

  // --- Download Handlers ---
  const handleDownloadTemplate = (type: 'price' | 'maintenance' | 'sales') => {
    if (!canDownload) return;
    setLoading(type);
    
    setTimeout(() => {
      try {
        if (type === 'price') {
          const data = generatePriceHistoryTemplate();
          downloadCSV(data, 'TEMPLATE_nexus_material_prices.csv');
        } else if (type === 'maintenance') {
          const data = generateMaintenanceTemplate();
          downloadCSV(data, 'TEMPLATE_nexus_maintenance_logs.csv');
        } else if (type === 'sales') {
          const data = generateSalesInventoryTemplate();
          downloadCSV(data, 'TEMPLATE_nexus_production_sales.csv');
        }
      } catch (e) {
        console.error("Download failed", e);
      } finally {
        setLoading(null);
      }
    }, 1000);
  };

  const handleDownloadDailyReport = () => {
      const report = {
          date: new Date().toISOString().split('T')[0],
          alertsGenerated: 3,
          machinesAtRisk: 1,
          stockoutsPredicted: 2,
          buySignals: 1,
          summary: "Daily AI scan completed."
      };
      const csv = generateDailyReportCSV(report);
      downloadCSV(csv, `Nexus_Daily_Report_${report.date}.csv`);
      
      // AUTOMATED EMAIL TRIGGER
      emailService.sendAlertEmail(
          'master_admin',
          `Daily Executive Summary - ${report.date}`,
          `Your daily manufacturing intelligence report is ready.<br/>Alerts: ${report.alertsGenerated}<br/>At Risk: ${report.machinesAtRisk}<br/>Stockouts: ${report.stockoutsPredicted}`
      );
  };

  // --- Upload Handler ---
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'maintenance' | 'production' | 'procurement') => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const result = dataService.processUpload(type, content);
        setUploadStatus({
          type,
          message: result.message,
          success: result.success
        });
        // Reset input
        event.target.value = ''; 
        
        // Clear status after 5 seconds
        setTimeout(() => setUploadStatus(null), 5000);
      }
    };
    
    reader.readAsText(file);
  };

  const DataCard = ({ title, desc, icon, type }: { title: string, desc: string, icon: React.ReactNode, type: 'maintenance' | 'production' | 'procurement' | 'price' }) => {
      const uploadType = type === 'price' ? 'procurement' : type as any; 
      const downloadType = type === 'production' ? 'sales' : type;

      return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-primary-500/30 transition-all group">
        <div>
            <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center mb-4 text-primary-500 group-hover:text-white group-hover:bg-primary-500 transition-colors">
            {icon}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-sm text-slate-400 mb-6 min-h-[60px]">{desc}</p>
        </div>
        
        <div className="space-y-3">
            {/* Download Template Button */}
            <button
                onClick={() => handleDownloadTemplate(downloadType as 'price' | 'maintenance' | 'sales')}
                disabled={!!loading || !canDownload}
                className={`w-full py-2.5 rounded-lg border border-slate-700 flex items-center justify-center gap-2 text-xs font-medium transition-all
                ${loading === downloadType 
                    ? 'bg-slate-800 text-slate-500' 
                    : canDownload 
                    ? 'bg-slate-950 hover:bg-slate-800 text-white hover:border-slate-600' 
                    : 'opacity-50 cursor-not-allowed text-slate-500'
                }`}
            >
                {loading === downloadType ? t.generating : <><Download className="w-3 h-3" /> {t.downloadTemplate}</>}
            </button>

            {/* Upload Button Wrapper */}
            {canEdit && (
                <div className="relative">
                    <input 
                        type="file" 
                        accept=".csv"
                        onChange={(e) => handleFileUpload(e, uploadType)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <button
                        className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-medium transition-all bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-900/20`}
                    >
                        <Upload className="w-3 h-3" /> {t.uploadData}
                    </button>
                </div>
            )}
            
            {uploadStatus && uploadStatus.type === uploadType && (
                <div className={`text-[10px] px-2 py-1 rounded border ${uploadStatus.success ? 'bg-emerald-900/20 border-emerald-900/50 text-emerald-400' : 'bg-rose-900/20 border-rose-900/50 text-rose-400'}`}>
                    {uploadStatus.message}
                </div>
            )}
        </div>
        </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto pb-12">
      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Database className="w-6 h-6 text-accent-cyan" />
            {t.title}
            </h2>
            <p className="text-slate-400 mt-2 max-w-2xl">{t.subtitle}</p>
        </div>
        {isMaster && (
            <button 
                onClick={handleDownloadDailyReport}
                disabled={!canDownload}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-lg shadow-emerald-900/20"
            >
                <FileText className="w-4 h-4" /> {t.generateDaily}
            </button>
        )}
      </div>

      {!canDownload && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-lg mb-8 flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-full"><AlertCircle className="w-4 h-4" /></div>
          <p className="text-sm">{t.noPermission}</p>
        </div>
      )}

      {/* Cards Grid - Filtered by Role */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {isProcurement && (
            <DataCard 
              title={t.materialsPrice}
              type="price"
              desc={t.materialsDesc}
              icon={<TrendingUp className="w-6 h-6" />}
            />
        )}
        {isMaintenance && (
            <DataCard 
              title={t.machineMaint}
              type="maintenance"
              desc={t.machineDesc}
              icon={<FileSpreadsheet className="w-6 h-6" />}
            />
        )}
        {isSales && (
            <DataCard 
              title={t.salesInv}
              type="production" // Internal type for upload logic
              desc={t.salesDesc}
              icon={<History className="w-6 h-6" />}
            />
        )}
      </div>

      {/* Help Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
            <HelpCircle className="w-6 h-6 text-primary-500" />
            <h3 className="text-lg font-semibold text-white">{t.howToTest}</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-slate-400">
          <div className="space-y-3">
            <h4 className="text-slate-200 font-medium flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-primary-500">1</span> {t.step1}</h4>
            <p>{t.step1Desc}</p>
          </div>
          <div className="space-y-3">
            <h4 className="text-slate-200 font-medium flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-primary-500">2</span> {t.step2}</h4>
            <p>{t.step2Desc}</p>
          </div>
          <div className="space-y-3">
            <h4 className="text-slate-200 font-medium flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-primary-500">3</span> {t.step3}</h4>
            <p>{t.step3Desc}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;