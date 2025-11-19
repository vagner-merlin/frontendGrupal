// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./modules/auth/service";
import DashboardLayout from "./modules/dashboard/dashboard";
import { RequireAuth } from "./shared/api/guards";

// Pages - Landing y Auth
import LandingPage from "./modules/landing/landing_page";
import AuthPage from "./modules/auth/page";
import CompanySignupPage from "./modules/landing/company_register";

// Pages - Dashboard Protected
import UsersPage from "./modules/usuarios/page";
import CrearUsuarioPage from "./modules/usuarios/crear_usuario";
import EditarUsuarioPage from "./modules/usuarios/editar_usuario";
import GestionUsuariosRoles from "./modules/usuarios/gestion_usuarios_roles"; // ← Solo esta
import GruposPage from "./modules/grupos/page";
import CreditsPage from "./modules/creditos/page";
import PagosPage from "./modules/pagos/page";
import EmpresaPage from "./modules/empresa/page";
import ClientesPage from "./modules/clientes/page";
import HistorialClientesPage from "./modules/clientes/historial";
import CrearClientePage from "./modules/clientes/crear_cliente";
import VerClientePage from "./modules/clientes/ver_cliente";
import EditarClientePage from "./modules/clientes/editar_cliente";

// Pages - Billing
import RegistroOnPremise from "./modules/billing/registro_onpremise";
import SubscriptionPage from "./modules/billing/suscripcion_page";

// Pages - Reports y Auditoria
import HistorialAuditoriaPage from "./modules/auditoria/historial";
import ReportesPage from "./modules/reportes/reportes";
import HistorialActividadesPage from "./modules/actividades";
import PersonalizacionPage from "./modules/personalizacion/personalizacion";
import CambiarFotosPage from "./modules/personalizacion/cambiar_fotos";
import BackupPage from "./modules/backup/backup";
import DashboardIngresos from "./modules/ingresos/dashboard";
import { Link } from "react-router-dom";
import "./styles/theme.css";
import "./shared/layout/topbar.css";
import TiposCreditoPage from "./modules/creditos/tipos/page";
import CrearCreditoPage from "./modules/creditos/crear_creditos";
import HistorialCreditosPage from "./modules/creditos/historial";
import HistorialCompletoPage from "./modules/creditos/historial_completo";
import ConsultaEstadoPage from "./modules/creditos/consulta_estado";
import { PagoExitoso } from "./modules/pagos/components/PagoExitoso";
import { PagoCancelado } from "./modules/pagos/components/PagoCancelado";
import ClienteWizard from "./modules/clientes/wizard/ClienteWizard";
import CreditoWorkflowVisor from "./modules/creditos/components/CreditoWorkflowVisor";

/* RequireRole: componente compacto para proteger rutas por rol */
type RequireRoleProps = {
  children: React.ReactElement;
  roles: string[];
  redirectTo?: string;
};

const RequireRole: React.FC<RequireRoleProps> = ({ children, roles, redirectTo = "/app" }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const userRoles = Array.isArray(user.roles) ? user.roles.map(String) : [];
  const allowed = roles.some(r => userRoles.includes(r));
  return allowed ? children : <Navigate to={redirectTo} replace />;
};

