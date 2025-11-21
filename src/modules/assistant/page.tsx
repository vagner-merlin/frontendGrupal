import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../shared/components/PageHeader";
import { sendMessage, listConversaciones, getHistorial, deleteConversacion } from "./service";
import type { Mensaje, Conversacion } from "./types";
import "../../styles/theme.css";

const AssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [inputMensaje, setInputMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversacionActual, setConversacionActual] = useState<number | null>(null);
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const mensajesEndRef = useRef<HTMLDivElement>(null);

  // Scroll automático al último mensaje
  const scrollToBottom = () => {
    mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  // Cargar conversaciones al montar
  useEffect(() => {
    cargarConversaciones();
  }, []);

  const cargarConversaciones = async () => {
    try {
      const data = await listConversaciones();
      setConversaciones(data);
    } catch (error) {
      console.error("Error al cargar conversaciones:", error);
    }
  };

  const cargarHistorial = async (conversacionId: number) => {
    try {
      setLoading(true);
      const data = await getHistorial(conversacionId);
      setMensajes(data.mensajes || []);
      setConversacionActual(conversacionId);
    } catch (error) {
      console.error("Error al cargar historial:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMensaje.trim() || loading) return;

    const mensajeTexto = inputMensaje.trim();
    setInputMensaje("");
    setLoading(true);

    // Agregar mensaje del usuario inmediatamente (optimista)
    const mensajeTemporal: Mensaje = {
      id: Date.now(),
      rol: "user",
      contenido: mensajeTexto,
      fecha_creacion: new Date().toISOString(),
    };
    setMensajes((prev) => [...prev, mensajeTemporal]);

    try {
      const response = await sendMessage({
        mensaje: mensajeTexto,
        conversacion_id: conversacionActual || undefined,
        nuevo_chat: !conversacionActual,
      });

      // Actualizar con mensajes reales del servidor
      setMensajes((prev) => {
        const sinTemporal = prev.filter((m) => m.id !== mensajeTemporal.id);
        return [
          ...sinTemporal,
          response.mensaje_usuario,
          response.mensaje_asistente,
        ];
      });

      setConversacionActual(response.conversacion_id);
      await cargarConversaciones();
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      // Agregar mensaje de error
      setMensajes((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          rol: "assistant",
          contenido: "❌ Error al procesar el mensaje. Intenta de nuevo.",
          fecha_creacion: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleNuevaConversacion = () => {
    setMensajes([]);
    setConversacionActual(null);
    setInputMensaje("");
  };

  const handleEliminarConversacion = async (id: number) => {
    if (!confirm("¿Eliminar esta conversación?")) return;

    try {
      await deleteConversacion(id);
      await cargarConversaciones();
      if (conversacionActual === id) {
        handleNuevaConversacion();
      }
    } catch (error) {
      console.error("Error al eliminar conversación:", error);
    }
  };

  return (
    <section className="ui-page">
      <PageHeader
        title="🤖 Asistente de IA - Grupo Gerente"
        description="Análisis de datos, reportes y consultas empresariales"
        onBack={() => navigate("/app/dashboard")}
      />

      <div style={{ display: "flex", height: "calc(100vh - 200px)", gap: "16px" }}>
        {/* Sidebar de conversaciones */}
        {showSidebar && (
          <div
            style={{
              width: "280px",
              background: "var(--ui-bg)",
              borderRadius: "12px",
              padding: "16px",
              overflowY: "auto",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <button
              onClick={handleNuevaConversacion}
              className="ui-btn ui-btn--primary"
              style={{ width: "100%", marginBottom: "16px" }}
            >
              ➕ Nueva Conversación
            </button>

            <h3 style={{ fontSize: "14px", marginBottom: "12px", color: "var(--ui-text-secondary)" }}>
              Conversaciones
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {conversaciones.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => cargarHistorial(conv.id)}
                  style={{
                    padding: "12px",
                    background:
                      conversacionActual === conv.id
                        ? "rgba(102, 126, 234, 0.1)"
                        : "var(--ui-bg-secondary)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    border:
                      conversacionActual === conv.id
                        ? "2px solid var(--ui-primary)"
                        : "2px solid transparent",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (conversacionActual !== conv.id) {
                      e.currentTarget.style.background = "rgba(102, 126, 234, 0.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (conversacionActual !== conv.id) {
                      e.currentTarget.style.background = "var(--ui-bg-secondary)";
                    }
                  }}
                >
                  <div style={{ fontSize: "14px", fontWeight: "500", marginBottom: "4px" }}>
                    {conv.titulo.substring(0, 40)}
                    {conv.titulo.length > 40 && "..."}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--ui-text-secondary)" }}>
                    {conv.cantidad_mensajes} mensajes
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEliminarConversacion(conv.id);
                    }}
                    style={{
                      marginTop: "8px",
                      padding: "4px 8px",
                      background: "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Área de chat */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "var(--ui-bg)",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          {/* Header del chat */}
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid var(--ui-border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: "18px" }}>
                {conversacionActual
                  ? `Conversación #${conversacionActual}`
                  : "Nueva Conversación"}
              </h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "var(--ui-text-secondary)" }}>
                Pregunta lo que necesites sobre tu empresa
              </p>
            </div>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="ui-btn ui-btn--ghost"
            >
              {showSidebar ? "◀" : "▶"}
            </button>
          </div>

          {/* Mensajes */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {mensajes.length === 0 ? (
              <div style={{ textAlign: "center", marginTop: "60px" }}>
                <div style={{ fontSize: "64px", marginBottom: "16px" }}>🤖</div>
                <h3 style={{ color: "var(--ui-text-secondary)" }}>
                  ¡Hola! Soy tu asistente Grupo Gerente
                </h3>
                <p style={{ color: "var(--ui-text-secondary)", maxWidth: "500px", margin: "8px auto" }}>
                  Puedo ayudarte a analizar datos, generar reportes, consultar clientes, créditos y mucho más.
                </p>
                <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "12px", maxWidth: "600px", margin: "24px auto" }}>
                  <button
                    onClick={() => setInputMensaje("¿Cuántos clientes tengo registrados?")}
                    className="ui-btn ui-btn--ghost"
                    style={{ textAlign: "left", padding: "12px 16px" }}
                  >
                    💡 ¿Cuántos clientes tengo registrados?
                  </button>
                  <button
                    onClick={() => setInputMensaje("Dame un reporte de créditos del último mes")}
                    className="ui-btn ui-btn--ghost"
                    style={{ textAlign: "left", padding: "12px 16px" }}
                  >
                    📊 Dame un reporte de créditos del último mes
                  </button>
                  <button
                    onClick={() => setInputMensaje("¿Cuál es el cliente con mayor monto de crédito?")}
                    className="ui-btn ui-btn--ghost"
                    style={{ textAlign: "left", padding: "12px 16px" }}
                  >
                    🏆 ¿Cuál es el cliente con mayor monto de crédito?
                  </button>
                </div>
              </div>
            ) : (
              mensajes.map((mensaje) => (
                <div
                  key={mensaje.id}
                  style={{
                    display: "flex",
                    justifyContent:
                      mensaje.rol === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "70%",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      background:
                        mensaje.rol === "user"
                          ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                          : "var(--ui-bg-secondary)",
                      color:
                        mensaje.rol === "user"
                          ? "#fff"
                          : "var(--ui-text-primary)",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    <div style={{ fontSize: "14px", whiteSpace: "pre-wrap" }}>
                      {mensaje.contenido}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        marginTop: "8px",
                        opacity: 0.7,
                      }}
                    >
                      {new Date(mensaje.fecha_creacion).toLocaleTimeString(
                        "es-ES",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "12px",
                    background: "var(--ui-bg-secondary)",
                  }}
                >
                  <div style={{ fontSize: "14px" }}>⏳ Pensando...</div>
                </div>
              </div>
            )}

            <div ref={mensajesEndRef} />
          </div>

          {/* Input de mensaje */}
          <form
            onSubmit={handleEnviarMensaje}
            style={{
              padding: "16px",
              borderTop: "1px solid var(--ui-border)",
              display: "flex",
              gap: "12px",
            }}
          >
            <input
              type="text"
              value={inputMensaje}
              onChange={(e) => setInputMensaje(e.target.value)}
              placeholder="Escribe tu pregunta..."
              disabled={loading}
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: "8px",
                border: "1px solid var(--ui-border)",
                fontSize: "16px",
              }}
            />
            <button
              type="submit"
              disabled={!inputMensaje.trim() || loading}
              className="ui-btn ui-btn--primary"
              style={{ padding: "12px 24px" }}
            >
              {loading ? "⏳" : "📤"} Enviar
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default AssistantPage;
