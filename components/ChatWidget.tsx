
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Minimize2, Users, User } from 'lucide-react';
import { ChatChannel, ChatMessage, Language, User as UserType } from '../types';
import { chatService } from '../services/chatService';
import { authService } from '../services/authService';
import { getTranslation } from '../services/i18nService';

interface ChatWidgetProps {
    lang?: Language;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ lang = 'en' }) => {
  const t = getTranslation(lang as Language).chat;
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'channels' | 'dm'>('channels');
  const [currentChannel, setCurrentChannel] = useState<ChatChannel>('General');
  const [dmTarget, setDmTarget] = useState<UserType | null>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const currentUser = authService.getCurrentUser();
  const availableUsers = currentUser ? chatService.getUsersForDM(currentUser.id) : [];

  // Determine if user can see "Direction" channel
  const canSeeDirection = currentUser?.role === 'c_level' || currentUser?.role === 'master_admin' || currentUser?.role === 'manager';
  
  const channels: ChatChannel[] = ['General', 'Maintenance', 'Operations'];
  if (canSeeDirection) channels.push('Direction');

  useEffect(() => {
    const updateMessages = () => {
      if (activeTab === 'channels') {
        setMessages(chatService.getMessages(currentChannel));
      } else if (activeTab === 'dm' && dmTarget && currentUser) {
        setMessages(chatService.getMessages(undefined, currentUser.id, dmTarget.id));
      } else {
        setMessages([]);
      }
    };

    updateMessages();
    const unsubscribe = chatService.subscribe(() => updateMessages());
    
    return () => unsubscribe();
  }, [currentChannel, activeTab, dmTarget, currentUser]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    if (activeTab === 'channels') {
      chatService.sendMessage(currentUser, newMessage, currentChannel);
    } else if (activeTab === 'dm' && dmTarget) {
      chatService.sendMessage(currentUser, newMessage, undefined, dmTarget.id);
    }
    setNewMessage('');
  };

  if (!currentUser) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {isOpen ? (
        <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-80 sm:w-96 h-[500px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10">
          {/* Header */}
          <div className="bg-slate-950 p-3 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <h3 className="font-semibold text-white text-sm">{t.teamChat}</h3>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                    <Minimize2 className="w-4 h-4" />
                </button>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex border-b border-slate-800">
             <button 
               onClick={() => setActiveTab('channels')} 
               className={`flex-1 py-2 text-xs font-bold uppercase ${activeTab === 'channels' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-slate-500 hover:text-white'}`}
             >
               {t.channels}
             </button>
             <button 
               onClick={() => setActiveTab('dm')} 
               className={`flex-1 py-2 text-xs font-bold uppercase ${activeTab === 'dm' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-slate-500 hover:text-white'}`}
             >
               {t.directMessages}
             </button>
          </div>

          {/* Sub-Navigation (Channels or DM List) */}
          <div className="bg-slate-900 border-b border-slate-800 p-2">
             {activeTab === 'channels' ? (
                <div className="flex gap-2 overflow-x-auto">
                    {channels.map(channel => (
                    <button
                        key={channel}
                        onClick={() => setCurrentChannel(channel)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                        currentChannel === channel 
                            ? channel === 'Direction' ? 'bg-indigo-600 text-white' : 'bg-primary-600 text-white' 
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                    >
                        {channel === 'Direction' ? t.direction : channel}
                    </button>
                    ))}
                </div>
             ) : (
               // DM User Selector
               !dmTarget ? (
                 <div className="text-xs text-slate-400 p-2 italic text-center">{t.selectUser}</div>
               ) : (
                 <div className="flex items-center justify-between bg-slate-800 rounded px-3 py-1">
                    <span className="text-xs text-white font-medium flex items-center gap-2">
                       <User className="w-3 h-3" /> {dmTarget.name}
                    </span>
                    <button onClick={() => setDmTarget(null)} className="text-slate-400 hover:text-white"><X className="w-3 h-3" /></button>
                 </div>
               )
             )}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col bg-slate-900/50">
             {activeTab === 'dm' && !dmTarget ? (
               <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {availableUsers.map(u => (
                    <button 
                      key={u.id} 
                      onClick={() => setDmTarget(u)}
                      className="w-full text-left p-2 hover:bg-slate-800 rounded flex items-center gap-3 group"
                    >
                        <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold text-slate-300 group-hover:bg-slate-600">
                           {u.name.charAt(0)}
                        </div>
                        <div>
                           <div className="text-sm text-slate-200 group-hover:text-white font-medium">{u.name}</div>
                           <div className="text-[10px] text-slate-500 uppercase">{u.role}</div>
                        </div>
                    </button>
                  ))}
               </div>
             ) : (
                // Chat History
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center text-slate-500 text-xs mt-10">{t.noMessages}</div>
                    ) : (
                        messages.map(msg => {
                            const isMe = msg.senderId === currentUser.id;
                            return (
                                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isMe ? 'bg-primary-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                            {msg.senderName.charAt(0)}
                                        </div>
                                        <div className={`p-2 rounded-lg text-sm ${
                                            isMe 
                                            ? 'bg-primary-600/90 text-white rounded-tr-none' 
                                            : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'
                                        }`}>
                                            <p>{msg.content}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-slate-500 mt-1 px-9">
                                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {msg.senderName}
                                    </span>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>
             )}
          </div>

          {/* Input Area */}
          {(activeTab === 'channels' || (activeTab === 'dm' && dmTarget)) && (
            <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
                <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t.messagePlaceholder + '...'}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                />
                <button 
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                <Send className="w-4 h-4" />
                </button>
            </form>
          )}
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-primary-600 hover:bg-primary-500 text-white p-4 rounded-full shadow-lg shadow-primary-900/50 transition-transform hover:scale-105 flex items-center justify-center"
        >
          <MessageSquare className="w-6 h-6" />
          {/* Notification Dot (Mock) */}
          <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full border-2 border-slate-950"></span>
        </button>
      )}
    </div>
  );
};

export default ChatWidget;
