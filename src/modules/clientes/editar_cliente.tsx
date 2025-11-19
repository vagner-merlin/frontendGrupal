import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCliente, updateCliente, validateCliente } from "./service";
import type { UpdateClienteInput } from "./types";
import PageHeader from "../../shared/components/PageHeader";
import "../../styles/theme.css";

// Componentes de notificación
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
      color: '#fff',
      padding: '16px 24px',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(16, 185, 129, 0.3)',
      minWidth: '300px',
      animation: 'slideInRight 0.5s ease-out',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <div style={{ fontSize: '24px', animation: 'bounce 1s ease-in-out' }}>✅</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '600', marginBottom: '4px' }}>¡Éxito!</div>
        <div style={{ fontSize: '14px', opacity: 0.95 }}>{message}</div>
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          color: '#fff',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ×
      </button>
    </div>
  );
};

const ErrorNotification: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      color: '#fff',
      padding: '16px 24px',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(239, 68, 68, 0.3)',
      minWidth: '300px',
      animation: 'slideInRight 0.5s ease-out',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <div style={{ fontSize: '24px', animation: 'shake 0.5s ease-in-out' }}>❌</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '600', marginBottom: '4px' }}>Error</div>
        <div style={{ fontSize: '14px', opacity: 0.95 }}>{message}</div>
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          color: '#fff',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ×
      </button>
    </div>
  );
};

const EditarClientePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showErrorNotification, setShowErrorNotification] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const cargarCliente = async () => {
      if (!id) {
        setErrorMessage("ID de cliente no válido");
        setShowErrorNotification(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("🔄 Cargando cliente para editar, ID:", id);
        const data = await getCliente(parseInt(id));
        console.log("✅ Cliente cargado:", data);
        
        setForm({
          nombre: data.nombre || "",
          apellido: data.apellido || "",
          telefono: data.telefono || "",
        });
      } catch (err) {
        console.error("❌ Error cargando cliente:", err);
        setErrorMessage("No se pudo cargar la información del cliente");
        setShowErrorNotification(true);
      } finally {
        setLoading(false);
      }
    };

    cargarCliente();
  }, [id]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;

    setSaving(true);
    setErrors([]);

    try {
      // Validaciones
      const validationErrors = validateCliente(form);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setSaving(false);
        return;
      }

      console.log("📤 Actualizando cliente...");
      const updateData: UpdateClienteInput = {
        id: parseInt(id),
        ...form
      };

      await updateCliente(updateData);
      
      setSuccessMessage("¡Cliente actualizado exitosamente!");
      setShowSuccessNotification(true);

      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate(`/app/clientes/${id}`);
      }, 2000);

    } catch (err) {
      console.error("❌ Error actualizando cliente:", err);
      setErrorMessage("Error al actualizar el cliente. Por favor, intenta nuevamente.");
      setShowErrorNotification(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="ui-page">
        <PageHeader
          title="Editar Cliente"
          subtitle="Cargando información..."
          showBackButton={true}
          backPath="/app/clientes"
        />
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
          <p style={{ color: "var(--text-muted)" }}>Cargando datos del cliente...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="ui-page">
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
        title="Editar Cliente"
        subtitle={`Modificar información de ${form.nombre} ${form.apellido}`}
        showBackButton={true}
        backPath={`/app/clientes/${id}`}
      />

      <div className="ui-card">
        {/* Header del formulario */}
        <div style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "24px 32px",
          borderRadius: "12px 12px 0 0",
          marginBottom: "32px",
          color: "#fff"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              border: "2px solid rgba(255, 255, 255, 0.3)"
            }}>
              ✏️
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "600" }}>
                Actualizar Información
              </h3>
              <p style={{ margin: "4px 0 0", opacity: 0.9, fontSize: "14px" }}>
                Modifica los datos del cliente
              </p>
            </div>
          </div>
        </div>

        {/* Mensajes de error */}
        {errors.length > 0 && (
          <div style={{ 
            padding: "0 32px", 
            marginBottom: "24px" 
          }}>
            <div style={{
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              color: "#fff",
              padding: "16px 20px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px"
            }}>
              <div style={{ fontSize: "20px" }}>⚠️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "600", marginBottom: "8px" }}>
                  Por favor, corrige los siguientes errores:
                </div>
                <ul style={{ margin: 0, paddingLeft: "20px" }}>
                  {errors.map((error, idx) => (
                    <li key={idx} style={{ marginBottom: "4px" }}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ padding: "0 32px 32px" }}>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
            marginBottom: "24px"
          }}>
            {/* Nombre */}
            <div>
              <label 
                htmlFor="nombre" 
                style={{ 
                  display: "block", 
                  fontSize: "14px", 
                  fontWeight: "600",
                  marginBottom: "8px",
                  color: "var(--text)"
                }}
              >
                Nombre <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                id="nombre"
                type="text"
                value={form.nombre}
                onChange={e => handleChange("nombre", e.target.value)}
                placeholder="Ingrese el nombre"
                required
                className="ui-input"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontSize: "16px",
                  borderRadius: "8px"
                }}
              />
            </div>

            {/* Apellido */}
            <div>
              <label 
                htmlFor="apellido" 
                style={{ 
                  display: "block", 
                  fontSize: "14px", 
                  fontWeight: "600",
                  marginBottom: "8px",
                  color: "var(--text)"
                }}
              >
                Apellido <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                id="apellido"
                type="text"
                value={form.apellido}
                onChange={e => handleChange("apellido", e.target.value)}
                placeholder="Ingrese el apellido"
                required
                className="ui-input"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontSize: "16px",
                  borderRadius: "8px"
                }}
              />
            </div>
          </div>

          {/* Teléfono */}
          <div style={{ marginBottom: "32px" }}>
            <label 
              htmlFor="telefono" 
              style={{ 
                display: "block", 
                fontSize: "14px", 
                fontWeight: "600",
                marginBottom: "8px",
                color: "var(--text)"
              }}
            >
              Teléfono <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              id="telefono"
              type="tel"
              value={form.telefono}
              onChange={e => handleChange("telefono", e.target.value)}
              placeholder="Ej: +591 70123456"
              required
              className="ui-input"
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: "16px",
                borderRadius: "8px"
              }}
            />
          </div>

          {/* Botones de acción */}
          <div style={{ 
            display: "flex", 
            gap: "12px", 
            justifyContent: "flex-end",
            paddingTop: "24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)"
          }}>
            <button
              type="button"
              onClick={() => navigate(`/app/clientes/${id}`)}
              className="ui-btn ui-btn--ghost"
              disabled={saving}
              style={{ minWidth: "120px" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="ui-btn ui-btn--primary"
              disabled={saving}
              style={{ 
                minWidth: "180px",
                background: saving 
                  ? "rgba(102, 126, 234, 0.5)" 
                  : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              }}
            >
              {saving ? "💾 Guardando..." : "💾 Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>

      {/* Información adicional */}
      <div style={{
        marginTop: "24px",
        padding: "16px 20px",
        background: "rgba(102, 126, 234, 0.05)",
        borderRadius: "8px",
        border: "1px solid rgba(102, 126, 234, 0.1)",
        display: "flex",
        alignItems: "center",
        gap: "12px"
      }}>
        <div style={{ fontSize: "20px" }}>💡</div>
        <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>
          Los campos marcados con <span style={{ color: "#ef4444" }}>*</span> son obligatorios
        </div>
      </div>
    </section>
  );
};

export default EditarClientePage;
