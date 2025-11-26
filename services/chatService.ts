
import { ChatMessage, ChatChannel, User } from '../types';
import { MOCK_USERS } from '../constants';

class ChatService {
  private messages: ChatMessage[] = [];
  private listeners: ((messages: ChatMessage[]) => void)[] = [];

  constructor() {
    // Mock initial messages
    this.messages = [
      {
        id: 'm1',
        channel: 'General',
        senderId: 'u-1',
        senderName: 'Master Admin',
        content: 'Welcome to the Nexus AI platform. Please report any system anomalies here.',
        timestamp: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'm2',
        channel: 'Maintenance',
        senderId: 'u-2',
        senderName: 'Jane Maintenance',
        content: 'Hydraulic Press B is showing vibration spikes again. Scheduling inspection.',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'm3',
        channel: 'Direction',
        senderId: 'u-ceo',
        senderName: 'Elena Director',
        content: 'Q4 strategy meeting starts in 10 minutes. Please review the KPI dashboard.',
        timestamp: new Date(Date.now() - 1800000).toISOString()
      }
    ];
  }

  public getMessages(channel?: ChatChannel, currentUserId?: string, dmTargetId?: string): ChatMessage[] {
    if (channel) {
      return this.messages
        .filter(m => m.channel === channel)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } else if (currentUserId && dmTargetId) {
      // Return DM history between two users
      return this.messages
        .filter(m => 
          !m.channel && 
          ((m.senderId === currentUserId && m.recipientId === dmTargetId) || 
           (m.senderId === dmTargetId && m.recipientId === currentUserId))
        )
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }
    return [];
  }

  public sendMessage(sender: User, content: string, channel?: ChatChannel, recipientId?: string) {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      channel,
      recipientId,
      senderId: sender.id,
      senderName: sender.name,
      content,
      timestamp: new Date().toISOString()
    };
    
    this.messages.push(newMessage);
    this.notifyListeners();
  }

  public getUsersForDM(currentUserId: string): User[] {
    return MOCK_USERS.filter(u => u.id !== currentUserId);
  }

  public subscribe(listener: (messages: ChatMessage[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l(this.messages));
  }
}

export const chatService = new ChatService();
