// src/modules/dashboard/supervisor.tsx
import React from "react";
import { useAuth } from "../auth/service";
import "../../styles/dashboard.css";

const DashboardSupervisor: React.FC = () => {
  const { user } = useAuth();

  const getImageUrl = (url: string | undefined) => {
    if (!url) return "https://via.placeholder.com/150";
    if (url.startsWith("http")) return url;
    return `http://18.116.21.77:8000${url}`;
  };

  const grupoNombre = user?.grupos && user.grupos.length > 0 
    ? user.grupos[0].nombre 
    : "Supervisor";

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="user-info-card">
          <div className="user-avatar">
            <img 
              src={getImageUrl(user?.perfil?.imagen_url)} 
              alt="Perfil" 
              onError={(e) => {
                e.currentTarget.src = "https://via.placeholder.com/150";
              }}
            />
          </div>
          <div className="user-details">
            <h2>{user?.nombre_completo || user?.username}</h2>
            <p className="user-role">👔 {grupoNombre}</p>
            <p className="user-email">{user?.email}</p>
          </div>
        </div>

        <div className="company-info-card">
          <div className="company-icon">🏢</div>
          <div className="company-details">
            <h3>{user?.empresa?.nombre_comercial || user?.empresa?.razon_social}</h3>
            <p>{user?.empresa?.email_contacto}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Bienvenido, {user?.first_name || user?.username}! 👋</h1>
          <p className="subtitle">Panel de Supervisor</p>
          
          <div className="empty-state">
            <div className="empty-icon">📈</div>
            <h3>Dashboard en Construcción</h3>
            <p>Aquí verás las métricas y herramientas de supervisión para tu equipo.</p>
          </div>
        </div>

        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-icon">👨‍💼</div>
            <div className="stat-content">
              <h4>Asesores a Cargo</h4>
              <p className="stat-value">-</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <h4>Créditos por Revisar</h4>
              <p className="stat-value">-</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h4>Aprobaciones del Mes</h4>
              <p className="stat-value">-</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSupervisor;
