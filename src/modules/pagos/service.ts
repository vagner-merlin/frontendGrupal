import { http, isMockMode } from "../../shared/api/client";
import type { 
 
  PaymentWithCredit, 
  CreditInfo, 
  ListPaymentsParams, 
  Page, 
  PaymentSummary,
  ProcessPaymentInput,
  PaymentStatus,
  PaymentMethod
} from "./types";

const MOCK_KEY = "mock.pagos.v1";
const MOCK_CREDITS_KEY = "mock.creditos_info.v1";

function nowISO(): string {
  return new Date().toISOString();
}

// Helpers para localStorage
function readMockPayments(): PaymentWithCredit[] {
  try {
    const raw = localStorage.getItem(MOCK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeMockPayments(payments: PaymentWithCredit[]): void {
  localStorage.setItem(MOCK_KEY, JSON.stringify(payments));
}

function getMockCreditsInfo(): CreditInfo[] {
  try {
    const raw = localStorage.getItem(MOCK_CREDITS_KEY);
    if (!raw) {
      // Generar datos mock iniciales
      const mockCredits = generateMockCredits();
      localStorage.setItem(MOCK_CREDITS_KEY, JSON.stringify(mockCredits));
      return mockCredits;
    }
    return JSON.parse(raw);
  } catch {
    return generateMockCredits();
  }
}

function generateMockCredits(): CreditInfo[] {
  return [
    {
      id: "cred_001",
      codigo: "CR-2024-001",
      cliente_nombre: "Juan Pérez García",
      cliente_documento: "12345678",
      producto: "Crédito Personal",
      monto_original: 15000,
      moneda: "USD",
      tasa_anual: 18.5,
      plazo_meses: 24,
      estado: "DESEMBOLSADO",
      fecha_desembolso: "2024-01-15T00:00:00Z",
      saldo_pendiente: 12500,
      cuotas_pagadas: 6,
      cuotas_totales: 24
    },
    {
      id: "cred_002", 
      codigo: "CR-2024-002",
      cliente_nombre: "María López Silva",
      cliente_documento: "87654321",
      producto: "Crédito Vehicular",
      monto_original: 25000,
      moneda: "USD",
      tasa_anual: 16.0,
      plazo_meses: 60,
      estado: "DESEMBOLSADO", 
      fecha_desembolso: "2024-03-01T00:00:00Z",
      saldo_pendiente: 23800,
      cuotas_pagadas: 3,
      cuotas_totales: 60
    },
    {
      id: "cred_003",
      codigo: "CR-2024-003", 
      cliente_nombre: "Carlos Rodríguez Vega",
      cliente_documento: "11223344",
      producto: "Crédito Empresarial",
      monto_original: 50000,
      moneda: "USD",
      tasa_anual: 22.0,
      plazo_meses: 36,
      estado: "DESEMBOLSADO",
      fecha_desembolso: "2024-02-10T00:00:00Z", 
      saldo_pendiente: 47200,
      cuotas_pagadas: 4,
      cuotas_totales: 36
    }
  ];
}

function generateMockPayments(): PaymentWithCredit[] {
  const credits = getMockCreditsInfo();
  const payments: PaymentWithCredit[] = [];

  credits.forEach(credito => {
    // Generar cuotas para cada crédito
    const cuotaMensual = credito.monto_original / credito.plazo_meses;
    
    for (let i = 1; i <= credito.plazo_meses; i++) {
      const fechaVencimiento = new Date(credito.fecha_desembolso);
      fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i);
      
      const isPagada = i <= credito.cuotas_pagadas;
      const isVencida = !isPagada && fechaVencimiento < new Date();
      
      let estado: PaymentStatus = "PENDIENTE";
      let fechaPago: string | undefined;
      let metodoPago: PaymentMethod | undefined;
      
      if (isPagada) {
        estado = "COMPLETADO";
        const fechaPagoDate = new Date(fechaVencimiento);
        fechaPagoDate.setDate(fechaPagoDate.getDate() - Math.floor(Math.random() * 5));
        fechaPago = fechaPagoDate.toISOString();
        metodoPago = ["TRANSFERENCIA", "TARJETA_CREDITO", "EFECTIVO"][Math.floor(Math.random() * 3)] as PaymentMethod;
      } else if (isVencida) {
        // Solo 30% de los vencidos están pagados, 70% siguen pendientes
        estado = Math.random() > 0.3 ? "PENDIENTE" : "COMPLETADO";
        if (estado === "COMPLETADO") {
          fechaPago = new Date().toISOString();
          metodoPago = "TRANSFERENCIA";
        }
      }
      // Si no está pagada ni vencida, queda PENDIENTE (cuotas futuras)

      const moraDias = isVencida && estado === "PENDIENTE" 
        ? Math.floor((Date.now() - fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      payments.push({
        id: `pago_${credito.id}_${i}`,
        credito_id: credito.id,
        numero_cuota: i,
        monto_programado: cuotaMensual,
        monto_pagado: isPagada || estado === "COMPLETADO" ? cuotaMensual : 0,
        fecha_vencimiento: fechaVencimiento.toISOString(),
        fecha_pago: fechaPago,
        estado,
        metodo_pago: metodoPago,
        referencia_transaccion: fechaPago ? `TXN${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}` : undefined,
        mora_dias: moraDias,
        interes_mora: moraDias > 0 ? moraDias * 0.5 : 0,
        created_at: credito.fecha_desembolso,
        credito
      });
    }
  });

  console.log("✅ Pagos generados:", {
    total: payments.length,
    pendientes: payments.filter(p => p.estado === "PENDIENTE").length,
    completados: payments.filter(p => p.estado === "COMPLETADO").length
  });

  return payments;
}

// Inicializar datos mock si no existen
function initializeMockData(): void {
  const existing = readMockPayments();
  console.log("🔵 Inicializando datos mock de pagos. Existentes:", existing.length);
  
  // FORZAR regeneración de datos para asegurar pagos PENDIENTES
  // TODO: Comentar esta línea después de la primera carga
  if (existing.length === 0 || existing.filter(p => p.estado === "PENDIENTE").length < 5) {
    console.log("⚠️ Regenerando datos mock (pocos pagos pendientes)");
    const mockPayments = generateMockPayments();
    writeMockPayments(mockPayments);
  }
}

export async function listPayments(params: ListPaymentsParams = {}): Promise<Page<PaymentWithCredit>> {
  console.log("🔵 Listando pagos con parámetros:", params);
  
  if (!isMockMode()) {
    try {
      const response = await http.get("/payments", { params });
      console.log("✅ Respuesta del backend:", response.data);
      return response.data;
    } catch (error) {
      console.log("⚠️ Error del backend, usando modo mock:", error);
      // Fallback a mock
    }
  }

  // Mock mode
  console.log("🔵 Usando modo MOCK");
  initializeMockData();
  let payments = readMockPayments();
  console.log("📊 Total de pagos en mock:", payments.length);

  // Aplicar filtros
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    payments = payments.filter(p => 
      p.credito.cliente_nombre.toLowerCase().includes(searchLower) ||
      p.credito.codigo.toLowerCase().includes(searchLower) ||
      p.referencia_transaccion?.toLowerCase().includes(searchLower)
    );
  }

  if (params.estado && params.estado !== "ALL") {
    payments = payments.filter(p => p.estado === params.estado);
  }

  if (params.credito_id) {
    payments = payments.filter(p => p.credito_id === params.credito_id);
  }

  if (params.metodo_pago && params.metodo_pago !== "ALL") {
    payments = payments.filter(p => p.metodo_pago === params.metodo_pago);
  }

  if (params.solo_vencidos) {
    payments = payments.filter(p => 
      p.estado === "PENDIENTE" && new Date(p.fecha_vencimiento) < new Date()
    );
  }

  if (params.solo_en_mora) {
    payments = payments.filter(p => (p.mora_dias ?? 0) > 0);
  }

  // Ordenar por fecha de vencimiento
  payments.sort((a, b) => new Date(b.fecha_vencimiento).getTime() - new Date(a.fecha_vencimiento).getTime());

  // Paginación
  const page = params.page ?? 1;
  const pageSize = params.page_size ?? 20;
  const offset = (page - 1) * pageSize;
  const results = payments.slice(offset, offset + pageSize);

  console.log("✅ Retornando", results.length, "pagos de", payments.length, "totales");

  return {
    results,
    count: payments.length,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(payments.length / pageSize)
  };
}

export async function getPaymentSummary(): Promise<PaymentSummary> {
  if (!isMockMode()) {
    try {
      const response = await http.get("/payments/summary");
      return response.data;
    } catch {
      // Fallback a mock
    }
  }

  // Mock mode
  initializeMockData();
  const payments = readMockPayments();
  const credits = getMockCreditsInfo();

  const pendientes = payments.filter(p => p.estado === "PENDIENTE");
  const completados = payments.filter(p => p.estado === "COMPLETADO");
  const vencidos = payments.filter(p => 
    p.estado === "PENDIENTE" && new Date(p.fecha_vencimiento) < new Date()
  );
  const enMora = payments.filter(p => (p.mora_dias ?? 0) > 0);

  const now = new Date();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
  const cobradoMes = completados
    .filter(p => p.fecha_pago && new Date(p.fecha_pago) >= inicioMes)
    .reduce((sum, p) => sum + p.monto_pagado, 0);

  return {
    total_pendientes: pendientes.length,
    total_completados: completados.length,
    total_vencidos: vencidos.length,
    total_en_mora: enMora.length,
    monto_pendiente: pendientes.reduce((sum, p) => sum + p.monto_programado, 0),
    monto_cobrado_mes: cobradoMes,
    creditos_activos: credits.filter(c => c.estado === "DESEMBOLSADO").length
  };
}

export async function processPayment(input: ProcessPaymentInput): Promise<PaymentWithCredit> {
  if (!isMockMode()) {
    try {
      const response = await http.post(`/payments/${input.pago_id}/process`, input);
      return response.data;
    } catch {
      // Fallback a mock
    }
  }

  // Mock mode
  const payments = readMockPayments();
  const paymentIndex = payments.findIndex(p => p.id === input.pago_id);
  
  if (paymentIndex === -1) {
    throw new Error("Pago no encontrado");
  }

  const payment = payments[paymentIndex];
  
  // Actualizar pago
  const updatedPayment: PaymentWithCredit = {
    ...payment,
    monto_pagado: input.monto_pagado,
    fecha_pago: nowISO(),
    estado: "COMPLETADO",
    metodo_pago: input.metodo_pago,
    referencia_transaccion: input.referencia_transaccion || `TXN${Date.now()}`,
    observaciones: input.observaciones,
    updated_at: nowISO()
  };

  payments[paymentIndex] = updatedPayment;
  writeMockPayments(payments);

  return updatedPayment;
}

export async function getCreditPayments(creditoId: string): Promise<PaymentWithCredit[]> {
  const result = await listPayments({ credito_id: creditoId, page_size: 1000 });
  return Array.isArray(result.results) ? result.results : [];
}

export async function getActiveCredits(): Promise<CreditInfo[]> {
  if (!isMockMode()) {
    try {
      const response = await http.get("/credits/active");
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("❌ Error al obtener créditos activos:", error);
      // Fallback a mock
    }
  }

  return getMockCreditsInfo().filter(c => c.estado === "DESEMBOLSADO");
}

/**
 * Obtiene un pago por su ID
 * GET /api/Pagos/pagos/{id}/
 */
export async function getPaymentById(pagoId: string | number): Promise<PaymentWithCredit> {
  console.log("🔵 Obteniendo pago por ID:", pagoId);

  if (!isMockMode()) {
    try {
      const response = await http.get(`/api/Pagos/pagos/${pagoId}/`);
      console.log("✅ Pago obtenido:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error al obtener pago:", error);
      throw new Error(
        (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || 
        "Error al obtener el pago"
      );
    }
  }

  // Mock mode
  initializeMockData();
  const payments = readMockPayments();
  const payment = payments.find(p => p.id === pagoId.toString());
  
  if (!payment) {
    throw new Error(`Pago con ID ${pagoId} no encontrado`);
  }

  return payment;
}

/**
 * Obtiene todos los pagos de un crédito específico
 * GET /api/Pagos/credito/{credito_id}/
 */
export async function getPaymentsByCredit(creditoId: string | number): Promise<PaymentWithCredit[]> {
  console.log("🔵 Obteniendo pagos del crédito:", creditoId);

  if (!isMockMode()) {
    try {
      const response = await http.get(`/api/Pagos/credito/${creditoId}/`);
      console.log("✅ Pagos del crédito obtenidos:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error al obtener pagos del crédito:", error);
      throw new Error(
        (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || 
        "Error al obtener pagos del crédito"
      );
    }
  }

  // Mock mode - usar la función existente
  return getCreditPayments(creditoId.toString());
}

/**
 * Lista todos los pagos con filtros opcionales
 * GET /api/Pagos/pagos/
 */
export async function getAllPayments(params: ListPaymentsParams = {}): Promise<Page<PaymentWithCredit>> {
  console.log("🔵 Listando todos los pagos con filtros:", params);

  if (!isMockMode()) {
    try {
      const response = await http.get("/api/Pagos/pagos/", { params });
      console.log("✅ Pagos listados:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error al listar pagos:", error);
      throw new Error(
        (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || 
        "Error al listar pagos"
      );
    }
  }

  // Mock mode - usar la función existente
  return listPayments(params);
}