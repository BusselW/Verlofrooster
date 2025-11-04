/**
 * DagIndicatorForm.js - Day indicator form component using enhanced modal configuration
 * References coding instructions for ES6 modules, accessibility, and modern UX patterns
 */

import { EnhancedBaseForm } from './EnhancedBaseForm.js';

const { createElement: h } = React;

/**
 * Configuration for the day indicator form
 * Field names match SharePoint DagenIndicators list: Title, Beschrijving, Kleur, Patroon, Validatie
 */
const dagIndicatorConfig = {
    sections: [
        {
            title: 'Indicator Details',
            fields: [
                { 
                    name: 'Title', 
                    label: 'Titel', 
                    type: 'text', 
                    required: true, 
                    colSpan: 2,
                    placeholder: 'Bijv. Feestdag',
                    help: 'De naam van deze dag indicator'
                },
                { 
                    name: 'Beschrijving', 
                    label: 'Beschrijving', 
                    type: 'textarea', 
                    colSpan: 2,
                    rows: 3,
                    placeholder: 'Beschrijf wat deze indicator betekent...',
                    help: 'Uitgebreide beschrijving van wat deze indicator betekent'
                },
                { 
                    name: 'Kleur', 
                    label: 'Kleur', 
                    type: 'color', 
                    required: true,
                    placeholder: '#EF4444',
                    help: 'Kleur voor deze indicator in het rooster'
                },
                { 
                    name: 'Patroon', 
                    label: 'Patroon', 
                    type: 'text',
                    placeholder: 'solid',
                    help: 'Visueel patroon voor deze indicator (bijv. solid, striped, dotted)'
                },
                { 
                    name: 'Validatie', 
                    label: 'Validatie', 
                    type: 'text',
                    placeholder: 'Validatie regel',
                    help: 'Validatie regel voor deze indicator (optioneel)'
                }
            ]
        }
    ]
};

/**
 * DagIndicatorForm component using enhanced base form with modal configuration
 */
export const DagIndicatorForm = ({ onSave, onCancel, initialData = {}, title }) => {
    return h(EnhancedBaseForm, {
        onSave,
        onCancel,
        initialData,
        config: dagIndicatorConfig,
        title,
        modalType: 'standard',
        modalOverrides: {
            width: 'medium',
            header: {
                gradient: 'warning',
                showIcon: true
            }
        }
    });
};