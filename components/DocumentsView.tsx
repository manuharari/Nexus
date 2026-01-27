
import React, { useState, useEffect } from 'react';
import { FileText, Download, Trash2, Upload, File, FileCode, Presentation, Loader2 } from 'lucide-react';
import { Language, DocumentResource } from '../types';
import { getTranslation } from '../services/i18nService';
import { dataService } from '../services/dataService';
import { authService } from '../services/authService';

interface DocumentsViewProps {
  lang?: Language;
}

const DocumentsView: React.FC<DocumentsViewProps> = ({ lang = 'en' }) => {
  const t = getTranslation(lang as Language).documents;
  const [docs, setDocs] = useState<DocumentResource[]>([]);
  const [loading, setLoading] = useState(true);
  const canEdit = authService.hasPermission('can_edit_data');

  const refresh = async () => {
      setLoading(true);
      dataService.getDocuments().then(setDocs).finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          await dataService.addDocument({
              title: file.name,
              category: 'Report',
              fileType: 'PDF',
              size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
          });
          await refresh();
      }
  };

  const handleDelete = async (id: string) => {
      await dataService.deleteDocument(id);
      await refresh();
  };

  const getIcon = (type: string) => {
      switch(type) {
          case 'PPT': return <Presentation className="w-8 h-8 text-orange-500" />;
          case 'PDF': return <FileText className="w-8 h-8 text-red-500" />;
          default: return <File className="w-8 h-8 text-blue-500" />;
      }
  };

  if (loading && docs.length === 0) return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="flex flex-col h-full gap-6">
        <div className="flex justify-between items-end">
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <FileCode className="w-6 h-6 text-primary-500" /> {t.title}
                </h2>
                <p className="text-slate-400 mt-1">{t.subtitle}</p>
            </div>
            
            {canEdit && (
                <div className="relative">
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleUpload} />
                    <button className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm shadow-lg shadow-primary-900/20">
                        <Upload className="w-4 h-4" /> {t.upload}
                    </button>
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {docs.map(doc => (
                <div key={doc.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-primary-500/50 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                            {getIcon(doc.fileType)}
                        </div>
                        {canEdit && (
                            <button onClick={() => handleDelete(doc.id)} className="text-slate-600 hover:text-rose-500 transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <h3 className="text-white font-semibold truncate mb-1">{doc.title}</h3>
                    <div className="text-xs text-slate-500 flex justify-between mb-4">
                        <span>{doc.category}</span>
                        <span>{doc.size}</span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                        <span className="text-[10px] text-slate-500">{doc.uploadDate}</span>
                        <button className="text-primary-400 hover:text-white text-xs flex items-center gap-1">
                            <Download className="w-3 h-3" /> {t.download}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

export default DocumentsView;
