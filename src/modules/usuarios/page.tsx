import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listUsers, setUserActive } from "./service";
import type { User } from "./types";
import "../../styles/usuarios.css";
import { useAuth } from "../../modules/auth/service";
import PageHeader from "../../shared/components/PageHeader";

import UserHistory from "./components/UserHistory";
import DeactivateModal from "./components/DeactivateModal";

/* Helpers y componentes (StatusBadge, Toolbar, TableHead, Row, Pager) */
/* ===== Helpers de fecha coherente ===== */
const TZ = "America/La_Paz" as const;
// Bolivia es UTC-4 todo el año (sin DST)
const TZ_OFFSET_MIN = 240; // minutos que hay que SUMAR para ir de local->UTC

type Parts = { y: number; m: number; d: number; h: number; mi: number; s: number };

const splitYMDHMS = (s: string): Parts | null => {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!m) return null;
  return { y: +m[1], m: +m[2], d: +m[3], h: +(m[4] ?? "0"), mi: +(m[5] ?? "0"), s: +(m[6] ?? "0") };
};

// Interpreta strings SIN zona como hora de America/La_Paz
const parseBackendDate = (s: string): Date => {
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s);
  const p = splitYMDHMS(s);
  if (!p) return new Date(s);
  const utcMs = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) + TZ_OFFSET_MIN * 60 * 1000;
  return new Date(utcMs);
};

const fmtRelative = (d: Date): string => {
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
  const diff = d.getTime() - Date.now();
  const abs = Math.abs(diff);
  const m = 60_000, h = 60 * m, dMs = 24 * h;
  if (abs < m) return rtf.format(Math.round(diff / 1000), "second");
  if (abs < h) return rtf.format(Math.round(diff / m), "minute");
  if (abs < dMs) return rtf.format(Math.round(diff / h), "hour");
  return rtf.format(Math.round(diff / dMs), "day");
};

const formatLastAccess = (s?: string | null): string => {
  if (!s) return "Nunca";
  const d = parseBackendDate(s);
  if (Number.isNaN(d.getTime())) return "Fecha inválida";
  const dateStr = new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: TZ,
  }).format(d);
  return `${dateStr} · ${fmtRelative(d)}`;
};

/* ===== Permisos/Contexto (simple) ===== */
const getPerms = (): Set<string> => {
  try {
    const raw = localStorage.getItem("auth.permissions");
    if (raw) return new Set<string>(JSON.parse(raw));
    return new Set<string>(["user.read", "user.toggle"]);
  } catch {
    return new Set<string>(["user.read", "user.toggle"]);
  }
};
const getCurrentUserId = (): string | number | null => {
  try {
    const raw = localStorage.getItem("auth.me");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.id ?? null;
  } catch {
    return null;
  }
};

/* ===== UI ===== */
const StatusBadge: React.FC<{ active: boolean }> = ({ active }) => (
  <span className={`ui-badge ${active ? "ui-badge--success" : "ui-badge--danger"}`}>
    <span className="ui-badge__dot" />
    {active ? "Activo" : "Inactivo"}
  </span>
);

const Toolbar: React.FC<{
  search: string;
  onSearch: (v: string) => void;
  activo: boolean | "all";
  onActivo: (v: boolean | "all") => void;
  total: number;
}> = ({ search, onSearch, activo, onActivo, total }) => (
  <div className="ui-toolbar">
    <div className="ui-toolbar__left">
      <input
        placeholder="Buscar por nombre, usuario o email…"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        className="ui-input"
        aria-label="Buscar usuarios"
      />
      <select
        value={activo === "all" ? "all" : activo ? "true" : "false"}
        onChange={(e) => onActivo(e.target.value === "all" ? "all" : e.target.value === "true")}
        className="ui-select"
        aria-label="Filtrar por estado"
      >
        <option value="all">Todos</option>
        <option value="true">Activos</option>
        <option value="false">Inactivos</option>
      </select>
    </div>
    <div className="ui-toolbar__right">
      <span className="ui-meta">{total} usuarios</span>
    </div>
  </div>
);

