import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../modules/auth/service";

type RequireAuthProps = {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
};

export const RequireAuth: React.FC<RequireAuthProps> = ({ 
  children, 
  redirectTo = "/login", 
  fallback 
}) => {
  const { user, loading } = useAuth();
  const loc = useLocation();

  console.log("[RequireAuth] Estado:", { user: user?.email, loading, path: loc.pathname });

  // Mientras carga la sesión, mostrar fallback sin redirigir
  if (loading) {
    console.log("[RequireAuth] ⏳ Cargando...");
    return <>{fallback ?? <section className="page"><p>Cargando sesión…</p></section>}</>;
  }

  // Si no hay usuario, redirigir a login
  if (!user) {
    console.log("[RequireAuth] ❌ No hay usuario, redirigiendo a", redirectTo);
    return <Navigate to={redirectTo} state={{ from: loc }} replace />;
  }

  console.log("[RequireAuth] ✅ Usuario autenticado, mostrando contenido");
  return <>{children}</>;
};

type PublicOnlyProps = {
  children: React.ReactNode;
  redirectTo?: string;
};

export const PublicOnly: React.FC<PublicOnlyProps> = ({ 
  children, 
  redirectTo = "/app" 
}) => {
  const { user, loading } = useAuth();

  // Evitar redirigir mientras carga
  if (loading) {
    return <section className="page"><p>Cargando…</p></section>;
  }

  // Si está autenticado, redirigir al dashboard
  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

