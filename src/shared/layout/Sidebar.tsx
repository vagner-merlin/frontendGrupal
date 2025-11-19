import React, { useCallback, useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../modules/auth/service";
import { getMenuForUser, type MenuItem } from "./menuData";
import { getPerfilUserByUsuarioId } from "../../modules/empresa/service";
import "./sidebar.css";
import type { AuthUser } from "../../modules/auth/types";

export type SidebarProps = {
  brand?: string;
  collapseOnNavigate?: boolean;
};

const STORAGE_KEY = "ui.sidebar.collapsed";
const EXPANDED_MODULES_KEY = "ui.sidebar.expanded";

const Sidebar: React.FC<SidebarProps> = ({ brand = "Mi Empresa", collapseOnNavigate = false }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Detectar si es móvil
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 1024);
  
  // Estado para la foto de perfil del usuario
  const [userAvatarUrl, setUserAvatarUrl] = useState<string>("");

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    // En móvil, empezar colapsado por defecto
    if (window.innerWidth < 1024) return true;
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  // Estado para módulos expandidos
  const [expandedModules, setExpandedModules] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(EXPANDED_MODULES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Detectar cambio de tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile && !collapsed) {
        // En móvil, colapsar automáticamente
        setCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [collapsed]);

  // Cargar foto de perfil del usuario desde la API
  useEffect(() => {
    if (user?.id != null) {
      const uid = Number(user.id);
      if (!Number.isNaN(uid)) {
        getPerfilUserByUsuarioId(uid)
         .then((perfil) => {
           if (perfil && perfil.imagen_url) {
             console.log("[Sidebar] Foto de perfil cargada:", perfil.imagen_url);
             setUserAvatarUrl(perfil.imagen_url);
           }
         })
         .catch((err) => {
           console.error("[Sidebar] Error al cargar foto de perfil:", err);
         });
      }
     }
   }, [user?.id]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [collapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(EXPANDED_MODULES_KEY, JSON.stringify(expandedModules));
    } catch {
      // ignore
    }
  }, [expandedModules]);

  // Auto-expandir módulo si estamos en una de sus rutas hijas
  useEffect(() => {
    const menuItems = getMenuForUser(user ?? null);
    menuItems.forEach(item => {
      if (item.children && item.children.some(child => location.pathname === child.path)) {
        setExpandedModules(prev => {
          if (!prev.includes(item.path)) {
            return [...prev, item.path];
          }
          return prev;
        });
      }
    });
  }, [location.pathname, user]);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  const toggleModule = useCallback((modulePath: string) => {
    setExpandedModules(prev => 
      prev.includes(modulePath) 
        ? prev.filter(p => p !== modulePath)
        : [...prev, modulePath]
    );
  }, []);

  const handleLogout = async () => {
    if (confirm("¿Estás seguro que quieres cerrar sesión?")) {
      await logout();
      // Redirigir a la landing page después del logout
      navigate("/");
    }
  };

  const renderMenuItem = (item: MenuItem) => {
    // ocultar según roles si aplica
    if (item.roles && item.roles.length && !item.roles.some(r => user?.roles?.includes(r))) {
      return null;
    }

    // Si tiene children, renderizar como módulo expandible (usa clases que tu CSS espera)
    if (item.children && item.children.length > 0) {
      const expanded = expandedModules.includes(item.path);
      return (
        <div key={item.path} className="module-group">
          <div
            role="button"
            tabIndex={0}
            className={`module-link module-link--expandable ${expanded ? "module-link--active" : ""}`}
            onClick={() => toggleModule(item.path)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleModule(item.path); }}
            title={item.label}
          >
            <div className="module-icon">{item.icon}</div>
            {!collapsed && <div className="module-label">{item.label}</div>}
            <div className={`module-chevron ${expanded ? "module-chevron--expanded" : ""}`} />
          </div>

          {expanded && (
            <div className="module-children" aria-hidden={!expanded}>
              {item.children!.map((child) => {
                // verificar roles del child (si los tiene)
                if (child.roles && child.roles.length && !child.roles.some(r => user?.roles?.includes(r))) {
                  return null;
                }

                if (child.external) {
                  return (
                    <a
                      key={child.path}
                      href={child.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="module-link--child"
                      title={child.label}
                      onClick={() => collapseOnNavigate && setCollapsed(true)}
                    >
                      <div className="module-icon--child">{child.icon}</div>
                      {!collapsed && <div className="module-label">{child.label}</div>}
                    </a>
                  );
                }

                return (
                  <NavLink
                    key={child.path}
                    to={child.path}
                    className={({ isActive }) => `module-link--child ${isActive ? "module-link--active" : ""}`}
                    onClick={() => collapseOnNavigate && setCollapsed(true)}
                    title={child.label}
                  >
                    <div className="module-icon--child">{child.icon}</div>
                    {!collapsed && <div className="module-label">{child.label}</div>}
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // elemento simple (sin children)
    if (item.external) {
      return (
        <a
          key={item.path}
          href={item.path}
          target="_blank"
          rel="noopener noreferrer"
          className="module-link"
          title={item.label}
          onClick={() => collapseOnNavigate && setCollapsed(true)}
        >
          <div className="module-icon">{item.icon}</div>
          {!collapsed && <div className="module-label">{item.label}</div>}
        </a>
      );
    }

    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={({ isActive }) => `module-link ${isActive ? "module-link--active" : ""}`}
        title={item.label}
        onClick={() => collapseOnNavigate && setCollapsed(true)}
      >
        <div className="module-icon">{item.icon}</div>
        {!collapsed && <div className="module-label">{item.label}</div>}
      </NavLink>
    );
  };

  // Usar la foto de perfil cargada desde la API, o fallback a la anterior
  const avatarUrl = userAvatarUrl || 
    (((user as unknown) as Record<string, unknown>)["imagen_url_perfil"] ?? 
    ((user as unknown) as Record<string, unknown>)["imagen_url"] ?? 
    undefined);

  // grupos para mostrar en la sidebar (tipado explícito para evitar `any`)
  const userGroups = (user as AuthUser & { grupos?: Array<{ id: number | string; nombre?: string | null }> })?.grupos ?? [];

   const menuItems = getMenuForUser(user ?? null);
   const userName = (user?.nombre_completo ?? user?.username) ?? "Usuario";
   const companyName = user?.empresa_nombre ?? brand;

   return (
    <>
      <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`} aria-hidden={collapsed}>
        {/* AVATAR CON LUZ VIBRANTE - PARTE SUPERIOR */}
        <div className="sidebar__profile">
          <div className="user-avatar-container">
            <div className="user-avatar-glow">
              {typeof avatarUrl === "string" && avatarUrl ? (
                <img 
                  src={avatarUrl as string} 
                  alt="Avatar" 
                  className="user-avatar"
                  onError={(e) => {
                    console.error("[Sidebar] Error al cargar imagen:", avatarUrl);
                    // Fallback a avatar generado
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=3b82f6&color=fff&size=96`;
                  }}
                />
              ) : user?.email ? (
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=3b82f6&color=fff&size=96`}
                  alt="Avatar"
                  className="user-avatar"
                />
              ) : (
                <div className="user-avatar user-avatar--placeholder">👤</div>
              )}
            </div>

            {!collapsed && <div className="user-name">{userName}</div>}
            {!collapsed && companyName && <div className="brand-name" style={{ fontSize: 12, color: "var(--sidebar-text-muted)", marginTop: 4 }}>{companyName}</div>}
            {!collapsed && userGroups.length > 0 && (
              <div className="user-groups" style={{ fontSize: 12, color: "var(--sidebar-text-muted)", marginTop: 6 }}>
                {userGroups.map((g) => (g?.nombre ?? "").trim()).filter(Boolean).join(", ")}
              </div>
            )}
           </div>
         </div>

        {/* BOTÓN DE TOGGLE */}
        <div className="sidebar__toggle-container">
          <button
            type="button"
            className="sidebar__toggle"
            onClick={toggle}
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="3" cy="10" r="2" fill="currentColor" />
                <circle cx="10" cy="10" r="2" fill="currentColor" />
                <circle cx="17" cy="10" r="2" fill="currentColor" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="4" width="16" height="2" rx="1" fill="currentColor" />
                <rect x="2" y="9" width="16" height="2" rx="1" fill="currentColor" />
                <rect x="2" y="14" width="16" height="2" rx="1" fill="currentColor" />
              </svg>
            )}
          </button>
        </div>

        {/* MÓDULOS DEL SISTEMA */}
        <nav className="sidebar__nav" aria-label="Navegación principal">
          {menuItems.map(renderMenuItem)}
        </nav>

        {/* LOGOUT EN LA PARTE INFERIOR */}
        <div className="sidebar__footer">
          <button onClick={handleLogout} className="logout-btn" title={collapsed ? "Cerrar Sesión" : undefined}>
            <span className="logout-icon">🚪</span>
            {!collapsed && <span>Salir</span>}
          </button>
        </div>
      </aside>

      {/* OVERLAY PARA MÓVIL */}
      {!collapsed && isMobile && (
        <div
          className="sidebar-overlay"
          onClick={() => setCollapsed(true)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 999,
            animation: "fadeIn 0.2s ease",
          }}
        />
      )}
    </>
  );
};

export default Sidebar;

