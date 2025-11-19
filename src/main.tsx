/* -------------------- Librerías externas -------------------- */
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { Link } from "react-router-dom";

/* -------------------- Estilos globales -------------------- */
import "./styles/theme.css";
import "./shared/layout/topbar.css";

/* -------------------- Auth / Provider / Guards -------------------- */
/* src/modules/auth/service.ts */
import { AuthProvider, useAuth } from "./modules/auth/service";
/* src/shared/api/guards.tsx */
import { RequireAuth } from "./shared/api/guards";
/* src/shared/components/RoleBasedRoute.tsx */
import { RoleBasedRedirect, RequireRole } from "./shared/components/RoleBasedRoute";

/* -------------------- Layout principal -------------------- */
/* src/modules/dashboard/dashboard.tsx */
import DashboardLayout from "./modules/dashboard/dashboard";

/* -------------------- Dashboards por Rol -------------------- */
import DashboardAsesorCreditos from "./modules/dashboard/asesor_creditos";
import DashboardSupervisor from "./modules/dashboard/supervisor";
import DashboardGerente from "./modules/dashboard/gerente";
import DashboardGestionFinanciera from "./modules/dashboard/gestion_financiera";

/* -------------------- Landing / Auth pages -------------------- */
/* src/modules/landing/landing_page.tsx */
import LandingPage from "./modules/landing/landing_page";
/* src/modules/auth/page.tsx */
import AuthPage from "./modules/auth/page";
/* src/modules/landing/company_register.tsx */
import CompanySignupPage from "./modules/landing/company_register";

/* -------------------- Módulos del Dashboard (páginas) -------------------- */
/* Usuarios */
import UsersPage from "./modules/usuarios/page";
import CrearUsuario from "./modules/usuarios/crear_usuario";
import GestionUsuariosRoles from "./modules/usuarios/gestion_usuarios_roles";
import EditarUsuario from "./modules/usuarios/editar_usuario";

/* Grupos */
import GruposPage from "./modules/grupos/page";

/* Créditos */
import CreditsPage from "./modules/creditos/page";
/* Tipos / crear / historial / visor */
import TiposCreditoPage from "./modules/creditos/tipos/tipos_creditos";
import CrearCreditoPage from "./modules/creditos/crear_creditos";
import HistorialCreditosPage from "./modules/creditos/historial";
import HistorialCompletoPage from "./modules/creditos/historial_completo";
import ConsultaEstadoPage from "./modules/creditos/consulta_estado";
import CreditoWorkflowVisor from "./modules/creditos/components/CreditoWorkflowVisor";

/* Pagos */
import PagosPage from "./modules/pagos/page";
import { PagoExitoso } from "./modules/pagos/components/PagoExitoso";
import { PagoCancelado } from "./modules/pagos/components/PagoCancelado";

/* Empresa / Personalización / Backup / Ingresos */
import EmpresaPage from "./modules/empresa/page";
import PersonalizacionPage from "./modules/personalizacion/personalizacion";
import CambiarFotosPage from "./modules/personalizacion/cambiar_fotos";
import BackupPage from "./modules/backup/backup";
import DashboardIngresos from "./modules/ingresos/dashboard";

/* Clientes (módulo) */
import ClientesPage from "./modules/clientes/page";
/* vistas dentro de clientes */
import HistorialClientesPage from "./modules/clientes/historial";
import CrearClientePage from "./modules/clientes/crear_cliente";
import ClienteWizard from "./modules/clientes/wizard/ClienteWizard";
import VerClientePage from "./modules/clientes/ver_cliente";
import EditarClientePage from "./modules/clientes/editar_cliente";
import PanelAdmin from "./modules/panel_administrativo/panel_admin";

/* Billing / Subscription */
import RegistroOnPremise from "./modules/billing/registro_onpremise";
import SubscriptionPage from "./modules/billing/suscripcion_page";

/* Reportes / Auditoría / Actividades */
import HistorialAuditoriaPage from "./modules/auditoria/historial";
import ReportesPage from "./modules/reportes/reportes";
import HistorialActividadesPage from "./modules/actividades";

