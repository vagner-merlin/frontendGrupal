import React, { useState, useEffect } from 'react';
import { useAuth } from '../../modules/auth/service';
import { useLocation } from 'react-router-dom';
import { getEmpresaById } from '../../modules/empresa/service';
import './topbar.css';

interface TopbarProps {
  pageTitle?: string;
  showSearch?: boolean;
  showNotifications?: boolean;
}

// Tipos extendidos para evitar usar 'any'
interface ExtendedUser {
  id?: number | string; // allow string coming from backend/localStorage
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

/**
 * Tipo mínimo de empresa que esperamos del servicio, evita usar `any`
 */
interface EmpresaMinimal {
  Imagen_url?: string;
  imagen_url?: string;
  nombre_comercial?: string;
  razon_social?: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  pageTitle,
  showSearch = false,
  showNotifications = true,
}) => {
  const { user } = useAuth();
  const location = useLocation();

  // Estados para datos de empresa
  const [companyData, setCompanyData] = useState({
    name: '',
    logo: '',
    subtitle: 'Dashboard',
  });

  useEffect(() => {
    // Cargar datos de empresa desde la API
    const extendedUser = user as ExtendedUser;
    const empresaIdRaw = user?.empresa_id;

    // Normalizar empresaId a number si es posible
    let empresaIdNum: number | null = null;
    if (empresaIdRaw !== undefined && empresaIdRaw !== null) {
      empresaIdNum =
        typeof empresaIdRaw === 'string' ? parseInt(empresaIdRaw, 10) : Number(empresaIdRaw);
      if (Number.isNaN(empresaIdNum)) empresaIdNum = null;
    }

    if (empresaIdNum != null) {
      // Llamar al servicio solo con number
      getEmpresaById(empresaIdNum)
        .then((empresa) => {
          if (empresa) {
            console.log('[Topbar] Empresa cargada:', empresa);
            // Manejar ambos formatos sin usar `any`
            const emp = empresa as EmpresaMinimal;
            const logoUrl = emp.Imagen_url || emp.imagen_url || '';
            console.log('[Topbar] Logo URL:', logoUrl);
            setCompanyData({
              name: emp.nombre_comercial || emp.razon_social || 'Mi Empresa',
              logo: logoUrl,
              subtitle: getSubtitleFromPath(location.pathname),
            });
          } else {
            // Fallback si la API falla
            fallbackCompanyData();
          }
        })
        .catch((err) => {
          console.error('[Topbar] Error al cargar empresa:', err);
          fallbackCompanyData();
        });
    } else {
      // Si no hay empresa_id válido, usar fallback
      fallbackCompanyData();
    }

    // no es un hook, sólo helper local — evitar prefijo `use` para no disparar reglas de hooks
    function fallbackCompanyData() {
      const companyName =
        localStorage.getItem('ui.company.name') ||
        localStorage.getItem('ui.companyName') ||
        extendedUser?.empresa?.razon_social ||
        'Mi Empresa';

      const companyLogo =
        localStorage.getItem('ui.company.logo') || extendedUser?.empresa?.imagen_url_empresa || '';

      setCompanyData({
        name: companyName,
        logo: companyLogo,
        subtitle: getSubtitleFromPath(location.pathname),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, location.pathname]);

  const getSubtitleFromPath = (pathname: string): string => {
    const pathMap: Record<string, string> = {
      '/app': 'Panel Principal',
      '/app/usuarios': 'Gestión de Usuarios',
      '/app/empresas': 'Gestión de Empresas',
      '/app/reportes': 'Análisis y Reportes',
      '/app/pagos': 'Gestión de Pagos',
      '/app/creditos': 'Gestión de Créditos',
      '/app/ingresos': 'Dashboard Financiero',
      '/app/personalizacion': 'Personalización',
      '/app/auditoria': 'Auditoría del Sistema',
      '/app/actividades': 'Historial de Actividades',
      '/app/backup': 'Respaldo de Datos',
    };

    return pathMap[pathname] || 'Sistema de Gestión';
  };

  const getCurrentPageTitle = (): string => {
    if (pageTitle) return pageTitle;

    const pathTitles: Record<string, string> = {
      '/app': 'Dashboard',
      '/app/usuarios': 'Usuarios',
      '/app/empresas': 'Empresas',
      '/app/reportes': 'Reportes',
      '/app/pagos': 'Pagos',
      '/app/creditos': 'Créditos',
      '/app/ingresos': 'Ingresos',
      '/app/personalizacion': 'Personalización',
      '/app/auditoria': 'Auditoría',
      '/app/actividades': 'Actividades',
      '/app/backup': 'Backup',
    };

    return pathTitles[location.pathname] || 'Panel';
  };

  return (
    <header className="topbar">
      {/* Logo y nombre de empresa */}
      <div className="topbar__company">
        <div className="topbar__logo topbar__interactive">
          {companyData.logo ? (
            <img
              src={companyData.logo}
              alt={companyData.name}
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                console.error('[Topbar] Error al cargar logo:', companyData.logo);
                // Ocultar imagen y mostrar inicial
                const img = e.currentTarget;
                img.style.display = 'none';
                if (img.parentElement) {
                  img.parentElement.textContent = companyData.name.charAt(0);
                }
              }}
            />
          ) : (
            companyData.name.charAt(0)
          )}
        </div>
        <div className="topbar__company-info">
          <h1 className="topbar__company-name">{companyData.name}</h1>
          <p className="topbar__company-subtitle">{companyData.subtitle}</p>
        </div>
      </div>

      {/* Centro - Título de página o search */}
      <div className="topbar__center">
        {showSearch ? (
          <div className="topbar__search">
            <span className="topbar__search-icon">🔍</span>
            <input type="text" placeholder="Buscar usuarios, reportes..." />
          </div>
        ) : (
          <h2 className="topbar__page-title">{getCurrentPageTitle()}</h2>
        )}
      </div>

      {/* Acciones del lado derecho */}
      <div className="topbar__actions">
        {/* Status del sistema */}
        <div className="topbar__status">
          <span className="topbar__status-dot"></span>
          Online
        </div>

        {/* Notificaciones */}
        {showNotifications && (
          <button className="topbar__notification topbar__interactive">
            🔔
            <span className="topbar__notification-badge"></span>
          </button>
        )}

        {/* Usuario removido completamente */}
      </div>

      {/* Efecto de brillo sutil */}
      <div className="topbar__glow"></div>
    </header>
  );
};

export default Topbar;