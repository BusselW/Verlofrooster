/**
 * DagIndicatorForm.js - Day indicator form component using enhanced modal configuration
 * References coding instructions for ES6 modules, accessibility, and modern UX patterns
 */

import { EnhancedBaseForm } from './EnhancedBaseForm.js';

const { createElement: h } = React;

/**
 * Configuration for the day indicator form
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
                    name: 'IndicatorKleur', 
                    label: 'Kleur', 
                    type: 'color', 
                    required: true,
                    placeholder: '#EF4444',
                    help: 'Kleur voor deze indicator in het rooster'
                },
                { 
                    name: 'Icoon', 
                    label: 'Icoon', 
                    type: 'text',
                    placeholder: '🎉',
                    help: 'Emoji of icoon voor deze indicator (optioneel)'
                },
                { 
                    name: 'Prioriteit', 
                    label: 'Prioriteit', 
                    type: 'select',
                    required: true,
                    placeholder: 'Selecteer prioriteit...',
                    options: [
                        { value: 'laag', label: 'Laag' },
                        { value: 'normaal', label: 'Normaal' },
                        { value: 'hoog', label: 'Hoog' },
                        { value: 'kritiek', label: 'Kritiek' }
                    ],
                    help: 'Prioriteit van deze indicator voor weergave'
                }
            ]
        },
        {
            title: 'Instellingen',
            type: 'toggle-section',
            icon: '⚙️',
            background: 'neutral',
            fields: [
                { 
                    name: 'Actief', 
                    label: 'Actief', 
                    type: 'toggle', 
                    help: 'Schakel uit om deze indicator te deactiveren'
                },
                { 
                    name: 'ZichtbaarInRooster', 
                    label: 'Zichtbaar in Rooster', 
                    type: 'toggle', 
                    help: 'Toon deze indicator in de roosterweergave'
                },
                { 
                    name: 'AutomatischToepassen', 
                    label: 'Automatisch Toepassen', 
                    type: 'toggle', 
                    help: 'Pas deze indicator automatisch toe op basis van regels'
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