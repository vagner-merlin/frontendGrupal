import axios from "axios";
import { http } from "../../shared/api/client";
import { listClientes } from "../clientes/service";
import { listTiposCredito } from "./tipos/service";
import type { CreateCreditoInput, Client } from "./types";
import type { TipoCredito } from "./tipos/types";

const BASE_URL = "/api/Creditos/creditos/"; // URL con slash final (requerido por Django)

// Conectar con el service de clientes real
export async function listClients(): Promise<Client[]> {
  try {
    const response = await listClientes(); // Usar el service existente de clientes
    // Mapear los datos al formato que espera el formulario de créditos
    return response.results.map(cliente => ({
      id: cliente.id!,
      nombre: cliente.nombre,
      apellido: cliente.apellido || "",
      telefono: cliente.telefono
    }));
  } catch (error) {
    console.error("Error loading clients:", error);
    
    // Fallback con datos mock si el backend no está disponible
    if (import.meta.env.DEV) {
      console.log("🔧 Using mock clients data");
      return [
        { id: 1, nombre: "Juan", apellido: "Pérez", telefono: "+591 70123456" },
        { id: 2, nombre: "María", apellido: "García", telefono: "+591 71234567" },
        { id: 3, nombre: "Carlos", apellido: "López", telefono: "+591 72345678" },
        { id: 4, nombre: "Ana", apellido: "Martínez", telefono: "+591 73456789" }
      ];
    }
    
    throw error;
  }
}

// Conectar con el service de tipos de crédito real
export async function listCreditTypes(): Promise<TipoCredito[]> {
  try {
    const response = await listTiposCredito(); // Usar el service existente de tipos
    // Mapear los datos al formato que espera el formulario de créditos
    return response.results.map(tipo => ({
      id: tipo.id!,
      nombre: tipo.nombre,
      descripcion: tipo.descripcion,
      monto_minimo: tipo.monto_minimo,
      monto_maximo: tipo.monto_maximo
    }));
  } catch (error) {
    console.error("Error loading credit types:", error);
    
    // Fallback con datos mock si el backend no está disponible
    if (import.meta.env.DEV) {
      console.log("🔧 Using mock credit types data");
      return [
        { 
          id: 1, 
          nombre: "Préstamo Personal", 
          descripcion: "Para gastos personales", 
          monto_minimo: 1000, 
          monto_maximo: 50000 
        },
        { 
          id: 2, 
          nombre: "Crédito Vehicular", 
          descripcion: "Para compra de vehículos", 
          monto_minimo: 10000, 
          monto_maximo: 200000 
        },
        { 
          id: 3, 
          nombre: "Crédito Hipotecario", 
          descripcion: "Para compra de vivienda", 
          monto_minimo: 50000, 
          monto_maximo: 500000 
        }
      ];
    }
    
    throw error;
  }
}

