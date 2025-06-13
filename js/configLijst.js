// js/configLijst.js

/**
 * Configuratiebestand voor SharePoint Lijstdefinities.
 * Dit script is nu idempotent gemaakt, wat betekent dat het veilig meerdere keren geladen kan worden
 * zonder een "already been declared" fout te veroorzaken.
 */

if (typeof window.sharepointLijstConfiguraties === 'undefined') {
    window.sharepointLijstConfiguraties = {
      "CompensatieUren": {
        "lijstId": "91f54142-f439-4646-a9f8-ca4d96820e12",
        "lijstTitel": "CompensatieUren",
        "verborgen": false,
        "baseTemplate": 100,
        "velden": [
          { "titel": "Id", "interneNaam": "ID", "type": "Counter" },
          { "titel": "Titel", "interneNaam": "Title", "type": "Text" },
          { "titel": "Medewerker", "interneNaam": "Medewerker", "type": "Text" }, // Display Name of employee
          { "titel": "AanvraagTijdstip", "interneNaam": "AanvraagTijdstip", "type": "DateTime" },
          { "titel": "EindeCompensatieUren", "interneNaam": "EindeCompensatieUren", "type": "DateTime" },
          { "titel": "MedewerkerID", "interneNaam": "MedewerkerID", "type": "Text" }, // Username (login name) for linking
          { "titel": "Omschrijving", "interneNaam": "Omschrijving", "type": "Text" },
          { "titel": "StartCompensatieUren", "interneNaam": "StartCompensatieUren", "type": "DateTime" },
          { "titel": "Status", "interneNaam": "Status", "type": "Choice" },
          { "titel": "UrenTotaal", "interneNaam": "UrenTotaal", "type": "Text" }
        ]
      },
      "CompensatieUrenPerWeek": {
        "lijstId": "b05d42b9-91d4-4bc1-9782-e8ea9f630d01",
        "lijstTitel": "CompensatieUrenPerWeek",
        "verborgen": false,
        "baseTemplate": 100,
        "velden": [
          { "titel": "Id", "interneNaam": "ID", "type": "Counter" },
          { "titel": "Titel", "interneNaam": "Title", "type": "Text" },
          { "titel": "MedewerkerID", "interneNaam": "MedewerkerID", "type": "Text" }, // Username
          { "titel": "Ingangsdatum", "interneNaam": "Ingangsdatum", "type": "DateTime" },
          { "titel": "VeranderingsDatum", "interneNaam": "VeranderingsDatum", "type": "DateTime" },
          { "titel": "MaandagStart", "interneNaam": "MaandagStart", "type": "Text" },
          { "titel": "MaandagEind", "interneNaam": "MaandagEind", "type": "Text" },
          { "titel": "MaandagSoort", "interneNaam": "MaandagSoort", "type": "Text" },
          { "titel": "MaandagTotaal", "interneNaam": "MaandagTotaal", "type": "Text" },
          { "titel": "DinsdagStart", "interneNaam": "DinsdagStart", "type": "Text" },
          { "titel": "DinsdagEind", "interneNaam": "DinsdagEind", "type": "Text" },
          { "titel": "DinsdagSoort", "interneNaam": "DinsdagSoort", "type": "Text" },
          { "titel": "DinsdagTotaal", "interneNaam": "DinsdagTotaal", "type": "Text" },
          { "titel": "WoensdagStart", "interneNaam": "WoensdagStart", "type": "Text" },
          { "titel": "WoensdagEind", "interneNaam": "WoensdagEind", "type": "Text" },
          { "titel": "WoensdagSoort", "interneNaam": "WoensdagSoort", "type": "Text" },
          { "titel": "WoensdagTotaal", "interneNaam": "WoensdagTotaal", "type": "Text" },
          { "titel": "DonderdagStart", "interneNaam": "DonderdagStart", "type": "Text" },
          { "titel": "DonderdagEind", "interneNaam": "DonderdagEind", "type": "Text" },
          { "titel": "DonderdagSoort", "interneNaam": "DonderdagSoort", "type": "Text" },
          { "titel": "DonderdagTotaal", "interneNaam": "DonderdagTotaal", "type": "Text" },
          { "titel": "VrijdagStart", "interneNaam": "VrijdagStart", "type": "Text" },
          { "titel": "VrijdagEind", "interneNaam": "VrijdagEind", "type": "Text" },
          { "titel": "VrijdagSoort", "interneNaam": "VrijdagSoort", "type": "Text" },
          { "titel": "VrijdagTotaal", "interneNaam": "VrijdagTotaal", "type": "Text" }
        ]
      },
      "DagenIndicators": {
        "lijstId": "45528ed2-cdff-4958-82e4-e3eb032fd0aa",
        "lijstTitel": "DagenIndicators",
        "verborgen": false,
        "baseTemplate": 100,
        "velden": [
          { "titel": "Id", "interneNaam": "ID", "type": "Counter" },
          { "titel": "Titel", "interneNaam": "Title", "type": "Text" }, 
          { "titel": "Beschrijving", "interneNaam": "Beschrijving", "type": "Text" },
          { "titel": "Kleur", "interneNaam": "Kleur", "type": "Text" },
          { "titel": "Patroon", "interneNaam": "Patroon", "type": "Choice" },
          { "titel": "Validatie", "interneNaam": "Validatie", "type": "Text" }
        ]
      },
      "gebruikersInstellingen": {
        "lijstId": "c83b6af8-fee3-4b3a-affd-b1ad6bddd513",
        "lijstTitel": "gebruikersInstellingen",
        "verborgen": false,
        "baseTemplate": 100,
        "velden": [
          { "titel": "Id", "interneNaam": "ID", "type": "Counter" },
          { "titel": "Titel", "interneNaam": "Title", "type": "Text" },
          { "titel": "EigenTeamWeergeven", "interneNaam": "EigenTeamWeergeven", "type": "Boolean" },
          { "titel": "soortWeergave", "interneNaam": "soortWeergave", "type": "Text" },
          { "titel": "WeekendenWeergeven", "interneNaam": "WeekendenWeergeven", "type": "Boolean" }
        ]
      },
      "keuzelijstFuncties": {
        "lijstId": "f33ffe6d-7237-4688-9ac9-8a72f402a92d",
        "lijstTitel": "keuzelijstFuncties",
        "verborgen": false,
        "baseTemplate": 100,
        "velden": [
          { "titel": "Id", "interneNaam": "ID", "type": "Counter" },
          { "titel": "Titel", "interneNaam": "Title", "type": "Text" }
        ]
      },
      "MeldFouten": {
        "lijstId": "548e618c-ded9-4eae-b6a2-bc38e87facda",
        "lijstTitel": "MeldFouten",
        "verborgen": false,
        "baseTemplate": 100,
        "velden": [
          { "titel": "Id", "interneNaam": "ID", "type": "Counter" },
          { "titel": "Titel", "interneNaam": "Title", "type": "Text" },
          { "titel": "Beschrijving fout", "interneNaam": "Beschrijving_x0020_fout", "type": "Note" },
          { "titel": "Status", "interneNaam": "Status", "type": "Choice" },
          { "titel": "WaarFout", "interneNaam": "WaarFout", "type": "Choice" },
    	  { "titel": "Reactie", "interneNaam": "Reactie", "type": "Note" }
        ]
      },
      "IncidenteelZittingVrij": {
        "lijstId": "be6841e2-f4c0-4485-93a6-14f2fb146742",
        "lijstTitel": "IncidenteelZittingVrij",
        "verborgen": false,
        "baseTemplate": 100,
        "velden": [
          { "titel": "Id", "interneNaam": "ID", "type": "Counter" },
          { "titel": "Titel", "interneNaam": "Title", "type": "Text" },
          { "titel": "Gebruikersnaam", "interneNaam": "Gebruikersnaam", "type": "Text" },
          { "titel": "Opmerking", "interneNaam": "Opmerking", "type": "Note" },
          { "titel": "TerugkeerPatroon", "interneNaam": "TerugkeerPatroon", "type": "Choice" },
          { "titel": "Terugkerend", "interneNaam": "Terugkerend", "type": "Boolean" },
          { "titel": "TerugkerendTot", "interneNaam": "TerugkerendTot", "type": "DateTime" },
          { "titel": "ZittingsVrijeDagTijdEind", "interneNaam": "ZittingsVrijeDagTijdEind", "type": "DateTime" },
          { "titel": "ZittingsVrijeDagTijdStart", "interneNaam": "ZittingsVrijeDagTijd", "type": "DateTime" }
        ]
      },
      "Medewerkers": {
        "lijstId": "835ae977-8cd1-4eb8-a787-23aa2d76228d",
        "lijstTitel": "Medewerkers",
        "verborgen": false,
        "baseTemplate": 100,
        "velden": [
          { "titel": "Id", "interneNaam": "ID", "type": "Counter" },
          { "titel": "Titel", "interneNaam": "Title", "type": "Text" },
          { "titel": "Naam", "interneNaam": "Naam", "type": "Text" },
          { "titel": "Geboortedatum", "interneNaam": "Geboortedatum", "type": "DateTime" },
          { "titel": "E-mail", "interneNaam": "E_x002d_mail", "type": "Text" },
          { "titel": "Functie", "interneNaam": "Functie", "type": "Text" },
          { "titel": "Team", "interneNaam": "Team", "type": "Text" },
          { "titel": "Username", "interneNaam": "Username", "type": "Text" },
          { "titel": "Opmerking", "interneNaam": "Opmekring", "type": "Note" },
          { "titel": "OpmerkingGeldigTot", "interneNaam": "OpmerkingGeldigTot", "type": "DateTime" },
          { "titel": "Horen", "interneNaam": "Horen", "type": "Boolean" },
          { "titel": "Verbergen", "interneNaam": "Verbergen", "type": "Boolean" },
          { "titel": "Actief", "interneNaam": "Actief", "type": "Boolean" },
          { "titel": "HalveDagType", "interneNaam": "HalveDagType", "type": "Choice" },
          { "titel": "HalveDagWeekdag", "interneNaam": "HalveDagWeekdag", "type": "Choice" },
          { "titel": "UrenPerWeek", "interneNaam": "UrenPerWeek", "type": "Number" },
          { "titel": "Werkdagen", "interneNaam": "Werkdagen", "type": "Note" },
          { "titel": "Werkschema", "interneNaam": "Werkschema", "type": "Choice" }
        ]
      },
      "gemachtigdenLijst": {
        "lijstId": "6bb90350-086d-41db-8123-26449e12743c",
        "lijstTitel": "gemachtigdenLijst",
        "verborgen": false,
        "baseTemplate": 100,
        "velden": [
          { "titel": "Id", "interneNaam": "ID", "type": "Counter" },
          { "titel": "Titel", "interneNaam": "Title", "type": "Text" },
          { "titel": "Gedeelte", "interneNaam": "Gedeelte", "type": "Text" },
          { "titel": "Groepen", "interneNaam": "Groepen", "type": "MultiChoice" }
        ]
      },
      "Seniors": {
        "lijstId": "2e9b5974-7d69-4711-b9e6-f8db85f96f5f",
        "lijstTitel": "Seniors",
        "verborgen": false,
        "baseTemplate": 100,
        "velden": [
          { "titel": "Id", "interneNaam": "ID", "type": "Counter" },
          { "titel": "Titel", "interneNaam": "Title", "type": "Text" },
          { "titel": "Medewerker", "interneNaam": "Medewerker", "type": "Text" },
          { "titel": "MedewerkerID", "interneNaam": "MedewerkerID", "type": "Text" },
          { "titel": "Team", "interneNaam": "Team", "type": "Text" },
          { "titel": "TeamID", "interneNaam": "TeamID", "type": "Text" }
        ]
      },
      "statuslijstOpties": {
        "lijstId": "8487d306-a05d-4eda-b5b7-86135066ab67",
        "lijstTitel": "statuslijstOpties",
        "verborgen": false,
        "baseTemplate": 100,
        "velden": [
          { "titel": "Id", "interneNaam": "ID", "type": "Counter" },
          { "titel": "Titel", "interneNaam": "Title", "type": "Text" }
        ]
      },
      "Siteactiva": {
        "lijstId": "a24258cc-f494-4c56-9b2f-689eadde27db",
        "lijstTitel": "Siteactiva",
        "verborgen": false,
        "baseTemplate": 101,
        "velden": [
          { "titel": "Id", "interneNaam": "ID", "type": "Counter" },
          { "titel": "Naam", "interneNaam": "FileLeafRef", "type": "File" },
          { "titel": "Titel", "interneNaam": "Title", "type": "Text" }
        ]
      },
      "Teams": {
        "lijstId": "dc2911c5-b0b7-4092-9c99-5fe957fdf6fc",
        "lijstTitel": "Teams",
        "verborgen": false,
        "baseTemplate": 100,
        "velden": [
          { "titel": "Id", "interneNaam": "ID", "type": "Counter" },
          { "titel": "Titel", "interneNaam": "Title", "type": "Text" },
          { "titel": "Naam", "interneNaam": "Naam", "type": "Text" },
          { "titel": "Actief", "interneNaam": "Actief", "type": "Boolean" },
          { "titel": "Kleur", "interneNaam": "Kleur", "type": "Text" },
          { "titel": "Teamleider", "interneNaam": "Teamleider", "type": "Text" },
          { "titel": "TeamleiderId", "interneNaam": "TeamleiderId", "type": "Text" }
        ]
      },
      "UrenPerWeek": {
        "lijstId": "55bf75d8-d9e6-4614-8ac0-c3528bdb0ea8",
        "lijstTitel": "UrenPerWeek",
        "verborgen": false,
        "baseTemplate": 100,
        "velden": [
          { "titel": "Id", "interneNaam": "ID", "type": "Counter" },
          { "titel": "Titel", "interneNaam": "Title", "type": "Text" },
          { "titel": "MedewerkerID", "interneNaam": "MedewerkerID", "type": "Text" },
          { "titel": "Ingangsdatum", "interneNaam": "Ingangsdatum", "type": "DateTime" },
          { "titel": "VeranderingsDatum", "interneNaam": "VeranderingsDatum", "type": "DateTime" },
          { "titel": "MaandagStart", "interneNaam": "MaandagStart", "type": "Text" },
          { "titel": "MaandagEind", "interneNaam": "MaandagEind", "type": "Text" },
          { "titel": "MaandagSoort", "interneNaam": "MaandagSoort", "type": "Text" },
          { "titel": "MaandagTotaal", "interneNaam": "MaandagTotaal", "type": "Text" },
          { "titel": "DinsdagStart", "interneNaam": "DinsdagStart", "type": "Text" },
          { "titel": "DinsdagEind", "interneNaam": "DinsdagEind", "type": "Text" },
          { "titel": "DinsdagSoort", "interneNaam": "DinsdagSoort", "type": "Text" },
          { "titel": "DinsdagTotaal", "interneNaam": "DinsdagTotaal", "type": "Text" },
          { "titel": "WoensdagStart", "interneNaam": "WoensdagStart", "type": "Text" },
          { "titel": "WoensdagEind", "interneNaam": "WoensdagEind", "type": "Text" },
          { "titel": "WoensdagSoort", "interneNaam": "WoensdagSoort", "type": "Text" },
          { "titel": "WoensdagTotaal", "interneNaam": "WoensdagTotaal", "type": "Text" },
          { "titel": "DonderdagStart", "interneNaam": "DonderdagStart", "type": "Text" },
          { "titel": "DonderdagEind", "interneNaam": "DonderdagEind", "type": "Text" },
          { "titel": "DonderdagSoort", "interneNaam": "DonderdagSoort", "type": "Text" },
          { "titel": "DonderdagTotaal", "interneNaam": "DonderdagTotaal", "type": "Text" },
          { "titel": "VrijdagStart", "interneNaam": "VrijdagStart", "type": "Text" },
          { "titel": "VrijdagEind", "interneNaam": "VrijdagEind", "type": "Text" },
          { "titel": "VrijdagSoort", "interneNaam": "VrijdagSoort", "type": "Text" },
          { "titel": "VrijdagTotaal", "interneNaam": "VrijdagTotaal", "type": "Text" }
        ]
      },
      "Verlofredenen": {
        "lijstId": "6ca65cc0-ad60-49c9-9ee4-371249e55c7d",
        "lijstTitel": "Verlofredenen",
        "verborgen": false,
        "baseTemplate": 100,
        "velden": [
          { "titel": "Id", "interneNaam": "ID", "type": "Counter" },
          { "titel": "Titel", "interneNaam": "Title", "type": "Text" },
          { "titel": "Naam", "interneNaam": "Naam", "type": "Text" },
          { "titel": "Kleur", "interneNaam": "Kleur", "type": "Text" },
          { "titel": "VerlofDag", "interneNaam": "VerlofDag", "type": "Boolean" }
        ]
      },
      "Verlof": {
        "lijstId": "e12a068f-2821-4fe1-b898-e42e1418edf8",
        "lijstTitel": "Verlof",
        "verborgen": false,
        "baseTemplate": 100,
        "velden": [
          { "titel": "Id", "interneNaam": "ID", "type": "Counter" },
          { "titel": "Titel", "interneNaam": "Title", "type": "Text" },
          { "titel": "Medewerker", "interneNaam": "Medewerker", "type": "Text" },
          { "titel": "AanvraagTijdstip", "interneNaam": "AanvraagTijdstip", "type": "DateTime" },
          { "titel": "EindDatum", "interneNaam": "EindDatum", "type": "DateTime" },
          { "titel": "HerinneringDatum", "interneNaam": "HerinneringDatum", "type": "DateTime" },
          { "titel": "HerinneringStatus", "interneNaam": "HerinneringStatus", "type": "Choice" },
          { "titel": "MedewerkerID", "interneNaam": "MedewerkerID", "type": "Text" },
          { "titel": "Omschrijving", "interneNaam": "Omschrijving", "type": "Text" },
          { "titel": "OpmerkingBehandelaar", "interneNaam": "OpmerkingBehandelaar", "type": "Note" },
          { "titel": "Reden", "interneNaam": "Reden", "type": "Text" },
          { "titel": "RedenId", "interneNaam": "RedenId", "type": "Text" },
          { "titel": "StartDatum", "interneNaam": "StartDatum", "type": "DateTime" },
          { "titel": "Status", "interneNaam": "Status", "type": "Text" }
        ]
      },
      "FoutenLogboek": {
        "lijstId": "9f437af9-7063-4446-8f37-ea61ff74343f",
        "lijstTitel": "FoutenLogboek",
        "verborgen": false,
        "baseTemplate": 100,
        "velden": [
            { "titel": "Id", "interneNaam": "ID", "type": "Counter" },
            { "titel": "Titel", "interneNaam": "Title", "type": "Text" },
            { "titel": "Behandelplan", "interneNaam": "Behandelplan", "type": "Text" },
            { "titel": "FoutBeschrijving", "interneNaam": "FoutBeschrijving", "type": "Text" },
            { "titel": "FoutCode", "interneNaam": "FoutCode", "type": "Text" },
            { "titel": "Soort", "interneNaam": "Soort", "type": "Text" },
            { "titel": "Status", "interneNaam": "Status", "type": "Text" }
        ]
      }
    };
}


if (typeof window.getLijstConfig === 'undefined') {
    window.getLijstConfig = function(lijstKey) {
      if (window.sharepointLijstConfiguraties && window.sharepointLijstConfiguraties[lijstKey]) {
        return window.sharepointLijstConfiguraties[lijstKey];
      }
      console.warn(`[getLijstConfig] Configuratie voor sleutel '${lijstKey}' niet gevonden.`);
      return null;
    };
}

console.log("js/configLijst.js geladen en getLijstConfig is globaal beschikbaar via window.getLijstConfig.");
