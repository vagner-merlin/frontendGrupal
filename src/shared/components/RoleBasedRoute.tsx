// src/shared/components/RoleBasedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../modules/auth/service";

/**
 * Componente que redirige al dashboard correcto según el rol del usuario
 * Lógica:
 * - is_superuser = true (sin grupos) → Retorna children (Inicio dentro del Layout)
 * - grupo id = 1 → Redirige a Dashboard Asesor de Créditos
 * - grupo id = 2 → Redirige a Dashboard Supervisor
 * - grupo id = 3 → Redirige a Dashboard Gerente
 * - grupo id = 4 → Redirige a Dashboard Gestión Financiera
 */
export const RoleBasedRedirect: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Superuser sin grupos → Muestra children (página de inicio)
  if (user.is_superuser && (!user.grupos || user.grupos.length === 0)) {
    return <>{children}</>;
  }

  // Usuario con grupos → Dashboard según primer grupo
  if (user.grupos && user.grupos.length > 0) {
    const grupoId = user.grupos[0].id;
    
    switch (grupoId) {
      case 1:
        return <Navigate to="/app/asesor-creditos" replace />;
      case 2:
        return <Navigate to="/app/supervisor" replace />;
      case 3:
        return <Navigate to="/app/gerente" replace />;
      case 4:
        return <Navigate to="/app/gestion-financiera" replace />;
      default:
        // Grupo no reconocido, mostrar children
        return <>{children}</>;
    }
  }

  // Fallback: mostrar children
  return <>{children}</>;
};

type RequireRoleProps = {
  children: React.ReactElement;
  allowedGroups?: number[]; // IDs de grupos permitidos
  requireSuperuser?: boolean; // Requiere superuser
  redirectTo?: string;
};

/**
 * Componente para proteger rutas basado en grupos o superuser
 */
export const RequireRole: React.FC<RequireRoleProps> = ({ 
  children, 
  allowedGroups = [], 
  requireSuperuser = false,
  redirectTo = "/app" 
}) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar si es superuser (cuando se requiere)
  if (requireSuperuser) {
    if (user.is_superuser && (!user.grupos || user.grupos.length === 0)) {
      return children;
    }
    return <Navigate to={redirectTo} replace />;
  }

  // Verificar grupos permitidos
  if (allowedGroups.length > 0) {
    const userGroupIds = user.grupos?.map(g => g.id) || [];
    const hasAccess = allowedGroups.some(id => userGroupIds.includes(id));
    
    if (hasAccess) {
      return children;
    }
    return <Navigate to={redirectTo} replace />;
  }

  // Si no hay restricciones específicas, permitir acceso
  return children;
};
