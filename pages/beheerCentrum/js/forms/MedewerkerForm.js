/**
 * MedewerkerForm.js - Employee-specific form component
 * References coding instructions for ES6 modules, accessibility, and modern UX patterns
 */

import { EnhancedBaseForm } from './EnhancedBaseForm.js';
import { Autocomplete } from '../ui/Autocomplete.js';
import { searchSiteUsers, getListItems, testSharePointConnection } from '../dataService.js';
import { getModalConfig } from '../config/modalLayouts.js';

const { useState, useEffect, createElement: h } = React;

/**
 * Configuration for the employee form
 */
const medewerkerConfig = {
    sections: [
        {
            title: 'Persoonlijke Gegevens',
            fields: [
                { 
                    name: 'Naam', 
                    label: 'Volledige Naam', 
                    type: 'text', 
                    required: true, 
                    colSpan: 2, 
                    placeholder: 'Bijv. Jan de Vries' 
                },
                { 
                    name: 'Username', 
                    label: 'Gebruikersnaam', 
                    type: 'text', 
                    required: true, 
                    readOnlyForNew: true, 
                    placeholder: 'Bijv. org\\jdevries' 
                },
                { 
                    name: 'E_x002d_mail', 
                    label: 'E-mailadres', 
                    type: 'email', 
                    required: true, 
                    readOnlyForNew: true, 
                    placeholder: 'Bijv. jan.devries@organisatie.nl' 
                },
                { 
                    name: 'Geboortedatum', 
                    label: 'Geboortedatum', 
                    type: 'date', 
                    placeholder: 'DD-MM-JJJJ' 
                },
                { 
                    name: 'Functie', 
                    label: 'Functie', 
                    type: 'select', 
                    required: true, 
                    placeholder: 'Selecteer een functie...',
                    options: [] // Will be populated dynamically
                },
                { 
                    name: 'Team', 
                    label: 'Team', 
                    type: 'select', 
                    required: true, 
                    placeholder: 'Selecteer een team...',
                    options: [] // Will be populated dynamically
                },
            ]
        },
        {
            title: 'Opmerkingen',
            fields: [
                { 
                    name: 'Opmekring', 
                    label: 'Opmerking', 
                    type: 'textarea', 
                    colSpan: 2, 
                    rows: 3,
                    placeholder: 'Voeg eventuele opmerkingen toe...' 
                },
                { 
                    name: 'OpmerkingGeldigTot', 
                    label: 'Opmerking Geldig Tot', 
                    type: 'date', 
                    placeholder: 'DD-MM-JJJJ' 
                },
            ]
        },
        {
            title: 'Status & Zichtbaarheid',
            type: 'toggle-section',
            icon: '⚙️',
            background: 'neutral',
            fields: [
                { 
                    name: 'Actief', 
                    label: 'Medewerker Actief', 
                    type: 'toggle', 
                    help: 'Schakel uit om medewerker te deactiveren' 
                },
                { 
                    name: 'Verbergen', 
                    label: 'Verbergen in Rooster', 
                    type: 'toggle', 
                    help: 'Verberg medewerker in de roosterweergave' 
                },
                { 
                    name: 'Horen', 
                    label: 'Horen', 
                    type: 'toggle', 
                    help: 'Medewerker kan horen (toegankelijkheidsfunctie)' 
                },
            ]
        }
    ]
};

/**
 * MedewerkerForm component using enhanced base form with modal configuration
 */
