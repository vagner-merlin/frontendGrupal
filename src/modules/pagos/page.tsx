import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { 
  listPayments, 
  getPaymentSummary, 
  processPayment, 
  getActiveCredits 
 } from "./service";
import type { 
  PaymentWithCredit, 
  PaymentSummary, 
  ListPaymentsParams, 
  PaymentStatus,
  PaymentMethod,
  CreditInfo,
  ProcessPaymentInput
} from "./types";
import { getStripe } from "../../config/stripe";
import { StripePaymentForm } from "./components/StripePaymentForm";
import { StripeCheckoutButton } from "./components/StripeCheckoutButton";
import "../../styles/theme.css";

const ESTADOS: (PaymentStatus | "ALL")[] = [
  "ALL", "PENDIENTE", "PROCESANDO", "COMPLETADO", "FALLIDO", "CANCELADO"
];

const METODOS_PAGO: (PaymentMethod | "ALL")[] = [
  "ALL", "TRANSFERENCIA", "TARJETA_CREDITO", "TARJETA_DEBITO", "EFECTIVO", "BILLETERA_DIGITAL", "STRIPE"
];

const fmtMoney = (amount: number, currency = "USD"): string =>
  new Intl.NumberFormat("es-PE", { 
    style: "currency", 
    currency, 
    minimumFractionDigits: 2 
  }).format(amount);

const fmtDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "short", 
    day: "numeric"
  });

/* ---------- Componentes UI ---------- */
const StatusBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  const getStatusClass = (s: PaymentStatus): string => {
    switch (s) {
      case "COMPLETADO": return "ui-status ui-status--active";
      case "PENDIENTE": return "ui-status"; 
      case "PROCESANDO": return "ui-status ui-status--warning";
      case "FALLIDO": 
      case "CANCELADO": return "ui-status ui-status--inactive";
      default: return "ui-status";
    }
  };

  const getStatusLabel = (s: PaymentStatus): string => {
    const labels: Record<PaymentStatus, string> = {
      PENDIENTE: "Pendiente",
      PROCESANDO: "Procesando",
      COMPLETADO: "Completado", 
      FALLIDO: "Fallido",
      CANCELADO: "Cancelado",
      REEMBOLSADO: "Reembolsado"
    };
    return labels[s];
  };

  return (
    <span className={getStatusClass(status)}>
      <span className="ui-status__dot" />
      {getStatusLabel(status)}
    </span>
  );
};

const SummaryCards: React.FC<{ summary: PaymentSummary }> = ({ summary }) => (
  <div className="summary-grid">
    <div className="summary-card">
      <div className="summary-card__value">{summary?.total_pendientes ?? 0}</div>
      <div className="summary-card__label">Pagos pendientes</div>
    </div>
    <div className="summary-card">
      <div className="summary-card__value">{summary?.total_vencidos ?? 0}</div>
      <div className="summary-card__label">Pagos vencidos</div>
    </div>
    <div className="summary-card">
      <div className="summary-card__value">{summary?.total_en_mora ?? 0}</div>
      <div className="summary-card__label">En mora</div>
    </div>
    <div className="summary-card">
      <div className="summary-card__value">{fmtMoney(summary?.monto_pendiente ?? 0)}</div>
      <div className="summary-card__label">Monto pendiente</div>
    </div>
    <div className="summary-card">
      <div className="summary-card__value">{fmtMoney(summary?.monto_cobrado_mes ?? 0)}</div>
      <div className="summary-card__label">Cobrado este mes</div>
    </div>
    <div className="summary-card">
      <div className="summary-card__value">{summary?.creditos_activos ?? 0}</div>
      <div className="summary-card__label">Créditos activos</div>
    </div>
  </div>
);

