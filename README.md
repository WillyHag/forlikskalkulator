# Inkasso Toolkit

**Avdragsplan · Forlik · Rentekalkulator · Simulator**

© 2026 William H.B. — Alle rettigheter forbeholdt

---

## Oversikt

Inkasso Toolkit er et nettleserbasert verktøy for saksbehandlere i inkassobransjen. Alt kjører i én enkelt HTML-fil direkte i nettleseren – ingen installasjon, ingen server og ingen innlogging kreves.

| | |
|---|---|
| **Type** | Frittstående HTML-fil (single-page application) |
| **Teknologi** | Vanilla JavaScript, CSS, HTML – ingen rammeverk |
| **Avhengigheter** | jsPDF (CDN) for PDF-eksport |
| **Lagring** | LocalStorage i nettleseren – ingen data sendes til server |
| **Kompatibilitet** | Alle moderne desktop-nettlesere |

---

## Navigasjon

Verktøyet er organisert i tre faner øverst:

| Fane | Rolle |
|---|---|
| **📅 Avdragsplan** | Hovedverktøyet. Her starter og jobber saksbehandler mest. |
| **⚖ Forlik** | Forliksandel og generering av forlikstekst/e-post. |
| **🔧 Verktøy** | Samler Rentekalkulator og Simulator som støtteverktøy. |

Fra Avdragsplan-fanen kan man hoppe direkte til Forlik, Rentekalkulator eller Simulator via snarveisknapper. Tallene fra avdragsplanen fylles automatisk inn i det valgte verktøyet.

---

## 📅 Avdragsplan

Hovedmodulen. Beregner en fullstendig avdragsplan med løpende renter, salær og dekningsrekkefølge.

### Kravets poster

- Skyldnertype og MVA-status → automatisk inkassosalær (Finanstilsynets satser 2026)
- Opprinnelig forfallsdato (faktura) – grunnlag for renteberegning
- Purregebyr/standardkompensasjon med validering (maks kr 76 forbruker / kr 460 næring)
- Forfallsdato inkassovarsel (IV): min. 14 dager etter fakturaforfall, kan ligge frem i tid
- BO-dato og hake for «BO ikke sendt»
- Inkassosalær auto-beregnet; lett og tungt salær vises separat
- Rettslige kostnader

### Tungt salær

Beregnes etter § 2-3 i inkassoforskriften:

- BO-dato + 14 dagers betalingsfrist (forskyves til neste virkedag ved helg/helligdag)
- \+ 28 dagers oversittelse = første mulige dato for tungt salær
- Selve tungt salær-datoen kan falle på helg/helligdag uten justering

### Avdragsavtale før BO

**IV ikke forfalt**

- Krav under kr 2 500: ingen avdragsavtale – skyldner betaler innen IV-fristen
- Krav over kr 2 500: 25% betales innen IV-fristen, restbeløp i maks 3 avdrag
- Ingen salær legges på. Registreres kun hvis første avdrag mottas.

**IV forfalt – BO ikke sendt**

- Maks 4 avdrag, første avdrag ≥ 25% av totalkravet
- Lett salær påføres på dato saksbehandler angir
- Tungt salær påføres ikke – husk å dokumentere i saksnotat
- Ved mislighold: **ikke friskmeld** – send Betalingsoppfordring

### Avdragsplan

- Binærsøk for lik terminbeløp med faktiske kalenderdager mellom forfall
- Manuell redigering av dato og beløp per termin direkte i tabellen
- Datoendring: forskyver påfølgende terminer hele måneder og bevarer dag-i-måneden
- Ekstra terminer legges til automatisk dersom restbeløp overstiger terminbeløpet
- Avdragssalær: 1,5 × inkassosatsen – beregnes **ikke** ved rettslig inkasso
- Eksporter avdragsplan som PDF

---

## ⚖ Forlik

Beregner forliksbeløp og genererer tekst til e-post eller vedtak.

- Legg inn hovedstol, gebyr/salær, renter og rettslige kostnader
- Juster rabatt via slidere: total reduksjon, renter, salær og/eller hovedstol
- Skriv inn forliksbeløp direkte for å overstyre slider-beregningen
- Proporsjonal fordeling: rabatten fordeles likt på alle poster (valgfri modus)
- Lås opp inntil 100% rabatt på hovedstol (krever bekreftelse)
- Kopier forliksforslag som tekst eller ferdig e-postmal med 14 dagers frist

---

## 🔧 Verktøy

### % Rentekalkulator

Beregner forsinkelsesrenter med automatisk splitt ved halvårlige satsendringer.

- Historiske forsinkelsesrentesatser 1994–2026 (siste: 12,00% fra 01.01.2026)
- Automatisk renteperiode-splitt ved 1. januar og 1. juli hvert år
- Informasjonspanel om foreldelse av rentekrav

### ⚡ Simulator

Live «Hva hvis?»-verktøy for bruk under telefonsamtale eller e-postskriving.

- Total saldo, startdato og månedlig avdrag – alt oppdateres umiddelbart
- Avdragsslider med saldo som maksimumsgrense (1 avdrag = hele saldoen)
- Hurtigvalg: kr 500 / 1 000 / 1 500 / 2 000 / 4 avdrag
- Realitetsindikator: grønn (≤ 3 år) / gul (≤ 5 år) / rød (> 5 år)
- Forhandlingstips: «Hvis du øker til X, er du ferdig på Y måneder»
- Foreslå optimalt avdrag basert på saldostørrelse
- Kopier fullstendig nedbetalingstabell som ferdig formatert tekst

---

## Lagring og saker

All data lagres lokalt i nettleserens `localStorage`. Ingenting sendes til server.

- Lagre og hent saker via «Lagrede saker»-knappen i headeren
- Aktiv sak vises med blå banner – endringer lagres automatisk
- Saker slettes ved å klikke ✕ i sakslisten
- Data kan forsvinne hvis nettleseren rydder localStorage

---

## Vedlikehold

| Hva | Hvordan |
|---|---|
| **Rentesatser** | Oppdater `RENTE_SATSER`-arrayen 1. jan og 1. jul hvert år |
| **Inkassosatsen** | `INKASSOSATS = 750` øverst i script. Avdragssalær = 1,5 × denne. |
| **Inkassosalær-satser** | `SALAR_SATSER`-arrayen – satser per skyldnertype og MVA-kombinasjon |
| **PDF-bibliotek** | jsPDF 2.5.1 lastes fra `cdnjs.cloudflare.com` |
| **Fonter** | DM Sans og DM Mono fra Google Fonts |

---

## Lovhenvisninger

| Paragraf | Beskrivelse |
|---|---|
| § 2-2 | Lett salær – inkassoforskriften |
| § 2-3 | Tungt salær – inkassoforskriften |
| § 9 | Inkassovarsel – inkassoloven |
| § 10 | Betalingsoppfordring – inkassoloven |
| Forsinkelsesrenteloven | Satser fastsatt av Finanstilsynet halvårlig |

---

*© 2026 William H.B. — Inkasso Toolkit*
