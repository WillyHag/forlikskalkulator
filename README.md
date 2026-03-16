# Inkasso Toolkit
**Forlik · Avdragsordning · Renter**

© 2026 William H.B. — Alle rettigheter forbeholdt

---

## Oversikt

Inkasso Toolkit er et nettleserbasert verktøy for saksbehandlere i inkassobransjen. Verktøyet samler de tre mest sentrale beregningene i én enkelt fil som kjøres direkte i nettleseren – ingen installasjon, ingen server, ingen innlogging.

| | |
|---|---|
| **Type** | Frittstående HTML-fil (single-page application) |
| **Teknologi** | Vanilla JavaScript, CSS, HTML – ingen rammeverk |
| **Avhengigheter** | jsPDF (CDN) for PDF-eksport |
| **Lagringssted** | LocalStorage i nettleseren |
| **Kompatibilitet** | Alle moderne desktop-nettlesere |

---

## Moduler

### ⚖ Forlik

Kalkulatoren beregner forliksbeløp basert på kravets poster og ønsket rabattstrategi.

- Legg inn hovedstol, inkassogebyr/salær, renter og rettslige kostnader
- Juster rabatt via slidere for total reduksjon, renter, salær og hovedstol
- Skriv inn forliksbeløp direkte for å overstyre sliderberegningen
- **Proporsjonal fordeling**: rabatten fordeles likt på alle poster (valgfri modus)
- Lås opp inntil 100% rabatt på hovedstol (krever bekreftelse)
- Kopier forliksforslag som tekst eller ferdig e-postmal
- E-postmalen inkluderer frist (14 dager fra i dag), kontonummer og KID

### 📅 Avdragsordning

Beregner en fullstendig avdragsplan med løpende renter og korrekt salærlogikk.

- Automatisk inkassosalær basert på Finanstilsynets satser 2026
- Tungt salær beregnes: BO-dato + 14 dagers betalingsfrist + 28 dagers oversittelse (§ 2-3)
- Tungt salær-dato forskyves til neste virkedag ved helg/helligdag
- Manuell redigering av dato og beløp per termin direkte i avdragstabellen
- Ekstra terminer legges til automatisk dersom restbeløp overstiger månedlig beløp
- Avdragssalær: 1,5 × inkassosatsen, + 25% MVA uten fradragsrett
- Avdragssalær beregnes **ikke** ved rettslig inkasso (rettslige kostnader > 0)
- Eksporter avdragsplan som PDF

### % Renter

Beregner forsinkelsesrenter med automatisk splitt ved halvårlige satsendringer.

- Historiske forsinkelsesrentesatser fra 1994 til 2026
- Automatisk renteperiode-splitt ved 1. januar og 1. juli hvert år
- Viser detaljert oversikt over renteperioder og delsummer
- Informasjonspanel om foreldelse av rentekrav

---

## Avdragsavtale før BO

Verktøyet håndterer to scenarioer når «BO ikke sendt» er aktivert:

### IV ikke forfalt

- Krav under kr 2 500: ingen avdragsavtale – betales innen IV-fristen
- Krav over kr 2 500: 25% betales innen IV-fristen, restbeløp i maks 3 avdrag
- Ingen salær legges på
- Avdragsordning registreres kun hvis første avdrag mottas

### IV forfalt, BO ikke sendt

- Maks 4 avdrag
- Første avdrag ≥ 25% av totalkravet
- Lett salær påføres på dato saksbehandler angir (ikke tungt salær)
- Dokumenter i saksnotat at skyldner er informert om omkostningene
- Ved mislighold: **ikke friskmeld** – send Betalingsoppfordring

---

## Vedlikehold

### Oppdater rentesatser

Finanstilsynet publiserer nye forsinkelsesrentesatser 1. januar og 1. juli hvert år. Legg til ny rad i `RENTE_SATSER`-arrayen i `index.html`:

```javascript
{ fra: new Date(2026, 6, 1), sats: XX.XX },
```

### Oppdater inkassosatsen

`INKASSOSATS = 750` øverst i script-seksjonen. Avdragssalær beregnes automatisk som 1,5 × denne satsen (+ 25% MVA uten fradragsrett).

### Oppdater inkassosalær-satser

`SALAR_SATSER`-arrayen inneholder satsene for lett og tungt salær per skyldnertype og MVA-kombinasjon (Finanstilsynet 2026).

---

## Lagring og data

All data lagres lokalt i nettleserens `localStorage` under nøkkelen `kred_saker`. Ingenting sendes til server.

- Lagre og hent beregnede saker via «Lagrede saker»-knappen i headeren
- Aktiv sak vises med blå banner – endringer lagres automatisk
- Saker slettes ved å klikke ✕ i sakslisten
- Data slettes hvis nettleseren rydder localStorage

---

## Teknisk oversikt

Verktøyet er én enkelt HTML-fil og kan distribueres via GitHub Pages eller tilsvarende statisk hosting.

| | |
|---|---|
| **Distribusjon** | Kopier `index.html` til en statisk webserver |
| **GitHub Pages** | Legg filen i roten av et offentlig repository |
| **Offline** | Åpnes direkte som fil i nettleseren (`file://`) |
| **PDF-bibliotek** | jsPDF 2.5.1 lastes fra `cdnjs.cloudflare.com` |
| **Fonter** | DM Sans og DM Mono lastes fra Google Fonts |

---

## Lovhenvisninger

| Paragraf | Beskrivelse |
|---|---|
| § 2-2 | Maksimalsatser for enkle saker (lett salær) – inkassoforskriften |
| § 2-3 | Maksimalsatser for tyngre saker (tungt salær) – inkassoforskriften |
| § 10 | Krav til betalingsoppfordring – inkassoloven |
| Forsinkelsesrenter | Forsinkelsesrenteloven – satser fastsatt av Finanstilsynet |

---

*© 2026 William H.B. – Inkasso Toolkit*
