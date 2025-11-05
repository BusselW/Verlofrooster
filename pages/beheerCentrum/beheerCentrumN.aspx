<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verlofrooster - Beheercentrum</title>
    <link rel="icon" type="image/svg+xml" href="../../icons/favicon/favicon.svg">
   
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    
    <!-- Main Verlofrooster CSS (includes working modal styles) -->
    <link rel="stylesheet" href="../../css/verlofrooster_s.css">
    <link rel="stylesheet" href="../../css/verlofrooster_s1.css">
    
    <!-- Beheercentrum-specific styling -->
    <link rel="stylesheet" href="css/beheerCentrum.css">
   
    <!-- SharePoint Config -->
    <script src="../../js/config/configLijst.js"></script>
    <script src="../../js/config/configLayout.js"></script>
   
    <!-- React Scripts -->
    <script src="https://som.org.om.local/sites/MulderT/SBeheer/CPW/L/react.development.js"></script>
    <script src="https://som.org.om.local/sites/MulderT/SBeheer/CPW/L/react-dom.development.js"></script>

    <style>
        /* Full-width layout overrides */
        body {
            margin: 0;
            padding: 0;
            height: 100vh;
            overflow: hidden;
        }

        /* Full-width container */
        .full-width-container {
            width: 100vw;
            height: 100vh;
            background-color: var(--bg-primary);
            display: flex;
            flex-direction: column;
        }

        /* Custom floating header for full-width */
        .beheer-header {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 85%, #c2410c 100%);
            color: var(--bg-secondary);
            padding: 0.75rem 1.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            z-index: 1000;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .beheer-header-left {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .beheer-header-right {
            display: flex;
            align-items: center;
            gap: 1rem;
            font-size: 0.875rem;
        }

        /* Main content area */
        .beheer-main-content {
            margin-top: 3.5rem;
            height: calc(100vh - 3.5rem);
            padding: 1.5rem;
            background-color: var(--bg-secondary);
            overflow-y: auto;
        }

        /* Custom tabs styling for full-width */
        .beheer-tabs-container {
            height: 100%;
            display: flex;
            flex-direction: column;
        }

        .beheer-tabs {
            display: flex;
            gap: 0;
            border-bottom: 1px solid var(--border);
            background-color: var(--bg-primary);
            padding: 0 1rem;
            margin: -1.5rem -1.5rem 1.5rem -1.5rem;
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
        }

        .beheer-tabs::-webkit-scrollbar {
            display: none;
        }

        .beheer-tab {
            padding: 1rem 1.5rem;
            cursor: pointer;
            font-weight: 600;
            color: var(--text-secondary);
            border-bottom: 3px solid transparent;
            transition: all 0.2s var(--ease-in-out-quad);
            background: none;
            border-top: none;
            border-left: none;
            border-right: none;
            font-size: 0.875rem;
            white-space: nowrap;
            min-width: fit-content;
        }

        .beheer-tab:hover {
            color: var(--text-primary);
            background-color: rgba(255, 255, 255, 0.5);
        }

        .beheer-tab.beheer-tab-active {
            color: var(--text-primary);
            border-bottom-color: var(--accent);
            background-color: var(--bg-secondary);
        }

        .beheer-tab-panel {
            display: none;
            flex: 1;
            overflow-y: auto;
            padding: 1rem 0;
        }

        .beheer-tab-panel.beheer-tab-active {
            display: block;
        }

        /* Data table styling using configLayout system */
        .table-container {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 0.75rem;
            overflow: hidden;
            box-shadow: var(--shadow);
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
        }

        .data-table th {
            background-color: var(--bg-primary);
            color: var(--text-primary);
            font-weight: 600;
            text-align: left;
            padding: 1rem 0.75rem;
            border-bottom: 2px solid var(--border);
            font-size: 0.875rem;
        }

        .data-table td {
            padding: 0.75rem;
            border-bottom: 1px solid var(--border);
            font-size: 0.875rem;
        }

        .data-table tbody tr:hover {
            background-color: var(--bg-primary);
        }

        /* Action buttons using configLayout system */
        .action-buttons {
            display: flex;
            gap: 0.5rem;
        }

        .btn-action {
            padding: 0.5rem;
            border: none;
            border-radius: 0.375rem;
            cursor: pointer;
            transition: all 0.2s var(--ease-in-out-quad);
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }

        .btn-edit {
            background-color: var(--accent);
            color: white;
        }

        .btn-edit:hover {
            background-color: var(--accent-hover);
        }

        .btn-delete {
            background-color: var(--danger);
            color: white;
        }

        .btn-delete:hover {
            background-color: var(--danger-hover);
        }

        /* Loading and error states */
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f4f6;
            border-top: 4px solid var(--accent, #FF6D22);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
       
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* Status indicators */
        .status-indicator {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.75rem;
            font-weight: 600;
        }

        .status-online {
            background-color: rgba(22, 163, 74, 0.1);
            color: var(--success);
        }

        /* Enhanced color and status displays */
        .color-display {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .color-box {
            position: relative;
            flex-shrink: 0;
            transition: transform 0.2s ease;
        }

        .color-box:hover {
            transform: scale(1.1);
        }

        .color-hex {
            user-select: all;
            cursor: pointer;
        }

        .color-hex:hover {
            background-color: rgba(0, 0, 0, 0.05);
            padding: 0.125rem 0.25rem;
            border-radius: 0.25rem;
        }

        /* Tag styles for usernames and other identifiers */
        .tag {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.75rem;
            font-weight: 600;
            white-space: nowrap;
        }

        .tag-neutral {
            background-color: rgba(107, 114, 128, 0.1);
            color: rgb(107, 114, 128);
            border: 1px solid rgba(107, 114, 128, 0.2);
        }

        .tag-user {
            background-color: rgba(99, 102, 241, 0.1);
            color: rgb(99, 102, 241);
            border: 1px solid rgba(99, 102, 241, 0.2);
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        }

        /* Status badges with proper color coding */
        .status-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.75rem;
            font-weight: 600;
            white-space: nowrap;
            transition: all 0.2s ease;
        }

        .status-success {
            background-color: rgba(34, 197, 94, 0.1);
            color: rgb(34, 197, 94);
            border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .status-warning {
            background-color: rgba(251, 146, 60, 0.1);
            color: rgb(251, 146, 60);
            border: 1px solid rgba(251, 146, 60, 0.2);
        }

        .status-danger {
            background-color: rgba(239, 68, 68, 0.1);
            color: rgb(239, 68, 68);
            border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .status-neutral {
            background-color: rgba(107, 114, 128, 0.1);
            color: rgb(107, 114, 128);
            border: 1px solid rgba(107, 114, 128, 0.2);
        }

        /* Date and time displays */
        .datetime-display {
            min-width: 120px;
        }

        .date-display {
            font-variant-numeric: tabular-nums;
        }

        /* Email links */
        .email-link {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            text-decoration: none;
            color: var(--accent, #FF6D22);
            font-weight: 500;
            padding: 0.25rem 0.5rem;
            border-radius: 0.375rem;
            transition: all 0.2s ease;
        }

        .email-link:hover {
            background-color: rgba(255, 109, 34, 0.1);
            text-decoration: underline;
        }

        /* Empty value styling */
        .empty-value {
            color: var(--text-secondary, #9CA3AF);
            font-style: italic;
            font-size: 0.875rem;
        }

        /* Table cell improvements */
        .data-table td {
            vertical-align: middle;
            max-width: 200px;
            overflow: hidden;
        }

        .data-table td[title] {
            cursor: help;
        }

        /* Boolean toggle improvements */
        .boolean-display {
            min-width: 140px;
            justify-content: flex-start;
        }

        /* Toggle switch styling */
        .toggle-switch {
            position: relative;
            display: inline-block;
            width: 44px;
            height: 24px;
            margin: 0;
        }
        .btn-primary {
            background-color: var(--accent);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s var(--ease-in-out-quad);
        }

        .btn-primary:hover {
            background-color: var(--accent-hover);
        }

        .btn-secondary {
            background-color: var(--text-secondary);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s var(--ease-in-out-quad);
        }

        .btn-secondary:hover {
            opacity: 0.9;
        }

        /* Tab actions bar */
        .tab-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            padding: 1rem;
            background-color: var(--bg-primary);
            border-radius: 0.5rem;
            border: 1px solid var(--border);
        }

        /* Toggle switch styling */
        .toggle-switch {
            position: relative;
            display: inline-block;
            width: 44px;
            height: 24px;
            margin: 0;
        }

        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: var(--border);
            transition: 0.2s;
            border-radius: 24px;
        }

        .toggle-slider:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: 0.2s;
            border-radius: 50%;
        }

        input:checked + .toggle-slider {
            background-color: var(--accent);
        }

        input:checked + .toggle-slider:before {
            transform: translateX(20px);
        }

        /* Responsive design */
        @media (max-width: 768px) {
            .beheer-header {
                padding: 0.5rem 1rem;
            }
           
            .beheer-main-content {
                padding: 1rem;
            }
           
            .table-container {
                overflow-x: auto;
            }
           
            .data-table {
                min-width: 800px;
            }
        }
    </style>
</head>
<body class="light-theme">
    <div id="root"></div>

    <!-- Main App Script with updated imports -->
    <script type="module">
        console.log('🚀 Beheercentrum (Full-Width) starting execution...');
       
        // Make React available to imported ES6 modules
        window.React = React;
       
        // Import all existing functionality
        import { beheerTabs } from './js/dataTabs.js';
        import { getListItems, createListItem, updateListItem, deleteListItem } from './js/dataService.js';
        import { initializeSharePointContext } from './js/sharepointContext.js';
        import { Modal } from './js/ui/modal.js';
        import { getFormComponent } from './js/forms/index.js';
        import * as linkInfo from '../../js/services/linkInfo.js';
        import { isUserInAnyGroup } from '../../js/services/permissionService.js';
        import { getCurrentUserInfo } from '../../js/services/sharepointService.js';

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

        // Keep all existing formatValue and utility functions...
        const generateColumnsFromConfig = (listConfig) => {
            if (!listConfig || !listConfig.velden) return [];
           
            const hiddenFields = {
                'Medewerkers': ['HalveDagType', 'HalveDagWeekdag', 'UrenPerWeek', 'Werkdagen', 'Werkschema']
            };
           
            const fieldsToHide = hiddenFields[listConfig.lijstTitel] || [];
           
            const columns = listConfig.velden
                .filter(field =>
                    field.interneNaam !== 'ID' &&
                    field.interneNaam !== 'Title' &&
                    !fieldsToHide.includes(field.interneNaam)
                )
                .map(field => {
                    let columnType = 'text';
                   
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
           
            columns.push({ Header: 'Acties', accessor: 'actions', isAction: true });
            return columns;
        };

        // Enhanced formatValue function with all requested improvements
        const formatValue = (value, column, row, onToggle) => {
            // Handle null/undefined values
            if (value === null || value === undefined || value === '') {
                if (column.type === 'boolean') {
                    return createBooleanToggle(false, row, column.accessor, onToggle);
                }
                return h('span', { className: 'empty-value', style: { color: 'var(--text-secondary)', fontStyle: 'italic' } }, '(leeg)');
            }

            // a. Color fields - show hex value with color box
            if (column.type === 'color' || column.accessor.toLowerCase().includes('kleur')) {
                return createColorDisplay(value);
            }

            // b. Username/ID fields - display as subtle tags
            if (isUsernameField(column.accessor)) {
                return createUsernameTag(value);
            }

            // c. Boolean values - handled with sliders
            if (column.type === 'boolean' || isBooleanValue(value)) {
                return createBooleanToggle(value, row, column.accessor, onToggle);
            }

            // d. Date+time values - human readable format
            if (column.type === 'datetime' || isDateTimeField(column.accessor)) {
                return createDateTimeDisplay(value);
            }

            // e. Date values (no time) - dd-mm-yyyy format
            if (column.type === 'date' || isDateField(column.accessor)) {
                return createDateDisplay(value);
            }

            // f. Status columns - green/orange/red based on content
            if (column.accessor.toLowerCase().includes('status')) {
                return createStatusDisplay(value);
            }

            // g. Email columns - clickable mailto links
            if (column.type === 'email' || isEmailField(column.accessor)) {
                return createEmailLink(value);
            }

            // Default text display
            return createTextDisplay(value);
        };

        // Helper function to create color display with hex value box
        const createColorDisplay = (colorValue) => {
            if (!colorValue || colorValue === null || colorValue === undefined) return h('span', { className: 'empty-value', style: { color: 'var(--text-secondary)', fontStyle: 'italic' } }, '(leeg)');
           
            const normalizedColor = colorValue.startsWith('#') ? colorValue : `#${colorValue}`;
           
            return h('div', {
                className: 'color-display',
                style: { display: 'flex', alignItems: 'center', gap: '0.5rem' }
            },
                h('span', {
                    className: 'color-box',
                    style: {
                        backgroundColor: normalizedColor,
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        border: '2px solid var(--border)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        flexShrink: 0
                    }
                }),
                h('code', {
                    className: 'color-hex',
                    style: {
                        fontSize: '0.875rem',
                        fontFamily: 'monospace',
                        fontWeight: '600',
                        color: 'var(--text-primary)'
                    }
                }, normalizedColor.toUpperCase())
            );
        };

        // Helper function to check if field is a username field
        const isUsernameField = (accessor) => {
            const usernameFields = ['username', 'gebruikersnaam', 'teamleiderid', 'medewerkerid'];
            return usernameFields.some(field => accessor.toLowerCase().includes(field));
        };

        // Helper function to create username tag
        const createUsernameTag = (username) => {
            if (!username || username === null || username === undefined) return h('span', { className: 'empty-value', style: { color: 'var(--text-secondary)', fontStyle: 'italic' } }, '(leeg)');
           
            return h('span', {
                className: 'tag tag-user',
                style: {
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    color: 'rgb(99, 102, 241)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    fontFamily: 'monospace'
                }
            }, username);
        };

        // Helper function to check if value is boolean
        const isBooleanValue = (value) => {
            if (typeof value === 'boolean') return true;
            if (typeof value === 'string') {
                const lowerValue = value.toLowerCase();
                return ['true', 'false', 'ja', 'nee', 'yes', 'no', '1', '0', 'actief', 'inactief'].includes(lowerValue);
            }
            return false;
        };

        // Helper function to create boolean toggle display
        const createBooleanToggle = (value, row, fieldName, onToggle) => {
            let boolValue = false;
           
            if (typeof value === 'boolean') {
                boolValue = value;
            } else if (value !== null && value !== undefined && typeof value === 'string') {
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
                        onChange: (e) => {
                            if (onToggle) {
                                onToggle(row, fieldName, e.target.checked);
                            }
                        }
                    }),
                    h('span', { className: 'toggle-slider' })
                ),
                h('span', {
                    className: `status-badge ${boolValue ? 'status-active' : 'status-inactive'}`,
                    style: {
                        fontSize: '12px',
                        fontWeight: '600',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '0.75rem',
                        backgroundColor: boolValue ? 'rgba(34, 197, 94, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                        color: boolValue ? 'rgb(34, 197, 94)' : 'rgb(107, 114, 128)',
                        border: `1px solid ${boolValue ? 'rgba(34, 197, 94, 0.2)' : 'rgba(156, 163, 175, 0.2)'}`
                    }
                }, boolValue ? 'Actief' : 'Inactief')
            );
        };

        // Helper function to check if field is datetime
        const isDateTimeField = (accessor) => {
            const dateTimeFields = ['tijdstip', 'datetime', 'timestamp'];
            return dateTimeFields.some(field => accessor.toLowerCase().includes(field));
        };

        // Helper function to create datetime display
        const createDateTimeDisplay = (dateValue) => {
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) return h('span', { style: { color: 'var(--danger)' } }, 'Ongeldige datum');
           
            const dateStr = date.toLocaleDateString('nl-NL', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            const timeStr = date.toLocaleTimeString('nl-NL', {
                hour: '2-digit',
                minute: '2-digit'
            });
           
            return h('div', { className: 'datetime-display', style: { display: 'flex', flexDirection: 'column', gap: '2px' } },
                h('span', { style: { fontWeight: '600', fontSize: '0.875rem' } }, dateStr),
                h('span', { style: { color: 'var(--text-secondary)', fontSize: '0.75rem' } }, timeStr)
            );
        };

        // Helper function to check if field is date only
        const isDateField = (accessor) => {
            const dateFields = ['datum', 'date', 'geboortedatum'];
            return dateFields.some(field => accessor.toLowerCase().includes(field)) && !isDateTimeField(accessor);
        };

        // Helper function to create date display
        const createDateDisplay = (dateValue) => {
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) return h('span', { style: { color: 'var(--danger)' } }, 'Ongeldige datum');
           
            return h('span', {
                className: 'date-display',
                style: { fontWeight: '500', fontSize: '0.875rem' }
            }, date.toLocaleDateString('nl-NL', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }));
        };

        // Helper function to create status display with colors
        const createStatusDisplay = (status) => {
            if (!status || status === null || status === undefined) return h('span', { className: 'empty-value', style: { color: 'var(--text-secondary)', fontStyle: 'italic' } }, '(leeg)');
           
            const statusLower = status.toLowerCase();
            let statusClass = 'status-neutral';
            let statusColor = 'rgb(107, 114, 128)';
            let statusBg = 'rgba(107, 114, 128, 0.1)';
           
            // Green statuses
            if (['goedgekeurd', 'actief', 'approved', 'active', 'voltooid', 'completed', 'success'].includes(statusLower)) {
                statusClass = 'status-success';
                statusColor = 'rgb(34, 197, 94)';
                statusBg = 'rgba(34, 197, 94, 0.1)';
            }
            // Orange statuses  
            else if (['in behandeling', 'pending', 'wachtend', 'processing', 'nieuw', 'new'].includes(statusLower)) {
                statusClass = 'status-warning';
                statusColor = 'rgb(251, 146, 60)';
                statusBg = 'rgba(251, 146, 60, 0.1)';
            }
            // Red statuses
            else if (['afgekeurd', 'rejected', 'fout', 'error', 'failed', 'inactief', 'inactive'].includes(statusLower)) {
                statusClass = 'status-danger';
                statusColor = 'rgb(239, 68, 68)';
                statusBg = 'rgba(239, 68, 68, 0.1)';
            }
           
            return h('span', {
                className: `status-badge ${statusClass}`,
                style: {
                    backgroundColor: statusBg,
                    color: statusColor,
                    border: `1px solid ${statusColor}33`,
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                }
            }, status);
        };

        // Helper function to check if field is email
        const isEmailField = (accessor) => {
            return accessor.toLowerCase().includes('mail') || accessor.toLowerCase().includes('email');
        };

        // Helper function to create email link
        const createEmailLink = (email) => {
            if (!email || email === null || email === undefined) return h('span', { className: 'empty-value', style: { color: 'var(--text-secondary)', fontStyle: 'italic' } }, '(leeg)');
           
            return h('a', {
                href: `mailto:${email}`,
                className: 'email-link',
                style: {
                    color: 'var(--accent)',
                    textDecoration: 'none',
                    fontWeight: '500',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.375rem',
                    transition: 'all 0.2s ease'
                },
                onMouseEnter: (e) => {
                    e.target.style.backgroundColor = 'rgba(255, 109, 34, 0.1)';
                    e.target.style.textDecoration = 'underline';
                },
                onMouseLeave: (e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.textDecoration = 'none';
                }
            },
                h('i', { className: 'fas fa-envelope', style: { marginRight: '0.5rem' } }),
                email
            );
        };

        // Helper function to create text display
        const createTextDisplay = (value) => {
            if (value === null || value === undefined || value === '') {
                return h('span', { className: 'empty-value', style: { color: 'var(--text-secondary)', fontStyle: 'italic' } }, '(leeg)');
            }
            if (typeof value === 'string' && value.length > 50) {
                return h('span', {
                    title: value,
                    style: { cursor: 'help' }
                }, `${value.substring(0, 47)}...`);
            }
            return value;
        };

        // Updated DataTable component
        const DataTable = ({ columns, data, onEdit, onDelete, onToggle, listConfig }) => {
            const filteredData = data.filter(row => row && Object.keys(row).length > 0);
            const displayColumns = columns && columns.length > 0 ? columns : generateColumnsFromConfig(listConfig);
           
            return h('div', { className: 'table-container' },
                h('table', { className: 'data-table' },
                    h('thead', null,
                        h('tr', null, displayColumns.map(col => h('th', {
                            key: col.accessor,
                            style: { minWidth: col.isAction ? '120px' : '150px' }
                        }, col.Header)))
                    ),
                    h('tbody', null,
                        filteredData.length === 0 ?
                            h('tr', null, h('td', {
                                colSpan: displayColumns.length,
                                style: { textAlign: 'center', padding: '40px' }
                            }, 'Geen data beschikbaar')) :
                            filteredData.map((row, index) => h('tr', { key: row.Id || index },
                                displayColumns.map(col => {
                                    if (col.isAction) {
                                        return h('td', { key: col.accessor, className: 'actions-cell' },
                                            h('div', { className: 'action-buttons' },
                                                h('button', {
                                                    className: 'btn-action btn-edit',
                                                    onClick: () => onEdit && onEdit(row),
                                                    title: 'Bewerken'
                                                },
                                                    h('i', { className: 'fas fa-edit' })
                                                ),
                                                h('button', {
                                                    className: 'btn-action btn-delete',
                                                    onClick: () => onDelete && onDelete(row),
                                                    title: 'Verwijderen'
                                                },
                                                    h('i', { className: 'fas fa-trash' })
                                                )
                                            )
                                        );
                                    } else {
                                        const value = row[col.accessor];
                                        const formattedValue = formatValue(value, col, row, onToggle);
                                        return h('td', {
                                            key: col.accessor,
                                            title: typeof value === 'string' && value.length > 30 ? value : undefined
                                        }, formattedValue);
                                    }
                                })
                            ))
                    )
                )
            );
        };

        // Updated TabContent component
        const TabContent = ({ tab, data, loading, error, onAddNew, onEdit, onDelete, onToggle, showAllColumns, onToggleColumns }) => {
            const [searchQuery, setSearchQuery] = useState('');

            if (loading) {
                return h('div', { style: { textAlign: 'center', padding: '3rem' } },
                    h('div', { className: 'loading-spinner' }),
                    h('p', { style: { marginTop: '1rem' } }, 'Laden...')
                );
            }

            if (error) {
                return h('div', { style: { textAlign: 'center', padding: '3rem' } },
                    h('div', { style: { color: 'var(--danger)', marginBottom: '1rem' } },
                        h('i', { className: 'fas fa-exclamation-triangle', style: { fontSize: '2rem' } })
                    ),
                    h('p', { style: { color: 'var(--danger)' } }, `Fout bij laden: ${error.message}`)
                );
            }

            // Filter data based on search query
            const filteredData = React.useMemo(() => {
                if (!searchQuery.trim()) return data;

                const query = searchQuery.toLowerCase();
                return data.filter(row => {
                    // Search through all fields in the row
                    return Object.entries(row).some(([key, value]) => {
                        if (value === null || value === undefined) return false;
                        
                        // Convert value to string and search
                        const stringValue = String(value).toLowerCase();
                        return stringValue.includes(query);
                    });
                });
            }, [data, searchQuery]);

            const totalColumns = tab.listConfig ? tab.listConfig.velden.length - 2 : 0;
            const displayedColumns = showAllColumns ? totalColumns : (tab.columns ? tab.columns.length - 1 : 0);

            return h('div', { className: 'beheer-tab-panel beheer-tab-active' },
                h('div', { className: 'tab-actions' },
                    h('div', { style: { display: 'flex', gap: '12px', alignItems: 'center', flex: '1' } },
                        h('button', {
                            className: 'btn-primary',
                            onClick: onAddNew,
                            style: { display: 'flex', alignItems: 'center', gap: '0.5rem' }
                        },
                            h('i', { className: 'fas fa-plus' }),
                            `Nieuwe ${tab.label.slice(0, -1)} toevoegen`
                        ),
                        // Search filter
                        h('div', { className: 'search-filter-container', style: { flex: '1', maxWidth: '400px' } },
                            h('div', { className: 'autocomplete-container', style: { width: '100%' } },
                                h('input', {
                                    type: 'text',
                                    value: searchQuery,
                                    onChange: (e) => setSearchQuery(e.target.value),
                                    placeholder: `Zoek in ${tab.label.toLowerCase()}...`,
                                    className: 'autocomplete-input',
                                    style: { width: '100%' }
                                }),
                                h('span', { 
                                    className: 'autocomplete-icon', 
                                    'aria-hidden': 'true',
                                    style: { 
                                        pointerEvents: searchQuery ? 'auto' : 'none', 
                                        cursor: searchQuery ? 'pointer' : 'default' 
                                    },
                                    onClick: searchQuery ? () => setSearchQuery('') : undefined,
                                    title: searchQuery ? 'Wis zoekopdracht' : 'Zoeken'
                                }, searchQuery ? '✖️' : '🔍')
                            ),
                            searchQuery && h('div', { 
                                style: { 
                                    fontSize: '12px', 
                                    color: 'var(--text-secondary)', 
                                    marginTop: '4px',
                                    fontWeight: '500'
                                } 
                            }, `${filteredData.length} van ${data.length} resultaten`)
                        )
                    ),
                    h('div', { style: { display: 'flex', gap: '15px', alignItems: 'center' } },
                        h('span', { style: { fontSize: '13px', color: 'var(--text-secondary)' } },
                            `Kolommen: ${displayedColumns}/${totalColumns}`
                        ),
                        h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                            h('span', { style: { fontSize: '14px', fontWeight: '500' } }, 'Alle kolommen:'),
                            h('label', { className: 'toggle-switch' },
                                h('input', {
                                    type: 'checkbox',
                                    checked: showAllColumns,
                                    onChange: onToggleColumns
                                }),
                                h('span', { className: 'toggle-slider' })
                            )
                        )
                    )
                ),
                h(DataTable, {
                    columns: showAllColumns ? null : tab.columns,
                    data: filteredData,
                    listConfig: tab.listConfig,
                    onEdit,
                    onDelete,
                    onToggle
                })
            );
        };

        // Main ContentContainer component
        const ContentContainer = () => {
            const [activeTabId, setActiveTabId] = useState(beheerTabs[0].id);
            const [data, setData] = useState([]);
            const [loading, setLoading] = useState(true);
            const [error, setError] = useState(null);
            const [contextInitialized, setContextInitialized] = useState(false);
            const [isModalOpen, setIsModalOpen] = useState(false);
            const [editingItem, setEditingItem] = useState(null);
            const [showAllColumns, setShowAllColumns] = useState(true);

            const activeTab = beheerTabs.find(tab => tab.id === activeTabId);

            useEffect(() => {
                const initContext = async () => {
                    try {
                        await initializeSharePointContext();
                        await initializeTeamsColorMap();
                        setContextInitialized(true);
                    } catch (err) {
                        console.error("Failed to initialize SharePoint context:", err);
                        setError(err);
                    }
                };
                initContext();
            }, []);

            const fetchData = useCallback(async () => {
                if (!activeTab || !contextInitialized) return;

                setLoading(true);
                setError(null);
                try {
                    const listName = activeTab.listConfig.lijstTitel;
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
            }, [fetchData]);

            const handleAddNew = () => {
                setEditingItem(null);
                setIsModalOpen(true);
            };

            const handleEdit = (item) => {
                setEditingItem(item);
                setIsModalOpen(true);
            };

            const handleDelete = async (item) => {
                // Show item details in confirmation
                const itemName = item.Naam || item.Title || item.Omschrijving || `ID ${item.Id}`;
                const confirmMessage = `Weet je zeker dat je "${itemName}" wilt verwijderen?\n\nDeze actie kan niet ongedaan worden gemaakt.`;
                
                if (confirm(confirmMessage)) {
                    try {
                        const listName = activeTab.listConfig.lijstTitel;
                        await deleteListItem(listName, item.Id);
                        console.log(`✅ Item verwijderd: ${itemName}`);
                        fetchData();
                    } catch (err) {
                        console.error('Fout bij verwijderen van item:', err);
                        alert(`Er is een fout opgetreden bij het verwijderen van het item.\n\n${err.message || 'Onbekende fout'}`);
                    }
                }
            };

            const handleToggle = async (item, fieldName, newValue) => {
                try {
                    const listName = activeTab.listConfig.lijstTitel;
                    const updatePayload = { [fieldName]: newValue };
                    await updateListItem(listName, item.Id, updatePayload);
                    fetchData(); // Refresh data to show the change
                } catch (err) {
                    console.error('Fout bij bijwerken van item via toggle:', err);
                    alert(`Er is een fout opgetreden bij het bijwerken van het veld.\n\n${err.message || 'Onbekende fout'}`);
                    // Refresh to revert the toggle UI
                    fetchData();
                }
            };

            const handleCloseModal = () => {
                setIsModalOpen(false);
                setEditingItem(null);
                document.body.classList.remove('modal-open');
            };

            const handleSave = async (formData) => {
                try {
                    const listName = activeTab.listConfig.lijstTitel;
                    if (editingItem) {
                        await updateListItem(listName, editingItem.Id, formData);
                        console.log(`✅ Item bijgewerkt in ${listName}`);
                    } else {
                        await createListItem(listName, formData);
                        console.log(`✅ Nieuw item aangemaakt in ${listName}`);
                    }
                    handleCloseModal();
                    fetchData();
                } catch (err) {
                    console.error('Fout bij opslaan van item:', err);
                    alert(`Er is een fout opgetreden bij het opslaan.\n\n${err.message || 'Onbekende fout'}\n\nControleer de invoer en probeer het opnieuw.`);
                }
            };

            React.useEffect(() => {
                if (isModalOpen) {
                    document.body.classList.add('modal-open');
                } else {
                    document.body.classList.remove('modal-open');
                }
               
                return () => {
                    document.body.classList.remove('modal-open');
                };
            }, [isModalOpen]);

            return h('div', { className: 'beheer-tabs-container' },
                // Tabs Navigation
                h('div', { className: 'beheer-tabs' },
                    beheerTabs.map(tab => h('button', {
                        key: tab.id,
                        className: `beheer-tab ${tab.id === activeTabId ? 'beheer-tab-active' : ''}`,
                        onClick: () => setActiveTabId(tab.id)
                    }, tab.label))
                ),
               
                // Active Tab Content
                activeTab && h(TabContent, {
                    tab: activeTab,
                    data,
                    loading,
                    error,
                    onAddNew: handleAddNew,
                    onEdit: handleEdit,
                    onDelete: handleDelete,
                    onToggle: handleToggle,
                    showAllColumns,
                    onToggleColumns: () => setShowAllColumns(!showAllColumns)
                }),
               
                // Modal for Add/Edit
                h(Modal, { isOpen: isModalOpen, onClose: handleCloseModal },
                    activeTab && (() => {
                        const FormComponent = getFormComponent(activeTab.id);
                        return h(FormComponent, {
                            onSave: handleSave,
                            onCancel: handleCloseModal,
                            initialData: editingItem || {},
                            formFields: activeTab.formFields || [],
                            title: editingItem ?
                                `${activeTab.label.slice(0, -1)} Bewerken` :
                                `Nieuwe ${activeTab.label.slice(0, -1)} Toevoegen`,
                            tabType: activeTab.id
                        });
                    })()
                )
            );
        };

        // Error Boundary Component
        class ErrorBoundary extends React.Component {
            constructor(props) {
                super(props);
                this.state = { hasError: false, error: null };
            }

            static getDerivedStateFromError(error) {
                return { hasError: true, error };
            }

            componentDidCatch(error, errorInfo) {
                console.error('Error caught by boundary:', error, errorInfo);
            }

            render() {
                if (this.state.hasError) {
                    return h('div', { className: 'full-width-container' },
                        h('div', { style: { textAlign: 'center', padding: '3rem' } },
                            h('h2', null, 'Er is een onverwachte fout opgetreden'),
                            h('p', null, this.state.error?.message || 'Onbekende fout'),
                            h('button', {
                                className: 'btn-primary',
                                onClick: () => window.location.reload()
                            }, 'Vernieuw')
                        )
                    );
                }
                return this.props.children;
            }
        }

        // Main Beheercentrum Component
        const Beheercentrum = () => {
            const [loading, setLoading] = useState(true);
            const [currentUser, setCurrentUser] = useState(null);
            const [hasAccess, setHasAccess] = useState(false);
            const [accessCheckComplete, setAccessCheckComplete] = useState(false);

            useEffect(() => {
                const checkUserAccess = async () => {
                    try {
                        console.log('🔐 Checking Beheercentrum access...');
                        
                        // Get current user info
                        const user = await getCurrentUserInfo();
                        if (!user) {
                            console.error('❌ Could not get current user info');
                            setAccessCheckComplete(true);
                            setLoading(false);
                            return;
                        }
                        
                        setCurrentUser(user);
                        console.log('👤 Current user:', user.Title);
                        
                        // Check if user has admin or functional permissions
                        const adminGroups = ["1. Sharepoint beheer", "1.1. Mulder MT"];
                        const functionalGroups = ["1. Sharepoint beheer", "1.1. Mulder MT", "2.6 Roosteraars"];
                        
                        const [isAdmin, isFunctional] = await Promise.all([
                            isUserInAnyGroup(adminGroups),
                            isUserInAnyGroup(functionalGroups)
                        ]);
                        
                        const hasPermission = isAdmin || isFunctional;
                        
                        console.log('🔐 Access check result:', { isAdmin, isFunctional, hasPermission });
                        
                        setHasAccess(hasPermission);
                        setAccessCheckComplete(true);
                        setLoading(false);
                        
                    } catch (error) {
                        console.error('❌ Error checking access:', error);
                        setAccessCheckComplete(true);
                        setLoading(false);
                    }
                };
                
                checkUserAccess();
            }, []);

            if (loading || !accessCheckComplete) {
                return h('div', { className: 'full-width-container' },
                    h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' } },
                        h('div', { className: 'loading-spinner' }),
                        h('p', null, 'Toegangsrechten controleren...')
                    )
                );
            }

            // Access Denied UI
            if (!hasAccess) {
                return h('div', { className: 'full-width-container' },
                    h('div', {
                        style: {
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100vh',
                            backgroundColor: '#f5f5f5'
                        }
                    },
                        h('div', {
                            style: {
                                backgroundColor: 'white',
                                padding: '40px',
                                borderRadius: '8px',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                maxWidth: '500px',
                                textAlign: 'center'
                            }
                        },
                            h('div', { style: { fontSize: '4rem', marginBottom: '20px' } }, '🔒'),
                            h('h2', { style: { marginBottom: '20px', color: '#333' } }, 'Geen toegang'),
                            h('p', { style: { marginBottom: '20px', color: '#666', lineHeight: '1.6' } },
                                'U heeft geen toegang tot het Beheercentrum. Deze pagina is alleen beschikbaar voor beheerders en functioneel beheerders.'
                            ),
                            h('p', { style: { marginBottom: '30px', color: '#666', lineHeight: '1.6' } },
                                'Neem contact op met de beheerder als u toegang nodig heeft.'
                            ),
                            currentUser && h('div', {
                                style: {
                                    backgroundColor: '#f8f9fa',
                                    padding: '15px',
                                    borderRadius: '4px',
                                    fontSize: '0.9rem',
                                    color: '#666',
                                    marginBottom: '20px'
                                }
                            },
                                h('p', { style: { margin: '5px 0' } }, h('strong', null, 'Gebruiker: '), currentUser.Title),
                                h('p', { style: { margin: '5px 0' } }, h('strong', null, 'E-mail: '), currentUser.Email)
                            ),
                            h('button', {
                                className: 'btn-primary',
                                onClick: () => {
                                    const targetUrl = linkInfo.getVerlofRoosterUrl();
                                    window.location.href = targetUrl;
                                },
                                style: {
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1.5rem'
                                }
                            },
                                h('i', { className: 'fas fa-arrow-left' }),
                                'Terug naar Verlofrooster'
                            )
                        )
                    )
                );
            }

            return h('div', { className: 'full-width-container' },
                // Custom Header
                h('header', { className: 'beheer-header' },
                    h('div', { className: 'beheer-header-left' },
                        h('a', {
                            href: '#',
                            onClick: (e) => {
                                e.preventDefault();
                                const targetUrl = linkInfo.getVerlofRoosterUrl();
                                window.location.href = targetUrl;
                            },
                            className: 'header-back-link',
                            style: { textDecoration: 'none', color: 'inherit' }
                        },
                            h('svg', {
                                xmlns: 'http://www.w3.org/2000/svg',
                                fill: 'none',
                                viewBox: '0 0 24 24',
                                strokeWidth: '2.5',
                                stroke: 'currentColor',
                                style: { width: '1rem', height: '1rem' }
                            },
                                h('path', {
                                    strokeLinecap: 'round',
                                    strokeLinejoin: 'round',
                                    d: 'M15.75 19.5L8.25 12l7.5-7.5'
                                })
                            ),
                            h('span', null, 'Terug naar rooster')
                        ),
                        h('h1', { style: { margin: 0, fontSize: '1.25rem', fontWeight: '700' } }, 'Verlofrooster Beheercentrum'),
                        h('span', { style: { color: 'var(--text-secondary)', fontSize: '0.875rem' } }, 'Beheer medewerkers, teams en andere kerngegevens')
                    ),
                    h('div', { className: 'beheer-header-right' },
                        h('span', null, `Welkom, ${currentUser?.Title || 'Administrator'}`),
                        h('div', { className: 'status-indicator status-online' },
                            h('i', { className: 'fas fa-circle' }),
                            'Online'
                        )
                    )
                ),

                // Main Content Area
                h('main', { className: 'beheer-main-content' },
                    h(ContentContainer)
                )
            );
        };

        // Application Bootstrap
        const App = () => {
            return h(Beheercentrum);
        };

        // Render Application
        const container = document.getElementById('root');
        const root = ReactDOM.createRoot(container);

        root.render(
            h(ErrorBoundary, null,
                h(App)
            )
        );

        console.log('🎉 Beheercentrum (Full-Width) initialized successfully');
    </script>
</body>
</html>

