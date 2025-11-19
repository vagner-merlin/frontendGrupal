import React, { useState } from 'react';
import { useCliente } from '../context/useCliente';
import { createCliente } from '../service';
import '../../../styles/theme.css';

const CrearClienteStep: React.FC = () => {
  const { setPasoActual, setClienteId, marcarPasoCompletado, setClienteData } = useCliente();
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    telefono: ''
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

    // Validaciones
    if (!form.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }
    if (!form.apellido.trim()) {
      setError('El apellido es requerido');
      return;
    }
    if (!form.telefono.trim()) {
      setError('El teléfono es requerido');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        telefono: form.telefono.trim()
      };

      console.log('📤 Enviando cliente:', payload);
      const resultado = await createCliente(payload);
      console.log('✅ Cliente creado:', resultado);
      
      setSuccess(`✅ Cliente "${form.nombre} ${form.apellido}" creado exitosamente`);
      if (resultado.id) {
        setClienteId(resultado.id);
      }
      setClienteData(form);
      marcarPasoCompletado(1);

      setTimeout(() => {
        setPasoActual(2);
      }, 1000);
    } catch (err) {
      console.error('❌ Error al crear cliente:', err);
      
      const error = err as { response?: { data?: unknown }; message?: string };
      console.error('❌ Detalle del error:', error.response?.data);
      
      let mensajeError = 'Error al crear el cliente';
      
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
          <span style={{ fontSize: '32px' }}>👤</span>
          <span>Paso 1: Registrar Cliente</span>
        </h3>
        <p className="ui-card__description">
          Ingrese los datos personales básicos del cliente
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
          {/* Nombre */}
          <div>
            <label className="ui-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>👤</span>
                <span>Nombre *</span>
              </span>
            </label>
            <input
              type="text"
              name="nombre"
              className="ui-input"
              placeholder="Ej: Juan Carlos"
              value={form.nombre}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          {/* Apellido */}
          <div>
            <label className="ui-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>👥</span>
                <span>Apellido *</span>
              </span>
            </label>
            <input
              type="text"
              name="apellido"
              className="ui-input"
              placeholder="Ej: Pérez González"
              value={form.apellido}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="ui-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📱</span>
                <span>Teléfono *</span>
              </span>
            </label>
            <input
              type="text"
              name="telefono"
              className="ui-input"
              placeholder="Ej: +591 70000000"
              value={form.telefono}
              onChange={handleChange}
              disabled={loading}
              required
            />
            <small style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px', display: 'block' }}>
              Incluya el código de país (Ej: +591)
            </small>
          </div>
        </div>

        {/* Botones */}
        <div style={{
          marginTop: '32px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
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
              minWidth: '200px',
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
                <span>Crear Cliente y Continuar</span>
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

export default CrearClienteStep;
