import { FECHAS } from './data.js';

export const e3 = v => v != null ? v.toFixed(3).replace('.', ',') : '—';
export const e1 = v => v != null ? v.toFixed(1).replace('.', ',') : '—';
export const s1 = v => v != null ? (v >= 0 ? '+' : '') + v.toFixed(1).replace('.', ',') + '%' : '—';
export const s3 = v => v != null ? (v >= 0 ? '+' : '') + v.toFixed(3).replace('.', ',') + '€' : '—';

export const REF_DATE = '21/03';
export const refIdx   = FECHAS.indexOf(REF_DATE);

export function stats(vals) {
  const first = vals.find(v => v != null);
  const last  = [...vals].reverse().find(v => v != null);
  if (!first || !last) return null;
  const abs = +(last - first).toFixed(3);
  const pct = +(abs / first * 100).toFixed(1);
  const atRef        = (refIdx >= 0 && vals[refIdx] != null) ? vals[refIdx] : null;
  const beforeRef    = atRef != null ? +(atRef - first).toFixed(3) : null;
  const beforeRefPct = (first && beforeRef != null) ? +(beforeRef / first * 100).toFixed(1) : null;
  const sinceRef     = atRef != null ? +(last - atRef).toFixed(3) : null;
  const sinceRefPct  = (atRef && sinceRef != null) ? +(sinceRef / atRef * 100).toFixed(1) : null;
  return { first, last, abs, pct, vals, atRef, beforeRef, beforeRefPct, sinceRef, sinceRefPct };
}
