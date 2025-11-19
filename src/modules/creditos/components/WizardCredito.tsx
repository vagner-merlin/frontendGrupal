import React, { useState } from 'react';
import './WizardCredito.css';

interface WizardStep {
  id: number;
  titulo: string;
  descripcion: string;
  icono: string;
}

const pasos: WizardStep[] = [
  { id: 1, titulo: 'Solicitud', descripcion: 'Datos de la solicitud', icono: '📋' },
  { id: 2, titulo: 'Documentación', descripcion: 'Documentación personal', icono: '📄' },
  { id: 3, titulo: 'Info Laboral', descripcion: 'Información laboral', icono: '💼' },
  { id: 4, titulo: 'Domicilio', descripcion: 'Domicilio', icono: '🏠' },
  { id: 5, titulo: 'Garante', descripcion: 'Datos del garante', icono: '🤝' },
  { id: 6, titulo: 'Revisión', descripcion: 'Revisión y aprobación', icono: '✅' },
];

interface WizardCreditoProps {
  creditoId: number;
  onComplete?: (creditoId: number) => void;
}

export const WizardCredito: React.FC<WizardCreditoProps> = ({ creditoId, onComplete }) => {
  const [pasoActual, setPasoActual] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSiguiente = async () => {
    setCargando(true);
    setError(null);

    try {
      // Lógica para guardar datos y avanzar al siguiente paso
      if (pasoActual < pasos.length) {
        setPasoActual(pasoActual + 1);
      } else {
        onComplete?.(creditoId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setCargando(false);
    }
  };

  const handleAnterior = () => {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1);
    }
  };

  const porcentajeProgreso = (pasoActual / pasos.length) * 100;

  return (
    <div className="wizard-container">
      {/* Header */}
      <div className="wizard-header">
        <h2>Solicitud de Crédito</h2>
        <p>Paso {pasoActual} de {pasos.length}</p>
      </div>

      {/* Barra de progreso */}
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${porcentajeProgreso}%` }}></div>
      </div>

      {/* Indicadores de pasos */}
      <div className="wizard-steps-indicators">
        {pasos.map((paso) => (
          <div
            key={paso.id}
            className={`step-indicator ${
              paso.id === pasoActual ? 'activo' : paso.id < pasoActual ? 'completado' : ''
            }`}
            onClick={() => paso.id < pasoActual && setPasoActual(paso.id)}
          >
            <div className="step-icono">{paso.icono}</div>
            <div className="step-titulo">{paso.titulo}</div>
          </div>
        ))}
      </div>

      {/* Contenido del paso actual */}
      <div className="wizard-content">
        <div className="paso-contenido">
          <h3>{pasos[pasoActual - 1].descripcion}</h3>
          
          {pasoActual === 1 && <Paso1Solicitud creditoId={creditoId} />}
          {pasoActual === 2 && <Paso2Documentacion creditoId={creditoId} />}
          {pasoActual === 3 && <Paso3Laboral creditoId={creditoId} />}
          {pasoActual === 4 && <Paso4Domicilio creditoId={creditoId} />}
          {pasoActual === 5 && <Paso5Garante creditoId={creditoId} />}
          {pasoActual === 6 && <Paso6Revision creditoId={creditoId} />}
        </div>
      </div>

      {/* Mensaje de error */}
      {error && <div className="error-message">{error}</div>}

      {/* Botones de navegación */}
      <div className="wizard-buttons">
        <button
          onClick={handleAnterior}
          disabled={pasoActual === 1 || cargando}
          className="btn btn-secundario"
        >
          ← Anterior
        </button>
        <button
          onClick={handleSiguiente}
          disabled={cargando}
          className="btn btn-primario"
        >
          {cargando ? 'Guardando...' : pasoActual === pasos.length ? 'Enviar Solicitud' : 'Siguiente →'}
        </button>
      </div>
    </div>
  );
};

// Componentes para cada paso

const Paso1Solicitud: React.FC<{ creditoId: number }> = () => (
  <div className="paso-form">
    <input type="number" placeholder="Monto solicitado" className="form-input" />
    <select className="form-input">
      <option>Selecciona tipo de crédito</option>
      <option>Crédito Personal</option>
      <option>Crédito Empresarial</option>
    </select>
    <input type="number" placeholder="Número de cuotas" className="form-input" />
  </div>
);

const Paso2Documentacion: React.FC<{ creditoId: number }> = () => (
  <div className="paso-form">
    <input type="text" placeholder="Número de CI" className="form-input" />
    <label className="file-input-label">
      <span>📎 Subir documento</span>
      <input type="file" accept="application/pdf,image/*" />
    </label>
  </div>
);

const Paso3Laboral: React.FC<{ creditoId: number }> = () => (
  <div className="paso-form">
    <input type="text" placeholder="Empresa" className="form-input" />
    <input type="text" placeholder="Cargo" className="form-input" />
    <input type="number" placeholder="Salario" className="form-input" />
    <label className="file-input-label">
      <span>📎 Extracto bancario</span>
      <input type="file" accept="application/pdf,image/*" />
    </label>
  </div>
);

const Paso4Domicilio: React.FC<{ creditoId: number }> = () => (
  <div className="paso-form">
    <textarea placeholder="Descripción del domicilio" className="form-input" rows={3}></textarea>
    <label>
      <input type="checkbox" /> Soy propietario
    </label>
    <label className="file-input-label">
      <span>📎 Croquis/Foto</span>
      <input type="file" accept="image/*" />
    </label>
  </div>
);

const Paso5Garante: React.FC<{ creditoId: number }> = () => (
  <div className="paso-form">
    <input type="text" placeholder="Nombre del garante" className="form-input" />
    <input type="text" placeholder="CI del garante" className="form-input" />
    <input type="tel" placeholder="Teléfono del garante" className="form-input" />
  </div>
);

const Paso6Revision: React.FC<{ creditoId: number }> = () => (
  <div className="paso-resumen">
    <div className="resumen-item">
      <h4>✅ Resumen de tu solicitud</h4>
      <p>Verifica que todos los datos sean correctos antes de enviar.</p>
    </div>
    <div className="resumen-checklist">
      <div className="checklist-item">✓ Solicitud completada</div>
      <div className="checklist-item">✓ Documentación personal</div>
      <div className="checklist-item">✓ Información laboral</div>
      <div className="checklist-item">✓ Domicilio</div>
      <div className="checklist-item">✓ Datos del garante</div>
    </div>
  </div>
);

export default WizardCredito;
