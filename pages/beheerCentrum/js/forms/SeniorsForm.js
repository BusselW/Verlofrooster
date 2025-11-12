/**
 * SeniorsForm.js - Senior employees form component using enhanced modal configuration
 * References coding instructions for ES6 modules, accessibility, and modern UX patterns
 */

import { EnhancedBaseForm } from './EnhancedBaseForm.js';
import { Autocomplete } from '../ui/Autocomplete.js';
import { searchSiteUsers, getListItems } from '../dataService.js';

const { useState, useEffect, createElement: h } = React;

/**
 * Configuration for the seniors form
 */
const seniorsConfig = {
    sections: [
        {
            title: 'Senior Medewerker Details',
            fields: [
                { 
                    name: 'Medewerker', 
                    label: 'Medewerker', 
                    type: 'text', 
                    required: true,
                    readOnlyForNew: true,
                    placeholder: 'Naam van de senior medewerker',
                    help: 'Volledige naam van de senior medewerker'
                },
                { 
                    name: 'MedewerkerID', 
                    label: 'Medewerker ID', 
                    type: 'text', 
                    required: true,
                    readOnlyForNew: true,
                    placeholder: 'domein\\gebruikersnaam',
                    help: 'Unieke identificatie van de medewerker'
                }
            ]
        },
        {
            title: 'Team Informatie',
            type: 'info-section',
            icon: '👥',
            background: 'primary',
            fields: [
                { 
                    name: 'Team', 
                    label: 'Team', 
                    type: 'select', 
                    required: true,
                    placeholder: 'Selecteer een team...',
                    help: 'Het team waar deze senior medewerker onderdeel van is',
                    options: [] // Will be populated dynamically
                },
                { 
                    name: 'TeamID', 
                    label: 'Team ID', 
                    type: 'text',
                    readOnly: true,
                    placeholder: 'Wordt automatisch ingevuld',
                    help: 'Wordt automatisch ingevuld bij team selectie'
                }
            ]
        }
    ]
};

/**
 * SeniorsForm component using enhanced base form with modal configuration
 */
export const SeniorsForm = ({ onSave, onCancel, initialData = {}, title }) => {
    const [formData, setFormData] = useState(initialData);
    const [teams, setTeams] = useState([]);
    const [teamsMap, setTeamsMap] = useState(new Map()); // Map to store team name -> ID

    // Load teams data on component mount
    useEffect(() => {
        const loadTeamsData = async () => {
            try {
                console.log('🔄 Loading teams data for SeniorsForm...');
                
                // Load teams - fetch Naam and Id fields
                const teamsData = await getListItems('Teams', 'Naam,Id');
                console.log('✅ Teams data loaded:', teamsData);
                
                const teamOptions = teamsData.map(team => ({
                    value: team.Naam,
                    label: team.Naam,
                    id: team.Id
                }));
                setTeams(teamOptions);
                
                // Create map for quick lookup: team name -> team ID
                const teamMap = new Map();
                teamsData.forEach(team => {
                    teamMap.set(team.Naam, team.Id);
                });
                setTeamsMap(teamMap);
                
                // Update config with loaded options
                seniorsConfig.sections[1].fields[0].options = teamOptions;
                
                console.log('✅ Teams loaded successfully:', teamOptions.length, 'teams');
            } catch (error) {
                console.error('❌ Error loading teams data:', error);
            }
        };

        loadTeamsData();
    }, []);

    // Auto-populate TeamID when initialData has Team but no TeamID, or when teams are loaded
    useEffect(() => {
        if (teamsMap.size > 0 && formData.Team && !formData.TeamID) {
            const teamId = teamsMap.get(formData.Team);
            if (teamId) {
                console.log('🔧 Auto-populating TeamID for existing Team:', formData.Team, '→', teamId);
                setFormData(prev => ({
                    ...prev,
                    TeamID: teamId
                }));
            }
        }
    }, [teamsMap, formData.Team, formData.TeamID]);

    // Enhanced autocomplete search function
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
            }
            
            return result || [];
        } catch (error) {
            console.error('❌ Autocomplete search error:', error);
            return [];
        }
    };

    // Handle autocomplete selection
    const handleAutocompleteSelect = (user) => {
        console.log('👤 User selected from autocomplete:', user);
        
        let username = user.LoginName || user.UserPrincipalName || '';
        
        // Remove claims prefix if present (i:0#.w|domain\username -> domain\username)
        if (username.includes('|')) {
            username = username.split('|').pop();
        }
        
        // Ensure single backslash (not double)
        username = username.replace(/\\\\/g, '\\');
        
        setFormData(prev => ({
            ...prev,
            Medewerker: user.Title,
            MedewerkerID: username
        }));
    };

    // Handle team selection - automatically populate TeamID
    const handleTeamChange = (teamName) => {
        const teamId = teamsMap.get(teamName);
        
        setFormData(prev => ({
            ...prev,
            Team: teamName,
            TeamID: teamId || ''
        }));
    };

    // Custom content renderer for SeniorsForm specific needs
    const renderCustomContent = () => {
        return h('div', { className: 'seniors-form-content' },
            // Autocomplete for new senior employees
            !initialData.Id && h('div', { className: 'form-section autocomplete-section section-bg-info' },
                h('h3', { className: 'form-section-title' },
                    h('span', { className: 'section-icon', 'aria-hidden': 'true' }, '🔍'),
                    'Zoek Medewerker'
                ),
                h('div', { className: 'form-field' },
                    h('label', { className: 'form-label' }, 'Zoek bestaande medewerker'),
                    h(Autocomplete, {
                        key: 'autocomplete-senior-search',
                        onSelect: handleAutocompleteSelect,
                        searchFunction: performAutocompleteSearch,
                        placeholder: 'Type om te zoeken naar medewerkers...'
                    }),
                    h('div', { className: 'form-help' }, 
                        'Zoek een bestaande medewerker om gegevens automatisch in te vullen'
                    )
                )
            ),
            
            // Render form sections
            ...seniorsConfig.sections.map((section, index) => 
                h('div', { 
                    className: `form-section ${section.type === 'info-section' ? 'info-section' : ''} ${section.background ? `section-bg-${section.background}` : ''}`,
                    key: index 
                },
                    h('h3', { className: 'form-section-title' },
                        section.icon && h('span', { className: 'section-icon', 'aria-hidden': 'true' }, section.icon),
                        section.title
                    ),
                    h('div', { className: 'form-section-fields' },
                        section.fields.map(field => {
                            // Populate select field options
                            if (field.type === 'select' && field.name === 'Team') {
                                field.options = teams;
                            }
                            
                            return renderFormField(field);
                        })
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
                onChange: (e) => {
                    const selectedValue = e.target.value;
                    // Special handling for Team field
                    if (field.name === 'Team') {
                        handleTeamChange(selectedValue);
                    } else {
                        setFormData(prev => ({
                            ...prev,
                            [field.name]: selectedValue
                        }));
                    }
                }
            },
                h('option', { value: '', disabled: true }, field.placeholder || 'Selecteer...'),
                options.map(option => 
                    h('option', { key: option.value, value: option.value }, option.label)
                )
            );
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
        onSave,
        onCancel,
        initialData: formData,
        config: seniorsConfig,
        title,
        modalType: 'standard',
        modalOverrides: {
            width: 'medium',
            header: {
                gradient: 'info',
                showIcon: true
            }
        },
        children: renderCustomContent()
    });
};
