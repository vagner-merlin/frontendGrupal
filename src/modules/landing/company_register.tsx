import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/service";
import type { RegistrationForm, } from "./types";
import "../../styles/theme.css";
import "../../styles/landing.css";

// Componente de notificación de éxito
const SuccessNotification: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
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
      <div style={{
        fontSize: '32px',
        animation: 'bounce 1s ease-in-out'
      }}>
        ✅
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>
          ¡Éxito!
        </div>
        <div style={{ fontSize: '14px', opacity: 0.95 }}>
          {message}
        </div>
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          border: 'none',
          color: 'white',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
      >
        ×
      </button>
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
      <div style={{
        fontSize: '32px',
        animation: 'shake 0.5s ease-in-out'
      }}>
        ❌
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>
          Error
        </div>
        <div style={{ fontSize: '14px', opacity: 0.95, lineHeight: '1.4' }}>
          {message}
        </div>
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          border: 'none',
          color: 'white',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
      >
        ×
      </button>
    </div>
  );
};


// reemplazo: usar ConfirmationModal en lugar de SubscriptionPanel para confirmar + pago
import { ConfirmationModal } from "../billing/ConfirmationModal";
import { listPlans, createSuscripcion } from "../billing/service";
import type { Plan } from "../billing/types";

/** Permitir que el host proporcione una función de subida opcional */
declare global {
  interface Window {
    uploadFile?: (file: File) => Promise<string>;
  }
}

// Tipos para la respuesta esperada del backend
interface BackendEmpresa {
  id?: number | string;
  [k: string]: unknown;
}

interface BackendRegisterRaw {
  message?: string;
  empresa?: BackendEmpresa;
  data?: { empresa?: BackendEmpresa; [k: string]: unknown };
  empresa_id?: number | string;
  user?: unknown; // Cambiar de AdminUserData a unknown para evitar conflictos de tipos
  perfil_user?: unknown;
  token?: string;
  success?: boolean;
}

/** Helper de subida: si existe window.uploadFile la usa; si no, simula una URL */
// NOTA: Esta función ya no se usa, las imágenes se suben directamente desde el backend
// Se mantiene por compatibilidad pero puede ser eliminada
/*
async function uploadImage(file: File): Promise<string> {
  if (typeof window.uploadFile === "function") {
    return await window.uploadFile(file);
  }
  // simulación simple (no bloqueante)
  return Promise.resolve(`https://cdn.example.com/uploads/${encodeURIComponent(file.name)}`);
}
*/

const CompanyRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerCompanyAndUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({
    text: "",
    type: "",
  });
  
  // Estados para notificaciones bonitas
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showErrorNotification, setShowErrorNotification] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [form, setForm] = useState<RegistrationForm>({
    razon_social: "",
    email_contacto: "",
    nombre_comercial: "",
    username: "",
    password: "",
    confirm_password: "",
    first_name: "",
    last_name: "",
    email: "",
    selected_plan: "basico",
  });

  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(form.selected_plan || "basico");

  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(null);

  const [userAvatarFile, setUserAvatarFile] = useState<File | null>(null);
  const [userAvatarPreview, setUserAvatarPreview] = useState<string | null>(null);

  // Modal de confirmación
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [preparedRegistrationData, setPreparedRegistrationData] = useState<Omit<RegistrationForm, "confirm_password"> | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const list = await listPlans();
        if (mounted && Array.isArray(list)) {
          setPlans(list);
          setSelectedPlanId(prev => prev || (list.length > 0 ? list[0].id : "basico"));
        }
      } catch (err) { console.warn(err); }
    }
    void load();
    return () => { mounted = false; };
  }, []);

  // gestionar previews y archivos (empresa / usuario)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: "company" | "user") => {
    const file = e.target.files?.[0] ?? null;
    if (target === "company") {
      setCompanyLogoFile(file);
      if (file) {
        const url = URL.createObjectURL(file);
        setCompanyLogoPreview(url);
      } else {
        setCompanyLogoPreview(null);
      }
    } else {
      setUserAvatarFile(file);
      if (file) {
        const url = URL.createObjectURL(file);
        setUserAvatarPreview(url);
      } else {
        setUserAvatarPreview(null);
      }
    }
  };

  // liberar object URLs cuando cambian archivos / desmonta
  useEffect(() => {
    return () => {
      if (companyLogoPreview && companyLogoPreview.startsWith("blob:")) URL.revokeObjectURL(companyLogoPreview);
      if (userAvatarPreview && userAvatarPreview.startsWith("blob:")) URL.revokeObjectURL(userAvatarPreview);
    };
  }, [companyLogoPreview, userAvatarPreview]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    // Limpiar mensaje de error al escribir
    if (message.type === "error") {
      setMessage({ text: "", type: "" });
    }

    // NO autocompletar username ni email_contacto
    // El usuario debe llenar estos campos manualmente
  };

  const validateForm = (): string | null => {
    // Validación de emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!form.nombre_comercial.trim()) return "El nombre comercial es requerido";
    if (!form.razon_social.trim()) return "La razón social es requerida";
    if (!form.email_contacto.trim()) return "El email de contacto es requerido";
    if (!emailRegex.test(form.email_contacto)) return "El email de contacto no es válido (debe contener @)";
    
    if (!form.first_name.trim()) return "El nombre del administrador es requerido";
    if (!form.last_name.trim()) return "El apellido del administrador es requerido";
    if (!form.email.trim()) return "El email del administrador es requerido";
    if (!emailRegex.test(form.email)) return "El email del administrador no es válido (debe contener @)";
    
    if (!form.username.trim()) return "El nombre de usuario es requerido";
    if (!form.password.trim()) return "La contraseña es requerida";
    if (form.password.length < 8) return "La contraseña debe tener al menos 8 caracteres";
    if (form.password !== form.confirm_password) return "Las contraseñas no coinciden";
    return null;
  };

  // FUNCIÓN 1: Solo validar y preparar datos para el modal (NO crear empresa)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    // 1. Validar formulario
    const validationError = validateForm();
    if (validationError) {
      setMessage({ text: validationError, type: "error" });
      return;
    }

    setLoading(true);
    try {
      // 2. Ya no subimos imágenes aquí, las guardamos para el modal
      console.log("[preparación] Archivos listos:", {
        companyLogo: companyLogoFile?.name,
        userAvatar: userAvatarFile?.name
      });

      // 3. Preparar datos para el modal (SIN crear empresa)
      const registrationData = {
        razon_social: form.razon_social,
        email_contacto: form.email_contacto,
        nombre_comercial: form.nombre_comercial,
        username: form.username,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        selected_plan: selectedPlanId || form.selected_plan,
      };

      console.log("[preparación] Datos preparados para confirmación:", registrationData);

      // 4. Mostrar modal de confirmación
      setPreparedRegistrationData(registrationData);
      setShowConfirmationModal(true);
      setMessage({ text: "Datos validados. Confirma en la siguiente ventana para crear la empresa.", type: "success" });
      
    } catch (err) {
      console.error("[preparación] Error:", err);
      setMessage({ text: "Error preparando los datos. Inténtalo de nuevo.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // FUNCIÓN 2: Crear empresa y suscripción SOLO al confirmar en el modal
  const handleConfirmRegistration = async (paymentData?: { cardNumber: string; expiryDate: string; cvv: string; cardName: string }) => {
    if (!preparedRegistrationData) {
      console.error("[confirmación] No hay datos preparados");
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      console.log("[confirmación] INICIANDO creación de empresa desde modal");
      
      // VERIFICAR archivos antes de crear FormData
      console.log("[confirmación] 🔍 Verificando archivos:");
      console.log("[confirmación] companyLogoFile:", companyLogoFile ? `✅ ${companyLogoFile.name} (${companyLogoFile.size} bytes)` : "❌ null");
      console.log("[confirmación] userAvatarFile:", userAvatarFile ? `✅ ${userAvatarFile.name} (${userAvatarFile.size} bytes)` : "❌ null");
      
      // 1. Crear FormData para enviar archivos
      const formData = new FormData();
      
      // Agregar campos de texto
      formData.append('razon_social', String(preparedRegistrationData.razon_social || ""));
      formData.append('email_contacto', String(preparedRegistrationData.email_contacto || ""));
      formData.append('nombre_comercial', String(preparedRegistrationData.nombre_comercial || ""));
      formData.append('username', String(preparedRegistrationData.username || ""));
      formData.append('password', String(preparedRegistrationData.password || ""));
      formData.append('first_name', String(preparedRegistrationData.first_name || ""));
      formData.append('last_name', String(preparedRegistrationData.last_name || ""));
      formData.append('email', String(preparedRegistrationData.email || ""));
      
      // Agregar archivos de imágenes si existen
      if (companyLogoFile) {
        formData.append('imagen_empresa', companyLogoFile);
        console.log("[confirmación] ✅ Logo empresa agregado al FormData:", companyLogoFile.name);
      } else {
        console.warn("[confirmación] ⚠️ NO hay logo de empresa para subir");
      }
      
      if (userAvatarFile) {
        formData.append('imagen_perfil', userAvatarFile);
        console.log("[confirmación] ✅ Avatar usuario agregado al FormData:", userAvatarFile.name);
      } else {
        console.warn("[confirmación] ⚠️ NO hay avatar de usuario para subir");
      }

      console.log("[confirmación] 📦 FormData preparado. Contenido:");
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  - ${key}: [File] ${value.name} (${value.size} bytes, ${value.type})`);
        } else {
          console.log(`  - ${key}: ${value}`);
        }
      }

      // 2. CREAR EMPRESA Y USUARIO (aquí sí se ejecuta el registro)
      const raw: BackendRegisterRaw = await registerCompanyAndUser(formData);
      console.log("[confirmación] Respuesta del backend:", raw);

      // Normalizar respuesta: backend devuelve { message, empresa: { id } , ... }
      if (!raw || typeof raw !== "object") {
        throw new Error("Respuesta inválida del servidor");
      }

      const empresaObj = raw.empresa ?? raw.data?.empresa ?? null;
      const empresaIdRaw = empresaObj?.id ?? raw.empresa_id ?? null;

      if (!empresaIdRaw) {
        // si backend devolvió sólo message/token, considerarlo éxito pero sin id -> error controlado
        throw new Error(raw.message || "No se recibió ID de empresa del servidor");
      }

      const empresaId = typeof empresaIdRaw === "string" ? parseInt(empresaIdRaw, 10) : Number(empresaIdRaw);
      if (isNaN(empresaId) || empresaId <= 0) {
        throw new Error(`empresa_id inválido recibido: ${empresaIdRaw}`);
      }

      console.log("[confirmación] ✅ Empresa creada exitosamente con ID:", empresaId);
      
      // Mostrar notificación de éxito bonita
      setSuccessMessage("¡Empresa registrada exitosamente! Configurando suscripción...");
      setShowSuccessNotification(true);
      setMessage({ text: "", type: "" }); // Limpiar mensaje antiguo

      // 4. Procesar pago si es necesario
      if (paymentData) {
        console.log("[confirmación] Procesando pago:", paymentData);
        // TODO: Integrar con pasarela de pago real
      }

      // 5. Crear suscripción
      let sus = null;
      let suscripcionExitosa = false;
      try {
        console.log("[confirmación] Creando suscripción para plan:", selectedPlanId);
        
        const tipoPlan = selectedPlanId === "basico" ? "BASICO" : "PREMIUM";
        
        const fechaInicioDate = new Date();
        const fechaFinDate = new Date(fechaInicioDate);
        if (selectedPlanId === "basico") {
          fechaFinDate.setDate(fechaFinDate.getDate() + 30); // 30 días trial
        } else {
          fechaFinDate.setFullYear(fechaFinDate.getFullYear() + 1); // 1 año
        }

        const planObj = plans.find(p => p.id === selectedPlanId);
        const rawPrice = planObj?.priceUsd ?? 0;
        const monto = typeof rawPrice === 'string' ? parseFloat(rawPrice) : Number(rawPrice);

        const suscripcionPayload = {
          empresa: empresaId,
          tipo_plan: tipoPlan,
          fecha_inicio: fechaInicioDate.toISOString().split("T")[0],
          fecha_fin: fechaFinDate.toISOString().split("T")[0],
          monto: isNaN(monto) ? 0 : monto,
          estado: true,
          metodo_pago: paymentData ? "TARJETA" : "MANUAL",
        };

        console.log("[confirmación] Creando suscripción:", JSON.stringify(suscripcionPayload, null, 2));
        sus = await createSuscripcion(suscripcionPayload);
        console.log("[confirmación] ✅ Suscripción creada:", sus);
        suscripcionExitosa = true;

      } catch (subError) {
        console.error("[confirmación] Error creando suscripción:", subError);
        console.warn("[confirmación] Empresa creada pero suscripción falló. Continuando...");
        // No fallar todo por la suscripción - la empresa ya está creada
      }

      // 6. Éxito total
      setShowConfirmationModal(false);
      
      // Mostrar notificación final bonita
      if (suscripcionExitosa) {
        setSuccessMessage("¡Empresa y suscripción registradas exitosamente! Redirigiendo al login...");
      } else {
        setSuccessMessage("¡Empresa registrada exitosamente! (Suscripción se configurará después). Redirigiendo...");
      }
      setShowSuccessNotification(true);
      setMessage({ text: "", type: "" }); // Limpiar mensaje antiguo
      
      setTimeout(() => {
        navigate("/login", { 
          state: { 
            message: suscripcionExitosa 
              ? "Empresa y suscripción creadas exitosamente. Puede iniciar sesión." 
              : "Empresa creada exitosamente. Puede iniciar sesión.",
            empresa_id: empresaId 
          },
          replace: true 
        });
      }, 3000); // Más tiempo para leer el mensaje

    } catch (error: unknown) {
      console.error("[confirmación] Error:", error);
      
      // Manejo de errores de Axios mejorado
      interface AxiosError {
        response?: {
          data?: {
            errors?: Record<string, unknown>;
            message?: string;
            detail?: string;
            error?: string;
            empresa?: { id?: number | string };
            empresa_id?: number | string;
          };
          status?: number;
          statusText?: string;
        };
        message?: string;
      }
      
      const axiosError = error as AxiosError;
      const respData = axiosError?.response?.data;
      const status = axiosError?.response?.status;
      const statusText = axiosError?.response?.statusText;
      
      console.error("[confirmación] Detalles del error:", {
        status,
        statusText,
        data: respData,
        message: axiosError?.message
      });

      // CASO ESPECIAL: Error 500 pero la empresa SÍ se creó (tiene empresa_id en la respuesta)
      if (status === 500 && (respData?.empresa?.id || respData?.empresa_id)) {
        console.log("[confirmación] ⚠️ Error 500 pero empresa creada. Mostrando éxito.");
        setShowConfirmationModal(false);
        setSuccessMessage("¡Empresa registrada exitosamente! (Hubo un error menor en el servidor, pero tu empresa se creó correctamente)");
        setShowSuccessNotification(true);
        setMessage({ text: "", type: "" });
        
        setTimeout(() => {
          navigate("/login", { 
            state: { 
              message: "Empresa creada exitosamente. Puede iniciar sesión.",
              warning: "Nota: Configure la suscripción manualmente desde el panel de administración."
            },
            replace: true 
          });
        }, 4000);
        return;
      }
      
      if (respData?.errors) {
        const errorParts: string[] = [];
        
        Object.entries(respData.errors).forEach(([field, msgs]) => {
          if (Array.isArray(msgs)) {
            errorParts.push(`${field}: ${msgs.join(", ")}`);
          }
        });
        
        setMessage({ text: errorParts.join(" | "), type: "error" });
        
        // Si hay error de username/email, cerrar modal para editar
        if (respData.errors.username || respData.errors.email) {
          if (respData.errors.username) {
            const suggestion = `${preparedRegistrationData.username}_${Math.floor(Math.random() * 9000 + 1000)}`;
            setForm(prev => ({ ...prev, username: suggestion }));
          }
          setShowConfirmationModal(false);
          setPreparedRegistrationData(null);
        }
        return;
      }
      
      // Manejo de errores 500 del servidor (empresa NO creada)
      if (status === 500) {
        const serverError = respData?.error || respData?.message || "Error interno del servidor";
        
        // Mostrar notificación bonita de error
        setErrorMessage("Hubo un problema en el servidor al procesar tu registro. Por favor, contacta al administrador del sistema o intenta nuevamente más tarde.");
        setShowErrorNotification(true);
        setMessage({ text: "", type: "" }); // Limpiar mensaje feo
        
        // Log técnico para desarrolladores
        console.error("Error técnico del servidor:", serverError);
        return;
      }
      
      // Otros errores HTTP
      if (status && status >= 400) {
        const errorMsg = `Error ${status}: ${statusText || "Error del servidor"}. ${respData?.message || ""}`;
        setErrorMessage(errorMsg);
        setShowErrorNotification(true);
        setMessage({ text: "", type: "" });
        return;
      }
      
      const msg = respData?.message || respData?.detail || respData?.error || "Error del servidor";
      setErrorMessage(String(msg));
      setShowErrorNotification(true);
      setMessage({ text: "", type: "" });
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="landing-hero">
      {/* Notificación de éxito bonita */}
      {showSuccessNotification && (
        <SuccessNotification 
          message={successMessage} 
          onClose={() => setShowSuccessNotification(false)} 
        />
      )}
      
      {/* Notificación de error bonita */}
      {showErrorNotification && (
        <ErrorNotification 
          message={errorMessage} 
          onClose={() => setShowErrorNotification(false)} 
        />
      )}
      
      <div className="auth-box-modern" role="main">
        {/* Planes */}
        <aside className="plans-sidebar" aria-label="Seleccionar plan">
          <div className="plans-sidebar__header">
            <h3 className="plans-sidebar__title">Planes</h3>
            <p className="plans-sidebar__subtitle">Elige el plan que deseas iniciar para tu empresa.</p>
          </div>

          <div className="plans-sidebar__list" role="list">
            {plans.length === 0 && <div style={{ color: "var(--muted)" }}>Cargando planes…</div>}
            {plans.map(p => (
              <button
                key={p.id}
                type="button"
                role="listitem"
                aria-pressed={selectedPlanId === p.id}
                className={`plan-sidebar-card ${selectedPlanId === p.id ? "active" : ""} plan-sidebar-card--${p.id}`}
                onClick={() => {
                  setSelectedPlanId(p.id);
                  setForm(prev => ({ ...prev, selected_plan: p.id }));
                }}
              >
                <div className="plan-sidebar-card__header">
                  <div>
                    <span className="plan-sidebar-card__name">{p.name}</span>
                    <div className="plan-sidebar-card__price">${p.priceUsd}/mes</div>
                  </div>
                  <span className="plan-sidebar-card__badge">{p.limits.maxUsers} usuarios</span>
                </div>
                <ul className="plan-sidebar-card__features">
                  <li className="plan-sidebar-card__feature"><span className="plan-sidebar-card__feature-icon">•</span> {p.limits.maxRequests.toLocaleString()} req/mes</li>
                  {p.limits.maxStorageGB != null && <li className="plan-sidebar-card__feature"><span className="plan-sidebar-card__feature-icon">•</span> {p.limits.maxStorageGB} GB almacenamiento</li>}
                </ul>
              </button>
            ))}
          </div>

          <div className="plans-sidebar__footer" style={{ marginTop: 12 }}>
            <small className="muted">Tras validar los datos podrás confirmar el registro.</small>
          </div>
        </aside>

        {/* Formulario */}
        <div className="auth-right" aria-label="Formulario de registro">
          <form onSubmit={handleSubmit} className="auth-form-modern" noValidate>
            <h2>Registro de Empresa</h2>
            <p style={{ color: "var(--muted)" }}>Complete los datos de su empresa y usuario administrador</p>

            {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

            <fieldset className="card" style={{ marginBottom: 16 }}>
              <legend>🏢 Datos de la Empresa</legend>

              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "start" }}>
                {/* Columna izquierda: Datos */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div className="input-group">
                    <span className="input-icon">🏢</span>
                    <input type="text" name="nombre_comercial" placeholder="Nombre comercial *" value={form.nombre_comercial} onChange={handleChange} required />
                  </div>

                  <div className="input-group">
                    <span className="input-icon">📄</span>
                    <input type="text" name="razon_social" placeholder="Razón social *" value={form.razon_social} onChange={handleChange} required />
                  </div>

                  <div className="input-group">
                    <span className="input-icon">📧</span>
                    <input type="email" name="email_contacto" placeholder="Email de contacto *" value={form.email_contacto} onChange={handleChange} required />
                  </div>
                </div>

                {/* Columna derecha: Logo de empresa */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "8px" }}>
                  <label 
                    className="ghost-btn" 
                    style={{ 
                      display: "flex", 
                      flexDirection: "column",
                      gap: 12, 
                      alignItems: "center", 
                      cursor: "pointer",
                      padding: "16px",
                      border: "2px dashed rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      minWidth: "160px",
                      transition: "all 0.3s ease"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
                  >
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "company")} style={{ display: "none" }} />
                    {companyLogoPreview ? (
                      <>
                        <img 
                          src={companyLogoPreview} 
                          alt="Logo empresa" 
                          style={{ 
                            width: 120, 
                            height: 120, 
                            objectFit: "cover", 
                            borderRadius: 12, 
                            border: "2px solid rgba(255,255,255,0.1)",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                          }} 
                        />
                        <span style={{ fontSize: "12px", color: "var(--muted)" }}>Cambiar logo</span>
                      </>
                    ) : (
                      <>
                        <div style={{ 
                          fontSize: "48px", 
                          opacity: 0.5,
                          marginBottom: "8px"
                        }}>🏢</div>
                        <span style={{ fontSize: "13px", textAlign: "center" }}>Subir logo<br/>de la empresa</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </fieldset>

            <fieldset className="card" style={{ marginBottom: 16 }}>
              <legend>👤 Usuario Administrador</legend>

              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "start" }}>
                {/* Columna izquierda: Datos del usuario */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div className="register-grid">
                    <div className="input-group">
                      <span className="input-icon">👤</span>
                      <input type="text" name="first_name" placeholder="Nombre *" value={form.first_name} onChange={handleChange} required />
                    </div>

                    <div className="input-group">
                      <span className="input-icon">👤</span>
                      <input type="text" name="last_name" placeholder="Apellido *" value={form.last_name} onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="input-group">
                    <span className="input-icon">📧</span>
                    <input 
                      type="text" 
                      name="email" 
                      placeholder={form.nombre_comercial ? `usuario.${form.nombre_comercial.toLowerCase().trim().replace(/\s+/g, '')}@gmail.com` : "Email del administrador *"}
                      value={form.email} 
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        const nombreLimpio = form.nombre_comercial.toLowerCase().trim().replace(/\s+/g, '');
                        
                        if (!nombreLimpio) {
                          // Si no hay nombre comercial, comportamiento normal
                          setForm(prev => ({ ...prev, email: inputValue }));
                          return;
                        }
                        
                        const dominioFijo = `.${nombreLimpio}@gmail.com`;
                        
                        // Si el usuario intenta borrar o modificar el dominio, mantenerlo fijo
                        if (inputValue.includes('.')) {
                          // Extraer solo la parte antes del primer punto
                          const parteUsuario = inputValue.split('.')[0];
                          // Siempre mantener el dominio fijo
                          setForm(prev => ({ ...prev, email: `${parteUsuario}${dominioFijo}` }));
                        } else {
                          // Si no hay punto aún, permitir escribir normalmente
                          setForm(prev => ({ ...prev, email: inputValue }));
                        }
                      }}
                      onBlur={(e) => {
                        // Al perder el foco, si hay algo escrito y nombre comercial, agregar el dominio
                        const nombreLimpio = form.nombre_comercial.toLowerCase().trim().replace(/\s+/g, '');
                        if (nombreLimpio && e.target.value && !e.target.value.includes('.')) {
                          const dominioFijo = `.${nombreLimpio}@gmail.com`;
                          setForm(prev => ({ ...prev, email: `${e.target.value}${dominioFijo}` }));
                        }
                      }}
                      required 
                    />
                    {form.nombre_comercial && (
                      <small style={{ fontSize: "11px", color: "var(--success)", marginTop: "4px", display: "block", fontWeight: "500" }}>
                        💡 Escribe tu usuario (ej: vagner). Al terminar se agregará automáticamente .{form.nombre_comercial.toLowerCase().trim().replace(/\s+/g, '')}@gmail.com
                      </small>
                    )}
                  </div>

                  <div className="input-group">
                    <span className="input-icon">🔑</span>
                    <input 
                      type="text" 
                      name="username" 
                      placeholder="Nombre de usuario *" 
                      value={form.username} 
                      onChange={handleChange} 
                      autoComplete="off"
                      required 
                    />
                  </div>

                  <div className="register-grid">
                    <div className="input-group">
                      <span className="input-icon">🔒</span>
                      <input type="password" name="password" placeholder="Contraseña *" value={form.password} onChange={handleChange} required />
                    </div>

                    <div className="input-group">
                      <span className="input-icon">🔒</span>
                      <input type="password" name="confirm_password" placeholder="Confirmar contraseña *" value={form.confirm_password} onChange={handleChange} required />
                    </div>
                  </div>
                </div>

                {/* Columna derecha: Foto de perfil */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "8px" }}>
                  <label 
                    className="ghost-btn" 
                    style={{ 
                      display: "flex", 
                      flexDirection: "column",
                      gap: 12, 
                      alignItems: "center", 
                      cursor: "pointer",
                      padding: "16px",
                      border: "2px dashed rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      minWidth: "160px",
                      transition: "all 0.3s ease"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
                  >
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "user")} style={{ display: "none" }} />
                    {userAvatarPreview ? (
                      <>
                        <img 
                          src={userAvatarPreview} 
                          alt="Avatar usuario" 
                          style={{ 
                            width: 120, 
                            height: 120, 
                            objectFit: "cover", 
                            borderRadius: "50%", 
                            border: "2px solid rgba(255,255,255,0.1)",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                          }} 
                        />
                        <span style={{ fontSize: "12px", color: "var(--muted)" }}>Cambiar foto</span>
                      </>
                    ) : (
                      <>
                        <div style={{ 
                          fontSize: "48px", 
                          opacity: 0.5,
                          marginBottom: "8px"
                        }}>👤</div>
                        <span style={{ fontSize: "13px", textAlign: "center" }}>Subir foto<br/>de perfil</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </fieldset>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <button type="submit" className="ui-btn ui-btn--primary" disabled={loading}>
                {loading ? "Validando datos..." : "Validar y Continuar"}
              </button>
              <div style={{ textAlign: "right" }}>
                <small style={{ color: "var(--muted)" }}>¿Ya tienes una cuenta?</small>
                <div>
                  <button type="button" className="ui-btn ui-btn--ghost" onClick={() => navigate("/login")}>Iniciar sesión</button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de confirmación - AQUÍ se crea la empresa */}
      {showConfirmationModal && preparedRegistrationData && (
        <ConfirmationModal
          companyData={{
            nombre: String(preparedRegistrationData.nombre_comercial ?? ""),
            email: String(preparedRegistrationData.email_contacto ?? ""),
            telefono: "",
            direccion: "",
            admin_nombre: String(preparedRegistrationData.first_name ?? ""),
            admin_email: String(preparedRegistrationData.email ?? ""),
          }}
          selectedPlan={plans.find(p => p.id === selectedPlanId)}
          isPaidPlan={selectedPlanId !== "basico"}
          onConfirm={(paymentData) => void handleConfirmRegistration(paymentData)}
          onCancel={() => setShowConfirmationModal(false)}
          loading={loading}
        />
      )}
    </section>
  );
};

export default CompanyRegisterPage;
export { CompanyRegisterPage as CompanySignupPage };
