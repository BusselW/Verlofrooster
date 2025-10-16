import { beheerTabs } from './dataTabs.js';
import { getListItems, createListItem, updateListItem, deleteListItem } from './dataService.js';
import { initializeSharePointContext } from './sharepointContext.js';
import { Modal } from './ui/modal.js';
import { getFormComponent } from './forms/index.js';
import * as linkInfo from '../../../js/services/linkInfo.js';

const { useState, useEffect, createElement: h, useCallback } = React;

// Global variable to store teams data for color mapping
let teamsColorMap = new Map();

// Initialize teams color mapping
const initializeTeamsColorMap = async () => {
    try {
        if (window.appConfiguratie && window.appConfiguratie.Teams) {
            const teamsData = await getListItems('Teams');
            teamsColorMap.clear();
            teamsData.forEach(team => {
                if (team.Naam && team.Kleur) {
                    teamsColorMap.set(team.Naam, team.Kleur);
                }
            });
        }
    } catch (error) {
        console.warn('Could not initialize teams color map:', error);
    }
};

// --- Components ---

const PageBanner = () => {
    return h('div', { id: 'page-banner', className: 'page-banner' },
        h('div', { className: 'banner-content' },
            h('div', { className: 'banner-left' },
                h('h1', { className: 'banner-title' }, 'Verlofrooster Beheercentrum'),
                h('p', { className: 'banner-subtitle' }, 'Beheer medewerkers, teams, verlofredenen en andere kerngegevens')
            ),
            h('div', { className: 'banner-right' },
                h('button', { 
                    onClick: () => {
                        const targetUrl = linkInfo.getVerlofRoosterUrl();
                        window.location.href = targetUrl;
                    },
                    className: 'btn-back',
                    style: { border: 'none', cursor: 'pointer' }
                },
                    h('svg', { className: 'icon-small', fill: 'currentColor', viewBox: '0 0 20 20', width: '16', height: '16' },
                        h('path', { 'fillRule': 'evenodd', d: 'M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z', 'clipRule': 'evenodd' })
                    ),
                    h('span', null, 'Terug naar rooster')
                ),
                h('div', { className: 'user-details' },
                    h('div', { className: 'user-info' }, 'Bussel, W. van'), // Hardcoded for now
                    h('div', { className: 'connection-status' }, 'Verbonden met: https://som.org.om')
                )
            )
        )
    );
};

// Function to auto-generate columns from config fields
const generateColumnsFromConfig = (listConfig) => {
    if (!listConfig || !listConfig.velden) return [];
    
    // Define fields to hide for specific lists
    const hiddenFields = {
        'Medewerkers': ['HalveDagType', 'HalveDagWeekdag', 'UrenPerWeek', 'Werkdagen', 'Werkschema']
    };
    
    const fieldsToHide = hiddenFields[listConfig.lijstTitel] || [];
    
    const columns = listConfig.velden
        .filter(field => 
            field.interneNaam !== 'ID' && 
            field.interneNaam !== 'Title' && 
            !fieldsToHide.includes(field.interneNaam)
        ) // Skip system fields and hidden fields
        .map(field => {
            let columnType = 'text';
            
            // Map SharePoint field types to our display types
            switch (field.type) {
                case 'DateTime':
                    columnType = field.interneNaam.toLowerCase().includes('tijdstip') ? 'datetime' : 'date';
                    break;
                case 'Boolean':
                    columnType = 'boolean';
                    break;
                case 'Number':
                    columnType = 'number';
                    break;
                case 'Text':
                    // Check if it's a color field
                    if (field.interneNaam.toLowerCase().includes('kleur')) {
                        columnType = 'color';
                    }
                    break;
                case 'Note':
                    columnType = 'text';
                    break;
            }
            
            return {
                Header: field.titel,
                accessor: field.interneNaam,
                type: columnType
            };
        });
    
    // Add actions column at the end
    columns.push({ Header: 'Acties', accessor: 'actions', isAction: true });
    
    return columns;
};

