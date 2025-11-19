/**
 * Formulario de pago con Stripe
 * Componente para procesar pagos de créditos usando Stripe Elements
 */

import { useState } from "react";
import {
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import type { Payment } from "../types";
import { createPaymentIntent, confirmStripePayment } from "../stripe-service";

interface StripePaymentFormProps {
  pago: Payment;
  onSuccess: () => void;
  onCancel: () => void;
}

export function StripePaymentForm({
  pago,
  onSuccess,
  onCancel,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardholderName, setCardholderName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError("Stripe no está cargado. Por favor recarga la página.");
      return;
    }

    if (!cardholderName.trim()) {
      setError("Por favor ingresa el nombre del titular de la tarjeta.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Verificar autenticación
      const token = localStorage.getItem('auth.token') || localStorage.getItem('token');
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🔐 INICIO DE PAGO CON STRIPE");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("✅ Token de autenticación activo:", token ? `${token.substring(0, 20)}...` : "❌ NO ENCONTRADO");
      console.log("📋 Pago ID:", pago.id);
      console.log("💰 Monto:", pago.monto_programado, "USD");
      console.log("");

      // 1. Crear Payment Intent en el backend (USANDO TU TOKEN)
      console.log("📤 PASO 1: Creando Payment Intent en backend...");
      console.log("   → Endpoint: POST /api/Pagos/create-payment-intent/");
      console.log("   → Headers: Authorization: Bearer " + (token ? token.substring(0, 20) + "..." : "NO TOKEN"));
      
      const paymentIntentData = await createPaymentIntent({
        pago_id: pago.id,
        monto: pago.monto_programado,
        moneda: "usd",
        descripcion: `Pago de crédito #${pago.credito_id}`,
      });
      
      console.log("✅ Payment Intent creado exitosamente");
      console.log("   → Client Secret:", paymentIntentData.client_secret.substring(0, 30) + "...");
      console.log("   → Payment Intent ID:", paymentIntentData.payment_intent_id);
      console.log("");

      // 2. Confirmar el pago con Stripe
      console.log("💳 PASO 2: Confirmando pago con Stripe...");
      console.log("   → Usando tarjeta ingresada por el usuario");
      console.log("   → Titular:", cardholderName);
      
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        throw new Error("No se pudo obtener el elemento de tarjeta");
      }

      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(paymentIntentData.client_secret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: cardholderName,
            },
          },
        });

      if (stripeError) {
        console.error("❌ Error de Stripe:", stripeError.message);
        throw new Error(stripeError.message || "Error al procesar el pago");
      }

      console.log("✅ Stripe procesó el pago exitosamente");
      console.log("   → Status:", paymentIntent?.status);
      console.log("   → Payment Intent ID:", paymentIntent?.id);
      console.log("");

      if (paymentIntent?.status === "succeeded") {
        // 3. Confirmar en el backend (USANDO TU TOKEN NUEVAMENTE)
        console.log("📤 PASO 3: Confirmando pago en backend...");
        console.log("   → Endpoint: POST /api/Pagos/confirm-stripe-payment/");
        console.log("   → Headers: Authorization: Bearer " + (token ? token.substring(0, 20) + "..." : "NO TOKEN"));
        console.log("   → Payment Intent ID:", paymentIntent.id);
        
        await confirmStripePayment({
          payment_intent_id: paymentIntent.id,
          pago_id: pago.id,
        });

        console.log("✅✅✅ PAGO COMPLETADO EXITOSAMENTE ✅✅✅");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("");
        alert("✅ Pago procesado exitosamente");
        onSuccess();
      } else {
        throw new Error(
          `Estado de pago inesperado: ${paymentIntent?.status}`
        );
      }
    } catch (err) {
      console.error("❌ Error al procesar pago:", err);
      setError(
        err instanceof Error ? err.message : "Error al procesar el pago"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        padding: "24px",
        backgroundColor: "#fff",
        maxWidth: "500px",
        margin: "0 auto",
      }}
    >
      <h3 style={{ marginBottom: "20px", color: "#333" }}>
        💳 Pago con Tarjeta (Stripe)
      </h3>

      <div style={{ marginBottom: "16px" }}>
        <p style={{ margin: "4px 0", color: "#666" }}>
          <strong>Crédito:</strong> #{pago.credito_id}
        </p>
        <p style={{ margin: "4px 0", color: "#666" }}>
          <strong>Monto a pagar:</strong> $
          {pago.monto_programado}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Nombre del titular */}
        <div style={{ marginBottom: "16px" }}>
          <label
            htmlFor="cardholder-name"
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "500",
              color: "#333",
            }}
          >
            Nombre del titular
          </label>
          <input
            id="cardholder-name"
            type="text"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            placeholder="Juan Pérez"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          />
        </div>

        {/* Card Element de Stripe */}
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "500",
              color: "#333",
            }}
          >
            Información de la tarjeta
          </label>
          <div
            style={{
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              backgroundColor: "#fff",
            }}
          >
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#333",
                    "::placeholder": {
                      color: "#aaa",
                    },
                  },
                  invalid: {
                    color: "#e74c3c",
                  },
                },
                hidePostalCode: false,
              }}
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              padding: "12px",
              backgroundColor: "#fee",
              border: "1px solid #fcc",
              borderRadius: "4px",
              marginBottom: "16px",
              color: "#c33",
            }}
          >
            ❌ {error}
          </div>
        )}

        {/* Botones */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            type="submit"
            disabled={!stripe || loading}
            style={{
              flex: 1,
              padding: "12px 24px",
              backgroundColor: loading ? "#ccc" : "#635BFF",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = "#5147E5";
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = "#635BFF";
              }
            }}
          >
            {loading ? "Procesando..." : `Pagar $${pago.monto_programado}`}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: "12px 24px",
              backgroundColor: "#fff",
              color: "#666",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Cancelar
          </button>
        </div>
      </form>

      {/* Tarjetas de prueba */}
      <div
        style={{
          marginTop: "24px",
          padding: "12px",
          backgroundColor: "#f8f9fa",
          borderRadius: "4px",
          fontSize: "12px",
          color: "#666",
        }}
      >
        <strong>💡 Tarjetas de prueba:</strong>
        <ul style={{ margin: "8px 0 0 20px", paddingLeft: "0" }}>
          <li>Éxito: 4242 4242 4242 4242</li>
          <li>Requiere autenticación: 4000 0025 0000 3155</li>
          <li>Rechazada: 4000 0000 0000 9995</li>
        </ul>
        <p style={{ margin: "8px 0 0 0" }}>
          Usa cualquier fecha futura y cualquier CVC de 3 dígitos.
        </p>
      </div>
    </div>
  );
}
