import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCreditoById, obtenerEstadoActual } from '../service';
import type { Credito } from '../types';
import '../../clientes/context/context';
import '../../../styles/theme.css';

interface EstadoActualData {
  id: number;
  fase_actual: string;
  descripcion_fase: string;
  porcentaje_progreso: number;
  datos_recopilados: Record<string, any>;
  puede_avanzar: boolean;
  razon_rechazo?: string;
}

const FASES_ICONS: Record<string, string> = {
  'FASE_1_SOLICITUD': '📋',
  'FASE_2_DOCUMENTACION': '📄',
  'FASE_3_LABORAL': '💼',
  'FASE_4_DOMICILIO': '🏠',
  'FASE_5_GARANTE': '👤',
  'FASE_6_REVISION': '👁️',
  'FASE_7_DESEMBOLSO': '💰',
  'FASE_8_FINALIZADO': '✅',
};

const FASES_DESCRIPCIONES: Record<string, string> = {
  'FASE_1_SOLICITUD': 'Datos de la solicitud',
  'FASE_2_DOCUMENTACION': 'Documentación personal',
  'FASE_3_LABORAL': 'Información laboral',
  'FASE_4_DOMICILIO': 'Domicilio',
  'FASE_5_GARANTE': 'Datos del garante',
  'FASE_6_REVISION': 'Revisión y aprobación',
  'FASE_7_DESEMBOLSO': 'Desembolso del crédito',
  'FASE_8_FINALIZADO': 'Crédito finalizado',
};

const CreditoWorkflowVisor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const creditoId = id ? parseInt(id, 10) : 0;
  
  const [credito, setCredito] = useState<Credito | null>(null);
  const [estado, setEstado] = useState<EstadoActualData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarDatos();
  }, [creditoId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [creditoData, estadoData] = await Promise.all([
        getCreditoById(creditoId),
        obtenerEstadoActual(creditoId)
      ]);
      setCredito(creditoData);
      setEstado(estadoData);
    } catch (err) {
      console.error('Error cargando crédito:', err);
      setError('Error al cargar el crédito');
    } finally {
      setLoading(false);
    }
  };

  const handleContinuar = () => {
    // Redirigir al wizard de créditos con el ID
    navigate(`/app/creditos/workflow/${creditoId}`);
  };

  if (loading) {
    return (
      <div style={{
        padding: '24px',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
        <p>Cargando información del crédito...</p>
      </div>
    );
  }

  if (error || !credito || !estado) {
    return (
      <div style={{
        padding: '24px',
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
        color: 'white',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <span style={{ fontSize: '24px' }}>⚠️</span>
        <span>{error || 'No se pudo cargar el crédito'}</span>
      </div>
    );
  }

  return (
    <div className="ui-card">
      {/* Header con info principal */}
      <div style={{
        padding: '24px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px'
      }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>
            💳 Crédito #{credito.id}
          </h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
            Cliente ID: {credito.cliente}
          </p>
        </div>
        <div style={{
          textAlign: 'right'
        }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#22c55e' }}>
            ${Number(credito.Monto_Solicitado).toLocaleString('es-BO', { maximumFractionDigits: 2 })}
          </div>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '12px' }}>
            {credito.Moneda}
          </p>
        </div>
      </div>

      {/* Fase actual */}
      <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
          🎯 Fase Actual
        </h3>
        <div style={{
          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
          padding: '16px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            fontSize: '40px'
          }}>
            {FASES_ICONS[estado.fase_actual] || '📋'}
          </div>
          <div>
            <div style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#1e40af',
              marginBottom: '4px'
            }}>
              {FASES_DESCRIPCIONES[estado.fase_actual] || estado.descripcion_fase}
            </div>
            <div style={{
              fontSize: '13px',
              color: '#3b82f6'
            }}>
              Progreso: {estado.porcentaje_progreso}% completado
            </div>
          </div>
        </div>
      </div>

      {/* Barra de progreso visual */}
      <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
          📊 Progreso del Flujo
        </h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          {Object.entries(FASES_DESCRIPCIONES).map(([fase, desc], index) => {
            const esCompletada = index < (parseInt(estado.fase_actual.split('_')[1]) - 1);
            const esActiva = fase === estado.fase_actual;
            
            return (
              <div key={fase} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '8px',
                background: esActiva ? '#dbeafe' : esCompletada ? '#dcfce7' : '#f3f4f6'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '700',
                  background: esCompletada ? '#22c55e' : esActiva ? '#3b82f6' : '#d1d5db',
                  color: esCompletada || esActiva ? 'white' : '#6b7280'
                }}>
                  {esCompletada ? '✓' : index + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: esActiva ? '#1e40af' : esCompletada ? '#166534' : '#374151'
                  }}>
                    {desc}
                  </div>
                </div>
                {esActiva && (
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#3b82f6',
                    background: 'rgba(59, 130, 246, 0.1)',
                    padding: '4px 8px',
                    borderRadius: '6px'
                  }}>
                    En Progreso
                  </div>
                )}
                {esCompletada && (
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#22c55e'
                  }}>
                    ✓ Completado
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Datos recopilados */}
      {Object.keys(estado.datos_recopilados).length > 0 && (
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
            📋 Datos Recopilados
          </h3>
          <div style={{
            display: 'grid',
            gap: '12px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
          }}>
            {Object.entries(estado.datos_recopilados).map(([key, value]) => (
              <div key={key} style={{
                padding: '12px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  marginBottom: '4px',
                  textTransform: 'uppercase'
                }}>
                  {key}
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#111827'
                }}>
                  {String(value) || '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Razón de rechazo si aplica */}
      {estado.razon_rechazo && (
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
          borderRadius: '8px',
          margin: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <span style={{ fontSize: '24px', marginTop: '4px' }}>❌</span>
            <div>
              <h4 style={{ margin: '0 0 8px 0', color: '#991b1b', fontWeight: '700' }}>
                Motivo del Rechazo
              </h4>
              <p style={{ margin: 0, color: '#7c2d12', fontSize: '14px' }}>
                {estado.razon_rechazo}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div style={{
        padding: '24px',
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={() => navigate('/app/creditos')}
          className="ui-btn"
          style={{
            background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
          }}
        >
          ← Volver a Créditos
        </button>
        
        {estado.puede_avanzar && (
          <button
            onClick={handleContinuar}
            className="ui-btn ui-btn--primary"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              minWidth: '180px'
            }}
          >
            ▶️ Continuar Workflow
          </button>
        )}
      </div>
    </div>
  );
};

export default CreditoWorkflowVisor;
