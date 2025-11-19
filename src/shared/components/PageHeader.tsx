// src/shared/components/PageHeader.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./PageHeader.css";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backPath?: string;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  backPath,
  actions,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="page-header">
      <div className="page-header__nav">
        {showBackButton && (
          <button 
            onClick={handleBack} 
            className="page-header__back-btn"
            aria-label="Volver atrás"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path 
                d="M12.5 15L7.5 10L12.5 5" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            <span>Volver</span>
          </button>
        )}
      </div>
      
      <div className="page-header__content">
        <div className="page-header__text">
          <h1 className="page-header__title">{title}</h1>
          {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
        </div>
        
        {actions && (
          <div className="page-header__actions">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
