// src/modules/dashboard/gerente.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/service";
import "../../styles/dashboard.css";

const DashboardGerente: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getImageUrl = (url: string | undefined) => {
    if (!url) return "https://via.placeholder.com/150";
    if (url.startsWith("http")) return url;
    return `http://18.116.21.77:8000${url}`;
  };

  const grupoNombre = user?.grupos && user.grupos.length > 0 
    ? user.grupos[0].nombre 
    : "Gerente";

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <button 
          onClick={handleLogout}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
            transition: 'all 0.2s',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
          }}
        >
          🚪 Salir
        </button>
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
            <p className="user-role">💼 {grupoNombre}</p>
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
          <p className="subtitle">Panel de Gerencia</p>
          
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>Dashboard en Construcción</h3>
            <p>Aquí verás las métricas estratégicas y de gestión de la empresa.</p>
          </div>
        </div>

        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h4>Ingresos del Mes</h4>
              <p className="stat-value">-</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h4>Cartera Total</h4>
              <p className="stat-value">-</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <h4>Mora Vigente</h4>
              <p className="stat-value">-</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardGerente;
