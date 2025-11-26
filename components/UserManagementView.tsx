
import React, { useState, useEffect } from 'react';
import { Users, Edit, UserPlus, Shield, Check, X, RefreshCw, Save, FileText, AlertTriangle, Search } from 'lucide-react';
import { authService } from '../services/authService';
import { User, PermissionSet, UserRole, AuditLogEntry, Language } from '../types';
import { DEFAULT_PERMISSIONS } from '../constants';

interface UserManagementViewProps {
    lang?: Language;
}

const UserManagementView: React.FC<UserManagementViewProps> = ({ lang = 'en' }) => {
  // Simple inline translations for admin panel as it is less visible
  const t = {
      en: { users: "Users", securityLog: "Security Audit Log", directory: "User Directory", newUser: "New", fullName: "Full Name", email: "Email", role: "Role", status: "Status", permissions: "Permissions", save: "Save Changes", edit: "Edit User", resetPass: "Reset Password" },
      es: { users: "Usuarios", securityLog: "Bitácora de Seguridad", directory: "Directorio", newUser: "Nuevo", fullName: "Nombre Completo", email: "Correo", role: "Rol", status: "Estado", permissions: "Permisos", save: "Guardar Cambios", edit: "Editar Usuario", resetPass: "Restablecer Contraseña" }
  }[lang];

  const [viewMode, setViewMode] = useState<'users' | 'audit'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setUsers(authService.getAllUsers());
    setAuditLogs(authService.getAuditLog());
  };

  const handleCreateUser = () => {
    const newUser = authService.addUser({
      name: 'New User',
      role: 'admin',
      permissions: { ...DEFAULT_PERMISSIONS }
    });
    loadData();
    setSelectedUser(newUser);
    setIsEditing(true);
  };

  const handleSaveUser = () => {
    if (selectedUser) {
      authService.updateUser(selectedUser);
      loadData();
      setIsEditing(false);
    }
  };

  const handleResetPassword = (id: string) => {
    if (confirm('Reset password to "password123"?')) {
      authService.resetPassword(id);
      alert('Password reset.');
      loadData();
    }
  };

  const togglePermission = (key: keyof PermissionSet) => {
    if (!selectedUser) return;
    setSelectedUser({
      ...selectedUser,
      permissions: {
        ...selectedUser.permissions,
        [key]: !selectedUser.permissions[key]
      }
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* View Switcher */}
        <div className="flex gap-4 mb-6">
            <button 
                onClick={() => setViewMode('users')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm transition-all ${viewMode === 'users' ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
                <Users className="w-4 h-4" /> {t.users}
            </button>
            <button 
                onClick={() => { setViewMode('audit'); loadData(); }}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm transition-all ${viewMode === 'audit' ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
                <Shield className="w-4 h-4" /> {t.securityLog}
            </button>
        </div>

        {viewMode === 'users' ? (
            <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
            {/* User List */}
            <div className="w-full lg:w-1/3 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                    <Users className="w-4 h-4" /> {t.directory}
                </h3>
                <button 
                    onClick={handleCreateUser}
                    className="text-xs bg-primary-600 hover:bg-primary-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                >
                    <UserPlus className="w-3 h-3" /> {t.newUser}
                </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {users.map(user => (
                    <button
                    key={user.id}
                    onClick={() => { setSelectedUser(user); setIsEditing(false); }}
                    className={`w-full p-3 rounded-lg text-left border transition-all ${
                        selectedUser?.id === user.id
                        ? 'bg-slate-800 border-primary-500/50 ring-1 ring-primary-500/50'
                        : 'bg-slate-900/50 border-transparent hover:bg-slate-800'
                    }`}
                    >
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-slate-200 text-sm">{user.name}</span>
                        <span className={`px-2 py-0.5 text-[10px] rounded uppercase tracking-wider font-bold ${
                        user.role === 'master_admin' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-slate-700 text-slate-400'
                        }`}>
                        {user.role === 'master_admin' ? 'Master' : user.role}
                        </span>
                    </div>
                    <div className="text-xs text-slate-500 truncate">{user.email}</div>
                    </button>
                ))}
                </div>
            </div>

            {/* User Editor */}
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col overflow-y-auto">
                {selectedUser ? (
                <div className="space-y-6">
                    
                    {/* Header & Actions */}
                    <div className="flex justify-between items-start pb-6 border-b border-slate-800">
                    <div>
                        <h2 className="text-xl font-bold text-white">{selectedUser.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-slate-400 font-mono">{selectedUser.id}</span>
                            {selectedUser.lastLogin && (
                                <span className="text-xs bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded">
                                    Last Login: {new Date(selectedUser.lastLogin).toLocaleString()}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {isEditing ? (
                            <button onClick={handleSaveUser} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
                                <Save className="w-4 h-4" /> {t.save}
                            </button>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium border border-slate-700">
                                <Edit className="w-4 h-4" /> {t.edit}
                            </button>
                        )}
                    </div>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t.fullName}</label>
                                <input 
                                disabled={!isEditing}
                                value={selectedUser.name}
                                onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-primary-500 disabled:opacity-50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t.email}</label>
                                <input 
                                disabled={!isEditing}
                                value={selectedUser.email}
                                onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-primary-500 disabled:opacity-50"
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t.role}</label>
                                <select 
                                    disabled={!isEditing || selectedUser.role === 'master_admin'} 
                                    value={selectedUser.role}
                                    onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value as UserRole})}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-primary-500 disabled:opacity-50 capitalize"
                                >
                                    <option value="admin">Admin</option>
                                    <option value="master_admin">Master Admin</option>
                                    <option value="sales">Sales</option>
                                    <option value="manager">Manager</option>
                                    <option value="operator">Operator</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t.status}</label>
                                <select 
                                    disabled={!isEditing}
                                    value={selectedUser.status}
                                    onChange={(e) => setSelectedUser({...selectedUser, status: e.target.value as any})}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-primary-500 disabled:opacity-50"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            {isEditing && (
                                <button 
                                    onClick={() => handleResetPassword(selectedUser.id)}
                                    className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1 mt-2"
                                >
                                    <RefreshCw className="w-3 h-3" /> {t.resetPass}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Permissions Matrix */}
                    <div className="border-t border-slate-800 pt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="w-5 h-5 text-primary-500" />
                            <h3 className="text-lg font-semibold text-slate-200">{t.permissions}</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.keys(selectedUser.permissions).map((key) => {
                                const permKey = key as keyof PermissionSet;
                                const isEnabled = selectedUser.permissions[permKey];
                                const isLocked = !isEditing || selectedUser.role === 'master_admin';

                                return (
                                    <div 
                                        key={permKey} 
                                        onClick={() => !isLocked && togglePermission(permKey)}
                                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                            isLocked ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-800/50'
                                        } ${isEnabled ? 'bg-primary-900/10 border-primary-500/30' : 'bg-slate-950 border-slate-800'}`}
                                    >
                                        <span className="text-xs text-slate-300 font-medium truncate pr-2">
                                            {permKey.replace(/can_/g, '').replace(/view_/g, '').replace(/_/g, ' ').toUpperCase()}
                                        </span>
                                        <div className={`w-8 h-4 rounded-full relative transition-colors shrink-0 ${
                                            isEnabled ? 'bg-primary-500' : 'bg-slate-700'
                                        }`}>
                                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                                                isEnabled ? 'left-4.5' : 'left-0.5'
                                            }`} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
                ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50">
                    <Users className="w-16 h-16 mb-4" />
                    <p>Select a user to manage details</p>
                </div>
                )}
            </div>
            </div>
        ) : (
            /* Audit Log View */
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> System Activity Log
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-950 sticky top-0">
                            <tr>
                                <th className="px-6 py-3">Timestamp</th>
                                <th className="px-6 py-3">Action</th>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Details</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {auditLogs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-3 font-mono text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="px-6 py-3 font-medium text-slate-200">{log.action}</td>
                                    <td className="px-6 py-3 text-slate-400">{log.userName}</td>
                                    <td className="px-6 py-3 text-slate-400 max-w-md truncate" title={log.details}>{log.details}</td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                            log.status === 'SUCCESS' ? 'bg-emerald-900/30 text-emerald-400' :
                                            log.status === 'WARNING' ? 'bg-amber-900/30 text-amber-400' :
                                            'bg-rose-900/30 text-rose-400'
                                        }`}>
                                            {log.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
    </div>
  );
};

export default UserManagementView;