// Componente de inicio mejorado
export function Inicio() {
  const { user } = useAuth();

  // obtener preview de personalización desde localStorage (solo usado en cards)
  const companyLogo = typeof window !== "undefined" ? localStorage.getItem("ui.company.logo") : null;
  const accent = typeof window !== "undefined" ? localStorage.getItem("ui.accent_color") || localStorage.getItem("ui.accent-primary") : null;
  const companyName = typeof window !== "undefined"
    ? (localStorage.getItem("ui.company.name") || localStorage.getItem("ui.companyName") || "")
    : "";

  return (
    <section className="page" style={{ maxWidth: "1600px", margin: "0 auto" }}>
      {/* Enlaces rápidos */}
      <div>
        <h3 style={{ 
          margin: "0 0 28px 0", 
          color: "#e9d5ff", 
          fontSize: "24px", 
          fontWeight: "700",
          letterSpacing: "-0.02em",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>
          <span style={{
            fontSize: "28px",
            display: "inline-block",
            animation: "float 3s ease-in-out infinite"
          }}>🚀</span>
          Accesos Rápidos
        </h3>

        <div className="inicio-grid">
          {/* Dashboard */}
          <Link to="/app" style={{ textDecoration: "none" }}>
            <div className="quick-card">
              <h4>📊 Dashboard</h4>
              <p>Panel principal con métricas y estadísticas de tu empresa</p>
            </div>
          </Link>

          {/* Empresas - solo superadmin */}
          {user?.roles?.includes("superadmin") && (
            <Link to="/app/empresas" style={{ textDecoration: "none" }}>
              <div className="quick-card">
                <h4>🏢 Empresas</h4>
                <p>Gestión global de empresas registradas</p>
              </div>
            </Link>
          )}

          {/* Gestión de Usuarios y Roles - superadmin y admin */}
          {(user?.roles?.includes("superadmin") || user?.roles?.includes("admin")) && (
            <Link to="/app/gestion-usuarios" style={{ textDecoration: "none" }}>
              <div className="quick-card">
                <h4>👥 Gestión de Usuarios y Roles</h4>
                <p>Panel centralizado para usuarios, roles y permisos + Django Admin</p>
              </div>
            </Link>
          )}

          {/* Usuarios - superadmin y admin */}
          {(user?.roles?.includes("superadmin") || user?.roles?.includes("admin")) && (
            <Link to="/app/usuarios" style={{ textDecoration: "none" }}>
              <div className="quick-card">
                <h4>📋 Listar Usuarios</h4>
                <p>Ver y gestionar lista de usuarios del sistema</p>
              </div>
            </Link>
          )}

          {/* Personalización - ahora disponible para todos */}
          <Link to="/app/personalizacion" style={{ textDecoration: "none" }}>
            <div className="quick-card quick-card-special">
              <div className="quick-card-icon" style={{
                background: companyLogo ? `url(${companyLogo}) center/cover` : (accent || "linear-gradient(135deg, #8b5cf6, #d946ef)")
              }}>
                {!companyLogo && companyName.charAt(0).toUpperCase()}
              </div>
              <div className="quick-card-text">
                <h4>🎨 Personalización</h4>
                <p>Ajusta temas, logo y apariencia de tu empresa</p>
              </div>
            </div>
          </Link>

          {/* Módulos comunes para todos */}
          <Link to="/app/reportes" style={{ textDecoration: "none" }}>
            <div className="quick-card">
              <h4>📈 Reportes</h4>
              <p>Análisis detallados y reportes personalizados</p>
            </div>
          </Link>

          <Link to="/app/ingresos" style={{ textDecoration: "none" }}>
            <div className="quick-card">
              <h4>💹 Ingresos</h4>
              <p>Dashboard financiero y control de ingresos</p>
            </div>
          </Link>

          <Link to="/app/pagos" style={{ textDecoration: "none" }}>
            <div className="quick-card">
              <h4>💳 Pagos</h4>
              <p>Gestión de pagos y transacciones</p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: <AuthPage />,
  },
  {
    path: "/registro-onpremise",
    element: <RegistroOnPremise />,
  },
  {
    path: "/registro",
    element: <CompanySignupPage />,
  },
  {
    path: "/mi-suscripcion",
    element: <SubscriptionPage />,
  },
  {
    path: "/app",
    element: (
      <RequireAuth>
        <DashboardLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Inicio /> },
      { path: "empresas", element: <EmpresaPage /> },
      { path: "usuarios", element: <UsersPage /> },
      { path: "crear-usuario", element: <CrearUsuarioPage /> },
      { 
        path: "clientes", 
        element: <ClientesPage />, 
        children: [
          { index: true, element: <HistorialClientesPage /> },
          { path: "crear", element: <CrearClientePage /> },
          { path: "wizard", element: <ClienteWizard /> },
          { path: ":id", element: <VerClientePage /> },
          { path: ":id/editar", element: <EditarClientePage /> },
        ] 
      },
      { path: "gestion-usuarios", element: <GestionUsuariosRoles /> },
      { 
        path: "usuarios",
        children: [
          { path: "editar/:id", element: <EditarUsuarioPage /> },
        ]
      },
      { path: "grupos", element: <GruposPage /> },
      { path: "actividades", element: <HistorialActividadesPage /> },
      { path: "auditoria", element: <HistorialAuditoriaPage /> },
      { path: "reportes", element: <ReportesPage /> },
      { path: "personalizacion", element: <PersonalizacionPage /> },
      { path: "personalizacion/fotos", element: <CambiarFotosPage /> },
      { path: "ingresos", element: <DashboardIngresos /> },
      { path: "backup", element: <BackupPage /> },
      {
        path: "creditos",
        element: <CreditsPage />,
        children: [
          { index: true, element: <HistorialCreditosPage /> },
          { path: "crear", element: <CrearCreditoPage /> },
          { path: "consulta", element: <ConsultaEstadoPage /> },
          { path: "historial-completo", element: <HistorialCompletoPage /> },
          { path: "tipos", element: <RequireRole roles={["admin","superadmin"]}><TiposCreditoPage /></RequireRole> },
          { path: ":id/workflow", element: <CreditoWorkflowVisor /> },
        ],
      },
      { path: "pagos", element: <PagosPage /> },
      { path: "pago-exitoso", element: <PagoExitoso /> },
      { path: "pago-cancelado", element: <PagoCancelado /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

const container = document.getElementById("root")!;
const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);

// Evita raíces duplicadas en HMR
if (import.meta.hot) {
  import.meta.hot.dispose(() => root.unmount());
}
