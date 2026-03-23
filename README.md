# Inkasso Toolkit

**Avdragsplan · Forlik · Rentekalkulator · Simulator**

Et nettleserbasert verktøy for saksbehandlere i inkasso og innfordring. Kjører lokalt i nettleseren – ingen installasjon, ingen server, ingen innlogging.

---

## Filstruktur

```
/
├── index.html
├── css/
│   └── styles.css
└── js/
    ├── utils.js            # Formatering, parsing, datoer, toast
    ├── validering.js       # Datovalidering, autoformat, DOMContentLoaded
    ├── dato.js             # Datepicker (kalender)
    ├── avdrag-grunnlag.js  # Konstanter, rentesatser, salærsatser, helligdager
    ├── rente.js            # Rentekalkulator
    ├── forlik.js           # Forliksberegning
    ├── avdrag-beregn.js    # Avdragsplan – hovedberegning og binærsøk
    ├── avdrag-plan.js      # Avdragsplan – rendering, redigering, PDF-eksport
    ├── simulator.js        # «Hva hvis?»-simulator
    ├── saker.js            # Lagrede saker, tabs, tema
    ├── eksport.js          # PDF- og CSV-eksport
    └── satser-modal.js     # Modal med gjeldende inkassosatser og lovlenker
```

> **Viktig:** Script-filene må lastes i denne rekkefølgen i `index.html`. Hver fil avhenger av funksjoner definert i filene over den.

---

## Navigasjon

| Fane | Rolle |
|---|---|
| **📅 Avdragsplan** | Hovedverktøyet – her starter og jobber saksbehandler mest |
| **⚖ Forlik** | Beregn forliksbeløp og generer forlikstekst/e-post |
| **🔧 Verktøy** | Rentekalkulator og Simulator samlet |

Fra Avdragsplan-fanen kan man hoppe direkte til Forlik, Rentekalkulator eller Simulator via snarveisknapper. Tallene fra avdragsplanen fylles automatisk inn i det valgte verktøyet.

---

## Moduler

### 📅 Avdragsplan

Beregner en fullstendig avdragsplan med løpende renter, salær og dekningsrekkefølge.

- Automatisk inkassosalær basert på Finanstilsynets satser 2026
- Tungt salær: BO-dato + 14 dagers betalingsfrist + 28 dagers oversittelse (§ 2-3), forskyves til neste virkedag
- Purregebyr med validering: maks kr 76 (forbruker) / kr 460 (næring)
- IV-forfallsdato: min. 14 dager etter fakturaforfall
- Avdragsavtale før BO: egne regler for IV ikke forfalt / IV forfalt
- Binærsøk for lik terminbeløp med faktiske kalenderdager
- Manuell redigering av dato og beløp direkte i tabellen
- Datoendring forskyver påfølgende terminer hele måneder og bevarer dag-i-måneden
- Avdragssalær: 1,5 × inkassosatsen – **ikke** ved rettslig inkasso
- Eksporter avdragsplan som PDF eller CSV

### ⚖ Forlik

- Juster rabatt via slidere: total, renter, salær og/eller hovedstol
- Proporsjonal fordeling: rabatten fordeles likt på alle poster
- Lås opp inntil 100% rabatt på hovedstol
- Kopier forliksforslag som tekst eller ferdig e-postmal (14 dagers frist)
- Eksporter som PDF

### % Rentekalkulator

- Historiske forsinkelsesrentesatser 1994–2026
- Automatisk splitt ved 1. januar og 1. juli hvert år
- Foreldelse-informasjonspanel

### ⚡ Simulator

- Live «Hva hvis?»-beregning under telefonsamtale
- Avdragsslider: 100% = 2 avdrag (saldo/2)
- Hurtigvalg: kr 500 / 1 000 / 1 500 / 2 000 / 4 avdrag
- Realitetsindikator: grønn (≤ 3 år) / gul (≤ 5 år) / rød (> 5 år)
- Forhandlingstips: «Hvis du øker til X, er du ferdig på Y måneder»
- Foreslå optimalt avdrag basert på saldostørrelse

---

## Avdragsavtale før BO

### IV ikke forfalt
- Krav under kr 2 500: ingen avdragsavtale
- Krav over kr 2 500: 25% betales innen IV-fristen, restbeløp i maks 3 avdrag, ingen salær

### IV forfalt – BO ikke sendt
- Maks 4 avdrag, første avdrag ≥ 25% av totalkravet
- Lett salær på dato saksbehandler angir – **ikke** tungt salær
- Dokumenter i saksnotat at skyldner er informert
- Ved mislighold: **ikke friskmeld** – send Betalingsoppfordring

---

## Lagring og saker

All data lagres i `localStorage` under nøkkelen `kred_saker`. Ingenting sendes til server.

- **Ctrl+S** lagrer aktiv sak manuelt
- Aktiv sak vises med blå banner – endringer lagres automatisk
- Nullstill-knappene viser bekreftelsesdialog før data slettes

---

## Vedlikehold

| Hva | Hvor | Når |
|---|---|---|
| Rentesatser | `RENTE_SATSER` i `avdrag-grunnlag.js` | 1. jan og 1. jul hvert år |
| Inkassosatsen | `INKASSOSATS = 750` i `avdrag-grunnlag.js` | Ved endring fra Finanstilsynet |
| Inkassosalær-satser | `SALAR_SATSER` i `avdrag-grunnlag.js` | Ved endring fra Finanstilsynet |

---

## Tastatursnarvei

| Snarvei | Funksjon |
|---|---|
| **Ctrl+S** | Lagre aktiv sak |

---

## Lovhenvisninger

| | |
|---|---|
| § 2-2 | Lett salær – inkassoforskriften |
| § 2-3 | Tungt salær og 28-dagersregelen – inkassoforskriften |
| § 9 | Krav til inkassovarsel – inkassoloven |
| § 10 | Krav til betalingsoppfordring – inkassoloven |
| Forsinkelsesrenteloven | Satser fastsatt av Finanstilsynet halvårlig |

---

## Teknisk

| | |
|---|---|
| Teknologi | Vanilla JS, HTML, CSS – ingen rammeverk |
| PDF-eksport | jsPDF 2.5.1 fra `cdnjs.cloudflare.com` |
| Fonter | DM Sans og DM Mono fra Google Fonts |
| Lagring | `localStorage` – ingen server |
| Kompatibilitet | Alle moderne desktop-nettlesere |

---

*© 2026 William H.B. — Inkasso Toolkit*