const TableHead: React.FC = () => (
  <thead>
    <tr>
      <th>Estado</th>
      <th>Nombre</th>
      <th>Usuario</th>
      <th>Email</th>
      <th>Rol</th>
      <th>Teléfono</th>
      <th>Último acceso</th>
      <th className="ui-td--actions">Acciones</th>
    </tr>
  </thead>
);

const Row: React.FC<{
  u: User;
  onToggle: (id: User["id"], next: boolean, reason?: string) => void;
  busyId?: User["id"] | null;
  canToggle: (u: User) => boolean;
  isSelf: (u: User) => boolean;
  onEdit?: () => void;
  onHistory?: (id: User["id"]) => void;
}> = ({ u, onToggle, busyId, canToggle, isSelf, onEdit, onHistory }) => {
  const isBusy = busyId === u.id;
  const allowed = canToggle(u);
  const self = isSelf(u);
  const activeNow = !!u.activo;
  const title = !allowed
    ? u.role === "superadmin"
      ? "No permitido: superadmin"
      : self
      ? "No puedes desactivarte a ti mismo"
      : "Sin permisos"
    : activeNow
    ? "Desactivar"
    : "Activar";

  return (
    <tr>
      <td><StatusBadge active={activeNow} /></td>
      <td>{u.nombre}</td>
      <td>{u.username ?? "—"}</td>
      <td>{u.email}</td>
      <td>{u.role ?? "—"}</td>
      <td>{u.telefono ?? "—"}</td>
      <td>{formatLastAccess(u.last_login)}</td>
      <td className="ui-td--actions">
        {/* Toggle Switch Moderno */}
        <div className="toggle-action-group">
          <label className={`toggle-switch ${!allowed ? 'toggle-switch--disabled' : ''}`} title={title}>
            <input
              type="checkbox"
              checked={activeNow}
              disabled={isBusy || !allowed}
              onChange={() => {
                if (!allowed) return;
                onToggle(u.id, !activeNow);
              }}
            />
            <span className="toggle-slider">
              <span className="toggle-icon">
                {isBusy ? "⏳" : activeNow ? "✓" : "✕"}
              </span>
            </span>
          </label>
          <span className={`toggle-status ${activeNow ? 'status-active' : 'status-inactive'}`}>
            {isBusy ? "Procesando..." : activeNow ? "ACTIVO" : "DESACTIVADO"}
          </span>
        </div>

        <button 
          className="ui-btn ui-btn--ghost" 
          onClick={() => {
            console.log('🖱️ Click en Editor, onEdit:', onEdit);
            onEdit?.();
          }}
          disabled={!onEdit}
          title={onEdit ? "Editar datos del usuario" : "No tienes permisos para editar"}
        >
          ✏️ Editor
        </button>
        <button 
          className="ui-btn ui-btn--ghost" 
          onClick={() => onHistory?.(u.id)}
          title="Ver historial de cambios"
        >
          📋 Histórico
        </button>
      </td>
    </tr>
  );
};

const Pager: React.FC<{
  page: number;
  pageSize: number;
  count: number;
  onPage: (p: number) => void;
}> = ({ page, pageSize, count, onPage }) => {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  return (
    <div className="ui-pager" role="navigation" aria-label="Paginación">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="ui-btn">Anterior</button>
      <span className="ui-pager__info">Página {page} / {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onPage(page + 1)} className="ui-btn">Siguiente</button>
    </div>
  );
};

