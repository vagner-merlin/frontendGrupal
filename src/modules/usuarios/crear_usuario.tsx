import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser, listPermissions } from './service';
import { listGroups } from '../grupos/service';
import type { CreateUserPayload } from './types';
import type { Group } from '../grupos/types';
import type { Permission } from '../grupos/types';
import PageHeader from '../../shared/components/PageHeader';
import '../../styles/usuarios.css';
import '../../styles/grupos.css';

export default function CrearUsuario() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [grupos, setGrupos] = useState<Group[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [searchPermiso, setSearchPermiso] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<{
    username: string;
    email: string;
    nombre: string;
    grupos: number;
    permisos: number;
  } | null>(null);
  
  // Datos del formulario
  const [formData, setFormData] = useState<CreateUserPayload>({
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: '',
    empresa_id: 0,
    imagen_url: '',
  });

  // Estado de validación
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Permisos y grupos seleccionados
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  // Cargar grupos y permisos
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("🔄 Cargando grupos y permisos...");
        const [gruposData, permissionsData] = await Promise.all([
          listGroups(),
          listPermissions()
        ]);
        console.log("✅ Grupos cargados:", gruposData?.length || 0, gruposData);
        console.log("✅ Permisos cargados:", permissionsData?.length || 0);
        setGrupos(gruposData || []);
        setPermissions(permissionsData || []);
      } catch (error) {
        console.error('❌ Error cargando datos:', error);
        // Asegurar que los arrays estén vacíos pero sin fallar
        setGrupos([]);
        setPermissions([]);
      }
    };
    fetchData();
  }, []);

  // Obtener empresa_id del localStorage
  useEffect(() => {
    try {
      const tenantId = localStorage.getItem('auth.tenant_id');
      if (tenantId) {
        setFormData(prev => ({ ...prev, empresa_id: parseInt(tenantId) }));
      }
    } catch (error) {
      console.error('Error obteniendo empresa_id:', error);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleGroupToggle = (groupId: number) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handlePermissionToggle = (permissionId: number) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido';
    }
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'El nombre es requerido';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'El apellido es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // HU5: Crear usuario
      console.log('📤 Creando usuario...');
      const response = await createUser(formData);
      console.log('✅ Respuesta del backend:', response);
      
      // Extraer el ID del usuario creado
      const userId = response.id;
      console.log('🆔 ID del usuario creado:', userId);

      // HU6 y HU8: Asignar grupos y permisos si se seleccionaron
      if (userId && (selectedGroups.length > 0 || selectedPermissions.length > 0)) {
        console.log('📤 Asignando grupos y permisos...');
        const { updateUser } = await import('./service');
        
        try {
          await updateUser(userId, {
            username: formData.username,
            email: formData.email,
            first_name: formData.first_name,
            last_name: formData.last_name,
            groups: selectedGroups,
            user_permissions: selectedPermissions,
          });
          console.log('✅ Grupos y permisos asignados correctamente');
        } catch (updateError) {
          console.warn('⚠️ Error al asignar grupos/permisos (usuario ya creado):', updateError);
          // No lanzar error, el usuario ya fue creado exitosamente
        }
      }

      // Mostrar mensaje de éxito con estilo
      setSuccessData({
        username: formData.username,
        email: formData.email,
        nombre: `${formData.first_name} ${formData.last_name}`,
        grupos: selectedGroups.length,
        permisos: selectedPermissions.length,
      });
      setShowSuccessModal(true);
      
      // Redirigir después de 3 segundos
      setTimeout(() => {
        navigate('/app/usuarios');
      }, 3000);
    } catch (error) {
      console.error('❌ Error completo:', error);
      const err = error as { 
        response?: { 
          data?: Record<string, unknown>;
          status?: number;
          statusText?: string;
        };
        message?: string;
      };
      
      let errorMessage = '❌ Error al crear usuario';
      
      if (err.response) {
        console.error('📛 Respuesta del servidor:', err.response.data);
        console.error('📛 Status:', err.response.status);
        
        // Intentar extraer mensaje específico del backend
        if (err.response.data) {
          const data = err.response.data as Record<string, unknown>;
          if (typeof data === 'string') {
            errorMessage = data;
          } else if (typeof data.message === 'string') {
            errorMessage = data.message;
          } else if (typeof data.error === 'string') {
            errorMessage = data.error;
          } else if (typeof data.detail === 'string') {
            errorMessage = data.detail;
          } else {
            // Mostrar todos los errores de campo
            const errors = Object.entries(data)
              .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : String(msgs)}`)
              .join('\n');
            if (errors) errorMessage = '❌ Errores de validación:\n\n' + errors;
          }
        }
        
        errorMessage += `\n\nStatus: ${err.response.status} ${err.response.statusText || ''}`;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const permissionsFiltradas = permissions.filter(p =>
    searchPermiso === '' ||
    p.name.toLowerCase().includes(searchPermiso.toLowerCase()) ||
    p.codename.toLowerCase().includes(searchPermiso.toLowerCase())
  );

  return (
    <div className="page usuarios-page">
      <PageHeader
        title="➕ Crear Usuario"
        subtitle="HU5: Crear nuevo usuario | HU6: Asignar roles | HU8: Asignar permisos"
        showBackButton={true}
        backPath="/app/gestion-usuarios"
      />

      <div className="usuarios-container">
        <form onSubmit={handleSubmit} className="create-user-form">
          {/* Información Básica */}
          <div className="form-section">
            <h3 className="section-title">📋 Información Básica (HU5)</h3>
            
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="username">Usuario *</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="nombre_usuario"
                  required
                />
                {errors.username && <span className="error-text">{errors.username}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="usuario@ejemplo.com"
                  required
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="first_name">Nombre *</label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  placeholder="Juan"
                  required
                />
                {errors.first_name && <span className="error-text">{errors.first_name}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="last_name">Apellido *</label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  placeholder="Pérez"
                  required
                />
                {errors.last_name && <span className="error-text">{errors.last_name}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="password">Contraseña *</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                />
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="imagen_url">URL Imagen (opcional)</label>
                <input
                  id="imagen_url"
                  name="imagen_url"
                  type="url"
                  value={formData.imagen_url}
                  onChange={handleInputChange}
                  placeholder="https://ejemplo.com/avatar.jpg"
                />
              </div>
            </div>
          </div>

          {/* Asignar Grupos (HU6) */}
          <div className="form-section">
            <h3 className="section-title">👥 Asignar Grupos/Roles (HU6)</h3>
            <p className="section-description">
              Selecciona los grupos a los que pertenecerá el usuario
            </p>
            
            {grupos.length === 0 ? (
              <p className="empty-message">No hay grupos disponibles. <a href="/app/grupos">Crear grupo</a></p>
            ) : (
              <div className="grupos-grid">
                {grupos.map(grupo => (
                  <label key={grupo.id} className="grupo-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedGroups.includes(grupo.id)}
                      onChange={() => handleGroupToggle(grupo.id)}
                    />
                    <span className="grupo-name">{grupo.nombre}</span>
                    <span className="grupo-permisos">({grupo.permisos?.length || 0} permisos)</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Asignar Permisos (HU8) */}
          <div className="form-section">
            <h3 className="section-title">🔐 Asignar Permisos Individuales (HU8)</h3>
            <p className="section-description">
              Permisos adicionales que se asignarán directamente al usuario (además de los permisos de sus grupos)
            </p>

            <div className="permisos-search">
              <input
                type="text"
                placeholder="🔍 Buscar permisos..."
                value={searchPermiso}
                onChange={(e) => setSearchPermiso(e.target.value)}
              />
              <span className="search-count">
                {permissionsFiltradas.length} de {permissions.length}
              </span>
            </div>

            <div className="permisos-container">
              {permissionsFiltradas.map(permiso => (
                <label key={permiso.id} className="permiso-item">
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(permiso.id)}
                    onChange={() => handlePermissionToggle(permiso.id)}
                  />
                  <div className="permiso-info">
                    <span className="permiso-name">{permiso.name}</span>
                    <span className="permiso-codename">{permiso.codename}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/app/gestion-usuarios')}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? '⏳ Creando...' : '✅ Crear Usuario'}
            </button>
          </div>

          {/* Resumen */}
          {(selectedGroups.length > 0 || selectedPermissions.length > 0) && (
            <div className="summary-box">
              <h4>📊 Resumen de asignaciones:</h4>
              <ul>
                <li>✅ <strong>HU5:</strong> Crear usuario con datos básicos</li>
                {selectedGroups.length > 0 && (
                  <li>✅ <strong>HU6:</strong> Asignar {selectedGroups.length} grupo(s)</li>
                )}
                {selectedPermissions.length > 0 && (
                  <li>✅ <strong>HU8:</strong> Asignar {selectedPermissions.length} permiso(s) individual(es)</li>
                )}
              </ul>
            </div>
          )}
        </form>
      </div>

      {/* Modal de éxito */}
      {showSuccessModal && successData && (
        <div className="modal-overlay" onClick={() => {
          setShowSuccessModal(false);
          navigate('/app/usuarios');
        }}>
          <div className="success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="success-icon">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="36" fill="#10B981" opacity="0.2"/>
                <circle cx="40" cy="40" r="32" fill="#10B981"/>
                <path d="M25 40L35 50L55 30" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            
            <h2 className="success-title">¡Usuario creado exitosamente!</h2>
            
            <div className="success-details">
              <div className="detail-row">
                <span className="detail-icon">👤</span>
                <div className="detail-content">
                  <span className="detail-label">Usuario</span>
                  <span className="detail-value">{successData.username}</span>
                </div>
              </div>
              
              <div className="detail-row">
                <span className="detail-icon">📧</span>
                <div className="detail-content">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{successData.email}</span>
                </div>
              </div>
              
              <div className="detail-row">
                <span className="detail-icon">👨‍💼</span>
                <div className="detail-content">
                  <span className="detail-label">Nombre completo</span>
                  <span className="detail-value">{successData.nombre}</span>
                </div>
              </div>
              
              {(successData.grupos > 0 || successData.permisos > 0) && (
                <>
                  <div className="divider"></div>
                  
                  {successData.grupos > 0 && (
                    <div className="detail-row">
                      <span className="detail-icon">🎯</span>
                      <div className="detail-content">
                        <span className="detail-label">Grupos asignados</span>
                        <span className="detail-value">{successData.grupos}</span>
                      </div>
                    </div>
                  )}
                  
                  {successData.permisos > 0 && (
                    <div className="detail-row">
                      <span className="detail-icon">🔐</span>
                      <div className="detail-content">
                        <span className="detail-label">Permisos asignados</span>
                        <span className="detail-value">{successData.permisos}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            
            <button 
              className="btn-close-modal"
              onClick={() => {
                setShowSuccessModal(false);
                navigate('/app/usuarios');
              }}
            >
              Aceptar
            </button>
            
            <p className="auto-redirect">Redirigiendo automáticamente en 3 segundos...</p>
          </div>
        </div>
      )}
    </div>
  );
}
