import React, { useState } from 'react';
import './TimelineCredito.css';

interface TimelineEvent {
  fase_anterior: string | null;
  fase_nueva: string;
  fecha_cambio: string;
  usuario: string;
  descripcion: string;
  datos_agregados: Record<string, any>;
}

interface TimelineCreditoProps {
  creditoId: number;
  faseActual: string;
  estado: string;
  eventos: TimelineEvent[];
}

const fasesConfig: Record<string, { titulo: string; icono: string; color: string }> = {
  FASE_1_SOLICITUD: { titulo: 'Datos de la solicitud', icono: '📋', color: 'blue' },
  FASE_2_DOCUMENTACION: { titulo: 'Documentación personal', icono: '📄', color: 'green' },
  FASE_3_LABORAL: { titulo: 'Información laboral', icono: '💼', color: 'purple' },
  FASE_4_DOMICILIO: { titulo: 'Domicilio', icono: '🏠', color: 'orange' },
  FASE_5_GARANTE: { titulo: 'Datos del garante', icono: '🤝', color: 'pink' },
  FASE_6_REVISION: { titulo: 'Revisión y aprobación', icono: '👨‍💼', color: 'yellow' },
  FASE_7_DESEMBOLSO: { titulo: 'Desembolso del crédito', icono: '💰', color: 'green' },
  FASE_8_FINALIZADO: { titulo: 'Crédito finalizado', icono: '✅', color: 'gray' },
};

export const TimelineCredito: React.FC<TimelineCreditoProps> = ({
  creditoId,
  faseActual,
  estado,
  eventos,
}) => {
  const [expandidos, setExpandidos] = useState<Record<number, boolean>>({});

  const toggleExpand = (index: number) => {
    setExpandidos((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const obtenerEtiquetaEstado = (estado: string) => {
    const estados: Record<string, { label: string; color: string }> = {
      SOLICITADO: { label: 'Solicitado', color: 'blue' },
      Pendiente: { label: 'Pendiente', color: 'yellow' },
      Aprobado: { label: 'Aprobado', color: 'green' },
      DESENBOLSADO: { label: 'Desembolsado', color: 'green' },
      Rechazado: { label: 'Rechazado', color: 'red' },
      FINALIZADO: { label: 'Finalizado', color: 'gray' },
    };
    return estados[estado] || { label: estado, color: 'gray' };
  };

  const estadoInfo = obtenerEtiquetaEstado(estado);
  const faseConfig = fasesConfig[faseActual] || { titulo: faseActual, icono: '❓', color: 'gray' };

  return (
    <div className="timeline-container">
      {/* Header con información actual */}
      <div className="timeline-header">
        <div className="header-info">
          <div className="header-titulo">
            <h2>Línea de Tiempo - Crédito #{creditoId}</h2>
            <div className="header-badges">
              <span className={`badge badge-${estadoInfo.color}`}>
                {estadoInfo.label}
              </span>
              <span className={`badge badge-${faseConfig.color}`}>
                {faseConfig.icono} {faseConfig.titulo}
              </span>
            </div>
          </div>
        </div>

        {/* Resumen de progreso */}
        <div className="progress-summary">
          <div className="progress-item">
            <div className="progress-item-label">Total de cambios</div>
            <div className="progress-item-value">{eventos.length}</div>
          </div>
        </div>
      </div>

      {/* Timeline vertical */}
      <div className="timeline-vertical">
        {eventos.map((evento, index) => {
          const faseNuevaConfig = fasesConfig[evento.fase_nueva] || {
            titulo: evento.fase_nueva,
            icono: '❓',
            color: 'gray',
          };

          return (
            <div key={index} className="timeline-event">
              {/* Marcador */}
              <div className="event-marker">
                <div className={`marker-circle marker-${faseNuevaConfig.color}`}>
                  {faseNuevaConfig.icono}
                </div>
                {index < eventos.length - 1 && <div className="marker-line"></div>}
              </div>

              {/* Contenido del evento */}
              <div className="event-content">
                <div
                  className="event-header"
                  onClick={() => toggleExpand(index)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && toggleExpand(index)}
                >
                  <div className="event-header-info">
                    <h3>{faseNuevaConfig.titulo}</h3>
                    <p className="event-description">{evento.descripcion}</p>
                  </div>

                  <div className="event-header-meta">
                    <span className="event-usuario">{evento.usuario}</span>
                    <span className="event-fecha">
                      {new Date(evento.fecha_cambio).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <button
                      className={`expand-btn ${expandidos[index] ? 'expanded' : ''}`}
                      aria-label="Expandir detalles"
                    >
                      ▼
                    </button>
                  </div>
                </div>

                {/* Detalles expandibles */}
                {expandidos[index] && evento.datos_agregados && Object.keys(evento.datos_agregados).length > 0 && (
                  <div className="event-details">
                    <h4>Datos agregados:</h4>
                    <div className="details-grid">
                      {Object.entries(evento.datos_agregados).map(([key, value]) => (
                        <div key={key} className="detail-item">
                          <span className="detail-label">{key}:</span>
                          <span className="detail-value">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Estado vacío */}
      {eventos.length === 0 && (
        <div className="timeline-empty">
          <div className="empty-icon">📭</div>
          <p>Sin cambios registrados aún</p>
        </div>
      )}

      {/* Leyenda de colores */}
      <div className="timeline-legend">
        <h4>Fases:</h4>
        <div className="legend-grid">
          {Object.entries(fasesConfig).map(([clave, config]) => (
            <div key={clave} className="legend-item">
              <span className={`legend-color legend-${config.color}`}></span>
              <span className="legend-texto">{config.titulo}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimelineCredito;
