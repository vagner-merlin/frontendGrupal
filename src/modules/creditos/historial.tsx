import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { listCredits } from "./service";
import type { Credit } from "./types";
import { useAuth } from "../auth/service";
import "../../styles/theme.css";

/**
 * Ver créditos (historial)
 * - búsqueda por código/cliente
 * - filtro por estado
 * - muestra resumen de pagos / indicador de vencimiento
 */
const HistorialCreditosPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [rows, setRows] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<string>("");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Verificar si es admin
  const isAdmin = user?.roles?.includes("admin") || user?.roles?.includes("superadmin");

  // Función para cargar créditos
  const cargarCreditos = async () => {
    setLoading(true);
    try {
      console.log("🔄 Cargando créditos desde el backend...");
      const r = await listCredits({ page: 1, page_size: 200 });
      console.log("✅ Créditos cargados:", r.results?.length || 0);
      console.log("📋 Datos completos:", r);
      
      if (r.results && r.results.length > 0) {
        console.log("📋 Primer crédito:", r.results[0]);
      }
      
      setRows(r.results ?? []);
    } catch (err) {
      console.error("❌ Error cargando créditos:", err);
      setRows([]);
    } finally {
      setLoading(false);
      setLastUpdate(new Date());
    }
  };

  // Cargar al montar el componente
  useEffect(() => {
    void cargarCreditos();
  }, []);

  // Recargar cuando se navega desde otra página (ej: después de crear)
  useEffect(() => {
    // Si venimos de /crear o si es una recarga completa, intentar varias veces
    const esRecargaCompleta = !location.state; // Si no hay state, es recarga completa
    const vieneDeCrear = location.state?.from === 'crear';
    
    if (vieneDeCrear || esRecargaCompleta) {
      console.log("🔄 Detectada recarga después de crear crédito. Recargando datos...");
      
      // Hacer 3 intentos con delays crecientes para asegurar que el backend procese
      const delays = [500, 1500, 3000];
      delays.forEach((delay, index) => {
        setTimeout(() => {
          console.log(`🔄 Intento ${index + 1} de recarga automática...`);
          void cargarCreditos();
        }, delay);
      });
    }
  }, [location.state, location.pathname]);

  const estados = useMemo(() => {
    const s = new Set<string>();
    rows.forEach(r => { if (r?.estado) s.add(r.estado); });
    return Array.from(s).sort();
  }, [rows]);

  // Helper para obtener nombre del cliente (puede venir como objeto o string)
  const getClienteName = (cliente: string | { nombre?: string; apellido?: string } | unknown): string => {
    if (!cliente) return "—";
    if (typeof cliente === "string") return cliente;
    if (typeof cliente === "object" && cliente !== null) {
      const clienteObj = cliente as { nombre?: string; apellido?: string };
      const nombre = clienteObj.nombre || "";
      const apellido = clienteObj.apellido || "";
      return `${nombre} ${apellido}`.trim() || "—";
    }
    return String(cliente);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(r => {
      if (estadoFilter && (r).estado !== estadoFilter) return false;
      if (!q) return true;
      const clienteNombre = getClienteName(r.cliente).toLowerCase();
      const codigo = String(r.codigo ?? "").toLowerCase();
      return clienteNombre.includes(q) || codigo.includes(q);
    });
  }, [rows, query, estadoFilter]);

  const now = Date.now();

  // Tipo local extendido para evitar 'any' y permitir campos opcionales del payload
  type CreditExt = Credit & {
    pagos?: unknown[];
    pagos_summary?: string;
    vencimiento?: string;
    fecha_programada?: string;
    monto?: number;
    moneda?: string;
    codigo?: string;
    cliente?: string;
    estado?: string;
    fecha_solicitud?: string;
    id?: string | number;
  };

  return (
    <section className="ui-page">
      {/* Header con estadísticas */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: "16px", 
        marginBottom: "24px" 
      }}>
        <div className="ui-card" style={{ padding: "16px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "var(--primary-color, #3b82f6)" }}>
            {rows.length}
          </div>
          <div style={{ fontSize: "14px", color: "#6b7280" }}>Total Créditos</div>
        </div>
        <div className="ui-card" style={{ padding: "16px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#10b981" }}>
            {rows.filter(r => r.estado === "APROBADO" || r.estado === "DESEMBOLSADO").length}
          </div>
          <div style={{ fontSize: "14px", color: "#6b7280" }}>Aprobados</div>
        </div>
        <div className="ui-card" style={{ padding: "16px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#f59e0b" }}>
            {rows.filter(r => r.estado === "SOLICITADO" || r.estado === "EN_EVALUACION").length}
          </div>
          <div style={{ fontSize: "14px", color: "#6b7280" }}>En Proceso</div>
        </div>
        <div className="ui-card" style={{ padding: "16px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#ef4444" }}>
            {rows.filter(r => r.estado === "RECHAZADO" || r.estado === "EN_MORA").length}
          </div>
          <div style={{ fontSize: "14px", color: "#6b7280" }}>Rechazados/Mora</div>
        </div>
      </div>

      {/* Banner: Crédito recién creado */}
      {rows.length > 0 && (
        (() => {
          // Obtener el crédito más reciente
          const creditoReciente = [...rows]
            .sort((a, b) => {
              const fechaA = new Date(a.fecha_solicitud || a.id || 0).getTime();
              const fechaB = new Date(b.fecha_solicitud || b.id || 0).getTime();
              return fechaB - fechaA;
            })
            .slice(0, 1)[0];
          
          if (!creditoReciente) return null;
          
          // Mostrar banner si:
          // 1. Es reciente (menos de 2 minutos), O
          // 2. Es el primero en la lista y tiene estado SOLICITADO
          const tiempoTranscurrido = now - new Date(creditoReciente.fecha_solicitud || 0).getTime();
          const esReciente = tiempoTranscurrido < 120000; // Menos de 2 minutos
          const esPrimerCreditoSolicitado = creditoReciente.estado === 'SOLICITADO' && rows.length === 1;
          
          if (!esReciente && !esPrimerCreditoSolicitado) return null;
          
          return (
            <div style={{
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              padding: '16px 20px',
              borderRadius: '12px',
              marginBottom: '24px',
              border: '2px solid #3b82f6',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '32px', flexShrink: 0 }}>🎉</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: 0, color: '#1e40af', fontWeight: '700', fontSize: '15px' }}>
                    ¡Crédito creado exitosamente!
                  </h3>
                  <p style={{ margin: '4px 0 0 0', color: '#3b82f6', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Crédito #{creditoReciente.id} - {getClienteName(creditoReciente.cliente)} • ${Number(creditoReciente.monto || 0).toLocaleString('es-BO', { maximumFractionDigits: 2 })} {creditoReciente.moneda || 'USD'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/app/creditos/${creditoReciente.id}/workflow`, { state: { from: 'crear' } })}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  fontSize: '14px',
                  width: '100%',
                  boxShadow: '0 2px 8px rgba(29, 78, 216, 0.4)'
                }}
              >
                ▶️ Continuar Workflow
              </button>
            </div>
          );
        })()
      )}

      {/* Card principal con tabla */}
      <div className="ui-card">
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          gap: 12, 
          marginBottom: 20,
          flexWrap: "wrap"
        }}>
          <div>
            <h2 style={{ margin: 0, marginBottom: "4px" }}>📋 Historial de Créditos</h2>
            <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
              {filtered.length} de {rows.length} créditos
            </p>
          </div>
          
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {/* Indicador de última actualización */}
            <div style={{ 
              fontSize: "12px", 
              color: "#6b7280",
              padding: "8px 12px",
              background: "rgba(59, 130, 246, 0.1)",
              borderRadius: "8px"
            }}>
              🕐 Actualizado: {lastUpdate.toLocaleTimeString()}
            </div>

            {/* Botón de recargar - MÁS PROMINENTE */}
            <button
              onClick={() => {
                console.log("🔄 Recarga manual activada");
                void cargarCreditos();
              }}
              className="ui-btn"
              disabled={loading}
              style={{
                background: loading 
                  ? "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)"
                  : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "600",
                padding: "10px 16px"
              }}
              title="Recargar lista de créditos"
            >
              <span style={{ fontSize: "18px" }}>{loading ? "⏳" : "🔄"}</span>
              <span>{loading ? "Cargando..." : "Actualizar Lista"}</span>
            </button>
            
            <input
              placeholder="🔍 Buscar por código o cliente…"
              className="ui-input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ minWidth: 260 }}
            />
            <select className="ui-select" value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)}>
              <option value="">📊 Todos los estados</option>
              {estados.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            
            {/* Botón para consultar estado por CI */}
            <button
              onClick={() => navigate("/app/creditos/consulta")}
              className="ui-btn"
              style={{
                backgroundColor: "#06b6d4",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
              title="Consultar estado por CI"
            >
              🔍 Consultar CI
            </button>

            {/* Botón para ver historial completo */}
            <button
              onClick={() => navigate("/app/creditos/historial-completo")}
              className="ui-btn"
              style={{
                backgroundColor: "#8b5cf6",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
              title="Ver historial completo de todos los clientes"
            >
              📚 Historial Completo
            </button>
            
            {/* Botón para gestionar tipos de crédito (solo admins) */}
            {isAdmin && (
              <button
                onClick={() => navigate("/app/creditos/tipos")}
                className="ui-btn"
                style={{
                  backgroundColor: "#8b5cf6",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
                title="Gestionar tipos de crédito"
              >
                🧾 Tipos
              </button>
            )}
            
            <Link to="/app/creditos/crear" className="ui-btn ui-btn--primary">
              ➕ Crear Crédito
            </Link>
          </div>
        </div>

        <div className="ui-card ui-card--table">
          <div className="ui-table__wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>Código</th>
                  <th>Cliente</th>
                  <th style={{ textAlign: "right" }}>Monto</th>
                  <th>Vencimiento</th>
                  <th>Pagos / Atrasos</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "40px" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                        <div style={{ fontSize: "24px" }}>⏳</div>
                        <div style={{ fontSize: "16px", color: "#6b7280" }}>Cargando créditos...</div>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "40px" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                        <div style={{ fontSize: "48px" }}>📋</div>
                        <div style={{ fontSize: "18px", fontWeight: "600", color: "#374151" }}>
                          {query || estadoFilter ? "No se encontraron créditos con los filtros aplicados" : "No hay créditos registrados"}
                        </div>
                        <div style={{ fontSize: "14px", color: "#6b7280" }}>
                          {query || estadoFilter 
                            ? "Intenta cambiar los filtros de búsqueda" 
                            : "Haz clic en 'Crear Crédito' para registrar el primero"}
                        </div>
                        {!query && !estadoFilter && (
                          <Link 
                            to="/app/creditos/crear" 
                            className="ui-btn ui-btn--primary"
                            style={{ marginTop: "12px" }}
                          >
                            ➕ Crear Primer Crédito
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && filtered.map((cRaw) => {
                  const c = cRaw as CreditExt;

                  // Resumen de pagos seguro
                  const pagosCount = Array.isArray(c.pagos) ? c.pagos.length : undefined;
                  const pagosSummary = c.pagos_summary ?? (pagosCount !== undefined ? `${pagosCount} pagos` : "—");

                  // Determinar si vencido (campo vencimiento / fecha_programada)
                  const vencimientoStr = c.vencimiento ?? c.fecha_programada ?? null;
                  const vencido = vencimientoStr ? (new Date(vencimientoStr).getTime() < now) : false;

                  return (
                    <tr key={String(c.id ?? c.codigo ?? Math.random())}>
                      <td>
                        <span className={`ui-status ui-status--${getStatusVariant(c.estado ?? "")}`}>
                          {c.estado ?? "—"}
                        </span>
                        {vencido && <span style={{ marginLeft: 8, color: "var(--danger)" }}>Vencido</span>}
                      </td>

                      <td>
                        {c.id ? <Link to={`/app/creditos/${c.id}`}>{c.codigo ?? String(c.id)}</Link> : (c.codigo ?? "—")}
                      </td>

                      <td>{getClienteName(c.cliente)}</td>

                      <td style={{ textAlign: "right" }}>
                        {formatMoney(c.monto, c.moneda)}
                      </td>

                      <td>{vencimientoStr ? new Date(vencimientoStr).toLocaleDateString() : "—"}</td>

                      <td>{pagosSummary}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HistorialCreditosPage;

/* Helpers */
function getStatusVariant(estado: string) {
  switch (estado) {
    case "APROBADO":
    case "DESEMBOLSADO":
      return "active";
    case "RECHAZADO":
    case "CANCELADO":
      return "inactive";
    case "SOLICITADO":
    case "EN_EVALUACION":
      return "pending";
    default:
      return "inactive";
  }
}

function formatMoney(value: number | undefined, moneda?: string) {
  if (value == null) return "—";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: (moneda ?? "USD") }).format(value);
  } catch {
    return `${value} ${moneda ?? ""}`;
  }
}
