import type { AuthUser } from "../../modules/auth/types";

// Tipo para grupos devueltos por /api/User/me/
type Grupo = {
  id: number | string;
  nombre?: string | null;
  descripcion?: string | null;
};

export type MenuItem = {
  path: string;
  label: string;
  icon?: string;
  exact?: boolean;
  roles?: string[]; 
  allowedCategories?: string[]; 
  groupIds?: Array<number>; // <-- nuevo: ids de grupo permitidos
  children?: MenuItem[];
  external?: boolean;
};

function getUserGroupIds(user: AuthUser | null): number[] {
  if (!user) return [];
  const grupos = (user as AuthUser & { grupos?: { id: number | string }[] }).grupos ?? [];
  return grupos.map(g => Number(g.id)).filter(n => !Number.isNaN(n));
}

function getUserCategories(user: AuthUser | null): Set<string> {
  const set = new Set<string>();
  if (!user) return set;
  const grupos = (user as AuthUser & { grupos?: Grupo[] }).grupos ?? [];
  grupos.forEach((g) => {
    const nombre = String(g?.nombre ?? "").toLowerCase().trim();
    if (!nombre) return;
    if (nombre.includes("asesor") || nombre.includes("asesor de credito") || nombre.includes("asesor de créditos") || nombre.includes("acesor")) {
      set.add("asesor");
    }
    if (nombre.includes("supervisor")) {
      set.add("supervisor");
    }
    if (nombre.includes("gerente")) {
      set.add("gerente");
    }
    if (nombre.includes("gestion financiera") || nombre.includes("gestión financiera") || nombre.includes("financiera")) {
      set.add("gestion_financiera");
    }
    // puedes añadir más reglas aquí si hay más nombres de grupo
  });
  return set;
}

