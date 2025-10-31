# Verlofrooster Application - Technische Documentatie

## Overzicht
`verlofRooster.aspx` is het hoofdentry-point van de Verlofrooster applicatie. Het is een SharePoint-gehoste pagina die een moderne React 18 single-page application (SPA) bootstrapt zonder build proces.

---

## Architectuur Overzicht

### 1. **SharePoint Integration**
De pagina is een SharePoint WebPartPage die draait binnen SharePoint 2016/2013:
```html
<%@ Page Language="C#" Inherits="Microsoft.SharePoint.WebPartPages.WebPartPage, Microsoft.SharePoint, Version=16.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
```

### 2. **Technology Stack**
- **Frontend Framework**: React 18 (via CDN, geen build proces)
- **Module System**: ES6 modules (native browser imports)
- **API**: SharePoint REST API
- **Styling**: Pure CSS (geen preprocessors)
- **Icons**: Font Awesome 6.4.0

---

## Laadproces (Bootstrap Sequence)

### Fase 1: HTML Head - Dependencies laden
```
1. CSS bestanden laden (4 stylesheets + favicon)
2. Font Awesome CDN laden
3. React 18 production builds laden van unpkg.com
4. Fallback: Lokale React kopieën als CDN faalt
5. configLijst.js laden (SharePoint lijst configuratie)
```

#### CSS Dependencies:
- `verlofrooster_s.css` - Hoofd stylesheet
- `verlofrooster_s1.css` - Aanvullende stijlen
- `mededelingen.css` - Mededelingen component styling
- `zittingsvrij-dagdeel.css` - ZV/ZVO/ZVM blok kleuren

#### External Dependencies:
- **React 18**: `https://unpkg.com/react@18/umd/react.production.min.js`
- **ReactDOM 18**: `https://unpkg.com/react-dom@18/umd/react-dom.production.min.js`
- **Font Awesome 6.4.0**: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css`

#### Fallback Mechanism:
```javascript
if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
    // Laad lokale SharePoint-gehoste React kopieën
    document.write('<script src="https://som.org.om.local/sites/MulderT/SBeheer/CPW/L/react.development.js"><\/script>');
    document.write('<script src="https://som.org.om.local/sites/MulderT/SBeheer/CPW/L/react-dom.development.js"><\/script>');
}
```

### Fase 2: Body - Application Bootstrap

#### 2.1 Single Entry Point
```html
<script type="module" src="js/app.js"></script>
```

De ASPX pagina laadt alleen `js/app.js` - alle verdere imports en setup gebeurt daar.

#### 2.2 app.js Module Execution

**Global Setup (in app.js):**
```javascript
window.React = React;           // Maak React globaal beschikbaar
window.ReactDOM = ReactDOM;     // Maak ReactDOM globaal beschikbaar
```

**Module Imports (in volgorde):**

**Core Components:**
1. `ErrorBoundary` - Error handling wrapper component
2. `UserRegistrationCheck` - Gebruikersvalidatie component
3. `RoosterApp` - Hoofd applicatie component

**Services:**
1. `sharepointService.js` - SharePoint CRUD operaties
2. `permissionService.js` - Gebruikersrechten validatie
3. `linkInfo.js` - URL generatie voor navigatie
4. `loadingLogic.js` - Data caching en loading management

**UI Components:**
1. `contextmenu.js` - Permissie checks voor context menu
2. `tooltipbar.js` - Tooltip manager singleton
3. `profielkaarten.js` - Gebruikersprofielen component
4. `userUtils.js` - Gebruikers utility functies

**Tutorial:**
1. `roosterHandleiding.js` - Handleiding modal
2. `roosterTutorialOrange.js` - Interactieve tutorial

**Bootstrap en Render:**
- `initializeApp()` functie maakt React root en rendert applicatie
- Tutorial functies worden globaal beschikbaar gemaakt

---

## Component Hiërarchie

```
ErrorBoundary
└── MainAppWrapper
    └── UserRegistrationCheck
        └── App
            └── RoosterApp (hoofdapplicatie)
