import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listClientes, formatNombreCompleto } from "./service";
import type { Cliente } from "./types";
import "../../styles/theme.css";

const HistorialClientesPage: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [query, setQuery] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError("");
      try {
        console.log("🔄 [CLIENTES] Cargando lista de clientes...");
        const response = await listClientes({ page: 1, page_size: 50 });
        console.log("✅ [CLIENTES] Lista cargada:", response.results.length, "clientes");
        setRows(response.results);
      } catch (err) {
        console.error("❌ [CLIENTES] Error cargando clientes:", err);
        
        // Mostrar error más específico
        let errorMsg = "Error al cargar la lista de clientes";
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosError = err as { response?: { status?: number; data?: unknown } };
          const status = axiosError.response?.status;
          
          if (status === 401) {
            errorMsg = "No estás autenticado. Por favor, inicia sesión nuevamente.";
          } else if (status === 403) {
            errorMsg = "No tienes permisos para ver los clientes.";
          } else if (status === 404) {
            errorMsg = "El endpoint de clientes no existe en el backend.";
          } else if (status === 500) {
            errorMsg = "Error del servidor. Contacta al administrador.";
          }
          
          console.error("📍 Status:", status);
          console.error("📍 Data:", axiosError.response?.data);
        }
        
        setError(errorMsg);
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(c =>
      `${c.nombre} ${c.apellido} ${c.telefono}`.toLowerCase().includes(q)
    );
  }, [rows, query]);

  return (
    <section className="ui-page">
      <div className="ui-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => navigate("/app")}
              className="ui-btn ui-btn--ghost"
              title="Volver al dashboard"
            >
              ← Volver
            </button>
            <input
              placeholder="Buscar por nombre, apellido o teléfono…"
              className="ui-input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ minWidth: 280 }}
            />
          </div>

          <div>
            <Link 
              to="/app/clientes/wizard" 
              className="ui-btn"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                marginRight: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>🎯</span>
              <span>Registrar Cliente + Crédito</span>
            </Link>
            <Link to="/app/clientes/crear" className="ui-btn ui-btn--primary">
              ➕ Crear cliente
            </Link>
          </div>
        </div>

        <div className="ui-card ui-card--table">
          <div className="ui-table__wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Fecha Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: 24 }}>
                      Cargando clientes...
                    </td>
                  </tr>
                )}
                
                {!loading && filtered.length === 0 && !error && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: 48 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                        <div style={{ fontSize: "48px" }}>👥</div>
                        <div>
                          <strong style={{ fontSize: "18px", display: "block", marginBottom: "8px" }}>
                            No hay clientes registrados
                          </strong>
                          <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>
                            Comienza creando tu primer cliente
                          </p>
                          <Link to="/app/clientes/crear" className="ui-btn ui-btn--primary">
                            ➕ Crear primer cliente
                          </Link>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                
                {!loading && error && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: 48 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                        <div style={{ fontSize: "48px" }}>❌</div>
                        <div>
                          <strong style={{ fontSize: "18px", display: "block", marginBottom: "8px", color: "var(--danger)" }}>
                            {error}
                          </strong>
                          <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>
                            Abre la consola (F12) para ver más detalles
                          </p>
                          <button 
                            onClick={() => window.location.reload()} 
                            className="ui-btn ui-btn--ghost"
                          >
                            🔄 Recargar página
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                
                {!loading && filtered.map(cliente => (
                  <tr key={String(cliente.id)}>
                    <td>
                      <div>
                        <strong>{formatNombreCompleto(cliente)}</strong>
                      </div>
                    </td>
                    <td>{cliente.telefono}</td>
                    <td>
                      {cliente.fecha_registro 
                        ? new Date(cliente.fecha_registro).toLocaleDateString()
                        : "—"
                      }
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <Link 
                          className="ui-btn ui-btn--ghost ui-btn--sm" 
                          to={`/app/clientes/${cliente.id}`}
                        >
                          Ver
                        </Link>
                        <Link 
                          className="ui-btn ui-btn--ghost ui-btn--sm" 
                          to={`/app/clientes/${cliente.id}/editar`}
                        >
                          Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        {!loading && (
          <div style={{ marginTop: 16, padding: 12, background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
            <small style={{ color: "var(--text-muted)" }}>
              Mostrando {filtered.length} de {rows.length} clientes
            </small>
          </div>
        )}
      </div>
    </section>
  );
};

export default HistorialClientesPage;