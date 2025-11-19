/**
 * Configuración de Stripe
 * Clave publicable para inicializar Stripe en el frontend
 */

import { loadStripe } from "@stripe/stripe-js";
import type { Stripe } from "@stripe/stripe-js";

/**
 * Clave publicable de Stripe
 * IMPORTANTE: Esta es una clave de PRUEBA (test mode)
 * Para producción, reemplaza con tu clave publicable real
 */
const STRIPE_PUBLISHABLE_KEY =
  "pk_test_51QdJgEP6HBdXMDuGu6Sc7iKl8Q3JH42bxJPztk0BqKu2nfOgwzJ6CaZWL00nWlOB3M6wuC3XLR3uYnc3eZwOvVdA00eHPYXRfI";

/**
 * Instancia de Stripe inicializada
 * Se carga de forma asíncrona al importar este módulo
 */
let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Obtiene la instancia de Stripe
 * Usa un patrón singleton para evitar múltiples cargas
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    console.log("🔵 Inicializando Stripe...");
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
}

/**
 * Configuración de Stripe Elements
 * Opciones de apariencia y comportamiento
 */
export const stripeElementsOptions = {
  fonts: [
    {
      cssSrc: "https://fonts.googleapis.com/css?family=Inter:400,500,600",
    },
  ],
  locale: "es" as const,
};

/**
 * Información sobre el entorno de Stripe
 */
export const stripeInfo = {
  mode: STRIPE_PUBLISHABLE_KEY.startsWith("pk_test_") ? "TEST" : "LIVE",
  publishableKey: STRIPE_PUBLISHABLE_KEY,
};

console.log("🔵 Stripe configurado en modo:", stripeInfo.mode);
