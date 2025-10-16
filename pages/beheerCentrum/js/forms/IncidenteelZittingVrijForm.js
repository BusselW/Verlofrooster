/**
 * IncidenteelZittingVrijForm.js - Incidental session-free form component using enhanced modal configuration
 * References coding instructions for ES6 modules, accessibility, and modern UX patterns
 */

import { EnhancedBaseForm } from './EnhancedBaseForm.js';

const { createElement: h } = React;

/**
 * Configuration for the incidental session-free form
 */
const incidenteelZittingVrijConfig = {
    sections: [
        {
            title: 'Zittingsvrije Periode Details',
            fields: [
                { 
                    name: 'Title', 
                    label: 'Titel', 
                    type: 'text', 
                    required: true, 
                    colSpan: 2,
                    placeholder: 'Bijv. Incidenteel Zittingsvrij - Vakantie',
                    help: 'Een beschrijvende titel voor deze zittingsvrije periode'
                },
                { 
                    name: 'Gebruikersnaam', 
                    label: 'Gebruikersnaam', 
                    type: 'text', 
                    required: true,
                    placeholder: 'domein\\gebruikersnaam',
                    help: 'Gebruikersnaam van de medewerker'
                },
                { 
                    name: 'Afkorting', 
                    label: 'Afkorting', 
                    type: 'text',
                    placeholder: 'ZV',
                    maxLength: 5,
                    help: 'Korte afkorting voor in het rooster (max 5 karakters)'
                }
            ]
        },
        {
            title: 'Periode Planning',
            type: 'info-section',
            icon: '📅',
            background: 'primary',
            fields: [
                { 
                    name: 'ZittingsVrijeDagTijd', 
                    label: 'Start Tijd', 
                    type: 'datetime-local', 
                    required: true,
                    help: 'Start datum en tijd van de zittingsvrije periode'
                },
                { 
                    name: 'ZittingsVrijeDagTijdEind', 
                    label: 'Eind Tijd', 
                    type: 'datetime-local', 
                    required: true,
                    help: 'Eind datum en tijd van de zittingsvrije periode'
                }
            ]
        },
        {
            title: 'Terugkeer Instellingen',
            type: 'toggle-section',
            icon: '🔄',
            background: 'secondary',
            fields: [
                { 
                    name: 'Terugkerend', 
                    label: 'Terugkerend', 
                    type: 'toggle',
                    help: 'Schakel in als deze zittingsvrije periode regelmatig terugkeert'
                },
                { 
                    name: 'TerugkeerPatroon', 
                    label: 'Terugkeer Patroon', 
                    type: 'select',
                    options: [
                        { value: 'dagelijks', label: 'Dagelijks' },
                        { value: 'wekelijks', label: 'Wekelijks' },
                        { value: 'maandelijks', label: 'Maandelijks' },
                        { value: 'jaarlijks', label: 'Jaarlijks' }
                    ],
                    help: 'Hoe vaak deze zittingsvrije periode terugkeert'
                },
                { 
                    name: 'TerugkerendTot', 
                    label: 'Terugkerend Tot', 
                    type: 'datetime-local',
                    help: 'Tot wanneer het terugkerende patroon geldt'
                }
            ]
        },
        {
            title: 'Opmerkingen',
            type: 'content-section',
            fields: [
                { 
                    name: 'Opmerking', 
                    label: 'Opmerking', 
                    type: 'textarea', 
                    colSpan: 2,
                    rows: 4,
                    placeholder: 'Aanvullende informatie over deze zittingsvrije periode...',
                    help: 'Extra details of opmerkingen over deze zittingsvrije periode'
                }
            ]
        }
    ]
};

/**
 * IncidenteelZittingVrijForm component using enhanced base form with modal configuration
 */
export const IncidenteelZittingVrijForm = ({ onSave, onCancel, initialData = {}, title }) => {
    return h(EnhancedBaseForm, {
        onSave,
        onCancel,
        initialData,
        config: incidenteelZittingVrijConfig,
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
