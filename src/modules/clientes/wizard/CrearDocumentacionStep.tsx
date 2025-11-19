import React, { useState } from 'react';
import { useCliente } from '../context/useCliente';
import { createDocumentacion } from '../documentacion/service';
import '../../../styles/theme.css';

const CrearDocumentacionStep: React.FC = () => {
  const { clienteId, setPasoActual, marcarPasoCompletado, clienteData } = useCliente();
  const [form, setForm] = useState({
    ci: '',
    documento_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!clienteId) {
      setError('Error: No se ha creado el cliente. Vuelve al Paso 1.');
      return;
    }

    if (!form.ci.trim()) {
      setError('El CI es requerido');
      return;
    }

    // Validar que el CI solo contenga números
    if (!/^\d+$/.test(form.ci.trim())) {
      setError('El CI debe contener solo números (sin puntos ni guiones)');
      return;
    }

    if (!form.documento_url.trim()) {
      setError('La URL del documento es requerida');
      return;
    }

    // Validar formato de URL
    if (!form.documento_url.startsWith('http://') && !form.documento_url.startsWith('https://')) {
      setError('La URL debe comenzar con http:// o https://');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ci: form.ci.trim(),
        documento_url: form.documento_url.trim(),
        id_cliente: clienteId
      };

      console.log('📤 Enviando documentación:', payload);
      const resultado = await createDocumentacion(payload);
      console.log('✅ Documentación creada:', resultado);

      setSuccess('✅ Documentación registrada exitosamente');
      marcarPasoCompletado(2);

      setTimeout(() => {
        setPasoActual(3);
      }, 1000);
    } catch (err) {
      console.error('❌ Error al crear documentación:', err);
      
      const error = err as { response?: { data?: unknown }; message?: string };
      console.error('❌ Detalle del error:', error.response?.data);
      
      // Extraer mensaje de error detallado del backend
      let mensajeError = 'Error al registrar la documentación';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Si el backend devuelve un objeto con detalles
        if (typeof errorData === 'object') {
          const errores = [];
          for (const [campo, mensajes] of Object.entries(errorData)) {
            if (Array.isArray(mensajes)) {
              errores.push(`${campo}: ${mensajes.join(', ')}`);
            } else {
              errores.push(`${campo}: ${mensajes}`);
            }
          }
          mensajeError = errores.join(' | ');
          
          // Mensaje específico para error de OneToOne (ya existe documentación)
          if (mensajeError.toLowerCase().includes('already exists') || 
              mensajeError.toLowerCase().includes('ya existe') ||
              mensajeError.toLowerCase().includes('unique')) {
            mensajeError = '⚠️ Este cliente ya tiene documentación registrada. Un cliente solo puede tener una documentación (OneToOne). Si necesitas actualizarla, ve al historial de clientes.';
          }
        } else if (typeof errorData === 'string') {
          mensajeError = errorData;
        }
      } else if (error.message) {
        mensajeError = error.message;
      }
      
      setError(mensajeError);
    } finally {
      setLoading(false);
    }
  };

  const handleVolver = () => {
    setPasoActual(1);
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h3 className="ui-card__title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '32px' }}>📄</span>
          <span>Paso 2: Documentación del Cliente</span>
        </h3>
        <p className="ui-card__description">
          Registre el CI y documentos del cliente: {clienteData.nombre} {clienteData.apellido}
        </p>
      </div>

      {/* Alertas */}
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
          boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
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
          boxShadow: '0 4px 12px rgba(81, 207, 102, 0.3)',
          animation: 'slideInDown 0.5s ease-out'
        }}>
          <span style={{ fontSize: '24px' }}>✅</span>
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* CI */}
          <div>
            <label className="ui-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🆔</span>
                <span>Cédula de Identidad (CI) *</span>
              </span>
            </label>
            <input
              type="text"
              name="ci"
              className="ui-input"
              placeholder="Ej: 7845123"
              value={form.ci}
              onChange={handleChange}
              disabled={loading}
              required
            />
            <small style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px', display: 'block' }}>
              Número de CI sin puntos ni guiones
            </small>
          </div>

          {/* URL del Documento */}
          <div>
            <label className="ui-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔗</span>
                <span>URL del Documento Escaneado *</span>
              </span>
            </label>
            <input
              type="url"
              name="documento_url"
              className="ui-input"
              placeholder="https://storage.ejemplo.com/docs/ci-7845123.pdf"
              value={form.documento_url}
              onChange={handleChange}
              disabled={loading}
              required
            />
            <small style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px', display: 'block' }}>
              URL completa del documento (debe iniciar con http:// o https://)
            </small>
          </div>
        </div>

        {/* Botones */}
        <div style={{
          marginTop: '32px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'space-between'
        }}>
          <button
            type="button"
            onClick={handleVolver}
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
                : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
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
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <span>✓</span>
                <span>Guardar y Continuar</span>
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

export default CrearDocumentacionStep;
