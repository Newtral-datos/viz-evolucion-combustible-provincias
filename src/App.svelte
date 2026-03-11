<script>
  import * as d3 from 'd3';
  import { FECHAS, PROVINCIAS, NACIONAL } from './lib/data.js';

  const NOMBRE_MAP = {
    'ARABA/ÁLAVA': 'Álava', 'A CORUÑA': 'A Coruña',
    'ILLES BALEARS': 'Illes Balears', 'LA RIOJA': 'La Rioja',
    'LAS PALMAS': 'Las Palmas', 'SANTA CRUZ DE TENERIFE': 'S.C. Tenerife',
  };
  const fmt = k => NOMBRE_MAP[k] ?? k.toLowerCase().replace(/(^|[\s\/\-])\S/g, c => c.toUpperCase());
  const n3  = v => v.toFixed(3).replace('.', ',');   // 1.234 → 1,234
  const n1  = v => v.toFixed(1).replace('.', ',');   // 12.3 → 12,3

  let fuel     = 'gasoleo';
  let selected = null;
  let sortCol  = 'abs';   // 'name' | 'last' | 'abs' | 'pct'
  let sortDir  = -1;      // -1 desc, +1 asc

  function toggleSort(col) {
    if (sortCol === col) sortDir *= -1;
    else { sortCol = col; sortDir = col === 'name' ? 1 : -1; }
  }
  function arrow(col) { return sortCol === col ? (sortDir === -1 ? ' ↓' : ' ↑') : ''; }

  // ── Filas base (sin ordenar)
  $: baseRows = Object.entries(PROVINCIAS).map(([key, d]) => {
    const vals  = d[fuel];
    const first = vals.find(v => v != null);
    const last  = [...vals].reverse().find(v => v != null);
    if (first == null || last == null) return null;
    const abs = +(last - first).toFixed(3);
    const pct = +(abs / first * 100).toFixed(1);
    return { key, name: fmt(key), first, last, abs, pct, vals };
  }).filter(Boolean);

  $: rows = [...baseRows].sort((a, b) => {
    const va = a[sortCol], vb = b[sortCol];
    return sortDir * (typeof va === 'string' ? va.localeCompare(vb) : va - vb);
  });

  // Escala de color: dominio real [min, max] para usar toda la gama de color
  $: maxPct = Math.max(...baseRows.map(r => r.pct));
  $: minPct = Math.min(...baseRows.map(r => r.pct));
  $: colorScale = d3.scaleSequential()
      .domain([minPct, maxPct])
      .interpolator(d3.interpolateRgb('#b2fce8', '#004d38'));

  // ── Nacional
  $: natVals  = NACIONAL[fuel];
  $: natFirst = natVals.find(v => v != null);
  $: natLast  = [...natVals].reverse().find(v => v != null);
  $: natAbs   = +(natLast - natFirst).toFixed(3);
  $: natPct   = +(natAbs / natFirst * 100).toFixed(1);

  // ── Provincia seleccionada
  $: selRow = selected ? rows.find(r => r.key === selected) : null;

  // ── Gráfico detalle
  const CW = 500, CH = 230, CM = { top: 24, right: 20, bottom: 32, left: 54 };
  $: ciW = CW - CM.left - CM.right;
  $: ciH = CH - CM.top  - CM.bottom;

  $: chartVals  = selRow ? selRow.vals : natVals;
  $: chartTitle = selRow ? selRow.name : 'Media nacional';

  $: cMin = d3.min(chartVals.filter(v => v != null)) * 0.995;
  $: cMax = d3.max(chartVals.filter(v => v != null)) * 1.005;
  $: cxSc = d3.scalePoint().domain(FECHAS).range([0, ciW]).padding(0.3);
  $: cySc = d3.scaleLinear().domain([cMin, cMax]).range([ciH, 0]);
  $: cLine = d3.line().x((_, i) => cxSc(FECHAS[i])).y(v => cySc(v)).defined(v => v != null);
  $: cPath = cLine(chartVals);
  $: cTicks = cySc.ticks(4);
  $: areaPath = `${cPath} L${cxSc(FECHAS[chartVals.filter((_,i)=>chartVals[i]!=null).map((_,i)=>i).pop()])},${ciH} L${cxSc(FECHAS[chartVals.findIndex(v=>v!=null)])},${ciH} Z`;
