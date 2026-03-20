/* ════════════════════════════════
   TABS
════════════════════════════════ */

/* ════════════════════════════════
   LAGREDE SAKER (LocalStorage)
════════════════════════════════ */

const SAKER_KEY = 'kred_saker';

function hentAlleSaker() {
  try { return JSON.parse(localStorage.getItem(SAKER_KEY)) || []; }
  catch { return []; }
}

function lagreSaker(saker) {
  localStorage.setItem(SAKER_KEY, JSON.stringify(saker));
}

function samleSakData() {
  // Samler alle relevante feltverdier fra alle tre moduler
  const ids = [
    'f-hovedstol','f-gebyr','f-renter','f-rettslige','f-direkte','f-tilbyr','f-kontonummer','f-kid',
    'sl-total','sl-renter','sl-salar','sl-hoved',
    'a-skyldner','a-mva','a-hovedstol','a-purregebyr','a-salar','a-rettslige',
    'a-forfall','a-iv-forfall','a-bo-dato','a-tung-salar','a-tung-salar-fremtidig',
    'a-mnd','a-mnd-belop','a-dato','a-dekning','a-salar-dato',
    'a-avdragssalar-fritak','a-bo-ikke-sendt',
    'rn-hoved','rn-fra','rn-til',
  ];
  const data = {};
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    data[id] = el.type === 'checkbox' ? el.checked : el.value;
  });
  return data;
}

function gjenopprettSakData(data) {
  Object.entries(data).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === 'checkbox') {
      el.checked = val;
    } else {
      el.value = val;
      if (el.dataset) el.dataset.beregnet = '0';
    }
  });
  // Kjør beregninger på nytt
  oppdaterFoerBO();
  beregnAvdrag();
  beregnForlik();
  beregnRente();
}

function lagreSak() {
  const navn = document.getElementById('sak-navn').value.trim();
  if (!navn) { document.getElementById('sak-navn').focus(); return; }

  const saker = hentAlleSaker();
  saker.unshift({
    id: Date.now(),
    navn,
    dato: new Date().toLocaleDateString('no-NO'),
    data: samleSakData(),
  });

  lagreSaker(saker);
  document.getElementById('sak-navn').value = '';
  visSakerListe();
  alert(`Sak "${navn}" er lagret!`);
}

function slettSak(id) {
  const saker = hentAlleSaker().filter(s => s.id !== id);
  lagreSaker(saker);
  visSakerListe();
}

let _aktivSakId = null;

function lastSak(id) {
  const sak = hentAlleSaker().find(s => s.id === id);
  if (!sak) return;
  _aktivSakId = id;
  gjenopprettSakData(sak.data);
  lukkSaker();
  visAktivSakIndikator();
}

function visAktivSakIndikator() {
  const saker = hentAlleSaker();
  const sak = saker.find(s => s.id === _aktivSakId);
  let el = document.getElementById('aktiv-sak-banner');
  if (!el) {
    el = document.createElement('div');
    el.id = 'aktiv-sak-banner';
    el.style.cssText = 'background:#eef4ff;border-bottom:2px solid #3a7bd5;padding:6px 40px;font-size:12px;color:#1e3a6e;display:flex;justify-content:space-between;align-items:center;';
    document.querySelector('header').after(el);
  }
  if (sak) {
    el.innerHTML = `
      <span>✏ Redigerer: <strong>${sak.navn}</strong> – endringer lagres automatisk</span>
      <button onclick="_aktivSakId=null;document.getElementById('aktiv-sak-banner').remove()" style="background:none;border:none;color:#3a7bd5;font-size:12px;font-weight:600;cursor:pointer;">Koble fra</button>
    `;
    el.style.display = 'flex';
  } else {
    el.style.display = 'none';
  }
}

function autolagreSak() {
  if (!_aktivSakId) return;
  const saker = hentAlleSaker();
  const idx = saker.findIndex(s => s.id === _aktivSakId);
  if (idx === -1) { _aktivSakId = null; return; }
  saker[idx].data = samleSakData();
  saker[idx].dato = new Date().toLocaleDateString('no-NO');
  lagreSaker(saker);
}

