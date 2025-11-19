import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/service";
import {
  obtenerConfiguracionPorEmpresa,
  crearConfiguracion,
  actualizarConfiguracionParcial,
  aplicarConfiguracion,
} from "./service";
import {
  getPerfilUserByUsuarioId,
  getEmpresaById,
  updatePerfilUserAvatar,
  updateEmpresaLogo,
} from "../empresa/service";
import type { Configuracion, ConfiguracionUpdate } from "./types";
import { FUENTES_DISPONIBLES } from "./types";
import PageHeader from "../../shared/components/PageHeader";

const COLORES_DISPONIBLES = [
  { name: "Azul", value: "#3b82f6" },
  { name: "Verde", value: "#10b981" },
  { name: "Naranja", value: "#f59e0b" },
  { name: "Rojo", value: "#ef4444" },
  { name: "Morado", value: "#8b5cf6" },
  { name: "Cian", value: "#06b6d4" },
  { name: "Rosa", value: "#ec4899" },
  { name: "Índigo", value: "#6366f1" },
  { name: "Verde Lima", value: "#84cc16" },
  { name: "Amarillo", value: "#eab308" },
  { name: "Teal", value: "#14b8a6" },
];

const PersonalizacionPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [config, setConfig] = useState<Configuracion | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "success" | "error"; texto: string } | null>(null);

  const [color, setColor] = useState("#3b82f6");
  const [tipoLetra, setTipoLetra] = useState("Arial");
  const [tema, setTema] = useState<"CLARO" | "OSCURO">("CLARO");

  // Estados para las fotos
  const [userAvatarUrl, setUserAvatarUrl] = useState<string>("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string>("");
  const [perfilId, setPerfilId] = useState<number | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Aplicar vista previa en tiempo real cuando cambian los valores
  useEffect(() => {
    if (!loading && user?.empresa_id) {
      const empresaId = typeof user.empresa_id === "string" ? parseInt(user.empresa_id) : user.empresa_id;
      const previewConfig: Configuracion = {
        id: config?.id || 0,
        empresa: empresaId,
        color,
        tipo_letra: tipoLetra,
        enum_tema: tema,
      };
      
      // Aplicar con un pequeño delay para evitar muchas actualizaciones
      const timeoutId = setTimeout(() => {
        aplicarConfiguracion(previewConfig);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [color, tipoLetra, tema, user?.empresa_id, config?.id, loading]);

  useEffect(() => {
    const cargarConfiguracion = async () => {
      if (!user?.empresa_id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const empresaId = typeof user.empresa_id === "string" ? parseInt(user.empresa_id) : user.empresa_id;
        const configEmpresa = await obtenerConfiguracionPorEmpresa(empresaId);

        if (configEmpresa) {
          setConfig(configEmpresa);
          setColor(configEmpresa.color);
          setTipoLetra(configEmpresa.tipo_letra);
          setTema(configEmpresa.enum_tema);
        }
      } catch (error) {
        console.error("❌ Error cargando configuración:", error);
        mostrarMensaje("error", "Error al cargar la configuración");
      } finally {
        setLoading(false);
      }
    };

    cargarConfiguracion();
  }, [user?.empresa_id]);

  const mostrarMensaje = (tipo: "success" | "error", texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 4000);
  };

  const guardarConfiguracion = async () => {
    if (!user?.empresa_id) {
      mostrarMensaje("error", "No se puede guardar: empresa no identificada");
      return;
    }

    try {
      setSaving(true);

      const datos: ConfiguracionUpdate = {
        color,
        tipo_letra: tipoLetra,
        enum_tema: tema,
      };

      let configActualizada: Configuracion;
      const empresaId = typeof user.empresa_id === "string" ? parseInt(user.empresa_id) : user.empresa_id;

      if (config?.id) {
        configActualizada = await actualizarConfiguracionParcial(config.id, datos);
        mostrarMensaje("success", "Configuración actualizada correctamente");
      } else {
        configActualizada = await crearConfiguracion({
          empresa: empresaId,
          color,
          tipo_letra: tipoLetra,
          enum_tema: tema,
        });
        mostrarMensaje("success", "Configuración creada correctamente");
      }

      setConfig(configActualizada);
      aplicarConfiguracion(configActualizada);
    } catch (error) {
      console.error("❌ Error guardando configuración:", error);
      mostrarMensaje("error", "Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  const previsualizarCambios = () => {
    mostrarMensaje("success", "🎨 Vista previa activa - Los cambios se aplican en tiempo real");
  };

  const restaurarDefecto = () => {
    setColor("#3b82f6");
    setTipoLetra("Arial");
    setTema("CLARO");
    
    // Aplicar inmediatamente la vista previa de los valores por defecto
    const defaultConfig: Configuracion = {
      id: config?.id || 0,
      empresa: typeof user?.empresa_id === "string" ? parseInt(user.empresa_id!) : user?.empresa_id || 0,
      color: "#3b82f6",
      tipo_letra: "Arial",
      enum_tema: "CLARO",
    };
    aplicarConfiguracion(defaultConfig);
    mostrarMensaje("success", "Valores restaurados a predeterminados");
  };

  if (loading) {
    return (
      <section className="page-section">
        <PageHeader title="Configuración del Sistema" subtitle="Personaliza tu aplicación" />
        <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
          <p>Cargando configuración...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <PageHeader
        title="Configuración del Sistema"
        subtitle="Personaliza colores, fuentes y tema"
        showBackButton={true}
        backPath="/app"
      />

      {mensaje && (
        <div
          style={{
            padding: "1rem",
            marginBottom: "1.5rem",
            borderRadius: "8px",
            backgroundColor: mensaje.tipo === "success" ? "#d1fae5" : "#fee2e2",
            color: mensaje.tipo === "success" ? "#065f46" : "#991b1b",
            border: `1px solid ${mensaje.tipo === "success" ? "#10b981" : "#ef4444"}`,
          }}
        >
          {mensaje.texto}
        </div>
      )}

      {/* Botón para cambiar fotos */}
      <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem", backgroundColor: "#f9fafb" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.25rem" }}>
              Fotos de Perfil y Empresa
            </h3>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "#6b7280" }}>
              Cambia tu foto de perfil y el logo de tu empresa
            </p>
          </div>
          <button
            onClick={() => navigate("/app/personalizacion/fotos")}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>📸</span>
            Cambiar Fotos
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: "2rem" }}>
        <div style={{ display: "grid", gap: "2rem" }}>
          {/* Color Primario */}
          <div>
            <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: 600 }}>
              Color Primario
            </label>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
              {COLORES_DISPONIBLES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "12px",
                    backgroundColor: c.value,
                    border: color === c.value ? "4px solid #fff" : "2px solid #e5e7eb",
                    boxShadow: color === c.value ? "0 0 0 2px #3b82f6" : "0 2px 4px rgba(0,0,0,0.1)",
                    cursor: "pointer",
                  }}
                  title={c.name}
                />
              ))}
            </div>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{
                width: "100%",
                height: "50px",
                borderRadius: "8px",
                border: "2px solid #e5e7eb",
                cursor: "pointer",
              }}
            />
            <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#6b7280" }}>
              Color actual: <strong>{color}</strong>
            </p>
          </div>

          {/* Tipo de Letra */}
          <div>
            <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: 600 }}>
              Tipo de Letra
            </label>
            <select
              value={tipoLetra}
              onChange={(e) => setTipoLetra(e.target.value)}
              className="ui-select"
              style={{
                width: "100%",
                padding: "0.75rem",
                fontSize: "1rem",
                borderRadius: "8px",
                border: "2px solid #e5e7eb",
              }}
            >
              {FUENTES_DISPONIBLES.map((fuente) => (
                <option key={fuente} value={fuente} style={{ fontFamily: fuente }}>
                  {fuente}
                </option>
              ))}
            </select>
            <p style={{ marginTop: "1rem", fontSize: "1.25rem", fontFamily: tipoLetra }}>
              Vista previa: El rápido zorro marrón salta sobre el perro perezoso
            </p>
          </div>

          {/* Tema Visual */}
          <div>
            <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: 600 }}>
              Tema Visual
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <button
                onClick={() => setTema("CLARO")}
                className={`ui-btn ${tema === "CLARO" ? "ui-btn--primary" : "ui-btn--ghost"}`}
                style={{
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span style={{ fontSize: "2rem" }}>☀️</span>
                <span>Tema Claro</span>
              </button>
              <button
                onClick={() => setTema("OSCURO")}
                className={`ui-btn ${tema === "OSCURO" ? "ui-btn--primary" : "ui-btn--ghost"}`}
                style={{
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span style={{ fontSize: "2rem" }}>🌙</span>
                <span>Tema Oscuro</span>
              </button>
            </div>
          </div>

          {/* Botones */}
          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
            <button onClick={restaurarDefecto} className="ui-btn ui-btn--ghost" disabled={saving}>
              Restaurar
            </button>
            <button onClick={previsualizarCambios} className="ui-btn ui-btn--secondary" disabled={saving}>
              Vista Previa
            </button>
            <button onClick={guardarConfiguracion} className="ui-btn ui-btn--primary" disabled={saving}>
              {saving ? "Guardando..." : config ? "Actualizar" : "Crear"}
            </button>
          </div>
        </div>
      </div>

      {config && (
        <div className="card" style={{ padding: "1.5rem", marginTop: "1.5rem", backgroundColor: "#f9fafb" }}>
          <h3 style={{ marginBottom: "1rem" }}>Configuración Actual</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div>
              <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>ID:</p>
              <p style={{ fontWeight: 600 }}>{config.id}</p>
            </div>
            <div>
              <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Color:</p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "6px",
                    backgroundColor: config.color,
                    border: "2px solid #e5e7eb",
                  }}
                />
                <p style={{ fontWeight: 600 }}>{config.color}</p>
              </div>
            </div>
            <div>
              <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Fuente:</p>
              <p style={{ fontWeight: 600, fontFamily: config.tipo_letra }}>{config.tipo_letra}</p>
            </div>
            <div>
              <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Tema:</p>
              <p style={{ fontWeight: 600 }}>
                {config.enum_tema === "OSCURO" ? "🌙 Oscuro" : "☀️ Claro"}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PersonalizacionPage;
