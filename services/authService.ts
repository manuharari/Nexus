
import { User, PermissionSet, AuditLogEntry } from '../types';
import { MOCK_USERS, DEFAULT_PERMISSIONS } from '../constants';
import { securityService } from './securityService';

class AuthService {
  private users: User[] = [...MOCK_USERS];
  private currentUser: User | null = null;
  private auditLog: AuditLogEntry[] = [];
  private loginAttempts: Record<string, number> = {};

  constructor() {
    // Initialize audit log with system start
    this.logEvent('SYSTEM', 'SYSTEM', 'SYSTEM_STARTUP', 'Security services initialized.', 'SUCCESS');
  }

  // --- Session Management ---

  public login(email: string, plainPassword: string): User | null {
    // Rate limiting / Lockout check
    if (this.loginAttempts[email] >= 5) {
      this.logEvent('SYSTEM', 'SYSTEM', 'LOGIN_LOCKED', `Account locked due to excessive failures: ${email}`, 'WARNING');
      return null;
    }

    const passwordHash = securityService.hashPassword(plainPassword);
    const user = this.users.find(u => u.email === email && u.passwordHash === passwordHash && u.status === 'active');
    
    if (user) {
      this.currentUser = { ...user, lastLogin: new Date().toISOString() };
      this.loginAttempts[email] = 0; // Reset failures
      
      // Create session token (simulated)
      const sessionToken = securityService.generateSessionToken();
      
      this.logEvent(user.id, user.name, 'LOGIN_SUCCESS', `User logged in via secure session.`, 'SUCCESS');
      return user;
    } else {
      this.loginAttempts[email] = (this.loginAttempts[email] || 0) + 1;
      this.logEvent('UNKNOWN', email, 'LOGIN_FAILURE', `Failed login attempt. Count: ${this.loginAttempts[email]}`, 'FAILURE');
      return null;
    }
  }

  public logout() {
    if (this.currentUser) {
      this.logEvent(this.currentUser.id, this.currentUser.name, 'LOGOUT', 'User session ended.', 'SUCCESS');
    }
    this.currentUser = null;
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public hasPermission(permissionKey: keyof PermissionSet): boolean {
    if (!this.currentUser) return false;
    // Master Admin acts as superuser
    if (this.currentUser.role === 'master_admin') return true;
    return this.currentUser.permissions[permissionKey];
  }

  // --- User Management (Master Admin only) ---
  
  public getAllUsers(): User[] {
    return this.users;
  }

  public addUser(newUser: Partial<User>): User {
    const passwordHash = securityService.hashPassword(newUser.passwordHash || 'user');
    
    const user: User = {
      id: `u-${Date.now()}`,
      name: securityService.sanitizeInput(newUser.name || 'New User'),
      email: securityService.sanitizeInput(newUser.email || ''),
      passwordHash: passwordHash,
      role: newUser.role || 'admin',
      status: 'active',
      permissions: newUser.permissions || { ...DEFAULT_PERMISSIONS }
    };
    
    this.users = [...this.users, user];
    this.logEvent(this.currentUser?.id || 'SYSTEM', this.currentUser?.name || 'SYSTEM', 'USER_CREATED', `Created user: ${user.email}`, 'SUCCESS');
    return user;
  }

  public updateUser(updatedUser: User): void {
    const oldUser = this.users.find(u => u.id === updatedUser.id);
    this.users = this.users.map(u => u.id === updatedUser.id ? updatedUser : u);
    
    // If updating current user, refresh session
    if (this.currentUser && this.currentUser.id === updatedUser.id) {
      this.currentUser = updatedUser;
    }
    
    this.logEvent(this.currentUser?.id || 'SYSTEM', this.currentUser?.name || 'SYSTEM', 'USER_UPDATED', `Updated user: ${updatedUser.email}. Changes: Role=${updatedUser.role !== oldUser?.role}`, 'SUCCESS');
  }

  public resetPassword(userId: string): void {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.passwordHash = securityService.hashPassword('password123'); // Reset to default hashed
      this.updateUser(user);
      this.logEvent(this.currentUser?.id || 'SYSTEM', this.currentUser?.name || 'SYSTEM', 'PASSWORD_RESET', `Reset password for user: ${user.email}`, 'WARNING');
    }
  }

  // --- Audit & Security ---

  public logEvent(userId: string, userName: string, action: string, details: string, status: 'SUCCESS' | 'FAILURE' | 'WARNING') {
    const entry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      action,
      details,
      ipAddress: '192.168.1.X (Internal)', // Mocked
      status
    };
    this.auditLog.unshift(entry); // Add to start
    // Keep log size manageable
    if (this.auditLog.length > 500) this.auditLog.pop();
  }

  public getAuditLog(): AuditLogEntry[] {
    // Only Master Admin should really see this
    return this.auditLog;
  }
}

export const authService = new AuthService();
