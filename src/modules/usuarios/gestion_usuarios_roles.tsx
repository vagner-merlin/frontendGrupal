import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/service';
import PageHeader from '../../shared/components/PageHeader';
import "../../styles/gestion.css";
import "../../styles/theme.css";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  path?: string;
  externalUrl?: string;
  bgColor: string;
  type: 'internal' | 'external' | 'django-admin';
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  totalGroups: number;
  adminUsers: number;
}

export default function GestionUsuariosRoles() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalGroups: 0,
    adminUsers: 0
  });

  // Verificar permisos
  useEffect(() => {
    const isAdmin = user?.roles?.includes("admin");
    const isSuperAdmin = user?.roles?.includes("superadmin");
    
    if (!isAdmin && !isSuperAdmin) {
      navigate("/app");
      return;
    }
    
    // Simular carga de estadísticas
    setTimeout(() => {
      setStats({
        totalUsers: 24,
        activeUsers: 21,
        totalGroups: 5,
        adminUsers: 3
      });
      setLoading(false);
    }, 1000);
  }, [user, navigate]);

  const quickActions: QuickAction[] = [
    {
      id: 'create-user',
      title: 'Crear Usuario',
      description: 'Crear nuevo usuario con roles y permisos personalizados',
      icon: '👤',
      path: '/app/crear-usuario',
      bgColor: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      type: 'internal'
    },
    {
      id: 'create-group',
      title: 'Crear Grupo/Rol',
      description: 'Crear nuevos grupos de usuarios con permisos específicos',
      icon: '👥',
      path: '/app/grupos',
      bgColor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      type: 'internal'
    },
    {
      id: 'django-users',
      title: 'Django Admin - Usuarios',
      description: 'Panel nativo de Django para gestión avanzada de usuarios',
      icon: '🔧',
      externalUrl: 'http://127.0.0.1:8000/admin/auth/user/',
      bgColor: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      type: 'django-admin'
    },
    {
      id: 'django-groups',
      title: 'Django Admin - Grupos',
      description: 'Panel nativo de Django para gestión avanzada de grupos',
      icon: '⚙️',
      externalUrl: 'http://127.0.0.1:8000/admin/auth/group/',
      bgColor: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      type: 'django-admin'
    },
    {
      id: 'django-permissions',
      title: 'Django Admin - Permisos',
      description: 'Panel nativo de Django para gestión de permisos del sistema',
      icon: '🔐',
      externalUrl: 'http://127.0.0.1:8000/admin/auth/permission/',
      bgColor: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      type: 'django-admin'
    },
    {
      id: 'user-list',
      title: 'Listar Usuarios',
      description: 'Ver y gestionar todos los usuarios del sistema',
      icon: '📋',
      path: '/app/usuarios',
      bgColor: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      type: 'internal'
    }
  ];

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando gestión de usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page gestion-page">
      <PageHeader
        title="👥 Gestión de Usuarios y Roles"
        subtitle="Panel centralizado para administrar usuarios, grupos, roles y permisos"
        showBackButton={true}
        backPath="/app"
      />

      {/* Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalUsers}</div>
          <div className="stat-label">Total Usuarios</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{stats.activeUsers}</div>
          <div className="stat-label">Usuarios Activos</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{stats.totalGroups}</div>
          <div className="stat-label">Grupos/Roles</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{stats.adminUsers}</div>
          <div className="stat-label">Administradores</div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div style={{ marginTop: 32 }}>
        <h2 style={{ 
          fontSize: 24, 
          fontWeight: 700, 
          color: '#e9d5ff', 
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          🚀 Acciones Rápidas
        </h2>

        <div className="quick-actions-grid">
          {quickActions.map((action) => (
            action.type === 'internal' && action.path ? (
              <Link 
                key={action.id}
                to={action.path} 
                className={`action-card action-card--${
                  action.bgColor.includes('3b82f6') ? 'blue' :
                  action.bgColor.includes('10b981') ? 'green' :
                  action.bgColor.includes('f59e0b') ? 'orange' :
                  action.bgColor.includes('8b5cf6') ? 'purple' :
                  action.bgColor.includes('ef4444') ? 'red' : 'cyan'
                }`}
              >
                <span className="action-type-badge">{action.type}</span>
                <div className="action-card-icon">{action.icon}</div>
                <h3 className="action-card-title">{action.title}</h3>
                <p className="action-card-description">{action.description}</p>
              </Link>
            ) : (
              <a
                key={action.id}
                href={action.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`action-card action-card--${
                  action.bgColor.includes('3b82f6') ? 'blue' :
                  action.bgColor.includes('10b981') ? 'green' :
                  action.bgColor.includes('f59e0b') ? 'orange' :
                  action.bgColor.includes('8b5cf6') ? 'purple' :
                  action.bgColor.includes('ef4444') ? 'red' : 'cyan'
                }`}
              >
                <span className="action-type-badge">Django</span>
                <div className="action-card-icon">{action.icon}</div>
                <h3 className="action-card-title">{action.title}</h3>
                <p className="action-card-description">{action.description}</p>
              </a>
            )
          ))}
        </div>
      </div>
    </div>
  );
}