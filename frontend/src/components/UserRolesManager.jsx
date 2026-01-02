import React, { useState, useEffect } from 'react';
import { Users, Shield, ShieldCheck, Palette, UserCog, Search, Check, X, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

const ROLES = {
  superadmin: { label: 'Super Admin', icon: ShieldCheck, color: 'text-red-500', bgColor: 'bg-red-100' },
  admin: { label: 'Administrador', icon: Shield, color: 'text-orange-500', bgColor: 'bg-orange-100' },
  staff: { label: 'Staff', icon: UserCog, color: 'text-blue-500', bgColor: 'bg-blue-100' },
  designer: { label: 'Diseñador', icon: Palette, color: 'text-purple-500', bgColor: 'bg-purple-100' },
  user: { label: 'Usuario', icon: Users, color: 'text-gray-500', bgColor: 'bg-gray-100' }
};

const ROLE_PERMISSIONS = {
  superadmin: ['Todo: Control total del sistema'],
  admin: ['Gestión de pedidos', 'Gestión de reservas', 'Editor web', 'Imágenes', 'Configuración'],
  staff: ['Gestión de pedidos', 'Gestión de reservas', 'Gestión UGC'],
  designer: ['Editor web', 'Gestión de imágenes'],
  user: ['Acceso básico de usuario']
};

export const UserRolesManager = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const API_URL = process.env.REACT_APP_BACKEND_URL || '';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role: newRole })
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map(u => u.user_id === userId ? updatedUser : u));
        setSuccess(`Rol actualizado a ${ROLES[newRole]?.label}`);
        setEditingUser(null);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const err = await response.json();
        setError(err.detail || 'Error al actualizar rol');
      }
    } catch (err) {
      setError('Error de conexión');
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSuperAdmin = currentUser?.role === 'superadmin';

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Gestión de Usuarios</h2>
          <p className="text-gray-400 text-sm mt-1">Asigna roles y permisos a los usuarios del sistema</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Users className="w-4 h-4" />
          <span>{users.length} usuarios</span>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-200">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-900/50 border border-green-500 rounded-lg p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-green-200">{success}</span>
        </div>
      )}

      {/* Role Legend */}
      <div className="bg-neutral-800/50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Niveles de Acceso</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(ROLES).map(([key, role]) => {
            const Icon = role.icon;
            return (
              <div key={key} className={`${role.bgColor} rounded-lg p-3`}>
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${role.color}`} />
                  <span className={`text-sm font-medium ${role.color}`}>{role.label}</span>
                </div>
                <ul className="mt-2 text-xs text-gray-600 space-y-0.5">
                  {ROLE_PERMISSIONS[key].slice(0, 2).map((perm, i) => (
                    <li key={i}>• {perm}</li>
                  ))}
                  {ROLE_PERMISSIONS[key].length > 2 && (
                    <li className="text-gray-400">+{ROLE_PERMISSIONS[key].length - 2} más</li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Users Table */}
      <div className="bg-neutral-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Usuario</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Rol Actual</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Fecha Registro</th>
              {isSuperAdmin && (
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-700">
            {filteredUsers.map((user) => {
              const roleInfo = ROLES[user.role] || ROLES.user;
              const Icon = roleInfo.icon;
              const isEditing = editingUser === user.user_id;
              const isSuperAdminUser = user.role === 'superadmin';

              return (
                <tr key={user.user_id} className="hover:bg-neutral-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.picture ? (
                        <img src={user.picture} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                          <span className="text-amber-500 text-sm font-medium">
                            {user.name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                      <span className="text-white font-medium">{user.name || 'Sin nombre'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{user.email}</td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user.user_id, e.target.value)}
                        className="bg-neutral-700 border border-neutral-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-amber-500"
                      >
                        <option value="user">Usuario</option>
                        <option value="designer">Diseñador</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Administrador</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleInfo.bgColor} ${roleInfo.color}`}>
                        <Icon className="w-3 h-3" />
                        {roleInfo.label}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('es-PY') : '-'}
                  </td>
                  {isSuperAdmin && (
                    <td className="px-4 py-3 text-right">
                      {!isSuperAdminUser && (
                        isEditing ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingUser(null)}
                            className="text-gray-400 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingUser(user.user_id)}
                            className="text-amber-500 hover:text-amber-400"
                          >
                            Editar Rol
                          </Button>
                        )
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No se encontraron usuarios
          </div>
        )}
      </div>
    </div>
  );
};

export default UserRolesManager;
