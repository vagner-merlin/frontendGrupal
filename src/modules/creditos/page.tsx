import React from "react";
import { Outlet } from "react-router-dom";
import PageHeader from "../../shared/components/PageHeader";
import "../../styles/theme.css";

/**
 * Página principal del módulo Créditos.
 * Simple contenedor de rutas hijas:
 *  - /app/creditos        -> historial (Ver créditos)
 *  - /app/creditos/crear  -> crear crédito
 *  - /app/creditos/tipos  -> tipos de crédito
 */
const CreditsPage: React.FC = () => {
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