```

### Component Flow:

#### 1. **ErrorBoundary**
- Vangt JavaScript errors op
- Voorkomt complete app crash
- Toont foutmelding aan gebruiker

#### 2. **MainAppWrapper**
- Houdt app state bij (`appData`)
- Callback handler: `handleUserValidated(isValid, currentUser, userPermissions)`
- Rendert UserRegistrationCheck

#### 3. **UserRegistrationCheck**
- Haalt huidige gebruiker op via SharePoint API
- Valideert of gebruiker geregistreerd is in Medewerkers lijst
- Bepaalt gebruikersrechten (isAdmin, isFunctional, isTaakbeheer)
- Roept `onUserValidated` callback aan met resultaten
- Rendert children (App) pas na succesvolle validatie

#### 4. **App**
- Ontvangt `currentUser` en `userPermissions` props
- Delegeert naar RoosterApp component
- Markeert gebruiker als gevalideerd: `isUserValidated: true`

#### 5. **RoosterApp** (in `js/core/roosterApp.js`)
- Hoofdapplicatie logica
- State management voor:
  - Rooster data (verlof, ziekte, compensatie-uren, zittingsvrij)
  - Mededelingen
  - Geselecteerde maand/jaar
  - Modals (verlof form, ziekte form, etc.)
- Rendert:
  - Header (navigatie)
  - RoosterGrid (hoofdrooster)
  - Formulieren (modals)
  - Legenda
  - Mededelingen

---

## Data Flow

### 1. **Initial Load**
```
verlofRooster.aspx
  → UserRegistrationCheck (valideer gebruiker)
  → RoosterApp.useEffect (load initial data)
  → loadingLogic.loadFilteredData()
  → sharepointService.fetchSharePointList()
  → SharePoint REST API
```

### 2. **User Actions**
```
User clicks → Event Handler (in RoosterApp)
  → Modal opens (form component)
  → User submits → handleSubmit
  → sharepointService.createSharePointListItem()
  → clearAllCache()
  → silentRefreshData(true)
  → Update UI
```

### 3. **Caching Strategy**
- **loadingLogic.js** beheert cache
- Cache keys: `${listName}_${filterCondition}`
- `clearAllCache()` wordt aangeroepen na mutations
- `silentRefreshData(true)` forceert reload van data

---

## Key Services

### sharepointService.js
**Functies:**
- `fetchSharePointList(listName, options)` - Haalt lijst items op
- `createSharePointListItem(listName, data)` - Maakt nieuw item
- `updateSharePointListItem(listName, id, data)` - Update item
- `deleteSharePointListItem(listName, id)` - Verwijdert item
- `getCurrentUser()` - Huidige gebruiker ophalen
- `getUserInfo(loginName)` - Gebruikersinfo ophalen

**Gebruikt:**
- SharePoint REST API: `/_api/web/lists/getbytitle('...')/items`
- Request Digest voor POST/UPDATE/DELETE
- OData filters en expands

### permissionService.js
**Functies:**
- `getCurrentUserGroups()` - Haalt gebruikersgroepen op
- `isUserInAnyGroup(groupNames)` - Check of gebruiker in groep zit

**Groepen:**
- `1. Sharepoint beheer` → isAdmin
- `1.1. Mulder MT` → isAdmin
- `2.3. Senioren beoordelen` → isFunctional
- `2.4. Senioren administratie` → isFunctional
- `2.6 Roosteraars` → isFunctional
- `2.5 Taakbeheer rooster` → isTaakbeheer

### loadingLogic.js
**Functies:**
- `loadFilteredData(listName, filters, forceReload)` - Data ophalen met cache
- `clearAllCache()` - Alle cache legen
- `updateCacheKey(listName, options)` - Cache key updaten
- `shouldReloadData(cacheKey, maxAgeMinutes)` - Check of reload nodig is

**Cache Strategie:**
- In-memory cache (Map object)
- Timestamp-based invalidatie
- Manual clear na mutations

---

## SharePoint Lijsten (via configLijst.js)

De applicatie gebruikt deze SharePoint lijsten:

1. **Medewerkers** - Gebruikersregistratie
2. **Verlof** - Verlofaanvragen
3. **Ziekte** - Ziekmeldingen
4. **CompensatieUren** - Extra gewerkte uren
5. **IncidenteelZittingVrij** - Zittingsvrije dagen (ZV/ZVO/ZVM)
6. **VerlofRedenen** - Verlofredenenen (soorten verlof)
7. **Teams** - Team/Afdeling definitie
8. **DagenIndicators** - Dag types en kleuren (feestdagen, ZV, etc.)
9. **Mededelingen** - Systeemmededelingen
10. **MeldFouten** - Foutmeldingen (voor Meldingencentrum)

Configuratie: `js/config/configLijst.js`

---

## UI Components

### Header (js/ui/header.js)
- Navigatie knoppen (Admin, Beheer, Behandelen, **Meldingen**)
- Gebruikersmenu met dropdown
- Profielfoto display
- Links naar:
  - `pages/adminCentrum/adminCentrumN.aspx`
  - `pages/beheerCentrum/beheerCentrumN.aspx`
  - `pages/behandelCentrum/behandelCentrumN.aspx`
  - `pages/meldingenCentrum/meldingenCentrum.aspx` ✨ (nieuw toegevoegd)
  - `pages/instellingenCentrum/instellingenCentrumN.aspx`

### RoosterGrid (js/ui/RoosterGrid.js)
- Rendert maandrooster in grid
- Rijen = medewerkers
- Kolommen = dagen
- Cellen bevatten:
  - Verlofblokken (groen)
  - Ziekmeldingen (rood)
  - Compensatie-uren (blauw)
  - Zittingsvrij (paars/oranje/donkeroranje)
  - Feestdagen (geel)

### DagCell (js/ui/dagCell.js)
- Rendert individuele dagcel
- Toont blokken voor verlof/ziekte/compensatie/ZV
- Hover tooltips (via TooltipManager)
- Click handlers voor contextmenu
- Color mapping via `dagenIndicators` prop

### Forms (js/ui/forms/)
- **VerlofAanvraagForm.js** - Verlof aanvragen
- **ZiekteMeldingForm.js** - Ziekte melden
- **CompensatieUrenForm.js** - Extra uren registreren
- **ZittingsvrijForm.js** - Zittingsvrije dagen registreren
  - **Dagdeel dropdown**: Hele dag / Ochtend / Middag
  - **Auto-calculate times**: 08:00-16:00 / 08:00-11:59 / 12:01-16:00
  - **Afkorting mapping**: ZV / ZVO / ZVM

### Modal System (js/ui/Modal.js)
- React Portal-based modals
- Overlay met backdrop
- Escape key support
- Click outside to close

### Tooltip System (js/ui/tooltipbar.js)
- Singleton pattern: `TooltipManager`
- React Portal rendering
- Toont:
  - Gebruikersnaam
  - Datum range
  - Type activiteit
  - **Tijden** (voor ZV blokken) ✨
  - **Dagdeel** (voor ZV blokken) ✨
  - Reden (voor verlof)
  - Toelichting

---

## Recent Updates (ZV Enhancement)

### Zittingsvrij Dagdeel Feature:
1. **Dagdeel field** toegevoegd aan IncidenteelZittingVrij lijst
2. **Dropdown** in ZittingsvrijForm: Hele dag / Ochtend / Middag
3. **Auto-time calculation**: 
   - Hele dag: 08:00-16:00 → ZV (paars)
   - Ochtend: 08:00-11:59 → ZVO (oranje)
   - Middag: 12:01-16:00 → ZVM (donkeroranje)
4. **Tooltip enhancement**: Toont start/eindtijd en dagdeel
5. **Dynamic colors**: Fetcht kleuren van DagenIndicators lijst
6. **CSS**: `zittingsvrij-dagdeel.css` voor ZVO/ZVM styling

### Submit Handler Improvements:
- `clearAllCache()` voor refresh
- Try-catch-finally voor error handling
- `setBackgroundRefreshing(true)` tijdens reload
- Modal sluit vóór data refresh (voorkomt freeze)

---

## Tutorial System

### roosterHandleiding.js
- Modal met complete handleiding
- Secties: Introductie, Verlof, Ziekte, Compensatie, ZV
- Globale functie: `window.openHandleiding()`

### roosterTutorialOrange.js
- Interactieve stap-voor-stap tutorial
- Highlight UI elementen
- Overlay met instructies
- Globale functie: `window.startTutorial()`

---

## Error Handling

### ErrorBoundary Component
- Vangt React component errors
- Toont fallback UI
- Logt errors naar console
- Voorkomt volledige app crash

### Try-Catch Patterns
- Async operations wrapped in try-catch
- User-friendly error messages via alerts
- Console logging voor debugging

---

## Performance Optimizations

1. **React.memo**: Components geoptimaliseerd met memo
2. **useCallback**: Event handlers gememoized
3. **useMemo**: Expensive calculations gecached
4. **Cache System**: loadingLogic voorkomt duplicate API calls
5. **useRef**: Voorkomt form re-initialization

---

## Development Notes

### No Build Process
- Direct browser ES6 modules
- No webpack/babel/transpilation
- React via CDN (production builds)
- Direct file editing, refresh browser

### Clean Architecture
- **verlofRooster.aspx**: Minimal HTML entry point, loads only CSS/React CDN/app.js
- **js/app.js**: Application bootstrap - handles all imports, setup, and rendering
- **Separation of Concerns**: SharePoint markup separated from application logic

### React Pattern
```javascript
const { createElement: h } = React;
// h('div', props, children) in plaats van JSX
```

### SharePoint Context
- Site URL: `https://som.org.om.local/sites/MulderT/CustomPW/Verlof/`
- REST API: `/_api/web/lists/...`
- Authentication: SharePoint session-based

---

## Navigation Structure

```
verlofRooster.aspx (main)
├── pages/
│   ├── adminCentrum/adminCentrumN.aspx (Admin only)
│   ├── beheerCentrum/beheerCentrumN.aspx (Functional users)
│   ├── behandelCentrum/behandelCentrumN.aspx (Taakbeheer users)
│   ├── meldingenCentrum/meldingenCentrum.aspx (All users) ✨
│   └── instellingenCentrum/instellingenCentrumN.aspx (All users)
```

---

## Future Improvements / Pending

### SharePoint Configuration (Manual):
- [ ] Add "Dagdeel" column to IncidenteelZittingVrij (Choice: Hele dag, Ochtend, Middag)
- [ ] Add ZVO record to DagenIndicators (Afkorting: ZVO, Kleur: #e67e22)
- [ ] Add ZVM record to DagenIndicators (Afkorting: ZVM, Kleur: #d35400)

### Code Enhancements:
- [ ] Add nav-btn CSS styling voor Meldingen knop
- [ ] Implement loading states voor betere UX
- [ ] Add offline detection
- [ ] Implement service worker voor caching

---

## Troubleshooting

### Common Issues:

**1. "React is not defined"**
- Check if unpkg.com accessible
- Fallback to lokale React files
- Check browser console for CDN errors

**2. "Cannot read property of undefined" in UserRegistrationCheck**
- Gebruiker niet in Medewerkers lijst
- SharePoint permissies incorrect
- Lijst configuratie incorrect

**3. "Screen freezes after submit"**
- Fixed: Modal sluit nu vóór refresh
- clearAllCache() toegevoegd
- Try-catch-finally pattern geïmplementeerd

**4. "New blocks don't appear"**
- Fixed: clearAllCache() vóór silentRefreshData()
- Cache invalidation verbeterd

**5. "MeldingenCentrum werkt niet"**
- Fixed: Navigatie knop toegevoegd in header.js
- Page was niet bereikbaar via UI

---

## Deployment

### Bestanden naar SharePoint uploaden:
1. Upload HTML/ASPX naar document library
2. Upload JS modules naar `/js/` folder structuur
3. Upload CSS naar `/css/` folder
4. Upload icons naar `/icons/` folder
5. Configureer SharePoint lijsten via Site Contents
6. Stel permissies in voor SharePoint groups

### Required SharePoint Lists:
Zie sectie "SharePoint Lijsten" voor complete lijst.

---

**Laatste update**: 30 oktober 2025
**Versie**: React 18 modernization complete
**Status**: Production ready (pending SharePoint lijst configuratie)
