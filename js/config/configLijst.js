// js/config/appConfig.js

/**
 * @file Configuratiebestand voor SharePoint Lijstdefinities.
 * Dit bestand definieert de structuur en eigenschappen van alle SharePoint-lijsten
 * die door de verlofroosterapplicatie worden gebruikt. Het fungeert als een centrale
 * "data map" die de frontend-applicatie vertelt hoe te communiceren met de
 * SharePoint-backend.
 *
 * De code is idempotent gemaakt door te controleren of `window.appConfiguratie` al bestaat.
 * Dit voorkomt fouten als het script per ongeluk meerdere keren wordt geladen.
 */

if (typeof window.appConfiguratie === "undefined") {
  /**
   * @namespace appConfiguratie
   * @description Hoofdconfiguratie-object dat alle lijstdefinities en applicatie-instellingen bevat.
   */
  window.appConfiguratie = {
    /**
     * @section instellingen
     * @description Algemene configuratie-instellingen voor de applicatie.
     */
    instellingen: {
      debounceTimer: 300, // Tijd in milliseconden voor debounce-functionaliteit (bv. bij zoekopdrachten).
      siteUrl: "https://som.org.om.local/sites/MulderT/CustomPW/Verlof/" // De basis-URL van de SharePoint-site.
    },

    /**
     * @section CompensatieUren
     * @description De datastructuur voor het beheren van aanvragen voor compensatie-uren. Medewerkers kunnen compensatie-uren aanvragen voor het werken van extra uren of op andere dagen.
     * Standaard is het alleen mogelijk om compensatie aan te vragen voor één enkele dag.
     * Als de medewerker op een andere dag werkt dan gebruikelijk, kan hij/zij dit aangeven met het veld 'Ruildag' (door deze op true te zetten).
     */
    CompensatieUren: {
      lijstId: "91f54142-f439-4646-a9f8-ca4d96820e12",
      lijstTitel: "CompensatieUren",
      verborgen: false,
      baseTemplate: 100,
      velden: [
        {
          titel: "Id",
          interneNaam: "ID",
          type: "Counter"
        } /* niet relevant maar opgenomen voor volledigheid */,
        {
          titel: "Titel",
          interneNaam: "Title",
          type: "Text"
        } /* Niet relevant maar opgenomen voor volledigheid */,
        {
          titel: "Medewerker",
          interneNaam: "Medewerker",
          type: "Text"
        } /* Volledige 'gebruikersvriendelijke' naam van de medewerker. */,
        {
          titel: "AanvraagTijdstip",
          interneNaam: "AanvraagTijdstip",
          type: "DateTime"
        } /* Wanneer de aanvraag is gedaan */,
        {
          titel: "StartCompensatieUren",
          interneNaam: "StartCompensatieUren",
          type: "DateTime"
        } /* Startdatum en -tijd van de compensatie-uren. Gebruik dit om een nieuw blok in het rooster te maken (startpunt) */,
        {
          titel: "EindeCompensatieUren",
          interneNaam: "EindeCompensatieUren",
          type: "DateTime"
        } /* Einddatum en -tijd van de compensatie-uren. Gebruik dit om een nieuw blok in het rooster te maken (eindpunt) */,
        {
          titel: "MedewerkerID",
          interneNaam: "MedewerkerID",
          type: "Text"
        } /* Unieke identificatie voor de medewerker. Bevat domein\gebruikersnaam-formaat (bijv: org\busselw). Gebruik dit om te relateren aan Medewerkers.username */,
        {
          titel: "Omschrijving",
          interneNaam: "Omschrijving",
          type: "Text"
        } /* Een bericht dat de gebruiker naar zijn/haar manager kan sturen */,
        {
          titel: "Ruildag",
          interneNaam: "Ruildag",
          type: "Boolean"
        } /* Geeft aan dat de medewerker afwijkt van zijn/haar gebruikelijke werkdag. Door dit op true te zetten, kan de medewerker aangeven dat hij/zij op een andere dag werkt dan normaal. Dit veld behandelt de dag waarop hij/zij eigenlijk zou werken, terwijl het veld StartCompensatieUren de daadwerkelijke werkdag behandelt */,
        {
          titel: "ruildagEinde",
          interneNaam: "ruildagEinde",
          type: "DateTime"
        } /* De einddatum en -tijd van de ruildag. Dit wordt gebruikt om aan te geven wanneer de medewerker klaar is met werken op een andere dag dan normaal. */,
        {
          titel: "ruildagStart",
          interneNaam: "ruildagStart",
          type: "DateTime"
        } /* De startdatum en -tijd van de ruildag. Dit wordt gebruikt om aan te geven wanneer de medewerker is begonnen met werken op een andere dag dan normaal. */,
        {
          titel: "Status",
          interneNaam: "Status",
          type: "Choice"
        } /* De status van de compensatie-uren aanvraag. Dit kan worden gebruikt om bij te houden of de aanvraag 'Nieuw', 'Goedgekeurd' of 'Afgewezen' is. */,
        {
          titel: "UrenTotaal",
          interneNaam: "UrenTotaal",
          type: "Text"
        } /* Totaal aantal uren gecompenseerd door de medewerker. Dit wordt gebruikt om het totaal aantal gecompenseerde uren te berekenen. */,
        {
          titel: "ReactieBehandelaar",
          interneNaam: "ReactieBehandelaar",
          type: "Note"
        } /* Reactie van de beheerder bij goedkeuring of afwijzing van de compensatie-uren aanvraag. */
      ]
    },

    /**
     * @section CompensatieUrenPerWeek
     * @description Definieert de lijst voor het wekelijkse overzicht van compensatie-uren.
     * Bevat velden voor elke dag van de week om start-, eindtijden en totaalurren vast te leggen.
     */
    CompensatieUrenPerWeek: {
      lijstId: "b05d42b9-91d4-4bc1-9782-e8ea9f630d01",
      lijstTitel: "CompensatieUrenPerWeek",
      verborgen: false,
      baseTemplate: 100,
      velden: [
        { titel: "Id", interneNaam: "ID", type: "Counter" },
        { titel: "Titel", interneNaam: "Title", type: "Text" },
        { titel: "MedewerkerID", interneNaam: "MedewerkerID", type: "Text" },
        {
          titel: "Ingangsdatum",
          interneNaam: "Ingangsdatum",
          type: "DateTime"
        },
        {
          titel: "VeranderingsDatum",
          interneNaam: "VeranderingsDatum",
          type: "DateTime"
        },
        { titel: "MaandagStart", interneNaam: "MaandagStart", type: "Text" },
        { titel: "MaandagEind", interneNaam: "MaandagEind", type: "Text" },
        { titel: "MaandagSoort", interneNaam: "MaandagSoort", type: "Text" },
        { titel: "MaandagTotaal", interneNaam: "MaandagTotaal", type: "Text" },
        { titel: "DinsdagStart", interneNaam: "DinsdagStart", type: "Text" },
        { titel: "DinsdagEind", interneNaam: "DinsdagEind", type: "Text" },
        { titel: "DinsdagSoort", interneNaam: "DinsdagSoort", type: "Text" },
        { titel: "DinsdagTotaal", interneNaam: "DinsdagTotaal", type: "Text" },
        { titel: "WoensdagStart", interneNaam: "WoensdagStart", type: "Text" },
        { titel: "WoensdagEind", interneNaam: "WoensdagEind", type: "Text" },
        { titel: "WoensdagSoort", interneNaam: "WoensdagSoort", type: "Text" },
        {
          titel: "WoensdagTotaal",
          interneNaam: "WoensdagTotaal",
          type: "Text"
        },
        {
          titel: "DonderdagStart",
          interneNaam: "DonderdagStart",
          type: "Text"
        },
        { titel: "DonderdagEind", interneNaam: "DonderdagEind", type: "Text" },
        {
          titel: "DonderdagSoort",
          interneNaam: "DonderdagSoort",
          type: "Text"
        },
        {
          titel: "DonderdagTotaal",
          interneNaam: "DonderdagTotaal",
          type: "Text"
        },
        { titel: "VrijdagStart", interneNaam: "VrijdagStart", type: "Text" },
        { titel: "VrijdagEind", interneNaam: "VrijdagEind", type: "Text" },
        { titel: "VrijdagSoort", interneNaam: "VrijdagSoort", type: "Text" },
        { titel: "VrijdagTotaal", interneNaam: "VrijdagTotaal", type: "Text" },
       
        // NEW ROTATION FIELDS - MISSING FROM CURRENT CONFIG
        { titel: "WeekType", interneNaam: "WeekType", type: "Text" },
        { titel: "IsRotatingSchedule", interneNaam: "IsRotatingSchedule", type: "Boolean" },
        { titel: "CycleStartDate", interneNaam: "CycleStartDate", type: "DateTime" }
      ]
    },

    /**
     * @section UrenPerWeek
     * @description This list stores the default working hours per week. The fields ending in suffix 'Start' contain starting hours
Suffix Eind: ending hours
Suffix Totaal: total amount of hours worked
Suffix Soort: determine if the user has had a full day of work (no category)
Otherwise, extract values from DagenIndicators.Title
     */
    UrenPerWeek: {
      lijstId: "55bf75d8-d9e6-4614-8ac0-c3528bdb0ea8",
      lijstTitel: "UrenPerWeek",
      verborgen: false,
      baseTemplate: 100,
      velden: [
        { titel: "Id", interneNaam: "ID", type: "Counter" },
        { titel: "Titel", interneNaam: "Title", type: "Text" },
        { titel: "MedewerkerID", interneNaam: "MedewerkerID", type: "Text" },
        {
          titel: "Ingangsdatum",
          interneNaam: "Ingangsdatum",
          type: "DateTime"
        },
        {
          titel: "VeranderingsDatum",
          interneNaam: "VeranderingsDatum",
          type: "DateTime"
        },
        { titel: "MaandagEind", interneNaam: "MaandagEind", type: "Text" },
        { titel: "MaandagSoort", interneNaam: "MaandagSoort", type: "Text" },
        { titel: "MaandagStart", interneNaam: "MaandagStart", type: "Text" },
        { titel: "MaandagTotaal", interneNaam: "MaandagTotaal", type: "Text" },
        { titel: "DinsdagEind", interneNaam: "DinsdagEind", type: "Text" },
        { titel: "DinsdagSoort", interneNaam: "DinsdagSoort", type: "Text" },
        { titel: "DinsdagStart", interneNaam: "DinsdagStart", type: "Text" },
        { titel: "DinsdagTotaal", interneNaam: "DinsdagTotaal", type: "Text" },
        { titel: "WoensdagEind", interneNaam: "WoensdagEind", type: "Text" },
        { titel: "WoensdagSoort", interneNaam: "WoensdagSoort", type: "Text" },
        { titel: "WoensdagStart", interneNaam: "WoensdagStart", type: "Text" },
        {
          titel: "WoensdagTotaal",
          interneNaam: "WoensdagTotaal",
          type: "Text"
        },
        { titel: "DonderdagEind", interneNaam: "DonderdagEind", type: "Text" },
        {
          titel: "DonderdagSoort",
          interneNaam: "DonderdagSoort",
          type: "Text"
        },
        {
          titel: "DonderdagStart",
          interneNaam: "DonderdagStart",
          type: "Text"
        },
        {
          titel: "DonderdagTotaal",
          interneNaam: "DonderdagTotaal",
          type: "Text"
        },
        { titel: "VrijdagEind", interneNaam: "VrijdagEind", type: "Text" },
        { titel: "VrijdagSoort", interneNaam: "VrijdagSoort", type: "Text" },
        { titel: "VrijdagStart", interneNaam: "VrijdagStart", type: "Text" },
        { titel: "VrijdagTotaal", interneNaam: "VrijdagTotaal", type: "Text" },
        
        // Rotation fields - re-enabled for A/B week scheduling
        { titel: "WeekType", interneNaam: "WeekType", type: "Text" },
        { titel: "IsRotatingSchedule", interneNaam: "IsRotatingSchedule", type: "Boolean" },
        { titel: "CycleStartDate", interneNaam: "CycleStartDate", type: "DateTime" }
        
        // Note: VrijeDag fields remain disabled as they don't exist in SharePoint yet
        // Free day status is tracked via dayType (VVD = Vrije Volledige Dag)
        // { titel: "MaandagVrijeDag", interneNaam: "MaandagVrijeDag", type: "Boolean" },
        // { titel: "DinsdagVrijeDag", interneNaam: "DinsdagVrijeDag", type: "Boolean" },
        // { titel: "WoensdagVrijeDag", interneNaam: "WoensdagVrijeDag", type: "Boolean" },
        // { titel: "DonderdagVrijeDag", interneNaam: "DonderdagVrijeDag", type: "Boolean" },
        // { titel: "VrijdagVrijeDag", interneNaam: "VrijdagVrijeDag", type: "Boolean" }
      ]
    },

    /**
     * @section DagenIndicators
     * @description Beheert indicatoren voor dagen, zoals kleuren en patronen,
     * die gebruikt kunnen worden voor visuele weergave in de kalender (bv. feestdagen).
     */
    DagenIndicators: {
      lijstId: "45528ed2-cdff-4958-82e4-e3eb032fd0aa",
      lijstTitel: "DagenIndicators",
      verborgen: false,
      baseTemplate: 100,
      velden: [
        { titel: "Id", interneNaam: "ID", type: "Counter" },
        { titel: "Titel", interneNaam: "Title", type: "Text" },
        { titel: "Beschrijving", interneNaam: "Beschrijving", type: "Text" },
        { titel: "Kleur", interneNaam: "Kleur", type: "Text" },
        { titel: "Patroon", interneNaam: "Patroon", type: "Choice" },
        { titel: "Validatie", interneNaam: "Validatie", type: "Text" }
      ]
    },

    /**
     * @section gebruikersInstellingen
     * @description Slaat persoonlijke voorkeuren en instellingen van de gebruiker op,
     * zoals weergave-opties voor het team en de weekenden.
     */
    gebruikersInstellingen: {
      lijstId: "c83b6af8-fee3-4b3a-affd-b1ad6bddd513",
      lijstTitel: "gebruikersInstellingen",
      verborgen: false,
      baseTemplate: 100,
      velden: [
        { titel: "Id", interneNaam: "ID", type: "Counter" },
        { titel: "Titel", interneNaam: "Title", type: "Text" },
        {
          titel: "EigenTeamWeergeven",
          interneNaam: "EigenTeamWeergeven",
          type: "Boolean"
        },
        { titel: "soortWeergave", interneNaam: "soortWeergave", type: "Text" },
        {
          titel: "WeekendenWeergeven",
          interneNaam: "WeekendenWeergeven",
          type: "Boolean"
        },
        {
          titel: "BHCAlleenEigen",
          interneNaam: "BHCAlleenEigen",
          type: "Boolean"
        } /* Only relevant for the behandelcentrum - controls whether teamleaders see only their own team's requests or all teams */
      ]
    },

    /**
     * @section keuzelijstFuncties
     * @description Bevat een keuzelijst met functies of rollen binnen de organisatie.
     */
    keuzelijstFuncties: {
      lijstId: "f33ffe6d-7237-4688-9ac9-8a72f402a92d",
      lijstTitel: "keuzelijstFuncties",
      verborgen: false,
      baseTemplate: 100,
      velden: [
        { titel: "Id", interneNaam: "ID", type: "Counter" },
        { titel: "Titel", interneNaam: "Title", type: "Text" }
      ]
    },

    /**
     * @section MeldFouten
     * @description Lijst voor het melden van functionele fouten in de applicatie.
     * Gebruikers kunnen hier problemen rapporteren voor opvolging.
     */
    MeldFouten: {
      lijstId: "548e618c-ded9-4eae-b6a2-bc38e87facda",
      lijstTitel: "MeldFouten",
      verborgen: false,
      baseTemplate: 100,
      velden: [
        { titel: "Id", interneNaam: "ID", type: "Counter" },
        { titel: "Titel", interneNaam: "Title", type: "Text" },
        {
          titel: "Beschrijving fout",
          interneNaam: "Beschrijving_x0020_fout",
          type: "Note"
        },
        { titel: "Status", interneNaam: "Status", type: "Choice" },
        { titel: "WaarFout", interneNaam: "WaarFout", type: "Choice" },
        { titel: "Reactie", interneNaam: "Reactie", type: "Note" }
      ]
    },

    /**
     * @section IncidenteelZittingVrij
     * @description Beheert incidentele aanvragen voor zittingsvrije dagen,
     * inclusief ondersteuning voor terugkerende patronen.
     */
    IncidenteelZittingVrij: {
      lijstId: "be6841e2-f4c0-4485-93a6-14f2fb146742",
      lijstTitel: "IncidenteelZittingVrij",
      verborgen: false,
      baseTemplate: 100,
      velden: [
        { titel: "Id", interneNaam: "ID", type: "Counter" },
        { titel: "Titel", interneNaam: "Title", type: "Text" },
        {
          titel: "Gebruikersnaam",
          interneNaam: "Gebruikersnaam",
          type: "Text"
        },
        { titel: "Opmerking", interneNaam: "Opmerking", type: "Note" },
        {
          titel: "TerugkeerPatroon",
          interneNaam: "TerugkeerPatroon",
          type: "Choice"
        },
        { titel: "Terugkerend", interneNaam: "Terugkerend", type: "Boolean" },
        { titel: "Afkorting", interneNaam: "Afkorting", type: "Text" },
        {
          titel: "TerugkerendTot",
          interneNaam: "TerugkerendTot",
          type: "DateTime"
        },
        {
          titel: "ZittingsVrijeDagTijdEind",
          interneNaam: "ZittingsVrijeDagTijdEind",
          type: "DateTime"
        },
        {
          titel: "ZittingsVrijeDagTijdStart",
          interneNaam: "ZittingsVrijeDagTijd",
          type: "DateTime"
        }
      ]
    },

    /**
     * @section Medewerkers
     * @description Centrale lijst met gegevens van alle medewerkers.
     * Bevat persoonlijke en werkgerelateerde informatie zoals functie, team en werkschema.
     */
    Medewerkers: {
      lijstId: "835ae977-8cd1-4eb8-a787-23aa2d76228d",
      lijstTitel: "Medewerkers",
      verborgen: false,
      baseTemplate: 100,
      velden: [
        {
          titel: "Id",
          interneNaam: "ID",
          type: "Counter"
        } /* niet relevant maar opgenomen voor volledigheid */,
        { titel: "Titel", interneNaam: "Title", type: "Text" },
        {
          titel: "Naam",
          interneNaam: "Naam",
          type: "Text"
        } /* Volledige 'gebruikersvriendelijke' naam van de medewerker. */,
        {
          titel: "Geboortedatum",
          interneNaam: "Geboortedatum",
          type: "DateTime"
        } /* Geboortedatum van de medewerker. Dit kan gebruikt worden voor leeftijdsgerelateerde logica of rapportages. */,
        { titel: "E-mail", interneNaam: "E_x002d_mail", type: "Text" },
        { titel: "Functie", interneNaam: "Functie", type: "Text" },
        { titel: "Team", interneNaam: "Team", type: "Text" },
        {
          titel: "Username",
          interneNaam: "Username",
          type: "Text"
        } /* Unieke identificatie voor de medewerker. Bevat domein\gebruikersnaam-formaat (bijv: org\busselw). Gebruik dit om te relateren aan andere lijsten zoals CompensatieUren, Verlof, etc. */,
        {
          titel: "Opmerking",
          interneNaam: "Opmekring",
          type: "Note"
        } /* 'Opmekring' is correct en dient niet te worden aangepast. */,
        {
          titel: "OpmerkingGeldigTot",
          interneNaam: "OpmerkingGeldigTot",
          type: "DateTime"
        },
        { titel: "Horen", interneNaam: "Horen", type: "Boolean" },
        { titel: "Verbergen", interneNaam: "Verbergen", type: "Boolean" },
        { titel: "Actief", interneNaam: "Actief", type: "Boolean" },
        { titel: "HalveDagType", interneNaam: "HalveDagType", type: "Choice" },
        {
          titel: "HalveDagWeekdag",
          interneNaam: "HalveDagWeekdag",
          type: "Choice"
        },
        { titel: "UrenPerWeek", interneNaam: "UrenPerWeek", type: "Number" },
        { titel: "Werkdagen", interneNaam: "Werkdagen", type: "Note" },
        { titel: "Werkschema", interneNaam: "Werkschema", type: "Choice" }
      ]
    },

    /**
     * @section gemachtigdenLijst
     * @description Definieert welke gebruikers of groepen gemachtigd zijn
     * voor bepaalde onderdelen van de applicatie, wat de autorisatie regelt.
     */
    gemachtigdenLijst: {
      lijstId: "6bb90350-086d-41db-8123-26449e12743c",
      lijstTitel: "gemachtigdenLijst",
      verborgen: false,
      baseTemplate: 100,
      velden: [
        { titel: "Id", interneNaam: "ID", type: "Counter" },
        { titel: "Titel", interneNaam: "Title", type: "Text" },
        { titel: "Gedeelte", interneNaam: "Gedeelte", type: "Text" },
        { titel: "Groepen", interneNaam: "Groepen", type: "MultiChoice" }
      ]
    },

    /**
     * @section Seniors
     * @description Lijst van senior medewerkers, mogelijk voor specifieke rollen, rechten of workflows.
     */
    Seniors: {
      lijstId: "2e9b5974-7d69-4711-b9e6-f8db85f96f5f",
      lijstTitel: "Seniors",
      verborgen: false,
      baseTemplate: 100,
      velden: [
        { titel: "Id", interneNaam: "ID", type: "Counter" },
        { titel: "Titel", interneNaam: "Title", type: "Text" },
        { titel: "Medewerker", interneNaam: "Medewerker", type: "Text" },
        { titel: "MedewerkerID", interneNaam: "MedewerkerID", type: "Text" },
        { titel: "Team", interneNaam: "Team", type: "Text" },
        { titel: "TeamID", interneNaam: "TeamID", type: "Text" }
      ]
    },

    /**
     * @section statuslijstOpties
     * @description Bevat de mogelijke statusopties (bijv. 'Aangevraagd', 'Goedgekeurd', 'Afgekeurd')
     * die in andere lijsten (zoals `Verlof` of `CompensatieUren`) gebruikt worden als keuzemogelijkheid.
     */
    statuslijstOpties: {
      lijstId: "8487d306-a05d-4eda-b5b7-86135066ab67",
      lijstTitel: "statuslijstOpties",
      verborgen: false,
      baseTemplate: 100,
      velden: [
        { titel: "Id", interneNaam: "ID", type: "Counter" },
        { titel: "Titel", interneNaam: "Title", type: "Text" }
      ]
    },

    /**
     * @section Siteactiva
     * @description Verwijst naar de 'Site Assets'-bibliotheek in SharePoint.
     * Dit is een documentbibliotheek waar bestanden zoals scripts, stijlbladen en afbeeldingen
     * die de applicatie nodig heeft, worden opgeslagen.
     */
    Siteactiva: {
      lijstId: "a24258cc-f494-4c56-9b2f-689eadde27db",
      lijstTitel: "Siteactiva",
      verborgen: false,
      baseTemplate: 101, // 101 is de template voor Document Libraries
      velden: [
        { titel: "Id", interneNaam: "ID", type: "Counter" },
        { titel: "Naam", interneNaam: "FileLeafRef", type: "File" },
        { titel: "Titel", interneNaam: "Title", type: "Text" }
      ]
    },

    /**
     * @section Teams
     * @description Beheert de verschillende teams binnen de organisatie,
     * inclusief eigenschappen zoals teamleiders en een teamkleur voor visuele herkenning.
     */
    Teams: {
      lijstId: "dc2911c5-b0b7-4092-9c99-5fe957fdf6fc",
      lijstTitel: "Teams",
      verborgen: false,
      baseTemplate: 100,
      velden: [
        { titel: "Id", interneNaam: "ID", type: "Counter" },
        { titel: "Titel", interneNaam: "Title", type: "Text" },
        { titel: "Naam", interneNaam: "Naam", type: "Text" }, // Naam van het team, gebruikt voor weergave
        { titel: "Actief", interneNaam: "Actief", type: "Boolean" },
        { titel: "Kleur", interneNaam: "Kleur", type: "Text" },
        { titel: "Teamleider", interneNaam: "Teamleider", type: "Text" },
        { titel: "TeamleiderId", interneNaam: "TeamleiderId", type: "Text" } // ID van de teamleider als domain\gebruikersnaam (bijv. org\busselw)
      ]
    },

    /**
     * @section Verlofredenen
     * @description Bevat de verschillende redenen voor verlof die een medewerker kan opgeven
     * (bijv. 'Vakantie', 'Ziekte', 'Speciaal verlof'), inclusief een kleur voor de weergave.
     */
    Verlofredenen: {
      lijstId: "6ca65cc0-ad60-49c9-9ee4-371249e55c7d",
      lijstTitel: "Verlofredenen",
      verborgen: false,
      baseTemplate: 100,
      velden: [
        { titel: "Id", interneNaam: "ID", type: "Counter" },
        { titel: "Titel", interneNaam: "Title", type: "Text" },
        { titel: "Naam", interneNaam: "Naam", type: "Text" },
        { titel: "Kleur", interneNaam: "Kleur", type: "Text" },
        { titel: "Afkorting", interneNaam: "Afkorting", type: "Text" },
        { titel: "VerlofDag", interneNaam: "VerlofDag", type: "Boolean" }
      ]
    },

    /**
     * @section Verlof
     * @description De centrale lijst voor het aanvragen en beheren van verlof.
     * Dit is een van de belangrijkste lijsten en bevat alle details van een verlofaanvraag.
     */
    Verlof: {
      lijstId: "e12a068f-2821-4fe1-b898-e42e1418edf8",
      lijstTitel: "Verlof",
      verborgen: false,
      baseTemplate: 100,
      velden: [
        { titel: "Id", interneNaam: "ID", type: "Counter" },
        { titel: "Titel", interneNaam: "Title", type: "Text" },
        { titel: "Medewerker", interneNaam: "Medewerker", type: "Text" },
        {
          titel: "AanvraagTijdstip",
          interneNaam: "AanvraagTijdstip",
          type: "DateTime"
        },
        { titel: "EindDatum", interneNaam: "EindDatum", type: "DateTime" },
        {
          titel: "HerinneringDatum",
          interneNaam: "HerinneringDatum",
          type: "DateTime"
        },
        {
          titel: "HerinneringStatus",
          interneNaam: "HerinneringStatus",
          type: "Choice"
        },
        { titel: "MedewerkerID", interneNaam: "MedewerkerID", type: "Text" },
        { titel: "Omschrijving", interneNaam: "Omschrijving", type: "Text" },
        {
          titel: "OpmerkingBehandelaar",
          interneNaam: "OpmerkingBehandelaar",
          type: "Note"
        },
        { titel: "Reden", interneNaam: "Reden", type: "Text" },
        { titel: "RedenId", interneNaam: "RedenId", type: "Text" },
        { titel: "StartDatum", interneNaam: "StartDatum", type: "DateTime" },
        { titel: "Status", interneNaam: "Status", type: "Text" }
      ]
    },

    /**
     * @section FoutenLogboek
     * @description Een logboek voor het vastleggen van technische (programmeer)fouten die in de applicatie optreden.
     * Dit helpt ontwikkelaars bij het debuggen en oplossen van problemen.
     */
    FoutenLogboek: {
      lijstId: "9f437af9-7063-4446-8f37-ea61ff74343f",
      lijstTitel: "FoutenLogboek",
      verborgen: false,
      baseTemplate: 100,
      velden: [
        { titel: "Id", interneNaam: "ID", type: "Counter" },
        { titel: "Titel", interneNaam: "Title", type: "Text" },
        { titel: "Behandelplan", interneNaam: "Behandelplan", type: "Text" },
        {
          titel: "FoutBeschrijving",
          interneNaam: "FoutBeschrijving",
          type: "Text"
        },
        { titel: "FoutCode", interneNaam: "FoutCode", type: "Text" },
        { titel: "Soort", interneNaam: "Soort", type: "Text" },
        { titel: "Status", interneNaam: "Status", type: "Text" }
      ]
    },

    /**
     * @section Mededeling
     * @description Beheert mededelingen en aankondigingen die op de applicatie kunnen worden weergegeven.
     * Ondersteunt tijdgestuurde weergave en doelgroepgerichte uitzendingen naar specifieke teams.
     */
    Mededeling: {
      lijstId: "aa8c8320-2a08-49d2-ad05-7c4b673af5b0",
      lijstTitel: "Mededeling",
      verborgen: false,
      baseTemplate: 100,
      velden: [
        { titel: "Id", interneNaam: "ID", type: "Counter" },
        { 
          titel: "Titel", 
          interneNaam: "Title", 
          type: "Text" 
        } /* Geef het bestand een naam (deze zal worden gebruikt voor de zoekmachine) */,
        { 
          titel: "Aanvulling", 
          interneNaam: "Aanvulling", 
          type: "Note" 
        } /* Geef toelichting op de melding. Waarom is deze melding actief? Wat is er gaande? */,
        { 
          titel: "DatumTijdEinde", 
          interneNaam: "DatumTijdEinde", 
          type: "DateTime" 
        } /* Vanaf welke dag/tijdstip moet de mededeling niet meer weergeven worden op de pagina? */,
        { 
          titel: "DatumTijdStart", 
          interneNaam: "DatumTijdStart", 
          type: "DateTime" 
        } /* Vanaf welke dag/tijdstip moet de mededeling worden weergeven op de pagina? */,
        { 
          titel: "UitzendenAan", 
          interneNaam: "UitzendenAan", 
          type: "Note" 
        } /* Doelgroep voor de mededeling. Teams worden gescheiden door ';' (bijv: "Verkeersborden; Rijgedrag") */,
        { 
          titel: "username", 
          interneNaam: "username", 
          type: "Text" 
        } /* Gebruikersnaam van degene die de mededeling heeft aangemaakt (domein\gebruikersnaam formaat) */
      ]
    },

    /**
     * @section ZittingsVrijOpmaak
     * @description Beheert de opmaak en styling voor zittingsvrije periodes in de kalenderweergave.
     * Definieert hoe zittingsvrije dagen visueel worden weergegeven in het rooster.
     */
    ZittingsVrijOpmaak: {
      lijstId: "new-guid-needed-for-zittingsvrij-opmaak",
      lijstTitel: "ZittingsVrijOpmaak",
      verborgen: false,
      baseTemplate: 100,
      velden: [
        { titel: "Id", interneNaam: "ID", type: "Counter" },
        { titel: "Titel", interneNaam: "Title", type: "Text" },
        { titel: "Kleur", interneNaam: "Kleur", type: "Text" },
        { titel: "Patroon", interneNaam: "Patroon", type: "Choice" },
        { titel: "Transparantie", interneNaam: "Transparantie", type: "Number" },
        { titel: "BorderStyle", interneNaam: "BorderStyle", type: "Choice" },
        { titel: "BorderWidth", interneNaam: "BorderWidth", type: "Number" },
        { titel: "TextColor", interneNaam: "TextColor", type: "Text" },
        { titel: "FontSize", interneNaam: "FontSize", type: "Number" },
        { titel: "Actief", interneNaam: "Actief", type: "Boolean" }
      ]
    }
  };
}

