export function bookingRef(id: number): string {
  return 'BK-' + String(id).padStart(6, '0');
}

export interface RefundEstimate {
  feeRate: number;        // 0.10, 0.50, or 1 (non-refundable)
  fee: number;
  refund: number;
  allowed: boolean;
  hoursUntilShow: number;
  reason: string;
}

export function estimateRefund(showTimeIso: string, totalAmount: number): RefundEstimate {
  const showTime = new Date(showTimeIso).getTime();
  const now = Date.now();
  const ms = showTime - now;
  const hours = ms / (1000 * 60 * 60);

  if (ms <= 0) {
    return { feeRate: 1, fee: totalAmount, refund: 0, allowed: false, hoursUntilShow: hours,
             reason: 'Show has already started.' };
  }
  if (hours < 2) {
    return { feeRate: 1, fee: totalAmount, refund: 0, allowed: false, hoursUntilShow: hours,
             reason: 'Less than 2 hours before showtime — cancellation is closed.' };
  }
  const feeRate = hours >= 24 ? 0.10 : 0.50;
  const fee = round2(totalAmount * feeRate);
  const refund = round2(totalAmount - fee);
  return { feeRate, fee, refund, allowed: true, hoursUntilShow: hours,
           reason: hours >= 24 ? '10% cancellation fee applies.' : '50% cancellation fee applies (within 24 hours).' };
}

export function timeUntil(showTimeIso: string): string {
  const showTime = new Date(showTimeIso).getTime();
  const ms = showTime - Date.now();
  if (ms <= 0) return 'Started';
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `In ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `In ${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `In ${days}d ${hours % 24}h`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
