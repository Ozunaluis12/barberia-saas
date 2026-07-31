/**
 * Formatea un monto en pesos colombianos: sin decimales (el centavo no se
 * usa en la práctica), con puntos de miles — ej. formatCOP(1234567) => "$1.234.567".
 */
export function formatCOP(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? "-" : "";
  return `${sign}$${Math.abs(rounded).toLocaleString("es-CO")}`;
}
