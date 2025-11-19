import { useState } from 'react';
import type { ReactElement } from 'react';
import '../../../styles/usuarios.css';

type Props = {
  userName: string;
  isDeactivating: boolean;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
};

export default function DeactivateModal({ userName, isDeactivating, onConfirm, onCancel }: Props): ReactElement {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason.trim() || undefined);
  };

  return (
    <div className="ui-modal" role="dialog" aria-modal="true" onClick={onCancel}>
      <div className="deactivate-modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="deactivate-modal-header">
          <div className="modal-icon-container warning">
            <span className="modal-icon">⚠️</span>
          </div>
          <h3 className="modal-title">
            {isDeactivating ? 'Desactivar Usuario' : 'Activar Usuario'}
          </h3>
          <button 
            className="modal-close-btn" 
            onClick={onCancel}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </header>

        <div className="deactivate-modal-body">
          {isDeactivating ? (
            <>
              <p className="modal-description">
                ¿Estás seguro de que deseas desactivar al usuario <strong>{userName}</strong>?
              </p>
              <p className="modal-warning">
                El usuario no podrá acceder al sistema hasta que sea reactivado.
              </p>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">📝</span>
                  Motivo de desactivación (opcional)
                </label>
                <textarea
                  className="form-textarea"
                  placeholder="Ej: Usuario inactivo por período prolongado..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  maxLength={200}
                />
                <span className="character-count">
                  {reason.length}/200 caracteres
                </span>
              </div>
            </>
          ) : (
            <>
              <p className="modal-description success">
                ¿Deseas activar al usuario <strong>{userName}</strong>?
              </p>
              <p className="modal-info">
                El usuario podrá acceder nuevamente al sistema con sus credenciales.
              </p>
            </>
          )}
        </div>

        <footer className="deactivate-modal-footer">
          <button
            type="button"
            className="ui-btn ui-btn--ghost"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={`ui-btn ${isDeactivating ? 'ui-btn--danger' : 'ui-btn--success'}`}
            onClick={handleConfirm}
          >
            {isDeactivating ? '⚠️ Desactivar' : '✅ Activar'}
          </button>
        </footer>
      </div>
    </div>
  );
}
