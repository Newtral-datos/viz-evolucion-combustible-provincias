<script>
  import * as d3 from 'd3';
  import { slide } from 'svelte/transition';
  import { FECHAS, PROVINCIAS } from './lib/data.js';
  import { e3, s1, stats, REF_DATE, refIdx } from './lib/utils.js';

  const NOMBRES = {
    'ARABA/ÁLAVA':            'Álava',
    'BALEARS (ILLES)':        'Illes Balears',
    'CORUÑA (A)':             'A Coruña',
    'RIOJA (LA)':             'La Rioja',
    'PALMAS (LAS)':           'Las Palmas',
    'SANTA CRUZ DE TENERIFE': 'S.C. Tenerife',
    'CASTELLÓN / CASTELLÓ':   'Castellón',
    'VALENCIA / VALÈNCIA':    'Valencia',
  };
  const fmt = k =>
    NOMBRES[k] ?? k.toLowerCase().replace(/(^|[\s/\-])\S/g, c => c.toUpperCase());

  // ─── state ──────────────────────────────────────────────────────────────────
  let sortBy  = 'g_pct';
  let expanded = null;

  // ─── filas ───────────────────────────────────────────────────────────────────
  $: allRows = Object.entries(PROVINCIAS).map(([key, pd]) => {
    const g = stats(pd.gasoleo);
    const p = stats(pd.gasolina);
    if (!g || !p) return null;
    return { key, name: fmt(key), g, p };
  }).filter(Boolean);

  $: rows = [...allRows].sort((a, b) => {
    if (sortBy === 'name')  return a.name.localeCompare(b.name, 'es');
    if (sortBy === 'p_pct') return b.p.pct - a.p.pct;
    if (sortBy === 'price') return b.g.last - a.g.last;
    return b.g.pct - a.g.pct;
  });

  // ─── detail chart (desplegable) ───────────────────────────────────────────────
  const DCW = 860, DCH = 145;
  const DCM = { top: 10, right: 16, bottom: 28, left: 52 };
  const dW = DCW - DCM.left - DCM.right;
  const dH = DCH - DCM.top  - DCM.bottom;

  function buildDetail(key) {
    const gv = PROVINCIAS[key].gasoleo;
    const pv = PROVINCIAS[key].gasolina;
    const allV = [...gv, ...pv].filter(v => v != null);
    const mn = d3.min(allV) * .997;
    const mx = d3.max(allV) * 1.003;
    const xSc = d3.scalePoint().domain(FECHAS).range([0, dW]).padding(.3);
    const ySc = d3.scaleLinear().domain([mn, mx]).range([dH, 0]);
    const lf  = d3.line()
      .x((_, i) => xSc(FECHAS[i])).y(v => ySc(v))
      .defined(v => v != null).curve(d3.curveCatmullRom);
    const gPath = lf(gv) ?? '';
    const pPath = lf(pv) ?? '';
    const yTicks  = ySc.ticks(3);
    const xLabels = FECHAS.filter((_, i) => i % 7 === 0 || i === FECHAS.length - 1);
    const refX    = refIdx >= 0 ? xSc(FECHAS[refIdx]) : null;
    const di = pv.map((v,i) => v!=null?i:null).filter(i=>i!==null);
    const pArea = di.length >= 2
      ? `${pPath} L${xSc(FECHAS[di[di.length-1]])},${dH} L${xSc(FECHAS[di[0]])},${dH} Z`
      : '';
    const gAtRef = (refIdx >= 0 && gv[refIdx] != null) ? gv[refIdx] : null;
    const pAtRef = (refIdx >= 0 && pv[refIdx] != null) ? pv[refIdx] : null;
    return { gv, pv, gPath, pPath, pArea, yTicks, xLabels, refX, xSc, ySc, gAtRef, pAtRef };
  }
</script>

