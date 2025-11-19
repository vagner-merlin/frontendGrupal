/**
 * Servicio para Stripe Checkout (Opción A - Redirección)
 * Maneja la creación de sesiones de checkout y verificación de pagos
 */

import { http } from "../../shared/api/client";

const BASE_URL = "/api/Pagos/";

export interface CreateCheckoutSessionInput {
  credito_id: string | number;
  monto: number;
  moneda?: string;
  descripcion?: string;
  success_url?: string;
  cancel_url?: string;
}

export interface CheckoutSessionResponse {
  checkout_url: string;
  session_id: string;
  pago_id: string | number;
}

export interface VerifyCheckoutSessionInput {
  session_id: string;
}

export interface VerifyCheckoutSessionResponse {
  message: string;
  pago_id: number;
  estado: string;
  monto: string;
  moneda: string;
}

/**
 * Crea una sesión de Stripe Checkout
 * El usuario será redirigido a la página de pago de Stripe
 */
export async function createCheckoutSession(
  data: CreateCheckoutSessionInput
): Promise<CheckoutSessionResponse> {
  console.log("🔵 Creando Checkout Session de Stripe:", data);

  try {
    const response = await http.post<CheckoutSessionResponse>(
      `${BASE_URL}/create-checkout-session/`,
      {
        credito_id: data.credito_id,
        monto: data.monto,
        moneda: data.moneda || "usd",
        descripcion: data.descripcion || `Pago de crédito #${data.credito_id}`,
        success_url: data.success_url || `${window.location.origin}/app/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: data.cancel_url || `${window.location.origin}/app/pago-cancelado`
      }
    );

    console.log("✅ Checkout Session creada:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error al crear Checkout Session:", error);
    throw new Error(
      (error as { response?: { data?: { error?: string } } }).response?.data?.error || 
      "Error al crear sesión de pago"
    );
  }
}

/**
 * Verifica el estado de una sesión de Stripe Checkout
 * Se llama después de que el usuario regresa de Stripe
 */
export async function verifyCheckoutSession(
  data: VerifyCheckoutSessionInput
): Promise<VerifyCheckoutSessionResponse> {
  console.log("🔵 Verificando Checkout Session:", data.session_id);

  try {
    const response = await http.post<VerifyCheckoutSessionResponse>(
      `${BASE_URL}/verify-checkout-session/`,
      data
    );

    console.log("✅ Checkout Session verificada:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error al verificar Checkout Session:", error);
    throw new Error(
      (error as { response?: { data?: { error?: string } } }).response?.data?.error || 
      "Error al verificar el pago"
    );
  }
}
