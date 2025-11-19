import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClienteProvider } from '../context/ClienteContext';
import { useCliente } from '../context/useCliente';
import WizardSteps from '../components/WizardSteps';
import CrearClienteStep from './CrearClienteStep.tsx';
import CrearDocumentacionStep from './CrearDocumentacionStep.tsx';
import CrearTrabajoStep from './CrearTrabajoStep.tsx';
import CrearDomicilioStep from './CrearDomicilioStep.tsx';
import SeleccionarTipoCreditoStep from './SeleccionarTipoCreditoStep.tsx';
import CrearCreditoStep from './CrearCreditoStep.tsx';
import '../../../styles/theme.css';

const WizardContent: React.FC = () => {
  const navigate = useNavigate();
  const { pasoActual, setPasoActual, clienteId, resetearFlujo } = useCliente();

  const renderPasoActual = () => {
    switch (pasoActual) {
      case 1:
        return <CrearClienteStep />;
      case 2:
        return <CrearDocumentacionStep />;
      case 3:
        return <CrearTrabajoStep />;
      case 4:
        return <CrearDomicilioStep />;
      case 5:
        return <SeleccionarTipoCreditoStep />;
      case 6:
        return <CrearCreditoStep />;
      default:
        return <CrearClienteStep />;
    }
  };

  const handleCancelar = () => {
    if (window.confirm('¿Estás seguro de cancelar? Se perderá el progreso actual.')) {
      resetearFlujo();
      navigate('/app/clientes');
    }
  };

  return (
    <section className="ui-page">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700' }}>
            🎯 Registro de Cliente y Crédito
          </h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
            Complete los pasos en orden para registrar un cliente y solicitar un crédito
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleCancelar}
            className="ui-btn"
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>✕</span>
            <span>Cancelar</span>
          </button>
          <button
            onClick={() => navigate('/app/clientes')}
            className="ui-btn"
            style={{
              background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>📋</span>
            <span>Ver Clientes</span>
          </button>
        </div>
      </div>

      {/* Wizard Steps */}
      <WizardSteps onPasoClick={(paso) => {
        // Permitir navegar solo a pasos completados o al paso actual
        if (paso <= pasoActual) {
          setPasoActual(paso);
        }
      }} />

      {/* Contenido del paso actual */}
      <div className="ui-card">
        {renderPasoActual()}
      </div>

      {/* Información del cliente actual */}
      {clienteId && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '14px',
          color: '#1e40af'
        }}>
          <span style={{ fontSize: '20px' }}>ℹ️</span>
          <span>
            <strong>Cliente ID:</strong> {clienteId} - Trabajando con este cliente en todos los pasos
          </span>
        </div>
      )}
    </section>
  );
};

const ClienteWizard: React.FC = () => {
  return (
    <ClienteProvider>
      <WizardContent />
    </ClienteProvider>
  );
};

export default ClienteWizard;
