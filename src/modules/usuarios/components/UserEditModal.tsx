import { useEffect, useState } from "react";
import type { ReactElement, FormEvent } from "react";
import type { User, UpdateUserPayload } from "../types";
import { updateUser } from "../service";
import { http } from "../../../shared/api/client";
import "../../../styles/usuarios.css";

type Props = {
  user: User | null;
  onClose: () => void;
  onSaved?: () => void;
};

export default function UserEditModal({ user, onClose, onSaved }: Props): ReactElement | null {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    role: "usuario" as User["role"]
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableGroups, setAvailableGroups] = useState<{ id: number; nombre: string; permisos?: number[] }[]>([]);
  const [groupId, setGroupId] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      setForm({
        nombre: user.nombre ?? "",
        email: user.email ?? "",
        telefono: user.telefono ?? "",
        role: user.role ?? "usuario"
      });
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await http.get("/api/User/group");
        if (!mounted) return;
        setAvailableGroups(r.data ?? []);
      } catch {
        setAvailableGroups([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!user) return;
    const gid = user?.group_id;
    setGroupId(gid != null ? Number(gid) : null);
  }, [user]);

  if (!user) return null;

  const handleSave = async (e?: FormEvent) => {
    e?.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const updatePayload: UpdateUserPayload = {
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono,
        role: form.role
      };
      
      await updateUser(user.id, updatePayload);
      
      if (groupId != null) {
        try {
          await http.post(`/api/User/${user.id}/group`, { group_id: groupId });
        } catch (e) {
          console.warn("No se pudo asignar grupo en backend:", e);
        }
      }
      onSaved?.();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(`No se pudo guardar: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ui-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="ui-modal__content edit-modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="ui-modal__header">
          <h3>✏️ Editar Usuario</h3>
          <button className="ui-btn ui-btn--ghost close-btn" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </header>
        
        {error && (
          <div className="alert alert-error">
            ⚠️ {error}
          </div>
        )}

        <div className="ui-modal__body">
          <form className="ui-form edit-user-form" onSubmit={handleSave}>
            <div className="ui-form__row">
              <div className="ui-form__field">
                <label className="ui-label">
                  <span className="label-icon">👤</span>
                  Nombre Completo
                </label>
                <input 
                  className="ui-input" 
                  value={form.nombre} 
                  onChange={(e) => setForm(s => ({ ...s, nombre: e.target.value }))}
                  required
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              <div className="ui-form__field">
                <label className="ui-label">
                  <span className="label-icon">📧</span>
                  Email
                </label>
                <input 
                  className="ui-input" 
                  type="email" 
                  value={form.email} 
                  onChange={(e) => setForm(s => ({ ...s, email: e.target.value }))}
                  required
                  placeholder="usuario@ejemplo.com"
                />
              </div>
            </div>

            <div className="ui-form__row">
              <div className="ui-form__field">
                <label className="ui-label">
                  <span className="label-icon">📱</span>
                  Teléfono
                </label>
                <input 
                  className="ui-input" 
                  value={form.telefono} 
                  onChange={(e) => setForm(s => ({ ...s, telefono: e.target.value }))}
                  placeholder="Ej: +591 70123456"
                />
              </div>
              <div className="ui-form__field">
                <label className="ui-label">
                  <span className="label-icon">🔐</span>
                  Rol
                </label>
                <select 
                  className="ui-select" 
                  value={form.role} 
                  onChange={(e) => setForm(s => ({ ...s, role: e.target.value as User["role"] }))}
                  required
                >
                  <option value="superadmin">🌟 Superadmin</option>
                  <option value="administrador">👔 Administrador</option>
                  <option value="gerente">💼 Gerente</option>
                  <option value="contador">💰 Contador</option>
                  <option value="usuario">👤 Usuario</option>
                </select>
              </div>
            </div>

            <div className="ui-form__row">
              <div className="ui-form__field">
                <label className="ui-label">
                  <span className="label-icon">👥</span>
                  Grupo
                </label>
                <select 
                  className="ui-select" 
                  value={groupId ?? ""} 
                  onChange={(e) => setGroupId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">(Sin grupo asignado)</option>
                  {availableGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="ui-form__actions">
              <button 
                type="submit" 
                className="ui-btn ui-btn--primary" 
                disabled={saving}
              >
                {saving ? "💾 Guardando..." : "💾 Guardar Cambios"}
              </button>
              <button 
                type="button" 
                className="ui-btn ui-btn--ghost" 
                onClick={onClose}
                disabled={saving}
              >
                ← Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