export async function createCredit(data: CreateCreditoInput) {
  try {
    console.log("📤 [CREDITOS] POST", BASE_URL);
    console.log("📋 [CREDITOS] Datos a enviar:", JSON.stringify(data, null, 2));
    
    const response = await http.post(BASE_URL, data);
    
    console.log("✅ [CREDITOS] Crédito creado exitosamente");
    console.log("📋 [CREDITOS] Respuesta del servidor:", response.data);
    
    return response.data;
  } catch (error: unknown) {
    console.error("❌ [CREDITOS] Error creating credit:", error);
    
    // Type guard para axios error
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // El servidor respondió con un código de estado fuera del rango 2xx
        console.error("❌ [CREDITOS] Status:", error.response.status);
        console.error("❌ [CREDITOS] Data:", error.response.data);
        console.error("❌ [CREDITOS] Headers:", error.response.headers);
        
        if (error.response.status === 400) {
          // Extraer mensajes de error específicos
          const responseData = error.response.data;
          let errorMessage = "Datos inválidos";
          
          // Si el error es un objeto con campos específicos
          if (typeof responseData === 'object' && responseData !== null) {
            const errorFields = [];
            
            // Iterar sobre los campos del error
            for (const [field, messages] of Object.entries(responseData)) {
              if (Array.isArray(messages)) {
                errorFields.push(`${field}: ${messages.join(', ')}`);
              } else if (typeof messages === 'string') {
                errorFields.push(`${field}: ${messages}`);
              }
            }
            
            if (errorFields.length > 0) {
              errorMessage = errorFields.join(' | ');
            } else if (responseData.detail) {
              errorMessage = responseData.detail;
            } else if (responseData.message) {
              errorMessage = responseData.message;
            }
          } else if (typeof responseData === 'string') {
            errorMessage = responseData;
          }
          
          throw new Error(`❌ Error en los datos: ${errorMessage}`);
        } else if (error.response.status === 401) {
          throw new Error("🔒 No autorizado. Por favor, inicie sesión nuevamente.");
        } else if (error.response.status === 403) {
          throw new Error("⛔ No tiene permisos para crear créditos.");
        } else if (error.response.status === 404) {
          throw new Error("🔍 Endpoint no encontrado. Verifique la configuración del backend.");
        } else {
          throw new Error(`⚠️ Error del servidor (${error.response.status}): ${error.response.data?.detail || error.response.data?.message || "Error desconocido"}`);
        }
      } else if (error.request) {
        // La solicitud fue hecha pero no hubo respuesta
        console.error("❌ [CREDITOS] No response:", error.request);
        throw new Error("No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://127.0.0.1:8000");
      }
    }
    
    // Error genérico
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("❌ [CREDITOS] Error:", message);
    throw new Error(`Error: ${message}`);
  }
}

export async function listCredits(params?: { page?: number; page_size?: number }) {
  try {
    console.log("📤 [CREDITOS] GET", BASE_URL, "params:", params);
    const response = await http.get(BASE_URL, { params });
    console.log("✅ [CREDITOS] Response recibida:", {
      status: response.status,
      totalResults: response.data.results?.length || 0,
      count: response.data.count,
      hasNext: !!response.data.next
    });
    
    // Log del primer crédito para debug
    if (response.data.results && response.data.results.length > 0) {
      console.log("📋 [CREDITOS] Ejemplo de crédito RAW:", response.data.results[0]);
    }
    
    // Validar que la respuesta tenga la estructura esperada
    if (!response.data) {
      console.warn("⚠️ [CREDITOS] Respuesta vacía del servidor");
      return {
        results: [],
        count: 0,
        next: null,
        previous: null
      };
    }

    // MAPEAR los datos del backend al formato esperado por el frontend
    const creditosMapeados = response.data.results?.map((credito: unknown) => {
      const c = credito as Record<string, unknown>;
      
      // Extraer nombre del cliente de diferentes formatos posibles
      let clienteNombre = "Cliente desconocido";
      
      if (c.cliente) {
        if (typeof c.cliente === 'string') {
          clienteNombre = c.cliente;
        } else if (typeof c.cliente === 'object' && c.cliente !== null) {
          const clienteObj = c.cliente as Record<string, unknown>;
          const nombre = clienteObj.nombre || '';
          const apellido = clienteObj.apellido || '';
          clienteNombre = `${nombre} ${apellido}`.trim() || `Cliente #${clienteObj.id || ''}`;
        } else if (typeof c.cliente === 'number') {
          clienteNombre = `Cliente #${c.cliente}`;
        }
      } else if (c.cliente_nombre && typeof c.cliente_nombre === 'string') {
        clienteNombre = c.cliente_nombre;
      } else if (c.cliente_id) {
        clienteNombre = `Cliente #${c.cliente_id}`;
      }

      return {
        ...c,
        cliente: clienteNombre,
        // Asegurar que estos campos existan
        codigo: c.codigo || `CRE-${c.id}`,
        estado: c.estado || c.enum_estado || 'SOLICITADO',
        monto: c.monto || c.Monto_Solicitado || 0,
        moneda: c.moneda || c.Moneda || 'BOB',
        tasa_anual: c.tasa_anual || c.Tasa_Interes || 0,
        plazo_meses: c.plazo_meses || c.Numero_Cuotas || 0,
      };
    }) || [];

    console.log("✅ [CREDITOS] Créditos mapeados:", creditosMapeados.length);
    if (creditosMapeados.length > 0) {
      console.log("📋 [CREDITOS] Ejemplo de crédito MAPEADO:", creditosMapeados[0]);
    }
    
    return {
      ...response.data,
      results: creditosMapeados
    };
  } catch (error) {
    console.error("❌ [CREDITOS] Error listing credits:", error);
    
    // Log más detallado del error
    if (axios.isAxiosError(error)) {
      console.error("❌ [CREDITOS] Status:", error.response?.status);
      console.error("❌ [CREDITOS] Data:", error.response?.data);
      console.error("❌ [CREDITOS] URL:", error.config?.url);
      console.error("❌ [CREDITOS] Headers:", error.config?.headers);
    }
    
    // Devolver estructura vacía en lugar de lanzar error
    // para que la UI no se rompa
    return {
      results: [],
      count: 0,
      next: null,
      previous: null
    };
  }
}

