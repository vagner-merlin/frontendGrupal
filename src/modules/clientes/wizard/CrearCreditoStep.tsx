import React, { useState, useEffect } from 'react';
import { useCliente } from '../context/useCliente';
import { useNavigate } from 'react-router-dom';
import { createCredit } from '../../creditos/service';
import type { CreateCreditoInput } from '../../creditos/types';
import type { TipoCredito } from '../../creditos/tipos/types';
import '../../../styles/theme.css';

// Helper para convertir montos de forma segura
const toNumber = (value: string | number): number => {
  return typeof value === 'number' ? value : parseFloat(String(value));
};

const CrearCreditoStep: React.FC = () => {
  const navigate = useNavigate();
  const { clienteId, marcarPasoCompletado, setPasoActual, clienteData, resetearFlujo } = useCliente();
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoCredito | null>(null);
  const [form, setForm] = useState({
    monto: '',
    tasa_anual: '10.5',
    plazo_meses: '12',
    moneda: 'USD'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const tipoGuardado = localStorage.getItem('tipo_credito_seleccionado');
    if (tipoGuardado) {
      setTipoSeleccionado(JSON.parse(tipoGuardado));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!clienteId) {
      setError('Error: No se ha creado el cliente');
      return;
    }

    if (!tipoSeleccionado) {
      setError('Error: No se ha seleccionado un tipo de crédito');
      return;
    }

    const monto = parseFloat(form.monto);
    const tasaAnual = parseFloat(form.tasa_anual);
    const plazoMeses = parseInt(form.plazo_meses);

    // Validaciones
    if (isNaN(monto) || monto <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    const montoMinimo = toNumber(tipoSeleccionado.monto_minimo);
    const montoMaximo = toNumber(tipoSeleccionado.monto_maximo);

    if (monto < montoMinimo || monto > montoMaximo) {
      setError(`El monto debe estar entre $${montoMinimo.toLocaleString()} y $${montoMaximo.toLocaleString()}`);
      return;
    }

    if (isNaN(tasaAnual) || tasaAnual <= 0 || tasaAnual > 100) {
      setError('La tasa de interés debe estar entre 0 y 100');
      return;
    }

    if (isNaN(plazoMeses) || plazoMeses <= 0 || plazoMeses > 360) {
      setError('El plazo debe estar entre 1 y 360 meses');
      return;
    }

    setLoading(true);

    try {
      // Calcular cuota y monto total (redondear a 2 decimales)
      const montoCuota = Math.round((monto / plazoMeses) * 100) / 100;
      const montoPagar = Math.round((monto * (1 + (tasaAnual / 100) * (plazoMeses / 12))) * 100) / 100;

      // Backend asigna empresa y usuario automáticamente
      // fase_actual se asigna automáticamente a FASE_1_SOLICITUD en el modelo
      const dataParaBackend: CreateCreditoInput = {
        Monto_Solicitado: monto,
        enum_estado: 'SOLICITADO',
        Numero_Cuotas: plazoMeses,
        Monto_Cuota: montoCuota,
        Moneda: form.moneda,
        Tasa_Interes: tasaAnual,
        Monto_Pagar: montoPagar,
        cliente: clienteId,
        tipo_credito: tipoSeleccionado.id,
        Fecha_Aprobacion: null,
        Fecha_Desembolso: null,
        Fecha_Finalizacion: null,
        fase_actual: 'FASE_1_SOLICITUD'
      };

      console.log('📤 Creando crédito:', dataParaBackend);
      const resultado = await createCredit(dataParaBackend);
      console.log('✅ Crédito creado:', resultado);

      setSuccess('✅ ¡Crédito creado exitosamente! Redirigiendo...');
      marcarPasoCompletado(6);

      // Limpiar localStorage y resetear flujo
      localStorage.removeItem('tipo_credito_seleccionado');
      
      setTimeout(() => {
        resetearFlujo();
        navigate('/app/creditos', { state: { from: 'crear' } });
      }, 2000);
    } catch (err) {
      console.error('❌ Error al crear crédito:', err);
      setError((err as Error).message || 'Error al crear el crédito');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h3 className="ui-card__title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '32px' }}>💰</span>
          <span>Paso 6: Solicitar Crédito</span>
        </h3>
        <p className="ui-card__description">
          Complete los datos del crédito para: {clienteData.nombre} {clienteData.apellido}
        </p>
      </div>

      {tipoSeleccionado && (
        <div style={{
          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>📋</span>
            <div>
              <strong style={{ color: '#1e40af' }}>{tipoSeleccionado.nombre}</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#3b82f6' }}>
                Rango: ${toNumber(tipoSeleccionado.monto_minimo).toLocaleString()} - ${toNumber(tipoSeleccionado.monto_maximo).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
          color: 'white',
          padding: '16px 20px',
          borderRadius: '12px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '15px',
          fontWeight: '500',
          animation: 'shake 0.5s ease-in-out'
        }}>
          <span style={{ fontSize: '24px' }}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{
          background: 'linear-gradient(135deg, #51cf66 0%, #37b24d 100%)',
          color: 'white',
          padding: '16px 20px',
          borderRadius: '12px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '15px',
          fontWeight: '500',
          animation: 'slideInDown 0.5s ease-out'
        }}>
          <span style={{ fontSize: '24px' }}>✅</span>
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          <div>
            <label className="ui-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>💵</span>
                <span>Monto Solicitado *</span>
              </span>
            </label>
            <input
              type="number"
              name="monto"
              className="ui-input"
              placeholder="Ej: 10000.00"
              step="0.01"
              min="0"
              value={form.monto}
              onChange={handleChange}
              disabled={loading}
              required
            />
            {tipoSeleccionado && (
              <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Rango permitido: ${toNumber(tipoSeleccionado.monto_minimo).toLocaleString()} - ${toNumber(tipoSeleccionado.monto_maximo).toLocaleString()}
              </small>
            )}
          </div>

          <div>
            <label className="ui-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📊</span>
                <span>Tasa de Interés Anual (%) *</span>
              </span>
            </label>
            <input
              type="number"
              name="tasa_anual"
              className="ui-input"
              placeholder="Ej: 10.5"
              step="0.1"
              min="0"
              max="100"
              value={form.tasa_anual}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="ui-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📅</span>
                <span>Plazo (meses) *</span>
              </span>
            </label>
            <input
              type="number"
              name="plazo_meses"
              className="ui-input"
              placeholder="Ej: 12"
              min="1"
              max="360"
              value={form.plazo_meses}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="ui-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>💱</span>
                <span>Moneda *</span>
              </span>
            </label>
            <select
              name="moneda"
              className="ui-select"
              value={form.moneda}
              onChange={handleChange}
              disabled={loading}
              required
            >
              <option value="USD">USD - Dólares</option>
              <option value="BOB">BOB - Bolivianos</option>
            </select>
          </div>
        </div>

        {/* Preview de cálculos */}
        {form.monto && form.tasa_anual && form.plazo_meses && (
          <div style={{
            marginTop: '24px',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            padding: '20px',
            borderRadius: '12px',
            border: '2px solid #86efac'
          }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#166534', fontSize: '16px', fontWeight: '700' }}>
              💡 Vista Previa del Crédito
            </h4>
            <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#16a34a' }}>Cuota Mensual:</span>
                <strong style={{ color: '#15803d' }}>
                  ${(parseFloat(form.monto) / parseInt(form.plazo_meses)).toFixed(2)}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#16a34a' }}>Total a Pagar:</span>
                <strong style={{ color: '#15803d' }}>
                  ${(parseFloat(form.monto) * (1 + (parseFloat(form.tasa_anual) / 100) * (parseInt(form.plazo_meses) / 12))).toFixed(2)}
                </strong>
              </div>
            </div>
          </div>
        )}

        <div style={{
          marginTop: '32px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'space-between'
        }}>
          <button
            type="button"
            onClick={() => setPasoActual(5)}
            className="ui-btn"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>←</span>
            <span>Volver</span>
          </button>

          <button
            type="submit"
            className="ui-btn ui-btn--primary"
            disabled={loading}
            style={{
              background: loading
                ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minWidth: '220px',
              justifyContent: 'center'
            }}
          >
            {loading ? (
              <>
                <span style={{
                  display: 'inline-block',
                  width: '16px',
                  height: '16px',
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }}>
                </span>
                <span>Creando Crédito...</span>
              </>
            ) : (
              <>
                <span>🎉</span>
                <span>Crear Crédito</span>
              </>
            )}
          </button>
        </div>
      </form>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CrearCreditoStep;