// Utility function to format dates
const formatValue = (value, column) => {
    // Handle boolean values first (before checking for !value)
    if (typeof value === 'boolean' || column.type === 'boolean' || 
        (value !== null && value !== undefined && typeof value === 'string' && 
         ['true', 'false', 'ja', 'nee', 'yes', 'no', '1', '0', 'actief', 'inactief'].includes(value.toLowerCase()))) {
        
        // Enhanced boolean value detection to handle various formats
        let boolValue = false;
        
        if (typeof value === 'boolean') {
            boolValue = value;
        } else if (value === null || value === undefined) {
            boolValue = false; // Default to false for null/undefined
        } else if (typeof value === 'string') {
            const lowerValue = value.toLowerCase();
            boolValue = lowerValue === 'true' || lowerValue === 'ja' || lowerValue === 'yes' || lowerValue === '1' || lowerValue === 'actief';
        } else if (typeof value === 'number') {
            boolValue = value === 1;
        }
        
        return h('div', { 
            className: 'boolean-display', 
            style: { display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' } 
        },
            h('label', { className: 'toggle-switch' },
                h('input', { 
                    type: 'checkbox', 
                    checked: boolValue,
                    disabled: true,
                    'aria-label': boolValue ? 'Ingeschakeld' : 'Uitgeschakeld'
                }),
                h('span', { className: 'toggle-slider' })
            ),
            h('span', { 
                className: `status-indicator ${boolValue ? 'status-active' : 'status-inactive'}`,
                style: { 
                    fontSize: '12px', 
                    fontWeight: '500',
                    color: boolValue ? 'var(--success-700)' : 'var(--neutral-600)'
                }
            },
                h('span', { className: 'status-dot' }),
                boolValue ? 'Actief' : 'Inactief'
            )
        );
    }
    
    // Handle empty/null values for non-boolean fields
    if (!value && column.type !== 'boolean') return '';
    
    // Handle date formatting
    if (column.type === 'date' || column.accessor.toLowerCase().includes('datum') || column.accessor.toLowerCase().includes('date')) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('nl-NL', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit' 
            });
        }
    }
    
    // Handle datetime formatting
    if (column.type === 'datetime' || column.accessor.toLowerCase().includes('tijdstip')) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('nl-NL', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
    
    // Handle time formatting for time fields
    if (column.type === 'time' || column.accessor.toLowerCase().includes('start') || column.accessor.toLowerCase().includes('eind')) {
        // If it's just a time string like "09:00"
        if (typeof value === 'string' && /^\d{1,2}:\d{2}$/.test(value)) {
            return value;
        }
        // If it's a datetime, extract just the time
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date.toLocaleTimeString('nl-NL', { 
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
    
    // Handle color values with enhanced color picker integration
    if (column.type === 'color' || column.accessor.toLowerCase().includes('kleur')) {
        if (!value) return h('span', { className: 'tag' }, 'Geen kleur');
        
        // Ensure the value starts with # for hex colors
        const colorValue = value.startsWith('#') ? value : `#${value}`;
        
        return h('div', { className: 'color-display' },
            h('div', { className: 'color-picker-container' },
                h('span', { 
                    className: 'color-swatch large', 
                    style: { 
                        backgroundColor: colorValue,
                        cursor: 'pointer'
                    },
                    title: `Kleur: ${colorValue.toUpperCase()}`,
                    'aria-label': `Kleurwaarde ${colorValue.toUpperCase()}`
                })
            ),
            h('span', { className: 'color-value' }, colorValue.toUpperCase())
        );
    }
    
    // Handle long text values - truncate but show full text in title
    if (typeof value === 'string' && value.length > 50) {
        return h('span', { 
            title: value,
            style: { cursor: 'help' },
            className: 'truncated-text'
        }, value.substring(0, 47) + '...');
    }
    
    // Handle domain\username fields with tag styling
    if (column.accessor.toLowerCase() === 'username' || 
        (typeof value === 'string' && value.includes('\\') && value.match(/^[a-zA-Z0-9.-]+\\[a-zA-Z0-9._-]+$/))) {
        if (!value) return h('span', { className: 'tag tag-error' }, 'Geen gebruiker');
        
        const parts = value.split('\\');
        if (parts.length === 2) {
            const [domain, username] = parts;
            return h('div', { className: 'username-display', style: { display: 'flex', alignItems: 'center', gap: '6px' } },
                h('span', { className: 'tag tag-info domain-tag' }, domain),
                h('span', { className: 'username-separator' }, '\\'),
                h('span', { className: 'tag tag-primary username-tag' }, username)
            );
        } else {
            // Fallback for malformed usernames
            return h('span', { className: 'tag tag-warning' }, value);
        }
    }
    
    // Handle functie (function/role) fields with metal-tier colored tags
    if (column.accessor.toLowerCase().includes('functie') || 
        column.Header.toLowerCase().includes('functie') ||
        column.accessor === 'Functie' || column.accessor === 'Rol') {
        if (!value) return h('span', { className: 'tag tag-neutral' }, 'Geen functie');
        
        // Determine color based on function hierarchy or keywords
        let functieClass = 'tag tag-functie';
        const lowerValue = value.toString().toLowerCase();
        
        // Gold tier - Leadership/Management roles
        if (lowerValue.includes('directeur') || lowerValue.includes('manager') || 
            lowerValue.includes('hoofd') || lowerValue.includes('leider') ||
            lowerValue.includes('lead') || lowerValue.includes('chef')) {
            functieClass += ' tag-functie-gold';
        }
        // Silver tier - Senior/Specialist roles  
        else if (lowerValue.includes('senior') || lowerValue.includes('specialist') ||
                 lowerValue.includes('expert') || lowerValue.includes('architect') ||
                 lowerValue.includes('coördinator') || lowerValue.includes('coordinator')) {
            functieClass += ' tag-functie-silver';
        }
        // Bronze tier - Standard professional roles
        else if (lowerValue.includes('medewerker') || lowerValue.includes('adviseur') ||
                 lowerValue.includes('consultant') || lowerValue.includes('analist') ||
                 lowerValue.includes('developer') || lowerValue.includes('engineer')) {
            functieClass += ' tag-functie-bronze';
        }
        // Copper tier - Junior/Support roles
        else if (lowerValue.includes('junior') || lowerValue.includes('trainee') ||
                 lowerValue.includes('stagiair') || lowerValue.includes('assistent') ||
                 lowerValue.includes('support') || lowerValue.includes('helpdesk')) {
            functieClass += ' tag-functie-copper';
        }
        // Default to bronze for unclassified functions
        else {
            functieClass += ' tag-functie-bronze';
        }
        
        return h('span', { 
            className: functieClass,
            title: `Functie: ${value}`
        }, value);
    }
    
    // Handle team fields with colored tags based on Teams.Kleur
    if (column.accessor.toLowerCase().includes('team') || 
        column.Header.toLowerCase().includes('team') ||
        column.accessor === 'Team' || column.accessor === 'TeamNaam') {
        if (!value) return h('span', { className: 'tag tag-neutral' }, 'Geen team');
        
        // Get the team color from the teams color map
        const teamColor = teamsColorMap.get(value);
        
        if (teamColor) {
            // Ensure the color starts with # for hex colors
            const colorValue = teamColor.startsWith('#') ? teamColor : `#${teamColor}`;
            
            return h('span', { 
                className: 'tag tag-team',
                style: {
                    backgroundColor: `${colorValue}20`, // 20% opacity for background
                    color: colorValue,
                    borderColor: `${colorValue}40`, // 40% opacity for border
                    fontWeight: '600'
                },
                title: `Team: ${value} (${colorValue})`
            }, value);
        } else {
            // Fallback if no color is found
            return h('span', { className: 'tag tag-primary' }, value);
        }
    }
    
    // Handle status-like fields with tags
    if (column.accessor.toLowerCase().includes('status') || 
        column.accessor.toLowerCase().includes('type') ||
        column.accessor.toLowerCase().includes('categorie')) {
        if (!value) return h('span', { className: 'tag' }, 'Onbekend');
        
        let tagClass = 'tag';
        const lowerValue = value.toString().toLowerCase();
        
        if (lowerValue.includes('actief') || lowerValue.includes('goedgekeurd') || lowerValue.includes('success')) {
            tagClass += ' tag-success';
        } else if (lowerValue.includes('inactief') || lowerValue.includes('afgekeurd') || lowerValue.includes('error')) {
            tagClass += ' tag-error';
        } else if (lowerValue.includes('pending') || lowerValue.includes('wachten') || lowerValue.includes('warning')) {
            tagClass += ' tag-warning';
        } else if (lowerValue.includes('info') || lowerValue.includes('review')) {
            tagClass += ' tag-info';
        } else {
            tagClass += ' tag-primary';
        }
        
        return h('span', { className: tagClass }, value);
    }
    
    // Handle email fields with mailto links
    if (column.type === 'email' || 
        column.accessor.toLowerCase().includes('mail') || 
        column.accessor.toLowerCase().includes('email') ||
        column.accessor === 'E_x002d_mail') {
        if (!value) return h('span', { className: 'tag tag-neutral' }, 'Geen email');
        
        // Validate email format (basic check)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return h('span', { className: 'tag tag-warning', title: 'Ongeldig email formaat' }, value);
        }
        
        return h('a', {
            href: `mailto:${value}`,
            className: 'email-link',
            style: {
                color: 'var(--primary-600)',
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'all var(--transition-fast)',
                borderRadius: 'var(--radius-sm)',
                padding: '2px 4px',
                display: 'inline-block'
            },
            onMouseEnter: (e) => {
                e.target.style.backgroundColor = 'var(--primary-50)';
                e.target.style.textDecoration = 'underline';
            },
            onMouseLeave: (e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.textDecoration = 'none';
            },
            title: `Email versturen naar ${value}`
        }, value);
    }
    
    // Handle ID fields with monospace font
    if (column.accessor.toLowerCase().includes('id') || column.accessor.toLowerCase().includes('guid')) {
        return h('code', { 
            className: 'id-field',
            style: {
                fontSize: '12px',
                padding: '2px 4px',
                backgroundColor: 'var(--color-bg-surface-secondary)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-default)'
            }
        }, value);
    }

    return value;
};

const DataTable = ({ columns, data, onEdit, onDelete, listConfig }) => {
    // Filter out any undefined or empty rows
    const filteredData = data.filter(row => row && Object.keys(row).length > 0);
    
    // Use auto-generated columns if no columns provided or if we want to show all data
    const displayColumns = columns && columns.length > 0 ? columns : generateColumnsFromConfig(listConfig);
    
    return h('div', { className: 'table-container', style: { 
        maxHeight: '70vh', 
        overflow: 'auto',
        border: '1px solid #ddd',
        borderRadius: '4px'
    }},
        h('table', { className: 'data-table', style: { minWidth: '100%' } },
            h('thead',
                { style: { position: 'sticky', top: 0, backgroundColor: '#f8f9fa', zIndex: 1 } },
                h('tr', null, displayColumns.map(col => h('th', { 
                    key: col.accessor,
                    style: { 
                        padding: '12px 8px',
                        borderBottom: '2px solid #dee2e6',
                        whiteSpace: 'nowrap',
                        minWidth: col.isAction ? '120px' : '150px'
                    }
                }, col.Header)))
            ),
            h('tbody',
                null,
                filteredData.length === 0 ? 
                    h('tr', null, h('td', { 
                        colSpan: displayColumns.length, 
                        style: { textAlign: 'center', padding: '40px' } 
                    }, 'Geen data beschikbaar')) :
                    filteredData.map((row, index) => h('tr', { 
                        key: row.Id || index,
                        style: { 
                            borderBottom: '1px solid #dee2e6',
                            '&:hover': { backgroundColor: '#f8f9fa' }
                        }
                    },
                        displayColumns.map(col => {
                            if (col.isAction) {
                                // Render action buttons
                                return h('td', { 
                                    key: col.accessor, 
                                    className: 'actions-cell',
                                    style: { padding: '8px', whiteSpace: 'nowrap' }
                                },
                                    h('div', { className: 'action-buttons' },
                                        h('button', { 
                                            className: 'btn-action btn-edit',
                                            onClick: () => onEdit && onEdit(row),
                                            title: 'Bewerken'
                                        }, 
                                            h('svg', { width: '16', height: '16', fill: 'currentColor', viewBox: '0 0 20 20' },
                                                h('path', { d: 'M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z' })
                                            )
                                        ),
                                        h('button', { 
                                            className: 'btn-action btn-delete',
                                            onClick: () => onDelete && onDelete(row),
                                            title: 'Verwijderen'
                                        }, 
                                            h('svg', { width: '16', height: '16', fill: 'currentColor', viewBox: '0 0 20 20' },
                                                h('path', { fillRule: 'evenodd', d: 'M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 102 0v3a1 1 0 11-2 0V9zm4 0a1 1 0 10-2 0v3a1 1 0 102 0V9z', clipRule: 'evenodd' })
                                            )
                                        )
                                    )
                                );
                            } else {
                                // Render data cell with proper formatting
                                const value = row[col.accessor];
                                const formattedValue = formatValue(value, col);
                                return h('td', { 
                                    key: col.accessor,
                                    style: { 
                                        padding: '8px',
                                        verticalAlign: 'top',
                                        maxWidth: '200px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    },
                                    title: typeof value === 'string' && value.length > 30 ? value : undefined
                                }, formattedValue);
                            }
                        })
                    ))
            )
        )
    );
};

const TabContent = ({ tab, data, loading, error, onAddNew, onEdit, onDelete, showAllColumns, onToggleColumns }) => {
    if (loading) {
        return h('div', { className: 'loading-spinner' }, 'Laden...');
    }

    if (error) {
        return h('div', { className: 'error-message' }, `Fout bij laden: ${error.message}`);
    }

    const totalColumns = tab.listConfig ? tab.listConfig.velden.length - 2 : 0; // -2 for ID and Title
    const displayedColumns = showAllColumns ? totalColumns : (tab.columns ? tab.columns.length - 1 : 0); // -1 for actions

    return h('div', { className: 'tab-content active' },
        h('div', { className: 'tab-actions', style: { 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
        }},
            h('button', { 
                className: 'btn-primary btn-with-icon',
                onClick: onAddNew,
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    padding: '12px 20px'
                }
            }, 
                h('svg', { 
                    className: 'icon icon-add', 
                    width: '16', 
                    height: '16', 
                    fill: 'currentColor', 
                    viewBox: '0 0 20 20' 
                },
                    h('path', { 
                        fillRule: 'evenodd', 
                        d: 'M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z',
                        clipRule: 'evenodd' 
                    })
                ),
                `Nieuwe ${tab.label.slice(0, -1)} toevoegen`
            ),
            h('div', { style: { display: 'flex', gap: '15px', alignItems: 'center' } },
                h('span', { 
                    style: { 
                        fontSize: '13px', 
                        color: '#6b7280',
                        fontWeight: 'normal'
                    } 
                }, `Kolommen: ${displayedColumns}/${totalColumns}`),
                h('div', { className: 'column-toggle-container', style: { display: 'flex', alignItems: 'center', gap: '12px' } },
                    h('span', { style: { fontSize: '14px', fontWeight: '500', color: 'var(--color-text-secondary)' } }, 'Kolommen:'),
                    h('div', { className: 'toggle-group', style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                        h('span', { 
                            style: { 
                                fontSize: '12px', 
                                color: showAllColumns ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
                                fontWeight: showAllColumns ? '400' : '600',
                                transition: 'all var(--transition-fast)'
                            } 
                        }, 'Basis'),
                        h('label', { className: 'toggle-switch', style: { margin: '0' } },
                            h('input', { 
                                type: 'checkbox',
                                checked: showAllColumns,
                                onChange: onToggleColumns,
                                'aria-label': showAllColumns ? 'Schakel over naar basis kolommen' : 'Toon alle kolommen'
                            }),
                            h('span', { className: 'toggle-slider' })
                        ),
                        h('span', { 
                            style: { 
                                fontSize: '12px', 
                                color: showAllColumns ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                                fontWeight: showAllColumns ? '600' : '400',
                                transition: 'all var(--transition-fast)'
                            } 
                        }, 'Alle')
                    )
                )
            )
        ),
        h(DataTable, { 
            columns: showAllColumns ? null : tab.columns, // null = auto-generate all
            data,
            listConfig: tab.listConfig,
            onEdit,
            onDelete
        })
    );
};

const ContentContainer = () => {
    const [activeTabId, setActiveTabId] = useState(beheerTabs[0].id);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [contextInitialized, setContextInitialized] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [showAllColumns, setShowAllColumns] = useState(true); // Default to showing all columns

    const activeTab = beheerTabs.find(tab => tab.id === activeTabId);

    useEffect(() => {
        const initContext = async () => {
            try {
                await initializeSharePointContext();
                // Initialize teams color mapping after SharePoint context is ready
                await initializeTeamsColorMap();
                setContextInitialized(true);
            } catch (err) {
                console.error("Failed to initialize SharePoint context:", err);
                setError(err);
            }
        };
        initContext();
    }, []); // Empty dependency array ensures this runs only once

    const fetchData = useCallback(async () => {
        if (!activeTab || !contextInitialized) return;

        setLoading(true);
        setError(null);
        try {
            const listName = activeTab.listConfig.lijstTitel;
            // Fetch all fields defined in the config
            const selectFields = activeTab.listConfig.velden.map(f => f.interneNaam).join(',');
            const items = await getListItems(listName, selectFields);
            setData(items);
        } catch (err) {
            setError(err);
            console.error(`Fout bij ophalen van data voor ${activeTab.label}:`, err);
        }
        setLoading(false);
    }, [activeTab, contextInitialized]);

    useEffect(() => {
        fetchData();
    }, [activeTabId, contextInitialized, fetchData]);

    const handleAddNew = () => {
        setEditingItem(null); // Clear any previous editing state
        setIsModalOpen(true);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (item) => {
        if (confirm(`Weet je zeker dat je dit item wilt verwijderen?`)) {
            try {
                const listName = activeTab.listConfig.lijstTitel;
                await deleteListItem(listName, item.Id);
                fetchData(); // Refresh data after deletion
            } catch (err) {
                console.error('Fout bij verwijderen van item:', err);
                alert('Er is een fout opgetreden bij het verwijderen van het item.');
            }
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        // Remove modal-open class from body
        document.body.classList.remove('modal-open');
    };

    const handleSave = async (formData) => {
        try {
            const listName = activeTab.listConfig.lijstTitel;
            if (editingItem) {
                // Update existing item
                await updateListItem(listName, editingItem.Id, formData);
            } else {
                // Create new item
                await createListItem(listName, formData);
            }
            handleCloseModal();
            fetchData(); // Refresh data after saving
        } catch (err) {
            console.error('Fout bij opslaan van item:', err);
            // Optionally, show an error message to the user in the form
        }
    };

    // Add modal-open class when modal opens
    React.useEffect(() => {
        if (isModalOpen) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        
        // Cleanup on unmount
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [isModalOpen]);

    return h('div', { className: 'content-container' },
        h('nav', { className: 'tab-navigation' },
            beheerTabs.map(tab => h('button', {
                key: tab.id,
                className: `tab-button ${tab.id === activeTabId ? 'active' : ''}`,
                onClick: () => setActiveTabId(tab.id)
            }, tab.label))
        ),
        activeTab && h(TabContent, { 
            tab: activeTab, 
            data, 
            loading, 
            error, 
            onAddNew: handleAddNew,
            onEdit: handleEdit,
            onDelete: handleDelete,
            showAllColumns,
            onToggleColumns: () => setShowAllColumns(!showAllColumns)
        }),
        h(Modal, { isOpen: isModalOpen, onClose: handleCloseModal },
            activeTab && (() => {
                const FormComponent = getFormComponent(activeTab.id);
                return h(FormComponent, {
                    onSave: handleSave,
                    onCancel: handleCloseModal,
                    initialData: editingItem || {},
                    formFields: activeTab.formFields || [], // For GenericForm fallback
                    title: editingItem ? 
                        `${activeTab.label.slice(0, -1)} Bewerken` : 
                        `Nieuwe ${activeTab.label.slice(0, -1)} Toevoegen`,
                    tabType: activeTab.id
                });
            })()
        )
    );
};

const PageFooter = () => {
    return h('footer', { className: 'page-footer', id: 'pagina-footer' },
        h('p', { className: 'footer-text' }, '© 2025 Verlofrooster Applicatie')
    );
};

// --- Main App Component ---

const BeheercentrumApp = () => {
    return h('div', { id: 'app-container', className: 'app-container' },
        h(PageBanner),
        h(ContentContainer),
        h(PageFooter)
    );
};

// --- Render the App ---

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(h(BeheercentrumApp));