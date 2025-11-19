import React, { useEffect } from "react";

const ADMIN_URL = "http://18.116.21.77:8000/admin/auth/";

const PanelAdmin: React.FC = () => {
  useEffect(() => {
    // redirige la pestaña actual al Django Admin (no suele bloquearse)
    window.location.replace(ADMIN_URL);
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h2>Panel administrativo</h2>
      <p>Redirigiendo al panel administrativo...</p>
      <p>
        Si no se redirige automáticamente, pulsa:
        {" "}
        <a href={ADMIN_URL} target="_blank" rel="noopener noreferrer">Abrir Panel Administrativo</a>
      </p>
    </div>
  );
};

export default PanelAdmin;