// src/modules/creditos/consulta_estado.tsx - HU18
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEstadoCreditoByCI } from './service';
import '../../styles/theme.css';

interface EstadoCredito {
  ci_cliente: string;
  nombre_cliente: string;
  apellido_cliente: string;
  estado_credito: string;
  monto: string;
  moneda: string;
  fecha_aprobacion?: string | null;
}

const ConsultaEstadoPage: React.FC = () => {
  const navigate = useNavigate();
  const [ci, setCi] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [creditos, setCreditos] = useState<EstadoCredito[]>([]);
  const [consultaRealizada, setConsultaRealizada] = useState(false);

  const handleConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ci.trim()) {
      setError('Por favor ingrese un número de CI');
      return;
    }
    setLoading(true);
    setError('');
    setCreditos([]);
    setConsultaRealizada(false);
    try {
      const response = await getEstadoCreditoByCI(ci.trim());
      setCreditos(Array.isArray(response) ? response : [response]);
      setConsultaRealizada(true);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'No se encontraron créditos para este CI');
      setConsultaRealizada(true);
    } finally {
      setLoading(false);
    }
  };

  const ESTADOS_CONFIG: Record<string, { label: string; color: string; bg: string; step: number }> = {
    SOLICITADO: { label: 'Solicitado', color: '#3b82f6', bg: '#eff6ff', step: 1 },
    Pendiente: { label: 'Pendiente', color: '#f59e0b', bg: '#fffbeb', step: 1 },
    Aprobado: { label: 'Aprobado', color: '#10b981', bg: '#f0fdf4', step: 2 },
    Rechazado: { label: 'Rechazado', color: '#ef4444', bg: '#fef2f2', step: 0 },
    DESENBOLSADO: { label: 'Desembolsado', color: '#059669', bg: '#ecfdf5', step: 3 },
    FINALIZADO: { label: 'Finalizado', color: '#6b7280', bg: '#f9fafb', step: 4 },
  };

  const PASOS_FLUJO = [
    { id: 1, nombre: 'Solicitado', icon: '📝' },
    { id: 2, nombre: 'Aprobado', icon: '✅' },
    { id: 3, nombre: 'Desembolsado', icon: '💰' },
    { id: 4, nombre: 'Finalizado', icon: '🎉' },
  ];

  const obtenerPasoActual = (estado: string) => {
    const config = ESTADOS_CONFIG[estado];
    return config ? config.step : 0;
  };

  const getEstadoBadge = (estado: string) => {
    const badge = ESTADOS_CONFIG[estado] || { label: estado, color: '#6b7280', bg: '#f9fafb' };
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '8px 16px',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: 700,
          color: badge.color,
          backgroundColor: badge.bg,
          border: `2px solid ${badge.color}30`,
        }}
      >
        {badge.label}
      </span>
    );
  };

  return (
    <section className="ui-page">
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => navigate('/app/creditos')}
          style={{
            background: '#6b7280',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            marginBottom: '16px',
          }}
        >
          ← Volver
        </button>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1f2937' }}>
          🔍 Consulta de Estado de Crédito
        </h1>
        <p style={{ color: '#6b7280', marginTop: '8px' }}>
          Consulte el estado actual de un crédito ingresando el CI del cliente
        </p>
      </div>

      <form
        onSubmit={handleConsulta}
        style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label
              htmlFor="ci"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
              }}
            >
              Número de CI
            </label>
            <input
              id="ci"
              type="text"
              value={ci}
              onChange={(e) => setCi(e.target.value)}
              placeholder="Ej: 7845123"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Consultando...' : 'Consultar'}
          </button>
        </div>
      </form>

      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {consultaRealizada && creditos.length === 0 && !error && (
        <div
          style={{
            background: '#f3f4f6',
            padding: '40px',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#6b7280',
          }}
        >
          <p style={{ fontSize: '16px' }}>No se encontraron créditos para el CI ingresado</p>
        </div>
      )}

      {creditos.map((credito) => {
        const pasoActual = obtenerPasoActual(credito.estado_credito);
        
        return (
          <div
            key={credito.ci_cliente}
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              marginBottom: '24px',
            }}
          >
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
                {credito.nombre_cliente} {credito.apellido_cliente}
              </h2>
              <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>
                CI: {credito.ci_cliente}
              </p>
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937', marginBottom: '12px' }}>
                Monto: {credito.moneda} {parseFloat(credito.monto).toLocaleString('es-BO', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <div>{getEstadoBadge(credito.estado_credito)}</div>
              {credito.fecha_aprobacion && (
                <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>
                  Fecha de aprobación: {new Date(credito.fecha_aprobacion).toLocaleDateString('es-BO')}
                </p>
              )}
            </div>

            {credito.estado_credito !== 'Rechazado' && (
              <div style={{ marginTop: '32px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937', marginBottom: '20px' }}>
                  Flujo del Crédito
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {PASOS_FLUJO.map((paso, index) => {
                    const isActive = paso.id <= pasoActual;
                    const isCurrent = paso.id === pasoActual;
                    
                    return (
                      <React.Fragment key={paso.id}>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                          <div
                            style={{
                              width: '60px',
                              height: '60px',
                              borderRadius: '50%',
                              background: isActive ? '#3b82f6' : '#e5e7eb',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '24px',
                              margin: '0 auto 12px',
                              border: isCurrent ? '4px solid #60a5fa' : 'none',
                              transition: 'all 0.3s',
                            }}
                          >
                            {paso.icon}
                          </div>
                          <p
                            style={{
                              fontSize: '14px',
                              fontWeight: isCurrent ? 700 : 500,
                              color: isActive ? '#1f2937' : '#9ca3af',
                            }}
                          >
                            {paso.nombre}
                          </p>
                        </div>
                        {index < PASOS_FLUJO.length - 1 && (
                          <div
                            style={{
                              flex: 1,
                              height: '4px',
                              background: paso.id < pasoActual ? '#3b82f6' : '#e5e7eb',
                              margin: '0 8px',
                              maxWidth: '100px',
                              transition: 'all 0.3s',
                            }}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}

            {credito.estado_credito === 'Rechazado' && (
              <div
                style={{
                  marginTop: '24px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  padding: '16px',
                  borderRadius: '8px',
                  color: '#dc2626',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: '16px', fontWeight: 600 }}>
                  ❌ Este crédito ha sido rechazado
                </p>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
};

export default ConsultaEstadoPage;
