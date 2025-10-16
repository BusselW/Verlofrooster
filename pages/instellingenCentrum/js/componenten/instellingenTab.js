/**
 * Settings Tab Component
 * 
 * Manages user's personal preferences from the gebruikersInstellingen SharePoint list.
 * Features auto-saving toggles for display options.
 */

import { getSharePointListItems, createSharePointListItem, updateSharePointListItem } from '../../../../js/services/sharepointService.js';
import * as linkInfo from '../../../../js/services/linkInfo.js';

const { useState, useEffect, createElement: h } = React;

export const SettingsTab = ({ user, data, isRegistration = false, onDataUpdate, stepSaveTrigger, onSaveComplete }) => {
    // State for the three gebruikersInstellingen fields
    const [eigenTeamWeergeven, setEigenTeamWeergeven] = useState(false);
    const [soortWeergave, setSoortWeergave] = useState('licht');
    const [weekendenWeergeven, setWeekendenWeergeven] = useState(true);
    
    // UI state
    const [isLoading, setIsLoading] = useState(true);
    const [feedback, setFeedback] = useState('');
    const [currentUserId, setCurrentUserId] = useState(null);

    // Load existing user settings on component mount
    useEffect(() => {
        loadUserSettings();
    }, []);

    // Handle save trigger from parent (registration wizard)
    useEffect(() => {
        if (isRegistration && stepSaveTrigger > 0) {
            console.log('Save triggered from registration wizard for SettingsTab');
            // In registration mode, don't auto-complete - let user manually save
            // Settings can be skipped in registration
        }
    }, [stepSaveTrigger]);

    const loadUserSettings = async () => {
        if (!user?.Title) {
            setFeedback('Gebruiker niet gevonden');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setFeedback('');

        try {
            const gebruikersInstellingenConfig = window.appConfiguratie.gebruikersInstellingen;
            
            // Try to find existing settings for this user
            const existingSettings = await getSharePointListItems('gebruikersInstellingen');
            const userSettings = existingSettings.find(setting => setting.Title === user.Title);

            if (userSettings) {
                // Load existing settings
                setCurrentUserId(userSettings.Id);
                setEigenTeamWeergeven(userSettings.EigenTeamWeergeven || false);
                setSoortWeergave(userSettings.soortWeergave || 'licht');
                setWeekendenWeergeven(userSettings.WeekendenWeergeven !== false); // Default to true
                setFeedback('✓ Je instellingen zijn geladen');
            } else {
                // No existing settings, create default entry
                const defaultSettings = {
                    Title: user.Title,
                    EigenTeamWeergeven: false,
                    soortWeergave: 'licht',
                    WeekendenWeergeven: true
                };

                const newItem = await createSharePointListItem('gebruikersInstellingen', defaultSettings);

                if (newItem && newItem.Id) {
                    setCurrentUserId(newItem.Id);
                    setFeedback('✓ Standaard instellingen aangemaakt');
                }
            }
        } catch (error) {
            console.error('Error loading user settings:', error);
            setFeedback('⚠️ Kon instellingen niet laden');
        } finally {
            setIsLoading(false);
        }
    };

    const saveSettingToSharePoint = async (fieldName, value) => {
        if (!currentUserId) {
            console.warn('No user ID available for saving');
            return;
        }

        try {
            const updateData = { [fieldName]: value };

            await updateSharePointListItem('gebruikersInstellingen', currentUserId, updateData);

            setFeedback(`✓ ${getFieldDisplayName(fieldName)} opgeslagen`);
            
            // Clear feedback after 3 seconds
            setTimeout(() => setFeedback(''), 3000);
        } catch (error) {
            console.error('Error saving setting:', error);
            setFeedback(`⚠️ Kon ${getFieldDisplayName(fieldName)} niet opslaan`);
        }
    };

    const getFieldDisplayName = (fieldName) => {
        switch (fieldName) {
            case 'EigenTeamWeergeven': return 'Eigen team weergeven';
            case 'WeekendenWeergeven': return 'Weekenden weergeven';
            case 'soortWeergave': return 'Soort weergave';
            default: return 'instelling';
        }
    };

    const handleEigenTeamToggle = (checked) => {
        setEigenTeamWeergeven(checked);
        saveSettingToSharePoint('EigenTeamWeergeven', checked);
    };

    const handleWeekendenToggle = (checked) => {
        setWeekendenWeergeven(checked);
        saveSettingToSharePoint('WeekendenWeergeven', checked);
    };

    const handleSoortWeergaveChange = (value) => {
        setSoortWeergave(value);
        saveSettingToSharePoint('soortWeergave', value);
    };

    return h('div', null,
        h('div', { className: 'tab-header' },
            // Back to roster button (only in settings mode)
            !isRegistration && h('div', { 
                style: { 
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center'
                }
            },
                h('button', {
                    onClick: () => {
                        const targetUrl = linkInfo.getVerlofRoosterUrl();
                        window.location.href = targetUrl;
                    },
                    className: 'btn btn-secondary',
                    style: {
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        textDecoration: 'none',
                        padding: '8px 16px',
                        fontSize: '14px',
                        border: 'none',
                        cursor: 'pointer'
                    }
                },
                    h('svg', {
                        width: '16',
                        height: '16',
                        fill: 'currentColor',
                        viewBox: '0 0 20 20'
                    },
                        h('path', {
                            fillRule: 'evenodd',
                            d: 'M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z',
                            clipRule: 'evenodd'
                        })
                    ),
                    'Terug naar rooster'
                )
            ),
            h('h2', null, 
                h('svg', { 
                    width: '24', 
                    height: '24', 
                    fill: 'currentColor', 
                    viewBox: '0 0 20 20',
                    style: { marginRight: '0.5rem' }
                }, 
                    h('path', { 
                        fillRule: 'evenodd', 
                        d: 'M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z', 
                        clipRule: 'evenodd' 
                    })
                ),
                'Instellingen'
            ),
            h('p', { className: 'text-muted mb-4' }, 
                isRegistration ? 
                    'Je persoonlijke voorkeuren zijn optioneel en kunnen later worden aangepast.' :
                    'Configureer je persoonlijke voorkeuren voor de roosterweergave.'
            )
        ),

        // Loading state
        isLoading && h('div', { className: 'loading-container' },
            h('div', { className: 'loading-spinner' }),
            h('p', null, 'Instellingen laden...')
        ),

        // Feedback message
        feedback && h('div', { 
            className: `feedback-message ${feedback.includes('⚠️') ? 'feedback-error' : 'feedback-success'}` 
        }, feedback),

        // Settings content (only show when not loading)
        !isLoading && h('div', null,
            // Registration mode info
            isRegistration && h('div', { 
                className: 'card',
                style: { marginBottom: '20px', background: '#f8f9fa', border: '1px solid #dee2e6' }
            },
                h('div', { style: { padding: '15px' } },
                    h('h4', { style: { margin: '0 0 10px 0', color: '#495057' } }, '📋 Optionele configuratie'),
                    h('p', { style: { margin: '0', color: '#6c757d' } }, 
                        'Deze instellingen zijn optioneel tijdens de registratie. ' +
                        'Je wijzigingen worden automatisch opgeslagen en je kunt ze later altijd aanpassen.'
                    )
                )
            ),
            
            // Display Settings Card
            h('div', { className: 'card' },
                h('h3', { className: 'card-title' }, 
                    h('svg', { 
                        width: '20', 
                        height: '20', 
                        fill: 'currentColor', 
                        viewBox: '0 0 20 20',
                        style: { marginRight: '0.5rem' }
                    }, 
                        h('path', { 
                            fillRule: 'evenodd', 
                            d: 'M4 2a2 2 0 00-2 2v11a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z', 
                            clipRule: 'evenodd' 
                        })
                    ),
                    'Weergave-instellingen'
                ),
                h('div', { className: 'settings-section' },
                    // Soort weergave dropdown
                    h('div', { className: 'form-group' },
                        h('label', { className: 'form-label' }, 'Soort weergave'),
                        h('select', {
                            value: soortWeergave,
                            onChange: (e) => handleSoortWeergaveChange(e.target.value),
                            className: 'form-input'
                        },
                            h('option', { value: 'licht' }, 'Lichte modus'),
                            h('option', { value: 'donker' }, 'Donkere modus')
                        ),
                        h('p', { className: 'form-help' }, 'Kies je kleurenschema voor de interface')
                    ),
                    
                    // Boolean toggles
                    h('div', { className: 'setting-toggles' },
                        // Eigen team weergeven
                        h('div', { className: 'setting-item' },
                            h('div', { className: 'setting-content' },
                                h('span', { className: 'setting-text' }, 'Eigen team weergeven'),
                                h('span', { className: 'setting-description' }, 'Toon alleen je eigen teamleden in de roosterweergave')
                            ),
                            h('label', { className: 'toggle-switch' },
                                h('input', {
                                    type: 'checkbox',
                                    checked: eigenTeamWeergeven,
                                    onChange: (e) => handleEigenTeamToggle(e.target.checked)
                                }),
                                h('span', { className: 'slider' })
                            )
                        ),
                        
                        // Weekenden weergeven
                        h('div', { className: 'setting-item' },
                            h('div', { className: 'setting-content' },
                                h('span', { className: 'setting-text' }, 'Weekenden weergeven'),
                                h('span', { className: 'setting-description' }, 'Toon zaterdag en zondag in de kalenderweergave')
                            ),
                            h('label', { className: 'toggle-switch' },
                                h('input', {
                                    type: 'checkbox',
                                    checked: weekendenWeergeven,
                                    onChange: (e) => handleWeekendenToggle(e.target.checked)
                                }),
                                h('span', { className: 'slider' })
                            )
                        )
                    )
                )
            ),

            // Help Information Card
            h('div', { className: 'card' },
                h('h3', { className: 'card-title' }, 
                    h('svg', { 
                        width: '20', 
                        height: '20', 
                        fill: 'currentColor', 
                        viewBox: '0 0 20 20',
                        style: { marginRight: '0.5rem' }
                    }, 
                        h('path', { 
                            fillRule: 'evenodd', 
                            d: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z', 
                            clipRule: 'evenodd' 
                        })
                    ),
                    'Informatie'
                ),
                h('div', { className: 'info-content' },
                    h('p', null, 'Je instellingen worden automatisch opgeslagen wanneer je ze wijzigt.'),
                    h('p', null, 'Deze voorkeuren gelden alleen voor jouw account en hebben geen invloed op andere gebruikers.'),
                    h('ul', null,
                        h('li', null, h('strong', null, 'Soort weergave:'), ' Bepaalt het kleurenschema van de interface'),
                        h('li', null, h('strong', null, 'Eigen team:'), ' Filtert de weergave om alleen je teamleden te tonen'),
                        h('li', null, h('strong', null, 'Weekenden:'), ' Bepaalt of weekend dagen zichtbaar zijn in de kalender')
                    )
                )
            )
        )
    );
};