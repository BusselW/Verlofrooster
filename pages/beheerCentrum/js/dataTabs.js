/**
 * dataTabs.js - Defines the tab structure for the Beheercentrum page.
 * This configuration is used by the React components to render the tabs and their corresponding content.
 */

// We use the globally available appConfiguratie from configLijst.js
const { 
    Medewerkers, 
    Teams, 
    Verlofredenen, 
    Verlof, 
    CompensatieUren,
    CompensatieUrenPerWeek,
    UrenPerWeek, 
    DagenIndicators, 
    gebruikersInstellingen, 
    keuzelijstFuncties,
    MeldFouten, 
    IncidenteelZittingVrij, 
    gemachtigdenLijst,
    Seniors, 
    statuslijstOpties,
    Siteactiva,
    FoutenLogboek,
    Mededeling,
    ZittingsVrijOpmaak
} = window.appConfiguratie;

export const beheerTabs = [
    // Medewerkers - Employee management
    {
        id: 'medewerkers',
        label: 'Medewerkers',
        listConfig: Medewerkers,
        columns: [
            { Header: 'Naam', accessor: 'Naam', type: 'text' },
            { Header: 'Username', accessor: 'Username', type: 'text' },
            { Header: 'Functie', accessor: 'Functie', type: 'text' },
            { Header: 'Team', accessor: 'Team', type: 'text' },
            { Header: 'E-mail', accessor: 'E_x002d_mail', type: 'email' },
            { Header: 'Geboortedatum', accessor: 'Geboortedatum', type: 'date' },
            { Header: 'Horen', accessor: 'Horen', type: 'boolean' },
            { Header: 'Verbergen', accessor: 'Verbergen', type: 'boolean' },
            { Header: 'Actief', accessor: 'Actief', type: 'boolean' },
            { Header: 'Opmerking tot', accessor: 'OpmerkingGeldigTot', type: 'date' },
            { Header: 'Acties', accessor: 'actions', isAction: true },
        ],
        formFields: [
            { name: 'Naam', label: 'Naam', type: 'text' },
            { name: 'Username', label: 'Username', type: 'text' },
            { name: 'E_x002d_mail', label: 'E-mail', type: 'email' },
            { name: 'Functie', label: 'Functie', type: 'text' },
            { name: 'Team', label: 'Team', type: 'text' },
            { name: 'Werkschema', label: 'Werkschema', type: 'text' },
            { name: 'UrenPerWeek', label: 'Uren per week', type: 'number' },
            { name: 'Geboortedatum', label: 'Geboortedatum', type: 'date' },
            { name: 'Werkdagen', label: 'Werkdagen', type: 'textarea' },
            { name: 'HalveDagType', label: 'Halve dag type', type: 'text' },
            { name: 'HalveDagWeekdag', label: 'Halve dag weekdag', type: 'text' },
            { name: 'Horen', label: 'Horen', type: 'checkbox' },
            { name: 'Verbergen', label: 'Verbergen in rooster', type: 'checkbox' },
            { name: 'Actief', label: 'Actief', type: 'checkbox' },
            { name: 'Opmerking', label: 'Opmerking', type: 'textarea' },
            { name: 'OpmerkingGeldigTot', label: 'Opmerking geldig tot', type: 'date' },
        ]
    },

    // Teams - Team management
    {
        id: 'teams',
        label: 'Teams',
        listConfig: Teams,
        columns: [
            { Header: 'Naam', accessor: 'Naam' },
            { Header: 'Teamleider', accessor: 'Teamleider' },
            { Header: 'Teamleider ID', accessor: 'TeamleiderId' },
            { Header: 'Kleur', accessor: 'Kleur', type: 'color' },
            { Header: 'Actief', accessor: 'Actief' },
            { Header: 'Acties', accessor: 'actions', isAction: true },
        ],
        formFields: [
            { name: 'Naam', label: 'Team Naam', type: 'text' },
            { name: 'Teamleider', label: 'Teamleider', type: 'text' },
            { name: 'TeamleiderId', label: 'Teamleider ID', type: 'text' },
            { name: 'Kleur', label: 'Team Kleur', type: 'color' },
            { name: 'Actief', label: 'Actief', type: 'checkbox' },
        ]
    },

    // Verlofredenen - Leave reasons
    {
        id: 'verlofredenen',
        label: 'Verlofredenen',
        listConfig: Verlofredenen,
        columns: [
            { Header: 'Naam', accessor: 'Naam', type: 'text' },
            { Header: 'Afkorting', accessor: 'Afkorting', type: 'text' },
            { Header: 'Kleur', accessor: 'Kleur', type: 'color' },
            { Header: 'Verlofdag', accessor: 'VerlofDag', type: 'boolean' },
            { Header: 'Acties', accessor: 'actions', isAction: true },
        ],
        formFields: [
            { name: 'Naam', label: 'Verlof Naam', type: 'text' },
            { name: 'Afkorting', label: 'Afkorting', type: 'text' },
            { name: 'Kleur', label: 'Kleur', type: 'color' },
            { name: 'VerlofDag', label: 'Is Verlofdag', type: 'checkbox' },
        ]
    },

    // Verlof - Leave requests
    {
        id: 'verlof',
        label: 'Verlof',
        listConfig: Verlof,
        columns: [
            { Header: 'Medewerker', accessor: 'Medewerker', type: 'text' },
            { Header: 'Medewerker ID', accessor: 'MedewerkerID', type: 'text' },
            { Header: 'Aanvraag Tijdstip', accessor: 'AanvraagTijdstip', type: 'datetime' },
            { Header: 'Start Datum', accessor: 'StartDatum', type: 'date' },
            { Header: 'Eind Datum', accessor: 'EindDatum', type: 'date' },
            { Header: 'Reden', accessor: 'Reden', type: 'text' },
            { Header: 'Reden ID', accessor: 'RedenId', type: 'text' },
            { Header: 'Status', accessor: 'Status', type: 'text' },
            { Header: 'Herinnering Datum', accessor: 'HerinneringDatum', type: 'date' },
            { Header: 'Herinnering Status', accessor: 'HerinneringStatus', type: 'text' },
            { Header: 'Omschrijving', accessor: 'Omschrijving', type: 'text' },
            { Header: 'Acties', accessor: 'actions', isAction: true },
        ],
        formFields: [
            { name: 'Title', label: 'Titel', type: 'text' },
            { name: 'Medewerker', label: 'Medewerker', type: 'text' },
            { name: 'MedewerkerID', label: 'Medewerker ID', type: 'text' },
            { name: 'AanvraagTijdstip', label: 'Aanvraag Tijdstip', type: 'datetime-local' },
            { name: 'StartDatum', label: 'Start Datum', type: 'datetime-local' },
            { name: 'EindDatum', label: 'Eind Datum', type: 'datetime-local' },
            { name: 'Reden', label: 'Reden', type: 'text' },
            { name: 'RedenId', label: 'Reden ID', type: 'text' },
            { name: 'Omschrijving', label: 'Omschrijving', type: 'textarea' },
            { name: 'Status', label: 'Status', type: 'text' },
            { name: 'HerinneringDatum', label: 'Herinnering Datum', type: 'datetime-local' },
            { name: 'HerinneringStatus', label: 'Herinnering Status', type: 'text' },
            { name: 'OpmerkingBehandelaar', label: 'Opmerking Behandelaar', type: 'textarea' },
        ]
    },

    // CompensatieUren - Compensation hours
    {
        id: 'compensatieuren',
        label: 'Compensatie Uren',
        listConfig: CompensatieUren,
        columns: [
            { Header: 'Medewerker', accessor: 'Medewerker', type: 'text' },
            { Header: 'Medewerker ID', accessor: 'MedewerkerID', type: 'text' },
            { Header: 'Aanvraag Tijdstip', accessor: 'AanvraagTijdstip', type: 'datetime' },
            { Header: 'Start', accessor: 'StartCompensatieUren', type: 'datetime' },
            { Header: 'Einde', accessor: 'EindeCompensatieUren', type: 'datetime' },
            { Header: 'Uren Totaal', accessor: 'UrenTotaal', type: 'number' },
            { Header: 'Ruildag', accessor: 'Ruildag', type: 'boolean' },
            { Header: 'Ruildag Start', accessor: 'ruildagStart', type: 'datetime' },
            { Header: 'Ruildag Einde', accessor: 'ruildagEinde', type: 'datetime' },
            { Header: 'Status', accessor: 'Status', type: 'text' },
            { Header: 'Omschrijving', accessor: 'Omschrijving', type: 'text' },
            { Header: 'Acties', accessor: 'actions', isAction: true },
        ],
        formFields: [
            { name: 'Title', label: 'Titel', type: 'text' },
            { name: 'Medewerker', label: 'Medewerker', type: 'text' },
            { name: 'MedewerkerID', label: 'Medewerker ID', type: 'text' },
            { name: 'AanvraagTijdstip', label: 'Aanvraag Tijdstip', type: 'datetime-local' },
            { name: 'StartCompensatieUren', label: 'Start Compensatie', type: 'datetime-local' },
            { name: 'EindeCompensatieUren', label: 'Einde Compensatie', type: 'datetime-local' },
            { name: 'UrenTotaal', label: 'Totaal Uren', type: 'text' },
            { name: 'Omschrijving', label: 'Omschrijving', type: 'textarea' },
            { name: 'Status', label: 'Status', type: 'text' },
            { name: 'Ruildag', label: 'Is Ruildag', type: 'checkbox' },
            { name: 'ruildagStart', label: 'Ruildag Start', type: 'datetime-local' },
            { name: 'ruildagEinde', label: 'Ruildag Einde', type: 'datetime-local' },
            { name: 'ReactieBehandelaar', label: 'Reactie Behandelaar', type: 'textarea' },
        ]
    },

    // UrenPerWeek - Hours per week
    {
        id: 'urenperweek',
        label: 'Uren per Week',
        listConfig: UrenPerWeek,
        columns: [
            { Header: 'Medewerker ID', accessor: 'MedewerkerID', type: 'text' },
            { Header: 'Ingangsdatum', accessor: 'Ingangsdatum', type: 'date' },
            { Header: 'Veranderingsdatum', accessor: 'VeranderingsDatum', type: 'date' },
            { Header: 'Week Type', accessor: 'WeekType', type: 'text' },
            { Header: 'Roterend Schema', accessor: 'IsRotatingSchedule', type: 'boolean' },
            { Header: 'Cyclus Start', accessor: 'CycleStartDate', type: 'date' },
            { Header: 'Ma Start', accessor: 'MaandagStart', type: 'time' },
            { Header: 'Ma Eind', accessor: 'MaandagEind', type: 'time' },
            { Header: 'Ma Totaal', accessor: 'MaandagTotaal', type: 'text' },
            { Header: 'Di Start', accessor: 'DinsdagStart', type: 'time' },
            { Header: 'Di Eind', accessor: 'DinsdagEind', type: 'time' },
            { Header: 'Di Totaal', accessor: 'DinsdagTotaal', type: 'text' },
            { Header: 'Wo Start', accessor: 'WoensdagStart', type: 'time' },
            { Header: 'Wo Eind', accessor: 'WoensdagEind', type: 'time' },
            { Header: 'Wo Totaal', accessor: 'WoensdagTotaal', type: 'text' },
            { Header: 'Do Start', accessor: 'DonderdagStart', type: 'time' },
            { Header: 'Do Eind', accessor: 'DonderdagEind', type: 'time' },
            { Header: 'Do Totaal', accessor: 'DonderdagTotaal', type: 'text' },
            { Header: 'Vr Start', accessor: 'VrijdagStart', type: 'time' },
            { Header: 'Vr Eind', accessor: 'VrijdagEind', type: 'time' },
            { Header: 'Vr Totaal', accessor: 'VrijdagTotaal', type: 'text' },
            { Header: 'Acties', accessor: 'actions', isAction: true },
        ],
        formFields: [
            { name: 'MedewerkerID', label: 'Medewerker ID', type: 'text' },
            { name: 'Ingangsdatum', label: 'Ingangsdatum', type: 'datetime-local' },
            { name: 'VeranderingsDatum', label: 'Veranderingsdatum', type: 'datetime-local' },
            { name: 'WeekType', label: 'Week Type', type: 'text' },
            { name: 'IsRotatingSchedule', label: 'Roterend Schema', type: 'checkbox' },
            { name: 'CycleStartDate', label: 'Cyclus Start Datum', type: 'datetime-local' },
            { name: 'MaandagStart', label: 'Maandag Start', type: 'text' },
            { name: 'MaandagEind', label: 'Maandag Eind', type: 'text' },
            { name: 'MaandagSoort', label: 'Maandag Soort', type: 'text' },
            { name: 'MaandagTotaal', label: 'Maandag Totaal', type: 'text' },
            { name: 'DinsdagStart', label: 'Dinsdag Start', type: 'text' },
            { name: 'DinsdagEind', label: 'Dinsdag Eind', type: 'text' },
            { name: 'DinsdagSoort', label: 'Dinsdag Soort', type: 'text' },
            { name: 'DinsdagTotaal', label: 'Dinsdag Totaal', type: 'text' },
            { name: 'WoensdagStart', label: 'Woensdag Start', type: 'text' },
            { name: 'WoensdagEind', label: 'Woensdag Eind', type: 'text' },
            { name: 'WoensdagSoort', label: 'Woensdag Soort', type: 'text' },
            { name: 'WoensdagTotaal', label: 'Woensdag Totaal', type: 'text' },
            { name: 'DonderdagStart', label: 'Donderdag Start', type: 'text' },
            { name: 'DonderdagEind', label: 'Donderdag Eind', type: 'text' },
            { name: 'DonderdagSoort', label: 'Donderdag Soort', type: 'text' },
            { name: 'DonderdagTotaal', label: 'Donderdag Totaal', type: 'text' },
            { name: 'VrijdagStart', label: 'Vrijdag Start', type: 'text' },
            { name: 'VrijdagEind', label: 'Vrijdag Eind', type: 'text' },
            { name: 'VrijdagSoort', label: 'Vrijdag Soort', type: 'text' },
            { name: 'VrijdagTotaal', label: 'Vrijdag Totaal', type: 'text' },
        ]
    },

    // DagenIndicators - Day indicators
    {
        id: 'dagenindicators',
        label: 'Dagen Indicators',
        listConfig: DagenIndicators,
        columns: [
            { Header: 'Titel', accessor: 'Title' },
            { Header: 'Beschrijving', accessor: 'Beschrijving', type: 'text' },
            { Header: 'Kleur', accessor: 'Kleur', type: 'color' },
            { Header: 'Patroon', accessor: 'Patroon', type: 'text' },
            { Header: 'Validatie', accessor: 'Validatie', type: 'text' },
            { Header: 'Acties', accessor: 'actions', isAction: true },
        ],
        formFields: [
            { name: 'Title', label: 'Titel', type: 'text' },
            { name: 'Beschrijving', label: 'Beschrijving', type: 'text' },
            { name: 'Kleur', label: 'Kleur', type: 'color' },
            { name: 'Patroon', label: 'Patroon', type: 'text' },
            { name: 'Validatie', label: 'Validatie', type: 'text' },
        ]
    },

    // gebruikersInstellingen - User settings
    {
        id: 'gebruikersinstellingen',
        label: 'Gebruikers Instellingen',
        listConfig: gebruikersInstellingen,
        columns: [
            { Header: 'Titel', accessor: 'Title', type: 'text' },
            { Header: 'Eigen Team', accessor: 'EigenTeamWeergeven', type: 'boolean' },
            { Header: 'Weekenden', accessor: 'WeekendenWeergeven', type: 'boolean' },
            { Header: 'BHC Alleen Eigen', accessor: 'BHCAlleenEigen', type: 'boolean' },
            { Header: 'Weergave', accessor: 'soortWeergave', type: 'text' },
            { Header: 'Acties', accessor: 'actions', isAction: true },
        ],
        formFields: [
            { name: 'Title', label: 'Titel', type: 'text' },
            { name: 'EigenTeamWeergeven', label: 'Eigen Team Weergeven', type: 'checkbox' },
            { name: 'WeekendenWeergeven', label: 'Weekenden Weergeven', type: 'checkbox' },
            { name: 'BHCAlleenEigen', label: 'BHC Alleen Eigen Team', type: 'checkbox' },
            { name: 'soortWeergave', label: 'Soort Weergave', type: 'text' },
        ]
    },

    // keuzelijstFuncties - Function choices
    {
        id: 'keuzelijstfuncties',
        label: 'Keuzelijst Functies',
        listConfig: keuzelijstFuncties,
        columns: [
            { Header: 'Titel', accessor: 'Title', type: 'text' },
            { Header: 'Acties', accessor: 'actions', isAction: true },
        ],
        formFields: [
            { name: 'Title', label: 'Functie Titel', type: 'text' },
        ]
    },

    // IncidenteelZittingVrij - Incidental session-free
    {
        id: 'incidenteelzittingvrij',
        label: 'Incidenteel Zitting Vrij',
        listConfig: IncidenteelZittingVrij,
        columns: [
            { Header: 'Gebruikersnaam', accessor: 'Gebruikersnaam', type: 'text' },
            { Header: 'Start', accessor: 'ZittingsVrijeDagTijd', type: 'datetime' }, // This maps to the start time field
            { Header: 'Eind', accessor: 'ZittingsVrijeDagTijdEind', type: 'datetime' },
            { Header: 'Terugkerend', accessor: 'Terugkerend', type: 'boolean' },
            { Header: 'Patroon', accessor: 'TerugkeerPatroon', type: 'text' },
            { Header: 'Acties', accessor: 'actions', isAction: true },
        ],
        formFields: [
            { name: 'Title', label: 'Titel', type: 'text' },
            { name: 'Gebruikersnaam', label: 'Gebruikersnaam', type: 'text' },
            { name: 'ZittingsVrijeDagTijd', label: 'Start Tijd', type: 'datetime-local' },
            { name: 'ZittingsVrijeDagTijdEind', label: 'Eind Tijd', type: 'datetime-local' },
            { name: 'Terugkerend', label: 'Terugkerend', type: 'checkbox' },
            { name: 'TerugkeerPatroon', label: 'Terugkeer Patroon', type: 'text' },
            { name: 'TerugkerendTot', label: 'Terugkerend Tot', type: 'datetime-local' },
            { name: 'Afkorting', label: 'Afkorting', type: 'text' },
            { name: 'Opmerking', label: 'Opmerking', type: 'textarea' },
        ]
    },

    // Seniors - Senior employees
    {
        id: 'seniors',
        label: 'Seniors',
        listConfig: Seniors,
        columns: [
            { Header: 'Medewerker', accessor: 'Medewerker' },
            { Header: 'Medewerker ID', accessor: 'MedewerkerID' },
            { Header: 'Team', accessor: 'Team' },
            { Header: 'Team ID', accessor: 'TeamID' },
            { Header: 'Acties', accessor: 'actions', isAction: true },
        ],
        formFields: [
            { name: 'Medewerker', label: 'Medewerker', type: 'text' },
            { name: 'MedewerkerID', label: 'Medewerker ID', type: 'text' },
            { name: 'Team', label: 'Team', type: 'text' },
            { name: 'TeamID', label: 'Team ID', type: 'text' },
        ]
    },

    // statuslijstOpties - Status options
    {
        id: 'statuslijstopties',
        label: 'Status Opties',
        listConfig: statuslijstOpties,
        columns: [
            { Header: 'Titel', accessor: 'Title' },
            { Header: 'Acties', accessor: 'actions', isAction: true },
        ],
        formFields: [
            { name: 'Title', label: 'Status Titel', type: 'text' },
        ]
    },

    // Mededeling - Announcements
    {
        id: 'mededeling',
        label: 'Mededeling',
        listConfig: Mededeling,
        columns: [
            { Header: 'Titel', accessor: 'Title', type: 'text' },
            { Header: 'Aanvulling', accessor: 'Aanvulling', type: 'text' },
            { Header: 'Start', accessor: 'DatumTijdStart', type: 'datetime' },
            { Header: 'Einde', accessor: 'DatumTijdEinde', type: 'datetime' },
            { Header: 'Uitzenden Aan', accessor: 'UitzendenAan', type: 'text' },
            { Header: 'Gebruiker', accessor: 'username', type: 'text' },
            { Header: 'Acties', accessor: 'actions', isAction: true },
        ],
        formFields: [
            { name: 'Title', label: 'Titel', type: 'text' },
            { name: 'Aanvulling', label: 'Aanvulling', type: 'textarea' },
            { name: 'DatumTijdStart', label: 'Start Datum/Tijd', type: 'datetime-local' },
            { name: 'DatumTijdEinde', label: 'Eind Datum/Tijd', type: 'datetime-local' },
            { name: 'UitzendenAan', label: 'Uitzenden Aan (Teams)', type: 'textarea' },
            { name: 'username', label: 'Gebruikersnaam', type: 'text' },
        ]
    },

    // ZittingsVrijOpmaak - Session-free formatting
    {
        id: 'zittingsvrijopmaak',
        label: 'ZittingsVrij Opmaak',
        listConfig: ZittingsVrijOpmaak,
        columns: [
            { Header: 'Titel', accessor: 'Title', type: 'text' },
            { Header: 'Kleur', accessor: 'Kleur', type: 'color' },
            { Header: 'Patroon', accessor: 'Patroon', type: 'text' },
            { Header: 'Transparantie', accessor: 'Transparantie', type: 'number' },
            { Header: 'Border Style', accessor: 'BorderStyle', type: 'text' },
            { Header: 'Border Width', accessor: 'BorderWidth', type: 'number' },
            { Header: 'Text Color', accessor: 'TextColor', type: 'color' },
            { Header: 'Font Size', accessor: 'FontSize', type: 'number' },
            { Header: 'Actief', accessor: 'Actief', type: 'boolean' },
            { Header: 'Acties', accessor: 'actions', isAction: true },
        ],
        formFields: [
            { name: 'Title', label: 'Titel', type: 'text' },
            { name: 'Kleur', label: 'Achtergrond Kleur', type: 'color' },
            { name: 'Patroon', label: 'Patroon', type: 'text' },
            { name: 'Transparantie', label: 'Transparantie (%)', type: 'number' },
            { name: 'BorderStyle', label: 'Border Style', type: 'text' },
            { name: 'BorderWidth', label: 'Border Width (px)', type: 'number' },
            { name: 'TextColor', label: 'Text Kleur', type: 'color' },
            { name: 'FontSize', label: 'Font Size (px)', type: 'number' },
            { name: 'Actief', label: 'Actief', type: 'checkbox' },
        ]
    },
];