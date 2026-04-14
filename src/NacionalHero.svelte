<script>
  import * as d3 from 'd3';
  import { FECHAS, NACIONAL } from './lib/data.js';
  import { e3, s1, s3, stats, refIdx } from './lib/utils.js';

  const hG = stats(NACIONAL.gasoleo);
  const hP = stats(NACIONAL.gasolina);

  // ─── hero chart ──────────────────────────────────────────────────────────────
  const CW = 900, CH = 155;
  const CM = { top: 12, right: 20, bottom: 30, left: 56 };
  const iW = CW - CM.left - CM.right;
  const iH = CH - CM.top  - CM.bottom;

  const heroAllV = [...NACIONAL.gasoleo, ...NACIONAL.gasolina].filter(v => v != null);
  const heroVMin = d3.min(heroAllV) * .997;
  const heroVMax = d3.max(heroAllV) * 1.003;
  const heroXSc  = d3.scalePoint().domain(FECHAS).range([0, iW]).padding(.3);
  const heroYSc  = d3.scaleLinear().domain([heroVMin, heroVMax]).range([iH, 0]);
  const heroLine = d3.line()
    .x((_, i) => heroXSc(FECHAS[i])).y(v => heroYSc(v))
    .defined(v => v != null).curve(d3.curveCatmullRom);
  const heroGPath = heroLine(NACIONAL.gasoleo) ?? '';
  const heroPPath = heroLine(NACIONAL.gasolina) ?? '';
  const heroYTicks  = heroYSc.ticks(3);
  const heroXLabels = FECHAS.filter((_, i) => i % 7 === 0 || i === FECHAS.length - 1);
  const heroRefX    = refIdx >= 0 ? heroXSc(FECHAS[refIdx]) : null;
  const heroPLastI  = NACIONAL.gasolina.map((v,i)=>v!=null?i:null).filter(i=>i!==null).pop() ?? 0;
  const heroGLastI  = NACIONAL.gasoleo.map((v,i)=>v!=null?i:null).filter(i=>i!==null).pop() ?? 0;
  const heroPArea = (() => {
    const di = NACIONAL.gasolina.map((v,i)=>v!=null?i:null).filter(i=>i!==null);
    return di.length >= 2
      ? `${heroPPath} L${heroXSc(FECHAS[di[di.length-1]])},${iH} L${heroXSc(FECHAS[di[0]])},${iH} Z`
      : '';
  })();
</script>

