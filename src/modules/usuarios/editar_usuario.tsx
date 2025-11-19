import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { updateUser, listPermissions } from './service';
import { listGroups } from '../grupos/service';
import { http } from '../../shared/api/client';
import type { UpdateUserPayload, User } from './types';
import type { Group } from '../grupos/types';
import type { Permission } from '../grupos/types';
import PageHeader from '../../shared/components/PageHeader';
import '../../styles/usuarios.css';
import '../../styles/grupos.css';

export default function EditarUsuario() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [grupos, setGrupos] = useState<Group[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [searchPermiso, setSearchPermiso] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Datos del usuario actual
  const [userData, setUserData] = useState<User | null>(null);
  
  // Datos del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    username: '',
    role: 'usuario' as User['role'],
  });

  // Estado de validación
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Permisos y grupos seleccionados
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  // Cargar usuario actual, grupos y permisos
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError('ID de usuario no válido');
        setLoadingUser(false);
        return;
      }

      try {
        setLoadingUser(true);
        
        // Cargar datos en paralelo
        const [userResponse, gruposData, permissionsData] = await Promise.all([
          http.get<User>(`/api/User/user/${id}/`),
          listGroups(),
          listPermissions(),
        ]);

        const user = userResponse.data;
        console.log('📥 Usuario cargado:', user);
        
        setUserData(user);
        setFormData({
          nombre: user.nombre || '',
          email: user.email || '',
          telefono: user.telefono || '',
          username: user.username || '',
          role: user.role || 'usuario',
        });

        // Manejar respuesta de grupos (puede venir como array o como objeto con results)
        const gruposArray = Array.isArray(gruposData) ? gruposData : (gruposData as { results?: Group[] }).results || [];
        setGrupos(gruposArray);
        setPermissions(permissionsData || []);

        // Cargar grupos y permisos asignados
        try {
          const [groupsRes, permsRes] = await Promise.all([
            http.get(`/api/User/${id}/groups`),
            http.get(`/api/User/${id}/permissions`),
          ]);
          
          setSelectedGroups(groupsRes.data?.groups?.map((g: { id: number }) => g.id) || []);
          setSelectedPermissions(permsRes.data?.permissions?.map((p: { id: number }) => p.id) || []);
        } catch (err) {
          console.warn('No se pudieron cargar grupos/permisos asignados:', err);
        }

      } catch (error) {
        console.error('❌ Error cargando datos:', error);
        setError('Error al cargar los datos del usuario');
      } finally {
        setLoadingUser(false);
      }
    };

    fetchData();
  }, [id]);

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'El nombre de usuario es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !id) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📤 Actualizando usuario:', formData);

      // Actualizar datos básicos del usuario
      const updatePayload: UpdateUserPayload = {
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono,
        username: formData.username,
        role: formData.role,
      };

      await updateUser(id, updatePayload);
      console.log('✅ Usuario actualizado');

      // Actualizar grupos
      if (selectedGroups.length > 0) {
        try {
          await http.post(`/api/User/${id}/assign-groups/`, {
            groups: selectedGroups,
          });
          console.log('✅ Grupos asignados');
        } catch (err) {
          console.warn('⚠️ Error asignando grupos:', err);
        }
      }

      // Actualizar permisos
      if (selectedPermissions.length > 0) {
        try {
          await http.post(`/api/User/${id}/assign-permissions/`, {
            permissions: selectedPermissions,
          });
          console.log('✅ Permisos asignados');
        } catch (err) {
          console.warn('⚠️ Error asignando permisos:', err);
        }
      }

      // Redirigir con mensaje de éxito
      alert('✅ Usuario actualizado exitosamente');
      navigate('/app/gestion-usuarios');
      
    } catch (error) {
      console.error('❌ Error actualizando usuario:', error);
      setError('Error al actualizar el usuario. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios en los campos
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Toggle grupo
  const toggleGroup = (groupId: number) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  // Toggle permiso
  const togglePermission = (permissionId: number) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  // Filtrar permisos por búsqueda
  const filteredPermissions = permissions.filter(p =>
    p.name?.toLowerCase().includes(searchPermiso.toLowerCase()) ||
    p.codename?.toLowerCase().includes(searchPermiso.toLowerCase())
  );

  if (loadingUser) {
    return (
      <div className="page usuarios-page">
        <PageHeader
          title="✏️ Editar Usuario"
          showBackButton={true}
          backPath="/app/gestion-usuarios"
        />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando datos del usuario...</p>
        </div>
      </div>
    );
  }

  if (error && !userData) {
    return (
      <div className="page usuarios-page">
        <PageHeader
          title="✏️ Editar Usuario"
          showBackButton={true}
          backPath="/app/gestion-usuarios"
        />
        <div className="error-container">
          <p className="error-message">⚠️ {error}</p>
          <button 
            className="ui-btn ui-btn--primary" 
            onClick={() => navigate('/app/gestion-usuarios')}
          >
            ← Volver a Usuarios
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page usuarios-page">
      <PageHeader
        title={`✏️ Editar Usuario: ${userData?.username || ''}`}
        subtitle="Modifica los datos del usuario, asigna grupos y permisos"
        showBackButton={true}
        backPath="/app/gestion-usuarios"
      />

      <div className="usuarios-container">
        <form onSubmit={handleSubmit} className="create-user-form">
          
          {/* Mensaje de error general */}
          {error && (
            <div className="alert alert-error">
              ⚠️ {error}
            </div>
          )}

          {/* Información Básica */}
          <div className="form-section">
            <h3 className="section-title">📋 Información Básica</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">👤</span>
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className={`form-input ${errors.nombre ? 'input-error' : ''}`}
                  placeholder="Ej: Juan Pérez"
                />
                {errors.nombre && <span className="error-text">{errors.nombre}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">🔑</span>
                  Nombre de Usuario *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`form-input ${errors.username ? 'input-error' : ''}`}
                  placeholder="Ej: jperez"
                />
                {errors.username && <span className="error-text">{errors.username}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">📧</span>
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input ${errors.email ? 'input-error' : ''}`}
                  placeholder="usuario@ejemplo.com"
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">📱</span>
                  Teléfono
                </label>
                <input
                  type="text"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="+591 70123456"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">🔐</span>
                  Rol *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="usuario">👤 Usuario</option>
                  <option value="contador">💰 Contador</option>
                  <option value="gerente">💼 Gerente</option>
                  <option value="administrador">👔 Administrador</option>
                  <option value="superadmin">🌟 Superadmin</option>
                </select>
              </div>
            </div>
          </div>

          {/* Asignar Grupos */}
          <div className="form-section">
            <h3 className="section-title">👥 Asignar Grupos (HU6)</h3>
            <p className="section-description">
              Selecciona los grupos a los que pertenecerá el usuario. Los grupos definen conjuntos de permisos.
            </p>
            
            {grupos.length === 0 ? (
              <div className="empty-state">
                <p>No hay grupos disponibles</p>
                <button
                  type="button"
                  className="ui-btn ui-btn--ghost"
                  onClick={() => navigate('/app/grupos')}
                >
                  + Crear Grupo
                </button>
              </div>
            ) : (
              <div className="groups-grid">
                {grupos.map(group => (
                  <div
                    key={group.id}
                    className={`group-card ${selectedGroups.includes(group.id) ? 'selected' : ''}`}
                    onClick={() => toggleGroup(group.id)}
                  >
                    <div className="group-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedGroups.includes(group.id)}
                        onChange={() => toggleGroup(group.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="group-info">
                      <h4 className="group-name">{group.nombre}</h4>
                      {group.permisos && (
                        <span className="group-perms-count">
                          {group.permisos.length} permisos
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Asignar Permisos */}
          <div className="form-section">
            <h3 className="section-title">🔒 Asignar Permisos Individuales (HU8)</h3>
            <p className="section-description">
              Selecciona permisos específicos para el usuario. Estos se suman a los permisos de los grupos.
            </p>
            
            <div className="search-box">
              <input
                type="text"
                placeholder="🔍 Buscar permisos..."
                value={searchPermiso}
                onChange={(e) => setSearchPermiso(e.target.value)}
                className="search-input"
              />
            </div>

            {filteredPermissions.length === 0 ? (
              <div className="empty-state">
                <p>No se encontraron permisos</p>
              </div>
            ) : (
              <div className="permissions-grid">
                {filteredPermissions.map(permission => (
                  <div
                    key={permission.id}
                    className={`permission-card ${selectedPermissions.includes(permission.id) ? 'selected' : ''}`}
                    onClick={() => togglePermission(permission.id)}
                  >
                    <div className="permission-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={() => togglePermission(permission.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="permission-info">
                      <h4 className="permission-name">{permission.name}</h4>
                      <span className="permission-codename">{permission.codename}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="form-actions">
            <button
              type="submit"
              className="ui-btn ui-btn--primary"
              disabled={loading}
            >
              {loading ? '💾 Guardando...' : '💾 Guardar Cambios'}
            </button>
            <button
              type="button"
              className="ui-btn ui-btn--ghost"
              onClick={() => navigate('/app/gestion-usuarios')}
              disabled={loading}
            >
              ← Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
