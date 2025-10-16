/**
 * VerlofForm.js - Leave request form component using enhanced modal configuration
 * References coding instructions for ES6 modules, accessibility, and modern UX patterns
 */

import { EnhancedBaseForm } from './EnhancedBaseForm.js';

const { createElement: h } = React;

/**
 * Configuration for the leave request form
 */
const verlofConfig = {
    sections: [
        {
            title: 'Verlof Aanvraag Details',
            fields: [
                { 
                    name: 'Title', 
                    label: 'Titel', 
                    type: 'text', 
                    required: true, 
                    colSpan: 2,
                    placeholder: 'Bijv. Jaarlijks verlof - September 2024',
                    help: 'Een duidelijke titel voor deze verlofaanvraag'
                },
                { 
                    name: 'Medewerker', 
                    label: 'Medewerker', 
                    type: 'text', 
                    required: true,
                    placeholder: 'Naam van de medewerker',
                    help: 'Naam van de medewerker die verlof aanvraagt'
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
            title: 'Verlof Periode',
            type: 'info-section',
            icon: '📅',
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
                    name: 'StartDatum', 
                    label: 'Start Datum', 
                    type: 'datetime-local', 
                    required: true,
                    help: 'Begin datum en tijd van het verlof'
                },
                { 
                    name: 'EindDatum', 
                    label: 'Eind Datum', 
                    type: 'datetime-local', 
                    required: true,
                    help: 'Eind datum en tijd van het verlof'
                },
                { 
                    name: 'Reden', 
                    label: 'Reden', 
                    type: 'text', 
                    required: true,
                    placeholder: 'Bijv. Jaarlijks verlof',
                    help: 'Type verlof of reden voor de aanvraag'
                },
                { 
                    name: 'RedenId', 
                    label: 'Reden ID', 
                    type: 'text',
                    placeholder: 'ID van de verlof reden',
                    help: 'Referentie naar de verlof reden in het systeem'
                }
            ]
        },
        {
            title: 'Omschrijving',
            type: 'content-section',
            fields: [
                { 
                    name: 'Omschrijving', 
                    label: 'Omschrijving', 
                    type: 'textarea', 
                    colSpan: 2,
                    rows: 4,
                    placeholder: 'Aanvullende informatie over de verlofaanvraag...',
                    help: 'Extra details of opmerkingen bij deze verlofaanvraag'
                },
                { 
                    name: 'OpmerkingBehandelaar', 
                    label: 'Opmerking Behandelaar', 
                    type: 'textarea', 
                    colSpan: 2,
                    rows: 3,
                    placeholder: 'Opmerkingen van de behandelaar...',
                    help: 'Feedback of opmerkingen van de goedkeurende manager'
                }
            ]
        },
        {
            title: 'Status & Herinnering',
            type: 'toggle-section',
            icon: '🔔',
            background: 'warning',
            fields: [
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
                    help: 'Huidige status van de verlofaanvraag'
                },
                { 
                    name: 'HerinneringDatum', 
                    label: 'Herinnering Datum', 
                    type: 'datetime-local',
                    help: 'Wanneer een herinnering moet worden verstuurd'
                },
                { 
                    name: 'HerinneringStatus', 
                    label: 'Herinnering Status', 
                    type: 'select',
                    options: [
                        { value: 'Geen', label: 'Geen Herinnering' },
                        { value: 'Gepland', label: 'Gepland' },
                        { value: 'Verzonden', label: 'Verzonden' },
                        { value: 'Mislukt', label: 'Mislukt' }
                    ],
                    help: 'Status van de herinnering functionaliteit'
                }
            ]
        }
    ]
};

/**
 * VerlofForm component using enhanced base form with modal configuration
 */
export const VerlofForm = ({ onSave, onCancel, initialData = {}, title }) => {
    return h(EnhancedBaseForm, {
        onSave,
        onCancel,
        initialData,
        config: verlofConfig,
        title,
        modalType: 'large',
        modalOverrides: {
            width: 'large',
            header: {
                gradient: 'primary',
                showIcon: true
            }
        }
    });
};
