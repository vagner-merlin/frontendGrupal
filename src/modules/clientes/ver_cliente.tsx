import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getCliente } from "./service";
import type { Cliente } from "./types";
import PageHeader from "../../shared/components/PageHeader";
import "../../styles/theme.css";

// Importar servicios de documentación, trabajo y domicilio
import { 
  getDocumentacionByCliente, 
  createDocumentacion, 
  deleteDocumentacion 
} from "./documentacion/service";
import type { Documentacion, CreateDocumentacionInput } from "./documentacion/types";

import { 
  getTrabajosByCliente, 
  createTrabajo, 
  updateTrabajo, 
  deleteTrabajo 
} from "./trabajo/service";
import type { Trabajo, CreateTrabajoInput, UpdateTrabajoInput } from "./trabajo/types";

import { 
  getDomiciliosByCliente, 
  createDomicilio, 
  updateDomicilio, 
  deleteDomicilio 
} from "./domicilios/service";
import type { Domicilio, CreateDomicilioInput, UpdateDomicilioInput } from "./domicilios/types";

import { listCredits } from "../creditos/service";
import type { Credito } from "../creditos/types";

type TabType = "info" | "documentacion" | "trabajo" | "domicilio";

// Componente de notificación
const Notification: React.FC<{ 
  type: "success" | "error"; 
  message: string; 
  onClose: () => void 
}> = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: { bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)", icon: "✅" },
    error: { bg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", icon: "❌" }
  };

  return (
    <div style={{
      position: "fixed",
      top: "20px",
      right: "20px",
      zIndex: 9999,
      background: colors[type].bg,
      color: "#fff",
      padding: "16px 24px",
      borderRadius: "12px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      minWidth: "300px",
      animation: "slideInRight 0.5s ease-out"
    }}>
      <div style={{ fontSize: "24px", animation: "bounce 1s ease-in-out" }}>
        {colors[type].icon}
      </div>
      <div style={{ flex: 1 }}>{message}</div>
      <button 
        onClick={onClose}
        style={{
          background: "rgba(255,255,255,0.2)",
          border: "none",
          color: "#fff",
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          cursor: "pointer",
          fontSize: "18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        ×
      </button>
    </div>
  );
};

const VerClientePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Estado para tabs
  const [activeTab, setActiveTab] = useState<TabType>("info");
  
  // Estados para documentación (HU13)
  const [documentos, setDocumentos] = useState<Documentacion[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [showDocForm, setShowDocForm] = useState(false);
  const [docForm, setDocForm] = useState({ ci: "", documento_url: "" });
  
  // Estados para trabajo (HU14)
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [loadingWork, setLoadingWork] = useState(false);
  const [showWorkForm, setShowWorkForm] = useState(false);
  const [editingWork, setEditingWork] = useState<Trabajo | null>(null);
  const [workForm, setWorkForm] = useState({
    cargo: "",
    empresa: "",
    salario: "",
    ubicacion: "",
    descripcion: "",
    extracto_url: ""
  });
  
  // Estados para domicilio (HU15)
  const [domicilios, setDomicilios] = useState<Domicilio[]>([]);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Domicilio | null>(null);
  const [addressForm, setAddressForm] = useState({
    descripcion: "",
    es_propietario: true,
    numero_ref: "",
    croquis_url: ""
  });
  
  // Notificaciones
  const [notification, setNotification] = useState<{type: "success" | "error", message: string} | null>(null);
  
  // Estados para créditos
  const [creditos, setCreditos] = useState<Credito[]>([]);
  const [loadingCreditos, setLoadingCreditos] = useState(false);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
  };

  // Cargar cliente
  useEffect(() => {
    const cargarCliente = async () => {
      if (!id) {
        setError("ID de cliente no válido");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("🔄 Cargando cliente ID:", id);
        const data = await getCliente(parseInt(id));
        console.log("✅ Cliente cargado:", data);
        setCliente(data);
      } catch (err) {
        console.error("❌ Error cargando cliente:", err);
        setError("No se pudo cargar la información del cliente");
      } finally {
        setLoading(false);
      }
    };

    cargarCliente();
  }, [id]);

  // Cargar créditos del cliente
  useEffect(() => {
    const cargarCreditos = async () => {
      if (!id) return;
      try {
        setLoadingCreditos(true);
        const data = await listCredits();
        console.log("📊 Todos los créditos:", data);
        console.log("🔍 Buscando créditos para cliente_id:", parseInt(id));
        // Filtrar solo los créditos de este cliente
        const creditosDelCliente = data.filter((c: Credito) => {
          console.log(`Crédito ${c.id}: cliente_id=${c.cliente_id}, match=${c.cliente_id === parseInt(id)}`);
          return c.cliente_id === parseInt(id);
        });
        console.log("✅ Créditos encontrados:", creditosDelCliente);
        setCreditos(creditosDelCliente);
      } catch (err) {
        console.error("❌ Error cargando créditos:", err);
      } finally {
        setLoadingCreditos(false);
      }
    };

    cargarCreditos();
  }, [id]);

  // Cargar documentos cuando se cambia al tab de documentación
  useEffect(() => {
    if (activeTab === "documentacion" && id && documentos.length === 0) {
      cargarDocumentos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, id]);

  // Cargar trabajos cuando se cambia al tab de trabajo
  useEffect(() => {
    if (activeTab === "trabajo" && id && trabajos.length === 0) {
      cargarTrabajos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, id]);

  // Cargar domicilios cuando se cambia al tab de domicilio
  useEffect(() => {
    if (activeTab === "domicilio" && id && domicilios.length === 0) {
      cargarDomicilios();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, id]);

  // ============= FUNCIONES PARA DOCUMENTACIÓN (HU13) =============
  const cargarDocumentos = async (mostrarError = true) => {
    if (!id) return;
    setLoadingDocs(true);
    try {
      console.log("🔄 Cargando documentos para cliente ID:", id);
      const docs = await getDocumentacionByCliente(parseInt(id));
      console.log("✅ Documentos cargados:", docs);
      setDocumentos(docs);
    } catch (err) {
      if (mostrarError) {
        console.error("❌ Error cargando documentos:", err);
        const error = err as { response?: { data?: { detail?: string; message?: string }; }; message?: string };
        const errorMsg = error?.response?.data?.detail || 
                        error?.response?.data?.message || 
                        error?.message || 
                        "Error al cargar documentos";
        showNotification("error", `❌ ${errorMsg}`);
      } else {
        console.log("⚠️ Error silencioso cargando documentos (esperado después de crear)");
      }
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleCreateDocumento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    // Validación de campos requeridos
    if (!docForm.ci.trim()) {
      showNotification("error", "❌ El CI es requerido");
      return;
    }
    
    if (!docForm.documento_url.trim()) {
      showNotification("error", "❌ La URL del documento es requerida");
      return;
    }

    try {
      console.log("✨ Creando documento para cliente ID:", id);
      const input: CreateDocumentacionInput = {
        ci: docForm.ci.trim(),
        documento_url: docForm.documento_url.trim(),
        id_cliente: parseInt(id)
      };
      console.log("📝 Datos del documento:", input);
      
      const nuevoDoc = await createDocumentacion(input);
      console.log("✅ Documento creado:", nuevoDoc);
      
      showNotification("success", "✅ Documento agregado exitosamente");
      setDocForm({ ci: "", documento_url: "" });
      setShowDocForm(false);
      
      // Actualizar la lista local inmediatamente sin hacer GET
      setDocumentos(prev => [...prev, nuevoDoc]);
      
      // Intentar recargar desde el servidor en segundo plano (silencioso)
      setTimeout(() => {
        cargarDocumentos(false);
      }, 1000);
    } catch (err) {
      console.error("❌ Error creando documento:", err);
      const error = err as { response?: { data?: { detail?: string; message?: string; ci?: string[]; documento_url?: string[] }; }; message?: string };
      console.error("❌ Respuesta completa del error:", error?.response);
      const errorMsg = error?.response?.data?.detail || 
                      error?.response?.data?.message ||
                      error?.response?.data?.ci?.[0] ||
                      error?.response?.data?.documento_url?.[0] ||
                      error?.message || 
                      "Error al agregar documento";
      showNotification("error", `❌ ${errorMsg}`);
    }
  };

  const handleDeleteDocumento = async (docId: number) => {
    if (!confirm("¿Estás seguro de eliminar este documento?")) return;
    
    try {
      console.log("🗑️ Eliminando documento ID:", docId);
      await deleteDocumentacion(docId);
      console.log("✅ Documento eliminado");
      showNotification("success", "✅ Documento eliminado");
      
      // Actualizar la lista local inmediatamente
      setDocumentos(prev => prev.filter(doc => doc.id !== docId));
      
      // Intentar recargar desde el servidor en segundo plano (silencioso)
      setTimeout(() => cargarDocumentos(false), 1000);
    } catch (err) {
      console.error("❌ Error eliminando documento:", err);
      const error = err as { response?: { data?: { detail?: string; message?: string }; }; message?: string };
      const errorMsg = error?.response?.data?.detail || 
                      error?.response?.data?.message || 
                      error?.message || 
                      "Error al eliminar documento";
      showNotification("error", `❌ ${errorMsg}`);
    }
  };

  // ============= FUNCIONES PARA TRABAJO (HU14) =============
  const cargarTrabajos = async (mostrarError = true) => {
    if (!id) return;
    setLoadingWork(true);
    try {
      console.log("🔄 Cargando trabajos para cliente ID:", id);
      const works = await getTrabajosByCliente(parseInt(id));
      console.log("✅ Trabajos cargados:", works);
      setTrabajos(works);
    } catch (err) {
      if (mostrarError) {
        console.error("❌ Error cargando trabajos:", err);
        const error = err as { response?: { data?: { detail?: string; message?: string }; }; message?: string };
        const errorMsg = error?.response?.data?.detail || 
                        error?.response?.data?.message || 
                        error?.message || 
                        "Error al cargar información laboral";
        showNotification("error", `❌ ${errorMsg}`);
      } else {
        console.log("⚠️ Error silencioso cargando trabajos (esperado después de crear)");
      }
    } finally {
      setLoadingWork(false);
    }
  };

  const handleCreateTrabajo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    // Validaciones
    if (!workForm.cargo.trim()) {
      showNotification("error", "❌ El cargo es requerido");
      return;
    }
    if (!workForm.empresa.trim()) {
      showNotification("error", "❌ La empresa es requerida");
      return;
    }
    if (!workForm.extracto_url.trim()) {
      showNotification("error", "❌ La URL del extracto bancario es requerida");
      return;
    }
    if (!workForm.salario || parseFloat(workForm.salario) <= 0) {
      showNotification("error", "❌ El salario debe ser mayor a 0");
      return;
    }
    if (!workForm.ubicacion.trim()) {
      showNotification("error", "❌ La ubicación es requerida");
      return;
    }
    if (!workForm.descripcion.trim()) {
      showNotification("error", "❌ La descripción es requerida");
      return;
    }

    try {
      console.log("✨ Creando trabajo para cliente ID:", id);
      const input: CreateTrabajoInput = {
        cargo: workForm.cargo.trim(),
        empresa: workForm.empresa.trim(),
        salario: parseFloat(workForm.salario),
        ubicacion: workForm.ubicacion.trim(),
        descripcion: workForm.descripcion.trim(),
        extracto_url: workForm.extracto_url.trim(),
        id_cliente: parseInt(id)
      };
      console.log("📝 Datos del trabajo:", input);
      
      const nuevoTrabajo = await createTrabajo(input);
      console.log("✅ Trabajo creado:", nuevoTrabajo);
      
      showNotification("success", "✅ Información laboral agregada");
      resetWorkForm();
      
      // Actualizar la lista local inmediatamente
      setTrabajos(prev => [...prev, nuevoTrabajo]);
      
      // Intentar recargar desde el servidor en segundo plano (silencioso)
      setTimeout(() => cargarTrabajos(false), 1000);
    } catch (err) {
      console.error("❌ Error creando trabajo:", err);
      const error = err as { response?: { data?: { detail?: string; message?: string }; }; message?: string };
      const errorMsg = error?.response?.data?.detail || 
                      error?.response?.data?.message || 
                      error?.message || 
                      "Error al agregar información laboral";
      showNotification("error", `❌ ${errorMsg}`);
    }
  };

  const handleUpdateTrabajo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWork) return;

    try {
      const input: UpdateTrabajoInput = {
        cargo: workForm.cargo,
        empresa: workForm.empresa,
        salario: parseFloat(workForm.salario),
        ubicacion: workForm.ubicacion || undefined,
        descripcion: workForm.descripcion || undefined,
        extracto_url: workForm.extracto_url || undefined
      };
      await updateTrabajo(editingWork.id, input);
      showNotification("success", "✅ Información laboral actualizada");
      resetWorkForm();
      
      // Actualizar la lista local inmediatamente
      setTrabajos(prev => prev.map(t => 
        t.id === editingWork.id ? { ...t, ...input } : t
      ));
      
      // Intentar recargar desde el servidor en segundo plano (silencioso)
      setTimeout(() => cargarTrabajos(false), 1000);
    } catch (err) {
      console.error("Error actualizando trabajo:", err);
      showNotification("error", "❌ Error al actualizar información laboral");
    }
  };

  const handleDeleteTrabajo = async (workId: number) => {
    if (!confirm("¿Estás seguro de eliminar esta información laboral?")) return;
    
    try {
      await deleteTrabajo(workId);
      showNotification("success", "✅ Información laboral eliminada");
      
      // Actualizar la lista local inmediatamente
      setTrabajos(prev => prev.filter(t => t.id !== workId));
      
      // Intentar recargar desde el servidor en segundo plano (silencioso)
      setTimeout(() => cargarTrabajos(false), 1000);
    } catch (err) {
      console.error("Error eliminando trabajo:", err);
      showNotification("error", "❌ Error al eliminar información laboral");
    }
  };

  const startEditWork = (work: Trabajo) => {
    setEditingWork(work);
    setWorkForm({
      cargo: work.cargo,
      empresa: work.empresa,
      salario: String(work.salario),
      ubicacion: work.ubicacion || "",
      descripcion: work.descripcion || "",
      extracto_url: work.extracto_url || ""
    });
    setShowWorkForm(true);
  };

  const resetWorkForm = () => {
    setWorkForm({
      cargo: "",
      empresa: "",
      salario: "",
      ubicacion: "",
      descripcion: "",
      extracto_url: ""
    });
    setEditingWork(null);
    setShowWorkForm(false);
  };

  // ============= FUNCIONES PARA DOMICILIO (HU15) =============
  const cargarDomicilios = async (mostrarError = true) => {
    if (!id) return;
    setLoadingAddress(true);
    try {
      console.log("🔄 Cargando domicilios para cliente ID:", id);
      const addresses = await getDomiciliosByCliente(parseInt(id));
      console.log("✅ Domicilios cargados:", addresses);
      setDomicilios(addresses);
    } catch (err) {
      if (mostrarError) {
        console.error("❌ Error cargando domicilios:", err);
        const error = err as { response?: { data?: { detail?: string; message?: string }; }; message?: string };
        const errorMsg = error?.response?.data?.detail || 
                        error?.response?.data?.message || 
                        error?.message || 
                        "Error al cargar domicilios";
        showNotification("error", `❌ ${errorMsg}`);
      } else {
        console.log("⚠️ Error silencioso cargando domicilios (esperado después de crear)");
      }
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleCreateDomicilio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    // Validaciones
    if (!addressForm.descripcion.trim()) {
      showNotification("error", "❌ La descripción de la dirección es requerida");
      return;
    }
    if (!addressForm.croquis_url.trim()) {
      showNotification("error", "❌ La URL del croquis es requerida");
      return;
    }
    if (!addressForm.numero_ref.trim()) {
      showNotification("error", "❌ El número de referencia es requerido");
      return;
    }

    try {
      console.log("✨ Creando domicilio para cliente ID:", id);
      const input: CreateDomicilioInput = {
        descripcion: addressForm.descripcion.trim(),
        es_propietario: addressForm.es_propietario,
        numero_ref: addressForm.numero_ref.trim(),
        croquis_url: addressForm.croquis_url.trim(),
        id_cliente: parseInt(id)
      };
      console.log("📝 Datos del domicilio:", input);
      
      const nuevoDomicilio = await createDomicilio(input);
      console.log("✅ Domicilio creado:", nuevoDomicilio);
      
      // Actualización optimista: agregar directamente al estado
      setDomicilios(prev => [...prev, nuevoDomicilio]);
      
      showNotification("success", "✅ Domicilio agregado exitosamente");
      resetAddressForm();
    } catch (err) {
      console.error("❌ Error creando domicilio:", err);
      const error = err as { response?: { data?: { detail?: string; message?: string; descripcion?: string[]; croquis_url?: string[]; numero_ref?: string[] }; }; message?: string };
      console.error("❌ Respuesta completa del error:", error?.response);
      const errorMsg = error?.response?.data?.detail || 
                      error?.response?.data?.message ||
                      error?.response?.data?.descripcion?.[0] ||
                      error?.response?.data?.croquis_url?.[0] ||
                      error?.response?.data?.numero_ref?.[0] ||
                      error?.message || 
                      "Error al agregar domicilio";
      showNotification("error", `❌ ${errorMsg}`);
    }
  };

  const handleUpdateDomicilio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddress) return;

    try {
      const input: UpdateDomicilioInput = {
        descripcion: addressForm.descripcion,
        es_propietario: addressForm.es_propietario,
        numero_ref: addressForm.numero_ref || undefined,
        croquis_url: addressForm.croquis_url || undefined
      };
      await updateDomicilio(editingAddress.id, input);
      
      // Actualización optimista: actualizar en el estado local
      setDomicilios(prev => prev.map(dom => 
        dom.id === editingAddress.id 
          ? { ...dom, ...input }
          : dom
      ));
      
      showNotification("success", "✅ Domicilio actualizado");
      resetAddressForm();
    } catch (err) {
      console.error("Error actualizando domicilio:", err);
      showNotification("error", "❌ Error al actualizar domicilio");
    }
  };

  const handleDeleteDomicilio = async (addressId: number) => {
    if (!confirm("¿Estás seguro de eliminar este domicilio?")) return;
    
    try {
      await deleteDomicilio(addressId);
      
      // Actualización optimista: eliminar del estado local
      setDomicilios(prev => prev.filter(dom => dom.id !== addressId));
      
      showNotification("success", "✅ Domicilio eliminado");
    } catch (err) {
      console.error("Error eliminando domicilio:", err);
      showNotification("error", "❌ Error al eliminar domicilio");
    }
  };

  const startEditAddress = (address: Domicilio) => {
    setEditingAddress(address);
    setAddressForm({
      descripcion: address.descripcion,
      es_propietario: address.es_propietario,
      numero_ref: address.numero_ref || "",
      croquis_url: address.croquis_url || ""
    });
    setShowAddressForm(true);
  };

  const resetAddressForm = () => {
    setAddressForm({
      descripcion: "",
      es_propietario: true,
      numero_ref: "",
      croquis_url: ""
    });
    setEditingAddress(null);
    setShowAddressForm(false);
  };

  // ============= RENDERIZADO =============
  if (loading) {
    return (
      <section className="ui-page">
        <PageHeader
          title="Detalle del Cliente"
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

  if (error || !cliente) {
    return (
      <section className="ui-page">
        <PageHeader
          title="Error"
          subtitle="No se pudo cargar el cliente"
          showBackButton={true}
          backPath="/app/clientes"
        />
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>❌</div>
          <p style={{ color: "var(--danger)", fontSize: "18px", marginBottom: "24px" }}>
            {error || "Cliente no encontrado"}
          </p>
          <button onClick={() => navigate("/app/clientes")} className="ui-btn ui-btn--primary">
            ← Volver a clientes
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="ui-page">
      {/* Notificaciones */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <PageHeader
        title={`${cliente.nombre} ${cliente.apellido}`}
        subtitle={`Cliente #${cliente.id}`}
        showBackButton={true}
        backPath="/app/clientes"
        actions={
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => navigate('/app/creditos')}
              style={{
                padding: "8px 16px",
                background: "#1e90ff",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                transition: "all 0.3s ease",
                boxShadow: "0 2px 8px rgba(30, 144, 255, 0.3)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#1873cc";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(30, 144, 255, 0.4)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#1e90ff";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(30, 144, 255, 0.3)";
              }}
            >
              📋 Ver Créditos
            </button>
            <Link 
              to={`/app/clientes/${cliente.id}/editar`}
              className="ui-btn ui-btn--primary"
            >
              ✏️ Editar
            </Link>
          </div>
        }
      />

      {/* Header con información básica */}
      <div className="ui-card" style={{ marginBottom: "24px" }}>
        <div style={{ 
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "32px",
          borderRadius: "12px 12px 0 0",
          color: "#fff"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
              fontWeight: "bold",
              border: "3px solid rgba(255, 255, 255, 0.3)"
            }}>
              {cliente.nombre.charAt(0).toUpperCase()}{cliente.apellido.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "28px", fontWeight: "600" }}>
                {cliente.nombre} {cliente.apellido}
              </h2>
              <p style={{ margin: "8px 0 0", opacity: 0.9, fontSize: "16px" }}>
                📞 {cliente.telefono}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: "flex", 
        gap: "8px", 
        marginBottom: "24px",
        borderBottom: "2px solid #e5e7eb",
        overflowX: "auto"
      }}>
        <button
          onClick={() => setActiveTab("info")}
          style={{
            padding: "12px 24px",
            background: activeTab === "info" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "transparent",
            color: activeTab === "info" ? "#fff" : "var(--text)",
            border: "none",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
            transition: "all 0.3s",
            whiteSpace: "nowrap"
          }}
        >
          📋 Información General
        </button>
        <button
          onClick={() => setActiveTab("documentacion")}
          style={{
            padding: "12px 24px",
            background: activeTab === "documentacion" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "transparent",
            color: activeTab === "documentacion" ? "#fff" : "var(--text)",
            border: "none",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
            transition: "all 0.3s",
            whiteSpace: "nowrap"
          }}
        >
          📄 Documentación
        </button>
        <button
          onClick={() => setActiveTab("trabajo")}
          style={{
            padding: "12px 24px",
            background: activeTab === "trabajo" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "transparent",
            color: activeTab === "trabajo" ? "#fff" : "var(--text)",
            border: "none",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
            transition: "all 0.3s",
            whiteSpace: "nowrap"
          }}
        >
          💼 Información Laboral
        </button>
        <button
          onClick={() => setActiveTab("domicilio")}
          style={{
            padding: "12px 24px",
            background: activeTab === "domicilio" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "transparent",
            color: activeTab === "domicilio" ? "#fff" : "var(--text)",
            border: "none",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
            transition: "all 0.3s",
            whiteSpace: "nowrap"
          }}
        >
          🏠 Domicilio
        </button>
      </div>

      {/* Contenido de tabs */}
      <div className="ui-card">
        {/* TAB: Información General */}
        {activeTab === "info" && (
          <div style={{ padding: "32px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "24px" }}>
              📋 Información General
            </h3>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "24px"
            }}>
              <div style={{
                padding: "20px",
                background: "rgba(102, 126, 234, 0.05)",
                borderRadius: "12px",
                border: "1px solid rgba(102, 126, 234, 0.1)"
              }}>
                <div style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "8px" }}>
                  Nombre Completo
                </div>
                <div style={{ fontSize: "18px", fontWeight: "600", color: "#667eea" }}>
                  {cliente.nombre} {cliente.apellido}
                </div>
              </div>
              <div style={{
                padding: "20px",
                background: "rgba(118, 75, 162, 0.05)",
                borderRadius: "12px",
                border: "1px solid rgba(118, 75, 162, 0.1)"
              }}>
                <div style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "8px" }}>
                  Teléfono
                </div>
                <div style={{ fontSize: "18px", fontWeight: "600", color: "#764ba2" }}>
                  📱 {cliente.telefono}
                </div>
              </div>
              <div style={{
                padding: "20px",
                background: "rgba(16, 185, 129, 0.05)",
                borderRadius: "12px",
                border: "1px solid rgba(16, 185, 129, 0.1)"
              }}>
                <div style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "8px" }}>
                  Fecha de Registro
                </div>
                <div style={{ fontSize: "18px", fontWeight: "600", color: "#10b981" }}>
                  🗓️ {cliente.fecha_registro 
                    ? new Date(cliente.fecha_registro).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : "N/A"
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Documentación (HU13) */}
        {activeTab === "documentacion" && (
          <div style={{ padding: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: "600", margin: 0 }}>
                📄 Documentación del Cliente
              </h3>
              <button
                onClick={() => setShowDocForm(!showDocForm)}
                className="ui-btn ui-btn--primary"
              >
                {showDocForm ? "✖ Cancelar" : "➕ Agregar Documento"}
              </button>
            </div>

            {/* Formulario para agregar documento */}
            {showDocForm && (
              <form onSubmit={handleCreateDocumento} style={{
                background: "rgba(102, 126, 234, 0.05)",
                padding: "24px",
                borderRadius: "12px",
                marginBottom: "24px"
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                      CI <span style={{ color: "red" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={docForm.ci}
                      onChange={(e) => setDocForm({ ...docForm, ci: e.target.value })}
                      placeholder="Ej: 7845123"
                      required
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        border: "1px solid #d1d5db",
                        fontSize: "16px"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                      URL del Documento <span style={{ color: "red" }}>*</span>
                    </label>
                    <input
                      type="url"
                      value={docForm.documento_url}
                      onChange={(e) => setDocForm({ ...docForm, documento_url: e.target.value })}
                      placeholder="https://ejemplo.com/documento.pdf"
                      required
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        border: "1px solid #d1d5db",
                        fontSize: "16px"
                      }}
                    />
                  </div>
                </div>
                <button type="submit" className="ui-btn ui-btn--primary">
                  💾 Guardar Documento
                </button>
              </form>
            )}

            {/* Lista de documentos */}
            {loadingDocs ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>⏳</div>
                <p>Cargando documentos...</p>
              </div>
            ) : documentos.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📄</div>
                <p style={{ color: "var(--text-muted)", fontSize: "16px" }}>
                  No hay documentos registrados para este cliente
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "16px" }}>
                {documentos.map((doc) => (
                  <div key={doc.id} style={{
                    padding: "20px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "all 0.3s",
                    cursor: "pointer"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.1)";
                    e.currentTarget.style.borderColor = "#667eea";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = "#e5e7eb";
                  }}>
                    <div>
                      <div style={{ fontWeight: "600", fontSize: "16px", marginBottom: "4px" }}>
                        🆔 CI: {doc.ci}
                      </div>
                      {doc.documento_url && (
                        <a 
                          href={doc.documento_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: "#667eea", fontSize: "14px" }}
                        >
                          🔗 Ver documento
                        </a>
                      )}
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                        📅 Registrado: {new Date(doc.fecha_registro).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDocumento(doc.id)}
                      style={{
                        background: "#ef4444",
                        color: "#fff",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "14px"
                      }}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: Trabajo (HU14) */}
        {activeTab === "trabajo" && (
          <div style={{ padding: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: "600", margin: 0 }}>
                💼 Información Laboral
              </h3>
              <button
                onClick={() => {
                  if (showWorkForm) {
                    resetWorkForm();
                  } else {
                    setShowWorkForm(true);
                  }
                }}
                className="ui-btn ui-btn--primary"
              >
                {showWorkForm ? "✖ Cancelar" : "➕ Agregar Trabajo"}
              </button>
            </div>

            {/* Formulario para agregar/editar trabajo */}
            {showWorkForm && (
              <form onSubmit={editingWork ? handleUpdateTrabajo : handleCreateTrabajo} style={{
                background: "rgba(102, 126, 234, 0.05)",
                padding: "24px",
                borderRadius: "12px",
                marginBottom: "24px"
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                      Cargo <span style={{ color: "red" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={workForm.cargo}
                      onChange={(e) => setWorkForm({ ...workForm, cargo: e.target.value })}
                      placeholder="Ej: Gerente Comercial"
                      required
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        border: "1px solid #d1d5db",
                        fontSize: "16px"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                      Empresa <span style={{ color: "red" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={workForm.empresa}
                      onChange={(e) => setWorkForm({ ...workForm, empresa: e.target.value })}
                      placeholder="Ej: Empresa XYZ S.A."
                      required
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        border: "1px solid #d1d5db",
                        fontSize: "16px"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                      Salario (Bs.) <span style={{ color: "red" }}>*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={workForm.salario}
                      onChange={(e) => setWorkForm({ ...workForm, salario: e.target.value })}
                      placeholder="Ej: 5000.00"
                      required
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        border: "1px solid #d1d5db",
                        fontSize: "16px"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                      Ubicación
                    </label>
                    <input
                      type="text"
                      value={workForm.ubicacion}
                      onChange={(e) => setWorkForm({ ...workForm, ubicacion: e.target.value })}
                      placeholder="Ej: Zona Sur, La Paz"
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        border: "1px solid #d1d5db",
                        fontSize: "16px"
                      }}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                      Descripción
                    </label>
                    <textarea
                      value={workForm.descripcion}
                      onChange={(e) => setWorkForm({ ...workForm, descripcion: e.target.value })}
                      placeholder="Descripción del puesto..."
                      rows={3}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        border: "1px solid #d1d5db",
                        fontSize: "16px",
                        fontFamily: "inherit"
                      }}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                      URL Extracto Bancario
                    </label>
                    <input
                      type="url"
                      value={workForm.extracto_url}
                      onChange={(e) => setWorkForm({ ...workForm, extracto_url: e.target.value })}
                      placeholder="https://ejemplo.com/extracto.pdf"
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        border: "1px solid #d1d5db",
                        fontSize: "16px"
                      }}
                    />
                  </div>
                </div>
                <button type="submit" className="ui-btn ui-btn--primary">
                  {editingWork ? "💾 Actualizar" : "💾 Guardar"} Trabajo
                </button>
              </form>
            )}

            {/* Lista de trabajos */}
            {loadingWork ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>⏳</div>
                <p>Cargando información laboral...</p>
              </div>
            ) : trabajos.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>💼</div>
                <p style={{ color: "var(--text-muted)", fontSize: "16px" }}>
                  No hay información laboral registrada para este cliente
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "16px" }}>
                {trabajos.map((trabajo) => (
                  <div key={trabajo.id} style={{
                    padding: "24px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    transition: "all 0.3s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.1)";
                    e.currentTarget.style.borderColor = "#667eea";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = "#e5e7eb";
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "#667eea" }}>
                          {trabajo.cargo}
                        </h4>
                        <p style={{ margin: "4px 0", color: "var(--text-muted)" }}>
                          🏢 {trabajo.empresa}
                        </p>
                      </div>
                      <div style={{ fontSize: "20px", fontWeight: "700", color: "#10b981" }}>
                        Bs. {parseFloat(String(trabajo.salario)).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    {trabajo.ubicacion && (
                      <p style={{ margin: "8px 0", fontSize: "14px" }}>
                        📍 {trabajo.ubicacion}
                      </p>
                    )}
                    {trabajo.descripcion && (
                      <p style={{ margin: "8px 0", fontSize: "14px", color: "var(--text-muted)" }}>
                        {trabajo.descripcion}
                      </p>
                    )}
                    {trabajo.extracto_url && (
                      <a 
                        href={trabajo.extracto_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: "#667eea", fontSize: "14px", marginTop: "8px", display: "inline-block" }}
                      >
                        📄 Ver extracto bancario
                      </a>
                    )}
                    <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => startEditWork(trabajo)}
                        className="ui-btn ui-btn--ghost"
                        style={{ fontSize: "14px" }}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDeleteTrabajo(trabajo.id)}
                        style={{
                          background: "#ef4444",
                          color: "#fff",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "14px"
                        }}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: Domicilio (HU15) */}
        {activeTab === "domicilio" && (
          <div style={{ padding: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: "600", margin: 0 }}>
                🏠 Domicilio del Cliente
              </h3>
              <button
                onClick={() => {
                  if (showAddressForm) {
                    resetAddressForm();
                  } else {
                    setShowAddressForm(true);
                  }
                }}
                className="ui-btn ui-btn--primary"
              >
                {showAddressForm ? "✖ Cancelar" : "➕ Agregar Domicilio"}
              </button>
            </div>

            {/* Formulario para agregar/editar domicilio */}
            {showAddressForm && (
              <form onSubmit={editingAddress ? handleUpdateDomicilio : handleCreateDomicilio} style={{
                background: "rgba(102, 126, 234, 0.05)",
                padding: "24px",
                borderRadius: "12px",
                marginBottom: "24px"
              }}>
                <div style={{ display: "grid", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                      Descripción de la Dirección <span style={{ color: "red" }}>*</span>
                    </label>
                    <textarea
                      value={addressForm.descripcion}
                      onChange={(e) => setAddressForm({ ...addressForm, descripcion: e.target.value })}
                      placeholder="Ej: Av. 6 de Agosto #1234, Edificio Torre Azul, Piso 5, Dpto 502"
                      required
                      rows={3}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        border: "1px solid #d1d5db",
                        fontSize: "16px",
                        fontFamily: "inherit"
                      }}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                        ¿Es propietario?
                      </label>
                      <select
                        value={addressForm.es_propietario ? "true" : "false"}
                        onChange={(e) => setAddressForm({ ...addressForm, es_propietario: e.target.value === "true" })}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: "8px",
                          border: "1px solid #d1d5db",
                          fontSize: "16px"
                        }}
                      >
                        <option value="true">Sí, es propietario</option>
                        <option value="false">No, es inquilino</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                        Número de Referencia
                      </label>
                      <input
                        type="text"
                        value={addressForm.numero_ref}
                        onChange={(e) => setAddressForm({ ...addressForm, numero_ref: e.target.value })}
                        placeholder="Ej: 502-TA"
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: "8px",
                          border: "1px solid #d1d5db",
                          fontSize: "16px"
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                      URL del Croquis
                    </label>
                    <input
                      type="url"
                      value={addressForm.croquis_url}
                      onChange={(e) => setAddressForm({ ...addressForm, croquis_url: e.target.value })}
                      placeholder="https://ejemplo.com/croquis.jpg"
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        border: "1px solid #d1d5db",
                        fontSize: "16px"
                      }}
                    />
                  </div>
                </div>
                <button type="submit" className="ui-btn ui-btn--primary">
                  {editingAddress ? "💾 Actualizar" : "💾 Guardar"} Domicilio
                </button>
              </form>
            )}

            {/* Lista de domicilios */}
            {loadingAddress ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>⏳</div>
                <p>Cargando domicilios...</p>
              </div>
            ) : domicilios.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏠</div>
                <p style={{ color: "var(--text-muted)", fontSize: "16px" }}>
                  No hay domicilios registrados para este cliente
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "16px" }}>
                {domicilios.map((domicilio) => (
                  <div key={domicilio.id} style={{
                    padding: "24px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    transition: "all 0.3s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.1)";
                    e.currentTarget.style.borderColor = "#667eea";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = "#e5e7eb";
                  }}>
                    <div style={{ marginBottom: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <span style={{ 
                          fontSize: "24px", 
                          background: domicilio.es_propietario ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                          padding: "8px",
                          borderRadius: "8px"
                        }}>
                          {domicilio.es_propietario ? "🏠" : "🏢"}
                        </span>
                        <span style={{ 
                          padding: "4px 12px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "600",
                          background: domicilio.es_propietario ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                          color: domicilio.es_propietario ? "#10b981" : "#ef4444"
                        }}>
                          {domicilio.es_propietario ? "Propietario" : "Inquilino"}
                        </span>
                      </div>
                      <p style={{ fontSize: "16px", margin: "12px 0", lineHeight: "1.6" }}>
                        📍 {domicilio.descripcion}
                      </p>
                      {domicilio.numero_ref && (
                        <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "4px 0" }}>
                          🔢 Ref: {domicilio.numero_ref}
                        </p>
                      )}
                      {domicilio.croquis_url && (
                        <a 
                          href={domicilio.croquis_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: "#667eea", fontSize: "14px", marginTop: "8px", display: "inline-block" }}
                        >
                          🗺️ Ver croquis
                        </a>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => startEditAddress(domicilio)}
                        className="ui-btn ui-btn--ghost"
                        style={{ fontSize: "14px" }}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDeleteDomicilio(domicilio.id)}
                        style={{
                          background: "#ef4444",
                          color: "#fff",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "14px"
                        }}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sección de Créditos */}
        {creditos.length > 0 && (
          <div style={{ marginTop: "32px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              📊 Historial de Créditos ({creditos.length})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {creditos.map((credito) => {
                // Mostrar banner para créditos en SOLICITADO (estado inicial)
                const mostrarBanner = credito.estado === 'SOLICITADO';

                return (
                  <div key={credito.id}>
                    {mostrarBanner && (
                      <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        padding: "16px",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        borderRadius: "12px",
                        marginBottom: "12px",
                        boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)",
                        animation: "slideDown 0.5s ease-out"
                      }}>
                        <div style={{ color: "#fff", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                          🎉 ¡Crédito creado exitosamente!
                        </div>
                        <div style={{ color: "rgba(255,255,255,0.9)", fontSize: "14px" }}>
                          Crédito #{credito.id} - Bs. {credito.monto?.toLocaleString() || '0.00'}
                        </div>
                        <button
                          onClick={() => navigate(`/app/creditos/${credito.id}/workflow`)}
                          style={{
                            padding: "10px 16px",
                            background: "#fff",
                            color: "#667eea",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "600",
                            transition: "all 0.3s ease",
                            width: "100%",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = "#f0f0f0";
                            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 16px rgba(0,0,0,0.2)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = "#fff";
                            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                          }}
                        >
                          ▶️ Continuar Workflow
                        </button>
                      </div>
                    )}
                    <div style={{
                      padding: "16px",
                      background: "#f8f9fa",
                      borderRadius: "12px",
                      border: "1px solid #e9ecef",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <div>
                        <p style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 4px 0" }}>
                          📄 Crédito #{credito.id}
                        </p>
                        <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "0" }}>
                          Bs. {credito.monto?.toLocaleString() || '0.00'} • Estado: <span style={{ fontWeight: "600", color: credito.estado === 'SOLICITADO' ? '#3b82f6' : '#10b981' }}>{credito.estado}</span>
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => navigate(`/app/creditos/${credito.id}/editar`)}
                          style={{
                            padding: "8px 14px",
                            background: "#f59e0b",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "600",
                            transition: "all 0.3s ease"
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = "#d97706";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = "#f59e0b";
                          }}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => navigate(`/app/creditos/${credito.id}/workflow`)}
                          className="ui-btn ui-btn--primary"
                        >
                          👁️ Ver Workflow
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default VerClientePage;