function visSakerListe() {
  const saker = hentAlleSaker();
  const liste = document.getElementById('saker-liste');
  if (!liste) return;

  if (saker.length === 0) {
    liste.innerHTML = '<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px 0;">Ingen lagrede saker ennå.</div>';
    return;
  }

  liste.innerHTML = saker.map(s => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;background:var(--bg);">
      <div>
        <div style="font-weight:600;font-size:14px;color:var(--ink);">${s.navn}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Lagret ${s.dato}</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button onclick="lastSak(${s.id})" style="background:var(--ink);color:var(--white);border:none;border-radius:6px;padding:6px 14px;font-size:12px;font-weight:600;cursor:pointer;">Hent</button>
        <button onclick="slettSak(${s.id})" style="background:var(--bg-dark);color:var(--text-muted);border:1px solid var(--border);border-radius:6px;padding:6px 10px;font-size:12px;cursor:pointer;" title="Slett">✕</button>
      </div>
    </div>
  `).join('');
}

function visSaker() {
  visSakerListe();
  const modal = document.getElementById('saker-modal');
  modal.style.display = 'flex';
}

function lukkSaker() {
  document.getElementById('saker-modal').style.display = 'none';
}

// Lukk modal ved klikk utenfor
document.addEventListener('click', e => {
  const modal = document.getElementById('saker-modal');
  if (e.target === modal) lukkSaker();
});

function switchTab(name) {
  // Håndter direkte hopp til verktøy-undertaber
  if (name === 'simulator') { switchTab('verktoy'); switchVerktoy('simulator'); return; }
  if (name === 'rente')     { switchTab('verktoy'); switchVerktoy('rente');     return; }

  const tabNames = ['avdrag', 'forlik', 'verktoy'];
  document.querySelectorAll('.tab').forEach((t, i) => {
    t.classList.toggle('active', tabNames[i] === name);
  });
  document.querySelectorAll('.tab-content').forEach(c => {
    c.classList.toggle('active', c.id === 'tab-' + name);
  });
}

function switchVerktoy(navn) {
  const visRente = navn === 'rente';
  document.getElementById('vtab-rente').style.display     = visRente ? 'block' : 'none';
  document.getElementById('vtab-simulator').style.display = visRente ? 'none'  : 'block';

  const btnR = document.getElementById('vtab-rente-btn');
  const btnS = document.getElementById('vtab-simulator-btn');
  if (btnR) {
    btnR.style.borderBottomColor = visRente ? 'var(--ink)' : 'transparent';
    btnR.style.fontWeight        = visRente ? '700' : '400';
    btnR.style.color             = visRente ? 'var(--ink)' : 'var(--text-muted)';
  }
  if (btnS) {
    btnS.style.borderBottomColor = !visRente ? 'var(--ink)' : 'transparent';
    btnS.style.fontWeight        = !visRente ? '700' : '400';
    btnS.style.color             = !visRente ? 'var(--ink)' : 'var(--text-muted)';
  }
}

/* ════════════════════════════════
   UTILITIES
════════════════════════════════ */

function kr(n) {
  return 'kr ' + Number(n).toLocaleString('no-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Parser beløp – støtter både komma og punktum som desimalskilletegn
function parseKr(val) {
  if (!val) return 0;
  // Fjern mellomrom og kr-prefix, bytt komma med punktum
  const cleaned = String(val).replace(/\s/g, '').replace(/^kr\s*/i, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function tbl(n) {
  return Number(n).toLocaleString('no-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pst(n, av) {
  if (!av) return '0%';
  return (n / av * 100).toFixed(1) + '%';
}

function parseNO(str) {
  if (!str) return null;
  const parts = str.split('.');
  if (parts.length !== 3) return null;
  const d = parseInt(parts[0]), m = parseInt(parts[1]) - 1, y = parseInt(parts[2]);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  return new Date(y, m, d);
}

function dagMellom(fra, til) {
  const diff = til - fra;
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function leggTilMnd(dato, n) {
  const d = new Date(dato);
  d.setMonth(d.getMonth() + n);
  return d;
}

let avdragsFrekvens = 'maned';
function leggTilAvdragDato(dato, n) {
  const d = new Date(dato);
  if (avdragsFrekvens === 'uke') { d.setDate(d.getDate() + n * 7); }
  else if (avdragsFrekvens === 'touker') { d.setDate(d.getDate() + n * 14); }
  else { d.setMonth(d.getMonth() + n); }
  return d;
}
function settFrekvens(freq) {
  avdragsFrekvens = freq;
  const labels = { uke: 'Ukentlig beløp', touker: 'Beløp per 2. uke', maned: 'Månedlig beløp' };
  const maks   = { uke: 520, touker: 260, maned: 120 };
  const belopLabel = document.getElementById('a-belop-label');
  if (belopLabel) belopLabel.textContent = labels[freq];
  const mndEl = document.getElementById('a-mnd');
  if (mndEl) mndEl.max = maks[freq];
  ['uke','touker','maned'].forEach(f => {
    const btn = document.getElementById('freq-' + f);
    if (!btn) return;
    btn.style.background  = f===freq ? 'var(--ink)'    : 'var(--bg-dark)';
    btn.style.color       = f===freq ? 'var(--white)'  : 'var(--text)';
    btn.style.borderColor = f===freq ? 'var(--ink)'    : 'var(--border)';
  });
  window._avdragsTerminer = null;
  if (mndEl) { mndEl.value=''; mndEl.dataset.beregnet=0; }
  const belopEl = document.getElementById('a-mnd-belop');
  if (belopEl) { belopEl.value=''; belopEl.dataset.beregnet=0; }
  beregnAvdrag();
}

function formatDato(d) {
  return d.toLocaleDateString('no-NO', { day:'2-digit', month:'2-digit', year:'numeric' });
}

/* ════════════════════════════════
   DATEPICKER
════════════════════════════════ */

let _dpAktiv = null;

function dpÅpne(input) {
  dpLukk();
  const parsed = parseNO(input.value.trim());
  const start  = parsed && !isNaN(parsed) ? parsed : new Date();
  const år = start.getFullYear();
  const mnd = start.getMonth();
  _dpAktiv = { input, år, mnd };
  dpRender();
}

function dpLukk() {
  document.querySelectorAll('.dp-popup').forEach(e => e.remove());
  _dpAktiv = null;
}

function dpRender() {
  if (!_dpAktiv) return;
  document.querySelectorAll('.dp-popup').forEach(e => e.remove());

  const { input, år, mnd, visVelgMnd } = _dpAktiv;
  const iDag = new Date(); iDag.setHours(0,0,0,0);
  const valgt = parseNO(input.value.trim());

  const popup = document.createElement('div');
  popup.className = 'dp-popup';
  const rect = input.getBoundingClientRect();
  if (rect.left + 252 > window.innerWidth - 20) popup.classList.add('dp-right');

  const månNavn = ['Januar','Februar','Mars','April','Mai','Juni',
                   'Juli','August','September','Oktober','November','Desember'];
  const månKort = ['Jan','Feb','Mar','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Des'];

  // ── Header ──
  const head = document.createElement('div');
  head.className = 'dp-head';

  if (visVelgMnd) {
    // År-navigasjon i månedvelger
    head.innerHTML = `
      <button onclick="dpÅrNaviger(-1)">◀</button>
      <span style="cursor:default;">${år}</span>
      <button onclick="dpÅrNaviger(1)">▶</button>`;
  } else {
    head.innerHTML = `
      <button onclick="dpNaviger(-1)">◀</button>
      <span onclick="dpToggleMndVelger()" style="cursor:pointer;border-bottom:1px dashed var(--text-muted);">${månNavn[mnd]} ${år}</span>
      <button onclick="dpNaviger(1)">▶</button>`;
  }
  popup.appendChild(head);

  if (visVelgMnd) {
    // ── Månedvelger grid ──
    const mgrid = document.createElement('div');
    mgrid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:4px 0;';
    månKort.forEach((navn, idx) => {
      const btn = document.createElement('button');
      btn.textContent = navn;
      btn.style.cssText = `padding:7px 4px;border:none;border-radius:5px;cursor:pointer;font-size:12px;font-family:'DM Sans',sans-serif;
        background:${idx === mnd ? 'var(--ink)' : 'var(--bg)'};
        color:${idx === mnd ? 'var(--white)' : 'var(--text)'};`;
      btn.onmouseenter = () => { if (idx !== mnd) btn.style.background = 'var(--bg-dark)'; };
      btn.onmouseleave = () => { if (idx !== mnd) btn.style.background = 'var(--bg)'; };
      btn.onclick = () => { _dpAktiv.mnd = idx; _dpAktiv.visVelgMnd = false; dpRender(); };
      mgrid.appendChild(btn);
    });
    popup.appendChild(mgrid);
  } else {
    // ── Dager-grid ──
    const grid = document.createElement('div');
    grid.className = 'dp-grid';

    ['Ma','Ti','On','To','Fr','Lø','Sø'].forEach(d => {
      const el = document.createElement('div');
      el.className = 'dp-dow';
      el.textContent = d;
      grid.appendChild(el);
    });

    const førsteDag = new Date(år, mnd, 1);
    let startUkedag = (førsteDag.getDay() + 6) % 7; // mandag=0
    const dagerIMnd = new Date(år, mnd + 1, 0).getDate();
    const dagerForrigeMnd = new Date(år, mnd, 0).getDate();

    // Forrige måneds dager (grå)
    for (let i = 0; i < startUkedag; i++) {
      const dag = dagerForrigeMnd - startUkedag + i + 1;
      const el = document.createElement('div');
      el.className = 'dp-day other-month';
      el.textContent = dag;
      el.onclick = () => { dpNaviger(-1); };
      grid.appendChild(el);
    }

    // Denne måneds dager
    for (let dag = 1; dag <= dagerIMnd; dag++) {
      const d = new Date(år, mnd, dag);
      const el = document.createElement('div');
      el.className = 'dp-day';
      el.textContent = dag;
      if (d.toDateString() === iDag.toDateString()) el.classList.add('today');
      if (valgt && d.toDateString() === valgt.toDateString()) el.classList.add('selected');
      if (norskHelligdag(d)) el.classList.add('helligdag');
      else if (d.getDay() === 0 || d.getDay() === 6) el.classList.add('weekend');
      el.onclick = () => dpVelg(dag);
      grid.appendChild(el);
    }

    // Neste måneds dager (grå) – fyll opp til 6 rader
    const totaltVist = startUkedag + dagerIMnd;
    const nesteDager = totaltVist % 7 === 0 ? 0 : 7 - (totaltVist % 7);
    for (let dag = 1; dag <= nesteDager; dag++) {
      const el = document.createElement('div');
      el.className = 'dp-day other-month';
      el.textContent = dag;
      el.onclick = () => { dpNaviger(1); };
      grid.appendChild(el);
    }

    popup.appendChild(grid);
  }

  const wrap = input.closest('.dp-wrap') || input.parentElement;
  wrap.style.position = 'relative';
  wrap.appendChild(popup);
}

function dpToggleMndVelger() {
  if (!_dpAktiv) return;
  _dpAktiv.visVelgMnd = !_dpAktiv.visVelgMnd;
  dpRender();
}

function dpÅrNaviger(retning) {
  if (!_dpAktiv) return;
  _dpAktiv.år += retning;
  dpRender();
}

function dpNaviger(retning) {
  if (!_dpAktiv) return;
  _dpAktiv.mnd += retning;
  if (_dpAktiv.mnd > 11) { _dpAktiv.mnd = 0; _dpAktiv.år++; }
  if (_dpAktiv.mnd < 0)  { _dpAktiv.mnd = 11; _dpAktiv.år--; }
  dpRender();
}

function dpVelg(dag) {
  if (!_dpAktiv) return;
  const { input, år, mnd } = _dpAktiv;
  const d = new Date(år, mnd, dag);
  const dd   = String(d.getDate()).padStart(2,'0');
  const mm   = String(d.getMonth()+1).padStart(2,'0');
  const yyyy = d.getFullYear();
  input.value = `${dd}.${mm}.${yyyy}`;
  dpLukk();
  autoFormatDato(input); // validerer og triggerBeregning
}

// Lukk ved klikk utenfor
document.addEventListener('click', e => {
  if (_dpAktiv && !e.target.closest('.dp-popup') && !e.target.closest('.dp-btn')) {
    dpLukk();
  }
});



function erGyldigDato(d) {
  return d instanceof Date && !isNaN(d.getTime());
}

function settDatoFeil(input, melding) {
  input.classList.add('dato-ugyldig');
  const feil = document.getElementById(input.id + '-feil');
  if (feil) { feil.textContent = melding; feil.style.display = 'block'; }
}

function fjernDatoFeil(input) {
  input.classList.remove('dato-ugyldig');
  const feil = document.getElementById(input.id + '-feil');
  if (feil) feil.style.display = 'none';
}

// Datoer som ikke bør ligge frem i tid
const DATO_IKKE_FREMTID = ['a-forfall', 'a-bo-dato', 'rn-fra'];

function autoFormatDato(input) {
  let val = input.value.replace(/\D/g, '');
  let formatted = null;

  if (val.length === 6) {
    formatted = val.slice(0,2) + '.' + val.slice(2,4) + '.20' + val.slice(4,6);
  } else if (val.length === 8) {
    formatted = val.slice(0,2) + '.' + val.slice(2,4) + '.' + val.slice(4,8);
  } else if (input.value.length === 10) {
    formatted = input.value; // allerede formatert
  } else {
    if (input.value.trim()) settDatoFeil(input, 'Fyll inn dato: dd.mm.åååå');
    return;
  }

  const dato = parseNO(formatted);
  if (!erGyldigDato(dato)) {
    input.value = formatted;
    settDatoFeil(input, 'Ugyldig dato');
    return;
  }

  // Sjekk om datoen er fremtidig der det ikke gir mening
  const iDag = new Date(); iDag.setHours(0,0,0,0);
  if (DATO_IKKE_FREMTID.includes(input.id) && dato > iDag) {
    input.value = formatted;
    settDatoFeil(input, 'Datoen kan ikke ligge frem i tid');
    return;
  }

  // Spesialvalidering for første forfall – kan ikke ligge i fortiden
  if (input.id === 'a-dato') {
    const iDag2 = new Date(); iDag2.setHours(0,0,0,0);
    if (dato < iDag2) {
      input.value = formatted;
      settDatoFeil(input, 'Første forfall kan ikke ligge i fortiden');
      return;
    }
  }
  if (input.id === 'a-iv-forfall') {
    const forfDato = parseNO(document.getElementById('a-forfall').value.trim());
    if (forfDato) {
      const minIVDato = new Date(forfDato);
      minIVDato.setDate(minIVDato.getDate() + 14);
      if (dato < forfDato) {
        input.value = formatted;
        settDatoFeil(input, 'IV kan ikke sendes før fakturaens forfallsdato');
        return;
      } else if (dato < minIVDato) {
        input.value = formatted;
        settDatoFeil(input, `Minimum 14 dager etter forfallsdato (tidligst ${formatDato(minIVDato)})`);
        return;
      }
    }
  }

  fjernDatoFeil(input);
  input.value = formatted;
  triggerBeregning(input);
}

function triggerBeregning(input) {
  const id = input.id;
  if (id === 'rn-fra' || id === 'rn-til') {
    beregnRenteFraDato();
  } else if (id === 'sim-startdato') {
    simBeregn();
  } else {
    beregnAvdrag();
  }
}

// Koble auto-format til alle datofelt ved oppstart
document.addEventListener('DOMContentLoaded', () => {
  // Musehjul på alle slidere
  document.querySelectorAll('input[type="range"]').forEach(slider => {
    slider.addEventListener('wheel', e => {
      e.preventDefault();
      const step = parseFloat(slider.step) || 1;
      const min  = parseFloat(slider.min)  || 0;
      const max  = parseFloat(slider.max);
      const retning = e.deltaY < 0 ? 1 : -1;
      const nyVerdi = Math.min(max, Math.max(min, parseFloat(slider.value) + retning * step));
      slider.value = nyVerdi;
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    }, { passive: false });
  });

  // Dato-felt: formater og valider på blur + legg til kalenderknapp
  document.querySelectorAll('input[placeholder="dd.mm.åååå"]').forEach(input => {
    // Wrap i dp-wrap
    const wrap = document.createElement('div');
    wrap.className = 'dp-wrap';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);

    // Kalenderknapp
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dp-btn';
    btn.textContent = '📅';
    btn.title = 'Velg dato';
    btn.onclick = (e) => { e.stopPropagation(); dpÅpne(input); };
    wrap.appendChild(btn);

    input.addEventListener('blur', () => autoFormatDato(input));
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') autoFormatDato(input);
      if (e.key === 'Escape') dpLukk();
    });
    input.addEventListener('input', () => fjernDatoFeil(input));
  });

  // Beløps-felt: live tusenskilletegn mens man skriver
  const belopIds = ['f-hovedstol','f-gebyr','f-renter','f-rettslige','f-direkte',
                    'a-hoofdstol','a-purregebyr','a-salar','a-tung-salar','a-rettslige','a-mnd-belop','rn-hoved'];
  belopIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener('input', () => {
      const cursorPos = el.selectionStart;
      const oldLen = el.value.length;

      // Bevar alt etter komma/punktum uendret – formater kun heltallsdelen
      const raw = el.value;
      const kommaIdx = raw.search(/[,\.]/);
      const heltallDel = kommaIdx >= 0 ? raw.slice(0, kommaIdx) : raw;
      const desimalDel = kommaIdx >= 0 ? raw.slice(kommaIdx) : '';

      // Kun sifrene i heltallsdelen
      const siffer = heltallDel.replace(/[^\d]/g, '');
      const formatted = siffer.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');

      el.value = formatted + desimalDel;

      // Bevar cursor-posisjon (juster for endring i lengde)
      const newLen = el.value.length;
      const newPos = Math.max(0, cursorPos + (newLen - oldLen));
      try { el.setSelectionRange(newPos, newPos); } catch(e) {}
    });

    el.addEventListener('blur', () => formatBelopFelt(el));
    el.addEventListener('focus', () => {
      const n = parseKr(el.value);
      if (n) el.value = String(n).replace('.', ',');
    });
  });

  const simSaldoEl = document.getElementById('sim-saldo');
  if (simSaldoEl) {
    simSaldoEl.addEventListener('blur', () => formatBelopFelt(simSaldoEl));
    simSaldoEl.addEventListener('focus', () => {
      const n = parseKr(simSaldoEl.value);
      if (n) simSaldoEl.value = String(n).replace('.', ',');
    });
  }
});

function formatBelopFelt(input) {
  const n = parseKr(input.value);
  if (!n && n !== 0) return;
  if (n === 0 && !input.value) return;
  input.value = n.toLocaleString('no-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ════════════════════════════════
   FORLIK
════════════════════════════════ */

function kopierTekst(tekst, melding) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(tekst)
      .then(() => alert(melding || 'Kopiert!'))
      .catch(() => kopierFallback(tekst, melding));
  } else {
    kopierFallback(tekst, melding);
  }
}

function kopierFallback(tekst, melding) {
  const el = document.createElement('textarea');
  el.value = tekst;
  el.style.position = 'fixed';
  el.style.opacity = '0';
  document.body.appendChild(el);
  el.focus();
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
  alert(melding || 'Kopiert!');
}

function visPstInput(sliderId, valId, min, max, callback) {
  const valEl = document.getElementById(valId);
  const slider = document.getElementById(sliderId);
  const current = parseInt(slider.value) || 0;

  // Erstatt badge midlertidig med et lite input-felt
  const inp = document.createElement('input');
  inp.type = 'number';
  inp.min = min;
  inp.max = max;
  inp.value = current;
  inp.style.cssText = `width:56px;font-family:'DM Mono',monospace;font-size:13px;font-weight:700;
    background:var(--ink);color:var(--accent);border:none;border-radius:4px;
    padding:1px 6px;text-align:center;outline:none;`;

  valEl.replaceWith(inp);
  inp.focus();
  inp.select();

  function bekreft() {
    let v = Math.min(max, Math.max(min, parseInt(inp.value) || 0));
    slider.value = v;
    // Gjenopprett badge
    const span = document.createElement('span');
    span.className = 'slider-value';
    span.id = valId;
    span.textContent = v + '%';
    span.title = 'Klikk for å skrive inn prosent';
    span.style.cursor = 'pointer';
    span.onclick = () => visPstInput(sliderId, valId, min, max, callback);
    inp.replaceWith(span);
    callback(v);
  }

  inp.addEventListener('blur', bekreft);
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); bekreft(); }
    if (e.key === 'Escape') {
      const span = document.createElement('span');
      span.className = 'slider-value';
      span.id = valId;
      span.textContent = current + '%';
      span.title = 'Klikk for å skrive inn prosent';
      span.style.cursor = 'pointer';
      span.onclick = () => visPstInput(sliderId, valId, min, max, callback);
      inp.replaceWith(span);
    }
  });
}

function nullstillTotalSlider() {
  document.getElementById('sl-total').value = 0;
  document.getElementById('sl-total-val').textContent = '0%';
}

function beregnTotalRabatt(pst) {
  pst = parseInt(pst);
  document.getElementById('sl-total-val').textContent = pst + '%';
  document.getElementById('f-direkte').value = '';

  const v = getForlikInput();
  const total = v.hoved + v.gebyr + v.renter + v.rettslig;
  if (!total) return;

  const proporsjonal = document.getElementById('f-proporsjonal')?.checked;

  if (proporsjonal) {
    // Proporsjonal: samme prosent på alle poster (rettslige alltid 0% rabatt)
    const pstRenter = v.renter  > 0 ? pst : 0;
    const pstSalar  = v.gebyr   > 0 ? pst : 0;
    const pstHoved  = v.hoved   > 0 ? Math.min(pst, parseInt(document.getElementById('sl-hoved').max)) : 0;

    document.getElementById('sl-renter').value = pstRenter;
    document.getElementById('sl-renter-val').textContent = pstRenter + '%';
    document.getElementById('sl-salar').value = pstSalar;
    document.getElementById('sl-salar-val').textContent = pstSalar + '%';
    document.getElementById('sl-hoved').value = pstHoved;
    document.getElementById('sl-hoved-val').textContent = pstHoved + '%';
  } else {
    // Standard: renter frafalles først, deretter salær, så evt. hovedstol
    const rabattKroner = total * (pst / 100);
    let rest = rabattKroner;

    const rabattRenter = Math.min(rest, v.renter); rest -= rabattRenter;
    const pstRenter = v.renter > 0 ? Math.round((rabattRenter / v.renter) * 100) : 0;

    const rabattSalar = Math.min(rest, v.gebyr); rest -= rabattSalar;
    const pstSalar = v.gebyr > 0 ? Math.round((rabattSalar / v.gebyr) * 100) : 0;

    const rabattHoved = Math.min(rest, v.hoved);
    const pstHoved = v.hoved > 0 ? Math.min(parseInt(document.getElementById('sl-hoved').max), Math.round((rabattHoved / v.hoved) * 100)) : 0;

    document.getElementById('sl-renter').value = pstRenter;
    document.getElementById('sl-renter-val').textContent = pstRenter + '%';
    document.getElementById('sl-salar').value = pstSalar;
    document.getElementById('sl-salar-val').textContent = pstSalar + '%';
    document.getElementById('sl-hoved').value = pstHoved;
    document.getElementById('sl-hoved-val').textContent = pstHoved + '%';
  }

  beregnForlik();
}

function getForlikInput() {
  return {
    hoved:    parseKr(document.getElementById('f-hovedstol').value) || 0,
    gebyr:    parseKr(document.getElementById('f-gebyr').value)     || 0,
    renter:   parseKr(document.getElementById('f-renter').value)    || 0,
    rettslig: parseKr(document.getElementById('f-rettslige').value) || 0,
  };
}

function beregnForlik() {
  // Hvis direkte-beløp er fylt inn, bruk den logikken
  const direkteVal = document.getElementById('f-direkte').value;
  if (direkteVal && !isNaN(parseFloat(direkteVal))) {
    beregnForlikDirekte();
    return;
  }

  const v = getForlikInput();
  const total = v.hoved + v.gebyr + v.renter + v.rettslig;

  const rabattSalar  = parseInt(document.getElementById('sl-salar').value)  / 100;
  const rabattRenter = parseInt(document.getElementById('sl-renter').value) / 100;
  const rabattHoved  = parseInt(document.getElementById('sl-hoved').value)  / 100;

  const nyGebyr    = v.gebyr    * (1 - rabattSalar);
  const nyRenter   = v.renter   * (1 - rabattRenter);
  const nyRettslig = v.rettslig;
  const nyHoved    = v.hoved    * (1 - rabattHoved);

  const forlik = nyHoved + nyGebyr + nyRenter + nyRettslig;
  const sparer = total - forlik;
  const hovedstolAvslag = Math.max(0, v.hoved - nyHoved);

  // Oppdater total-slideren basert på faktisk rabatt
  if (total > 0) {
    const totalPst = Math.round((sparer / total) * 100);
    document.getElementById('sl-total').value = totalPst;
    document.getElementById('sl-total-val').textContent = totalPst + '%';
  }

  visForlikResultat(v, total, forlik, sparer, nyHoved, nyGebyr, nyRenter, nyRettslig, hovedstolAvslag);
}

function beregnForlikDirekte() {
  const direkte = parseKr(document.getElementById('f-direkte').value);
  if (isNaN(direkte)) return;

  const v = getForlikInput();
  const total = v.hoved + v.gebyr + v.renter + v.rettslig;
  const sparer = total - direkte;
  const proporsjonal = document.getElementById('f-proporsjonal')?.checked;

  // Nullstill slidere
  ['sl-salar','sl-renter','sl-hoved'].forEach(id => {
    document.getElementById(id).value = 0;
    document.getElementById(id + '-val').textContent = '0%';
  });

  let nyHoved, nyGebyr, nyRenter, nyRettslig, hovedstolAvslag;
  nyRettslig = v.rettslig; // alltid fullt

  if (proporsjonal) {
    // Proporsjonal: fordel likt mellom renter, salær og hovedstol
    const fordelbar = v.hoved + v.gebyr + v.renter;
    const tilResterende = Math.max(0, direkte - v.rettslig);
    const andel = fordelbar > 0 ? Math.min(tilResterende / fordelbar, 1) : 0;
    nyRenter = Math.round(v.renter * andel * 100) / 100;
    nyGebyr  = Math.round(v.gebyr  * andel * 100) / 100;
    nyHoved  = Math.round(v.hoved  * andel * 100) / 100;
    hovedstolAvslag = Math.max(0, v.hoved - nyHoved);

    // Oppdater individuelle slidere med riktig prosent per post
    const pstRenter = v.renter > 0 ? Math.round((1 - andel) * 100) : 0;
    const pstSalar  = v.gebyr  > 0 ? Math.round((1 - andel) * 100) : 0;
    const pstHoved  = v.hoved  > 0 ? Math.min(Math.round((1 - andel) * 100), parseInt(document.getElementById('sl-hoved').max)) : 0;
    document.getElementById('sl-renter').value = pstRenter; document.getElementById('sl-renter-val').textContent = pstRenter + '%';
    document.getElementById('sl-salar').value  = pstSalar;  document.getElementById('sl-salar-val').textContent  = pstSalar  + '%';
    document.getElementById('sl-hoved').value  = pstHoved;  document.getElementById('sl-hoved-val').textContent  = pstHoved  + '%';
  } else {
    // Standard: rettslige alltid, renter og salær frafalles, evt. avslag på hoved
    const tilHovedstol = direkte - v.rettslig;
    nyRenter = 0;
    nyGebyr  = 0;
    nyHoved  = Math.max(0, Math.min(tilHovedstol, v.hoved));
    hovedstolAvslag = Math.max(0, v.hoved - nyHoved);

    // Oppdater individuelle slidere basert på faktisk reduksjon
    const pstRenter = v.renter > 0 ? 100 : 0;
    const pstSalar  = v.gebyr  > 0 ? 100 : 0;
    const pstHoved  = v.hoved  > 0 ? Math.min(Math.round((1 - nyHoved / v.hoved) * 100), parseInt(document.getElementById('sl-hoved').max)) : 0;
    document.getElementById('sl-renter').value = pstRenter; document.getElementById('sl-renter-val').textContent = pstRenter + '%';
    document.getElementById('sl-salar').value  = pstSalar;  document.getElementById('sl-salar-val').textContent  = pstSalar  + '%';
    document.getElementById('sl-hoved').value  = pstHoved;  document.getElementById('sl-hoved-val').textContent  = pstHoved  + '%';
  }

  visForlikResultat(v, total, direkte, sparer, nyHoved, nyGebyr, nyRenter, nyRettslig, hovedstolAvslag);

  // Oppdater total-slideren
  if (total > 0) {
    const totalPst = Math.round((sparer / total) * 100);
    document.getElementById('sl-total').value = totalPst;
    document.getElementById('sl-total-val').textContent = totalPst + '%';
  }
}

function visForlikResultat(v, total, forlik, sparer, nyHoved, nyGebyr, nyRenter, nyRettslig, hovedstolAvslag = 0) {
  // Lagre beregnede verdier for bruk i kopierForlik
  window._forlikData = { v, total, forlik, sparer, nyHoved, nyGebyr, nyRenter, nyRettslig };
  document.getElementById('r-forlik').textContent = kr(forlik);
  document.getElementById('r-forlik-sub').textContent = pst(forlik, total) + ' av totalkrav';
  document.getElementById('r-sparer').textContent = kr(Math.max(0, sparer));
  document.getElementById('r-sparer-pst').textContent = pst(Math.max(0, sparer), total) + ' av totalkrav';
  document.getElementById('r-total').textContent = kr(total);

  const bd = document.getElementById('breakdown-forlik');

  // Advarsel hvis avslag på hovedstol
  let varselHtml = '';
  if (hovedstolAvslag > 0.01) {
    varselHtml = `<div class="varsel varsel-feil">
      ⚠ <strong>OBS: Forliket innebærer avslag på hovedstol med ${kr(hovedstolAvslag)}.</strong>
      Dette er kreditors penger – sørg for at dette er godkjent før forlik inngås.
    </div>`;
  }

  const rader = [
    { label: 'Renter',                             orig: v.renter,   ny: nyRenter  !== null ? nyRenter  : v.renter  },
    { label: 'Inkassogebyr/salær',                 orig: v.gebyr,    ny: nyGebyr   !== null ? nyGebyr   : v.gebyr   },
    { label: 'Rettslige kostnader',                orig: v.rettslig, ny: nyRettslig !== null ? nyRettslig : v.rettslig },
    { label: 'Hovedstol',                          orig: v.hoved,    ny: nyHoved   !== null ? nyHoved   : v.hoved   },
  ];

  let html = varselHtml;
  rader.forEach(r => {
    if (!r.orig) return;
    const frafallt = r.orig - r.ny;
    const redusert = frafallt > 0.01;
    if (redusert) {
      html += `<div class="breakdown-row striked">
        <span class="breakdown-label">${r.label}</span>
        <span>
          <span class="breakdown-amount">${kr(r.orig)}</span>
          <span class="breakdown-savings">→ ${kr(r.ny)} (−${kr(frafallt)})</span>
        </span>
      </div>`;
    } else {
      html += `<div class="breakdown-row">
        <span class="breakdown-label">${r.label}</span>
        <span class="breakdown-amount">${kr(r.ny)}</span>
      </div>`;
    }
  });

  html += `<div class="breakdown-row total">
    <span class="breakdown-label">Forliksbeløp</span>
    <span class="breakdown-amount">${kr(forlik)}</span>
  </div>`;

  bd.innerHTML = html;

  autolagreSak();
}

function kopierForlik() {
  const d = window._forlikData;
  if (!d) { alert('Beregn forlik først.'); return; }

  const { v, total, forlik, sparer, nyHoved, nyGebyr, nyRenter, nyRettslig } = d;

  const tekst =
    `FORLIKSFORSLAG\n` +
    `─────────────────────────\n` +
    `Totalkrav:       ${kr(total)}\n` +
    `Forliksbeløp:    ${kr(forlik)}\n` +
    `Reduksjon:       ${kr(Math.max(0, sparer))} (${pst(Math.max(0, sparer), total)})\n` +
    `─────────────────────────\n` +
    `Oversikt:\n` +
    (v.renter   ? `  Renter:               ${kr(nyRenter ?? v.renter)}${nyRenter !== null && nyRenter < v.renter ? ` (av ${kr(v.renter)})` : ''}\n` : '') +
    (v.gebyr    ? `  Inkassogebyr/salær:   ${kr(nyGebyr  ?? v.gebyr)} ${nyGebyr  !== null && nyGebyr  < v.gebyr  ? ` (av ${kr(v.gebyr)})` : ''}\n` : '') +
    (v.rettslig ? `  Rettslige kostnader:  ${kr(nyRettslig ?? v.rettslig)}\n` : '') +
    (v.hoved    ? `  Hovedstol:            ${kr(nyHoved  ?? v.hoved)} ${nyHoved  !== null && nyHoved  < v.hoved  ? ` (av ${kr(v.hoved)})` : ''}\n` : '');

  kopierTekst(tekst, 'Forliksforslag kopiert!');
}

function kopierEpostForlik() {
  const d = window._forlikData;
  if (!d) { alert('Beregn forlik først.'); return; }

  const { v, total, forlik } = d;

  // Frist: 14 dager fra i dag
  const frist = new Date();
  frist.setDate(frist.getDate() + 14);
  const fristStr = formatDato(frist);

  // Avdragsalternativ: 4 avdrag basert på totalkrav (uten reduksjon)
  const avdrag4 = Math.ceil(total / 4);

  const kontonummer = document.getElementById('f-kontonummer')?.value.trim();
  const kid         = document.getElementById('f-kid')?.value.trim();

  const betalingsinfo = kontonummer
    ? `Betales til konto ${kontonummer}${kid ? ` med KID ${kid}` : ''}.`
    : '';

  const tekst =
`Hei,

Vi kan tilby følgende løsning i saken:

Total saldo: ${kr(total)}

Dersom ${kr(forlik)} innbetales innen ${fristStr} vil saken anses oppgjort i sin helhet.
${betalingsinfo ? betalingsinfo + '\n' : ''}
Alternativt kan vi inngå en avdragsordning på kravet.

Ta kontakt dersom dette er aktuelt.

Med vennlig hilsen`;

  kopierTekst(tekst, 'E-posttekst kopiert!');
}


function toggleHovedstolMaks() {
  const slider  = document.getElementById('sl-hoved');
  const btn     = document.getElementById('sl-hoved-unlock');
  const marks   = document.getElementById('sl-hoved-marks');
  const låstOpp = slider.max === '100';

  if (låstOpp) {
    slider.max = 50;
    if (parseInt(slider.value) > 50) { slider.value = 50; document.getElementById('sl-hoved-val').textContent = '50%'; }
    btn.textContent   = '🔓 Opp til 100%';
    btn.style.color   = 'var(--text-muted)';
    marks.innerHTML   = '<span>0%</span><span>25%</span><span>50%</span>';
  } else {
    slider.max = 100;
    btn.textContent   = '🔒 Begrens til 50%';
    btn.style.color   = 'var(--high)';
    marks.innerHTML   = '<span>0%</span><span>50%</span><span>100%</span>';
  }
  beregnForlik();
}

function toggleProporsjonal() {
  const aktiv = document.getElementById('f-proporsjonal').checked;
  if (!aktiv) {
  }
  const pst = document.getElementById('sl-total').value;
  if (parseInt(pst) > 0) {
    beregnTotalRabatt(pst);
  } else {
    beregnForlik();
  }
}

function _proporsjonalData() {
  const hoved    = parseKr(document.getElementById('f-hovedstol').value) || 0;
  const gebyr    = parseKr(document.getElementById('f-gebyr').value)     || 0;
  const renter   = parseKr(document.getElementById('f-renter').value)    || 0;
  const rettslig = parseKr(document.getElementById('f-rettslige').value) || 0;
  const tilbyr   = parseKr(document.getElementById('f-direkte').value)   || 0;
  const total    = hoved + gebyr + renter + rettslig;
  const fordelbar = hoved + gebyr + renter;
  return { hoved, gebyr, renter, rettslig, tilbyr, total, fordelbar };
}



function fyllFraAvdrag(mål) {
  const hovedstol  = parseKr(document.getElementById('a-hovedstol').value) || 0;
  const salar      = parseKr(document.getElementById('a-salar').value)      || 0;
  const tungSalar  = parseKr(document.getElementById('a-tung-salar').value) || 0;
  const rettslige  = parseKr(document.getElementById('a-rettslige').value)  || 0;
  const purregebyr = parseKr(document.getElementById('a-purregebyr').value) || 0;
  const forfallStr = document.getElementById('a-forfall').value.trim();

  const effektivSalar = tungSalar > 0 ? tungSalar : salar;
  const renter = window._avdragsMeta
    ? window._avdragsMeta.startSaldoRenter || 0
    : 0;

  if (!hovedstol) {
    alert('Fyll inn kravets poster i Avdragsplan-fanen først.');
    return false;
  }

  if (mål === 'forlik') {
    document.getElementById('f-hovedstol').value = String(hovedstol).replace('.', ',');
    document.getElementById('f-gebyr').value      = String(effektivSalar).replace('.', ',');
    document.getElementById('f-renter').value     = String(Math.round(renter * 100) / 100).replace('.', ',');
    document.getElementById('f-rettslige').value  = String(rettslige + purregebyr).replace('.', ',');
    ['f-hovedstol','f-gebyr','f-renter','f-rettslige'].forEach(id => {
      const el = document.getElementById(id);
      if (el) formatBelopFelt(el);
    });
    beregnForlik();

  } else if (mål === 'simulator') {
    const totalSaldo = hovedstol + effektivSalar + rettslige + purregebyr + renter;
    const el = document.getElementById('sim-saldo');
    el.value = String(Math.round(totalSaldo)).replace('.', ',');
    formatBelopFelt(el);
    simOppdaterSaldo(el);

  } else if (mål === 'rente') {
    document.getElementById('rn-hoved').value = String(hovedstol).replace('.', ',');
    const el = document.getElementById('rn-hoved');
    if (el) formatBelopFelt(el);
    // Fyll fra-dato fra fakturaens forfallsdato hvis tilgjengelig
    if (forfallStr) {
      document.getElementById('rn-fra').value = forfallStr;
      fjernDatoFeil(document.getElementById('rn-fra'));
    }
    beregnRente();
  }

  return true;
}

function nullstillForlik() {
  ['f-hovedstol','f-gebyr','f-renter','f-rettslige','f-direkte','f-tilbyr','f-kontonummer','f-kid'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  ['sl-total','sl-salar','sl-renter','sl-hoved'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = 0;
    const val = document.getElementById(id + '-val'); if (val) val.textContent = '0%';
  });
  document.getElementById('breakdown-forlik').innerHTML = '';
  ['r-forlik','r-sparer','r-total'].forEach(id => {
    document.getElementById(id).textContent = 'kr 0';
  });
  document.getElementById('r-forlik-sub').textContent = '–';
  document.getElementById('r-sparer-pst').textContent = '0% av totalkrav';
  const propChk = document.getElementById('f-proporsjonal'); if (propChk) propChk.checked = false;
  const sl = document.getElementById('sl-hoved'); if (sl) sl.max = 50;
  const btn = document.getElementById('sl-hoved-unlock'); if (btn) { btn.textContent = '🔓 Opp til 100%'; btn.style.color = 'var(--text-muted)'; }
  const marks = document.getElementById('sl-hoved-marks'); if (marks) marks.innerHTML = '<span>0%</span><span>25%</span><span>50%</span>';
}

/* ════════════════════════════════
   AVDRAG
════════════════════════════════ */

// Avdragssalær = 1,5 × inkassosatsen
// Kreditor med fradragsrett: 1,5 × 750 = 1 125
// Kreditor uten fradragsrett: (1,5 × 750) + 25% MVA = 1 406,25
const INKASSOSATS = 750; // Finanstilsynet – oppdater ved endring

function beregnAvdragsgebyr() {
  const mva = document.getElementById('a-mva')?.value || 'nei';
  const grunnlag = INKASSOSATS * 1.5;
  return Math.round((mva === 'nei' ? grunnlag * 1.25 : grunnlag) * 100) / 100;
}
// Forfallsdato på BO = BO-dato + 14 dager, forskyves til neste virkedag (§ 2-3)
// Tungt salær påløper forfallsdato + 28 dager (ingen justering – kan falle på helg/helligdag)
const BO_BETALINGSFRIST = 14;
const BO_OVERSITTELSE = 28;

/* ════════════════════════════════
   HELLIGDAGER OG UKEDAG-JUSTERING
════════════════════════════════ */

function norskHelligdag(dato) {
  const d = new Date(dato); d.setHours(0,0,0,0);
  const år = d.getFullYear();
  const md = d.getMonth() * 100 + d.getDate(); // måneds-dag som tall

  // Faste helligdager
  const faste = [101, 501, 517, 1225, 1226]; // nyttår, 1.mai, 17.mai, 1.juledag, 2.juledag
  if (faste.includes(md)) return true;

  // Påske – beregn via Gauß-algoritmen
  function paaskeDate(y) {
    const a = y % 19, b = Math.floor(y/100), c = y % 100;
    const d = Math.floor(b/4), e = b % 4;
    const f = Math.floor((b+8)/25), g = Math.floor((b-f+1)/3);
    const h = (19*a + b - d - g + 15) % 30;
    const i = Math.floor(c/4), k = c % 4;
    const l = (32 + 2*e + 2*i - h - k) % 7;
    const m = Math.floor((a + 11*h + 22*l) / 451);
    const mnd = Math.floor((h + l - 7*m + 114) / 31) - 1;
    const dag = ((h + l - 7*m + 114) % 31) + 1;
    return new Date(y, mnd, dag);
  }

  const paaskedag = paaskeDate(år);
  const helligPaaskedager = [-3, -2, -1, 0, 1, 39, 49, 50]; // skjærtorsdag–2.pinsedag
  for (const offset of helligPaaskedager) {
    const hd = new Date(paaskedag);
    hd.setDate(paaskedag.getDate() + offset);
    if (hd.toDateString() === d.toDateString()) return true;
  }
  return false;
}

function nesteUkedag(dato) {
  const d = new Date(dato); d.setHours(0,0,0,0);
  while (d.getDay() === 0 || d.getDay() === 6 || norskHelligdag(d)) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}


/* ════════════════════════════════
   FORSINKELSESRENTE – historiske satser
   Kilde: Finanstilsynet
   Oppdater RENTE_SATSER når nye satser publiseres (1. jan og 1. jul hvert år)
════════════════════════════════ */

const RENTE_SATSER = [
  { fra: new Date(1994,  0,  1), sats: 12.00 },
  { fra: new Date(2004,  0,  1), sats:  9.25 },
  { fra: new Date(2004,  6,  1), sats:  8.75 },
  { fra: new Date(2005,  0,  1), sats:  8.75 },
  { fra: new Date(2005,  6,  1), sats:  9.00 },
  { fra: new Date(2006,  0,  1), sats:  9.25 },
  { fra: new Date(2006,  6,  1), sats:  9.75 },
  { fra: new Date(2007,  0,  1), sats: 10.50 },
  { fra: new Date(2007,  6,  1), sats: 11.50 },
  { fra: new Date(2008,  0,  1), sats: 12.25 },
  { fra: new Date(2008,  6,  1), sats: 12.75 },
  { fra: new Date(2009,  0,  1), sats: 10.00 },
  { fra: new Date(2009,  6,  1), sats:  8.25 },
  { fra: new Date(2010,  0,  1), sats:  8.75 },
  { fra: new Date(2010,  6,  1), sats:  9.00 },
  { fra: new Date(2011,  0,  1), sats:  9.00 },
  { fra: new Date(2011,  6,  1), sats:  9.25 },
  { fra: new Date(2012,  0,  1), sats:  8.75 },
  { fra: new Date(2012,  6,  1), sats:  8.50 },
  { fra: new Date(2013,  0,  1), sats:  8.50 },
  { fra: new Date(2013,  6,  1), sats:  9.50 },
  { fra: new Date(2014,  0,  1), sats:  9.50 },
  { fra: new Date(2014,  6,  1), sats:  9.50 },
  { fra: new Date(2015,  0,  1), sats:  9.25 },
  { fra: new Date(2015,  6,  1), sats:  9.00 },
  { fra: new Date(2016,  0,  1), sats:  8.75 },
  { fra: new Date(2016,  6,  1), sats:  8.50 },
  { fra: new Date(2017,  0,  1), sats:  8.50 },
  { fra: new Date(2017,  6,  1), sats:  8.50 },
  { fra: new Date(2018,  0,  1), sats:  8.50 },
  { fra: new Date(2018,  6,  1), sats:  8.50 },
  { fra: new Date(2019,  0,  1), sats:  8.75 },
  { fra: new Date(2019,  6,  1), sats:  9.25 },
  { fra: new Date(2020,  0,  1), sats:  9.50 },
  { fra: new Date(2020,  6,  1), sats:  8.00 },
  { fra: new Date(2021,  0,  1), sats:  8.00 },
  { fra: new Date(2021,  6,  1), sats:  8.00 },
  { fra: new Date(2022,  0,  1), sats:  8.50 },
  { fra: new Date(2022,  6,  1), sats:  9.25 },
  { fra: new Date(2023,  0,  1), sats: 10.75 },
  { fra: new Date(2023,  6,  1), sats: 11.75 },
  { fra: new Date(2024,  0,  1), sats: 12.50 },
  { fra: new Date(2024,  6,  1), sats: 12.50 },
  { fra: new Date(2025,  0,  1), sats: 12.50 },
  { fra: new Date(2025,  6,  1), sats: 12.25 },
  { fra: new Date(2026,  0,  1), sats: 12.00 },
  // ↑ Legg til nye satser her når Finanstilsynet publiserer dem
];

/** Henter rentesats for en gitt dato */
function rentesatsForDato(dato) {
  let sats = RENTE_SATSER[0].sats;
  for (const r of RENTE_SATSER) {
    if (dato >= r.fra) sats = r.sats;
    else break;
  }
  return sats;
}

/**
 * Beregner renter med korrekte halvårlige satser.
 * Splitter perioden ved hver 1. jan og 1. jul.
 * Returnerer { totalRente, perioder: [{fra, til, dager, sats, rente}] }
 */
function beregnRenterMedSatser(beloep, fraDato, tilDato) {
  if (!fraDato || !tilDato || tilDato <= fraDato || beloep <= 0) {
    return { totalRente: 0, perioder: [] };
  }

  const perioder = [];
  let gjeldende = new Date(fraDato);

  while (gjeldende < tilDato) {
    // Finn neste skjæringspunkt (1. jan eller 1. jul)
    const year = gjeldende.getFullYear();
    const kandidater = [
      new Date(year,  6, 1),   // 1. jul samme år
      new Date(year + 1, 0, 1) // 1. jan neste år
    ].filter(d => d > gjeldende);

    const nesteSplitt = kandidater.reduce((a, b) => a < b ? a : b);
    const periodeSlutt = nesteSplitt < tilDato ? nesteSplitt : tilDato;

    const dager = dagMellom(gjeldende, periodeSlutt);
    const sats  = rentesatsForDato(gjeldende);
    const rente = beloep * (sats / 100) * (dager / 365);

    perioder.push({ fra: new Date(gjeldende), til: new Date(periodeSlutt), dager, sats, rente });
    gjeldende = new Date(periodeSlutt);
  }

  const totalRente = perioder.reduce((s, p) => s + p.rente, 0);
  return { totalRente, perioder };
}

/** Daglig rente for gjeldende dato (brukes i avdragsplan) */
function dagligRenteNaa() {
  const iDag = new Date();
  return rentesatsForDato(iDag) / 100 / 365;
}

/** Daglig rente for en gitt dato */
function dagligRenteForDato(dato) {
  return rentesatsForDato(dato) / 100 / 365;
}

// Satser fra Finanstilsynet 2026
// Struktur: { grense, forbruker_ja, forbruker_nei, naring_ja, naring_nei }
// Verdiene er [lett, tungt]
const SALAR_SATSER = [
  { grense:    500, fja: [187.50,  375],    fnei: [234.38,  468.75], nja: [281.25,  562.50], nnei: [351.56,  703.13] },
  { grense:   1000, fja: [262.50,  525],    fnei: [328.13,  656.25], nja: [393.75,  787.50], nnei: [492.19,  984.38] },
  { grense:   2500, fja: [300,     600],    fnei: [375,     750],    nja: [450,     900],    nnei: [562.50, 1125]    },
  { grense:  10000, fja: [600,    1200],    fnei: [750,    1500],    nja: [900,    1800],    nnei: [1125,   2250]    },
  { grense:  50000, fja: [1200,   2400],    fnei: [1500,   3000],    nja: [1800,   3600],    nnei: [2250,   4500]    },
  { grense: 250000, fja: [2700,   5400],    fnei: [3375,   6750],    nja: [4050,   8100],    nnei: [5062.50,10125]   },
  { grense: Infinity, fja:[5400, 10800],    fnei: [6750,  13500],    nja: [8100,  16200],    nnei: [10125, 20250]    },
];

function hentSalar(hovedstol) {
  const skyldner = document.getElementById('a-skyldner').value;
  const mva      = document.getElementById('a-mva').value;
  const key      = skyldner === 'forbruker' ? (mva === 'ja' ? 'fja' : 'fnei')
                                            : (mva === 'ja' ? 'nja' : 'nnei');
  for (const rad of SALAR_SATSER) {
    if (hovedstol <= rad.grense) return { lett: rad[key][0], tungt: rad[key][1] };
  }
  const siste = SALAR_SATSER[SALAR_SATSER.length - 1];
  return { lett: siste[key][0], tungt: siste[key][1] };
}

function oppdaterAvdragssalar(pst) {
  pst = parseInt(pst);
  const maks = beregnAvdragsgebyr();
  document.getElementById('sl-avdragssalar-val').textContent = pst + '%';
  document.getElementById('sl-avdragssalar').value = pst;
  beregnAvdrag();
}

function validerPurregebyr() {
  const beloep    = parseKr(document.getElementById('a-purregebyr').value) || 0;
  const skyldner  = document.getElementById('a-skyldner').value;
  const varsel    = document.getElementById('a-purregebyr-varsel');
  if (!varsel) return;

  const maks = skyldner === 'naring' ? 460 : 76;
  const type = skyldner === 'naring' ? 'næringsdrivende' : 'privatperson';

  if (beloep > maks) {
    varsel.style.display = 'block';
    varsel.textContent   = `⚠ Maks purregebyr/standardkompensasjon for ${type} er kr ${maks}`;
  } else {
    varsel.style.display = 'none';
  }
}

function oppdaterFoerBO() {
  const forfDato     = parseNO(document.getElementById('a-forfall').value.trim());
  const ivForfallStr = document.getElementById('a-iv-forfall').value.trim();
  const ivForfallDato = parseNO(ivForfallStr) || forfDato;
  const boDato       = parseNO(document.getElementById('a-bo-dato').value.trim());
  const iDag         = new Date(); iDag.setHours(0,0,0,0);
  const boIkkeSendt  = document.getElementById('a-bo-ikke-sendt').checked;

  // Valideringen av IV-forfallsdato skjer i autoFormatDato

  const panel = document.getElementById('foer-bo-panel');
  if (!panel) { beregnAvdrag(); return; }

  if (boIkkeSendt) {
    panel.style.display = 'block';

    const ivForfalt = ivForfallDato && ivForfallDato <= iDag;

    document.getElementById('foer-bo-iv-ikke-forfalt').style.display = ivForfalt ? 'none' : 'block';
    document.getElementById('foer-bo-iv-forfalt').style.display      = ivForfalt ? 'block' : 'none';
    document.getElementById('foer-bo-salar-dato-wrap').style.display = ivForfalt ? 'block' : 'none';

    // Scenario 1: vis under/over 2500-panel
    if (!ivForfalt) {
      const hovedstol = parseKr(document.getElementById('a-hovedstol').value) || 0;
      const under2500 = document.getElementById('foer-bo-under-2500');
      const over2500  = document.getElementById('foer-bo-over-2500');
      if (under2500) under2500.style.display = (hovedstol > 0 && hovedstol < 2500) ? 'block' : 'none';
      if (over2500)  over2500.style.display  = (hovedstol >= 2500) ? 'block' : 'none';
    }

    if (!ivForfalt && ivForfallDato) {
      document.getElementById('foer-bo-forfall-dato').textContent = formatDato(ivForfallDato);
    }
  } else {
    panel.style.display = 'none';
  }

  // Vis purregebyr og IV-forfallsdato kun når BO ikke er sendt
  const purregebyrWrap = document.getElementById('a-purregebyr-wrap');
  const ivForfallWrap  = document.getElementById('a-iv-forfall-wrap');
  if (purregebyrWrap) purregebyrWrap.style.display = boIkkeSendt ? 'block' : 'none';
  if (ivForfallWrap)  ivForfallWrap.style.display  = boIkkeSendt ? 'block' : 'none';
  if (!boIkkeSendt) {
    const purregebyrEl = document.getElementById('a-purregebyr');
    const ivForfallEl  = document.getElementById('a-iv-forfall');
    if (purregebyrEl) purregebyrEl.value = '';
    if (ivForfallEl)  ivForfallEl.value  = '';
  }

  const boDatoEl = document.getElementById('a-bo-dato');
  if (boIkkeSendt) {
    boDatoEl.value = '';
    boDatoEl.disabled = true;
    boDatoEl.style.opacity = '0.4';
  } else {
    boDatoEl.disabled = false;
    boDatoEl.style.opacity = '1';
  }

  beregnAvdrag();
}

function oppdaterSalar() {
  const hovedstol = parseKr(document.getElementById('a-hovedstol').value) || 0;
  if (hovedstol > 0) {
    const s = hentSalar(hovedstol);
    // Lett salær settes alltid
    document.getElementById('a-salar').value = s.lett;
    // Tungt salær er totalt salær (erstatter lett) – sett begge felt
    const tungInput = document.getElementById('a-tung-salar');
    if (tungInput && document.getElementById('tung-salar-wrap').style.display !== 'none') {
      tungInput.value = s.tungt;
    }
    const tungFremtidig = document.getElementById('a-tung-salar-fremtidig');
    if (tungFremtidig && document.getElementById('tung-salar-fremtidig').style.display !== 'none') {
      tungFremtidig.value = s.tungt;
    }
  }
  validerPurregebyr();
  beregnAvdrag();
}

function synkMndBelop(kilde) {
  const hovedstol = parseKr(document.getElementById('a-hovedstol').value) || 0;
  if (!hovedstol) { beregnAvdrag(); return; }
  const mndEl   = document.getElementById('a-mnd');
  const belopEl = document.getElementById('a-mnd-belop');
  if (kilde === 'mnd') {
    // Nullstill terminer kun hvis antall måneder endres
    const nyMnd = parseInt(mndEl.value) || 0;
    const gammeltMnd = window._avdragsTerminer?.length || 0;
    if (nyMnd !== gammeltMnd) window._avdragsTerminer = null;
    belopEl.value = '';
    belopEl.dataset.beregnet = '0';
    mndEl.dataset.beregnet = '0';
    beregnAvdrag();
  } else {
    // Beløp endret – ikke null terminer, bevar manuelle beløp
    mndEl.value = '';
    mndEl.dataset.beregnet = '0';
    belopEl.dataset.beregnet = '0';
    beregnAvdrag();
  }
}

function beregnAvdrag() {
  const mndEl   = document.getElementById('a-mnd');
  const belopEl = document.getElementById('a-mnd-belop');
  if (!mndEl || !belopEl) return;
  const hovedstol  = parseKr(document.getElementById('a-hovedstol').value) || 0;
  const lettSalar  = parseKr(document.getElementById('a-salar').value)      || 0;
  const purregebyr    = parseKr(document.getElementById('a-purregebyr').value) || 0;
  const rettsligeRaw = parseKr(document.getElementById('a-rettslige').value) || 0;
  const rettslige    = rettsligeRaw + purregebyr;
  const mndInput   = parseInt(mndEl.value)      || 0;
  const belopInput = parseKr(belopEl.value)     || 0;
  const forfallStr    = document.getElementById('a-forfall').value.trim();
  const ivForfallStr  = document.getElementById('a-iv-forfall').value.trim();
  const boStr         = document.getElementById('a-bo-dato').value.trim();
  const datoStr       = document.getElementById('a-dato').value.trim();
  const dekning       = document.getElementById('a-dekning').value;

  const iDag = new Date(); iDag.setHours(0,0,0,0);
  const boDato       = parseNO(boStr);
  const forfDato     = parseNO(forfallStr);           // fakturadato – brukes til renteberegning
  const ivForfallDato = parseNO(ivForfallStr) || forfDato; // IV-forfall – brukes til foerBO-logikk

  // ── Tungt salær: automatisk basert på BO ──
  let tungPalopDato   = null;
  let tungPaloppt     = false;
  let tungSalar       = 0;

  if (boDato) {
    // Forfallsdato på BO = BO-dato + 14 dager, forskyves til neste virkedag
    const boForfall = new Date(boDato);
    boForfall.setDate(boForfall.getDate() + BO_BETALINGSFRIST);
    const boForfallJustert = nesteUkedag(boForfall);

    // Tungt salær: forfallsdato oversittet med mer enn 28 dager (ingen helg-justering)
    tungPalopDato = new Date(boForfallJustert);
    tungPalopDato.setDate(tungPalopDato.getDate() + BO_OVERSITTELSE + 1);
    tungPaloppt = iDag >= tungPalopDato;
  }

  // Auto-fyll tungt salær fra satsene hvis hovedstol er satt
  if (hovedstol > 0) {
    const satser = hentSalar(hovedstol);
    if (tungPaloppt) {
      const el = document.getElementById('a-tung-salar');
      if (el && !el.value) el.value = satser.tungt;
    } else if (boDato) {
      const el = document.getElementById('a-tung-salar-fremtidig');
      if (el && !el.value) el.value = satser.tungt;
    }
  }

  // Vis/skjul tungt salær UI
  document.getElementById('tung-salar-wrap').style.display     = tungPaloppt ? 'block' : 'none';
  document.getElementById('tung-salar-fremtidig').style.display = (boDato && !tungPaloppt) ? 'block' : 'none';

  if (boDato && !tungPaloppt && tungPalopDato) {
    document.getElementById('tung-salar-dato').textContent = formatDato(tungPalopDato);
    tungSalar = parseKr(document.getElementById('a-tung-salar-fremtidig').value) || 0;
  } else if (tungPaloppt) {
    tungSalar = parseKr(document.getElementById('a-tung-salar').value) || 0;
  }

  // ── IV ikke forfalt: ingen salær, kun purregebyr ──
  // IV ikke forfalt: kun relevant hvis forfallsdato er gyldig og ikke i fremtiden for fakturaen
  const forfDatoGyldig = forfDato && forfDato <= iDag;
  const ivIkkeForfalt = forfDatoGyldig && ivForfallDato && ivForfallDato > iDag;
  const salarWrap = document.getElementById('inkasso-salar-wrap');
  if (salarWrap) salarWrap.style.display = ivIkkeForfalt ? 'none' : 'block';

  // Sett varsel dersom IV ikke har forfalt
  const ivVarselEl = document.getElementById('iv-ikke-forfalt-varsel');
  if (ivVarselEl) ivVarselEl.style.display = ivIkkeForfalt ? 'block' : 'none';

  // Effektivt salær = 0 hvis IV ikke har forfalt ennå
  const effektivLettSalar = ivIkkeForfalt ? 0 : lettSalar;
  const boIkkeSendtTidlig = document.getElementById('a-bo-ikke-sendt')?.checked;
  const foerBOTidlig = boIkkeSendtTidlig;

  if (!hovedstol || (!mndInput && !belopInput && !foerBOTidlig)) {
    document.getElementById('avdrag-summary').innerHTML =
      '<span style="color:var(--text-muted)">Fyll inn hovedstol og antall måneder eller månedlig beløp.</span>';
    document.getElementById('avdrag-tabell-panel').style.display = 'none';
    return;
  }

  // ── Renter på hovedstol fra forfallsdato til i dag (med historiske satser) ──
  let rentHovedstolIdag = 0;
  let dagerHovedstol    = 0;
  if (forfDato && forfDato < iDag) {
    dagerHovedstol = dagMellom(forfDato, iDag);
    const r = beregnRenterMedSatser(hovedstol, forfDato, iDag);
    rentHovedstolIdag = r.totalRente;
  }

  // ── Renter på inkassosalær (lett) ──
  // Fra BO+14 dager hvis BO er satt, ellers fra forfallsdato+14 dager (IV-fristen)
  let rentSalarIdag = 0;
  let rentSalarFraDato = null;
  if (effektivLettSalar > 0) {
    if (boDato) {
      rentSalarFraDato = new Date(boDato);
      rentSalarFraDato.setDate(rentSalarFraDato.getDate() + 14);
    } else if (forfDato) {
      rentSalarFraDato = new Date(forfDato);
      rentSalarFraDato.setDate(rentSalarFraDato.getDate() + 14);
    }
    if (rentSalarFraDato && rentSalarFraDato < iDag) {
      rentSalarIdag = beregnRenterMedSatser(effektivLettSalar, rentSalarFraDato, iDag).totalRente;
    }
  }

  // ── Renter på tungt salær (fra påløpsdato til i dag hvis påløpt) ──
  // Tungt erstatter lett – legg til differansen i renter fra tungt påløpsdato
  let rentTungIdag = 0;
  if (tungPaloppt && tungSalar > 0 && tungPalopDato < iDag) {
    rentTungIdag = beregnRenterMedSatser(tungSalar, tungPalopDato, iDag).totalRente;
    // Trekk fra renter av lett salær etter tungt påløp (de er erstattet)
    if (rentSalarFraDato) {
      const rentLettEtterTung = beregnRenterMedSatser(effektivLettSalar, tungPalopDato, iDag).totalRente;
      rentTungIdag -= rentLettEtterTung;
    }
  }

  // Samlet renter av inkassosalær (lett + tungt er samme krav, ikke separat)
  const rentSalarTotaltIdag = rentSalarIdag + rentTungIdag;

  const mndBeregnet   = mndEl.dataset.beregnet === '1';
  const belopBeregnet = belopEl.dataset.beregnet === '1';

  // ── Avdragssalær – vis varsel ved ≥5, respekter fritak ──
  let mnd, fastMndBelop;
  if (belopInput && !belopBeregnet) {
    // Beløp er manuelt tastet – beregn antall måneder
    fastMndBelop = belopInput;
    mnd          = null;
  } else if (mndInput && !mndBeregnet) {
    // Antall måneder er manuelt tastet – beregn terminbeløp
    mnd          = mndInput;
    fastMndBelop = null;
  } else if (mndInput) {
    // Begge er beregnet – bruk antall måneder
    mnd          = mndInput;
    fastMndBelop = null;
  } else if (!foerBOTidlig) {
    return;
  }

  // ── Avdragsavtale før BO: begrens til maks 4 avdrag, krev 25% første avdrag ──
  const ivForfalt = ivForfallDato && ivForfallDato < iDag;
  const ivIkkeForfaltFoerBO = foerBOTidlig && ivForfallDato && ivForfallDato >= iDag;
  const boIkkeSendt = boIkkeSendtTidlig;
  const foerBO    = boIkkeSendt;
  const foerBOVarsel = document.getElementById('foer-bo-varsel');
  const foerBOTekst  = document.getElementById('foer-bo-varsel-tekst');

  if (foerBO) {
    // Maks avdrag: 3 hvis IV ikke forfalt (25% + 3 avdrag), 4 hvis IV forfalt
    const maksAvdrag = ivIkkeForfaltFoerBO ? 3 : 4;

    if (!mnd && !fastMndBelop) {
      mnd = maksAvdrag;
      mndEl.value = maksAvdrag;
      mndEl.dataset.beregnet = '1';
      fastMndBelop = null;
    } else if (mnd && mnd > maksAvdrag) {
      mnd = maksAvdrag;
      mndEl.value = maksAvdrag;
      mndEl.dataset.beregnet = '1';
      fastMndBelop = null;
    }

    if (foerBOVarsel) foerBOVarsel.style.display = 'block';
  } else {
    if (foerBOVarsel) foerBOVarsel.style.display = 'none';
  }

  // Advarsel ved mer enn 4 avdrag
  // Når beløp er manuelt tastet: estimer antall avdrag fra total/beløp
  const antallVarsel = document.getElementById('avdrag-antall-varsel');
  if (antallVarsel) {
    let estimertMnd = mnd;
    if (!estimertMnd && fastMndBelop) {
      const totalVedForfallEst = hovedstol + (effektivLettSalar || 0) + rettslige;
      estimertMnd = totalVedForfallEst > 0 ? Math.ceil(totalVedForfallEst / fastMndBelop) : null;
    }
    antallVarsel.style.display = (estimertMnd && estimertMnd > 4) ? 'block' : 'none';
  }

  // Avdragssalær: ikke tillatt ved rettslig inkasso (rettslige kostnader er lagt til)
  const erRettsligInkasso = rettslige > 0;

  // Avdragssalær kun ved 5+ avdrag og ikke rettslig inkasso
  const estimertMndForSalar = mnd ?? (fastMndBelop ? Math.ceil((hovedstol + (effektivLettSalar||0) + rettslige) / fastMndBelop) : 0);
  const visAvdragsVarsel = estimertMndForSalar >= 5 && !erRettsligInkasso;
  document.getElementById('avdragssalar-varsel').style.display = visAvdragsVarsel ? 'block' : 'none';

  // Vis info-melding hvis rettslig inkasso blokkerer avdragssalær
  let rettsligInfoEl = document.getElementById('avdragssalar-rettslig-info');
  if (!rettsligInfoEl) {
    rettsligInfoEl = document.createElement('div');
    rettsligInfoEl.id = 'avdragssalar-rettslig-info';
    rettsligInfoEl.style.cssText = 'display:none;background:#f0fdf4;border-left:3px solid var(--normal);border-radius:6px;padding:10px 14px;margin-bottom:16px;font-size:13px;color:#166534;';
    rettsligInfoEl.innerHTML = '✓ Avdragssalær beregnes ikke ved rettslig inkasso.';
    const varselEl = document.getElementById('avdragssalar-varsel');
    if (varselEl) varselEl.parentNode.insertBefore(rettsligInfoEl, varselEl);
  }
  rettsligInfoEl.style.display = (erRettsligInkasso && estimertMndForSalar >= 5) ? 'block' : 'none';

  // Oppdater maks-beløp i varselet
  const maksAvdragsgebyr = beregnAvdragsgebyr();
  const maksEl = document.getElementById('avdragssalar-maks');
  const maksLabelEl = document.getElementById('avdragssalar-maks-label');
  if (maksEl) maksEl.textContent = kr(maksAvdragsgebyr);
  if (maksLabelEl) maksLabelEl.textContent = kr(maksAvdragsgebyr);

  // Beregn faktisk avdragsgebyr basert på slider (0–100%) – aldri ved rettslig inkasso
  const sliderPst = (visAvdragsVarsel && !erRettsligInkasso)
    ? parseInt(document.getElementById('sl-avdragssalar')?.value || 100) / 100
    : 0;
  const avdragsgebyr = Math.round(maksAvdragsgebyr * sliderPst * 100) / 100;

  // ── Totalt salær: tungt erstatter lett (er ikke et tillegg) ──
  const effektivtSalar = tungPaloppt ? tungSalar : (boDato && tungSalar > 0 ? tungSalar : effektivLettSalar);
  const totalSalar = effektivtSalar + avdragsgebyr;

  // Splitt: hva som er påløpt nå vs. hva som legges til når tungt salær påløper
  // Hvis tungt ikke har påløpt: start med lett salær, legg til differansen på tungPalopDato
  // Splitt: hva som er påløpt nå vs. hva som legges til når lett salær påløper (før BO)
  const salarDatoStr   = document.getElementById('a-salar-dato')?.value.trim();
  const salarPalopDato = foerBO && salarDatoStr ? parseNO(salarDatoStr) : null;
  const lettSalarIkkeEndaPaloppt = salarPalopDato && salarPalopDato > iDag;
  // Hvis BO ikke sendt og ingen dato for salær er satt → salær påløper ikke i avtalen
  const foerBOUtenSalarDato = foerBO && !salarDatoStr;

  // salarNaa: påløpt salær per i dag
  const salarNaa = tungPaloppt ? tungSalar
                 : (lettSalarIkkeEndaPaloppt || foerBOUtenSalarDato) ? 0
                 : effektivLettSalar;

  const lettSalarDifferanse = lettSalarIkkeEndaPaloppt ? effektivLettSalar : 0;
  const salarDifferanse = (!tungPaloppt && tungSalar > 0) ? (tungSalar - effektivLettSalar)
                        : lettSalarIkkeEndaPaloppt ? effektivLettSalar
                        : 0;

  // ── Total renter per i dag ──
  const totalRenterIdag = rentHovedstolIdag + rentSalarTotaltIdag;

  // ── Startdato ──
  let startDato = parseNO(datoStr) || (() => {
    const d = new Date(); d.setMonth(d.getMonth()+1); d.setDate(1); return d;
  })();

  // Scenario: IV ikke forfalt og BO ikke sendt → første forfall = forfallsdato på IV
  if (ivIkkeForfaltFoerBO && ivForfallDato) startDato = new Date(ivForfallDato);

  // ── Renter fra i dag til første forfall – separat for hovedstol og salær ──
  const dagerTilForfall = dagMellom(iDag, startDato);
  const rentFremTilForfallHovedstol = dagerTilForfall > 0
    ? beregnRenterMedSatser(hovedstol, iDag, startDato).totalRente : 0;
  const rentFremTilForfallSalar = dagerTilForfall > 0
    ? beregnRenterMedSatser(effektivtSalar, iDag, startDato).totalRente : 0;
  const rentFremTilForfall = rentFremTilForfallHovedstol + rentFremTilForfallSalar;

  // ── Totalt ved første forfall ──
  const totalVedForfall = hovedstol + totalSalar + rettslige + totalRenterIdag + rentFremTilForfall;

  // ── Sammendrag ──
  let varsler = '';

  // Advarsel for avdragsavtale før BO
  if (foerBO) {
    const salarDatoStr = document.getElementById('a-salar-dato')?.value.trim();
    const salarDato    = parseNO(salarDatoStr);
    let foerBOMsg;
    if (ivIkkeForfaltFoerBO) {
      if (hovedstol < 2500) {
        foerBOMsg = `⚠ <strong>Kravet er under kr 2 500</strong> – det skal ikke inngås avdragsavtale. Skyldner betaler innen fristen i inkassovarselet.`;
      } else {
        const minFoerste = totalVedForfall * 0.25;
        foerBOMsg = `⚠ <strong>IV ikke forfalt:</strong> 25% (${kr(minFoerste)}) betales innen <strong>${ivForfallDato ? formatDato(ivForfallDato) : '–'}</strong>. Restbeløp deles i maks 3 avdrag. Ingen salær legges på.`;
      }
    } else {
      const minFoerste = totalVedForfall * 0.25;
      foerBOMsg = `⚠ <strong>IV forfalt, BO ikke sendt:</strong> Maks 4 avdrag. Første avdrag ≥ <strong>${kr(minFoerste)}</strong> (25% av ${kr(totalVedForfall)}).`;
      if (salarDato) foerBOMsg += ` Lett salær påføres <strong>${formatDato(salarDato)}</strong>. Husk saksnotat.`;
      else foerBOMsg += ` Husk å angi dato for lett salær og dokumentere i saksnotat.`;
    }
    if (foerBOTekst) foerBOTekst.innerHTML = foerBOMsg;
  }

  if (mnd >= 5 && avdragsgebyr > 0) {
    varsler += `<div class="varsel varsel-advarsel">
      ⚠ <strong>Avdragssalær ${kr(avdragsgebyr)}</strong> er lagt til (${mnd || '?'} avdrag).
    </div>`;
  } else if (mnd >= 5 && avdragsgebyr === 0) {
    varsler += `<div class="varsel varsel-ok">
      ✓ Avdragssalær er satt til kr 0.
    </div>`;
  }
  if (!tungPaloppt && tungSalar > 0) {
    varsler += `<div class="varsel varsel-advarsel">
      ⏰ Tungt salær <strong>${kr(tungSalar)}</strong> er inkludert i avtalen – påløper <strong>${formatDato(tungPalopDato)}</strong>.
    </div>`;
  }

  document.getElementById('avdrag-summary').innerHTML = varsler + `
    <div class="rente-result" style="margin-bottom:16px;">
      <div class="rente-box" style="border-left-color:var(--ink)" id="summary-totalbetalt">
        <div class="rente-box-label">Totalt betalt i avtalen</div>
        <div class="rente-box-value">beregner…</div>
      </div>
      <div class="rente-box" style="border-left-color:var(--high)" id="summary-renter-avtalen">
        <div class="rente-box-label">Renter i avtalen</div>
        <div class="rente-box-value">beregner…</div>
      </div>
      <div class="rente-box" style="border-left-color:var(--high)">
        <div class="rente-box-label">Daglig rente</div>
        <div class="rente-box-value">${kr((hovedstol + totalSalar) * dagligRenteNaa())}</div>
      </div>
    </div>
    <div class="breakdown">
      ${hovedstol ? `<div class="breakdown-row"><span class="breakdown-label">Hovedstol</span><span class="breakdown-amount">${kr(hovedstol)}</span></div>` : ''}
      ${!tungPaloppt && tungSalar === 0 && effektivLettSalar ? `<div class="breakdown-row"><span class="breakdown-label">Inkassosalær (lett)</span><span class="breakdown-amount">${kr(effektivLettSalar)}</span></div>` : ''}
      ${tungPaloppt ? `<div class="breakdown-row"><span class="breakdown-label">Inkassosalær (tungt, erstatter lett)</span><span class="breakdown-amount">${kr(tungSalar)}</span></div>` : ''}
      ${!tungPaloppt && tungSalar > 0 ? `<div class="breakdown-row"><span class="breakdown-label">Inkassosalær – vil bli tungt ${formatDato(tungPalopDato)}</span><span class="breakdown-amount">${kr(tungSalar)}</span></div>` : ''}
      ${avdragsgebyr ? `<div class="breakdown-row"><span class="breakdown-label">Avdragssalær</span><span class="breakdown-amount">${kr(avdragsgebyr)}</span></div>` : ''}
      ${rettslige ? `<div class="breakdown-row"><span class="breakdown-label">Rettslige kostnader</span><span class="breakdown-amount">${kr(rettslige)}</span></div>` : ''}
      ${rentHovedstolIdag > 0 ? `<div class="breakdown-row"><span class="breakdown-label">Renter av hovedstol per i dag</span><span class="breakdown-amount">${kr(rentHovedstolIdag)}</span></div>` : ''}
      ${rentSalarTotaltIdag > 0 ? `<div class="breakdown-row"><span class="breakdown-label">Renter av inkassosalær per i dag</span><span class="breakdown-amount">${kr(rentSalarTotaltIdag)}</span></div>` : ''}
      <div class="breakdown-row" id="breakdown-renter-avtalen"><span class="breakdown-label">Renter i avtaleperioden</span><span class="breakdown-amount">beregner…</span></div>
      <div class="breakdown-row total" id="breakdown-totalbetalt"><span class="breakdown-label">Totalt betalt i avtalen</span><span class="breakdown-amount">beregner…</span></div>
    </div>
  `;

  // ── Bygg avdragsplan med daglige renter og dekningsrekkefølge ──
  let saldoHovedstol = hovedstol;
  let saldoSalar     = salarNaa + avdragsgebyr; // kun påløpt salær per i dag
  let saldoRettslige = rettslige;
  let saldoRenter    = totalRenterIdag + rentFremTilForfall;
  let tungLagtTil    = tungPaloppt; // allerede inkludert hvis påløpt

  let forrigeDato = new Date(startDato);

  let html = `<thead><tr>
    <th>#</th>
    <th>Forfall</th>
    <th>Innbetaling</th>
    <th>→ Salær/kost.</th>
    <th>→ Hovedstol</th>
    <th>→ Renter</th>
    <th style="border-left:2px solid var(--border)">Rest salær</th>
    <th>Rest hovedstol</th>
    <th>Renter på forfallsdato</th>
    <th>Rest total</th>
  </tr></thead><tbody>`;

  // ── Beregn riktig fast terminbeløp via iterasjon ──
  // Enkel divisjon gir feil fordi renter løper mellom terminene.
  // Vi simulerer avdragsplanen med et prøvebeløp og justerer til saldo = 0 etter siste termin.

  function simuleringTotalRest(prøveBelop, antMnd) {
    let sh = hovedstol;
    let ss = salarNaa + avdragsgebyr; // start med påløpt salær
    let sr = rettslige;
    let sRent = totalRenterIdag + rentFremTilForfall;
    let tLagtTil = tungPaloppt;
    let lLagtTil = !lettSalarIkkeEndaPaloppt;
    let forrige = new Date(startDato);
    for (let i = 1; i <= antMnd; i++) {
      const forf = leggTilAvdragDato(startDato, i - 1);
      // Legg til lett salær på salarPalopDato
      if (!lLagtTil && salarPalopDato && forf >= salarPalopDato) {
        ss += salarDifferanse;
        lLagtTil = true;
      }
      // Legg til tungt salær på riktig dato
      if (!tLagtTil && tungPalopDato && forf >= tungPalopDato) {
        ss += salarDifferanse;
        tLagtTil = true;
      }
      const dager = dagMellom(forrige, forf);
      const sats  = dagligRenteForDato(forrige);
      const nyRent = (sh + ss - sr) * sats * dager;
      sRent += nyRent;
      const gjenstaar = ss + sr + sh + sRent;
      const bet = Math.min(prøveBelop, gjenstaar);
      let r = bet;
      const tR2 = Math.min(r, sr); sr -= tR2; r -= tR2;
      const rek = dekning === 'SHR' ? ['S','H','R'] : dekning === 'HSR' ? ['H','S','R'] :
                  dekning === 'RHS' ? ['R','H','S'] : ['R','S','H'];
      for (const p of rek) {
        if (r <= 0) break;
        if (p === 'S') { const t = Math.min(r, ss); ss -= t; r -= t; }
        if (p === 'H') { const t = Math.min(r, sh); sh -= t; r -= t; }
        if (p === 'R') { const t = Math.min(r, sRent); sRent -= t; r -= t; }
      }
      forrige = new Date(forf);
    }
    return Math.max(0, ss + sr + sh + sRent);
  }

  if (mnd && !fastMndBelop) {
    // Finn terminbeløp med binærsøk slik at rest ≈ 0 etter siste termin
    let lo = totalVedForfall / mnd;
    let hi = totalVedForfall / mnd * 1.5;
    for (let iter = 0; iter < 60; iter++) {
      const mid = (lo + hi) / 2;
      if (simuleringTotalRest(mid, mnd) > 0.01) lo = mid;
      else hi = mid;
    }
    fastMndBelop = Math.ceil(hi * 100) / 100;
    document.getElementById('a-mnd-belop').value = Math.round(fastMndBelop);
    document.getElementById('a-mnd-belop').dataset.beregnet = '1';
  } else if (fastMndBelop && !mnd) {
    // Finn antall måneder ved å simulere til saldo = 0
    mnd = 1;
    while (mnd < 1200) {
      if (simuleringTotalRest(fastMndBelop, mnd) <= 0.01) break;
      mnd++;
    }
    document.getElementById('a-mnd').value = mnd;
    document.getElementById('a-mnd').dataset.beregnet = '1';
  }

  // ── Bygg avdragsplan som datastruktur ──
  window._avdragsMeta = {
    startSaldoHovedstol: hovedstol,
    startSaldoSalar: salarNaa + avdragsgebyr,
    startSaldoRettslige: rettslige,
    startSaldoRenter: totalRenterIdag + rentFremTilForfall,
    forrigeDato: new Date(startDato),
    fastMndBelop,
    dekning,
    tungPalopDato,
    tungPaloppt,
    salarDifferanse,
    salarPalopDato,
    lettSalarIkkeEndaPaloppt,
    mnd,
    manuellRedigering: false,
  };

  // Bygg terminer – datoer alltid fra startDato, bevar manuelle beløp hvis antall er uendret
  const gammleTerminer = window._avdragsTerminer;
  const harManuelle = gammleTerminer?.some(t => t.belop !== null) || false;
  window._avdragsMeta.manuellRedigering = harManuelle;

  window._avdragsTerminer = [];
  for (let i = 0; i < mnd; i++) {
    window._avdragsTerminer.push({
      dato:  leggTilAvdragDato(startDato, i),
      // Bevar manuelt satte beløp kun hvis antall terminer er uendret
      belop: (gammleTerminer && gammleTerminer.length === mnd) ? gammleTerminer[i].belop : null,
    });
  }

  renderAvdragsplan();
}

function beregnAvdragsPlan(terminer, meta) {
  const { startSaldoHovedstol, startSaldoSalar, startSaldoRettslige,
          startSaldoRenter, fastMndBelop, dekning,
          tungPalopDato, tungPaloppt, salarDifferanse,
          salarPalopDato, lettSalarIkkeEndaPaloppt, mnd } = meta;

  let saldoHovedstol = startSaldoHovedstol;
  let saldoSalar     = startSaldoSalar;
  let saldoRettslige = startSaldoRettslige;
  let saldoRenter    = startSaldoRenter;
  let tungLagtTil    = tungPaloppt;
  let lettLagtTil    = !lettSalarIkkeEndaPaloppt; // allerede påløpt hvis ikke forsinket
  let forrigeDato    = new Date(meta.forrigeDato);

  const rader = [];

  for (let i = 0; i < terminer.length; i++) {
    const forfallDato = new Date(terminer[i].dato);
    const erSiste = i === terminer.length - 1;

    // Legg til lett salær på salarPalopDato (før BO-scenario)
    if (!lettLagtTil && salarPalopDato && forfallDato >= salarPalopDato) {
      saldoSalar  += salarDifferanse;
      lettLagtTil  = true;
    }

    // Legg til tungt salær på riktig dato
    if (!tungLagtTil && tungPalopDato && forfallDato >= tungPalopDato) {
      saldoSalar  += salarDifferanse;
      tungLagtTil  = true;
    }

    const dagerSiden = dagMellom(forrigeDato, forfallDato);
    const dagligSats = dagligRenteForDato(forrigeDato);
    const nyeRenter  = (saldoHovedstol + saldoSalar - saldoRettslige) * dagligSats * dagerSiden;
    saldoRenter     += nyeRenter;

    const gjenstaar = saldoSalar + saldoRettslige + saldoHovedstol + saldoRenter;

    // Terminbeløp: manuelt satt brukes direkte, ellers fastMndBelop
    // Siste termin: aldri mer enn fastMndBelop (ekstra termin tar resten)
    // Unntak: normal beregning uten manuelle beløp og siste termin = eksakt gjenstående
    const harNoenManuelle = meta.manuellRedigering || terminer.some(t => t.belop !== null);
    let betaling;
    if (terminer[i].belop !== null) {
      betaling = terminer[i].belop;
    } else if (!harNoenManuelle && erSiste) {
      betaling = Math.round(gjenstaar * 100) / 100;
    } else {
      betaling = Math.min(fastMndBelop, Math.round(gjenstaar * 100) / 100);
    }

    let rest = betaling;
    let tilSalar = 0, tilHovedstol = 0, tilRenter = 0;

    const tRettslige = Math.min(rest, saldoRettslige);
    tilSalar += tRettslige; saldoRettslige -= tRettslige; rest -= tRettslige;

    const rek = dekning === 'SHR' ? ['S','H','R'] : dekning === 'HSR' ? ['H','S','R'] :
                dekning === 'RHS' ? ['R','H','S'] : ['R','S','H'];
    for (const p of rek) {
      if (rest <= 0) break;
      if (p === 'S') { const t = Math.min(rest, saldoSalar);     tilSalar     += t; saldoSalar     -= t; rest -= t; }
      if (p === 'H') { const t = Math.min(rest, saldoHovedstol); tilHovedstol += t; saldoHovedstol -= t; rest -= t; }
      if (p === 'R') { const t = Math.min(rest, saldoRenter);    tilRenter    += t; saldoRenter    -= t; rest -= t; }
    }

    const rentePaForfall = saldoRenter + nyeRenter - (saldoRenter + nyeRenter - Math.max(0, saldoRenter));
    const restTotal     = Math.max(0, saldoSalar + saldoRettslige + saldoHovedstol + saldoRenter);
    const restSalar     = Math.max(0, saldoSalar + saldoRettslige);
    const restHovedstol = Math.max(0, saldoHovedstol);

    rader.push({
      nr: i + 1, forfallDato, betaling, tilSalar, tilHovedstol, tilRenter,
      restSalar, restHovedstol, rentePaForfall: saldoRenter + nyeRenter,
      restTotal, nyeRenter, erSiste,
    });

    forrigeDato = new Date(forfallDato);
  }

  // Legg til ekstra terminer så lenge det gjenstår noe – aldri overstig fastMndBelop
  let ekstraIdx = 0;
  const MAX_EKSTRA = 120;
  while (rader[rader.length - 1].restTotal > 0.01 && ekstraIdx < MAX_EKSTRA) {
    ekstraIdx++;
    const sisteForfall = new Date(rader[rader.length - 1].forfallDato);
    const ekstraDato = leggTilMnd(sisteForfall, 1);

    if (!tungLagtTil && tungPalopDato && ekstraDato >= tungPalopDato) {
      saldoSalar += salarDifferanse; tungLagtTil = true;
    }
    if (!lettLagtTil && salarPalopDato && ekstraDato >= salarPalopDato) {
      saldoSalar += salarDifferanse; lettLagtTil = true;
    }

    const dagerSiden = dagMellom(forrigeDato, ekstraDato);
    const dagligSats = dagligRenteForDato(forrigeDato);
    const nyeRenter  = (saldoHovedstol + saldoSalar - saldoRettslige) * dagligSats * dagerSiden;
    saldoRenter     += nyeRenter;

    const gjenstaar  = saldoSalar + saldoRettslige + saldoHovedstol + saldoRenter;
    // Cap på fastMndBelop – neste ekstra termin tar resten
    const betaling   = Math.min(fastMndBelop, Math.round(gjenstaar * 100) / 100);

    let rest = betaling;
    let tilSalar = 0, tilHovedstol = 0, tilRenter = 0;
    const tR = Math.min(rest, saldoRettslige); tilSalar += tR; saldoRettslige -= tR; rest -= tR;
    const rek2 = dekning === 'SHR' ? ['S','H','R'] : dekning === 'HSR' ? ['H','S','R'] :
                 dekning === 'RHS' ? ['R','H','S'] : ['R','S','H'];
    for (const p of rek2) {
      if (rest <= 0) break;
      if (p === 'S') { const t = Math.min(rest, saldoSalar);     tilSalar     += t; saldoSalar     -= t; rest -= t; }
      if (p === 'H') { const t = Math.min(rest, saldoHovedstol); tilHovedstol += t; saldoHovedstol -= t; rest -= t; }
      if (p === 'R') { const t = Math.min(rest, saldoRenter);    tilRenter    += t; saldoRenter    -= t; rest -= t; }
    }

    const restTotal     = Math.max(0, saldoSalar + saldoRettslige + saldoHovedstol + saldoRenter);
    const restSalar     = Math.max(0, saldoSalar + saldoRettslige);
    const restHovedstol = Math.max(0, saldoHovedstol);

    rader.push({
      nr: rader.length + 1, forfallDato: ekstraDato, betaling,
      tilSalar, tilHovedstol, tilRenter,
      restSalar, restHovedstol,
      rentePaForfall: saldoRenter + nyeRenter,
      restTotal, nyeRenter, erSiste: restTotal <= 0.01, ekstraTermin: true,
    });

    forrigeDato = new Date(ekstraDato);
  }

  return rader;
}

function renderAvdragsplan() {
  const meta    = window._avdragsMeta;
  const terminer = window._avdragsTerminer;
  if (!meta || !terminer) return;

  const rader = beregnAvdragsPlan(terminer, meta);

  let totalBetalt = 0, totalRenterIAvtalen = 0;
  const merknader = [];

  let html = `<thead><tr>
    <th>#</th>
    <th>Forfall</th>
    <th>Innbetaling</th>
    <th>→ Salær/kost.</th>
    <th>→ Hovedstol</th>
    <th>→ Renter</th>
    <th style="border-left:2px solid var(--border)">Rest salær</th>
    <th>Rest hovedstol</th>
    <th>Renter på forfallsdato</th>
    <th>Rest total</th>
  </tr></thead><tbody>`;

  const raderVist = rader.filter(r => r.betaling > 0.005);
  raderVist.forEach((r, idx) => {
    totalBetalt         += r.betaling;
    totalRenterIAvtalen += r.nyeRenter;

    // Merknader
    if (meta.tungPalopDato && !meta.tungPaloppt) {
      const forrigeF = idx === 0 ? new Date(0) : new Date(raderVist[idx - 1].forfallDato);
      if (meta.tungPalopDato > forrigeF && meta.tungPalopDato <= r.forfallDato) {
        merknader.push({ termin: r.nr, dato: formatDato(r.forfallDato), tekst: `Tungt salær påløper ${formatDato(meta.tungPalopDato)}` });
      }
    }
    if (r.erSiste && r.betaling > meta.fastMndBelop + 0.01) {
      merknader.push({ termin: r.nr, dato: formatDato(r.forfallDato), tekst: 'Inkl. løpende renter' });
    }

    const manuellBelop = !r.ekstraTermin && terminer[r.nr - 1] && terminer[r.nr - 1].belop !== null;

    html += `<tr${r.ekstraTermin ? ' style="background:#fff8e1;opacity:0.85;"' : ''}>
      <td class="label">${r.nr}${r.ekstraTermin ? ' <span style="font-size:10px;color:#92400e;" title="Ekstra termin – dekker restbeløp">+</span>' : ''}</td>
      <td style="white-space:nowrap;${r.ekstraTermin ? '' : 'cursor:pointer;'}" ${r.ekstraTermin ? '' : `onclick="redigerDato(${r.nr-1})" title="Klikk for å endre dato"`}>
        <span style="${r.ekstraTermin ? '' : 'border-bottom:1px dashed var(--text-muted)'}">${formatDato(r.forfallDato)}</span>
      </td>
      <td style="white-space:nowrap;${r.ekstraTermin ? '' : 'cursor:pointer;'}" ${r.ekstraTermin ? '' : `onclick="redigerBelop(${r.nr-1})" title="Klikk for å endre beløp"`}>
        <strong style="${r.ekstraTermin ? '' : `border-bottom:1px dashed ${manuellBelop ? 'var(--high)' : 'var(--text-muted)'}`}">${tbl(r.betaling)}</strong>
        ${manuellBelop && !r.ekstraTermin ? '<span style="font-size:10px;color:var(--high);margin-left:4px;">✎</span>' : ''}
      </td>
      <td style="color:var(--text-muted);white-space:nowrap">${r.tilSalar > 0 ? tbl(r.tilSalar) : '–'}</td>
      <td style="color:var(--text-muted);white-space:nowrap">${r.tilHovedstol > 0 ? tbl(r.tilHovedstol) : '–'}</td>
      <td style="color:var(--high);white-space:nowrap">${r.tilRenter > 0 ? tbl(r.tilRenter) : '–'}</td>
      <td style="border-left:2px solid var(--border);color:var(--text-muted);white-space:nowrap">${r.restSalar > 0 ? tbl(r.restSalar) : '–'}</td>
      <td style="color:var(--text-muted);white-space:nowrap">${r.restHovedstol > 0 ? tbl(r.restHovedstol) : '–'}</td>
      <td style="color:var(--high);white-space:nowrap">${tbl(r.rentePaForfall)}</td>
      <td style="white-space:nowrap"><strong>${tbl(r.restTotal)}</strong></td>
    </tr>`;
  });

  html += '</tbody>';
  document.getElementById('avdrag-tabell').innerHTML = html;

  // Merknader
  const merknadEl = document.getElementById('avdrag-merknader');
  if (merknadEl) {
    merknadEl.innerHTML = merknader.map(m =>
      `<div style="background:#fff8e1;border-left:3px solid #f59e0b;border-radius:6px;padding:8px 14px;margin-bottom:6px;font-size:13px;color:#92400e;">
        ⚠ Termin ${m.termin} (${m.dato}): ${m.tekst}
      </div>`
    ).join('');
  }

  document.getElementById('avdrag-tabell-panel').style.display = 'block';

  // Oppdater sammendrag
  const totalBetaltEl = document.getElementById('summary-totalbetalt');
  if (totalBetaltEl) totalBetaltEl.innerHTML = `<div class="rente-box-label">Totalt betalt i avtalen</div><div class="rente-box-value">${kr(totalBetalt)}</div>`;
  const renterEl = document.getElementById('summary-renter-avtalen');
  if (renterEl) renterEl.innerHTML = `<div class="rente-box-label">Renter i avtalen</div><div class="rente-box-value">${kr(Math.max(0, totalRenterIAvtalen))}</div>`;
  const brRenter = document.getElementById('breakdown-renter-avtalen');
  if (brRenter) brRenter.innerHTML = `<span class="breakdown-label">Renter i avtaleperioden</span><span class="breakdown-amount">${kr(Math.max(0, totalRenterIAvtalen))}</span>`;
  const brTotal = document.getElementById('breakdown-totalbetalt');
  if (brTotal) brTotal.innerHTML = `<span class="breakdown-label">Totalt betalt i avtalen</span><span class="breakdown-amount">${kr(totalBetalt)}</span>`;
}

function redigerDato(idx) {
  const terminer = window._avdragsTerminer;
  const meta     = window._avdragsMeta;
  if (!terminer || !meta || idx >= terminer.length) return;
  const td = document.querySelectorAll('#avdrag-tabell tbody tr')[idx].cells[1];
  const gjeldende = new Date(terminer[idx].dato);

  const dd = String(gjeldende.getDate()).padStart(2,'0');
  const mm = String(gjeldende.getMonth()+1).padStart(2,'0');
  const yyyy = gjeldende.getFullYear();

  const inp = document.createElement('input');
  inp.type = 'text';
  inp.value = `${dd}.${mm}.${yyyy}`;
  inp.style.cssText = `width:100px;font-family:'DM Mono',monospace;font-size:13px;border:1px solid var(--ink);border-radius:4px;padding:2px 6px;outline:none;`;
  td.innerHTML = '';
  td.appendChild(inp);
  inp.focus(); inp.select();

  function bekreft() {
    const ny = parseNO(inp.value) || autoFormatOgParse(inp.value);
    if (ny) {
      // Valider at datoen er etter forrige termin
      const forrigeDato = idx > 0 ? new Date(terminer[idx - 1].dato) : null;
      if (forrigeDato && ny <= forrigeDato) {
        inp.style.border = '1px solid var(--high)';
        inp.title = `Dato må være etter termin ${idx} (${formatDato(forrigeDato)})`;
        inp.select();
        return;
      }

      const gammel = new Date(terminer[idx].dato);
      terminer[idx].dato = ny;

      // Beregn månedsdiff mellom gammel og ny dato
      const månedsDiff = (ny.getFullYear() - gammel.getFullYear()) * 12
                       + (ny.getMonth() - gammel.getMonth());

      if (månedsDiff !== 0) {
        // Forskyv påfølgende terminer med samme antall hele måneder
        // men behold opprinnelig dag-i-måneden fra startDato
        for (let j = idx + 1; j < terminer.length; j++) {
          const orig = new Date(terminer[j].dato);
          const nyMnd = orig.getMonth() + månedsDiff;
          const nyÅr  = orig.getFullYear() + Math.floor(nyMnd / 12);
          const normMnd = ((nyMnd % 12) + 12) % 12;
          // Bruk siste dag i måneden hvis original dag ikke finnes
          const dagerIMnd = new Date(nyÅr, normMnd + 1, 0).getDate();
          const nyDag = Math.min(orig.getDate(), dagerIMnd);
          terminer[j].dato = new Date(nyÅr, normMnd, nyDag);
        }
      }

      for (let j = 0; j < terminer.length; j++) terminer[j].belop = null;
      meta.manuellRedigering = true;
    }
    renderAvdragsplan();
  }

  inp.addEventListener('blur', bekreft);
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); inp.blur(); }
    if (e.key === 'Escape') renderAvdragsplan();
  });
}

function autoFormatOgParse(val) {
  const digits = val.replace(/\D/g,'');
  if (digits.length === 6) return parseNO(digits.slice(0,2)+'.'+digits.slice(2,4)+'.20'+digits.slice(4,6));
  if (digits.length === 8) return parseNO(digits.slice(0,2)+'.'+digits.slice(2,4)+'.'+digits.slice(4,8));
  return null;
}

function redigerBelop(idx) {
  const terminer = window._avdragsTerminer;
  const meta     = window._avdragsMeta;
  if (!terminer || !meta || idx >= terminer.length) return;
  const rader    = beregnAvdragsPlan(terminer, meta);
  if (!rader[idx]) { renderAvdragsplan(); return; }
  const allRows   = document.querySelectorAll('#avdrag-tabell tbody tr');
  const domIdx    = Array.from(allRows).findIndex(tr => tr.cells[0]?.textContent.trim().replace(/[^0-9]/,'') == String(idx + 1));
  if (domIdx < 0) { renderAvdragsplan(); return; }
  const td        = allRows[domIdx].cells[2];
  const gjeldende = rader[idx].betaling;

  const inp = document.createElement('input');
  inp.type = 'text';
  inp.value = String(gjeldende).replace('.', ',');
  inp.style.cssText = `width:100px;font-family:'DM Mono',monospace;font-size:13px;border:1px solid var(--ink);border-radius:4px;padding:2px 6px;outline:none;`;
  td.innerHTML = '';
  td.appendChild(inp);
  inp.focus(); inp.select();

  function bekreft() {
    const nyBelop = parseKr(inp.value);
    if (nyBelop > 0) {
      // Sett manuelt beløp for denne terminen
      terminer[idx].belop = nyBelop;
      // Bevar alle andre manuelle beløp uendret - ikke nullstill etterfølgende terminer.
      // Siste termin settes til null (restgjeld) kun hvis den ikke allerede er manuelt satt
      // og vi ikke redigerer selve siste termin.
      if (idx < terminer.length - 1 && terminer[terminer.length - 1].belop === null) {
        terminer[terminer.length - 1].belop = null; // allerede null, ingen endring
      }
    }
    meta.manuellRedigering = true;
    renderAvdragsplan();
  }

  inp.addEventListener('blur', bekreft);
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } if (e.key === 'Escape') renderAvdragsplan(); });
}

function lastNedAvdragPDF() {
  const meta    = window._avdragsMeta;
  const terminer = window._avdragsTerminer;
  if (!meta || !terminer) { alert('Beregn avdragsplan først.'); return; }
  if (!window.jspdf) { alert('PDF-biblioteket er ikke lastet ennå. Prøv igjen om et øyeblikk.'); return; }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const marg = 16;
  const sw   = 210 - marg * 2; // skrivbar bredde
  let y = 0;

  // ── Hjelpefunksjoner ──
  const linje = (tekst, x, yPos, size=10, bold=false, farge=[30,30,46]) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...farge);
    doc.text(tekst, x, yPos);
  };

  const hLinje = (yPos, farge=[220,220,215]) => {
    doc.setDrawColor(...farge);
    doc.setLineWidth(0.3);
    doc.line(marg, yPos, 210 - marg, yPos);
  };

  // ── Header ──
  doc.setFillColor(30, 30, 46);
  doc.rect(0, 0, 210, 24, 'F');
  doc.setFillColor(230, 245, 53);
  doc.rect(0, 21, 210, 3, 'F');
  linje('Inkasso Toolkit', marg, 15, 14, true, [255,255,255]);
  linje('Avdragsplan', marg + 52, 15, 9, false, [180,180,200]);
  linje(new Date().toLocaleDateString('no-NO'), 210 - marg, 15, 8, false, [180,180,200]);
  doc.setTextColor(180,180,200);
  doc.setFontSize(8);
  doc.text(new Date().toLocaleDateString('no-NO'), 210 - marg, 15, { align: 'right' });

  y = 33;

  // ── Sammendrag ──
  const rader = beregnAvdragsPlan(terminer, meta);
  const totalBetalt = rader.reduce((s, r) => s + r.betaling, 0);
  const totalRenter = rader.reduce((s, r) => s + r.nyeRenter, 0);

  linje('Sammendrag', marg, y, 10, true); y += 5;
  hLinje(y); y += 4;

  const sumRader = [
    ['Hovedstol', kr(meta.startSaldoHovedstol)],
    ['Inkassosalær', kr(meta.startSaldoSalar)],
    meta.startSaldoRettslige ? ['Rettslige kostnader', kr(meta.startSaldoRettslige)] : null,
    ['Renter ved avtaleinngåelse', kr(meta.startSaldoRenter)],
    ['Renter i avtaleperioden', kr(totalRenter)],
  ].filter(Boolean);

  sumRader.forEach(([label, val]) => {
    linje(label, marg, y, 9, false, [80,80,100]);
    linje(val, 210 - marg, y, 9, false, [30,30,46]);
    doc.setFontSize(9);
    doc.text(val, 210 - marg, y, { align: 'right' });
    y += 5;
  });

  hLinje(y); y += 4;
  linje('Totalt betalt i avtalen', marg, y, 10, true);
  doc.setFontSize(10); doc.setFont('helvetica','bold');
  doc.text(kr(totalBetalt), 210 - marg, y, { align: 'right' });
  y += 8;

  // ── Avdragstabell ──
  linje('Avdragsplan', marg, y, 10, true); y += 5;

  // Kolonner
  const kol = [
    { label: '#',            x: marg,      w: 8,  align: 'left'  },
    { label: 'Forfall',      x: marg+9,    w: 24, align: 'left'  },
    { label: 'Innbetaling',  x: marg+34,   w: 26, align: 'right' },
    { label: '→ Salær',      x: marg+61,   w: 22, align: 'right' },
    { label: '→ Hovedstol',  x: marg+84,   w: 26, align: 'right' },
    { label: '→ Renter',     x: marg+111,  w: 22, align: 'right' },
    { label: 'Rest total',   x: marg+134,  w: 28, align: 'right' },
  ];

  // Header-rad
  doc.setFillColor(30, 30, 46);
  doc.rect(marg, y - 4, sw, 6, 'F');
  kol.forEach(k => {
    doc.setFontSize(7.5); doc.setFont('helvetica','bold'); doc.setTextColor(255,255,255);
    if (k.align === 'right') doc.text(k.label, k.x + k.w, y, { align: 'right' });
    else doc.text(k.label, k.x, y);
  });
  y += 4;

  // Dataradene
  rader.forEach((r, i) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }

    if (i % 2 === 0) {
      doc.setFillColor(248, 248, 245);
      doc.rect(marg, y - 3.5, sw, 5.5, 'F');
    }
    if (r.ekstraTermin) {
      doc.setFillColor(255, 248, 225);
      doc.rect(marg, y - 3.5, sw, 5.5, 'F');
    }

    const celler = [
      r.nr + (r.ekstraTermin ? '+' : ''),
      formatDato(r.forfallDato),
      kr(r.betaling),
      r.tilSalar  > 0.005 ? kr(r.tilSalar)      : '–',
      r.tilHovedstol > 0.005 ? kr(r.tilHovedstol) : '–',
      r.tilRenter > 0.005 ? kr(r.tilRenter)     : '–',
      kr(r.restTotal),
    ];

    const erSiste = r.restTotal < 0.01;
    celler.forEach((tekst, ci) => {
      const k = kol[ci];
      doc.setFontSize(8);
      doc.setFont('helvetica', (ci === 2 || erSiste) ? 'bold' : 'normal');
      doc.setTextColor(30, 30, 46);
      if (k.align === 'right') doc.text(tekst, k.x + k.w, y, { align: 'right' });
      else doc.text(tekst, k.x, y);
    });
    y += 5.5;
  });

  hLinje(y); y += 6;

  // ── Footer ──
  const sider = doc.internal.getNumberOfPages();
  for (let i = 1; i <= sider; i++) {
    doc.setPage(i);
    doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor(160,160,175);
    doc.text(`© ${new Date().getFullYear()} William H.B. – Inkasso Toolkit`, marg, 295);
    doc.text(`Side ${i} av ${sider}`, 210 - marg, 295, { align: 'right' });
  }

  doc.save('avdragsplan.pdf');
}
function kopierAvdrag() {
  const rows = document.querySelectorAll('#avdrag-tabell tbody tr');
  let tekst = 'AVDRAGSPLAN\n' + '─'.repeat(70) + '\n';
  tekst += `${'#'.padEnd(4)}${'Forfall'.padEnd(14)}${'Innbet.'.padEnd(14)}${'Salær'.padEnd(14)}${'Hovedstol'.padEnd(14)}${'Renter'.padEnd(14)}${'Rest total'}\n`;
  tekst += '─'.repeat(70) + '\n';
  rows.forEach(r => {
    const c = r.querySelectorAll('td');
    tekst += `${c[0].textContent.trim().padEnd(4)}${c[1].textContent.trim().padEnd(14)}${c[2].textContent.replace(/\s+/g,' ').trim().padEnd(14)}${c[3].textContent.trim().padEnd(14)}${c[4].textContent.trim().padEnd(14)}${c[5].textContent.trim().padEnd(14)}${c[9].textContent.trim()}\n`;
  });
  kopierTekst(tekst, 'Avdragsplan kopiert!');
}

function nullstillAvdrag() {
  window._avdragsTerminer = null;
  window._avdragsMeta = null;
  ['a-hovedstol','a-salar','a-rettslige','a-mnd','a-mnd-belop','a-dato','a-forfall','a-iv-forfall','a-bo-dato','a-tung-salar','a-tung-salar-fremtidig','a-salar-dato'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const slAvd = document.getElementById('sl-avdragssalar'); if(slAvd){slAvd.value=100;}
  const slAvdVal = document.getElementById('sl-avdragssalar-val'); if(slAvdVal){slAvdVal.textContent='100%';}
  document.getElementById('a-bo-ikke-sendt').checked        = false;
  const boDatoEl = document.getElementById('a-bo-dato');
  boDatoEl.disabled = false; boDatoEl.style.opacity = '1';
  document.getElementById('avdragssalar-varsel').style.display  = 'none';
  document.getElementById('tung-salar-wrap').style.display      = 'none';
  document.getElementById('tung-salar-fremtidig').style.display = 'none';
  document.getElementById('iv-ikke-forfalt-varsel').style.display = 'none';
  document.getElementById('inkasso-salar-wrap').style.display      = 'block';
  document.getElementById('foer-bo-varsel').style.display       = 'none';
  document.getElementById('avdrag-summary').innerHTML =
    '<span style="color:var(--text-muted)">Fyll inn bestanddeler og datoer for å beregne totalbeløp.</span>';
  document.getElementById('avdrag-tabell-panel').style.display = 'none';
}

/* ════════════════════════════════
   RENTE
════════════════════════════════ */

function beregnRente() {
  const hoved  = parseKr(document.getElementById('rn-hoved').value) || 0;
  const fraStr = document.getElementById('rn-fra').value.trim();
  const tilStr = document.getElementById('rn-til').value.trim();

  if (!hoved || !fraStr || !tilStr) {
    document.getElementById('rente-resultat').innerHTML =
      '<span style="color:var(--text-muted)">Fyll inn hovedstol og datoer.</span>';
    return;
  }

  const fra = parseNO(fraStr);
  const til = parseNO(tilStr);
  if (!fra || !til || til <= fra) {
    document.getElementById('rente-resultat').innerHTML =
      '<span style="color:var(--text-muted)">Ugyldig datoperiode.</span>';
    return;
  }

  const { totalRente, perioder } = beregnRenterMedSatser(hoved, fra, til);
  const totalDager = dagMellom(fra, til);

  let perioderHtml = perioder.map(p => `
    <tr>
      <td>${formatDato(p.fra)}</td>
      <td>${formatDato(p.til)}</td>
      <td style="text-align:right">${p.dager}</td>
      <td style="text-align:right">${p.sats.toFixed(2)}%</td>
      <td style="text-align:right;font-family:'DM Mono',monospace;font-weight:600">${kr(p.rente)}</td>
    </tr>`).join('');

  autolagreSak();
  document.getElementById('rente-resultat').innerHTML = `
    <div class="rente-result" style="margin-bottom:20px;">
      <div class="rente-box" style="border-left-color:var(--high)">
        <div class="rente-box-label">Totale renter</div>
        <div class="rente-box-value">${kr(totalRente)}</div>
      </div>
      <div class="rente-box" style="border-left-color:var(--ink)">
        <div class="rente-box-label">Hovedstol + renter</div>
        <div class="rente-box-value">${kr(hoved + totalRente)}</div>
      </div>
      <div class="rente-box" style="border-left-color:var(--text-muted)">
        <div class="rente-box-label">Antall dager</div>
        <div class="rente-box-value" style="font-size:20px">${totalDager}</div>
      </div>
    </div>

    <table class="avdrag-table">
      <thead><tr>
        <th>Fra dato</th>
        <th>Til dato</th>
        <th style="text-align:right">Dager</th>
        <th style="text-align:right">Sats</th>
        <th style="text-align:right">Rentebeløp</th>
      </tr></thead>
      <tbody>${perioderHtml}</tbody>
      <tfoot><tr style="font-weight:700;background:var(--bg)">
        <td colspan="4" style="padding:10px 12px;">Totalt</td>
        <td style="text-align:right;padding:10px 12px;font-family:'DM Mono',monospace">${kr(totalRente)}</td>
      </tr></tfoot>
    </table>
  `;
}

function settDagensDato() {
  const iDag = new Date();
  const dd   = String(iDag.getDate()).padStart(2, '0');
  const mm   = String(iDag.getMonth() + 1).padStart(2, '0');
  const yyyy = iDag.getFullYear();
  document.getElementById('rn-til').value = `${dd}.${mm}.${yyyy}`;
  beregnRente();
}

function beregnRenteFraDato() {
  beregnRente();
}

/* ════════════════════════════════
   SIMULATOR
════════════════════════════════ */

function simInit() {
  const sats = rentesatsForDato(new Date());
  document.getElementById('sim-rente-auto').textContent = String(sats).replace('.', ',') + '%';
  const iDag = new Date();
  const dd = String(iDag.getDate()).padStart(2,'0');
  const mm = String(iDag.getMonth()+1).padStart(2,'0');
  document.getElementById('sim-startdato').value = `${dd}.${mm}.${iDag.getFullYear()}`;
}

function simOppdaterSaldo(el) {
  // Live tusenskilletegn
  const raw = el.value;
  const kommaIdx = raw.search(/[,.]/);
  const heltall = (kommaIdx >= 0 ? raw.slice(0, kommaIdx) : raw).replace(/[^\d]/g, '');
  const desimal = kommaIdx >= 0 ? raw.slice(kommaIdx) : '';
  el.value = heltall.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f') + desimal;

  // Sett slider-maks til saldo (1 avdrag = hele saldoen)
  const saldo = parseKr(el.value) || 0;
  if (saldo > 0) {
    const slider = document.getElementById('sim-avdrag-slider');
    slider.max = saldo;
    slider.step = Math.max(50, Math.round(saldo / 100 / 50) * 50);
    document.getElementById('sim-slider-maks-label').textContent = 'kr ' + saldo.toLocaleString('no-NO');
    // Behold gjeldende verdi hvis den er innenfor, ellers sett til 10% av saldo
    if (parseFloat(slider.value) > saldo) {
      const forslag = Math.round(saldo * 0.1 / 50) * 50;
      slider.value = forslag;
      document.getElementById('sim-avdrag').value = forslag;
      document.getElementById('sim-avdrag-val').textContent = 'kr ' + forslag.toLocaleString('no-NO');
    }
  }

  simBeregn();
}

function simOppdaterAvdragSlider(val) {
  val = parseInt(val);
  document.getElementById('sim-avdrag-val').textContent = 'kr ' + val.toLocaleString('no-NO');
  document.getElementById('sim-avdrag').value = val;
  simBeregn();
}

function simOppdaterAvdragInput(val) {
  const n     = parseKr(val) || 0;
  const saldo = parseKr(document.getElementById('sim-saldo').value) || 0;
  const maks  = saldo > 0 ? saldo : Math.max(parseInt(document.getElementById('sim-avdrag-slider').max), n);
  const kappet = Math.min(n, maks);
  const slider = document.getElementById('sim-avdrag-slider');
  slider.max = maks;
  slider.value = kappet;
  document.getElementById('sim-slider-maks-label').textContent = 'kr ' + maks.toLocaleString('no-NO');
  document.getElementById('sim-avdrag-val').textContent = 'kr ' + kappet.toLocaleString('no-NO');
  simBeregn();
}

function simSettAvdrag(val) {
  document.getElementById('sim-avdrag-slider').value = val;
  document.getElementById('sim-avdrag').value = val;
  document.getElementById('sim-avdrag-val').textContent = 'kr ' + val.toLocaleString('no-NO');
  simBeregn();
}

function simBeregn() {
  const saldoRå     = parseKr(document.getElementById('sim-saldo').value) || 0;
  const avdrag      = parseKr(document.getElementById('sim-avdrag').value) || 0;
  const rentePst    = rentesatsForDato(new Date());
  const startDatoEl = document.getElementById('sim-startdato').value.trim();
  const startDato   = parseNO(startDatoEl) || new Date();

  if (!saldoRå || !avdrag) {
    document.getElementById('sim-resultat').innerHTML = '<span style="color:var(--text-muted)">Fyll inn saldo og månedlig avdrag for å simulere.</span>';
    document.getElementById('sim-tabell-wrap').style.display = 'none';
    document.getElementById('sim-indikator').style.display = 'none';
    return;
  }

  // Bruk forliksreduksjon
  const saldo = saldoRå;
  const dagligRente = rentePst / 100 / 365;

  // Simuleringsfunksjon med korrekte datoer og lik terminbeløp
  function simuler(mndAvdrag) {
    let rest = saldo;
    if (rest <= 0) return { terminer: [], totalBetalt: 0, totalRenter: 0, måneder: 0 };

    // Bygg liste med forfallsdatoer
    const datoer = [];
    let d = new Date(startDato);
    for (let i = 0; i < 600; i++) {
      datoer.push(new Date(d));
      d = new Date(d);
      d.setMonth(d.getMonth() + 1);
    }

    // Tell antall terminer som trengs med dette terminbeløpet
    function tellTerminer(terminBelop) {
      let r = rest;
      let forrige = new Date(startDato);
      forrige.setMonth(forrige.getMonth() - 1); // fiktiv forrige dato
      // Bruk startdato direkte som første forfallsdato
      let prevDato = new Date(startDato);
      prevDato.setMonth(prevDato.getMonth() - 1);

      for (let i = 0; i < 600; i++) {
        const dagerMellom = Math.round((datoer[i] - prevDato) / 86400000);
        const renter = r * (rentePst / 100 / 365) * dagerMellom;
        r += renter;
        r -= Math.min(terminBelop, r);
        prevDato = datoer[i];
        if (r <= 0.005) return i + 1;
      }
      return 600;
    }

    // Finn jevnt terminbeløp via binærsøk
    let lo = rest / 600, hi = rest + rest * (rentePst / 100);
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (tellTerminer(mid) <= tellTerminer(mndAvdrag)) hi = mid;
      else lo = mid;
    }
    // Bruk mndAvdrag direkte (ikke binærsøk-resultatet) med korrekte datoer
    const terminer = [];
    let r = rest;
    let prevDato = new Date(startDato);
    prevDato.setMonth(prevDato.getMonth() - 1);
    let totalBetalt = 0;
    let totalRenter = 0;
    let måneder = 0;

    for (let i = 0; i < 600 && r > 0.005; i++) {
      const dagerMellom = Math.round((datoer[i] - prevDato) / 86400000);
      const renter = r * (rentePst / 100 / 365) * dagerMellom;
      r += renter;
      totalRenter += renter;

      // Siste termin: betal nøyaktig det som gjenstår
      const erSiste = r <= mndAvdrag + 0.005;
      const betaling = erSiste ? Math.round(r * 100) / 100 : mndAvdrag;
      r = erSiste ? 0 : Math.round((r - betaling) * 100) / 100;
      totalBetalt += betaling;
      måneder++;
      prevDato = datoer[i];

      const dd = String(datoer[i].getDate()).padStart(2,'0');
      const mm = String(datoer[i].getMonth()+1).padStart(2,'0');
      const yyyy = datoer[i].getFullYear();
      terminer.push({
        dato: `${dd}.${mm}.${yyyy}`,
        betaling: Math.round(betaling * 100) / 100,
        renter: Math.round(renter * 100) / 100,
        rest: Math.max(0, r)
      });
    }

    return { terminer, totalBetalt: Math.round(totalBetalt*100)/100, totalRenter: Math.round(totalRenter*100)/100, måneder };
  }

  const res = simuler(avdrag);

  if (res.måneder >= 600) {
    document.getElementById('sim-resultat').innerHTML = `<div class="varsel varsel-feil">⚠ Avdraget er for lavt – renter vokser raskere enn nedbetalingen. Øk månedlig avdrag.</div>`;
    document.getElementById('sim-tabell-wrap').style.display = 'none';
    document.getElementById('sim-indikator').style.display = 'none';
    document.getElementById('sim-antall-varsel').style.display = 'none';
    return;
  }

  // Advarsel: mer enn 4 avdrag
  document.getElementById('sim-antall-varsel').style.display = res.måneder > 4 ? 'block' : 'none';

  // Nedbetalingstid som tekst
  const år = Math.floor(res.måneder / 12);
  const mnd = res.måneder % 12;
  const tidTekst = år > 0 ? `${år} år${mnd > 0 ? ', ' + mnd + ' mnd' : ''}` : `${mnd} mnd`;

  const sisteDato = res.terminer.length > 0 ? res.terminer[res.terminer.length-1].dato : '–';
  const renteAndel = res.totalBetalt > 0 ? (res.totalRenter / res.totalBetalt * 100) : 0;

  // Realitetsindikator
  let indFarge, indBgFarge, indLabel, indTekst;
  if (res.måneder <= 36) {
    indFarge = '#166534'; indBgFarge = '#f0fdf4'; indLabel = '✓ Realistisk';
    indTekst = `${tidTekst} – god plan med lav risiko for mislighold`;
  } else if (res.måneder <= 60) {
    indFarge = '#92400e'; indBgFarge = '#fff8e1'; indLabel = '⚠ Moderat';
    indTekst = `${tidTekst} – akseptabelt, men vurder om skyldner klarer dette over tid`;
  } else {
    indFarge = '#991b1b'; indBgFarge = '#fde8e8'; indLabel = '⛔ Høy risiko';
    indTekst = `${tidTekst} – høy sannsynlighet for mislighold. Vurder forlik eller høyere avdrag`;
  }

  const ind = document.getElementById('sim-indikator');
  ind.style.display = 'block';
  ind.style.background = indBgFarge;
  ind.style.borderLeft = `3px solid ${indFarge}`;
  document.getElementById('sim-indikator-label').style.color = indFarge;
  document.getElementById('sim-indikator-label').textContent = indLabel;
  document.getElementById('sim-indikator-tekst').style.color = indFarge;
  document.getElementById('sim-indikator-tekst').textContent = indTekst;

  document.getElementById('sim-resultat').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
      <div style="background:var(--ink);border-radius:8px;padding:14px 16px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.5);margin-bottom:4px;">Nedbetalingstid</div>
        <div style="font-family:'DM Mono',monospace;font-size:22px;font-weight:500;color:#fff;">${tidTekst}</div>
      </div>
      <div style="background:var(--bg);border-radius:8px;padding:14px 16px;border:1px solid var(--border);">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:4px;">Totalt betalt</div>
        <div style="font-family:'DM Mono',monospace;font-size:22px;font-weight:500;color:var(--ink);">${kr(res.totalBetalt)}</div>
      </div>
      <div style="background:var(--bg);border-radius:8px;padding:14px 16px;border:1px solid var(--border);">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:4px;">Totale renter</div>
        <div style="font-family:'DM Mono',monospace;font-size:22px;font-weight:500;color:var(--high);">${kr(res.totalRenter)}</div>
      </div>
      <div style="background:var(--bg);border-radius:8px;padding:14px 16px;border:1px solid var(--border);">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:4px;">Renteandel</div>
        <div style="font-family:'DM Mono',monospace;font-size:22px;font-weight:500;color:var(--ink);">${renteAndel.toFixed(1)}%</div>
      </div>
    </div>
    <div style="font-size:13px;color:var(--text-muted);line-height:1.7;">
      Første betaling: <strong style="color:var(--ink)">${res.terminer[0]?.dato || '–'}</strong><br>
      Siste betaling: <strong style="color:var(--ink)">${sisteDato}</strong>
    </div>
    ${res.måneder > 1 ? `
    <div style="margin-top:16px;background:#eef4ff;border-left:3px solid #3a7bd5;border-radius:6px;padding:10px 14px;font-size:13px;color:#1e3a6e;">
      💬 <em>"Hvis du øker til ${kr(simAvdragForMåneder(saldo, dagligRente, res.måneder - 1))}, er du ferdig på ${(()=>{ const m=res.måneder-1; const å=Math.floor(m/12); const mn=m%12; return å>0?å+' år'+(mn>0?', '+mn+' mnd':''):mn+' mnd'; })()}"</em>
    </div>` : ''}
  `;

  // Tabell (vis maks 60 rader for ytelse)
  const visTerminer = res.terminer.slice(0, 60);
  const harFlere = res.terminer.length > 60;

  let tblHtml = `<thead><tr>
    <th>Mnd</th><th>Forfall</th><th style="text-align:right">Avdrag</th>
    <th style="text-align:right">Renter</th><th style="text-align:right">Restsaldo</th>
  </tr></thead><tbody>`;

  visTerminer.forEach((t, i) => {
    const zebra = i % 2 === 0 ? '' : 'background:var(--bg);';
    tblHtml += `<tr style="${zebra}">
      <td class="label">${i+1}</td>
      <td>${t.dato}</td>
      <td style="text-align:right;font-weight:600">${tbl(t.betaling)}</td>
      <td style="text-align:right;color:var(--high)">${tbl(t.renter)}</td>
      <td style="text-align:right;font-weight:${t.rest < 0.01 ? '700' : '400'}">${tbl(t.rest)}</td>
    </tr>`;
  });

  if (harFlere) {
    tblHtml += `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);font-size:12px;padding:10px;">… og ${res.terminer.length - 60} terminer til</td></tr>`;
  }
  tblHtml += '</tbody>';

  document.getElementById('sim-tabell').innerHTML = tblHtml;
  document.getElementById('sim-tabell-wrap').style.display = 'block';

  // Lagre for kopiering
  window._simData = { res, saldo, avdrag, rentePst, tidTekst };
}

function simBestForslag() {
  const saldoRå = parseKr(document.getElementById('sim-saldo').value) || 0;
  if (!saldoRå) return;
  const saldo = saldoRå;
  const rentePst   = rentesatsForDato(new Date());
  const dagligRente = rentePst / 100 / 365;

  // Dynamisk målmåneder basert på saldo – korte avtaler for små krav
  const målMåneder = saldo < 10000  ?  3
                   : saldo < 25000  ?  6
                   : saldo < 50000  ? 12
                   : saldo < 100000 ? 18
                   : saldo < 250000 ? 24
                   :                  36;

  const optimalt = simAvdragForMåneder(saldo, dagligRente, målMåneder);
  simSettAvdrag(optimalt);
  document.getElementById('sim-avdrag').value = optimalt;
}

function simAvdragForMåneder(saldo, dagligRente, målMåneder) {
  const rentePst = rentesatsForDato(new Date());
  const startDato = parseNO(document.getElementById('sim-startdato').value.trim()) || new Date();

  // Bygg datoer
  const datoer = [];
  let d = new Date(startDato);
  for (let i = 0; i < målMåneder + 5; i++) {
    datoer.push(new Date(d));
    d.setMonth(d.getMonth() + 1);
  }

  function tellTerminer(terminBelop) {
    let r = saldo;
    let prevDato = new Date(startDato); prevDato.setMonth(prevDato.getMonth() - 1);
    for (let i = 0; i < 600; i++) {
      const dager = Math.round((datoer[i] - prevDato) / 86400000);
      r += r * (rentePst / 100 / 365) * dager;
      r -= Math.min(terminBelop, r);
      prevDato = datoer[i];
      if (r <= 0.005) return i + 1;
    }
    return 600;
  }

  let lo = saldo / (målMåneder + 2), hi = saldo * 1.5;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (tellTerminer(mid) > målMåneder) lo = mid; else hi = mid;
  }
  return Math.ceil(hi / 10) * 10;
}

