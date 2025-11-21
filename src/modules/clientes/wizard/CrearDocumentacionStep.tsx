import React, { useState } from 'react';
import { useCliente } from '../context/useCliente';
import { createDocumentacionWithFile } from '../documentacion/service';
import '../../../styles/theme.css';

const CrearDocumentacionStep: React.FC = () => {
  const { clienteId, setPasoActual, marcarPasoCompletado, clienteData } = useCliente();
  const [form, setForm] = useState({
    ci: ''
  });
  const [documentoFile, setDocumentoFile] = useState<File | null>(null);
  const [documentoPreview, setDocumentoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocumentoFile(file);
      setDocumentoPreview(file.name);
      setError('');
    }
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

    if (!documentoFile) {
      setError('Debe seleccionar un archivo de documento');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ci: form.ci.trim(),
        documento_url: '', // Se llenará con la URL de S3
        id_cliente: clienteId
      };

      console.log('📤 Enviando documentación con archivo:', documentoFile.name);
      const resultado = await createDocumentacionWithFile(payload, documentoFile);
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

          {/* Documento */}
          <div>
            <label className="ui-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📄</span>
                <span>Documento Escaneado (PDF o Imagen) *</span>
              </span>
            </label>
            <div style={{
              border: '2px dashed #6366f1',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              background: 'rgba(99, 102, 241, 0.05)',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}>
              <input
                type="file"
                id="documento_file"
                accept="application/pdf,image/*"
                onChange={handleFileChange}
                disabled={loading}
                required
                style={{ display: 'none' }}
              />
              <label htmlFor="documento_file" style={{ cursor: 'pointer', display: 'block' }}>
                {documentoPreview ? (
                  <div>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📄</div>
                    <div style={{ color: '#10b981', fontWeight: '600', marginBottom: '8px' }}>
                      ✓ Archivo seleccionado
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '14px' }}>
                      {documentoPreview}
                    </div>
                    <div style={{ marginTop: '12px' }}>
                      <span style={{
                        color: '#6366f1',
                        fontSize: '14px',
                        textDecoration: 'underline'
                      }}>
                        Clic para cambiar archivo
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📤</div>
                    <div style={{ color: '#374151', fontWeight: '600', marginBottom: '8px' }}>
                      Clic para seleccionar archivo
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '13px' }}>
                      PDF, JPG, PNG (máx. 10MB)
                    </div>
                  </div>
                )}
              </label>
            </div>
            <small style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px', display: 'block' }}>
              El archivo se subirá automáticamente a AWS S3
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