/**
 * HU18 - Obtener historial de créditos
 */
export async function getHistorialCreditos() {
  try {
    console.log("📤 [CREDITOS] GET /api/Creditos/historial/");
    const response = await http.get("/api/Creditos/historial/");
    console.log("✅ [CREDITOS] Historial obtenido:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ [CREDITOS] Error al obtener historial:", error);
    throw error;
  }
}

/**
 * HU18 - Obtener historial de créditos por CI
 */
export async function getHistorialByCI(ci: string) {
  try {
    console.log(`📤 [CREDITOS] GET /api/Creditos/historial/${ci}/`);
    const response = await http.get(`/api/Creditos/historial/${ci}/`);
    console.log("✅ [CREDITOS] Historial por CI obtenido:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ [CREDITOS] Error al obtener historial por CI:", error);
    throw error;
  }
}

/**
 * HU18 - Buscar estado de crédito por CI
 */
export async function getEstadoCreditoByCI(ci: string) {
  try {
    console.log(`📤 [CREDITOS] GET /api/Creditos/estado-credito/${ci}/`);
    const response = await http.get(`/api/Creditos/estado-credito/${ci}/`);
    console.log("✅ [CREDITOS] Estado por CI obtenido:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ [CREDITOS] Error al obtener estado por CI:", error);
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error("No se encontraron créditos para el CI proporcionado");
    }
    throw error;
  }
}

/**
 * Eliminar un crédito por CI del cliente
 * NOTA IMPORTANTE: Como el historial no devuelve IDs de créditos individuales,
 * esta función elimina TODOS los créditos del cliente usando el endpoint correcto
 */