<div class="list-wrap">
  <div class="list-head">
    <div class="lh-left">
      <span class="list-period">{FECHAS[0]}–{FECHAS[FECHAS.length-1]}</span>
    </div>
    <div class="sort-tabs">
      <button class:on={sortBy==='g_pct'} on:click={() => sortBy='g_pct'}>
        <span class="dot-g-sm"></span>Gasóleo ↓</button>
      <button class:on={sortBy==='p_pct'} on:click={() => sortBy='p_pct'}>
        <span class="dot-p-sm"></span>Gasolina ↓</button>
      <button class:on={sortBy==='price'} on:click={() => sortBy='price'}>Precio</button>
      <button class:on={sortBy==='name'}  on:click={() => sortBy='name'}>A–Z</button>
    </div>
  </div>

  <div class="list-cols">
    <span>Provincia</span>
    <span class="r col-g">Gasóleo</span>
    <span class="r col-g col-pct-extra">Total</span>
    <span class="r col-g col-since col-pct-extra">{REF_DATE}→</span>
    <span class="r col-p">Gasolina</span>
    <span class="r col-p col-pct-extra">Total</span>
    <span class="r col-p col-since col-pct-extra">{REF_DATE}→</span>
    <span></span>
  </div>

  <div class="list">
    {#each rows as r (r.key)}
      {@const isExp = expanded === r.key}

      <div class="row" class:exp={isExp}
        on:click={() => expanded = isExp ? null : r.key}>
        <span class="r-name">{r.name}</span>
        <span class="r-g">{e3(r.g.last)}€</span>
        <span class="r-pct r-pct-all" class:pct-pos={r.g.pct > 0} class:pct-neg={r.g.pct <= 0}>{s1(r.g.pct)}</span>
        <span class="r-pct r-since r-pct-all" class:pct-pos={r.g.sinceRefPct > 0} class:pct-neg={r.g.sinceRefPct <= 0}>{s1(r.g.sinceRefPct)}</span>
        <span class="r-p">{e3(r.p.last)}€</span>
        <span class="r-pct r-pct-all" class:pct-pos={r.p.pct > 0} class:pct-neg={r.p.pct <= 0}>{s1(r.p.pct)}</span>
        <span class="r-pct r-since r-pct-all" class:pct-pos={r.p.sinceRefPct > 0} class:pct-neg={r.p.sinceRefPct <= 0}>{s1(r.p.sinceRefPct)}</span>
        <span class="r-chev" class:open={isExp}>›</span>
      </div>

      {#if isExp}
        {@const det = buildDetail(r.key)}
        {@const gs  = stats(PROVINCIAS[r.key].gasoleo)}
        {@const ps  = stats(PROVINCIAS[r.key].gasolina)}
        {@const gid = 'dpg' + r.key.replace(/[^a-zA-Z0-9]/g, '')}
        <div class="detail-panel" transition:slide={{duration: 220}}>
          <div class="dp-stats">
            <div class="dp-row">
              <span class="dot-g"></span>
              <span class="dp-fname">Gasóleo A</span>
              <span class="dp-price-g">{e3(gs?.last)}€</span>
              <span class="dp-badge-g">{s1(gs?.pct)}</span>
              {#if gs?.beforeRef != null}
                <span class="dp-sep">·</span>
                <span class="dp-period">Hasta 21/03 <strong>{s1(gs.beforeRefPct)}</strong></span>
                <span class="dp-period hi-g">Desde 21/03 <strong>{s1(gs.sinceRefPct)}</strong></span>
              {/if}
            </div>
            <div class="dp-row">
              <span class="dot-p"></span>
              <span class="dp-fname">Gasolina 95</span>
              <span class="dp-price-p">{e3(ps?.last)}€</span>
              <span class="dp-badge-p">{s1(ps?.pct)}</span>
              {#if ps?.beforeRef != null}
                <span class="dp-sep">·</span>
                <span class="dp-period">Hasta 21/03 <strong>{s1(ps.beforeRefPct)}</strong></span>
                <span class="dp-period hi-p">Desde 21/03 <strong>{s1(ps.sinceRefPct)}</strong></span>
              {/if}
            </div>
          </div>

          <svg class="dp-svg" viewBox="0 0 {DCW} {DCH}" preserveAspectRatio="none">
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stop-color="#01f3b3" stop-opacity=".15"/>
                <stop offset="100%" stop-color="#01f3b3" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <g transform="translate({DCM.left},{DCM.top})">
              {#if det.refX != null}
                <rect x={det.refX} y=0 width={dW - det.refX} height={dH}
                  fill="#f0fdf9" opacity=".65"/>
              {/if}
              {#each det.yTicks as t}
                <line x1=0 x2={dW} y1={det.ySc(t)} y2={det.ySc(t)} stroke="#f1f5f9"/>
                <text x=-7 y={det.ySc(t)} dy=".32em" text-anchor="end"
                  font-size="10.5" fill="#cbd5e1">{e3(t)}€</text>
              {/each}
              {#each det.xLabels as f}
                <text x={det.xSc(f)} y={dH+17} text-anchor="middle"
                  font-size="10.5" fill="#cbd5e1">{f}</text>
              {/each}
              {#if det.refX != null}
                <line x1={det.refX} x2={det.refX} y1=0 y2={dH}
                  stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4 3"/>
                <text x={det.refX+5} y=9 font-size="10" font-weight="600" fill="#94a3b8">21 mar</text>
              {/if}
              <path d={det.pArea} fill="url(#{gid})"/>
              <path d={det.gPath} fill="none" stroke="#f97316" stroke-width="2.2"
                stroke-linecap="round" stroke-linejoin="round"/>
              <path d={det.pPath} fill="none" stroke="#01f3b3" stroke-width="2.2"
                stroke-linecap="round" stroke-linejoin="round"/>
              {#if det.refX != null && det.gAtRef != null}
                <circle cx={det.refX} cy={det.ySc(det.gAtRef)} r="3.5"
                  fill="#f97316" stroke="white" stroke-width="1.5"/>
              {/if}
              {#if det.refX != null && det.pAtRef != null}
                <circle cx={det.refX} cy={det.ySc(det.pAtRef)} r="3.5"
                  fill="#01f3b3" stroke="white" stroke-width="1.5"/>
              {/if}
            </g>
          </svg>
        </div>
      {/if}

    {/each}
  </div>
</div>

<style>
  .list-wrap  { padding-top: 1.5rem; }
  .list-head  {
    display: flex; align-items: center; justify-content: space-between;
    gap: .5rem; flex-wrap: wrap;
    padding: 0 var(--pad) .75rem;
  }
  .lh-left    { display: flex; align-items: center; gap: .5rem; flex-shrink: 0; }
  .list-period{ font-size: .68rem; color: #94a3b8; }
  .sort-tabs  { display: flex; gap: .2rem; flex-wrap: wrap; }
  .sort-tabs button {
    display: flex; align-items: center; gap: .28rem;
    padding: .22rem .5rem; border: 1px solid #e2e8f0; border-radius: 6px;
    background: transparent; color: #94a3b8; font-size: .68rem; font-weight: 500;
    cursor: pointer; transition: all .15s; white-space: nowrap;
  }
  .sort-tabs button.on { border-color: #cbd5e1; color: #334155; background: #f8fafc; }
  .dot-g-sm { width: 6px; height: 6px; border-radius: 50%; background: #f97316; flex-shrink: 0; }
  .dot-p-sm { width: 6px; height: 6px; border-radius: 50%; background: #01f3b3; flex-shrink: 0; }

  /* Columnas compartidas entre header y filas */
  .list-cols,
  .row {
    display: grid;
    grid-template-columns: 2fr 1.1fr 0.8fr 0.8fr 1.1fr 0.8fr 0.8fr 20px;
    gap: .4rem;
    align-items: center;
    padding-left: var(--pad);
    padding-right: var(--pad);
  }
  .list-cols {
    padding-top: .25rem; padding-bottom: .25rem;
    font-size: .6rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: .06em; color: #cbd5e1;
    border-bottom: 1px solid #f1f5f9;
  }
  .list-cols .r { text-align: right; }
  .col-g        { color: #fdba74; }
  .col-p        { color: #6ee7b7; }

  .list { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }

  /* ── FILA ────────────────────────────────────────────────────────────────── */
  .row {
    padding-top: .5rem; padding-bottom: .5rem;
    border-bottom: 1px solid #f8fafc; cursor: pointer;
    transition: background .1s; border-left: 3px solid transparent;
  }
  .row:last-of-type { border-bottom: none; }
  .row:hover        { background: #f8fafc; }
  .row.exp          { background: #f0fdf9; border-left-color: #01f3b3; border-bottom-color: transparent; }

  .r-name { font-size: .8rem; font-weight: 500; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .row.exp .r-name { color: #0f172a; font-weight: 600; }
  .r-g    { font-size: .78rem; color: #c2410c; text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; }
  .r-p    { font-size: .78rem; color: #059669; text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; }

  .r-pct    { font-size: .76rem; font-weight: 700; font-variant-numeric: tabular-nums; text-align: right; }
  .pct-pos  { color: #dc2626; }
  .pct-neg  { color: #16a34a; }

  .r-chev {
    font-size: .85rem; color: #cbd5e1; text-align: center;
    display: inline-block; transform: rotate(90deg);
    transition: transform .2s, color .2s; line-height: 1;
  }
  .r-chev.open { transform: rotate(270deg); color: #01c49a; }

  /* ── DETALLE DESPLEGADO ─────────────────────────────────────────────────── */
  .detail-panel { background: #f8fafc; border-bottom: 1px solid #e2e8f0; overflow: hidden; }

  .dp-stats {
    display: flex; flex-direction: column; gap: .3rem;
    padding: .7rem var(--pad) .5rem;
    border-bottom: 1px solid #e2e8f0;
  }
  .dp-row     { display: flex; align-items: center; gap: .45rem; flex-wrap: wrap; }
  .dot-g      { width: 8px; height: 8px; border-radius: 50%; background: #f97316; flex-shrink: 0; }
  .dot-p      { width: 8px; height: 8px; border-radius: 50%; background: #01f3b3; flex-shrink: 0; }
  .dp-fname   { font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #94a3b8; }
  .dp-price-g { font-size: .82rem; font-weight: 700; color: #c2410c; font-variant-numeric: tabular-nums; }
  .dp-price-p { font-size: .82rem; font-weight: 700; color: #059669; font-variant-numeric: tabular-nums; }
  .dp-badge-g { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: .08rem .4rem; font-size: .66rem; font-weight: 700; color: #ea580c; }
  .dp-badge-p { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: .08rem .4rem; font-size: .66rem; font-weight: 700; color: #059669; }
  .dp-sep     { color: #e2e8f0; }
  .dp-period  { font-size: .68rem; color: #94a3b8; }
  .dp-period strong       { font-weight: 600; color: #475569; }
  .dp-period.hi-g strong  { color: #ea580c; }
  .dp-period.hi-p strong  { color: #059669; }
  .dp-svg     { display: block; width: 100%; height: 125px; }

  /* ── RESPONSIVE ──────────────────────────────────────────────────────────── */
  @media (max-width: 700px) {
    .list-cols,
    .row       { grid-template-columns: 2fr 1.1fr 0.75fr 0.75fr 1.1fr 0.75fr 0.75fr 16px; gap: .3rem; }
    .r-g, .r-p { font-size: .74rem; }
    .r-pct     { font-size: .7rem; }
  }
  @media (max-width: 520px) {
    .col-since, .r-since { display: none; }
    .list-cols,
    .row        { grid-template-columns: 2fr 1.1fr 0.8fr 1.1fr 0.8fr 14px; gap: .3rem; }
    .r-name     { font-size: .76rem; }
    .r-g, .r-p  { font-size: .73rem; }
    .r-pct      { font-size: .71rem; }
  }
  @media (max-width: 380px) {
    .col-since, .r-since,
    .col-pct-extra, .r-pct-all { display: none; }
    .list-cols,
    .row        { grid-template-columns: 2fr 1fr 1fr 12px; gap: .25rem; }
    .r-name     { font-size: .73rem; }
    .r-g, .r-p  { font-size: .72rem; }
  }
</style>
