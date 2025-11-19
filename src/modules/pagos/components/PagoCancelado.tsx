/**
 * Página de Pago Cancelado
 * Se muestra cuando el usuario cancela el pago en Stripe
 */

import { useNavigate } from "react-router-dom";

export function PagoCancelado() {
  const navigate = useNavigate();

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("⚠️ PAGO CANCELADO POR EL USUARIO");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("El usuario canceló el pago en Stripe Checkout");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
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

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ fontSize: "80px", marginBottom: "20px" }}>⚠️</div>
        
        <h1 style={{ 
          color: "#f5576c", 
          fontSize: "32px", 
          marginBottom: "10px" 
        }}>
          Pago Cancelado
        </h1>
        
        <p style={{ 
          color: "#666", 
          marginBottom: "10px" 
        }}>
          Has cancelado el proceso de pago.
        </p>
        
        <p style={{ 
          fontSize: "14px", 
          color: "#999", 
          marginBottom: "30px" 
        }}>
          No te preocupes, puedes intentarlo de nuevo cuando quieras.
        </p>
        
        <div style={{
          display: "flex",
          gap: "15px",
          justifyContent: "center",
          flexWrap: "wrap"
        }}>
          <button 
            onClick={() => navigate(-1)}
            style={{
              background: "#667eea",
              color: "white",
              padding: "14px 30px",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#5568d3";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#667eea";
            }}
          >
            Reintentar Pago
          </button>
          
          <button 
            onClick={() => navigate('/app/pagos')}
            style={{
              background: "transparent",
              color: "#667eea",
              padding: "14px 30px",
              border: "2px solid #667eea",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#667eea";
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#667eea";
            }}
          >
            Volver a Pagos
          </button>
        </div>
      </div>
    </div>
  );
}