export const MedewerkerForm = ({ onSave, onCancel, initialData = {}, title }) => {
    const [formData, setFormData] = useState(initialData);
    const [teams, setTeams] = useState([]);
    const [functies, setFuncties] = useState([]);

    // Load dropdown data on component mount
    useEffect(() => {
        const loadDropdownData = async () => {
            try {
                console.log('🔄 Loading dropdown data...');
                
                // Load teams
                const teamsData = await getListItems('Teams', ['Id', 'Title', 'TeamKleur']);
                const teamOptions = teamsData.map(team => ({
                    value: team.Title,
                    label: team.Title
                }));
                setTeams(teamOptions);
                
                // Load functions
                const functiesData = await getListItems('Functies', ['Id', 'Title']);
                const functieOptions = functiesData.map(functie => ({
                    value: functie.Title,
                    label: functie.Title
                }));
                setFuncties(functieOptions);
                
                // Update config with loaded options
                medewerkerConfig.sections[0].fields[4].options = functieOptions;
                medewerkerConfig.sections[0].fields[5].options = teamOptions;
                
                console.log('✅ Dropdown data loaded successfully');
                console.log('📊 Teams:', teamOptions.length, 'Functies:', functieOptions.length);
            } catch (error) {
                console.error('❌ Error loading dropdown data:', error);
            }
        };

        // Test SharePoint connection on component mount
        testSharePointConnection();
        loadDropdownData();
    }, []);

    // Enhanced autocomplete search function with robust error handling
    const performAutocompleteSearch = async (query) => {
        console.log('🔍 Autocomplete search started with query:', query);
        
        if (!query || query.length < 3) {
            console.log('❌ Query too short, returning empty array');
            return [];
        }
        
        try {
            console.log('⏳ Calling searchSiteUsers...');
            const result = await searchSiteUsers(query);
            console.log('✅ Search results received:', result.length, 'users found');
            
            if (result && result.length > 0) {
                console.log('👤 Sample result:', {
                    Title: result[0].Title,
                    Email: result[0].Email,
                    LoginName: result[0].LoginName
                });
            } else {
                console.log('❌ No users found for query:', query);
            }
            
            return result || [];
        } catch (error) {
            console.error('❌ Autocomplete search error:', error);
            return [];
        }
    };

    // Handle autocomplete selection with robust username processing
    const handleAutocompleteSelect = (user) => {
        console.log('👤 User selected from autocomplete:', user);
        
        let username = user.LoginName || user.UserPrincipalName || '';
        
        // Remove claims prefix if present (i:0#.w|domain\username -> domain\username)
        if (username.includes('|')) {
            username = username.split('|').pop();
            console.log('🔧 Removed claims prefix, new username:', username);
        }
        
        // Ensure single backslash (not double)
        username = username.replace(/\\\\/g, '\\');
        console.log('🔧 Processed username for display:', username);
        
        setFormData(prev => ({
            ...prev,
            Username: username, // Should be in format: domain\username
            E_x002d_mail: user.Email,
            // Don't prefill Naam - let user see placeholder instead
        }));
    };

    // Handle save with username processing
    const handleSaveWithProcessing = async (data) => {
        // Process username format for SharePoint
        let processedData = { ...data };
        if (processedData.Username) {
            // Ensure username is in domain\username format
            let username = processedData.Username;
            
            // Remove claims prefix if present (i:0#.w|domain\username -> domain\username)
            if (username.includes('|')) {
                username = username.split('|').pop();
            }
            
            // Ensure single backslash (not double)
            username = username.replace(/\\\\/g, '\\');
            
            console.log('Final username for save:', username); // Debug the final format
            processedData.Username = username;
        }
        await onSave(processedData);
    };

    // Custom content renderer for MedewerkerForm specific needs
    const renderCustomContent = () => {
        return h('div', { className: 'medewerker-form-content' },
            // Autocomplete for new employees
            !initialData.Id && h('div', { className: 'form-section autocomplete-section section-bg-info' },
                h('h3', { className: 'form-section-title' },
                    h('span', { className: 'section-icon', 'aria-hidden': 'true' }, '🔍'),
                    'Zoek Medewerker'
                ),
                h('div', { className: 'form-field' },
                    h('label', { className: 'form-label' }, 'Zoek bestaande medewerker'),
                    h(Autocomplete, {
                        key: 'autocomplete-employee-search',
                        onSelect: handleAutocompleteSelect,
                        searchFunction: performAutocompleteSearch,
                        placeholder: 'Type om te zoeken naar medewerkers...'
                    }),
                    h('div', { className: 'form-help' }, 
                        'Zoek een bestaande medewerker om gegevens automatisch in te vullen'
                    )
                )
            ),
            
            // Render form sections using enhanced configuration
            ...medewerkerConfig.sections.map((section, index) => 
                h('div', { 
                    className: `form-section ${section.type === 'toggle-section' ? 'toggle-section' : ''} ${section.background ? `section-bg-${section.background}` : ''}`,
                    key: index 
                },
                    h('h3', { className: 'form-section-title' },
                        section.icon && h('span', { className: 'section-icon', 'aria-hidden': 'true' }, section.icon),
                        section.title
                    ),
                    h('div', { 
                        className: section.type === 'toggle-section' ? 'toggle-section-fields' : 'form-section-fields'
                    },
                        section.fields.map(field => {
                            // Populate select field options
                            if (field.type === 'select') {
                                if (field.name === 'Team') field.options = teams;
                                if (field.name === 'Functie') field.options = functies;
                            }
                            
                            if (section.type === 'toggle-section') {
                                return renderToggleField(field);
                            }
                            
                            return renderFormField(field);
                        })
                    )
                )
            )
        );
    };

    // Render toggle field for toggle sections
    const renderToggleField = (field) => {
        const value = formData[field.name] || '';
        
        return h('div', { 
            className: 'toggle-field',
            key: field.name 
        },
            h('div', { className: 'toggle-field-content' },
                h('div', { className: 'toggle-field-info' },
                    h('label', { 
                        htmlFor: field.name,
                        className: 'toggle-label'
                    }, field.label),
                    field.help && h('div', { className: 'toggle-help' }, field.help)
                ),
                h('div', { className: 'toggle-field-control' },
                    h('label', { className: 'toggle-switch' },
                        h('input', {
                            id: field.name,
                            name: field.name,
                            type: 'checkbox',
                            checked: !!value,
                            onChange: (e) => setFormData(prev => ({
                                ...prev,
                                [field.name]: e.target.checked
                            }))
                        }),
                        h('span', { className: 'toggle-slider' })
                    )
                )
            )
        );
    };

    // Render regular form field
    const renderFormField = (field) => {
        const value = formData[field.name] || '';
        const isReadOnly = field.readOnly || (!initialData.Id && field.readOnlyForNew);
        
        return h('div', { 
            className: `form-field ${field.colSpan ? `col-span-${field.colSpan}` : ''}`,
            key: field.name 
        },
            h('label', { 
                htmlFor: field.name,
                className: 'form-label'
            }, 
                field.label,
                field.required && h('span', { className: 'required' }, ' *')
            ),
            renderFieldInput(field, value, isReadOnly),
            field.help && h('div', { className: 'form-help' }, field.help)
        );
    };

    // Render field input based on type
    const renderFieldInput = (field, value, isReadOnly) => {
        if (field.type === 'select') {
            const options = field.options || [];
            
            return h('select', {
                id: field.name,
                name: field.name,
                value,
                required: field.required,
                className: 'form-select',
                onChange: (e) => setFormData(prev => ({
                    ...prev,
                    [field.name]: e.target.value
                }))
            },
                h('option', { value: '', disabled: true }, field.placeholder || 'Selecteer...'),
                options.map(option => 
                    h('option', { key: option.value, value: option.value }, option.label)
                )
            );
        }

        if (field.type === 'textarea') {
            return h('textarea', {
                id: field.name,
                name: field.name,
                value,
                readOnly: isReadOnly,
                rows: field.rows || 3,
                placeholder: field.placeholder,
                className: isReadOnly ? 'form-input readonly' : 'form-input',
                onChange: (e) => setFormData(prev => ({
                    ...prev,
                    [field.name]: e.target.value
                }))
            });
        }

        return h('input', {
            id: field.name,
            name: field.name,
            type: field.type || 'text',
            value,
            readOnly: isReadOnly,
            required: field.required,
            placeholder: field.placeholder,
            className: isReadOnly ? 'form-input readonly' : 'form-input',
            onChange: (e) => setFormData(prev => ({
                ...prev,
                [field.name]: e.target.value
            }))
        });
    };

    return h(EnhancedBaseForm, {
        onSave: handleSaveWithProcessing,
        onCancel,
        initialData: formData,
        config: medewerkerConfig,
        title,
        modalType: 'employee',
        modalOverrides: {
            width: 'large',
            specialSections: {
                autocomplete: {
                    show: !initialData.Id, // Only show for new employees
                    title: 'Zoek Medewerker',
                    icon: '🔍',
                    background: 'info',
                    searchPlaceholder: 'Type om te zoeken naar medewerkers...',
                    helpText: 'Zoek een bestaande medewerker om gegevens automatisch in te vullen'
                }
            }
        },
        children: renderCustomContent()
    });
};