import axios, { AxiosError, AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig } from "axios";

/* ============================
   CONFIG desde variables .env
   ============================ */
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
  mode: import.meta.env.VITE_API_MODE || "hybrid",
  timeout: 10000,
  authScheme: "Token",  // Django Rest Framework usa "Token" no "Bearer"
  authRoute: "/login",
  MOCK_DELAY: 500,
} as const;

/** Determina si el modo actual es mock */
export function isMockMode(): boolean {
  return API_CONFIG.mode === "mock";
}

/** Determina si el modo actual es híbrido */
export function isHybridMode(): boolean {
  return API_CONFIG.mode === "hybrid";
}

/* =======================================
   Normalización segura de la baseURL
   ======================================= */


/* =======================
   Claves de almacenamiento
   ======================= */
export const STORAGE_KEYS = {
  AUTH: "auth",                    // Objeto de auth (compat)
  AUTH_ME: "auth.me",              // Usuario serializado (recomendado)
  AUTH_TOKEN: "auth.token",        // Token plano (compat)
  TENANT: "auth.tenant_id",        // Tenant ID (compat usuario normal)
  ADMIN_SCOPE_TENANT: "admin.scope.tenant_id", // Tenant apuntado por admin
  ORGS: "mock.organizations",
  SUBSCRIPTION: "cache.subscription",
} as const;

/* ===========================
   Flags / utilidades de auth
   =========================== */

/** Token desde localStorage o sessionStorage */
export const getAuthToken = (): string | undefined => {
  console.log("[getAuthToken] 🔍 Buscando token...");
  
  // 1. Buscar en auth.token (nuevo formato)
  const token =
    localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  if (token) {
    console.log("[getAuthToken] ✅ Token encontrado en auth.token:", token.substring(0, 20) + "...");
    return token;
  }

  // 2. Buscar en 'token' (formato legacy de Django)
  const legacyToken = 
    localStorage.getItem('token') ||
    sessionStorage.getItem('token');
  if (legacyToken) {
    console.log('[getAuthToken] ✅ Token encontrado en formato legacy (key="token"):', legacyToken.substring(0, 20) + "...");
    console.log('[getAuthToken] Migrando a auth.token...');
    // Migrar automáticamente al nuevo formato
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, legacyToken);
    return legacyToken;
  }

  // 3. Buscar en objeto auth completo
  try {
    const rawAuth =
      localStorage.getItem(STORAGE_KEYS.AUTH) ||
      sessionStorage.getItem(STORAGE_KEYS.AUTH);
    if (rawAuth) {
      const auth = JSON.parse(rawAuth);
      if (auth?.token) {
        console.log("[getAuthToken] ✅ Token encontrado en auth object:", auth.token.substring(0, 20) + "...");
        return auth.token;
      }
    }
  } catch (error) {
    console.error("[getAuthToken] Error al leer token de auth:", error);
  }
  
  console.warn("[getAuthToken] ❌ NO SE ENCONTRÓ TOKEN");
  console.warn("[getAuthToken] localStorage keys:", Object.keys(localStorage));
  return undefined;
};

/** Tenant del usuario normal (compat) */
export const getTenantId = (): string | undefined => {
  // 1. Buscar en auth.tenant_id (nuevo formato)
  const tenantId =
    localStorage.getItem(STORAGE_KEYS.TENANT) ||
    sessionStorage.getItem(STORAGE_KEYS.TENANT);
  if (tenantId) return tenantId;

  // 2. Buscar en auth.empresa_id (alternativa)
  const empresaId =
    localStorage.getItem('auth.empresa_id') ||
    sessionStorage.getItem('auth.empresa_id');
  if (empresaId) return empresaId;

  // 3. Buscar en objeto user (legacy)
  try {
    const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (rawUser) {
      const user = JSON.parse(rawUser);
      if (user?.empresa_id) return String(user.empresa_id);
      if (user?.tenant_id) return String(user.tenant_id);
    }
  } catch (error) {
    console.error("Error al leer tenant_id de user:", error);
  }

  // 4. Buscar en objeto auth completo
  try {
    const rawAuth =
      localStorage.getItem(STORAGE_KEYS.AUTH) ||
      sessionStorage.getItem(STORAGE_KEYS.AUTH);
    if (rawAuth) {
      const auth = JSON.parse(rawAuth);
      return auth?.tenant_id;
    }
  } catch (error) {
    console.error("Error al leer tenant_id:", error);
  }
  return undefined;
};