const UsersPage: React.FC = () => {
  const navigate = useNavigate(); // Añadir hook useNavigate
  const [rows, setRows] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>("");
  const [activo, setActivo] = useState<boolean | "all">("all");
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [count, setCount] = useState<number>(0);
  const [busyId, setBusyId] = useState<User["id"] | null>(null);

  const [historyUserId, setHistoryUserId] = useState<string | number | null>(null);
  const [deactivateUser, setDeactivateUser] = useState<{ user: User; willDeactivate: boolean } | null>(null);

  const perms = useMemo(() => getPerms(), []);
  const meId = useMemo(() => getCurrentUserId(), []);
  // tenantId no se usa, el filtrado es local

  const { user } = useAuth();
  
  // Simplificado: usar directamente user.role del backend
  const isSuperAdmin = user?.role === "superadmin" || user?.roles?.includes("superadmin");
  const isCompanyAdmin = 
    user?.role === "administrador" || 
    user?.roles?.includes("administrador") || 
    user?.roles?.includes("admin");

  // Debug: Mostrar información del usuario actual en consola
  useEffect(() => {
    console.log("═══════════════════════════════════════");
    console.log("🔍 DEBUG - Información del Usuario Actual:");
    console.log("═══════════════════════════════════════");
    console.log("Usuario:", user?.username || user?.email);
    console.log("Role (backend):", user?.role);
    console.log("Roles (array):", user?.roles);
    console.log("Es Superadmin:", isSuperAdmin);
    console.log("Es Admin de Empresa:", isCompanyAdmin);
    console.log("Empresa ID:", user?.empresa_id);
    console.log("Permisos:", Array.from(perms));
    console.log("═══════════════════════════════════════");
  }, [user, isSuperAdmin, isCompanyAdmin, perms]);

  // Verificar permisos básicos
  useEffect(() => {
    if (!isSuperAdmin && !isCompanyAdmin) {
      console.warn("⚠️ Usuario sin permisos de administrador, redirigiendo...");
      navigate("/app");
    }
  }, [isSuperAdmin, isCompanyAdmin, navigate]);

  const canCreateUser = useCallback(() => {
    if (isSuperAdmin) return true;
    if (isCompanyAdmin) return true; // Admin de empresa puede crear usuarios
    return false;
  }, [isSuperAdmin, isCompanyAdmin]);

  const canEditUser = useCallback((targetUser: User) => {
    console.log(`[canEditUser] Verificando permisos para ${targetUser.username}:`, {
      targetUser: targetUser.username,
      targetRole: targetUser.role,
      targetEmpresaId: targetUser.empresa_id,
      isSuperAdmin: isSuperAdmin,
      isCompanyAdmin: isCompanyAdmin,
      myEmpresaId: user?.empresa_id,
    });

    // Superadmin puede editar a todos
    if (isSuperAdmin) {
      console.log(`[canEditUser] ✅ Permitido: Es superadmin`);
      return true;
    }
    
    // No puedes editar a un superadmin si no eres superadmin
    if (targetUser.role === "superadmin") {
      console.log(`[canEditUser] ❌ Bloqueado: El usuario objetivo es superadmin`);
      return false;
    }
    
    // Admin de empresa puede editar usuarios de su empresa
    if (isCompanyAdmin && user?.empresa_id) {
      // Si el usuario no tiene empresa_id, asumimos que es de la misma empresa
      if (!targetUser.empresa_id) {
        console.log(`[canEditUser] ✅ Permitido: Target sin empresa_id (legacy)`);
        return true;
      }
      
      const sameCompany = String(targetUser.empresa_id) === String(user.empresa_id);
      console.log(`[canEditUser] Admin de empresa, verificando:`, {
        targetEmpresa: targetUser.empresa_id,
        myEmpresa: user.empresa_id,
        sameCompany
      });
      
      if (sameCompany) {
        console.log(`[canEditUser] ✅ Permitido: Admin de la misma empresa`);
        return true;
      } else {
        console.log(`[canEditUser] ❌ Bloqueado: Usuario de otra empresa`);
        return false;
      }
    }
    
    // Si tiene el permiso específico
    if (perms.has("user.edit")) {
      console.log(`[canEditUser] ✅ Permitido: Tiene permiso user.edit`);
      return true;
    }
    
    console.log(`[canEditUser] ❌ Bloqueado: No cumple ninguna condición`);
    return false;
  }, [isSuperAdmin, isCompanyAdmin, user?.empresa_id, perms]);

  // Los filtros se aplican localmente en fetchData
  const canToggle = useCallback(
    (u: User) => {
      console.log(`[canToggle] Verificando permisos para usuario ${u.username}:`, {
        targetUser: u.username,
        targetRole: u.role,
        targetEmpresaId: u.empresa_id,
        myRole: user?.role,
        isCompanyAdmin: isCompanyAdmin,
        isSuperAdmin: isSuperAdmin,
        myEmpresaId: user?.empresa_id,
        isSelf: String(u.id) === String(meId ?? "")
      });

      // Superadmin puede todo
      if (isSuperAdmin) {
        console.log(`[canToggle] ✅ Permitido: Es superadmin`);
        return true;
      }
      
      // No puedes desactivarte a ti mismo
      if (String(u.id) === String(meId ?? "")) {
        console.log(`[canToggle] ❌ Bloqueado: No puedes desactivarte a ti mismo`);
        return false;
      }
      
      // No puedes desactivar a un superadmin si no eres superadmin
      if (u.role === "superadmin") {
        console.log(`[canToggle] ❌ Bloqueado: El usuario objetivo es superadmin`);
        return false;
      }
      
      // Admin de empresa puede activar/desactivar usuarios de su empresa
      if (isCompanyAdmin && user?.empresa_id) {
        // Si el usuario no tiene empresa_id, asumimos que es de la misma empresa
        if (!u.empresa_id) {
          console.log(`[canToggle] ✅ Permitido: Target sin empresa_id (legacy)`);
          return true;
        }
        
        // Verificar que sea de la misma empresa
        const sameCompany = String(u.empresa_id) === String(user.empresa_id);
        console.log(`[canToggle] Es admin de empresa, verificando empresa:`, {
          targetEmpresa: u.empresa_id,
          myEmpresa: user.empresa_id,
          sameCompany
        });
        
        if (sameCompany) {
          console.log(`[canToggle] ✅ Permitido: Admin de la misma empresa`);
          return true;
        } else {
          console.log(`[canToggle] ❌ Bloqueado: Usuario de otra empresa`);
          return false;
        }
      }
      
      // Si tiene el permiso específico, puede hacerlo
      if (perms.has("user.toggle")) {
        console.log(`[canToggle] ✅ Permitido: Tiene permiso user.toggle`);
        return true;
      }
      
      console.log(`[canToggle] ❌ Bloqueado: No cumple ninguna condición`);
      return false;
    },
    [perms, meId, isSuperAdmin, isCompanyAdmin, user?.empresa_id, user?.role]
  );

  const isSelf = useCallback((u: User) => String(u.id) === String(meId ?? ""), [meId]);

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener todos los usuarios sin filtros
      const res = await listUsers({ page: 1, page_size: 1000 });
      console.log("📊 Respuesta del backend - Total usuarios:", res.results.length);
      
      let filteredUsers = res.results;
      
      // Filtrar por búsqueda (nombre, username, email)
      if (search.trim()) {
        const searchLower = search.toLowerCase().trim();
        filteredUsers = filteredUsers.filter(u => 
          (u.nombre?.toLowerCase().includes(searchLower)) ||
          (u.username?.toLowerCase().includes(searchLower)) ||
          (u.email?.toLowerCase().includes(searchLower))
        );
      }
      
      // Filtrar por estado activo/inactivo
      if (activo !== "all") {
        filteredUsers = filteredUsers.filter(u => u.activo === activo);
      }
      
      // Aplicar paginación local
      const totalCount = filteredUsers.length;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
      
      console.log("📊 Después de filtrar:", {
        total: totalCount,
        mostrando: paginatedUsers.length,
        búsqueda: search,
        estado: activo
      });
      
      setRows(paginatedUsers);
      setCount(totalCount);
    } catch (err) {
      console.error("❌ Error cargando usuarios:", err);
      setError("No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  }, [search, activo, page, pageSize]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleToggleRequest = (user: User, nextState: boolean) => {
    // Abrir modal de confirmación
    setDeactivateUser({ user, willDeactivate: !nextState });
  };

  const handleToggleConfirm = async (reason?: string) => {
    if (!deactivateUser) return;

    const { user, willDeactivate } = deactivateUser;
    const nextState = !willDeactivate;

    setBusyId(user.id);
    setRows((prev) => prev.map((u) => (u.id === user.id ? { ...u, activo: nextState } : u)));

    try {
      await setUserActive(user.id, nextState);
      console.log(`✅ Usuario ${willDeactivate ? 'desactivado' : 'activado'}:`, user.username, reason ? `Motivo: ${reason}` : '');
    } catch {
      setRows((prev) => prev.map((u) => (u.id === user.id ? { ...u, activo: !nextState } : u)));
      alert("No se pudo actualizar el estado del usuario.");
    } finally {
      setBusyId(null);
      setDeactivateUser(null);
    }
  };

  const handleToggle = async (id: User["id"], next: boolean, _reason?: string) => {
    void _reason;
    const target = rows.find((r) => r.id === id);
    if (!target) return;
    if (!canToggle(target)) return;

    // Usar el nuevo sistema de modal
    handleToggleRequest(target, next);
  };

  return (
    <section className="page">
      <PageHeader
        title={isSuperAdmin ? "Gestión Global de Usuarios" : "Usuarios de la Empresa"}
        subtitle={isSuperAdmin ? "Administra todos los usuarios del sistema" : "Administra los usuarios de tu empresa"}
        showBackButton={true}
        backPath="/app"
        actions={
          canCreateUser() ? (
            <button 
              className="ui-btn ui-btn--primary"
              onClick={() => navigate("/app/crear-usuario")}
            >
              + Crear Usuario
            </button>
          ) : undefined
        }
      />

      {/* Toolbar + Table */}
      <Toolbar
        search={search}
        onSearch={(v) => { setPage(1); setSearch(v); }}
        activo={activo}
        onActivo={(v) => { setPage(1); setActivo(v); }}
        total={count}
      />

      <div className="card card--data">
        <div className="ui-table-wrap">
          <table className="ui-table" aria-busy={loading}>
            <TableHead />
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="ui-cell--center">Cargando…</td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan={8} className="ui-cell--error">{error}</td></tr>
              )}
              {!loading && !error && rows.length === 0 && (
                <tr><td colSpan={8} className="ui-cell--muted">No hay usuarios para mostrar.</td></tr>
              )}
              {!loading && !error && rows.map((u) => (
                <Row
                  key={String(u.id)}
                  u={u}
                  onToggle={handleToggle}
                  busyId={busyId}
                  canToggle={(u) => canEditUser(u)}
                  isSelf={isSelf}
                  onEdit={canEditUser(u) ? () => {
                    console.log('🚀 Navegando a editar usuario:', u.id);
                    navigate(`/app/usuarios/editar/${u.id}`);
                  } : undefined}
                  onHistory={canEditUser(u) ? (id) => setHistoryUserId(id) : undefined}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="ui-card-footer">
          <Pager page={page} pageSize={pageSize} count={count} onPage={setPage} />
        </div>
      </div>

      {/* Modal de Historial */}
      {historyUserId && <UserHistory userId={historyUserId} onClose={() => setHistoryUserId(null)} />}
      
      {/* Modal de Confirmación para Activar/Desactivar */}
      {deactivateUser && (
        <DeactivateModal
          userName={deactivateUser.user.nombre || deactivateUser.user.username || 'Usuario'}
          isDeactivating={deactivateUser.willDeactivate}
          onConfirm={handleToggleConfirm}
          onCancel={() => setDeactivateUser(null)}
        />
      )}
    </section>
  );
};

export default UsersPage;
