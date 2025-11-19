import React, { useState, useEffect } from 'react';
import { useCliente } from '../context/useCliente';
import { listTiposCredito } from '../../creditos/tipos/service';
import type { TipoCredito as TipoCreditoAPI } from '../../creditos/tipos/types';
import '../../../styles/theme.css';

// Helper para convertir montos de forma segura
const toNumber = (value: string | number): number => {
  return typeof value === 'number' ? value : parseFloat(value);
};

const SeleccionarTipoCreditoStep: React.FC = () => {
  const { setPasoActual, marcarPasoCompletado, clienteData } = useCliente();
  const [tiposCredito, setTiposCredito] = useState<TipoCreditoAPI[]>([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoCreditoAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarTiposCredito();
  }, []);

  const cargarTiposCredito = async () => {
    setLoading(true);
    try {
      const response = await listTiposCredito();
      const tipos = Array.isArray(response) ? response : response.results || [];
      setTiposCredito(tipos as TipoCreditoAPI[]);
    } catch (err) {
      console.error('❌ Error al cargar tipos de crédito:', err);
      setError('Error al cargar los tipos de crédito disponibles');
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionar = (tipo: TipoCreditoAPI) => {
    setTipoSeleccionado(tipo);
    // Guardar en localStorage para usar en el siguiente paso
    localStorage.setItem('tipo_credito_seleccionado', JSON.stringify(tipo));
    marcarPasoCompletado(5);
    
    setTimeout(() => {
      setPasoActual(6);
    }, 500);
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h3 className="ui-card__title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '32px' }}>📋</span>
          <span>Paso 5: Seleccionar Tipo de Crédito</span>
        </h3>
        <p className="ui-card__description">
          Elija el tipo de crédito para el cliente: {clienteData.nombre} {clienteData.apellido}
        </p>
      </div>

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
          fontWeight: '500'
        }}>
          <span style={{ fontSize: '24px' }}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{
            display: 'inline-block',
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <p style={{ marginTop: '16px', color: '#6b7280' }}>Cargando tipos de crédito...</p>
        </div>
      ) : tiposCredito.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: '#f9fafb',
          borderRadius: '12px'
        }}>
          <span style={{ fontSize: '48px' }}>📭</span>
          <p style={{ marginTop: '16px', color: '#6b7280' }}>No hay tipos de crédito disponibles</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {tiposCredito.map((tipo) => (
            <div
              key={tipo.id}
              onClick={() => handleSeleccionar(tipo)}
              style={{
                background: tipoSeleccionado?.id === tipo.id
                  ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)'
                  : 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                border: tipoSeleccionado?.id === tipo.id
                  ? '3px solid #22c55e'
                  : '2px solid #e5e7eb',
                borderRadius: '16px',
                padding: '24px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: tipoSeleccionado?.id === tipo.id ? 'scale(1.05)' : 'scale(1)',
                boxShadow: tipoSeleccionado?.id === tipo.id
                  ? '0 8px 24px rgba(34, 197, 94, 0.3)'
                  : '0 2px 8px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                if (tipoSeleccionado?.id !== tipo.id) {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (tipoSeleccionado?.id !== tipo.id) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '12px'
              }}>
                <h4 style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: '700',
                  color: tipoSeleccionado?.id === tipo.id ? 'white' : '#1f2937'
                }}>
                  {tipo.nombre}
                </h4>
                {tipoSeleccionado?.id === tipo.id && (
                  <span style={{
                    background: 'white',
                    color: '#22c55e',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: '700',
                    flexShrink: 0
                  }}>
                    ✓
                  </span>
                )}
              </div>

              <p style={{
                margin: '0 0 16px 0',
                fontSize: '14px',
                color: tipoSeleccionado?.id === tipo.id ? 'rgba(255,255,255,0.95)' : '#6b7280',
                lineHeight: '1.5'
              }}>
                {tipo.descripcion}
              </p>

              <div style={{
                background: tipoSeleccionado?.id === tipo.id
                  ? 'rgba(255,255,255,0.2)'
                  : 'white',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '13px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span style={{
                    color: tipoSeleccionado?.id === tipo.id ? 'rgba(255,255,255,0.9)' : '#6b7280'
                  }}>
                    Mínimo:
                  </span>
                  <strong style={{
                    color: tipoSeleccionado?.id === tipo.id ? 'white' : '#1f2937'
                  }}>
                    ${toNumber(tipo.monto_minimo).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{
                    color: tipoSeleccionado?.id === tipo.id ? 'rgba(255,255,255,0.9)' : '#6b7280'
                  }}>
                    Máximo:
                  </span>
                  <strong style={{
                    color: tipoSeleccionado?.id === tipo.id ? 'white' : '#1f2937'
                  }}>
                    ${toNumber(tipo.monto_maximo).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{
        marginTop: '32px',
        display: 'flex',
        gap: '12px',
        justifyContent: 'space-between'
      }}>
        <button
          onClick={() => setPasoActual(4)}
          className="ui-btn"
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

        {tipoSeleccionado && (
          <button
            onClick={() => handleSeleccionar(tipoSeleccionado)}
            className="ui-btn ui-btn--primary"
            style={{
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>✓</span>
            <span>Confirmar y Continuar</span>
          </button>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SeleccionarTipoCreditoStep;
