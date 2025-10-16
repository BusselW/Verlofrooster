<<<<<<< HEAD
Y: Fixed context menu date selection logic to properly pass selected date ranges to modal forms.

The issue was that the context menu was setting the selection state immediately before opening modals, which could cause timing issues with React state updates. 

Changes made to context menu onClick handlers:
1. Reorganized logic to determine the final selection first (using existing selection, two-click range, or single-day)
2. Always call setSelection() to ensure state is updated 
3. Added setTimeout() to delay modal opening until after React state update completes
4. This ensures forms receive the correct date ranges from two-click selections

Applied to all context menu "Nieuw" options:
- Verlof aanvragen
- Ziek melden  
- Compensatieuren doorgeven
- Zittingsvrij maken

Context menu now works the same as Floating Action Button for date selection handling.

Previous console log entries below:
---

X: Fixed "Datetimestring is not a function" error in VerlofAanvraagForm.js by adding type checking to splitDateTime function.
=======
{
  "lijstId": "aa8c8320-2a08-49d2-ad05-7c4b673af5b0",
  "lijstTitel": "Mededeling",
  "webUrl": "/sites/MulderT/CustomPW/Verlof",
  "verborgen": false,
  "baseTemplate": 100,
  "lijstBeschrijving": null,
  "velden": [
    {
      "titel": "Id",
      "interneNaam": "ID",
      "type": "Counter",
      "verborgen": false,
      "verwijderbaar": false,
      "verplicht": false,
      "beschrijving": null,
      "standaardWaarde": null,
      "uniekeWaarden": false,
      "validatieFormule": null
    },
    {
      "titel": "Titel",
      "interneNaam": "Title",
      "type": "Text",
      "verborgen": false,
      "verwijderbaar": false,
      "verplicht": false,
      "beschrijving": "Geef het bestand een naam (deze zal worden gebruikt voor de zoekmachine)",
      "standaardWaarde": null,
      "uniekeWaarden": false,
      "validatieFormule": null
    },
    {
      "titel": "Aanvulling",
      "interneNaam": "Aanvulling",
      "type": "Note",
      "verborgen": false,
      "verwijderbaar": true,
      "verplicht": false,
      "beschrijving": "Geef toelichting op de melding. Waarom is deze melding actief? Wat is er gaande?",
      "standaardWaarde": null,
      "uniekeWaarden": false,
      "validatieFormule": null,
      "formatting": {
        "richText": true,
        "richTextMode": "FullHtml",
        "numLines": 6,
        "appendOnly": false
      }
    },
    {
      "titel": "DatumTijdEinde",
      "interneNaam": "DatumTijdEinde",
      "type": "DateTime",
      "verborgen": false,
      "verwijderbaar": true,
      "verplicht": false,
      "beschrijving": "Type datum en tijd. Vanaf welke dag/tijdstip moet de mededeling niet meer weergeven worden op de pagina?",
      "standaardWaarde": null,
      "uniekeWaarden": false,
      "validatieFormule": null,
      "formatting": {
        "dateTimeFormat": "Disabled"
      }
    },
    {
      "titel": "DatumTijdStart",
      "interneNaam": "DatumTijdStart",
      "type": "DateTime",
      "verborgen": false,
      "verwijderbaar": true,
      "verplicht": false,
      "beschrijving": "Type datum en tijd. Vanaf welke dag/tijdstip moet de mededeling worden weergeven op de pagina?",
      "standaardWaarde": null,
      "uniekeWaarden": false,
      "validatieFormule": null,
      "formatting": {
        "dateTimeFormat": "Disabled"
      }
    },
    {
      "titel": "UitzendenAan",
      "interneNaam": "UitzendenAan",
      "type": "Note",
      "verborgen": false,
      "verwijderbaar": true,
      "verplicht": false,
      "beschrijving": "This is set-up as a memo field.  On our form this will be presented as a multi-select field where the choices are meant to be fetched from the Teams.Naam list. The user is meant to set a 'target audience' from this field (ergo, list the groups/teams that can see the notiifcation on their web-a;pplication). The goal is to make customized broadcasts which target groups of teams.\n\nFor data insertion: each selected value from this list is split with a delimiter ';'. For example: Verkeersborden, SV Flits Parkeren, Rijgedrag are one of the choices from this list. User checks Verrkeersborden and Rijgedrag:\n\nCheckbox inserts Verkeersborden (no delimiter) as the first choices, then for the second choice a delimiter gets added:\n\nVerkeersborden; Rijgedrag.\n\nThen the broadcoast should only be visible to employees registrerd to that group.",
      "standaardWaarde": null,
      "uniekeWaarden": false,
      "validatieFormule": null,
      "formatting": {
        "richText": true,
        "richTextMode": "FullHtml",
        "numLines": 6,
        "appendOnly": false
      }
    },
    {
      "titel": "username",
      "interneNaam": "username",
      "type": "Text",
      "verborgen": false,
      "verwijderbaar": true,
      "verplicht": false,
      "beschrijving": "Re-use the code that fetches the domain\\username (for example: org\\busselw) here. Insert that value when a new record is made.",
      "standaardWaarde": null,
      "uniekeWaarden": false,
      "validatieFormule": null
    }
  ]
}
>>>>>>> fbe406a2aa7a46b53a8cb097d5f6f80eded11809
