import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../../shared/api/client";
import "../../styles/theme.css";

function formatDateInput(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const RegistroOnPremise: React.FC = () => {
  const navigate = useNavigate();

  const [razonSocial, setRazonSocial] = useState("");
  const [adminNombre, setAdminNombre] = useState(""); // primer nombre del admin
  const [adminEmail, setAdminEmail] = useState("");
  const [adminEmailEdited, setAdminEmailEdited] = useState(false);
  const [adminEmailReadonly, setAdminEmailReadonly] = useState<boolean>(true); // evitar autofill del navegador
  const [version, setVersion] = useState("1.0");
  const [fechaEntrega, setFechaEntrega] = useState<string>("");
  const [fechaCompra, setFechaCompra] = useState<string>(formatDateInput(new Date()));
  const [fechaSinSoporte, setFechaSinSoporte] = useState<string>(
    formatDateInput(addDays(new Date(), 183))
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [showThanks, setShowThanks] = useState(false);

  const slugify = (s?: string) =>
    s
      ? s
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
      : "";

  // Generar email automáticamente en cuanto haya razonSocial + adminNombre
  useEffect(() => {
    const company = (razonSocial || "").trim();
    const admin = (adminNombre || "").trim().split(/\s+/)[0] || "";
    if (!company || !admin) return;
    const derived = `${slugify(admin)}@${slugify(company)}.com`;
    // si el usuario NO editó el email o hay autofill personal, sobrescribir
    const isPersonal = (e: string) => /@(gmail|hotmail|outlook|yahoo|live|icloud)\.com$/i.test(e);
    if (!adminEmailEdited || !adminEmail || isPersonal(adminEmail)) {
      setAdminEmail(derived);
      // permitir edición pero sólo después de haber puesto el valor controlado (pequeño retraso para bloquear autofill)
      setTimeout(() => setAdminEmailReadonly(false), 80);
      setAdminEmailEdited(false);
    }
  }, [razonSocial, adminNombre]);

  useEffect(() => {
    // inicializar fechas si están vacías
    const hoy = new Date();
    setFechaCompra((prev) => prev || formatDateInput(hoy));
    setFechaSinSoporte((prev) => prev || formatDateInput(addDays(hoy, 183)));
  }, []);

  // cerrar modal y volver al landing automáticamente después de enviar
  useEffect(() => {
    if (!showThanks) return;
    const t = setTimeout(() => {
      setShowThanks(false);
      navigate("/");
    }, 3500); // 3.5s antes de volver al landing
    return () => clearTimeout(t);
  }, [showThanks, navigate]);

  // Si se quiere calcular fechaSinSoporte en función de fechaCompra:
  useEffect(() => {
    try {
      const parts = fechaCompra.split("-");
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        // calcular fecha sin soporte a 6 meses (aprox. 183 días)
        setFechaSinSoporte(formatDateInput(addDays(d, 183)));
      }
    } catch {
      // noop
    }
  }, [fechaCompra]);

  const validate = () => {
    if (!razonSocial.trim()) {
      setMessage({ type: "error", text: "La razón social es obligatoria." });
      return false;
    }
    if (!adminEmail.trim() || !/^\S+@\S+\.\S+$/.test(adminEmail)) {
      setMessage({ type: "error", text: "Introduce un email válido." });
      return false;
    }
    if (!fechaEntrega) {
      setMessage({ type: "error", text: "Selecciona la fecha de entrega." });
      return false;
    }
    return true;
  };

  const handleFallbackSave = (payload: unknown) => {
    try {
      const key = "onpremise.pending";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      const item = { id: `req_${Date.now()}`, createdAt: new Date().toISOString(), payload };
      existing.push(item);
      localStorage.setItem(key, JSON.stringify(existing));
      const blob = new Blob([JSON.stringify(item, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `onpremise-request-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (x) {
      console.error("Error guardando fallback local:", x);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!validate()) return;

    const fechaSinSoporteIso = fechaSinSoporte
      ? new Date(`${fechaSinSoporte}T00:00:00`).toISOString()
      : new Date().toISOString();

    const payload = {
      razon_social: razonSocial.trim(),
      email_contacto: adminEmail.trim(),
      version,
      fecha_sin_soporte: fechaSinSoporteIso,
    };

    setLoading(true);
    try {
      await http.post("/api/on-premise/", payload);
      setMessage({ type: "ok", text: "Solicitud enviada." });
      setShowThanks(true);
      setRazonSocial("");
      setAdminNombre("");
      setAdminEmail("");
      setVersion("1.0");
      setFechaEntrega("");
      return;
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const status = (err as any)?.response?.status;
      if (status === 404) {
        try {
          await http.post("/api/on_premise/", payload);
          setMessage({ type: "ok", text: "Solicitud enviada." });
          setShowThanks(true);
          setRazonSocial("");
          setAdminNombre("");
          setAdminEmail("");
          setVersion("1.0");
          setFechaEntrega("");
          return;
        } catch (err2) {
          console.warn("Intento /api/on_premise/ falló:", err2);
        }
      }
      // fallback local
      handleFallbackSave(payload);
      setMessage({ type: "ok", text: "Solicitud guardada localmente. Se descargó un respaldo." });
      setShowThanks(true);
      setRazonSocial("");
      setAdminNombre("");
      setAdminEmail("");
      setVersion("1.0");
      setFechaEntrega("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page" style={{ padding: "40px 16px" }}>
      <div className="onpremise-wrapper">
        {/* IZQUIERDA: formulario */}
        <div className="onpremise-left card">
          <h1 className="ui-title" style={{ marginTop: 0 }}>Registro On Premise</h1>
          <p className="ui-page__description">
            Rellena los datos para solicitar el paquete on‑premise y la entrega del instalador.
          </p>

          <form onSubmit={handleSubmit} className="onpremise-form" noValidate>
            <div className="form-grid">
              <label className="form-field">
                <span className="field-label">Razón social</span>
                <input
                  type="text"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  className="ui-input"
                  required
                  placeholder="Nombre legal de la empresa"
                />
              </label>

              <label className="form-field">
                <span className="field-label">Nombre del administrador</span>
                <input
                  type="text"
                  value={adminNombre}
                  onChange={(e) => setAdminNombre(e.target.value)}
                  className="ui-input"
                  required
                  placeholder="Primer nombre del administrador"
                />
              </label>

              <label className="form-field">
                <span className="field-label">Email de contacto</span>
                <input
                  type="email"
                  name={"admin_email_parent_generated"} // nombre distinto evita match con autofill
                  autoComplete="off"
                  value={adminEmail}
                  readOnly={adminEmailReadonly} // readonly hasta que el componente coloque el email correcto
                  onFocus={() => { setAdminEmailReadonly(false); /* permitir edición manual al enfocar */ }}
                  onChange={(e) => { setAdminEmail(e.target.value); setAdminEmailEdited(true); }}
                  className="ui-input"
                  required
                  placeholder="contacto@empresa.com"
                />
              </label>

              <label className="form-field">
                <span className="field-label">Versión</span>
                <select value={version} onChange={(e) => setVersion(e.target.value)} className="ui-input">
                  <option value="1.0">1.0</option>
                  <option value="1.1">1.1</option>
                  <option value="2.0">2.0</option>
                </select>
              </label>

              <label className="form-field">
                <span className="field-label">Fecha de entrega</span>
                <input
                  type="date"
                  value={fechaEntrega}
                  onChange={(e) => setFechaEntrega(e.target.value)}
                  className="ui-input"
                  required
                />
              </label>

              <label className="form-field">
                <span className="field-label">Fecha de compra</span>
                <input type="date" value={fechaCompra} readOnly className="ui-input ui-input--muted" />
              </label>

              <label className="form-field">
                <span className="field-label">Fecha sin soporte</span>
                <input type="date" value={fechaSinSoporte} readOnly className="ui-input ui-input--muted" />
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="ui-btn ui-btn--primary" disabled={loading}>
                {loading ? "Enviando..." : "Solicitar paquete"}
              </button>

              <button
                type="button"
                className="ui-btn ui-btn--ghost"
                onClick={() => {
                  setRazonSocial("");
                  setAdminNombre("");
                  setAdminEmail("");
                  setVersion("1.0");
                  setFechaEntrega("");
                }}
              >
                Limpiar
              </button>
            </div>

            {message && (
              <div role="status" className={`form-message ${message.type === "ok" ? "ok" : "error"}`}>
                {message.text}
              </div>
            )}
          </form>
        </div>

        {/* DERECHA: información / instrucciones */}
        <aside className="onpremise-right card">
          <h3 style={{ marginTop: 0 }}>Entrega y descarga</h3>
          <p style={{ color: "var(--muted, #6b7280)" }}>
            Tras enviar la solicitud revisaremos los datos y te enviaremos el paquete de instalación,
            instrucciones y la llave de licencia por el email registrado.
          </p>

          <ul style={{ marginTop: 12 }}>
            <li><strong>Formato:</strong> ZIP / instalador</li>
            <li><strong>Soporte:</strong> 6 meses desde la fecha de compra</li>
            <li><strong>Requisitos:</strong> Servidor Linux/Windows, Node.js, PostgreSQL</li>
          </ul>

          <div style={{ marginTop: 18 }}>
            <button
              type="button"
              className="ui-btn ui-btn--ghost"
              onClick={() => {
                // acción rápida: abrir correo o guía
                window.open("/docs/onpremise-guide.pdf", "_blank");
              }}
            >
              Ver guía de instalación
            </button>
          </div>
        </aside>
      </div>

      {/* Modal de agradecimiento */}
      {showThanks && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => {
            setShowThanks(false);
            navigate("/");
          }}
        >
          <div
            className="modal-card"
            role="document"
            onClick={(ev) => ev.stopPropagation()}
          >
            <h2>Gracias</h2>
            <p>Gracias por su preferencia, nos comunicaremos con usted.</p>
            <div style={{ marginTop: 16, textAlign: "right" }}>
              <button
                className="ui-btn ui-btn--primary"
                onClick={() => {
                  setShowThanks(false);
                  navigate("/");
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default RegistroOnPremise;