// Compatibility layer for legacy getLijstConfig function
if (typeof window.getLijstConfig === 'undefined') {
    window.getLijstConfig = function(lijstKey) {
        if (window.appConfiguratie && window.appConfiguratie[lijstKey]) {
            return window.appConfiguratie[lijstKey];
        }
        
        // Enhanced debugging for missing configurations
        console.warn(`[getLijstConfig] Configuratie voor sleutel '${lijstKey}' niet gevonden.`);
        console.warn(`[getLijstConfig] Beschikbare sleutels:`, Object.keys(window.appConfiguratie || {}));
        
        // Check for common typos in zittingsvrij
        if (lijstKey && lijstKey.toLowerCase().includes('zittingsvrij') || lijstKey.toLowerCase().includes('zitingsvrij')) {
            console.warn(`[getLijstConfig] Mogelijk typfout in zittingsvrij. Controleer op 'IncidenteelZittingVrij'`);
            if (window.appConfiguratie?.IncidenteelZittingVrij) {
                console.warn(`[getLijstConfig] Gevonden correcte configuratie: IncidenteelZittingVrij`);
            }
        }
        
        // Log call stack to help identify source
        console.trace(`[getLijstConfig] Call stack voor ontbrekende sleutel '${lijstKey}':`);
        
        return null;
    };
   
    // Create legacy sharepointLijstConfiguraties for backward compatibility
    window.sharepointLijstConfiguraties = window.appConfiguratie;
   
    // console.log("Compatibility layer toegevoegd voor appConfiguratie -> getLijstConfig");

    
    
}

// console.log("js/config/appConfig.js geladen.");
// console.log("window.appConfiguratie loaded:", typeof window.appConfiguratie);
// console.log("window.getLijstConfig available:", typeof window.getLijstConfig);