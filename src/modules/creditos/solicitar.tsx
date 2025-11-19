import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/theme.css";

const SolicitarCreditoForm: React.FC = () => {
  const navigate = useNavigate();
  React.useEffect(() => {
    navigate("/app/creditos/crear");
  }, [navigate]);
  return <div style={{ padding: "40px", textAlign: "center" }}><h2>Redirigiendo...</h2></div>;
};

export default SolicitarCreditoForm;