const Toolbar: React.FC<{
  filters: ListPaymentsParams;
  onChange: (filters: Partial<ListPaymentsParams>) => void;
  activeCredits: CreditInfo[];
  onStripeTest: () => void;
}> = ({ filters, onChange, activeCredits, onStripeTest }) => (
  <div className="ui-toolbar">
    <div className="ui-toolbar__left">
      <input
        className="ui-input"
        placeholder="Buscar por cliente, código o referencia..."
        value={filters.search ?? ""}
        onChange={(e) => onChange({ search: e.target.value, page: 1 })}
      />
      
      <select
        className="ui-select"
        value={filters.estado ?? "ALL"}
        onChange={(e) => onChange({ estado: e.target.value as PaymentStatus | "ALL", page: 1 })}
      >
        {ESTADOS.map(estado => (
          <option key={estado} value={estado}>
            {estado === "ALL" ? "Todos los estados" : estado.replace("_", " ")}
          </option>
        ))}
      </select>

      <select
        className="ui-select"
        value={filters.credito_id ?? "ALL"}
        onChange={(e) => onChange({ credito_id: e.target.value === "ALL" ? undefined : e.target.value, page: 1 })}
      >
        <option value="ALL">Todos los créditos</option>
        {Array.isArray(activeCredits) && activeCredits.map(credito => (
          <option key={credito.id} value={credito.id}>
            {credito.codigo} - {credito.cliente_nombre}
          </option>
        ))}
      </select>

      <select
        className="ui-select"
        value={filters.metodo_pago ?? "ALL"}
        onChange={(e) => onChange({ metodo_pago: e.target.value as PaymentMethod | "ALL", page: 1 })}
      >
        {METODOS_PAGO.map(metodo => (
          <option key={metodo} value={metodo}>
            {metodo === "ALL" ? "Todos los métodos" : metodo.replace("_", " ")}
          </option>
        ))}
      </select>
    </div>

    <div className="ui-toolbar__right">
      <button
        className="ui-btn ui-btn--primary"
        onClick={onStripeTest}
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          border: "none",
          padding: "10px 20px",
          fontWeight: "600",
          marginRight: "15px"
        }}
      >
        🧪 Probar Stripe
      </button>
      
      <label className="ui-checkbox">
        <input
          type="checkbox"
          checked={filters.solo_vencidos ?? false}
          onChange={(e) => onChange({ solo_vencidos: e.target.checked, page: 1 })}
        />
        Solo vencidos
      </label>
      
      <label className="ui-checkbox">
        <input
          type="checkbox"
          checked={filters.solo_en_mora ?? false}
          onChange={(e) => onChange({ solo_en_mora: e.target.checked, page: 1 })}
        />
        Solo en mora
      </label>
    </div>
  </div>
);

