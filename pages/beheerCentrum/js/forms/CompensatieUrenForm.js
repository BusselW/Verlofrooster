/**
 * CompensatieUrenForm.js - Compensation hours form component using enhanced modal configuration
 * References coding instructions for ES6 modules, accessibility, and modern UX patterns
 */

import { EnhancedBaseForm } from './EnhancedBaseForm.js';

const { createElement: h } = React;

/**
 * Configuration for the compensation hours form
 */
const compensatieUrenConfig = {
    sections: [
        {
            title: 'Compensatie Uren Aanvraag',
            fields: [
                { 
                    name: 'Title', 
                    label: 'Titel', 
                    type: 'text', 
                    required: true, 
                    colSpan: 2,
                    placeholder: 'Bijv. Compensatie overwerk - Week 40',
                    help: 'Een duidelijke titel voor deze compensatie aanvraag'
                },
                { 
                    name: 'Medewerker', 
                    label: 'Medewerker', 
                    type: 'text', 
                    required: true,
                    placeholder: 'Naam van de medewerker',
                    help: 'Naam van de medewerker die compensatie aanvraagt'
                },
                { 
                    name: 'MedewerkerID', 
                    label: 'Medewerker ID', 
                    type: 'text', 
                    required: true,
                    placeholder: 'domein\\gebruikersnaam',
                    help: 'Unieke identificatie van de medewerker'
                }
            ]
        },
        {
            title: 'Compensatie Periode',
            type: 'info-section',
            icon: '⏰',
            background: 'primary',
            fields: [
                { 
                    name: 'AanvraagTijdstip', 
                    label: 'Aanvraag Tijdstip', 
                    type: 'datetime-local', 
                    required: true,
                    help: 'Wanneer is deze aanvraag ingediend'
                },
                { 
                    name: 'StartCompensatieUren', 
                    label: 'Start Compensatie', 
                    type: 'datetime-local', 
                    required: true,
                    help: 'Begin datum en tijd van de compensatie periode'
                },
                { 
                    name: 'EindeCompensatieUren', 
                    label: 'Einde Compensatie', 
                    type: 'datetime-local', 
                    required: true,
                    help: 'Eind datum en tijd van de compensatie periode'
                },
                { 
                    name: 'UrenTotaal', 
                    label: 'Totaal Uren', 
                    type: 'text', 
                    required: true,
                    placeholder: 'Bijv. 8:00',
                    help: 'Totaal aantal uren compensatie (HH:MM formaat)'
                }
            ]
        },
        {
            title: 'Ruildag Instellingen',
            type: 'toggle-section',
            icon: '🔄',
            background: 'secondary',
            fields: [
                { 
                    name: 'Ruildag', 
                    label: 'Is Ruildag', 
                    type: 'toggle', 
                    help: 'Schakel in als dit een ruildag betreft in plaats van compensatie'
                },
                { 
                    name: 'ruildagStart', 
                    label: 'Ruildag Start', 
                    type: 'datetime-local',
                    help: 'Start datum en tijd van de ruildag (indien van toepassing)'
                },
                { 
                    name: 'ruildagEinde', 
                    label: 'Ruildag Einde', 
                    type: 'datetime-local',
                    help: 'Eind datum en tijd van de ruildag (indien van toepassing)'
                }
            ]
        },
        {
            title: 'Omschrijving & Status',
            type: 'content-section',
            fields: [
                { 
                    name: 'Omschrijving', 
                    label: 'Omschrijving', 
                    type: 'textarea', 
                    colSpan: 2,
                    rows: 4,
                    placeholder: 'Beschrijf de reden voor compensatie of details van de ruildag...',
                    help: 'Uitgebreide beschrijving van de compensatie aanvraag'
                },
                { 
                    name: 'Status', 
                    label: 'Status', 
                    type: 'select', 
                    required: true,
                    options: [
                        { value: 'Nieuw', label: 'Nieuw' },
                        { value: 'In Behandeling', label: 'In Behandeling' },
                        { value: 'Goedgekeurd', label: 'Goedgekeurd' },
                        { value: 'Afgewezen', label: 'Afgewezen' },
                        { value: 'Ingetrokken', label: 'Ingetrokken' }
                    ],
                    help: 'Huidige status van de compensatie aanvraag'
                },
                { 
                    name: 'ReactieBehandelaar', 
                    label: 'Reactie Behandelaar', 
                    type: 'textarea', 
                    colSpan: 2,
                    rows: 3,
                    placeholder: 'Feedback of reactie van de behandelaar...',
                    help: 'Reactie of feedback van de goedkeurende manager'
                }
            ]
        }
    ]
};

/**
 * CompensatieUrenForm component using enhanced base form with modal configuration
 */
export const CompensatieUrenForm = ({ onSave, onCancel, initialData = {}, title }) => {
    return h(EnhancedBaseForm, {
        onSave,
        onCancel,
        initialData,
        config: compensatieUrenConfig,
        title,
        modalType: 'large',
        modalOverrides: {
            width: 'large',
            header: {
                gradient: 'warning',
                showIcon: true
            }
        }
    });
};
