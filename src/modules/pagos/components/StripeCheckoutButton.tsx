/**
 * Botón de Pago con Stripe Checkout
 * Redirige al usuario a la página segura de Stripe
 */

import { useState } from "react";
import { createCheckoutSession } from "../checkout-service";

interface StripeCheckoutButtonProps {
  creditoId: string | number;
  monto: number;
  descripcion?: string;
  disabled?: boolean;
}

export function StripeCheckoutButton({
  creditoId,
  monto,
  descripcion,
  disabled = false
}: StripeCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePagar = async () => {
    setLoading(true);
    setError(null);

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("💳 INICIO DE PAGO CON STRIPE CHECKOUT");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 Crédito ID:", creditoId);
    console.log("💰 Monto:", monto, "USD");

    try {
      console.log("📤 PASO 1: Creando Checkout Session...");
      console.log("   → Endpoint: POST /api/Pagos/create-checkout-session/");
      
      const { checkout_url, session_id } = await createCheckoutSession({
        credito_id: creditoId,
        monto: monto,
        moneda: "usd",
        descripcion: descripcion || `Pago de crédito #${creditoId}`
      });

      console.log("✅ Checkout Session creada");
      console.log("   → Session ID:", session_id);
      console.log("   → URL:", checkout_url.substring(0, 50) + "...");
      console.log("");
      console.log("🌐 PASO 2: Redirigiendo a Stripe...");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      // Redirigir a Stripe
      window.location.href = checkout_url;

    } catch (err) {
      console.error("❌ Error:", err);
      const errorMsg = err instanceof Error ? err.message : "Error al crear sesión de pago";
      
      // Mensaje más claro para error 401
      if (errorMsg.includes("401") || errorMsg.includes("autorizado")) {
        setError("❌ Error de autenticación. Por favor, cierra sesión y vuelve a iniciar sesión.");
      } else {
        setError(errorMsg);
      }
      
      setLoading(false);
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <button 
        onClick={handlePagar}
        disabled={loading || disabled}
        style={{
          background: loading ? "#ccc" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          padding: "16px 32px",
          fontSize: "18px",
          fontWeight: "600",
          border: "none",
          borderRadius: "8px",
          cursor: loading || disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          width: "100%",
          opacity: loading || disabled ? 0.6 : 1,
          transition: "all 0.3s ease"
        }}
      >
        {loading ? (
          <>
            <span style={{
              border: "2px solid rgba(255, 255, 255, 0.3)",
              borderTop: "2px solid white",
              borderRadius: "50%",
              width: "16px",
              height: "16px",
              display: "inline-block",
              animation: "spin 1s linear infinite"
            }}></span>
            Redirigiendo a Stripe...
          </>
        ) : (
          <>
            💳 Pagar ${monto.toFixed(2)} con Stripe
          </>
        )}
      </button>
      
      {error && (
        <div style={{
          marginTop: "15px",
          padding: "15px",
          background: "#fee",
          border: "2px solid #e53e3e",
          borderRadius: "8px",
          color: "#742a2a"
        }}>
          <strong>Error:</strong> {error}
          {error.includes("autenticación") && (
            <div style={{ marginTop: "10px", fontSize: "13px" }}>
              <strong>Solución:</strong>
              <ol style={{ margin: "5px 0 0 20px", padding: 0 }}>
                <li>Cierra sesión completamente</li>
                <li>Vuelve a iniciar sesión</li>
                <li>Intenta nuevamente</li>
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