/* ==================
   Cliente HTTP Axios
   ================== */

// NOTA: dejar baseURL vacío para usar proxy de Vite (usa rutas relativas "/api/...")
export const http = axios.create({
  baseURL: "", // <- ruta relativa: Vite proxy reenviará /api -> backend
  timeout: 30000,
  headers: {
    // NO establecer Content-Type aquí - dejar que Axios lo detecte automáticamente
    // (para FormData, Axios establece multipart/form-data con boundary correcto)
  },
  withCredentials: false,
});

/* ==============================
   Interceptor de solicitud (req)
   ============================== */
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const headers =
    config.headers instanceof AxiosHeaders
      ? config.headers
      : new AxiosHeaders(config.headers || {});

  // Endpoint público: fuerza Authorization: "" para no enviar token
  const isPublicEndpoint = headers.get("Authorization") === "";

  console.log(`[HTTP Request] ${config.method?.toUpperCase()} ${config.url}`);
  console.log("[HTTP Request] Is public endpoint:", isPublicEndpoint);
  console.log("[HTTP Request] Content-Type:", headers.get("Content-Type"));
  console.log("[HTTP Request] Data type:", config.data?.constructor?.name);

  if (!isPublicEndpoint) {
    // 1) Authorization
    const token = getAuthToken();
    console.log("[HTTP Request] Token encontrado:", token ? `${token.substring(0, 20)}...` : "NO");
    
    if (token) {
      const authHeader = `${API_CONFIG.authScheme} ${token}`;
      headers.set("Authorization", authHeader);
      console.log("[HTTP Request] Authorization header:", authHeader.substring(0, 30) + "...");
    } else {
      console.warn("[HTTP Request] ⚠️ NO HAY TOKEN - La petición fallará con 401");
    }

    // 2) X-Tenant-ID
    const skipTenant = headers.get("X-Tenant-ID") === "";
    if (!skipTenant) {
      const tenantId = getTenantId();
      if (tenantId) {
        headers.set("X-Tenant-ID", tenantId);
        console.log("[HTTP Request] X-Tenant-ID:", tenantId);
      }
    }
  }

  if (import.meta.env.DEV) {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL || ""}${config.url}`);
  }

  // IMPORTANTE: Si es FormData, NO tocar Content-Type
  // Axios automáticamente establece multipart/form-data con boundary correcto
  if (config.data instanceof FormData) {
    console.log("[HTTP Request] 📦 FormData detectado - dejando que Axios maneje Content-Type");
    // Eliminar Content-Type si fue establecido, para que Axios lo regenere
    headers.delete("Content-Type");
  }

  config.headers = headers;
  return config;
});

/* =============================
   Interceptor de respuesta (res)
   ============================= */
http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("❌ ERROR 401: NO AUTORIZADO");
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("📍 URL que falló:", error.config?.url);
      console.error("🔑 Token enviado:", getAuthToken()?.substring(0, 30) + "...");
      console.error("📦 Headers de la petición:", error.config?.headers);
      console.error("📨 Respuesta del backend:", error.response?.data);
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      
      // TEMPORALMENTE DESACTIVADO: No redirigir automáticamente
      // const currentPath = window.location.pathname;
      // if (!currentPath.startsWith(API_CONFIG.authRoute)) {
      //   const redirect = encodeURIComponent(currentPath + window.location.search);
      //   window.location.href = `${API_CONFIG.authRoute}?redirect=${redirect}`;
      // }
    }
    return Promise.reject(error);
  }
);

/* ====================================
   MOCK: activar interceptores si aplica
   ==================================== */
if (isMockMode()) {
  import("./mock").then(({ setupMockInterceptors }) => {
    setupMockInterceptors(http);
  });
}
