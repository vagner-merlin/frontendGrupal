// modules/dashboard/dashboard.tsx
import { useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/service";
import Topbar from "../../shared/layout/Topbar";
import Sidebar from "../../shared/layout/Sidebar";
import "../../shared/layout/sidebar.css";
import "../../styles/dashboard.css";

// Tipo extendido para evitar usar 'any'
interface ExtendedUser {
  id?: number;
  username?: string;
  roles?: string[];
  permissions?: string[];
  first_name?: string;
  last_name?: string;
  imagen_url_perfil?: string;
  empresa?: {
    razon_social?: string;
    imagen_url_empresa?: string;
  };
}

export default function DashboardLayout() {
  const { user } = useAuth();
  const location = useLocation();
  
  // Mostrar bienvenida solo en la página principal del dashboard
  const showWelcome = location.pathname === '/app';

  // Memorizar datos de usuario y empresa para evitar recalcular en cada render
  const welcomeData = useMemo(() => {
    const extendedUser = user as ExtendedUser;
    const userName = extendedUser?.first_name && extendedUser?.last_name 
      ? `${extendedUser.first_name} ${extendedUser.last_name}`
      : user?.username || 'Usuario';

    const companyName = localStorage.getItem("ui.company.name") || 
                       localStorage.getItem("ui.companyName") || 
                       extendedUser?.empresa?.razon_social || 
                       "tu empresa";

    const userRole = user?.roles?.[0] || 'usuario';

    // Obtener saludo según la hora
    const now = new Date();
    const hour = now.getHours();
    let greeting = '';
    
    if (hour >= 5 && hour < 12) {
      greeting = 'Buenos días';
    } else if (hour >= 12 && hour < 19) {
      greeting = 'Buenas tardes';
    } else {
      greeting = 'Buenas noches';
    }

    const currentTime = now.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return {
      userName,
      companyName,
      userRole,
      currentTime: `${greeting}, hoy es ${currentTime}`
    };
  }, [user]); // Solo recalcular si el usuario cambia

  return (
    <div className="dashboard-layout">
      {/* Layout principal con sidebar y área de contenido */}
      <div className="dashboard-main">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Área de contenido (topbar + main) */}
        <div className="dashboard-content-area">
          {/* Topbar moderno - solo en el área de contenido */}
          <Topbar 
            showSearch={false}
            showNotifications={true}
          />
          
          {/* Contenido principal - AHORA INCLUYE TODO LO SCROLLEABLE */}
          <main className="dashboard-content">
            {/* Estado del Sistema (solo en dashboard principal) */}
            {showWelcome && (
              <div className="system-status">
                <h3>🔧 Estado del Sistema</h3>
                <div className="system-status-grid">
                  <div className="system-status-item">
                    <strong>Sesión:</strong>
                    <span className="system-status-value">
                      {localStorage.getItem("auth.token") ? "✅ Activa" : "❌ Inactiva"}
                    </span>
                  </div>
                  <div className="system-status-item">
                    <strong>Usuario ID:</strong>
                    <span className="system-status-value">{user?.id || "N/A"}</span>
                  </div>
                  <div className="system-status-item">
                    <strong>Permisos:</strong>
                    <span className="system-status-value">
                      {user?.permissions?.includes("*") ? "🔓 Completos" : "🔒 Limitados"}
                    </span>
                  </div>
                  <div className="system-status-item">
                    <strong>Acceso:</strong>
                    <span className="system-status-value">
                      {user?.roles?.includes("superadmin") ? "🌐 Global" : "🏢 Empresa"}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Bienvenida (solo en dashboard principal) */}
            {showWelcome && (
              <div className="dashboard-welcome">
                <div className="welcome-content">
                  <div className="welcome-text">
                    <h1 className="welcome-title">
                      ¡Bienvenido de vuelta, <span className="welcome-name">{welcomeData.userName}</span>!
                    </h1>
                    <p className="welcome-subtitle">
                      {welcomeData.currentTime}
                    </p>
                    <p className="welcome-company">
                      Panel de administración de <strong>{welcomeData.companyName}</strong> · 
                      <span className="welcome-role"> {welcomeData.userRole}</span>
                    </p>
                  </div>
                  <div className="welcome-stats">
                    <div className="welcome-stat">
                      <div className="stat-icon">👥</div>
                      <div className="stat-info">
                        <span className="stat-number">
                          {user?.permissions?.includes("*") ? "Completo" : "Limitado"}
                        </span>
                        <span className="stat-label">Acceso</span>
                      </div>
                    </div>
                    <div className="welcome-stat">
                      <div className="stat-icon">🏢</div>
                      <div className="stat-info">
                        <span className="stat-number">
                          {user?.roles?.includes("superadmin") ? "Global" : "Local"}
                        </span>
                        <span className="stat-label">Alcance</span>
                      </div>
                    </div>
                    <div className="welcome-stat">
                      <div className="stat-icon">🔐</div>
                      <div className="stat-info">
                        <span className="stat-number">Activa</span>
                        <span className="stat-label">Sesión</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="welcome-glow"></div>
              </div>
            )}
            
            {/* Outlet para rutas hijas */}
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