export function getMenuForUser(user: AuthUser | null): MenuItem[] {
  const isAdmin = !!user?.roles?.includes("admin") || !!user?.roles?.includes("superadmin");
  const categories = getUserCategories(user);
  const userGroupIds = getUserGroupIds(user);

  // Log para depuración: confirmar grupos detectados y categorías
  console.debug("[menuData] getMenuForUser | user id:", user?.id, "roles:", user?.roles, "groupIds:", userGroupIds, "categories:", Array.from(categories));

  // REEMPLAZA estos ids por los reales de tu backend
  const ID_ASESOR = 1;           // Asesor de Creditos
  const ID_SUPERVISOR = 2;       // Supervisor
  const ID_GERENTE = 3;          // Gerente
  const ID_GESTION_FIN = 4;      // Gestion Financiera

  const items: MenuItem[] = [
    { path: "/app", label: "Dashboard", icon: "🏠", exact: true },

    // Clientes — accesible para Asesor y admins
    {
      path: "/app/clientes",
      label: "Clientes",
      icon: "🧾",
      groupIds: [ID_ASESOR, ID_SUPERVISOR, ID_GERENTE], // Asesor + otros según necesidad
      allowedCategories: ["asesor", "supervisor", "gerente"],
      children: [
        { path: "/app/clientes", label: "Historial", icon: "📋", exact: true, groupIds: [ID_ASESOR, ID_SUPERVISOR, ID_GERENTE] },
        { path: "/app/clientes/crear", label: "Crear cliente", icon: "➕", groupIds: [ID_ASESOR] },
        { path: "/app/clientes/wizard", label: "Wizard", icon: "🧭", groupIds: [ID_ASESOR] },
        { path: "/app/clientes/:id", label: "Ver cliente", icon: "🔎", groupIds: [ID_ASESOR, ID_SUPERVISOR, ID_GERENTE] },
      ],
    },

    // Usuarios (solo admin / superadmin)
    {
      path: "/app/usuarios",
      label: "Usuarios",
      icon: "👥",
      roles: ["admin", "superadmin"],
      children: [
        { path: "/app/usuarios", label: "Historial", icon: "📋", exact: true },
        { path: "/app/usuarios/crear", label: "Crear usuario", icon: "➕", roles: ["admin", "superadmin"] },
        { path: "/app/usuarios/roles", label: "Gestión de roles", icon: "🔐", roles: ["admin", "superadmin"] },
      ],
    },

    // Reportes y Personalización (todos los grupos + admins)
    { path: "/app/reportes", label: "Reportes", icon: "📈", groupIds: [ID_ASESOR, ID_SUPERVISOR, ID_GERENTE, ID_GESTION_FIN], allowedCategories: ["asesor","supervisor","gerente","gestion_financiera"] },
    { path: "/app/personalizacion", label: "Personalización", icon: "🎨", groupIds: [ID_ASESOR, ID_SUPERVISOR, ID_GERENTE, ID_GESTION_FIN], allowedCategories: ["asesor","supervisor","gerente","gestion_financiera"] },

    // Créditos
    {
      path: "/app/creditos",
      label: "Créditos",
      icon: "💳",
      // visible para Asesor, Supervisor, Gerente (y admins)
      groupIds: [ID_ASESOR, ID_SUPERVISOR, ID_GERENTE],
      allowedCategories: ["asesor","supervisor","gerente"],
      children: [
        { path: "/app/creditos", label: "Ver créditos", icon: "📋", groupIds: [ID_ASESOR, ID_SUPERVISOR, ID_GERENTE] },
        { path: "/app/creditos/crear", label: "Crear crédito", icon: "➕", groupIds: [ID_ASESOR] }, // solo Asesor
        { path: "/app/creditos/consulta", label: "Consultar por CI", icon: "🔍", groupIds: [ID_ASESOR, ID_SUPERVISOR, ID_GERENTE] },
        { path: "/app/creditos/tipos", label: "Tipos de crédito", icon: "🏷️", roles: ["admin", "superadmin"] },
      ],
    },

    // Pagos
    { path: "/app/pagos", label: "Pagos", icon: "💳", groupIds: [ID_SUPERVISOR, ID_GESTION_FIN], allowedCategories: ["supervisor","gestion_financiera"] },

    // Ingresos (Gestion Financiera)
    { path: "/app/ingresos", label: "Ingresos", icon: "💹", groupIds: [ID_GESTION_FIN], allowedCategories: ["gestion_financiera"] },

    // Panel administrativo y empresas (admins)
    {
      path: "http://18.116.21.77:8000/admin/auth/",
      label: "Panel administrativo",
      icon: "🛠️",
      external: true,
      roles: ["admin", "superadmin"],
    },
    { path: "/app/empresas", label: "Empresas", icon: "🏢", roles: ["superadmin"] },
  ];

  // Filtrado combinado mejorado:
  const itemVisible = (item: MenuItem): boolean => {
    // Si es superadmin/admin: ver todo excepto cuando item.roles restringe (p. ej. solo superadmin)
    if (isAdmin) {
      if (item.roles && item.roles.length > 0) {
        return item.roles.some((r) => (user?.roles ?? []).includes(r));
      }
      return true;
    }

    // Si item.roles explícitos (ej. ["admin","superadmin"]) y el usuario no los tiene -> ocultar
    if (item.roles && item.roles.length > 0) {
      if (!user) return false;
      if (!item.roles.some((r) => (user.roles ?? []).includes(r))) return false;
    }

    // Si item tiene groupIds, comprobar por id de grupos (prioritario)
    if (item.groupIds && item.groupIds.length > 0) {
      const okById = item.groupIds.some((gid) => userGroupIds.includes(gid));
      if (okById) return true;
      // si tiene groupIds definidos y no coincide por id, no conceder aún; pero no retornamos false inmediato
      // porque quizás allowedCategories coincida por nombre de grupo (fallback)
    }

    // Si item.allowedCategories definido, comprobar por categorías derivadas del nombre del grupo
    if (item.allowedCategories && item.allowedCategories.length > 0) {
      const okByCategory = item.allowedCategories.some((c) => categories.has(c));
      if (okByCategory) return true;
      // no retorno false inmediato; si no hay restricciones adicionales, permitiremos más abajo
    }

    // Si no hay restricciones (ni roles, ni groupIds, ni allowedCategories) -> mostrar
    const hasAnyRestriction = (item.roles && item.roles.length > 0) || (item.groupIds && item.groupIds.length > 0) || (item.allowedCategories && item.allowedCategories.length > 0);
    if (!hasAnyRestriction) return true;

    // Si llegamos aquí, había restricciones y ninguna se cumplió -> ocultar
    return false;
  };

  const applyFilter = (arr: MenuItem[]): MenuItem[] =>
    arr
      .filter(itemVisible)
      .map((it) => ({
        ...it,
        children: it.children ? applyFilter(it.children) : undefined,
      }));

  return applyFilter(items);
}