/* -------------------- Router -------------------- */
/* Componente de inicio mejorado */
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
  // Dashboards por rol (fuera del DashboardLayout porque tienen su propio diseño)
  {
    path: "/app/asesor-creditos",
    element: (
      <RequireAuth>
        <RequireRole allowedGroups={[1]}>
          <DashboardAsesorCreditos />
        </RequireRole>
      </RequireAuth>
    ),
  },
  {
    path: "/app/supervisor",
    element: (
      <RequireAuth>
        <RequireRole allowedGroups={[2]}>
          <DashboardSupervisor />
        </RequireRole>
      </RequireAuth>
    ),
  },
  {
    path: "/app/gerente",
    element: (
      <RequireAuth>
        <RequireRole allowedGroups={[3]}>
          <DashboardGerente />
        </RequireRole>
      </RequireAuth>
    ),
  },
  {
    path: "/app/gestion-financiera",
    element: (
      <RequireAuth>
        <RequireRole allowedGroups={[4]}>
          <DashboardGestionFinanciera />
        </RequireRole>
      </RequireAuth>
    ),
  },
  // Rutas principales bajo /app (para todos los usuarios autenticados)
  {
    path: "/app",
    element: (
      <RequireAuth>
        <DashboardLayout />
      </RequireAuth>
    ),
    children: [
      // Ruta index: redirige según el rol o muestra Inicio para superuser
      { index: true, element: <RoleBasedRedirect><Inicio /></RoleBasedRedirect> },
      
      // Panel administrativo (solo superuser)
      { path: "panel-admin", element: <RequireRole requireSuperuser={true}><PanelAdmin /></RequireRole> },
      { path: "empresas", element: <RequireRole requireSuperuser={true}><EmpresaPage /></RequireRole> },
      
      // Usuarios (solo admin/superuser)
      { path: "usuarios", element: <RequireRole requireSuperuser={true}><UsersPage /></RequireRole> },
      { path: "usuarios/crear", element: <RequireRole requireSuperuser={true}><CrearUsuario /></RequireRole> },
      { path: "usuarios/roles", element: <RequireRole requireSuperuser={true}><GestionUsuariosRoles /></RequireRole> },
      { path: "usuarios/:id/editar", element: <RequireRole requireSuperuser={true}><EditarUsuario /></RequireRole> },
      { path: "gestion-usuarios", element: <RequireRole requireSuperuser={true}><GestionUsuariosRoles /></RequireRole> },
      
      // Grupos (solo admin/superuser)
      { path: "grupos", element: <RequireRole requireSuperuser={true}><GruposPage /></RequireRole> },
      
      // Clientes (todos los roles)
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
      
      // Actividades y auditoría (todos los roles)
      { path: "actividades", element: <HistorialActividadesPage /> },
      { path: "auditoria", element: <HistorialAuditoriaPage /> },
      
      // Reportes y personalización (todos los roles)
      { path: "reportes", element: <ReportesPage /> },
      { path: "personalizacion", element: <PersonalizacionPage /> },
      { path: "personalizacion/fotos", element: <CambiarFotosPage /> },
      
      // Ingresos (solo ciertos roles)
      { path: "ingresos", element: <DashboardIngresos /> },
      
      // Backup (solo superuser)
      { path: "backup", element: <RequireRole requireSuperuser={true}><BackupPage /></RequireRole> },
      
      // Créditos (todos los roles)
      {
        path: "creditos",
        element: <CreditsPage />,
        children: [
          { index: true, element: <HistorialCreditosPage /> },
          { path: "crear", element: <CrearCreditoPage /> },
          { path: "consulta", element: <ConsultaEstadoPage /> },
          { path: "historial-completo", element: <HistorialCompletoPage /> },
          { path: "tipos", element: <RequireRole requireSuperuser={true}><TiposCreditoPage /></RequireRole> },
          { path: ":id/workflow", element: <CreditoWorkflowVisor /> },
        ],
      },
      
      // Pagos (todos los roles)
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
