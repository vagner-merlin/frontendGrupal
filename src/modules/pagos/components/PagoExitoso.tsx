/**
 * Página de Pago Exitoso
 * Se muestra cuando el usuario regresa de Stripe después de un pago exitoso
 */

import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { verifyCheckoutSession } from "../checkout-service";
import type { VerifyCheckoutSessionResponse } from "../checkout-service";

export function PagoExitoso() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [verificando, setVerificando] = useState(true);
  const [pago, setPago] = useState<VerifyCheckoutSessionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ REGRESO DE STRIPE CHECKOUT");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 Session ID:", sessionId);
    
    if (!sessionId) {
      console.error("❌ No se encontró session_id en la URL");
      setError('No se encontró ID de sesión');
      setVerificando(false);
      return;
    }

    verificarPago(sessionId);
  }, [searchParams]);

  const verificarPago = async (sessionId: string) => {
    try {
      console.log("📤 Verificando pago en backend...");
      console.log("   → Endpoint: POST /api/Pagos/verify-checkout-session/");
      
      const resultado = await verifyCheckoutSession({ session_id: sessionId });
      
      console.log("✅✅✅ PAGO VERIFICADO EXITOSAMENTE ✅✅✅");
      console.log("   → Pago ID:", resultado.pago_id);
      console.log("   → Estado:", resultado.estado);
      console.log("   → Monto:", resultado.monto, resultado.moneda);
      console.log("   → Mensaje:", resultado.message);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      
      setPago(resultado);
    } catch (err) {
      console.error("❌ Error al verificar el pago:", err);
      setError(err instanceof Error ? err.message : 'Error al verificar el pago');
    } finally {
      setVerificando(false);
    }
  };

  // Estilo común para el container
  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
  };

  const cardStyle: React.CSSProperties = {
    background: "white",
    borderRadius: "16px",
    padding: "40px",
    maxWidth: "500px",
    width: "100%",
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)"
  };

  // Estado: Verificando
  if (verificando) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{
            border: "4px solid rgba(102, 126, 234, 0.3)",
            borderTop: "4px solid #667eea",
            borderRadius: "50%",
            width: "60px",
            height: "60px",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px"
          }}></div>
          <h2 style={{ color: "#667eea", marginBottom: "10px" }}>
            Verificando tu pago...
          </h2>
          <p style={{ color: "#666" }}>
            Por favor espera un momento
          </p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Estado: Error
  if (error) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: "80px", marginBottom: "20px" }}>❌</div>
          <h2 style={{ color: "#e74c3c", marginBottom: "10px" }}>
            Error al verificar el pago
          </h2>
          <p style={{ color: "#666", marginBottom: "20px" }}>
            {error}
          </p>
          <button 
            onClick={() => navigate('/app/pagos')}
            style={{
              background: "#e74c3c",
              color: "white",
              padding: "14px 40px",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            Volver a Pagos
          </button>
        </div>
      </div>
    );
  }

  // Estado: Éxito
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ 
          fontSize: "80px", 
          marginBottom: "20px",
          animation: "bounce 0.6s ease"
        }}>
          ✅
        </div>
        
        <h1 style={{ 
          color: "#2ecc71", 
          fontSize: "32px", 
          marginBottom: "10px" 
        }}>
          ¡Pago Exitoso!
        </h1>
        
        <p style={{ 
          color: "#666", 
          fontSize: "16px", 
          marginBottom: "30px" 
        }}>
          {pago?.message || "Tu pago ha sido procesado correctamente"}
        </p>
        
        <div style={{
          background: "#f8f9fa",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "30px"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "10px 0",
            borderBottom: "1px solid #e0e0e0"
          }}>
            <span style={{ fontWeight: "600", color: "#333" }}>ID de Pago:</span>
            <span style={{ color: "#666" }}>#{pago?.pago_id}</span>
          </div>
          
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "10px 0",
            borderBottom: "1px solid #e0e0e0"
          }}>
            <span style={{ fontWeight: "600", color: "#333" }}>Monto:</span>
            <span style={{ color: "#666" }}>${pago?.monto} {pago?.moneda}</span>
          </div>
          
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "10px 0"
          }}>
            <span style={{ fontWeight: "600", color: "#333" }}>Estado:</span>
            <span style={{
              background: "#2ecc71",
              color: "white",
              padding: "4px 12px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "600"
            }}>
              {pago?.estado}
            </span>
          </div>
        </div>

        <button 
          onClick={() => navigate('/app/pagos')}
          style={{
            background: "#667eea",
            color: "white",
            padding: "14px 40px",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.3s ease",
            width: "100%"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#5568d3";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#667eea";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Volver a Pagos
        </button>

        <style>{`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }
        `}</style>
      </div>
    </div>
  );
}