const PaymentModal: React.FC<{
  payment: PaymentWithCredit | null;
  onClose: () => void;
  onProcess: (input: ProcessPaymentInput) => Promise<void>;
}> = ({ payment, onClose, onProcess }) => {
  const [form, setForm] = useState({
    monto_pagado: payment?.monto_programado ?? 0,
    metodo_pago: "TRANSFERENCIA" as PaymentMethod,
    referencia_transaccion: "",
    observaciones: ""
  });
  const [loading, setLoading] = useState(false);
  const [showStripeForm, setShowStripeForm] = useState(false);

  if (!payment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Si selecciona STRIPE, mostrar el formulario de Stripe
    if (form.metodo_pago === "STRIPE") {
      setShowStripeForm(true);
      return;
    }

    // Otros métodos de pago tradicionales
    setLoading(true);
    try {
      await onProcess({
        pago_id: payment.id,
        ...form
      });
      onClose();
    } catch  {
      alert("Error al procesar el pago");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ui-modal">
      <div className="ui-modal__content">
        <header className="ui-modal__header">
          <h3>Procesar pago</h3>
          <button className="ui-btn ui-btn--ghost" onClick={onClose}>×</button>
        </header>

        <div className="ui-modal__body">
          <div className="payment-info">
            <p><strong>Cliente:</strong> {payment.credito.cliente_nombre}</p>
            <p><strong>Crédito:</strong> {payment.credito.codigo}</p>
            <p><strong>Cuota:</strong> {payment.numero_cuota} de {payment.credito.cuotas_totales}</p>
            <p><strong>Monto programado:</strong> {fmtMoney(payment.monto_programado, payment.credito.moneda)}</p>
            <p><strong>Vencimiento:</strong> {fmtDate(payment.fecha_vencimiento)}</p>
          </div>

          {/* Si se seleccionó STRIPE, mostrar el formulario de Stripe */}
          {showStripeForm ? (
            <Elements stripe={getStripe()}>
              <StripePaymentForm
                pago={payment}
                onSuccess={() => {
                  setShowStripeForm(false);
                  onClose();
                  window.location.reload(); // Recargar para ver el pago procesado
                }}
                onCancel={() => setShowStripeForm(false)}
              />
            </Elements>
          ) : (
            <form onSubmit={handleSubmit} className="ui-form">
              <div className="ui-form__field">
                <label className="ui-label">Monto pagado</label>
                <input
                  className="ui-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.monto_pagado}
                  onChange={(e) => setForm(prev => ({ ...prev, monto_pagado: Number(e.target.value) }))}
                  required
                />
              </div>

              <div className="ui-form__field">
                <label className="ui-label">Método de pago</label>
                <select
                  className="ui-select"
                  value={form.metodo_pago}
                  onChange={(e) => setForm(prev => ({ ...prev, metodo_pago: e.target.value as PaymentMethod }))}
                  required
                >
                  {METODOS_PAGO.filter(m => m !== "ALL").map(metodo => (
                    <option key={metodo} value={metodo}>
                      {metodo === "STRIPE" ? "💳 Stripe (Tarjeta)" : metodo.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              {form.metodo_pago !== "STRIPE" && (
                <>
                  <div className="ui-form__field">
                    <label className="ui-label">Referencia de transacción</label>
                    <input
                      className="ui-input"
                      value={form.referencia_transaccion}
                      onChange={(e) => setForm(prev => ({ ...prev, referencia_transaccion: e.target.value }))}
                      placeholder="Número de referencia o voucher"
                    />
                  </div>

                  <div className="ui-form__field">
                    <label className="ui-label">Observaciones</label>
                    <textarea
                      className="ui-textarea"
                      value={form.observaciones}
                      onChange={(e) => setForm(prev => ({ ...prev, observaciones: e.target.value }))}
                      placeholder="Comentarios adicionales..."
                      rows={3}
                    />
                  </div>
                </>
              )}

              <div className="ui-form__actions">
                <button type="submit" className="ui-btn ui-btn--primary" disabled={loading}>
                  {loading ? "Procesando..." : form.metodo_pago === "STRIPE" ? "Continuar con Stripe" : "Procesar pago"}
                </button>
                <button type="button" className="ui-btn ui-btn--ghost" onClick={onClose}>
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const PaymentRow: React.FC<{
  payment: PaymentWithCredit;
  onProcessPayment: (payment: PaymentWithCredit) => void;
}> = ({ payment, onProcessPayment }) => {
  const isVencido = payment.estado === "PENDIENTE" && new Date(payment.fecha_vencimiento) < new Date();
  const enMora = (payment.mora_dias ?? 0) > 0;

  return (
    <tr className={enMora ? "row-warning" : isVencido ? "row-danger" : ""}>
      <td><StatusBadge status={payment.estado} /></td>
      <td>
        <div className="credit-info">
          <strong>{payment.credito.codigo}</strong>
          <small>{payment.credito.cliente_nombre}</small>
        </div>
      </td>
      <td>{payment.numero_cuota} / {payment.credito.cuotas_totales}</td>
      <td>{fmtMoney(payment.monto_programado, payment.credito.moneda)}</td>
      <td>{fmtDate(payment.fecha_vencimiento)}</td>
      <td>
        {payment.fecha_pago ? fmtDate(payment.fecha_pago) : "—"}
      </td>
      <td>{payment.metodo_pago?.replace("_", " ") ?? "—"}</td>
      <td>
        {enMora && (
          <span className="mora-badge">
            {payment.mora_dias} días de mora
          </span>
        )}
      </td>
      <td className="ui-td--actions">
        {payment.estado === "PENDIENTE" ? (
          <button
            className="ui-btn ui-btn--primary"
            onClick={() => onProcessPayment(payment)}
            style={{
              backgroundColor: "#4CAF50",
              color: "white",
              padding: "8px 16px",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            💳 Procesar Pago
          </button>
        ) : payment.estado === "COMPLETADO" ? (
          <span style={{ color: "#4CAF50", fontWeight: "600" }}>✅ Pagado</span>
        ) : (
          <span style={{ color: "#999" }}>—</span>
        )}
      </td>
    </tr>
  );
};

const Pager: React.FC<{
  page: number;
  pageSize: number;
  count: number;
  onPage: (page: number) => void;
}> = ({ page, pageSize, count, onPage }) => {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  
  return (
    <div className="ui-pager">
      <button 
        className="ui-btn" 
        disabled={page <= 1} 
        onClick={() => onPage(page - 1)}
      >
        Anterior
      </button>
      <span className="ui-pager__info">
        Página {page} de {totalPages} ({count} registros)
      </span>
      <button 
        className="ui-btn" 
        disabled={page >= totalPages} 
        onClick={() => onPage(page + 1)}
      >
        Siguiente
      </button>
    </div>
  );
};

/* ---------- Componente Principal ---------- */
const PagosPage: React.FC = () => {
  const [payments, setPayments] = useState<PaymentWithCredit[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [activeCredits, setActiveCredits] = useState<CreditInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState<PaymentStatus | "ALL">("ALL");
  const [creditoId, setCreditoId] = useState<string | undefined>();
  const [metodoPago, setMetodoPago] = useState<PaymentMethod | "ALL">("ALL");
  const [soloVencidos, setSoloVencidos] = useState(false);
  const [soloEnMora, setSoloEnMora] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [count, setCount] = useState(0);

  // Modal
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithCredit | null>(null);
  const [showStripeTest, setShowStripeTest] = useState(false);

  const filters = useMemo(() => ({
    search,
    estado: estado === "ALL" ? undefined : estado,
    credito_id: creditoId,
    metodo_pago: metodoPago === "ALL" ? undefined : metodoPago,
    solo_vencidos: soloVencidos,
    solo_en_mora: soloEnMora,
    page,
    page_size: pageSize
  }), [search, estado, creditoId, metodoPago, soloVencidos, soloEnMora, page, pageSize]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔵 Cargando pagos con filtros:", filters);
      const result = await listPayments(filters);
      console.log("✅ Pagos cargados:", result);
      setPayments(result.results || []);
      setCount(result.count || 0);
    } catch (err) {
      console.error("❌ Error al cargar pagos:", err);
      setError("Error al cargar los pagos");
      setPayments([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadSummaryAndCredits();
  }, []);

  const loadSummaryAndCredits = async () => {
    try {
      const [summaryData, creditsData] = await Promise.all([
        getPaymentSummary(),
        getActiveCredits()
      ]);
      setSummary(summaryData);
      setActiveCredits(Array.isArray(creditsData) ? creditsData : []);
    } catch (err) {
      console.error("❌ Error al cargar resumen y créditos:", err);
      // Error no crítico - asegurar valores por defecto
      setActiveCredits([]);
    }
  };

  const handleFilterChange = (newFilters: Partial<ListPaymentsParams>) => {
    if (newFilters.search !== undefined) setSearch(newFilters.search);
    if (newFilters.estado !== undefined) setEstado(newFilters.estado || "ALL");
    if (newFilters.credito_id !== undefined) setCreditoId(String(newFilters.credito_id));
    if (newFilters.metodo_pago !== undefined) setMetodoPago(newFilters.metodo_pago || "ALL");
    if (newFilters.solo_vencidos !== undefined) setSoloVencidos(newFilters.solo_vencidos);
    if (newFilters.solo_en_mora !== undefined) setSoloEnMora(newFilters.solo_en_mora);
    if (newFilters.page !== undefined) setPage(newFilters.page);
  };

  const handleProcessPayment = async (input: ProcessPaymentInput) => {
    await processPayment(input);
    await loadData();
    await loadSummaryAndCredits();
  };

  return (
    <section className="ui-page">
      <header className="ui-page__header">
        <h1 className="ui-page__title">Gestión de Pagos</h1>
        <p className="ui-page__description">
          Administre los pagos de cuotas de todos los créditos activos
        </p>
      </header>

      {summary && <SummaryCards summary={summary} />}

      <Toolbar 
        filters={filters}
        onChange={handleFilterChange}
        activeCredits={activeCredits}
        onStripeTest={() => setShowStripeTest(true)}
      />

      {error && (
        <div className="ui-alert ui-alert--danger">
          {error}
        </div>
      )}

      <div className="ui-card ui-card--table">
        <div className="ui-table__wrap">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Estado</th>
                <th>Crédito / Cliente</th>
                <th>Cuota</th>
                <th>Monto</th>
                <th>Vencimiento</th>
                <th>Fecha pago</th>
                <th>Método</th>
                <th>Mora</th>
                <th className="ui-td--actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "40px", fontSize: "16px" }}>
                    ⏳ Cargando pagos...
                  </td>
                </tr>
              )}
              
              {!loading && error && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "40px", color: "#e74c3c" }}>
                    ❌ {error}
                  </td>
                </tr>
              )}
              
              {!loading && !error && (!payments || payments.length === 0) && (
                <tr>
                  <td colSpan={9} style={{ 
                    textAlign: "center", 
                    padding: "60px 40px",
                    backgroundColor: "#1a1a2e",
                    borderRadius: "8px"
                  }}>
                    <div style={{ fontSize: "48px", marginBottom: "20px" }}>📭</div>
                    <div style={{ 
                      fontSize: "18px", 
                      color: "#e0e0e0",
                      marginBottom: "10px",
                      fontWeight: "500"
                    }}>
                      No hay pagos disponibles
                    </div>
                    <div style={{ 
                      fontSize: "14px", 
                      color: "#999",
                      marginBottom: "30px"
                    }}>
                      Genera datos de prueba para empezar a probar el sistema de pagos con Stripe
                    </div>
                    <button 
                      data-generate-btn
                      onClick={(e) => {
                        e.preventDefault();
                        console.log("🔄 Regenerando datos de prueba...");
                        
                        // Solo borrar datos de pagos y créditos, NO el token de auth
                        localStorage.removeItem('mock.pagos.v1');
                        localStorage.removeItem('mock.creditos_info.v1');
                        
                        // Generar datos directamente
                        const mockCredits = [
                          {
                            id: "cred_001",
                            codigo: "CR-2024-001",
                            cliente_nombre: "Juan Pérez García",
                            cliente_documento: "12345678",
                            producto: "Crédito Personal",
                            monto_original: 15000,
                            moneda: "USD",
                            tasa_anual: 18.5,
                            plazo_meses: 24,
                            estado: "DESEMBOLSADO",
                            fecha_desembolso: "2024-01-15T00:00:00Z",
                            saldo_pendiente: 12500,
                            cuotas_pagadas: 6,
                            cuotas_totales: 24
                          },
                          {
                            id: "cred_002",
                            codigo: "CR-2024-002",
                            cliente_nombre: "María López Silva",
                            cliente_documento: "87654321",
                            producto: "Crédito Vehicular",
                            monto_original: 25000,
                            moneda: "USD",
                            tasa_anual: 16.0,
                            plazo_meses: 60,
                            estado: "DESEMBOLSADO",
                            fecha_desembolso: "2024-03-01T00:00:00Z",
                            saldo_pendiente: 23800,
                            cuotas_pagadas: 3,
                            cuotas_totales: 60
                          },
                          {
                            id: "cred_003",
                            codigo: "CR-2024-003",
                            cliente_nombre: "Carlos Rodríguez Vega",
                            cliente_documento: "11223344",
                            producto: "Crédito Empresarial",
                            monto_original: 50000,
                            moneda: "USD",
                            tasa_anual: 22.0,
                            plazo_meses: 36,
                            estado: "DESEMBOLSADO",
                            fecha_desembolso: "2024-02-10T00:00:00Z",
                            saldo_pendiente: 47200,
                            cuotas_pagadas: 4,
                            cuotas_totales: 36
                          }
                        ];
                        
                        // Generar pagos pendientes
                        const mockPayments: PaymentWithCredit[] = [];
                        mockCredits.forEach(credito => {
                          const cuotaMensual = credito.monto_original / credito.plazo_meses;
                          
                          // Generar solo las cuotas pendientes (después de las pagadas)
                          for (let i = credito.cuotas_pagadas + 1; i <= Math.min(credito.cuotas_pagadas + 5, credito.plazo_meses); i++) {
                            const fechaVencimiento = new Date(credito.fecha_desembolso);
                            fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i);
                            
                            mockPayments.push({
                              id: `pago_${credito.id}_${i}`,
                              credito_id: credito.id,
                              numero_cuota: i,
                              monto_programado: cuotaMensual,
                              monto_pagado: 0,
                              fecha_vencimiento: fechaVencimiento.toISOString(),
                              estado: "PENDIENTE",
                              created_at: credito.fecha_desembolso,
                              credito: credito
                            });
                          }
                        });
                        
                        console.log("✅ Generados", mockPayments.length, "pagos de prueba");
                        localStorage.setItem('mock.creditos_info.v1', JSON.stringify(mockCredits));
                        localStorage.setItem('mock.pagos.v1', JSON.stringify(mockPayments));
                        
                        // Recargar
                        window.location.reload();
                      }}
                      style={{
                        padding: "14px 32px",
                        backgroundColor: "#4CAF50",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "16px",
                        fontWeight: "600",
                        boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
                        transition: "all 0.3s ease"
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = "#45a049";
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 6px 16px rgba(76, 175, 80, 0.4)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = "#4CAF50";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(76, 175, 80, 0.3)";
                      }}
                    >
                      🔄 Generar Datos de Prueba
                    </button>
                    <div style={{
                      marginTop: "20px",
                      padding: "15px",
                      backgroundColor: "#2a2a3e",
                      borderRadius: "6px",
                      fontSize: "13px",
                      color: "#aaa",
                      maxWidth: "600px",
                      margin: "20px auto 0"
                    }}>
                      <div style={{ marginBottom: "8px", color: "#fff", fontWeight: "500" }}>
                        💡 Qué incluye:
                      </div>
                      • 3 créditos de ejemplo<br/>
                      • ~72 pagos (algunos completados, otros pendientes)<br/>
                      • Datos listos para probar Stripe<br/>
                      • Tarjeta de prueba: 4242 4242 4242 4242
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !error && payments && payments.length > 0 && payments.map(payment => (
                <PaymentRow
                  key={payment.id}
                  payment={payment}
                  onProcessPayment={setSelectedPayment}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="ui-card__footer">
          <Pager 
            page={page}
            pageSize={pageSize}
            count={count}
            onPage={setPage}
          />
        </div>
      </div>

      <PaymentModal
        payment={selectedPayment}
        onClose={() => setSelectedPayment(null)}
        onProcess={handleProcessPayment}
      />

      {/* Modal de prueba de Stripe Checkout */}
      {showStripeTest && (
        <div className="ui-modal" onClick={() => setShowStripeTest(false)}>
          <div className="ui-modal__content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
            <div className="ui-modal__header">
              <h2>🧪 Prueba de Pago con Stripe Checkout</h2>
              <button className="ui-modal__close" onClick={() => setShowStripeTest(false)}>×</button>
            </div>
            
            <div className="ui-modal__body">
              {/* Info de autenticación */}
              <div style={{ 
                background: "#e7f3ff", 
                padding: "15px", 
                borderRadius: "8px", 
                marginBottom: "15px",
                border: "1px solid #2196F3"
              }}>
                <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#1976D2", display: "flex", alignItems: "center", gap: "8px" }}>
                  🔐 Autenticación Activa
                </h4>
                <p style={{ margin: "0", fontSize: "13px", color: "#555" }}>
                  ✅ Ya estás logueado en el sistema con tu token (Authorization: Token)<br/>
                  ℹ️ Stripe Checkout redirige a una página segura de Stripe
                </p>
              </div>

              {/* Info del pago */}
              <div style={{ 
                background: "#f8f9fa", 
                padding: "15px", 
                borderRadius: "8px", 
                marginBottom: "20px",
                border: "1px solid #dee2e6"
              }}>
                <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", color: "#495057" }}>
                  📋 Pago de Prueba
                </h3>
                <div style={{ fontSize: "14px", color: "#6c757d" }}>
                  <p style={{ margin: "5px 0" }}><strong>Crédito:</strong> CR-TEST-2024</p>
                  <p style={{ margin: "5px 0" }}><strong>Cliente:</strong> Prueba Stripe Checkout</p>
                  <p style={{ margin: "5px 0" }}><strong>Cuota:</strong> 1/12</p>
                  <p style={{ margin: "5px 0" }}><strong>Monto:</strong> <span style={{ fontSize: "18px", fontWeight: "bold", color: "#28a745" }}>USD $100.00</span></p>
                </div>
              </div>

              {/* Flujo del pago Checkout */}
              <div style={{ 
                background: "#fff3cd", 
                padding: "12px", 
                borderRadius: "8px", 
                marginBottom: "20px",
                border: "1px solid #ffc107"
              }}>
                <h4 style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#856404" }}>
                  🔄 Flujo de Stripe Checkout:
                </h4>
                <ol style={{ margin: "0", paddingLeft: "20px", fontSize: "12px", color: "#856404" }}>
                  <li>Backend crea Checkout Session → Stripe devuelve URL segura</li>
                  <li>Frontend redirige a la página de Stripe (bonita y segura)</li>
                  <li>Usuario ingresa tarjeta en la página de Stripe</li>
                  <li>Stripe procesa y redirige de vuelta a /pago-exitoso</li>
                  <li>Backend verifica y marca como COMPLETADO ✅</li>
                </ol>
              </div>

              {/* Botón de pago inline para evitar problemas de renderizado */}
              <div>
                <StripeCheckoutButton 
                  creditoId="test-credit-001"
                  monto={100}
                  descripcion="Pago de prueba - Crédito CR-TEST-2024"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PagosPage;

