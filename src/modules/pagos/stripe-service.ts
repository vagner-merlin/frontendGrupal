/**
 * Servicio para integración con Stripe
 * Maneja la creación de Payment Intents y confirmación de pagos
 */

import { http } from "../../shared/api/client";
import type {
  CreateStripePaymentInput,
  StripePaymentIntentResponse,
  ConfirmStripePaymentInput,
} from "./types";

const BASE_URL = "/api/Pagos/";

/**
 * Crea un Payment Intent en Stripe
 * @param data - Datos del pago (pago_id, monto, moneda)
 * @returns Payment Intent con client_secret para el frontend
 */
export async function createPaymentIntent(
  data: CreateStripePaymentInput
): Promise<StripePaymentIntentResponse> {
  console.log("🔵 Creando Payment Intent de Stripe:", data);

  try {
    const response = await http.post<StripePaymentIntentResponse>(
      `${BASE_URL}/create-payment-intent/`,
      data
    );

    console.log("✅ Payment Intent creado:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error al crear Payment Intent:", error);
    throw new Error(
      (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || "Error al crear Payment Intent de Stripe"
    );
  }
}

/**
 * Confirma un pago exitoso de Stripe en el backend
 * @param data - payment_intent_id y pago_id
 * @returns Confirmación del pago
 */
export async function confirmStripePayment(
  data: ConfirmStripePaymentInput
): Promise<{ message: string; pago_id: number }> {
  console.log("🔵 Confirmando pago de Stripe:", data);

  try {
    const response = await http.post<{ message: string; pago_id: number }>(
      `${BASE_URL}/confirm-stripe-payment/`,
      data
    );

    console.log("✅ Pago confirmado:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error al confirmar pago:", error);
    throw new Error(
      (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || "Error al confirmar pago de Stripe"
    );
  }
}

/**
 * Cancela un Payment Intent de Stripe
 * @param paymentIntentId - ID del Payment Intent a cancelar
 */
export async function cancelPaymentIntent(
  paymentIntentId: string
): Promise<{ message: string }> {
  console.log("🔵 Cancelando Payment Intent:", paymentIntentId);

  try {
    const response = await http.post<{ message: string }>(
      `${BASE_URL}/cancel-payment-intent/`,
      { payment_intent_id: paymentIntentId }
    );

    console.log("✅ Payment Intent cancelado:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error al cancelar Payment Intent:", error);
    throw new Error(
      (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || "Error al cancelar Payment Intent"
    );
  }
}
