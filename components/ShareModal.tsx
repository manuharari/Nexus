import React, { useState } from 'react';
import { X, Copy, Check, Mail, Users, Link as LinkIcon } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../services/i18nService';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, lang = 'en' }) => {
  const t = getTranslation(lang as Language).share;
  const [emails, setEmails] = useState('');
  const [role, setRole] = useState('viewer');
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

  if (!isOpen) return null;

  const generateLink = () => {
      // Simulate a unique workspace link
      const tenantId = Math.random().toString(36).substr(2, 9);
      return `https://nexus-ai.app/workspace/${tenantId}`;
  };

  const handleCopy = () => {
      navigator.clipboard.writeText(generateLink());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = (e: React.FormEvent) => {
      e.preventDefault();
      if (emails.trim()) {
          setSent(true);
          setTimeout(() => {
              setSent(false);
              setEmails('');
              onClose();
          }, 2000);
      }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-500/10 rounded-lg text-primary-500">
                      <Users className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-white">{t.shareWorkspace}</h2>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
              </button>
          </div>

          <div className="p-6 space-y-6">
              
              {/* Invite Form */}
              <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">{t.inviteTeam}</label>
                      <p className="text-sm text-slate-500 mb-3">{t.inviteDesc}</p>
                      
                      <div className="flex gap-2">
                          <div className="flex-1 relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                              <input 
                                  type="text" 
                                  value={emails}
                                  onChange={(e) => setEmails(e.target.value)}
                                  placeholder={t.emailPlaceholder}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                              />
                          </div>
                          <select 
                              value={role}
                              onChange={(e) => setRole(e.target.value)}
                              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-300 focus:border-primary-500 outline-none"
                          >
                              <option value="viewer">{t.viewer}</option>
                              <option value="editor">{t.editor}</option>
                              <option value="admin">{t.admin}</option>
                          </select>
                      </div>
                  </div>
                  
                  <button 
                      type="submit"
                      disabled={!emails.trim() || sent}
                      className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                          sent 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-primary-600 hover:bg-primary-500 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                  >
                      {sent ? <Check className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                      {sent ? 'Invites Sent!' : t.sendInvite}
                  </button>
              </form>

              <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-slate-800"></div>
                  </div>
                  <div className="relative flex justify-center">
                      <span className="bg-slate-900 px-2 text-xs text-slate-500 uppercase">OR</span>
                  </div>
              </div>

              {/* Copy Link Section */}
              <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">{t.accessLink}</label>
                  <div className="flex gap-2">
                      <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-400 flex items-center gap-2 select-all">
                          <LinkIcon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{generateLink()}</span>
                      </div>
                      <button 
                          onClick={handleCopy}
                          className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 border ${
                              copied 
                              ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-400' 
                              : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white'
                          }`}
                      >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copied ? t.linkCopied : t.copyLink}
                      </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                      <Users className="w-3 h-3" /> Anyone with this link can view this workspace.
                  </p>
              </div>

          </div>
      </div>
    </div>
  );
};

export default ShareModal;