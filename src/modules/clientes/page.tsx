import React from "react";
import { Outlet } from "react-router-dom";
import PageHeader from "../../shared/components/PageHeader";
import "../../styles/theme.css";

/**
 * Módulo Clientes - contenedor de rutas hijas:
 *  - /app/clientes       -> historial (ver clientes)
 *  - /app/clientes/crear -> crear cliente
 */
const ClientesPage: React.FC = () => {
  return (
    <section className="ui-page module-page module-clientes">
      <PageHeader
        title="Clientes"
        subtitle="Listado y creación de clientes"
        showBackButton={true}
        backPath="/app"
      />

      <div className="ui-tab-content">
        <Outlet />
      </div>
    </section>
  );
};

export default ClientesPage;