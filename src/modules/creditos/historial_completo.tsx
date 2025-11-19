// src/modules/creditos/historial_completo.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getHistorialCreditos, getHistorialByCI, eliminarCreditoPorCI } from "./service";
import "../../styles/theme.css";

interface HistorialItem {
  ci_cliente: string;
  nombre_cliente: string;
  apellido_cliente: string;
  cargo?: string;
  empresa_trabajo?: string;
  salario?: string;
  monto_prestamo?: string;
  estado_prestamo?: string;
  moneda?: string;
}

/**
 * HU19: Historial Completo de Créditos
 * Muestra el historial de todos los clientes o filtrado por CI
 */
const HistorialCompletoPage: React.FC = () => {
  const navigate = useNavigate();
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ci, setCi] = useState("");
  const [buscando, setBuscando] = useState(false);
  
  // Estados para el modal de eliminación
  const [modalEliminar, setModalEliminar] = useState(false);
  const [ciAEliminar, setCiAEliminar] = useState("");
  const [nombreClienteAEliminar, setNombreClienteAEliminar] = useState("");
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState("");

  // Cargar historial completo al montar
  useEffect(() => {
    cargarHistorialCompleto();
  }, []);

  const cargarHistorialCompleto = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getHistorialCreditos();
      setHistorial(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar historial:", err);
      setError("Error al cargar el historial de créditos");
      setHistorial([]);
    } finally {
      setLoading(false);
    }
  };

  const buscarPorCI = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ci.trim()) {
      setError("Por favor ingrese un número de CI");
      return;
    }

    setBuscando(true);
    setError("");
    try {
      const data = await getHistorialByCI(ci.trim());
      setHistorial(Array.isArray(data) ? data : []);
    } catch (err) {
      const error = err as Error;
      setError(error.message || "No se encontraron créditos para este CI");
      setHistorial([]);
    } finally {
      setBuscando(false);
    }
  };

  const limpiarBusqueda = () => {
    setCi("");
    cargarHistorialCompleto();
  };

  const abrirModalEliminar = (ciCliente: string, nombreCliente: string) => {
    // Validar que el CI no sea nulo o vacío
    if (!ciCliente || ciCliente === "null" || ciCliente === "undefined" || ciCliente.trim() === "") {
      alert("❌ No se puede eliminar: El cliente no tiene un CI válido registrado");
      return;
    }
    
    setCiAEliminar(ciCliente);
    setNombreClienteAEliminar(nombreCliente);
    setModalEliminar(true);
  };

  const cerrarModalEliminar = () => {
    setModalEliminar(false);
    setCiAEliminar("");
    setNombreClienteAEliminar("");
    setErrorEliminar("");
  };

  const confirmarEliminar = async () => {
    if (!ciAEliminar) return;
    
    setEliminando(true);
    setErrorEliminar("");
    try {
      await eliminarCreditoPorCI(ciAEliminar);
      
      // Recargar historial después de eliminar
      await cargarHistorialCompleto();
      
      // Cerrar modal
      cerrarModalEliminar();
      
      // Mostrar mensaje de éxito
      setError("");
      alert("✅ Crédito eliminado exitosamente");
    } catch (err) {
      const error = err as Error;
      setErrorEliminar(error.message || "No se pudo eliminar el crédito");
    } finally {
      setEliminando(false);
    }
  };

  const getEstadoBadge = (estado?: string) => {
    if (!estado) return null;

    const badges: Record<string, { color: string; bg: string }> = {
      SOLICITADO: { color: "#3b82f6", bg: "#eff6ff" },
      Pendiente: { color: "#f59e0b", bg: "#fffbeb" },
      Aprobado: { color: "#10b981", bg: "#f0fdf4" },
      Rechazado: { color: "#ef4444", bg: "#fef2f2" },
      DESENBOLSADO: { color: "#059669", bg: "#ecfdf5" },
      FINALIZADO: { color: "#6b7280", bg: "#f9fafb" },
    };

    const badge = badges[estado] || { color: "#6b7280", bg: "#f9fafb" };

    return (
      <span
        style={{
          display: "inline-block",
          padding: "6px 12px",
          borderRadius: "8px",
          fontSize: "13px",
          fontWeight: 600,
          color: badge.color,
          backgroundColor: badge.bg,
        }}
      >
        {estado}
      </span>
    );
  };

  // Agrupar por cliente
  const agruparPorCliente = () => {
    const grupos: Record<string, HistorialItem[]> = {};
    
    historial.forEach((item) => {
      const key = item.ci_cliente;
      if (!grupos[key]) {
        grupos[key] = [];
      }
      grupos[key].push(item);
    });

    return Object.entries(grupos);
  };

  const clientesAgrupados = agruparPorCliente();

  return (
    <section className="ui-page">
      {/* Header Mejorado */}
      <div style={{ 
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderRadius: "16px",
        padding: "32px",
        marginBottom: "32px",
        color: "white"
      }}>
        <button
          onClick={() => navigate("/app/creditos")}
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            color: "white",
            padding: "8px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 500,
            marginBottom: "16px"
          }}
        >
          ← Volver a Créditos
        </button>
        <h1 style={{ 
          margin: "0 0 8px 0", 
          fontSize: "32px", 
          fontWeight: 700,
          textShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          📜 Historial Completo de Créditos
        </h1>
        <p style={{ margin: 0, fontSize: "16px", opacity: 0.9 }}>
          Consulta el historial de todos los clientes o busca por CI específico
        </p>
      </div>

      {/* Estadísticas Rápidas */}
      {!loading && historial.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px"
        }}>
          <div style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "12px",
            padding: "20px",
            color: "white",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
          }}>
            <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>Total Clientes</div>
            <div style={{ fontSize: "36px", fontWeight: 700 }}>{clientesAgrupados.length}</div>
          </div>
          <div style={{
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            borderRadius: "12px",
            padding: "20px",
            color: "white",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
          }}>
            <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>Total Créditos</div>
            <div style={{ fontSize: "36px", fontWeight: 700 }}>
              {historial.filter(h => h.monto_prestamo).length}
            </div>
          </div>
          <div style={{
            background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            borderRadius: "12px",
            padding: "20px",
            color: "white",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
          }}>
            <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>Monto Total</div>
            <div style={{ fontSize: "36px", fontWeight: 700 }}>
              Bs. {historial
                .filter(h => h.monto_prestamo)
                .reduce((sum, h) => sum + parseFloat(h.monto_prestamo || "0"), 0)
                .toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      )}

      {/* Buscador Mejorado */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
      }}>
        <form onSubmit={buscarPorCI}>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 300px" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                fontWeight: 600,
                fontSize: "14px",
                color: "#374151"
              }}>
                🔍 Buscar por CI
              </label>
              <input
                type="text"
                placeholder="Ingrese el número de CI..."
                value={ci}
                onChange={(e) => setCi(e.target.value)}
                disabled={buscando}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "15px",
                  transition: "all 0.2s",
                  outline: "none"
                }}
                onFocus={(e) => e.target.style.borderColor = "#667eea"}
                onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>
            <button
              type="submit"
              disabled={buscando || !ci.trim()}
              style={{
                background: buscando || !ci.trim() 
                  ? "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)"
                  : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                fontSize: "15px",
                fontWeight: 600,
                cursor: buscando || !ci.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}
            >
              {buscando ? "⏳ Buscando..." : "🔍 Buscar"}
            </button>
            {ci && (
              <button
                type="button"
                onClick={limpiarBusqueda}
                disabled={loading}
                style={{
                  background: "white",
                  color: "#6b7280",
                  border: "2px solid #e5e7eb",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                ✖ Limpiar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Mensajes de error */}
      {error && (
        <div style={{
          background: "#fef2f2",
          border: "2px solid #fecaca",
          color: "#dc2626",
          padding: "16px 20px",
          borderRadius: "12px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontSize: "15px",
          fontWeight: 500
        }}>
          <span style={{ fontSize: "24px" }}>⚠️</span>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "60px",
          textAlign: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
          <p style={{ color: "#6b7280", fontSize: "16px", margin: 0 }}>Cargando historial...</p>
        </div>
      )}

      {/* Sin resultados */}
      {!loading && clientesAgrupados.length === 0 && (
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "60px",
          textAlign: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>📭</div>
          <p style={{ 
            color: "#1f2937", 
            fontSize: "20px", 
            fontWeight: 600,
            marginBottom: "8px"
          }}>
            {ci ? "No se encontraron créditos" : "No hay historial disponible"}
          </p>
          <p style={{ color: "#6b7280", margin: 0 }}>
            {ci ? "No hay registros para el CI ingresado" : "Aún no se han registrado créditos en el sistema"}
          </p>
        </div>
      )}

      {/* Resultados agrupados por cliente */}
      {!loading && clientesAgrupados.length > 0 && (
        <div style={{ display: "grid", gap: "24px" }}>
          {clientesAgrupados.map(([ciCliente, items]) => {
            const primerItem = items[0];
            const creditosConMonto = items.filter(i => i.monto_prestamo);
            
            return (
              <div 
                key={ciCliente}
                style={{
                  background: "white",
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  border: "1px solid #e5e7eb",
                  transition: "all 0.3s"
                }}
              >
                {/* Header del Cliente */}
                <div style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  padding: "24px",
                  color: "white"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                    <div style={{ flex: 1 }}>
                      <h2 style={{ 
                        margin: "0 0 8px 0", 
                        fontSize: "24px", 
                        fontWeight: 700,
                        textShadow: "0 2px 4px rgba(0,0,0,0.1)"
                      }}>
                        {primerItem.nombre_cliente} {primerItem.apellido_cliente}
                      </h2>
                      <div style={{
                        display: "inline-block",
                        background: "rgba(255, 255, 255, 0.2)",
                        backdropFilter: "blur(10px)",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "14px",
                        fontWeight: 600
                      }}>
                        📋 CI: {ciCliente && ciCliente !== "null" ? ciCliente : "❌ Sin CI"}
                      </div>
                      {(!ciCliente || ciCliente === "null") && (
                        <div style={{
                          display: "inline-block",
                          background: "rgba(239, 68, 68, 0.2)",
                          backdropFilter: "blur(10px)",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          marginLeft: "8px"
                        }}>
                          ⚠️ No se puede eliminar sin CI
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                      <div style={{
                        background: "rgba(255, 255, 255, 0.2)",
                        backdropFilter: "blur(10px)",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        textAlign: "center"
                      }}>
                        <div style={{ fontSize: "24px", fontWeight: 700 }}>{creditosConMonto.length}</div>
                        <div style={{ fontSize: "12px", opacity: 0.9 }}>Crédito(s)</div>
                      </div>
                      <button
                        onClick={() => abrirModalEliminar(ciCliente, `${primerItem.nombre_cliente} ${primerItem.apellido_cliente}`)}
                        disabled={!ciCliente || ciCliente === "null"}
                        style={{
                          background: (!ciCliente || ciCliente === "null") 
                            ? "rgba(156, 163, 175, 0.5)" 
                            : "rgba(239, 68, 68, 0.9)",
                          backdropFilter: "blur(10px)",
                          border: "2px solid rgba(255, 255, 255, 0.3)",
                          color: "white",
                          padding: "10px 16px",
                          borderRadius: "10px",
                          cursor: (!ciCliente || ciCliente === "null") ? "not-allowed" : "pointer",
                          fontSize: "14px",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          transition: "all 0.2s",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                          opacity: (!ciCliente || ciCliente === "null") ? 0.5 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (ciCliente && ciCliente !== "null") {
                            e.currentTarget.style.background = "rgba(220, 38, 38, 1)";
                            e.currentTarget.style.transform = "scale(1.05)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (ciCliente && ciCliente !== "null") {
                            e.currentTarget.style.background = "rgba(239, 68, 68, 0.9)";
                            e.currentTarget.style.transform = "scale(1)";
                          }
                        }}
                        title={(!ciCliente || ciCliente === "null") 
                          ? "No se puede eliminar: Cliente sin CI válido" 
                          : "Eliminar todos los créditos de este cliente"}
                      >
                        <span style={{ fontSize: "18px" }}>🗑️</span>
                        Eliminar
                      </button>
                    </div>
                  </div>

                  {/* Información Laboral */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "12px",
                    marginTop: "16px",
                    paddingTop: "16px",
                    borderTop: "1px solid rgba(255, 255, 255, 0.2)"
                  }}>
                    {primerItem.empresa_trabajo && (
                      <div>
                        <div style={{ fontSize: "12px", opacity: 0.8, marginBottom: "4px" }}>🏢 Empresa</div>
                        <div style={{ fontSize: "15px", fontWeight: 600 }}>{primerItem.empresa_trabajo}</div>
                      </div>
                    )}
                    {primerItem.cargo && (
                      <div>
                        <div style={{ fontSize: "12px", opacity: 0.8, marginBottom: "4px" }}>💼 Cargo</div>
                        <div style={{ fontSize: "15px", fontWeight: 600 }}>{primerItem.cargo}</div>
                      </div>
                    )}
                    {primerItem.salario && (
                      <div>
                        <div style={{ fontSize: "12px", opacity: 0.8, marginBottom: "4px" }}>💰 Salario</div>
                        <div style={{ fontSize: "15px", fontWeight: 600 }}>
                          Bs. {parseFloat(primerItem.salario).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lista de Créditos */}
                <div style={{ padding: "24px" }}>
                  <h3 style={{ 
                    margin: "0 0 16px 0", 
                    fontSize: "18px", 
                    fontWeight: 700,
                    color: "#1f2937"
                  }}>
                    💳 Historial de Créditos
                  </h3>
                  
                  {creditosConMonto.length === 0 ? (
                    <div style={{
                      background: "#f9fafb",
                      border: "2px dashed #d1d5db",
                      borderRadius: "12px",
                      padding: "32px",
                      textAlign: "center"
                    }}>
                      <div style={{ fontSize: "48px", marginBottom: "12px" }}>📝</div>
                      <p style={{ color: "#6b7280", fontStyle: "italic", margin: 0 }}>
                        Sin créditos registrados
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: "12px" }}>
                      {creditosConMonto.map((item, idx) => {
                        const monto = parseFloat(item.monto_prestamo || "0");
                        
                        return (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "16px 20px",
                              background: "linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)",
                              border: "2px solid #e5e7eb",
                              borderRadius: "12px",
                              transition: "all 0.2s"
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                marginBottom: "8px"
                              }}>
                                <span style={{ fontSize: "24px" }}>💵</span>
                                <div>
                                  <div style={{ 
                                    fontSize: "20px", 
                                    fontWeight: 700,
                                    color: "#1f2937"
                                  }}>
                                    {item.moneda} {monto.toLocaleString('es-BO', { 
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2 
                                    })}
                                  </div>
                                  <div style={{ 
                                    fontSize: "13px",
                                    color: "#6b7280",
                                    marginTop: "2px"
                                  }}>
                                    Crédito #{idx + 1}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div>
                              {getEstadoBadge(item.estado_prestamo)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Resumen Total del Cliente */}
                  {creditosConMonto.length > 0 && (
                    <div style={{
                      marginTop: "16px",
                      padding: "16px 20px",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      borderRadius: "12px",
                      color: "white",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <span style={{ fontSize: "16px", fontWeight: 600 }}>💎 Total Acumulado</span>
                      <span style={{ fontSize: "24px", fontWeight: 700 }}>
                        Bs. {creditosConMonto
                          .reduce((sum, item) => sum + parseFloat(item.monto_prestamo || "0"), 0)
                          .toLocaleString('es-BO', { 
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2 
                          })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer con Total */}
      {!loading && clientesAgrupados.length > 0 && (
        <div style={{
          marginTop: "32px",
          padding: "24px",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "8px" }}>
            📊 Resumen General
          </div>
          <div style={{ fontSize: "18px", fontWeight: 600, color: "#1f2937" }}>
            {clientesAgrupados.length} cliente(s) • {' '}
            {historial.filter(h => h.monto_prestamo).length} crédito(s) registrado(s)
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {modalEliminar && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div style={{
            background: "white",
            borderRadius: "20px",
            maxWidth: "500px",
            width: "100%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            overflow: "hidden",
            animation: "slideIn 0.3s ease-out"
          }}>
            {/* Header del Modal */}
            <div style={{
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              padding: "24px",
              color: "white",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "64px", marginBottom: "12px" }}>⚠️</div>
              <h2 style={{ 
                margin: "0 0 8px 0", 
                fontSize: "24px", 
                fontWeight: 700 
              }}>
                Confirmar Eliminación
              </h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: "14px" }}>
                Esta acción no se puede deshacer
              </p>
            </div>

            {/* Contenido del Modal */}
            <div style={{ padding: "32px" }}>
              <div style={{
                background: "#fef2f2",
                border: "2px solid #fecaca",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "24px"
              }}>
                <p style={{ 
                  margin: "0 0 12px 0", 
                  fontSize: "16px", 
                  fontWeight: 600,
                  color: "#1f2937"
                }}>
                  ¿Está seguro que desea eliminar todos los créditos de:
                </p>
                <div style={{
                  background: "white",
                  padding: "16px",
                  borderRadius: "8px",
                  marginBottom: "12px"
                }}>
                  <div style={{ 
                    fontSize: "18px", 
                    fontWeight: 700,
                    color: "#ef4444",
                    marginBottom: "4px"
                  }}>
                    {nombreClienteAEliminar}
                  </div>
                  <div style={{ fontSize: "14px", color: "#6b7280" }}>
                    CI: {ciAEliminar}
                  </div>
                </div>
                <p style={{ 
                  margin: 0, 
                  fontSize: "14px", 
                  color: "#dc2626",
                  fontWeight: 500
                }}>
                  ⚠️ Se eliminarán todos los registros de créditos asociados a este cliente
                </p>
              </div>

              {/* Mensaje de Error en el Modal */}
              {errorEliminar && (
                <div style={{
                  background: "#fef2f2",
                  border: "2px solid #fecaca",
                  color: "#dc2626",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                  fontWeight: 500
                }}>
                  <span style={{ fontSize: "20px" }}>❌</span>
                  <span>{errorEliminar}</span>
                </div>
              )}

              {/* Botones de Acción */}
              <div style={{ 
                display: "flex", 
                gap: "12px",
                justifyContent: "flex-end"
              }}>
                <button
                  onClick={cerrarModalEliminar}
                  disabled={eliminando}
                  style={{
                    background: "white",
                    color: "#6b7280",
                    border: "2px solid #e5e7eb",
                    padding: "12px 24px",
                    borderRadius: "10px",
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: eliminando ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    opacity: eliminando ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!eliminando) {
                      e.currentTarget.style.borderColor = "#9ca3af";
                      e.currentTarget.style.color = "#374151";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    e.currentTarget.style.color = "#6b7280";
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarEliminar}
                  disabled={eliminando}
                  style={{
                    background: eliminando
                      ? "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)"
                      : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                    color: "white",
                    border: "none",
                    padding: "12px 24px",
                    borderRadius: "10px",
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: eliminando ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    if (!eliminando) {
                      e.currentTarget.style.transform = "scale(1.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  {eliminando ? (
                    <>
                      <span style={{ fontSize: "16px" }}>⏳</span>
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: "16px" }}>🗑️</span>
                      Eliminar Definitivamente
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default HistorialCompletoPage;