<div class="hero">
  <div class="hero-top">
    <div class="hero-label">Media nacional</div>
    <div class="hero-stats">

      <div class="hs">
        <div class="hs-head"><span class="dot-g"></span><span class="hs-name">Gasóleo A</span></div>
        <div class="hs-price">{e3(hG?.last)}€</div>
        <span class="hs-badge hs-badge-g">{s1(hG?.pct)} total</span>
        {#if hG?.beforeRef != null}
          <div class="hs-periods">
            <div class="period"><span class="p-label">Hasta 21/03</span>
              <span class="p-val">{s3(hG.beforeRef)} <em>{s1(hG.beforeRefPct)}</em></span></div>
            <div class="period hi"><span class="p-label">Desde 21/03</span>
              <span class="p-val">{s3(hG.sinceRef)} <em>{s1(hG.sinceRefPct)}</em></span></div>
          </div>
        {/if}
      </div>

      <div class="hs-sep"></div>

      <div class="hs">
        <div class="hs-head"><span class="dot-p"></span><span class="hs-name">Gasolina 95</span></div>
        <div class="hs-price">{e3(hP?.last)}€</div>
        <span class="hs-badge hs-badge-p">{s1(hP?.pct)} total</span>
        {#if hP?.beforeRef != null}
          <div class="hs-periods">
            <div class="period"><span class="p-label">Hasta 21/03</span>
              <span class="p-val">{s3(hP.beforeRef)} <em>{s1(hP.beforeRefPct)}</em></span></div>
            <div class="period hi-p"><span class="p-label">Desde 21/03</span>
              <span class="p-val">{s3(hP.sinceRef)} <em>{s1(hP.sinceRefPct)}</em></span></div>
          </div>
        {/if}
      </div>

    </div>
  </div>

  <div class="hero-chart">
    <svg class="chart-svg" viewBox="0 0 {CW} {CH}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="hpg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#01f3b3" stop-opacity=".15"/>
          <stop offset="100%" stop-color="#01f3b3" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <g transform="translate({CM.left},{CM.top})">
        {#if heroRefX != null}
          <rect x={heroRefX} y=0 width={iW - heroRefX} height={iH} fill="#f0fdf9" opacity=".6"/>
        {/if}
        {#each heroYTicks as t}
          <line x1=0 x2={iW} y1={heroYSc(t)} y2={heroYSc(t)} stroke="#f1f5f9"/>
          <text x=-8 y={heroYSc(t)} dy=".32em" text-anchor="end" font-size="11" fill="#cbd5e1">{e3(t)}€</text>
        {/each}
        {#each heroXLabels as f}
          <text x={heroXSc(f)} y={iH+18} text-anchor="middle" font-size="11" fill="#cbd5e1">{f}</text>
        {/each}
        {#if heroRefX != null}
          <line x1={heroRefX} x2={heroRefX} y1=0 y2={iH}
            stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4 3"/>
          <text x={heroRefX+5} y=9 font-size="10" font-weight="600" fill="#94a3b8">21 mar</text>
        {/if}
        <path d={heroPArea} fill="url(#hpg)"/>
        <path d={heroGPath} fill="none" stroke="#f97316" stroke-width="2.5"
          stroke-linecap="round" stroke-linejoin="round"/>
        <path d={heroPPath} fill="none" stroke="#01f3b3" stroke-width="2.5"
          stroke-linecap="round" stroke-linejoin="round"/>
        {#if heroRefX != null && hG?.atRef != null}
          <circle cx={heroRefX} cy={heroYSc(hG.atRef)} r="4" fill="#f97316" stroke="white" stroke-width="2"/>
        {/if}
        {#if heroRefX != null && hP?.atRef != null}
          <circle cx={heroRefX} cy={heroYSc(hP.atRef)} r="4" fill="#01f3b3" stroke="white" stroke-width="2"/>
        {/if}
        <circle cx={heroXSc(FECHAS[heroGLastI])} cy={heroYSc(NACIONAL.gasoleo[heroGLastI])} r="4"
          fill="#f97316" stroke="white" stroke-width="2"/>
        <circle cx={heroXSc(FECHAS[heroPLastI])} cy={heroYSc(NACIONAL.gasolina[heroPLastI])} r="4"
          fill="#01f3b3" stroke="white" stroke-width="2"/>
      </g>
    </svg>
  </div>
</div>

<style>
  .hero {
    position: sticky; top: 0; z-index: 20;
    background: #fff;
    border-bottom: 1px solid #e2e8f0;
    box-shadow: 0 4px 20px rgba(15,23,42,.06);
  }
  .hero-top   { padding: 1rem var(--pad) .75rem; }
  .hero-label {
    font-size: .62rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: .1em; color: #94a3b8; margin-bottom: .65rem;
  }
  .hero-stats { display: grid; grid-template-columns: 1fr auto 1fr; gap: 1rem; align-items: start; }
  .hs-sep     { width: 1px; background: #f1f5f9; align-self: stretch; }
  .hs         { display: flex; flex-direction: column; gap: .3rem; }
  .hs-head    { display: flex; align-items: center; gap: .4rem; }
  .dot-g      { width: 8px; height: 8px; border-radius: 50%; background: #f97316; flex-shrink: 0; }
  .dot-p      { width: 8px; height: 8px; border-radius: 50%; background: #01f3b3; flex-shrink: 0; }
  .hs-name    { font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: #94a3b8; }
  .hs-price   { font-size: 1.9rem; font-weight: 800; color: #0f172a; line-height: 1; font-variant-numeric: tabular-nums; letter-spacing: -.02em; }
  .hs-badge   { display: inline-flex; border-radius: 20px; padding: .13rem .5rem; font-size: .7rem; font-weight: 700; width: fit-content; }
  .hs-badge-g { background: #fff7ed; border: 1px solid #fed7aa; color: #ea580c; }
  .hs-badge-p { background: #ecfdf5; border: 1px solid #a7f3d0; color: #059669; }
  .hs-periods { display: flex; flex-direction: column; gap: .2rem; margin-top: .1rem; }
  .period     { display: flex; justify-content: space-between; gap: .5rem; padding: .2rem .45rem; background: #f8fafc; border-radius: 5px; border-left: 2px solid #e2e8f0; }
  .period.hi  { border-left-color: #f97316; background: #fff7ed; }
  .period.hi-p{ border-left-color: #01f3b3; background: #ecfdf5; }
  .p-label    { font-size: .63rem; color: #94a3b8; white-space: nowrap; }
  .p-val      { font-size: .7rem; font-weight: 600; color: #334155; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .p-val em   { font-style: normal; color: #94a3b8; font-weight: 400; margin-left: .15rem; }
  .period.hi   .p-val { color: #ea580c; }
  .period.hi-p .p-val { color: #059669; }
  .hero-chart { border-top: 1px solid #f1f5f9; }
  .chart-svg  { display: block; width: 100%; height: 135px; }

  @media (max-width: 700px) {
    .hs-price  { font-size: 1.65rem; }
    .chart-svg { height: 110px; }
  }
  @media (max-width: 520px) {
    .hs-price   { font-size: 1.4rem; }
    .hs-periods { display: none; }
    .chart-svg  { height: 90px; }
  }
  @media (max-width: 380px) {
    .hero-stats { grid-template-columns: 1fr; gap: .5rem; }
    .hs-sep     { display: none; }
    .hs-price   { font-size: 1.3rem; }
    .chart-svg  { height: 80px; }
  }
</style>
