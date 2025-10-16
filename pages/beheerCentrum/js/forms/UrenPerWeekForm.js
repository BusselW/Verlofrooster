/**
 * UrenPerWeekForm.js - Hours per week form component using enhanced modal configuration
 * References coding instructions for ES6 modules, accessibility, and modern UX patterns
 */

import { EnhancedBaseForm } from './EnhancedBaseForm.js';

const { createElement: h } = React;

/**
 * Configuration for the hours per week form
 */
const urenPerWeekConfig = {
    sections: [
        {
            title: 'Werknemer Schema',
            fields: [
                { 
                    name: 'MedewerkerID', 
                    label: 'Medewerker ID', 
                    type: 'text', 
                    required: true,
                    placeholder: 'domein\\gebruikersnaam',
                    help: 'Unieke identificatie van de medewerker'
                },
                { 
                    name: 'WeekType', 
                    label: 'Week Type', 
                    type: 'text',
                    placeholder: 'Bijv. Standaard, Parttime',
                    help: 'Type werkweek schema'
                }
            ]
        },
        {
            title: 'Schema Planning',
            type: 'info-section',
            icon: '📅',
            background: 'primary',
            fields: [
                { 
                    name: 'Ingangsdatum', 
                    label: 'Ingangsdatum', 
                    type: 'datetime-local', 
                    required: true,
                    help: 'Wanneer dit schema ingaat'
                },
                { 
                    name: 'VeranderingsDatum', 
                    label: 'Veranderingsdatum', 
                    type: 'datetime-local',
                    help: 'Laatste wijzigingsdatum van dit schema'
                }
            ]
        },
        {
            title: 'Schema Instellingen',
            type: 'toggle-section',
            icon: '🔄',
            background: 'secondary',
            fields: [
                { 
                    name: 'IsRotatingSchedule', 
                    label: 'Roterend Schema', 
                    type: 'toggle',
                    help: 'Schakel in voor een roterend werkschema'
                },
                { 
                    name: 'CycleStartDate', 
                    label: 'Cyclus Start Datum', 
                    type: 'datetime-local',
                    help: 'Start datum van de rotatie cyclus (indien van toepassing)'
                }
            ]
        },
        {
            title: 'Maandag Schema',
            type: 'day-section',
            icon: '1️⃣',
            background: 'neutral',
            fields: [
                { 
                    name: 'MaandagStart', 
                    label: 'Maandag Start', 
                    type: 'text',
                    placeholder: '09:00',
                    help: 'Start tijd op maandag (HH:MM)'
                },
                { 
                    name: 'MaandagEind', 
                    label: 'Maandag Eind', 
                    type: 'text',
                    placeholder: '17:00',
                    help: 'Eind tijd op maandag (HH:MM)'
                },
                { 
                    name: 'MaandagSoort', 
                    label: 'Maandag Soort', 
                    type: 'text',
                    placeholder: 'Normaal, Thuis, Verlof',
                    help: 'Type werkdag (normaal, thuiswerk, etc.)'
                },
                { 
                    name: 'MaandagTotaal', 
                    label: 'Maandag Totaal', 
                    type: 'text',
                    placeholder: '8:00',
                    help: 'Totaal aantal uren op maandag'
                }
            ]
        },
        {
            title: 'Dinsdag Schema',
            type: 'day-section',
            icon: '2️⃣',
            background: 'neutral',
            fields: [
                { 
                    name: 'DinsdagStart', 
                    label: 'Dinsdag Start', 
                    type: 'text',
                    placeholder: '09:00',
                    help: 'Start tijd op dinsdag (HH:MM)'
                },
                { 
                    name: 'DinsdagEind', 
                    label: 'Dinsdag Eind', 
                    type: 'text',
                    placeholder: '17:00',
                    help: 'Eind tijd op dinsdag (HH:MM)'
                },
                { 
                    name: 'DinsdagSoort', 
                    label: 'Dinsdag Soort', 
                    type: 'text',
                    placeholder: 'Normaal, Thuis, Verlof',
                    help: 'Type werkdag (normaal, thuiswerk, etc.)'
                },
                { 
                    name: 'DinsdagTotaal', 
                    label: 'Dinsdag Totaal', 
                    type: 'text',
                    placeholder: '8:00',
                    help: 'Totaal aantal uren op dinsdag'
                }
            ]
        },
        {
            title: 'Woensdag Schema',
            type: 'day-section',
            icon: '3️⃣',
            background: 'neutral',
            fields: [
                { 
                    name: 'WoensdagStart', 
                    label: 'Woensdag Start', 
                    type: 'text',
                    placeholder: '09:00',
                    help: 'Start tijd op woensdag (HH:MM)'
                },
                { 
                    name: 'WoensdagEind', 
                    label: 'Woensdag Eind', 
                    type: 'text',
                    placeholder: '17:00',
                    help: 'Eind tijd op woensdag (HH:MM)'
                },
                { 
                    name: 'WoensdagSoort', 
                    label: 'Woensdag Soort', 
                    type: 'text',
                    placeholder: 'Normaal, Thuis, Verlof',
                    help: 'Type werkdag (normaal, thuiswerk, etc.)'
                },
                { 
                    name: 'WoensdagTotaal', 
                    label: 'Woensdag Totaal', 
                    type: 'text',
                    placeholder: '8:00',
                    help: 'Totaal aantal uren op woensdag'
                }
            ]
        },
        {
            title: 'Donderdag Schema',
            type: 'day-section',
            icon: '4️⃣',
            background: 'neutral',
            fields: [
                { 
                    name: 'DonderdagStart', 
                    label: 'Donderdag Start', 
                    type: 'text',
                    placeholder: '09:00',
                    help: 'Start tijd op donderdag (HH:MM)'
                },
                { 
                    name: 'DonderdagEind', 
                    label: 'Donderdag Eind', 
                    type: 'text',
                    placeholder: '17:00',
                    help: 'Eind tijd op donderdag (HH:MM)'
                },
                { 
                    name: 'DonderdagSoort', 
                    label: 'Donderdag Soort', 
                    type: 'text',
                    placeholder: 'Normaal, Thuis, Verlof',
                    help: 'Type werkdag (normaal, thuiswerk, etc.)'
                },
                { 
                    name: 'DonderdagTotaal', 
                    label: 'Donderdag Totaal', 
                    type: 'text',
                    placeholder: '8:00',
                    help: 'Totaal aantal uren op donderdag'
                }
            ]
        },
        {
            title: 'Vrijdag Schema',
            type: 'day-section',
            icon: '5️⃣',
            background: 'neutral',
            fields: [
                { 
                    name: 'VrijdagStart', 
                    label: 'Vrijdag Start', 
                    type: 'text',
                    placeholder: '09:00',
                    help: 'Start tijd op vrijdag (HH:MM)'
                },
                { 
                    name: 'VrijdagEind', 
                    label: 'Vrijdag Eind', 
                    type: 'text',
                    placeholder: '17:00',
                    help: 'Eind tijd op vrijdag (HH:MM)'
                },
                { 
                    name: 'VrijdagSoort', 
                    label: 'Vrijdag Soort', 
                    type: 'text',
                    placeholder: 'Normaal, Thuis, Verlof',
                    help: 'Type werkdag (normaal, thuiswerk, etc.)'
                },
                { 
                    name: 'VrijdagTotaal', 
                    label: 'Vrijdag Totaal', 
                    type: 'text',
                    placeholder: '8:00',
                    help: 'Totaal aantal uren op vrijdag'
                }
            ]
        }
    ]
};

/**
 * UrenPerWeekForm component using enhanced base form with modal configuration
 */
export const UrenPerWeekForm = ({ onSave, onCancel, initialData = {}, title }) => {
    return h(EnhancedBaseForm, {
        onSave,
        onCancel,
        initialData,
        config: urenPerWeekConfig,
        title,
        modalType: 'large',
        modalOverrides: {
            width: 'extra-large',
            header: {
                gradient: 'info',
                showIcon: true
            }
        }
    });
};
