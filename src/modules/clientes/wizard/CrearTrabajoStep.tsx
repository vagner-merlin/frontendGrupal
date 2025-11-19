import React, { useState } from 'react';
import { useCliente } from '../context/useCliente';
import { createTrabajo } from '../trabajo/service';
import '../../../styles/theme.css';

const CrearTrabajoStep: React.FC = () => {
  const { clienteId, setPasoActual, marcarPasoCompletado, clienteData } = useCliente();
  const [form, setForm] = useState({
    cargo: '',
    empresa: '',
    extracto_url: '',
    salario: '',
    ubicacion: '',
    descripcion: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

    // Validaciones
    if (!form.cargo.trim() || !form.empresa.trim() || !form.extracto_url.trim() ||
        !form.salario || !form.ubicacion.trim() || !form.descripcion.trim()) {
      setError('Todos los campos son requeridos');
      return;
    }

    const salarioNum = parseFloat(form.salario);
    if (isNaN(salarioNum) || salarioNum <= 0) {
      setError('El salario debe ser un número mayor a 0');
      return;
    }

    // Validar formato de URL
    if (!form.extracto_url.trim().startsWith('http://') && !form.extracto_url.trim().startsWith('https://')) {
      setError('La URL del extracto bancario debe comenzar con http:// o https://');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        cargo: form.cargo.trim(),
        empresa: form.empresa.trim(),
        extracto_url: form.extracto_url.trim(),
        salario: salarioNum,
        ubicacion: form.ubicacion.trim(),
        descripcion: form.descripcion.trim(),
        id_cliente: clienteId
      };

      console.log('📤 Enviando información laboral:', payload);
      const resultado = await createTrabajo(payload);
      console.log('✅ Trabajo creado:', resultado);

      setSuccess('✅ Información laboral registrada exitosamente');
      marcarPasoCompletado(3);

      setTimeout(() => {
        setPasoActual(4);
      }, 1000);
    } catch (err) {
      console.error('❌ Error al crear trabajo:', err);
      
      const error = err as { response?: { data?: unknown }; message?: string };
      console.error('❌ Detalle del error:', error.response?.data);
      
      let mensajeError = 'Error al registrar la información laboral';
      
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
            mensajeError = '⚠️ Este cliente ya tiene información laboral registrada. Un cliente solo puede tener un trabajo (OneToOne). Si necesitas actualizarla, ve al historial de clientes.';
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
          <span style={{ fontSize: '32px' }}>💼</span>
          <span>Paso 3: Información Laboral</span>
        </h3>
        <p className="ui-card__description">
          Registre la información de trabajo del cliente: {clienteData.nombre} {clienteData.apellido}
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
        <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {/* Cargo */}
          <div>
            <label className="ui-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>👔</span>
                <span>Cargo/Puesto *</span>
              </span>
            </label>
            <input
              type="text"
              name="cargo"
              className="ui-input"
              placeholder="Ej: Gerente Comercial"
              value={form.cargo}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          {/* Empresa */}
          <div>
            <label className="ui-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🏢</span>
                <span>Empresa *</span>
              </span>
            </label>
            <input
              type="text"
              name="empresa"
              className="ui-input"
              placeholder="Ej: Empresa XYZ S.A."
              value={form.empresa}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          {/* Salario */}
          <div>
            <label className="ui-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>💰</span>
                <span>Salario Mensual *</span>
              </span>
            </label>
            <input
              type="number"
              name="salario"
              className="ui-input"
              placeholder="Ej: 5000.00"
              step="0.01"
              min="0"
              value={form.salario}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          {/* Ubicación */}
          <div>
            <label className="ui-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📍</span>
                <span>Ubicación del Trabajo *</span>
              </span>
            </label>
            <input
              type="text"
              name="ubicacion"
              className="ui-input"
              placeholder="Ej: Zona Sur, La Paz"
              value={form.ubicacion}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          {/* URL Extracto */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="ui-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔗</span>
                <span>URL del Extracto Bancario *</span>
              </span>
            </label>
            <input
              type="url"
              name="extracto_url"
              className="ui-input"
              placeholder="https://storage.ejemplo.com/docs/extracto-bancario.pdf"
              value={form.extracto_url}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          {/* Descripción */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="ui-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📝</span>
                <span>Descripción del Trabajo *</span>
              </span>
            </label>
            <textarea
              name="descripcion"
              className="ui-input"
              placeholder="Describe las funciones y responsabilidades..."
              value={form.descripcion}
              onChange={handleChange}
              disabled={loading}
              rows={4}
              required
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />
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
            onClick={() => setPasoActual(2)}
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

export default CrearTrabajoStep;
