// src/modules/grupos/page.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/service";
import { listGroups, listPermissions, createGroup, updateGroup, deleteGroup } from "./service";
import PageHeader from "../../shared/components/PageHeader";
import type { Group, Permission, CreateGroupInput } from "./types";
import "../../styles/theme.css";
import "../../styles/grupos.css";

// Componente de notificación de éxito
const SuccessNotification: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      padding: '20px 30px',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(16, 185, 129, 0.4)',
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      animation: 'slideInRight 0.5s ease-out',
      maxWidth: '400px'
    }}>
      <div style={{ fontSize: '32px', animation: 'bounce 1s ease-in-out' }}>✅</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>¡Éxito!</div>
        <div style={{ fontSize: '14px', opacity: 0.95 }}>{message}</div>
      </div>
      <button onClick={onClose} style={{
        background: 'rgba(255, 255, 255, 0.2)', border: 'none', color: 'white',
        width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer',
        fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.2s'
      }}>×</button>
    </div>
  );
};

// Componente de notificación de error
const ErrorNotification: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      color: 'white',
      padding: '20px 30px',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(239, 68, 68, 0.4)',
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      animation: 'slideInRight 0.5s ease-out',
      maxWidth: '450px'
    }}>
      <div style={{ fontSize: '32px', animation: 'shake 0.5s ease-in-out' }}>❌</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>Error</div>
        <div style={{ fontSize: '14px', opacity: 0.95, lineHeight: '1.4' }}>{message}</div>
      </div>
      <button onClick={onClose} style={{
        background: 'rgba(255, 255, 255, 0.2)', border: 'none', color: 'white',
        width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer',
        fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.2s'
      }}>×</button>
    </div>
  );
};

