export function normalizePrice(priceStr: string): number {
  // Remove currency symbol and spaces
  let cleaned = priceStr.replace(/R\$\s*/gi, '').trim();
  
  // Brazilian format: 1.234,56 -> 123456
  // American format: 1,234.56 -> 1234.56
  
  const hasCommaDecimal = cleaned.includes(',') && !cleaned.includes('.');
  const hasBoth = cleaned.includes('.') && cleaned.includes(',');
  
  if (hasBoth) {
    // Brazilian: last separator is decimal
    const lastDot = cleaned.lastIndexOf('.');
    const lastComma = cleaned.lastIndexOf(',');
    
    if (lastComma > lastDot) {
      // Brazilian: 1.234,56
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // American: 1,234.56
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (hasCommaDecimal) {
    // Pure Brazilian: 1234,56 -> 1234.56
    cleaned = cleaned.replace(',', '.');
  } else {
    // Plain number or American format
    cleaned = cleaned.replace(/,/g, '');
  }
  
  const value = parseFloat(cleaned);
  if (isNaN(value)) return 0;
  
  // Convert to centavos (integer)
  return Math.round(value * 100);
}

export function formatPrice(centavos: number): string {
  const value = centavos / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}