/**
 * ZittingsvrijOpmaakForm.js - Session-free formatting form component using enhanced modal configuration
 * References coding instructions for ES6 modules, accessibility, and modern UX patterns
 */

import { EnhancedBaseForm } from './EnhancedBaseForm.js';

const { createElement: h } = React;

/**
 * Configuration for the session-free formatting form
 */
const zittingsvrijOpmaakConfig = {
    sections: [
        {
            title: 'Opmaak Details',
            fields: [
                { 
                    name: 'Title', 
                    label: 'Titel', 
                    type: 'text', 
                    required: true, 
                    colSpan: 2,
                    placeholder: 'Bijv. Zittingsvrije Periode - Kerstvakantie',
                    help: 'Een beschrijvende naam voor deze zittingsvrije opmaak'
                }
            ]
        },
        {
            title: 'Kleur & Stijl',
            type: 'design-section',
            icon: '🎨',
            background: 'secondary',
            fields: [
                { 
                    name: 'Kleur', 
                    label: 'Achtergrond Kleur', 
                    type: 'color', 
                    required: true,
                    placeholder: '#F3F4F6',
                    help: 'Achtergrondkleur voor zittingsvrije dagen in het rooster'
                },
                { 
                    name: 'TextColor', 
                    label: 'Text Kleur', 
                    type: 'color', 
                    required: true,
                    placeholder: '#1F2937',
                    help: 'Tekstkleur voor de weergave van zittingsvrije dagen'
                },
                { 
                    name: 'Transparantie', 
                    label: 'Transparantie (%)', 
                    type: 'number',
                    placeholder: '80',
                    min: 0,
                    max: 100,
                    step: 5,
                    help: 'Transparantie percentage (0-100%)'
                },
                { 
                    name: 'FontSize', 
                    label: 'Font Size (px)', 
                    type: 'number',
                    placeholder: '14',
                    min: 8,
                    max: 24,
                    step: 1,
                    help: 'Grootte van de tekst in pixels'
                }
            ]
        },
        {
            title: 'Border & Patroon',
            type: 'design-section',
            icon: '📐',
            background: 'neutral',
            fields: [
                { 
                    name: 'BorderStyle', 
                    label: 'Border Style', 
                    type: 'select',
                    options: [
                        { value: 'none', label: 'Geen border' },
                        { value: 'solid', label: 'Solide lijn' },
                        { value: 'dashed', label: 'Gestreepte lijn' },
                        { value: 'dotted', label: 'Gestippelde lijn' },
                        { value: 'double', label: 'Dubbele lijn' }
                    ],
                    help: 'Stijl van de rand rondom zittingsvrije dagen'
                },
                { 
                    name: 'BorderWidth', 
                    label: 'Border Width (px)', 
                    type: 'number',
                    placeholder: '1',
                    min: 0,
                    max: 10,
                    step: 1,
                    help: 'Dikte van de rand in pixels'
                },
                { 
                    name: 'Patroon', 
                    label: 'Patroon', 
                    type: 'text',
                    placeholder: 'Bijv. strepen, stippen, kruisarcering',
                    help: 'Optioneel achtergrondpatroon voor visuele variatie'
                }
            ]
        },
        {
            title: 'Instellingen',
            type: 'toggle-section',
            icon: '⚙️',
            background: 'primary',
            fields: [
                { 
                    name: 'Actief', 
                    label: 'Actief', 
                    type: 'toggle',
                    help: 'Schakel uit om deze opmaak tijdelijk te deactiveren'
                }
            ]
        }
    ]
};

/**
 * ZittingsvrijOpmaakForm component using enhanced base form with modal configuration
 */
export const ZittingsvrijOpmaakForm = ({ onSave, onCancel, initialData = {}, title }) => {
    return h(EnhancedBaseForm, {
        onSave,
        onCancel,
        initialData,
        config: zittingsvrijOpmaakConfig,
        title,
        modalType: 'large',
        modalOverrides: {
            width: 'large',
            header: {
                gradient: 'info',
                showIcon: true
            }
        }
    });
};