function simOptimaltAvdrag(saldo, dagligRente, målMåneder) {
  return simAvdragForMåneder(saldo, null, målMåneder || 36);
}

function simSett4Avdrag() {
  const saldo = parseKr(document.getElementById('sim-saldo').value) || 0;
  if (!saldo) return;
  const optimalt = simAvdragForMåneder(saldo, null, 4);
  simSettAvdrag(optimalt);
  document.getElementById('sim-avdrag').value = optimalt;
}

function simKopier() {
  const d = window._simData;
  if (!d) return;
  const { res, saldo, avdrag, rentePst, tidTekst } = d;

  let tekst = `NEDBETALINGSPLAN\n${'─'.repeat(60)}\n`;
  tekst += `Saldo:            ${kr(saldo)}\n`;
  tekst += `Månedlig avdrag:  ${kr(avdrag)}\n`;
  tekst += `Rentesats:        ${rentePst}% p.a.\n`;
  tekst += `Nedbetalingstid:  ${tidTekst}\n`;
  tekst += `Totalt betalt:    ${kr(res.totalBetalt)}\n`;
  tekst += `Totale renter:    ${kr(res.totalRenter)}\n`;
  tekst += `${'─'.repeat(60)}\n`;
  tekst += `${'Mnd'.padEnd(5)}${'Forfall'.padEnd(14)}${'Avdrag'.padEnd(13)}${'Renter'.padEnd(13)}Restsaldo\n`;
  tekst += `${'─'.repeat(60)}\n`;
  res.terminer.forEach((t, i) => {
    tekst += `${String(i+1).padEnd(5)}${t.dato.padEnd(14)}${kr(t.betaling).padEnd(13)}${kr(t.renter).padEnd(13)}${kr(t.rest)}\n`;
  });

  kopierTekst(tekst, 'Nedbetalingsplan kopiert!');
}

// Init simulator når fanen åpnes
document.addEventListener('DOMContentLoaded', () => {
  simInit();
});