const GruposPage: React.FC = () => {
  const { user } = useAuth();
  const [grupos, setGrupos] = useState<Group[]>([]);
  const [permisos, setPermisos] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Notificaciones bonitas
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showErrorNotification, setShowErrorNotification] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Estado para crear/editar grupo
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState<CreateGroupInput>({
    nombre: "",
    descripcion: "",
    permisos: [],
    usuarios: []
  });
  
  // Búsqueda de permisos
  const [searchPermiso, setSearchPermiso] = useState("");

  // Verificar permisos del usuario
  const isSuperAdmin = user?.roles?.includes("superadmin");
  const isCompanyAdmin = user?.roles?.includes("admin");

  // Cargar datos iniciales
  useEffect(() => {
    if (isSuperAdmin || isCompanyAdmin) {
      cargarGrupos();
      cargarPermisos();
    }
  }, [isSuperAdmin, isCompanyAdmin]);

  const cargarGrupos = async () => {
    setLoading(true);
    try {
      console.log("🔄 Cargando grupos...");
      const data = await listGroups();
      console.log("✅ Grupos cargados:", data?.length || 0);
      setGrupos(data || []);
    } catch (err) {
      let errorMessage = "Error al cargar grupos";
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        errorMessage = response?.data?.message || errorMessage;
      }
      setErrorMessage(errorMessage);
      setShowErrorNotification(true);
      console.error("❌ Error al cargar grupos:", err);
      setGrupos([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarPermisos = async () => {
    try {
      console.log("🔄 Cargando permisos...");
      const data = await listPermissions();
      console.log("✅ Permisos cargados:", data?.length || 0);
      setPermisos(data || []);
    } catch (err) {
      console.error("❌ Error al cargar permisos:", err);
      setPermisos([]); // Asegurar que sea un array vacío
    }
  };

  const handleOpenModal = (group?: Group) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        nombre: group.nombre || "",
        descripcion: group.descripcion || "",
        permisos: group.permisos || [],
        usuarios: group.usuarios || []
      });
    } else {
      setEditingGroup(null);
      setFormData({ 
        nombre: "", 
        descripcion: "",
        permisos: [],
        usuarios: []
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGroup(null);
    setFormData({ 
      nombre: "", 
      descripcion: "",
      permisos: [],
      usuarios: []
    });
    setSearchPermiso("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("📝 Datos del formulario:", formData);
      
      // Validar que tenga nombre
      if (!formData.nombre || formData.nombre.trim() === "") {
        setErrorMessage("El nombre del grupo es obligatorio");
        setShowErrorNotification(true);
        setLoading(false);
        return;
      }

      // Validar que tenga al menos un permiso
      if (!formData.permisos || formData.permisos.length === 0) {
        setErrorMessage("Debes asignar al menos un permiso al grupo");
        setShowErrorNotification(true);
        setLoading(false);
        return;
      }
      
      if (editingGroup) {
        console.log("🔄 Actualizando grupo...");
        await updateGroup(editingGroup.id, formData);
        setSuccessMessage("¡Grupo actualizado exitosamente!");
        setShowSuccessNotification(true);
      } else {
        console.log("🔄 Creando grupo...");
        await createGroup(formData);
        setSuccessMessage("¡Grupo creado exitosamente!");
        setShowSuccessNotification(true);
      }
      
      await cargarGrupos();
      handleCloseModal();
      
    } catch (err) {
      console.error("❌ Error en handleSubmit:", err);
      let errorMsg = "Error al guardar el grupo";
      
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { 
          response?: { 
            data?: { 
              message?: string; 
              detail?: string;
              error?: string;
              nombre?: string[];
              permisos?: string[];
              non_field_errors?: string[];
            };
            status?: number;
          } 
        }).response;
        
        const data = response?.data;
        const status = response?.status;

        console.log("📍 Respuesta del error:", data);

        // Errores de validación específicos
        if (data?.non_field_errors && Array.isArray(data.non_field_errors)) {
          errorMsg = data.non_field_errors.join(", ");
        } else if (data?.nombre && Array.isArray(data.nombre)) {
          errorMsg = `Error en el nombre: ${data.nombre.join(", ")}`;
        } else if (data?.permisos && Array.isArray(data.permisos)) {
          errorMsg = `Error en permisos: ${data.permisos.join(", ")}`;
        } else if (data?.message) {
          errorMsg = data.message;
        } else if (data?.detail) {
          errorMsg = data.detail;
        } else if (data?.error) {
          errorMsg = data.error;
        } else if (status === 400) {
          errorMsg = "Datos inválidos. Verifica que el nombre del grupo no esté duplicado en tu empresa.";
        } else if (status === 500) {
          errorMsg = "Error del servidor. Por favor, contacta al administrador.";
        } else if (status === 404) {
          errorMsg = "El endpoint de grupos no existe. Verifica la configuración del backend.";
        } else if (status === 403) {
          errorMsg = "No tienes permisos para crear grupos. Solo administradores pueden hacerlo.";
        }
      }
      
      setErrorMessage(errorMsg);
      setShowErrorNotification(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar el grupo "${nombre}"?`)) {
      return;
    }

    setLoading(true);

    try {
      await deleteGroup(id);
      setSuccessMessage("Grupo eliminado exitosamente");
      setShowSuccessNotification(true);
      await cargarGrupos();
    } catch (err) {
      console.error("Error al eliminar:", err);
      setErrorMessage("Error al eliminar el grupo. Por favor, intenta nuevamente.");
      setShowErrorNotification(true);
    } finally {
      setLoading(false);
    }
  };

  const togglePermiso = (permisoId: number) => {
    setFormData(prev => ({
      ...prev,
      permisos: prev.permisos?.includes(permisoId)
        ? prev.permisos.filter(id => id !== permisoId)
        : [...(prev.permisos || []), permisoId]
    }));
  };

  const permisosFiltrados = (permisos || []).filter(p =>
    p?.name?.toLowerCase().includes(searchPermiso.toLowerCase()) ||
    p?.codename?.toLowerCase().includes(searchPermiso.toLowerCase())
  );

  if (!isSuperAdmin && !isCompanyAdmin) {
    return (
      <section className="page grupos-page">
        <PageHeader
          title="⚠️ Acceso Denegado"
          subtitle="No tienes permisos para gestionar grupos"
          showBackButton={true}
          backPath="/app"
        />
        <div className="grupos-alert grupos-alert--warning">
          ⚠️ Solo los administradores pueden acceder a esta página
        </div>
      </section>
    );
  }

  return (
    <section className="page grupos-page">
      {/* Notificaciones */}
      {showSuccessNotification && (
        <SuccessNotification 
          message={successMessage} 
          onClose={() => setShowSuccessNotification(false)} 
        />
      )}
      {showErrorNotification && (
        <ErrorNotification 
          message={errorMessage} 
          onClose={() => setShowErrorNotification(false)} 
        />
      )}

      <PageHeader
        title="🔐 Gestión de Grupos"
        subtitle="Administra grupos de usuarios y sus permisos en el sistema"
        showBackButton={true}
        backPath="/app"
        actions={
          <button 
            className="btn-grupos btn-grupos--create"
            onClick={() => handleOpenModal()}
          >
            ➕ Crear Grupo
          </button>
        }
      />

      {/* Tabla de grupos */}
      <div className="grupos-table-container">
        <table className="grupos-table">
          <thead>
            <tr>
              <th style={{ width: "80px" }}>ID</th>
              <th>Nombre del Grupo</th>
              <th style={{ width: "200px" }}>Permisos</th>
              <th style={{ width: "220px", textAlign: "center" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (!grupos || grupos.length === 0) ? (
              <tr>
                <td colSpan={4}>
                  <div className="grupos-loading">
                    <div className="grupos-loading-spinner"></div>
                    <p style={{ marginTop: 16 }}>Cargando grupos...</p>
                  </div>
                </td>
              </tr>
            ) : !grupos || grupos.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <div className="grupos-empty">
                    <div className="grupos-empty-icon">📋</div>
                    <div className="grupos-empty-text">No hay grupos creados</div>
                    <div className="grupos-empty-subtext">Crea tu primer grupo para organizar permisos</div>
                  </div>
                </td>
              </tr>
            ) : (
              grupos.map((grupo) => (
                <tr key={grupo.id}>
                  <td><strong>#{grupo.id}</strong></td>
                  <td>
                    <strong style={{ fontSize: "15px" }}>{grupo.nombre}</strong>
                    {grupo.descripcion && (
                      <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                        {grupo.descripcion}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="grupos-badge">
                      {grupo.permisos?.length || 0} permisos
                    </span>
                  </td>
                  <td>
                    <div className="grupos-actions">
                      <button
                        className="btn-grupos btn-grupos--edit"
                        onClick={() => handleOpenModal(grupo)}
                        title="Editar grupo"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        className="btn-grupos btn-grupos--delete"
                        onClick={() => handleDelete(grupo.id, grupo.nombre)}
                        title="Eliminar grupo"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Crear/Editar Grupo */}
      {showModal && (
        <div className="grupos-modal-overlay" onClick={handleCloseModal}>
          <div className="grupos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="grupos-modal-header">
              <h3>{editingGroup ? "✏️ Editar Grupo" : "➕ Crear Nuevo Grupo"}</h3>
              <button className="grupos-modal-close" onClick={handleCloseModal}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grupos-modal-body">
                {/* Nombre del grupo */}
                <div className="grupos-form-group">
                  <label htmlFor="nombre" className="grupos-form-label">
                    Nombre del Grupo <span style={{ color: "#f87171" }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Administradores, Gestores, Auditores..."
                    required
                    className="grupos-form-input"
                  />
                </div>

                {/* Descripción del grupo */}
                <div className="grupos-form-group">
                  <label htmlFor="descripcion" className="grupos-form-label">
                    Descripción
                  </label>
                  <textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Describe el propósito de este grupo..."
                    className="grupos-form-input"
                    rows={3}
                  />
                </div>

                {/* Búsqueda de permisos */}
                <div className="grupos-form-group">
                  <label htmlFor="search" className="grupos-form-label">
                    🔍 Buscar Permisos
                  </label>
                  <input
                    type="text"
                    id="search"
                    value={searchPermiso}
                    onChange={(e) => setSearchPermiso(e.target.value)}
                    placeholder="Buscar por nombre o código..."
                    className="grupos-form-input"
                  />
                </div>

                {/* Lista de permisos */}
                <div className="grupos-form-group">
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    marginBottom: 12
                  }}>
                    <label className="grupos-form-label" style={{ marginBottom: 0 }}>
                      Permisos Disponibles
                    </label>
                    <div style={{ display: "flex", gap: 16, fontSize: 14 }}>
                      <span style={{ color: "#94a3b8" }}>
                        Total: <strong style={{ color: "#e2e8f0" }}>{permisos?.length || 0}</strong>
                      </span>
                      <span style={{ color: "#10b981" }}>
                        Seleccionados: <strong>{formData.permisos?.length || 0}</strong>
                      </span>
                    </div>
                  </div>
                  
                  <div className="permisos-container">
                    {!permisos || permisos.length === 0 ? (
                      <div className="grupos-empty" style={{ padding: "40px 20px" }}>
                        <div className="grupos-empty-icon" style={{ fontSize: "48px" }}>⏳</div>
                        <div className="grupos-empty-text" style={{ fontSize: "16px" }}>
                          Cargando permisos...
                        </div>
                      </div>
                    ) : permisosFiltrados.length === 0 ? (
                      <div className="grupos-empty" style={{ padding: "40px 20px" }}>
                        <div className="grupos-empty-icon" style={{ fontSize: "48px" }}>🔍</div>
                        <div className="grupos-empty-text" style={{ fontSize: "16px" }}>
                          No se encontraron permisos que coincidan con "{searchPermiso}"
                        </div>
                      </div>
                    ) : (
                      permisosFiltrados.map((permiso) => {
                        const isSelected = formData.permisos?.includes(permiso.id) || false;
                        return (
                          <label 
                            key={permiso.id} 
                            className={`permiso-item ${isSelected ? 'selected' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => togglePermiso(permiso.id)}
                            />
                            <div className="permiso-info">
                              <div className="permiso-name">
                                {permiso.name}
                              </div>
                              <div className="permiso-details">
                                <code>{permiso.codename}</code> · ID: {permiso.id}
                              </div>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Resumen */}
                <div className="grupos-summary">
                  <div className="grupos-summary-title">
                    ✓ Resumen del Grupo
                  </div>
                  <ul className="grupos-summary-list">
                    <li>
                      Nombre: <strong>{formData.nombre || "(sin nombre)"}</strong>
                    </li>
                    <li>
                      Permisos asignados: <strong>{formData.permisos?.length || 0}</strong>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="grupos-modal-footer">
                <button 
                  type="button" 
                  className="btn-grupos"
                  onClick={handleCloseModal}
                  style={{
                    background: "rgba(100, 116, 139, 0.1)",
                    color: "#94a3b8",
                    border: "1px solid rgba(100, 116, 139, 0.3)"
                  }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-grupos btn-grupos--create"
                  disabled={loading || !formData.nombre}
                >
                  {loading ? "Guardando..." : editingGroup ? "💾 Actualizar" : "➕ Crear Grupo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default GruposPage;
