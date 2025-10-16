/**
 * MededelingForm.js - Announcements form component using enhanced modal configuration
 * References coding instructions for ES6 modules, accessibility, and modern UX patterns
 */

import { EnhancedBaseForm } from './EnhancedBaseForm.js';

const { createElement: h } = React;

/**
 * Configuration for the announcements form
 */
const mededelingConfig = {
    sections: [
        {
            title: 'Mededeling Details',
            fields: [
                { 
                    name: 'Title', 
                    label: 'Titel', 
                    type: 'text', 
                    required: true, 
                    colSpan: 2,
                    placeholder: 'Bijv. Belangrijke wijziging verlofreglement',
                    help: 'Een duidelijke en beschrijvende titel voor de mededeling'
                },
                { 
                    name: 'username', 
                    label: 'Gebruikersnaam', 
                    type: 'text', 
                    required: true,
                    placeholder: 'domein\\gebruikersnaam',
                    help: 'Gebruikersnaam van degene die de mededeling plaatst'
                }
            ]
        },
        {
            title: 'Mededeling Inhoud',
            type: 'content-section',
            fields: [
                { 
                    name: 'Aanvulling', 
                    label: 'Aanvulling', 
                    type: 'textarea', 
                    colSpan: 2,
                    rows: 6,
                    required: true,
                    placeholder: 'Voer hier de volledige tekst van de mededeling in...',
                    help: 'De volledige inhoud van de mededeling die getoond wordt aan gebruikers'
                }
            ]
        },
        {
            title: 'Planning & Zichtbaarheid',
            type: 'info-section',
            icon: '📅',
            background: 'primary',
            fields: [
                { 
                    name: 'DatumTijdStart', 
                    label: 'Start Datum/Tijd', 
                    type: 'datetime-local', 
                    required: true,
                    help: 'Wanneer de mededeling zichtbaar wordt voor gebruikers'
                },
                { 
                    name: 'DatumTijdEinde', 
                    label: 'Eind Datum/Tijd', 
                    type: 'datetime-local', 
                    required: true,
                    help: 'Wanneer de mededeling niet meer zichtbaar is'
                }
            ]
        },
        {
            title: 'Doelgroep',
            type: 'content-section',
            fields: [
                { 
                    name: 'UitzendenAan', 
                    label: 'Uitzenden Aan (Teams)', 
                    type: 'textarea', 
                    colSpan: 2,
                    rows: 4,
                    placeholder: 'Geef de teams op gescheiden door komma\'s, bijv: Team A, Team B, Team C\nOf laat leeg voor alle teams',
                    help: 'Specificeer welke teams deze mededeling moeten zien. Laat leeg voor alle teams.'
                }
            ]
        }
    ]
};

/**
 * MededelingForm component using enhanced base form with modal configuration
 */
export const MededelingForm = ({ onSave, onCancel, initialData = {}, title }) => {
    return h(EnhancedBaseForm, {
        onSave,
        onCancel,
        initialData,
        config: mededelingConfig,
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