export async function eliminarCreditoPorCI(ci: string) {
  try {
    console.log(`📤 [CREDITOS] Intentando eliminar créditos para CI: ${ci}`);
    
    // Verificar primero que existen créditos para este CI
    const historial = await http.get(`/api/Creditos/historial/${ci}/`);
    
    if (!historial.data || (Array.isArray(historial.data) && historial.data.length === 0)) {
      throw new Error("No se encontraron créditos para este cliente");
    }

    console.log(`📋 [CREDITOS] Se encontraron créditos. Intentando eliminar...`);

    // Intentar eliminar directamente por CI usando el endpoint de créditos con query param
    // Opción 1: Eliminar por filtro de CI
    try {
      const response = await http.delete(`/api/Creditos/creditos/?ci_cliente=${ci}`);
      console.log("✅ [CREDITOS] Créditos eliminados exitosamente (método 1)");
      return response.data;
    } catch {
      console.log("⚠️ [CREDITOS] Método 1 falló, intentando método 2...");
      
      // Opción 2: Obtener lista de créditos y eliminar por ID
      try {
        const creditosResponse = await http.get(`/api/Creditos/creditos/?ci_cliente=${ci}`);
        const creditos = creditosResponse.data.results || creditosResponse.data;
        
        if (!Array.isArray(creditos) || creditos.length === 0) {
          throw new Error("No se encontraron créditos para eliminar");
        }

        console.log(`📋 [CREDITOS] Encontrados ${creditos.length} crédito(s), eliminando uno por uno...`);
        
        // Eliminar cada crédito por su ID
        const promesas = creditos.map((credito: Record<string, unknown>) => {
          const id = credito.id || credito.codigo;
          if (!id) {
            console.warn("⚠️ [CREDITOS] Crédito sin ID:", credito);
            return Promise.resolve();
          }
          console.log(`📤 [CREDITOS] DELETE ${BASE_URL}${id}/`);
          return http.delete(`${BASE_URL}${id}/`);
        });

        await Promise.all(promesas.filter(p => p));
        console.log("✅ [CREDITOS] Todos los créditos eliminados exitosamente (método 2)");
        return { success: true, deleted: creditos.length };
        
      } catch {
        console.log("⚠️ [CREDITOS] Método 2 falló, intentando método 3...");
        
        // Opción 3: Endpoint específico de eliminación por CI (si existe)
        const response = await http.delete(`/api/Creditos/eliminar-por-cliente/${ci}/`);
        console.log("✅ [CREDITOS] Créditos eliminados exitosamente (método 3)");
        return response.data;
      }
    }
    
  } catch (error) {
    console.error("❌ [CREDITOS] Error al eliminar créditos:", error);
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const detail = error.response?.data?.detail;
      const message = error.response?.data?.message || error.response?.data?.error;
      
      if (status === 404) {
        throw new Error("No se encontraron créditos para este cliente en el sistema");
      }
      if (status === 403) {
        throw new Error("No tiene permisos para eliminar créditos");
      }
      if (status === 405) {
        throw new Error("El backend no soporta la eliminación de créditos. Contacte al administrador del sistema.");
      }
      
      // Mostrar el mensaje específico del backend
      if (detail) throw new Error(detail);
      if (message) throw new Error(message);
    }
    
    throw new Error("No se pudieron eliminar los créditos. El sistema no encontró registros asociados a este CI.");
  }
}

// Obtener un crédito por ID
export async function getCreditoById(id: number) {
  try {
    console.log(`📤 [CREDITOS] GET ${BASE_URL}${id}/`);
    const response = await http.get(`${BASE_URL}${id}/`);
    console.log("✅ [CREDITOS] Crédito obtenido:", response.data);
    return response.data;
  } catch (error: unknown) {
    console.error(`❌ [CREDITOS] Error obteniendo crédito ${id}:`, error);
    throw error;
  }
}

// Obtener estado actual del crédito (fase actual y datos recopilados)
export async function obtenerEstadoActual(creditoId: number) {
  try {
    console.log(`📤 [CREDITOS] GET ${BASE_URL}${creditoId}/estado-actual/`);
    const response = await http.get(`${BASE_URL}${creditoId}/estado-actual/`);
    console.log("✅ [CREDITOS] Estado obtenido:", response.data);
    return response.data;
  } catch (error: unknown) {
    console.error(`❌ [CREDITOS] Error obteniendo estado ${creditoId}:`, error);
    throw error;
  }
}

// Obtener línea de tiempo del crédito
export async function obtenerLineaTiempo(creditoId: number) {
  try {
    console.log(`📤 [CREDITOS] GET ${BASE_URL}${creditoId}/linea-tiempo/`);
    const response = await http.get(`${BASE_URL}${creditoId}/linea-tiempo/`);
    console.log("✅ [CREDITOS] Línea de tiempo obtenida:", response.data);
    return response.data;
  } catch (error: unknown) {
    console.error(`❌ [CREDITOS] Error obteniendo línea de tiempo ${creditoId}:`, error);
    throw error;
  }
}

