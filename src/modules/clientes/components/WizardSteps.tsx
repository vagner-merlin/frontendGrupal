import React from 'react';
import { useCliente } from '../context/useCliente';
import '../../../styles/theme.css';

interface WizardStepsProps {
  onPasoClick?: (paso: number) => void;
}

const WizardSteps: React.FC<WizardStepsProps> = ({ onPasoClick }) => {
  const { pasoActual, pasoCompletado } = useCliente();

  const pasos = [
    { numero: 1, titulo: 'Cliente', icono: '👤', descripcion: 'Datos personales' },
    { numero: 2, titulo: 'Documentación', icono: '📄', descripcion: 'CI y documentos' },
    { numero: 3, titulo: 'Trabajo', icono: '💼', descripcion: 'Información laboral' },
    { numero: 4, titulo: 'Domicilio', icono: '🏠', descripcion: 'Dirección' },
    { numero: 5, titulo: 'Tipo Crédito', icono: '📋', descripcion: 'Seleccionar tipo' },
    { numero: 6, titulo: 'Crédito', icono: '💰', descripcion: 'Solicitar crédito' },
  ];

  const getEstadoPaso = (numeroPaso: number) => {
    if (pasoCompletado(numeroPaso)) return 'completado';
    if (numeroPaso === pasoActual) return 'activo';
    if (numeroPaso < pasoActual) return 'disponible';
    return 'bloqueado';
  };

  const handlePasoClick = (numeroPaso: number) => {
    const estado = getEstadoPaso(numeroPaso);
    if (estado !== 'bloqueado' && onPasoClick) {
      onPasoClick(numeroPaso);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '24px',
      borderRadius: '12px',
      marginBottom: '24px',
      boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
    }}>
      <h3 style={{
        color: 'white',
        margin: '0 0 20px 0',
        fontSize: '20px',
        fontWeight: '600',
        textAlign: 'center'
      }}>
        🎯 Proceso de Registro de Cliente y Crédito
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px'
      }}>
        {pasos.map((paso) => {
          const estado = getEstadoPaso(paso.numero);
          const esActivo = estado === 'activo';
          const esCompletado = estado === 'completado';
          const esBloqueado = estado === 'bloqueado';

          return (
            <div
              key={paso.numero}
              onClick={() => handlePasoClick(paso.numero)}
              style={{
                position: 'relative',
                background: esActivo
                  ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)'
                  : esCompletado
                  ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                  : esBloqueado
                  ? '#4b5563'
                  : 'rgba(255,255,255,0.2)',
                padding: '16px',
                borderRadius: '12px',
                cursor: esBloqueado ? 'not-allowed' : 'pointer',
                opacity: esBloqueado ? 0.5 : 1,
                transform: esActivo ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.3s ease',
                border: esActivo ? '3px solid #fff' : '2px solid transparent',
                boxShadow: esActivo
                  ? '0 8px 20px rgba(74, 222, 128, 0.4)'
                  : '0 4px 8px rgba(0,0,0,0.2)'
              }}
              onMouseEnter={(e) => {
                if (!esBloqueado) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!esActivo) {
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              {/* Número de paso */}
              <div style={{
                position: 'absolute',
                top: '-8px',
                left: '8px',
                background: esCompletado ? '#22c55e' : esActivo ? '#fff' : '#6b7280',
                color: esActivo ? '#000' : '#fff',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '700',
                border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                {esCompletado ? '✓' : paso.numero}
              </div>

              {/* Icono */}
              <div style={{
                fontSize: '32px',
                textAlign: 'center',
                marginBottom: '8px',
                filter: esBloqueado ? 'grayscale(1)' : 'none'
              }}>
                {paso.icono}
              </div>

              {/* Título */}
              <div style={{
                color: 'white',
                fontSize: '14px',
                fontWeight: '700',
                textAlign: 'center',
                marginBottom: '4px'
              }}>
                {paso.titulo}
              </div>

              {/* Descripción */}
              <div style={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: '11px',
                textAlign: 'center'
              }}>
                {paso.descripcion}
              </div>

              {/* Indicador de estado */}
              {esActivo && (
                <div style={{
                  position: 'absolute',
                  bottom: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#fff',
                  color: '#22c55e',
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  En progreso
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Línea de progreso */}
      <div style={{
        marginTop: '20px',
        background: 'rgba(255,255,255,0.2)',
        height: '8px',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          background: 'linear-gradient(90deg, #4ade80 0%, #22c55e 100%)',
          height: '100%',
          width: `${(pasoActual / 6) * 100}%`,
          transition: 'width 0.5s ease',
          boxShadow: '0 0 10px rgba(74, 222, 128, 0.5)'
        }} />
      </div>

      <div style={{
        marginTop: '8px',
        color: 'white',
        fontSize: '12px',
        textAlign: 'center',
        fontWeight: '500'
      }}>
        Progreso: {pasoActual} de 6 pasos ({Math.round((pasoActual / 6) * 100)}%)
      </div>
    </div>
  );
};

export default WizardSteps;
