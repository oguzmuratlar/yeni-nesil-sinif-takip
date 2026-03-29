import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Para formatı: 300000 -> 300.000,00 (Türkçe format)
export function formatMoney(value, showDecimals = true) {
  if (value === null || value === undefined || isNaN(value)) return '0';
  
  const num = Number(value);
  
  if (showDecimals) {
    return num.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  
  return num.toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}
