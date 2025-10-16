/**
 * modalConfigs.js - Modal configurations for different entity types
 * This file defines specific modal layouts and field configurations for each entity type
 */

// Base field types and their rendering configurations
export const fieldTypes = {
    text: {
        component: 'input',
        type: 'text',
        validation: { required: false, minLength: 0, maxLength: 255 }
    },
    email: {
        component: 'input',
        type: 'email',
        validation: { required: false, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
    },
    number: {
        component: 'input',
        type: 'number',
        validation: { required: false, min: 0 }
    },
    date: {
        component: 'input',
        type: 'date',
        validation: { required: false }
    },
    'datetime-local': {
        component: 'input',
        type: 'datetime-local',
        validation: { required: false }
    },
    time: {
        component: 'input',
        type: 'time',
        validation: { required: false }
    },
    textarea: {
        component: 'textarea',
        validation: { required: false, maxLength: 1000 }
    },
    checkbox: {
        component: 'input',
        type: 'checkbox',
        validation: { required: false }
    },
    color: {
        component: 'input',
        type: 'color',
        validation: { required: false, pattern: /^#[0-9A-Fa-f]{6}$/ }
    },
    select: {
        component: 'select',
        validation: { required: false }
    }
};

// Modal configurations for each entity type
export const modalConfigs = {
    medewerkers: {
        title: 'Medewerker',
        width: 'large', // small, medium, large, extra-large
        sections: [
            {
                title: 'Persoonlijke Gegevens',
                fields: [
                    { name: 'Naam', label: 'Volledige Naam', type: 'text', required: true, colSpan: 2 },
                    { name: 'Username', label: 'Gebruikersnaam', type: 'text', required: true },
                    { name: 'E_x002d_mail', label: 'E-mailadres', type: 'email', required: true },
                    { name: 'Geboortedatum', label: 'Geboortedatum', type: 'date' },
                    { name: 'Functie', label: 'Functie', type: 'text', required: true },
                ]
            },
            {
                title: 'Werk Details',
                fields: [
                    { name: 'Team', label: 'Team', type: 'text', required: true },
                    { name: 'Werkschema', label: 'Werkschema', type: 'text' },
                    { name: 'UrenPerWeek', label: 'Uren per week', type: 'number', required: true },
                    { name: 'Werkdagen', label: 'Werkdagen', type: 'textarea' },
                ]
            },
            {
                title: 'Halve Dag Instellingen',
                fields: [
                    { name: 'HalveDagType', label: 'Halve Dag Type', type: 'text' },
                    { name: 'HalveDagWeekdag', label: 'Halve Dag Weekdag', type: 'text' },
                ]
            },
            {
                title: 'Opmerkingen & Status',
                fields: [
                    { name: 'Opmekring', label: 'Opmerking', type: 'textarea', colSpan: 2 },
                    { name: 'OpmerkingGeldigTot', label: 'Opmerking Geldig Tot', type: 'date' },
                    { name: 'Actief', label: 'Actief', type: 'checkbox' },
                    { name: 'Verbergen', label: 'Verborgen in rooster', type: 'checkbox' },
                    { name: 'Horen', label: 'Horen', type: 'checkbox' },
                ]
            }
        ]
    },

    teams: {
        title: 'Team',
        width: 'medium',
        sections: [
            {
                title: 'Team Informatie',
                fields: [
                    { name: 'Naam', label: 'Team Naam', type: 'text', required: true, colSpan: 2 },
                    { name: 'Teamleider', label: 'Teamleider', type: 'text', required: true },
                    { name: 'TeamleiderId', label: 'Teamleider ID', type: 'text' },
                    { name: 'Kleur', label: 'Team Kleur', type: 'color', required: true, help: 'Kies een kleur voor dit team in het rooster' },
                    { name: 'Actief', label: 'Actief', type: 'checkbox' },
                ]
            }
        ]
    },

    verlofredenen: {
        title: 'Verlof Reden',
        width: 'medium',
        sections: [
            {
                title: 'Verlof Reden Details',
                fields: [
                    { name: 'Naam', label: 'Verlof Naam', type: 'text', required: true, colSpan: 2 },
                    { name: 'Afkorting', label: 'Afkorting', type: 'text', required: true, maxLength: 5 },
                    { name: 'Kleur', label: 'Kleur', type: 'color', required: true, help: 'Kleur voor deze verloftype in het rooster' },
                    { name: 'VerlofDag', label: 'Is Verlofdag', type: 'checkbox', help: 'Vink aan als dit een officiële verlofdag is' },
                ]
            }
        ]
    },

    verlof: {
        title: 'Verlof Aanvraag',
        width: 'large',
        sections: [
            {
                title: 'Aanvraag Details',
                fields: [
                    { name: 'Title', label: 'Titel', type: 'text', required: true, colSpan: 2 },
                    { name: 'Medewerker', label: 'Medewerker', type: 'text', required: true },
                    { name: 'MedewerkerID', label: 'Medewerker ID', type: 'text' },
                    { name: 'AanvraagTijdstip', label: 'Aanvraag Tijdstip', type: 'datetime-local' },
                ]
            },
            {
                title: 'Verlof Periode',
                fields: [
                    { name: 'StartDatum', label: 'Start Datum', type: 'datetime-local', required: true },
                    { name: 'EindDatum', label: 'Eind Datum', type: 'datetime-local', required: true },
                    { name: 'Reden', label: 'Reden', type: 'text', required: true },
                    { name: 'RedenId', label: 'Reden ID', type: 'text' },
                ]
            },
            {
                title: 'Status & Opmerkingen',
                fields: [
                    { name: 'Status', label: 'Status', type: 'text', required: true },
                    { name: 'Omschrijving', label: 'Omschrijving', type: 'textarea', colSpan: 2 },
                    { name: 'OpmerkingBehandelaar', label: 'Opmerking Behandelaar', type: 'textarea', colSpan: 2 },
                    { name: 'HerinneringDatum', label: 'Herinnering Datum', type: 'datetime-local' },
                    { name: 'HerinneringStatus', label: 'Herinnering Status', type: 'text' },
                ]
            }
        ]
    },

    dagenindicators: {
        title: 'Dag Indicator',
        width: 'medium',
        sections: [
            {
                title: 'Indicator Details',
                fields: [
                    { name: 'Title', label: 'Titel', type: 'text', required: true, colSpan: 2 },
                    { name: 'Beschrijving', label: 'Beschrijving', type: 'text', required: true, colSpan: 2 },
                    { name: 'Kleur', label: 'Kleur', type: 'color', required: true, help: 'Kleur voor deze indicator' },
                    { name: 'Patroon', label: 'Patroon', type: 'text' },
                    { name: 'Validatie', label: 'Validatie', type: 'text' },
                ]
            }
        ]
    },

    // Add configurations for other entity types as needed
    compensatieuren: {
        title: 'Compensatie Uren',
        width: 'large',
        sections: [
            {
                title: 'Aanvraag Details',
                fields: [
                    { name: 'Title', label: 'Titel', type: 'text', required: true, colSpan: 2 },
                    { name: 'Medewerker', label: 'Medewerker', type: 'text', required: true },
                    { name: 'MedewerkerID', label: 'Medewerker ID', type: 'text' },
                    { name: 'AanvraagTijdstip', label: 'Aanvraag Tijdstip', type: 'datetime-local' },
                ]
            },
            {
                title: 'Compensatie Periode',
                fields: [
                    { name: 'StartCompensatieUren', label: 'Start Compensatie', type: 'datetime-local', required: true },
                    { name: 'EindeCompensatieUren', label: 'Einde Compensatie', type: 'datetime-local', required: true },
                    { name: 'UrenTotaal', label: 'Totaal Uren', type: 'text', required: true },
                    { name: 'Status', label: 'Status', type: 'text', required: true },
                ]
            },
            {
                title: 'Ruildag Instellingen',
                fields: [
                    { name: 'Ruildag', label: 'Is Ruildag', type: 'checkbox' },
                    { name: 'ruildagStart', label: 'Ruildag Start', type: 'datetime-local' },
                    { name: 'ruildagEinde', label: 'Ruildag Einde', type: 'datetime-local' },
                ]
            },
            {
                title: 'Opmerkingen',
                fields: [
                    { name: 'Omschrijving', label: 'Omschrijving', type: 'textarea', colSpan: 2 },
                    { name: 'ReactieBehandelaar', label: 'Reactie Behandelaar', type: 'textarea', colSpan: 2 },
                ]
            }
        ]
    }
};

// Helper function to get modal config for a specific entity type
export const getModalConfig = (entityType) => {
    return modalConfigs[entityType] || {
        title: 'Item',
        width: 'medium',
        sections: [
            {
                title: 'Details',
                fields: []
            }
        ]
    };
};

// Helper function to get field configuration
export const getFieldConfig = (fieldType) => {
    return fieldTypes[fieldType] || fieldTypes.text;
};