import React, { useEffect, useState } from "react";
import { listEmpresas, getSuscripcionByEmpresa } from "./service";
import PageHeader from "../../shared/components/PageHeader";
import type { Empresa, Suscripcion } from "./types";

const EmpresaPage: React.FC = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSuscripcion, setSelectedSuscripcion] = useState<Suscripcion | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  async function fetchEmpresas() {
    setLoading(true);
    setError("");
    try {
      const items = await listEmpresas();
      setEmpresas(items);
    } catch (err) {
      console.error("Error cargando empresas:", err);
      setError("No se pudieron cargar las empresas. Reintente.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchEmpresas();
  }, []);

  async function handleVerSuscripcion(empresaId: number) {
    setModalLoading(true);
    setModalOpen(true);
    setSelectedSuscripcion(null);
    try {
      const s = await getSuscripcionByEmpresa(empresaId);
      setSelectedSuscripcion(s);
    } catch (err) {
      console.error("Error al obtener suscripción:", err);
      setSelectedSuscripcion(null);
    } finally {
      setModalLoading(false);
    }
  }

  return (
    <section className="content">
      <PageHeader
        title="Empresas"
        subtitle="Gestión de empresas registradas en el sistema - Listado de empresas registradas"
        showBackButton={true}
        backPath="/app"
        actions={
          <button className="ui-btn" onClick={fetchEmpresas} disabled={loading}>
            {loading ? "Cargando…" : "🔄 Actualizar"}
          </button>
        }
      />

      {error && <div className="ui-alert ui-alert--danger" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="card card--data ui-table__wrap">
        <table className="ui-table" role="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Razón social</th>
              <th>Nombre comercial</th>
              <th>Contacto</th>
              <th>Activo</th>
              <th>Logo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empresas.length === 0 && !loading ? (
              <tr>
                <td colSpan={7} className="ui-cell--muted">No hay empresas para mostrar.</td>
              </tr>
            ) : (
              empresas.map((e) => (
                <tr key={e.id}>
                  <td>{e.id}</td>
                  <td>{e.razon_social}</td>
                  <td>{e.nombre_comercial}</td>
                  <td>{e.email_contacto ?? "-"}</td>
                  <td>
                    <span className={`ui-status ${e.activo ? "ui-status--active" : "ui-status--inactive"}`} data-status={e.activo ? "ACTIVO" : "INACTIVO"}>
                      {e.activo ? "Sí" : "No"}
                    </span>
                  </td>
                  <td>
                    {e.imagen_url ? (
                      <img src={e.imagen_url} alt={e.nombre_comercial} style={{ height: 32, objectFit: "contain" }} />
                    ) : (
                      <span style={{ color: "#9ca3af" }}>sin logo</span>
                    )}
                  </td>
                  <td>
                    <button className="ui-btn ui-btn--small" onClick={() => void handleVerSuscripcion(e.id)}>
                      Ver suscripción
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de suscripción */}
      {modalOpen && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200
        }}>
          <div style={{ width: 520, maxWidth: "96%", background: "var(--card-bg,#fff)", padding: 20, borderRadius: 8 }}>
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Suscripción</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }}>✕</button>
            </header>

            {modalLoading ? (
              <div>Consultando suscripción…</div>
            ) : selectedSuscripcion ? (
              <div>
                <p><strong>Plan:</strong> {selectedSuscripcion.enum_plan}</p>
                <p><strong>Estado:</strong> {selectedSuscripcion.enum_estado ?? "-"}</p>
                <p><strong>Fecha inicio:</strong> {selectedSuscripcion.fecha_inicio ? new Date(selectedSuscripcion.fecha_inicio).toLocaleString() : "-"}</p>
                <p><strong>Fecha fin:</strong> {selectedSuscripcion.fecha_fin ? new Date(selectedSuscripcion.fecha_fin).toLocaleString() : "-"}</p>
                {selectedSuscripcion.precio_usd != null && <p><strong>Precio USD:</strong> ${selectedSuscripcion.precio_usd}</p>}
                {selectedSuscripcion.meta && <pre style={{ background: "#f6f8fa", padding: 8, borderRadius: 4 }}>{JSON.stringify(selectedSuscripcion.meta, null, 2)}</pre>}
              </div>
            ) : (
              <div>No se encontró suscripción para esta empresa.</div>
            )}
            <footer style={{ marginTop: 12, textAlign: "right" }}>
              <button className="ui-btn" onClick={() => setModalOpen(false)}>Cerrar</button>
            </footer>
          </div>
        </div>
      )}
    </section>
  );
};

export default EmpresaPage;
