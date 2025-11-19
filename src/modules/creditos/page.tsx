import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import PageHeader from "../../shared/components/PageHeader";
import "../../styles/theme.css";
import { useAuth } from "../auth/service";

/**
 * Página principal del módulo Créditos.
 * Simple contenedor de rutas hijas:
 *  - /app/creditos        -> historial (Ver créditos)
 *  - /app/creditos/crear  -> crear crédito
 *  - /app/creditos/tipos  -> tipos de crédito
 */
const CreditsPage: React.FC = () => {
  const { user, loading, isSuperAdmin } = useAuth();

  // Esperar inicialización
  if (loading) return null;

  const hasAccess =
    !!user &&
    (isSuperAdmin() ||
      (Array.isArray(user.roles) &&
        (user.roles.includes("admin") || user.roles.includes("gestor_creditos"))));

  if (!hasAccess) {
    // Redirigir fuera del módulo si no tiene permisos
    return <Navigate to="/app" replace />;
  }

  return (
    <section className="ui-page module-page module-creditos">
      <PageHeader
        title="Créditos"
        subtitle="Solicitudes y seguimiento de créditos"
        showBackButton={true}
        backPath="/app"
      />

      <div className="ui-tab-content">
        <Outlet />
      </div>
    </section>
  );
};

export default CreditsPage;