import React, { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import "../../styles/theme.css";
import { listClients, listCreditTypes, createCredit } from "./service";
import type { Client, Moneda, CreateCreditoInput } from "./types";
import type { TipoCredito } from "./tipos/types";

// Tipo específico para el formulario de creación
interface CreateCreditFormData {
  cliente_id: string;
  producto: string;
  moneda: string;
  monto: number;
  tasa_anual: number;
  plazo_meses: number;
  frecuencia: string;
  sistema: string;
}

const CrearCreditoPage: React.FC = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Client[]>([]);
  const [tipos, setTipos] = useState<TipoCredito[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estados para el autocomplete de tipo de crédito
  const [tipoInputValue, setTipoInputValue] = useState("");
  const [showTipoSuggestions, setShowTipoSuggestions] = useState(false);

  // Estados para el autocomplete de cliente
  const [clienteInputValue, setClienteInputValue] = useState("");
  const [showClienteSuggestions, setShowClienteSuggestions] = useState(false);

  const [form, setForm] = useState<CreateCreditFormData>({
    cliente_id: "",
    producto: "",
    moneda: "BOB",
    monto: 1000,
    tasa_anual: 12,
    plazo_meses: 12,
    frecuencia: "MENSUAL",
    sistema: "FRANCES"
  });

  useEffect(() => {
    void (async () => {
      try {
        setLoadingMeta(true);
        console.log("🔄 Cargando datos para formulario...");
        const [c, tt] = await Promise.all([listClients(), listCreditTypes()]);
        
        console.log("✅ Clientes cargados:", c.length);
        console.log("✅ Tipos de crédito cargados:", tt.length);
        
        setClientes(c);
        setTipos(tt);
        
        // No pre-seleccionar cliente automáticamente
        // if (c.length > 0) setForm(prev => ({ ...prev, cliente_id: String(c[0].id) }));
      } catch (err) {
        console.error("❌ Error cargando datos:", err);
        setError("No se pudieron cargar los datos necesarios. Verifique la conexión.");
      } finally {
        setLoadingMeta(false);
      }
    })();
  }, []);

  // Mejorar filtro de clientes (buscar por nombre, apellido o teléfono)
  const filteredClientes = clientes.filter(c => {
    if (!clienteInputValue.trim()) return true;
    
    const searchTerm = clienteInputValue.toLowerCase();
    const fullName = `${c.nombre} ${c.apellido}`.toLowerCase();
    const phone = c.telefono?.toLowerCase() || "";
    
    return fullName.includes(searchTerm) || 
           phone.includes(searchTerm) ||
           c.nombre.toLowerCase().includes(searchTerm) ||
           (c.apellido && c.apellido.toLowerCase().includes(searchTerm));
  });

  // Mejorar filtro de tipos de crédito
  const filteredTipos = tipos.filter(t => {
    if (!tipoInputValue.trim()) return true;
    
    const searchTerm = tipoInputValue.toLowerCase();
    return t.nombre.toLowerCase().includes(searchTerm) ||
           (t.descripcion?.toLowerCase().includes(searchTerm) ?? false);
  });

  const handleChange = <K extends keyof CreateCreditFormData>(k: K, v: CreateCreditFormData[K]) => {
    setForm(p => ({ ...p, [k]: v } as CreateCreditFormData));
  };

  const handleClienteInputChange = (value: string) => {
    setClienteInputValue(value);
    setShowClienteSuggestions(value.length > 0);
    
    // Limpiar selección si está escribiendo algo diferente
    if (form.cliente_id) {
      const currentCliente = clientes.find(c => String(c.id) === form.cliente_id);
      if (currentCliente) {
        const currentName = `${currentCliente.nombre} ${currentCliente.apellido}`.trim();
        if (value !== currentName) {
          handleChange("cliente_id", "");
        }
      }
    }
  };

  const selectCliente = (cliente: Client) => {
    const fullName = `${cliente.nombre} ${cliente.apellido}`.trim();
    
    // Usar flushSync para asegurar que las actualizaciones se procesen síncronamente
    flushSync(() => {
      setClienteInputValue(fullName);
      setShowClienteSuggestions(false);
    });
    
    // Actualizar el form después de cerrar el dropdown
    setTimeout(() => {
      handleChange("cliente_id", String(cliente.id));
    }, 0);
  };

  const handleTipoInputChange = (value: string) => {
    setTipoInputValue(value);
    setShowTipoSuggestions(value.length > 0);
    handleChange("producto", value);
  };

  const selectTipo = (tipo: TipoCredito) => {
    // Usar flushSync para asegurar que las actualizaciones se procesen síncronamente
    flushSync(() => {
      setTipoInputValue(tipo.nombre);
      setShowTipoSuggestions(false);
    });
    
    // Actualizar el form después de cerrar el dropdown
    setTimeout(() => {
      handleChange("producto", tipo.nombre);
      
      // Opcionalmente ajustar monto según los límites del tipo
      if (tipo.monto_minimo && form.monto < Number(tipo.monto_minimo)) {
        handleChange("monto", Number(tipo.monto_minimo));
      } else if (tipo.monto_maximo && form.monto > Number(tipo.monto_maximo)) {
        handleChange("monto", Number(tipo.monto_maximo));
      }
    }, 0);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); 
    setSuccess(null);
    
    // Validaciones mejoradas
    if (!form.cliente_id) { 
      setError("❌ Debe seleccionar un cliente"); 
      return; 
    }
    
    if (!form.producto.trim()) { 
      setError("❌ Debe seleccionar un tipo de crédito"); 
      return; 
    }
    
    if (form.monto <= 0) { 
      setError("❌ El monto debe ser mayor a 0"); 
      return; 
    }
    
    // Validar límites del tipo de crédito si está seleccionado
    const tipoSeleccionado = tipos.find(t => t.nombre === form.producto);
    if (!tipoSeleccionado) {
      setError("❌ Tipo de crédito no encontrado");
      return;
    }

    if (tipoSeleccionado.monto_minimo) {
      const minimo = Number(tipoSeleccionado.monto_minimo);
      if (form.monto < minimo) {
        setError(`❌ El monto debe ser mayor a ${minimo.toLocaleString()}`);
        return;
      }
    }
    
    if (tipoSeleccionado.monto_maximo) {
      const maximo = Number(tipoSeleccionado.monto_maximo);
      if (form.monto > maximo) {
        setError(`❌ El monto no puede superar ${maximo.toLocaleString()}`);
        return;
      }
    }
    
    setLoading(true);
    console.log("🚀 Iniciando creación de crédito...");
    
    try {
      // Calcular cuota mensual (fórmula simple - debería ser más precisa en producción)
      const montoCuota = Math.round((form.monto / form.plazo_meses) * 100) / 100;
      const montoPagar = Math.round((form.monto * (1 + (form.tasa_anual / 100) * (form.plazo_meses / 12))) * 100) / 100;

      // Transformar datos del formulario al formato del backend
      // NOTA: empresa y usuario se asignan automáticamente en el backend
      const dataParaBackend: CreateCreditoInput = {
        Monto_Solicitado: form.monto,
        enum_estado: 'SOLICITADO',
        Numero_Cuotas: form.plazo_meses,
        Monto_Cuota: montoCuota,
        Moneda: form.moneda,
        Tasa_Interes: form.tasa_anual,
        Monto_Pagar: montoPagar,
        cliente: Number(form.cliente_id),
        tipo_credito: Number(tipoSeleccionado.id),
        Fecha_Aprobacion: null,
        Fecha_Desembolso: null,
        Fecha_Finalizacion: null
      };

      console.log("📤 Enviando crédito al backend:", dataParaBackend);
      
      const resultado = await createCredit(dataParaBackend);
      
      console.log("✅ Crédito creado con éxito:", resultado);
      setSuccess("✅ Crédito creado exitosamente. Redirigiendo...");
      
      // Forzar recarga completa de la página para asegurar que se muestren los datos
      setTimeout(() => {
        window.location.href = "/app/creditos";
      }, 1500);
    } catch (err) {
      console.error("❌ Error al crear crédito:", err);
      setError((err as Error).message || "Error desconocido al crear el crédito");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="ui-page">
      <div className="ui-card">
        <div style={{ marginBottom: 24 }}>
          <h2 className="ui-card__title">Crear nuevo crédito</h2>
          <p className="ui-card__description">
            Complete la información del crédito
          </p>
        </div>

        {error && (
          <div 
            className="ui-alert ui-alert--error" 
            style={{ 
              marginBottom: 20,
              padding: '16px 20px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
              color: 'white',
              fontWeight: '500',
              fontSize: '15px',
              boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              animation: 'shake 0.5s ease-in-out'
            }}
          >
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div 
            className="ui-alert ui-alert--success" 
            style={{ 
              marginBottom: 20,
              padding: '16px 20px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #51cf66 0%, #37b24d 100%)',
              color: 'white',
              fontWeight: '500',
              fontSize: '15px',
              boxShadow: '0 4px 12px rgba(81, 207, 102, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              animation: 'slideInDown 0.5s ease-out'
            }}
          >
            <span style={{ fontSize: '24px' }}>✅</span>
            <span>{success}</span>
          </div>
        )}

        <form className="ui-form" onSubmit={onSubmit}>
          {/* Cliente con autocomplete */}
          <div className="ui-form__group">
            <label className="ui-label" htmlFor="cliente">
              Cliente <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <div style={{ position: "relative" }} data-autocomplete="clientes">
              <input
                id="cliente"
                className="ui-input"
                type="text"
                value={clienteInputValue}
                onChange={e => handleClienteInputChange(e.target.value)}
                onFocus={() => setShowClienteSuggestions(clienteInputValue.length > 0)}
                onBlur={() => {
                  // Delay para permitir que el click en el dropdown se procese primero
                  setTimeout(() => setShowClienteSuggestions(false), 200);
                }}
                placeholder="Escriba o busque un cliente..."
                disabled={loadingMeta}
                autoComplete="off"
              />
              
              {/* Indicador de carga en cliente */}
              {loadingMeta && (
                <div style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "12px",
                  color: "var(--text-muted)"
                }}>
                  ⏳
                </div>
              )}
              
              {/* Sugerencias de clientes */}
              <div 
                key="cliente-suggestions"
                onMouseDown={(e) => e.preventDefault()}
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  zIndex: 1000,
                  maxHeight: "200px",
                  overflowY: "auto",
                  display: (showClienteSuggestions && filteredClientes.length > 0) ? "block" : "none"
                }}
              >
                  <div style={{ 
                    padding: "8px 12px", 
                    fontSize: "11px", 
                    color: "var(--text-muted)", 
                    borderBottom: "1px solid var(--border-light)" 
                  }}>
                    {filteredClientes.length} cliente{filteredClientes.length !== 1 ? 's' : ''} encontrado{filteredClientes.length !== 1 ? 's' : ''}
                  </div>
                  {filteredClientes.map(cliente => (
                    <div
                      key={String(cliente.id)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectCliente(cliente);
                      }}
                      style={{
                        padding: "12px 16px",
                        cursor: "pointer",
                        borderBottom: "1px solid var(--border-light)",
                        transition: "background-color 0.2s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <div style={{ fontWeight: "500" }}>
                        {cliente.nombre} {cliente.apellido}
                      </div>
                      {cliente.telefono && (
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                          📞 {cliente.telefono}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

              {/* Mensaje cuando no hay clientes */}
              {showClienteSuggestions && clienteInputValue && filteredClientes.length === 0 && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  zIndex: 1000,
                  padding: "12px 16px"
                }}>
                  <div style={{ fontSize: "14px", color: "var(--text-muted)", textAlign: "center" }}>
                    👤 No se encontró cliente con "{clienteInputValue}" <br />
                    <button 
                      type="button"
                      onClick={() => navigate("/app/clientes/crear", { state: { nombre: clienteInputValue } })}
                      style={{ 
                        marginTop: "8px",
                        color: "var(--primary)",
                        background: "none",
                        border: "none",
                        textDecoration: "underline",
                        cursor: "pointer"
                      }}
                    >
                      ➕ Crear nuevo cliente
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tipo de crédito con autocomplete */}
          <div className="ui-form__group">
            <label className="ui-label" htmlFor="tipo">
              Tipo de crédito <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <div style={{ position: "relative" }} data-autocomplete="tipos">
              <input
                id="tipo"
                className="ui-input"
                type="text"
                value={tipoInputValue}
                onChange={e => handleTipoInputChange(e.target.value)}
                onFocus={() => setShowTipoSuggestions(tipoInputValue.length > 0)}
                onBlur={() => {
                  // Delay para permitir que el click en el dropdown se procese primero
                  setTimeout(() => setShowTipoSuggestions(false), 200);
                }}
                placeholder="Escriba o seleccione un tipo de crédito..."
                disabled={loadingMeta}
                autoComplete="off"
              />
              
              {/* Sugerencias */}
              <div 
                key="tipo-suggestions"
                onMouseDown={(e) => e.preventDefault()}
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  zIndex: 1000,
                  maxHeight: "200px",
                  overflowY: "auto",
                  display: (showTipoSuggestions && filteredTipos.length > 0) ? "block" : "none"
                }}
              >
                  {filteredTipos.map(tipo => (
                    <div
                      key={String(tipo.id)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectTipo(tipo);
                      }}
                      style={{
                        padding: "12px 16px",
                        cursor: "pointer",
                        borderBottom: "1px solid var(--border-light)",
                        transition: "background-color 0.2s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <div style={{ fontWeight: "500" }}>{tipo.nombre}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                        {tipo.descripcion}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                        Monto: {Number(tipo.monto_minimo).toLocaleString()} - {Number(tipo.monto_maximo).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

              {/* Opción de crear nuevo tipo */}
              {tipoInputValue && filteredTipos.length === 0 && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  zIndex: 1000,
                  padding: "12px 16px"
                }}>
                  <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                    📝 Crear nuevo tipo: <strong>"{tipoInputValue}"</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Campos básicos en fila */}
          <div className="ui-form__row">
            <div className="ui-form__group">
              <label className="ui-label" htmlFor="moneda">Moneda</label>
              <select 
                id="moneda"
                className="ui-select" 
                value={form.moneda} 
                onChange={e => handleChange("moneda", e.target.value as Moneda)}
              >
                <option value="BOB">BOB - Boliviano</option>
                <option value="USD">USD - Dólar</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>

            <div className="ui-form__group">
              <label className="ui-label" htmlFor="monto">
                Monto <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input 
                id="monto"
                className="ui-input" 
                type="number" 
                min="1"
                step="0.01"
                value={form.monto} 
                onChange={e => handleChange("monto", Number(e.target.value))} 
                placeholder="Ej: 10000"
              />
            </div>

            <div className="ui-form__group">
              <label className="ui-label" htmlFor="plazo">Plazo (meses)</label>
              <input 
                id="plazo"
                className="ui-input" 
                type="number" 
                min="1"
                max="360"
                value={form.plazo_meses} 
                onChange={e => handleChange("plazo_meses", Number(e.target.value))} 
                placeholder="Ej: 12"
              />
            </div>
          </div>

          {/* Campos adicionales */}
          <div className="ui-form__row">
            <div className="ui-form__group">
              <label className="ui-label" htmlFor="tasa">Tasa anual (%)</label>
              <input 
                id="tasa"
                className="ui-input" 
                type="number" 
                min="0"
                max="100"
                step="0.01"
                value={form.tasa_anual} 
                onChange={e => handleChange("tasa_anual", Number(e.target.value))} 
                placeholder="Ej: 12.5"
              />
            </div>

            <div className="ui-form__group">
              <label className="ui-label" htmlFor="frecuencia">Frecuencia de pago</label>
              <select 
                id="frecuencia"
                className="ui-select" 
                value={form.frecuencia} 
                onChange={e => handleChange("frecuencia", e.target.value)}
              >
                <option value="MENSUAL">Mensual</option>
                <option value="TRIMESTRAL">Trimestral</option>
                <option value="SEMESTRAL">Semestral</option>
                <option value="ANUAL">Anual</option>
              </select>
            </div>

            <div className="ui-form__group">
              <label className="ui-label" htmlFor="sistema">Sistema de amortización</label>
              <select 
                id="sistema"
                className="ui-select" 
                value={form.sistema} 
                onChange={e => handleChange("sistema", e.target.value)}
              >
                <option value="FRANCES">Francés (cuotas fijas)</option>
                <option value="ALEMAN">Alemán (capital fijo)</option>
                <option value="AMERICANO">Americano (solo intereses)</option>
              </select>
            </div>
          </div>

          <div className="ui-form__actions" style={{ marginTop: 24 }}>
            <button 
              className="ui-btn ui-btn--primary" 
              type="submit" 
              disabled={loading || loadingMeta}
              style={{
                background: loading 
                  ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)' 
                  : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                position: 'relative',
                minWidth: '160px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: loading ? 'wait' : 'pointer'
              }}
            >
              {loading ? (
                <>
                  <span style={{ 
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <span>Creando...</span>
                </>
              ) : (
                <>
                  <span>💰</span>
                  <span>Crear crédito</span>
                </>
              )}
            </button>
            <button 
              type="button" 
              className="ui-btn ui-btn--ghost" 
              onClick={() => navigate("/app/creditos")}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default CrearCreditoPage;
