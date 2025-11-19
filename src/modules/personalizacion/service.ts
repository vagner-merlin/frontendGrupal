// Servicio de API para Configuración del Sistema (HU9)
import { http } from "../../shared/api/client";
import type { Configuracion, ConfiguracionCreate, ConfiguracionUpdate } from "./types";

const BASE_URL = "/api/configuracion/";

/**
 * Obtener todas las configuraciones
 */
export async function listarConfiguraciones(): Promise<Configuracion[]> {
  try {
    const { data } = await http.get<Configuracion[]>(BASE_URL);
    console.log("✅ Configuraciones obtenidas:", data);
    return data;
  } catch (error) {
    console.error("❌ Error listando configuraciones:", error);
    throw error;
  }
}

/**
 * Obtener configuración por ID
 */
export async function obtenerConfiguracion(id: number): Promise<Configuracion> {
  try {
    const { data } = await http.get<Configuracion>(`${BASE_URL}/${id}/`);
    console.log("✅ Configuración obtenida:", data);
    return data;
  } catch (error) {
    console.error(`❌ Error obteniendo configuración ${id}:`, error);
    throw error;
  }
}

/**
 * Obtener configuración de una empresa específica
 */
export async function obtenerConfiguracionPorEmpresa(empresaId: number): Promise<Configuracion | null> {
  try {
    const configuraciones = await listarConfiguraciones();
    const config = configuraciones.find((c) => c.empresa === empresaId);
    return config || null;
  } catch (error) {
    console.error(`❌ Error obteniendo configuración de empresa ${empresaId}:`, error);
    throw error;
  }
}

/**
 * Crear nueva configuración
 */
export async function crearConfiguracion(datos: ConfiguracionCreate): Promise<Configuracion> {
  try {
    console.log("📤 Creando configuración:", datos);
    const { data } = await http.post<Configuracion>(`${BASE_URL}/`, datos);
    console.log("✅ Configuración creada:", data);
    return data;
  } catch (error) {
    console.error("❌ Error creando configuración:", error);
    throw error;
  }
}

/**
 * Actualizar configuración completa (PUT)
 */
export async function actualizarConfiguracion(
  id: number,
  datos: ConfiguracionCreate
): Promise<Configuracion> {
  try {
    console.log(`📤 Actualizando configuración ${id}:`, datos);
    const { data } = await http.put<Configuracion>(`${BASE_URL}/${id}/`, datos);
    console.log("✅ Configuración actualizada:", data);
    return data;
  } catch (error) {
    console.error(`❌ Error actualizando configuración ${id}:`, error);
    throw error;
  }
}

/**
 * Actualizar configuración parcial (PATCH)
 */
export async function actualizarConfiguracionParcial(
  id: number,
  datos: ConfiguracionUpdate
): Promise<Configuracion> {
  try {
    console.log(`📤 Actualizando parcialmente configuración ${id}:`, datos);
    const { data } = await http.patch<Configuracion>(`${BASE_URL}/${id}/`, datos);
    console.log("✅ Configuración actualizada:", data);
    return data;
  } catch (error) {
    console.error(`❌ Error actualizando configuración ${id}:`, error);
    throw error;
  }
}

/**
 * Eliminar configuración
 */
export async function eliminarConfiguracion(id: number): Promise<void> {
  try {
    console.log(`📤 Eliminando configuración ${id}`);
    await http.delete(`${BASE_URL}/${id}/`);
    console.log("✅ Configuración eliminada");
  } catch (error) {
    console.error(`❌ Error eliminando configuración ${id}:`, error);
    throw error;
  }
}

/**
 * Aplicar configuración al sistema
 */
export function aplicarConfiguracion(config: Configuracion): void {
  console.log("🎨 Aplicando configuración al sistema:", config);

  // Aplicar color primario a múltiples variables CSS
  const root = document.documentElement;
  root.style.setProperty("--primary-color", config.color);
  root.style.setProperty("--color-primary", config.color);
  root.style.setProperty("--accent-color", config.color);
  root.style.setProperty("--brand-color", config.color);

  // Aplicar fuente al body y root
  document.body.style.fontFamily = `${config.tipo_letra}, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  root.style.setProperty("--font-family", `${config.tipo_letra}, sans-serif`);

  // Aplicar tema con transición suave
  document.body.style.transition = "background-color 0.3s ease, color 0.3s ease";
  
  if (config.enum_tema === "OSCURO") {
    document.body.classList.add("dark-theme");
    document.body.classList.remove("light-theme");
    root.setAttribute("data-theme", "dark");
    
    // Colores para tema oscuro
    document.body.style.backgroundColor = "#1a1a1a";
    document.body.style.color = "#f5f5f5";
    root.style.setProperty("--bg-color", "#1a1a1a");
    root.style.setProperty("--text-color", "#f5f5f5");
    root.style.setProperty("--card-bg", "#2d2d2d");
  } else {
    document.body.classList.add("light-theme");
    document.body.classList.remove("dark-theme");
    root.setAttribute("data-theme", "light");
    
    // Colores para tema claro
    document.body.style.backgroundColor = "#ffffff";
    document.body.style.color = "#1f2937";
    root.style.setProperty("--bg-color", "#ffffff");
    root.style.setProperty("--text-color", "#1f2937");
    root.style.setProperty("--card-bg", "#f9fafb");
  }

  // Guardar en localStorage para persistencia
  localStorage.setItem("app_config", JSON.stringify(config));
  
  console.log("✅ Configuración aplicada exitosamente");
}

/**
 * Cargar configuración guardada desde localStorage
 */
export function cargarConfiguracionGuardada(): Configuracion | null {
  try {
    const saved = localStorage.getItem("app_config");
    if (saved) {
      const config = JSON.parse(saved) as Configuracion;
      aplicarConfiguracion(config);
      return config;
    }
    return null;
  } catch (error) {
    console.error("❌ Error cargando configuración guardada:", error);
    return null;
  }
}

/**
 * Obtener y aplicar configuración de la empresa del usuario
 */
export async function cargarYAplicarConfiguracionEmpresa(empresaId: number): Promise<void> {
  try {
    const config = await obtenerConfiguracionPorEmpresa(empresaId);
    if (config) {
      aplicarConfiguracion(config);
    } else {
      console.warn(`⚠️ No hay configuración para la empresa ${empresaId}, usando valores por defecto`);
    }
  } catch (error) {
    console.error("❌ Error cargando configuración de empresa:", error);
  }
}
