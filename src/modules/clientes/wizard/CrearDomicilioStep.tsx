import React, { useState } from 'react';
import { useCliente } from '../context/useCliente';
import { createDomicilio } from '../domicilios/service';
import '../../../styles/theme.css';

const CrearDomicilioStep: React.FC = () => {
  const { clienteId, setPasoActual, marcarPasoCompletado, clienteData } = useCliente();
  const [form, setForm] = useState({
    descripcion: '',
    croquis_url: '',
    es_propietario: 'true',
    numero_ref: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!clienteId) {
      setError('Error: No se ha creado el cliente.');
      return;
    }

    if (!form.descripcion.trim() || !form.croquis_url.trim() || !form.numero_ref.trim()) {
      setError('Todos los campos son requeridos');
      return;
    }

    // Validar formato de URL
    if (!form.croquis_url.trim().startsWith('http://') && !form.croquis_url.trim().startsWith('https://')) {
      setError('La URL del croquis debe comenzar con http:// o https://');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        descripcion: form.descripcion.trim(),
        croquis_url: form.croquis_url.trim(),
        es_propietario: form.es_propietario === 'true',
        numero_ref: form.numero_ref.trim(),
        id_cliente: clienteId
      };

      console.log('📤 Enviando domicilio:', payload);
      const resultado = await createDomicilio(payload);
      console.log('✅ Domicilio creado:', resultado);

      setSuccess('✅ Domicilio registrado exitosamente');
      marcarPasoCompletado(4);

      setTimeout(() => {
        setPasoActual(5);
      }, 1000);
    } catch (err) {
      console.error('❌ Error al crear domicilio:', err);
      
      const error = err as { response?: { data?: unknown }; message?: string };
      console.error('❌ Detalle del error:', error.response?.data);
      
      let mensajeError = 'Error al registrar el domicilio';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
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
          
          // Mensaje específico para error de OneToOne
          if (mensajeError.toLowerCase().includes('already exists') || 
              mensajeError.toLowerCase().includes('ya existe') ||
              mensajeError.toLowerCase().includes('unique')) {
            mensajeError = '⚠️ Este cliente ya tiene un domicilio registrado. Un cliente solo puede tener un domicilio (OneToOne). Si necesitas actualizarlo, ve al historial de clientes.';
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

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h3 className="ui-card__title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '32px' }}>🏠</span>
          <span>Paso 4: Domicilio del Cliente</span>
        </h3>
        <p className="ui-card__description">
          Registre la dirección del cliente: {clienteData.nombre} {clienteData.apellido}
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
        <div style={{ display: 'grid', gap: '20px' }}>
          <div>
            <label className="ui-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📍</span>
                <span>Dirección Completa *</span>
              </span>
            </label>
            <textarea
              name="descripcion"
              className="ui-input"
              placeholder="Ej: Av. 6 de Agosto #1234, Edificio Torre Azul, Piso 5, Dpto 502"
              value={form.descripcion}
              onChange={handleChange}
              disabled={loading}
              rows={3}
              required
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          <div>
            <label className="ui-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🗺️</span>
                <span>URL del Croquis/Mapa *</span>
              </span>
            </label>
            <input
              type="url"
              name="croquis_url"
              className="ui-input"
              placeholder="https://storage.ejemplo.com/croquis/domicilio-123.jpg"
              value={form.croquis_url}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="ui-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🏘️</span>
                <span>Tipo de Vivienda *</span>
              </span>
            </label>
            <select
              name="es_propietario"
              className="ui-select"
              value={form.es_propietario}
              onChange={handleChange}
              disabled={loading}
              required
            >
              <option value="true">🏠 Propietario</option>
              <option value="false">🏘️ Alquiler</option>
            </select>
          </div>

          <div>
            <label className="ui-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>#️⃣</span>
                <span>Número de Referencia *</span>
              </span>
            </label>
            <input
              type="text"
              name="numero_ref"
              className="ui-input"
              placeholder="Ej: 502-TA"
              value={form.numero_ref}
              onChange={handleChange}
              disabled={loading}
              required
            />
            <small style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px', display: 'block' }}>
              Número de departamento, casa o referencia del domicilio
            </small>
          </div>
        </div>

        <div style={{
          marginTop: '32px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'space-between'
        }}>
          <button
            type="button"
            onClick={() => setPasoActual(3)}
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

export default CrearDomicilioStep;
