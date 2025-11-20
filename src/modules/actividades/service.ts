import { http } from "../../shared/api/client";

export interface ActivityItem {
  id: string;
  user: string;         // nombre o username
  action: string;       // resumen de la acción
  timestamp: string;    // ISO
  details: string;      // descripción larga / JSON string
  type: "create" | "update" | "delete" | "view" | "export" | "login" | "logout" | string;
  target?: string;      // opcional: recurso afectado
}

export interface ActivitiesPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: ActivityItem[];
}

/**
 * fetchActivities - obtiene actividades (filtradas por empresa si se pasa companyId)
 * Usa el endpoint REST del backend (ajusta la ruta si tu API difiere).
 */
export async function fetchActivities(
  companyId?: number,
  page = 1,
  pageSize = 50
): Promise<ActivitiesPage> {
  const params: Record<string, string> = {
    page: String(page),
    page_size: String(pageSize),
  };
  if (companyId !== undefined && companyId !== null) {
    params.empresa = String(companyId);
  }

  const response = await http.get<ActivitiesPage>("/api/admin-log/", { params });
  return response.data;
}