</script>

<div class="page">

  <header>
    <div class="brand-block">
      <span class="brand">Evolución del precio del combustible en España</span>
      <span class="subtitle">Ordenado por subida en euros · Haz clic en la columna para cambiar</span>
    </div>
    <div class="fuel-toggle">
      <button class:active={fuel==='gasoleo'}  on:click={() => { fuel='gasoleo';  selected=null }}>Gasóleo A</button>
      <button class:active={fuel==='gasolina'} on:click={() => { fuel='gasolina'; selected=null }}>Gasolina 95</button>
    </div>
    <span class="period">Período: {FECHAS[0]} - {FECHAS[FECHAS.length-1]}</span>
    <div class="nat-badge">
      Media nacional · <strong>+{n3(natAbs)}€</strong> · <strong>+{n1(natPct)}%</strong>
    </div>
  </header>

  <!-- Backdrop móvil -->
  {#if selected}
    <div class="backdrop" on:click={() => selected = null}></div>
  {/if}

  <div class="body">

    <!-- Ranking -->
    <div class="ranking">
      <div class="rank-head">
        <button class="hbtn" on:click={() => toggleSort('name')}>Provincia{arrow('name')}</button>
        <span></span>
        <button class="hbtn r" on:click={() => toggleSort('last')}>Precio{arrow('last')}</button>
        <button class="hbtn r" on:click={() => toggleSort('abs')}>+€{arrow('abs')}</button>
        <button class="hbtn r" on:click={() => toggleSort('pct')}>%{arrow('pct')}</button>
      </div>
      <div class="rank-scroll">
        {#each rows as r}
          <div
            class="rank-row"
            class:sel={selected === r.key}
            on:click={() => selected = selected === r.key ? null : r.key}
          >
            <span class="rname">{r.name}</span>
            <div class="bar-wrap">
              <div class="bar" style="width:{(r.last / 2.0 * 100).toFixed(1)}%; background:{colorScale(r.pct)}"></div>
            </div>
            <span class="r">{n3(r.last)}</span>
            <span class="r bold">+{n3(r.abs)}</span>
            <span class="r bold" style="color:{colorScale(r.pct)}">+{n1(r.pct)}%</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Panel derecho -->
    <div class="detail" class:open={selected !== null}>

      <div class="detail-header">
        <div class="detail-title">
          {#if selRow}
            <span class="detail-name">{selRow.name}</span>
            <button class="close-btn" on:click={() => selected = null}>✕</button>
          {:else}
            <span class="hint">← Haz clic en una provincia para ver su evolución</span>
          {/if}
        </div>
        {#if selRow}
          <div class="detail-stats">
            <div class="ds"><span>Inicio</span><strong>{n3(selRow.first)}€</strong></div>
            <div class="ds"><span>Final</span><strong>{n3(selRow.last)}€</strong></div>
            <div class="ds green"><span>Variación</span><strong>+{n3(selRow.abs)}€ · +{n1(selRow.pct)}%</strong></div>
          </div>
        {/if}
      </div>

      <!-- Gráfico -->
      <div class="chart-wrap">
        <div class="chart-label">{chartTitle} · evolución día a día</div>
        <svg viewBox="0 0 {CW} {CH}" style="width:100%;display:block">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#01f3b3" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="#01f3b3" stop-opacity="0.03"/>
            </linearGradient>
          </defs>
          <g transform="translate({CM.left},{CM.top})">
            {#each cTicks as t}
              <line x1=0 x2={ciW} y1={cySc(t)} y2={cySc(t)} stroke="#e2e8f0"/>
              <text x=-6 y={cySc(t)} dy="0.32em" text-anchor="end" font-size="11" fill="#94a3b8">{n3(t)}€</text>
            {/each}
            {#each FECHAS as f}
              <text x={cxSc(f)} y={ciH+22} text-anchor="middle" font-size="11" fill="#94a3b8">{f}</text>
            {/each}
            <path d={areaPath} fill="url(#areaGrad)"/>
            <path d={cPath} fill="none" stroke="#01c896" stroke-width="2.5" stroke-linecap="round"/>
            {#each chartVals as v, i}
              {#if v != null}
                <circle cx={cxSc(FECHAS[i])} cy={cySc(v)} r="4.5" fill="#01c896" stroke="white" stroke-width="2"/>
                <text x={cxSc(FECHAS[i])} y={cySc(v) - 11}
                  text-anchor="middle" font-size="9.5" fill="#00875a" font-weight="600">{n3(v)}€</text>
              {/if}
            {/each}
          </g>
        </svg>
      </div>

      <!-- Tabla día a día -->
      {#if selRow}
        <div class="day-table">
          <div class="day-head"><span>Fecha</span><span class="r">Precio</span><span class="r">Variación</span></div>
          {#each selRow.vals as v, i}
            {#if v != null}
              {@const prev = selRow.vals.slice(0, i).reverse().find(x => x != null)}
              {@const d = prev != null ? +(v - prev).toFixed(3) : null}
              <div class="day-row">
                <span>{FECHAS[i]}</span>
                <span class="r bold">{n3(v)}€</span>
                <span class="r" class:pos={d > 0} class:neg={d < 0}>
                  {d == null ? '—' : d > 0 ? `+${n3(d)}€` : `${n3(d)}€`}
                </span>
              </div>
            {/if}
          {/each}
        </div>
      {/if}

    </div>
  </div>
</div>

<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .page {
    font-family: 'Inter', system-ui, sans-serif;
    background: #f8fafc; color: #1e293b;
    height: 100dvh; display: flex; flex-direction: column; overflow: hidden;
  }

  header {
    display: flex; align-items: center; gap: 1rem;
    padding: 0.6rem 1.25rem; background: white;
    border-bottom: 1px solid #e2e8f0; flex-shrink: 0; flex-wrap: wrap;
  }
  .brand-block { display: flex; flex-direction: column; gap: 2px; flex-basis: 100%; }
  .brand    { font-size: 0.95rem; font-weight: 700; color: #0f172a; }
  .period   { font-size: 0.78rem; color: #94a3b8; }
  .subtitle { font-size: 0.72rem; color: #b0bac8; font-style: italic; }

  .fuel-toggle { display: flex; gap: 3px; background: #f1f5f9; padding: 3px; border-radius: 8px; }
  .fuel-toggle button {
    padding: 0.28rem 0.8rem; border: none; border-radius: 5px;
    background: transparent; color: #64748b; font-size: 0.82rem;
    cursor: pointer; font-weight: 500; transition: all 0.15s;
  }
  .fuel-toggle button.active { background: white; color: #0f172a; box-shadow: 0 1px 3px #0002; }

  .nat-badge {
    margin-left: auto; background: #f0fdf9;
    border: 1px solid #a7f3d0; border-radius: 8px;
    padding: 0.25rem 0.85rem; font-size: 0.82rem; color: #475569;
    display: flex; gap: 0.4rem;
  }
  .nat-badge strong { color: #047857; }

  /* Body */
  .body { display: grid; grid-template-columns: 3fr 2fr; flex: 1; min-height: 0; }

  /* Ranking */
  .ranking { display: flex; flex-direction: column; background: white; border-right: 1px solid #e2e8f0; overflow: hidden; }

  .rank-head {
    display: grid; grid-template-columns: 148px 1fr 80px 72px 62px;
    gap: 0.4rem; padding: 0.3rem 1.25rem;
    border-bottom: 1px solid #e2e8f0; flex-shrink: 0;
  }
  .hbtn {
    background: none; border: none; padding: 0; cursor: pointer;
    font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.06em; color: #94a3b8; text-align: center;
    transition: color 0.15s; white-space: nowrap;
  }
  .hbtn:hover { color: #475569; }
  .hbtn.r { text-align: center; }

  .rank-scroll { flex: 1; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }

  .rank-row {
    display: grid; grid-template-columns: 148px 1fr 80px 72px 62px;
    gap: 0.4rem; align-items: center;
    padding: 0.28rem 1.25rem;
    border-bottom: 1px solid #f8fafc;
    cursor: pointer; transition: background 0.1s;
  }
  .rank-row:hover { background: #f8fafc; }
  .rank-row.sel   { background: #f0fdf9; border-left: 3px solid #01f3b3; padding-left: calc(1.25rem - 3px); }

  .rname { font-size: 0.8rem; color: #334155; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .bar-wrap { background: #f1f5f9; border-radius: 4px; height: 10px; overflow: hidden; }
  .bar { height: 100%; border-radius: 4px; transition: width 0.5s ease, background 0.5s ease; }
  .r    { text-align: right; font-size: 0.78rem; color: #475569; font-variant-numeric: tabular-nums; }
  .bold { font-weight: 600; color: #0f172a; }

  /* Detail */
  .detail { display: flex; flex-direction: column; background: #f8fafc; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }

  .detail-header { padding: 0.85rem 1.25rem; background: white; border-bottom: 1px solid #e2e8f0; flex-shrink: 0; }
  .detail-title  { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.6rem; min-height: 2rem; }
  .detail-name   { font-size: 1.1rem; font-weight: 700; color: #0f172a; }
  .hint          { font-size: 0.82rem; color: #94a3b8; }
  .close-btn     { margin-left: auto; background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 0.9rem; }
  .close-btn:hover { color: #475569; }

  .detail-stats { display: flex; gap: 0.5rem; }
  .ds {
    flex: 1; display: flex; flex-direction: column; gap: 2px;
    padding: 0.4rem 0.65rem; background: #f8fafc;
    border-radius: 6px; border: 1px solid #e2e8f0;
  }
  .ds span     { font-size: 0.67rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
  .ds strong   { font-size: 0.9rem; color: #0f172a; }
  .ds.green    { background: #f0fdf9; border-color: #a7f3d0; }
  .ds.green strong { color: #047857; }

  .chart-wrap  { padding: 1rem 1.25rem 0.5rem; background: white; border-bottom: 1px solid #e2e8f0; }
  .chart-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin-bottom: 0.35rem; }

  .day-table { padding: 0.75rem 1.25rem 1rem; }
  .day-head  { display: grid; grid-template-columns: 1fr 90px 90px; padding: 0.25rem 0; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; border-bottom: 1px solid #e2e8f0; margin-bottom: 0.2rem; }
  .day-row   { display: grid; grid-template-columns: 1fr 90px 90px; padding: 0.3rem 0; font-size: 0.82rem; color: #334155; border-bottom: 1px solid #f1f5f9; }
  .pos { color: #dc2626; font-weight: 600; }
  .neg { color: #047857; font-weight: 600; }

  /* ── Backdrop móvil */
  .backdrop {
    display: none;
  }

  /* ── Responsive móvil */
  @media (max-width: 767px) {

    .page { height: 100dvh; overflow: hidden; }

    /* Header más compacto y centrado */
    header { padding: 0.6rem 1rem; gap: 0.5rem; justify-content: center; text-align: center; }
    .brand-block { align-items: center; }
    .brand    { font-size: 0.88rem; }
    .subtitle { display: block; font-size: 0.7rem; }
    .period   { display: none; }
    .fuel-toggle { justify-content: center; }
    .nat-badge { margin-left: 0; font-size: 0.75rem; padding: 0.2rem 0.6rem; }

    /* Una sola columna */
    .body { grid-template-columns: 1fr; }

    /* Ranking ocupa todo */
    .ranking { border-right: none; }

    /* Columnas simplificadas: nombre + barra + % */
    .rank-head,
    .rank-row {
      grid-template-columns: 1fr 1fr 52px 52px;
    }
    /* Ocultar columnas precio inicial y +€ en móvil */
    .rank-head :nth-child(3),
    .rank-row  :nth-child(3) { display: none; }

    /* Filas más altas para touch */
    .rank-row { padding: 0.45rem 1rem; }
    .rname    { font-size: 0.85rem; }

    /* Backdrop */
    .backdrop {
      display: block;
      position: fixed; inset: 0;
      background: #00000040;
      z-index: 10;
    }

    /* Detail como bottom sheet — oculto por defecto, visible con .open */
    .detail {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      max-height: 75dvh;
      border-radius: 16px 16px 0 0;
      box-shadow: 0 -4px 24px #0002;
      z-index: 20;
      overflow-y: auto;
      display: none;
    }
    .detail.open { display: flex; }

    /* Tirador visual en el sheet */
    .detail-header::before {
      content: '';
      display: block;
      width: 36px; height: 4px;
      background: #e2e8f0;
      border-radius: 2px;
      margin: 0 auto 0.75rem;
    }

    .chart-wrap { padding: 0.75rem 1rem 0.5rem; }
    .day-table  { padding: 0.5rem 1rem 1rem; }
  }
</style>
