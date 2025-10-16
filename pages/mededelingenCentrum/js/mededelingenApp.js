/**
 * @file mededelingenApp.js
 * @description Main application for managing Mededelingen (announcements)
 * Provides CRUD operations for the Mededeling SharePoint list
 * Following coding instructions from .github/copilot-instructions.md
 */

// Import services and utilities
import { 
    fetchSharePointList, 
    createSharePointListItem, 
    updateSharePointListItem, 
    deleteSharePointListItem,
    getUserInfo,
    getCurrentUser,
    trimLoginNaamPrefix 
} from '../../../js/services/sharepointService.js';

import { getCurrentUserGroups } from '../../../js/services/permissionService.js';
import { canManageOthersEvents } from '../../../js/ui/ContextMenu.js';

// React destructuring
const { createElement: h, useState, useEffect, useMemo, useCallback, Fragment } = React;

/**
 * Main Mededelingen App Component
 */
const MededelingenApp = () => {
    // State management
    const [mededelingen, setMededelingen] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [userPermissions, setUserPermissions] = useState([]);
    const [canManageAnnouncements, setCanManageAnnouncements] = useState(false);
    
    // Filter and search state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [teamFilter, setTeamFilter] = useState('');
    const [sortColumn, setSortColumn] = useState('DatumTijdStart');
    const [sortDirection, setSortDirection] = useState('desc');
    
    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'delete'
    const [selectedMededeling, setSelectedMededeling] = useState(null);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Initialize app
    useEffect(() => {
        // Initialize notification system
        if (window.NotificationSystem) {
            window.NotificationSystem.init();
        }
        
        initializeApp();
    }, []);

    const initializeApp = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load user info and permissions
            const user = await getCurrentUser();
            setCurrentUser(user);
            
            const groups = await getCurrentUserGroups();
            setUserPermissions(groups);
            
            // Check if user can manage announcements
            const canManage = await canManageOthersEvents();
            setCanManageAnnouncements(canManage);
            console.log('🔐 User broadcast permissions:', { canManage, user: user?.LoginName });

            // Update UI with user info
            updateUserDisplay(user);
            
            // Update button visibility based on permissions
            updateButtonVisibility(canManage);
            
            // Update global permissions state
            if (window.mededelingenApp) {
                window.mededelingenApp.updatePermissions(canManage);
            }
            
            // Load data
            await Promise.all([
                loadMededelingen(),
                loadTeams()
            ]);

        } catch (err) {
            console.error('Error initializing app:', err);
            setError('Fout bij het laden van de applicatie: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateUserDisplay = (user) => {
        const userElement = document.getElementById('huidige-gebruiker');
        if (userElement && user) {
            userElement.textContent = user.Title || user.LoginName || 'Onbekende gebruiker';
        }
    };

    const updateButtonVisibility = (canManage) => {
        const privilegedContainer = document.getElementById('privileged-actions-container');
        if (privilegedContainer) {
            privilegedContainer.style.display = canManage ? 'inline-flex' : 'none';
            console.log('🔐 Privileged actions container visibility updated:', { canManage, display: privilegedContainer.style.display });
        }
    };

    const loadMededelingen = async () => {
        try {
            const data = await fetchSharePointList('Mededeling');
            setMededelingen(data || []);
            updateStatistics(data || []);
        } catch (err) {
            console.error('Error loading mededelingen:', err);
            throw new Error('Mededelingen konden niet worden geladen');
        }
    };

    const loadTeams = async () => {
        try {
            const data = await fetchSharePointList('Teams');
            const activeTeams = (data || []).filter(team => team.Actief !== false);
            setTeams(activeTeams);
            populateTeamFilter(activeTeams);
        } catch (err) {
            console.error('Error loading teams:', err);
            // Teams are not critical, continue without them
            setTeams([]);
        }
    };

    const populateTeamFilter = (teams) => {
        const teamFilterElement = document.getElementById('team-filter');
        if (teamFilterElement) {
            // Clear existing options except the first one
            teamFilterElement.innerHTML = '<option value="">Alle teams</option>';
            
            teams.forEach(team => {
                const option = document.createElement('option');
                option.value = team.Naam;
                option.textContent = team.Naam;
                teamFilterElement.appendChild(option);
            });
        }
    };

    const updateStatistics = (data) => {
        const now = new Date();
        
        const stats = {
            totaal: data.length,
            actief: 0,
            toekomstig: 0,
            verlopen: 0
        };

        data.forEach(item => {
            const startDate = item.DatumTijdStart ? new Date(item.DatumTijdStart) : null;
            const endDate = item.DatumTijdEinde ? new Date(item.DatumTijdEinde) : null;
            
            if (startDate && startDate > now) {
                stats.toekomstig++;
            } else if (endDate && endDate < now) {
                stats.verlopen++;
            } else {
                stats.actief++;
            }
        });

        // Update DOM elements
        const updateStat = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };

        updateStat('stat-totaal', stats.totaal);
        updateStat('stat-actief', stats.actief);
        updateStat('stat-toekomstig', stats.toekomstig);
        updateStat('stat-verlopen', stats.verlopen);
    };

    // Filter and sort mededelingen
    const filteredAndSortedMededelingen = useMemo(() => {
        let filtered = [...mededelingen];
        const now = new Date();

        // Apply search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(item => 
                (item.Title || '').toLowerCase().includes(searchLower) ||
                (item.Aanvulling || '').toLowerCase().includes(searchLower)
            );
        }

        // Apply status filter
        if (statusFilter) {
            filtered = filtered.filter(item => {
                const startDate = item.DatumTijdStart ? new Date(item.DatumTijdStart) : null;
                const endDate = item.DatumTijdEinde ? new Date(item.DatumTijdEinde) : null;
                
                switch (statusFilter) {
                    case 'actief':
                        return (!startDate || startDate <= now) && (!endDate || endDate >= now);
                    case 'toekomstig':
                        return startDate && startDate > now;
                    case 'verlopen':
                        return endDate && endDate < now;
                    default:
                        return true;
                }
            });
        }

        // Apply team filter
        if (teamFilter) {
            filtered = filtered.filter(item => {
                if (!item.UitzendenAan) return false;
                const targetTeams = item.UitzendenAan.split(';').map(team => team.trim());
                return targetTeams.includes(teamFilter) || targetTeams.includes('Alle teams');
            });
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue = a[sortColumn] || '';
            let bValue = b[sortColumn] || '';
            
            // Handle dates
            if (sortColumn.includes('Datum')) {
                aValue = aValue ? new Date(aValue) : new Date(0);
                bValue = bValue ? new Date(bValue) : new Date(0);
            }
            
            // Handle strings
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }
            
            let comparison = 0;
            if (aValue < bValue) comparison = -1;
            if (aValue > bValue) comparison = 1;
            
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return filtered;
    }, [mededelingen, searchTerm, statusFilter, teamFilter, sortColumn, sortDirection]);

    // Pagination
    const paginatedMededelingen = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredAndSortedMededelingen.slice(startIndex, endIndex);
    }, [filteredAndSortedMededelingen, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredAndSortedMededelingen.length / itemsPerPage);

    // Event handlers
    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const handleCreateNew = () => {
        setModalMode('create');
        setSelectedMededeling(null);
        setShowModal(true);
    };

    const handleEdit = (mededeling) => {
        setModalMode('edit');
        setSelectedMededeling(mededeling);
        setShowModal(true);
    };

    const handleDelete = (mededeling) => {
        setModalMode('delete');
        setSelectedMededeling(mededeling);
        setShowModal(true);
    };

    const handleSave = async (formData) => {
        // Check permissions before saving
        if (!canManageAnnouncements) {
            if (window.NotificationSystem) {
                window.NotificationSystem.error('Je hebt geen rechten om mededelingen aan te maken of te bewerken.', 'Toegang geweigerd');
            }
            return;
        }
        
        try {
            const username = currentUser?.LoginName?.split('|')[1] || currentUser?.LoginName;
            
            if (modalMode === 'create') {
                const newItem = {
                    Title: formData.title,
                    Aanvulling: formData.description,
                    DatumTijdStart: formData.startDate ? new Date(formData.startDate).toISOString() : null,
                    DatumTijdEinde: formData.endDate ? new Date(formData.endDate).toISOString() : null,
                    UitzendenAan: formData.targetTeams.join('; '),
                    username: username
                };
                
                await createSharePointListItem('Mededeling', newItem);
            } else if (modalMode === 'edit') {
                const updateData = {
                    Title: formData.title,
                    Aanvulling: formData.description,
                    DatumTijdStart: formData.startDate ? new Date(formData.startDate).toISOString() : null,
                    DatumTijdEinde: formData.endDate ? new Date(formData.endDate).toISOString() : null,
                    UitzendenAan: formData.targetTeams.join('; ')
                };
                
                await updateSharePointListItem('Mededeling', selectedMededeling.ID, updateData);
            }
            
            setShowModal(false);
            await loadMededelingen();
            
            // Show success notification
            if (window.NotificationSystem) {
                const action = modalMode === 'create' ? 'aangemaakt' : 'bijgewerkt';
                window.NotificationSystem.success(`Mededeling succesvol ${action}.`, 'Opgeslagen');
            }
            
        } catch (err) {
            console.error('Error saving mededeling:', err);
            if (window.NotificationSystem) {
                window.NotificationSystem.error('Fout bij het opslaan: ' + err.message, 'Fout opgetreden');
            }
        }
    };

    const handleDeleteConfirm = async () => {
        // Check permissions before deleting
        if (!canManageAnnouncements) {
            if (window.NotificationSystem) {
                window.NotificationSystem.error('Je hebt geen rechten om mededelingen te verwijderen.', 'Toegang geweigerd');
            }
            return;
        }
        
        try {
            await deleteSharePointListItem('Mededeling', selectedMededeling.ID);
            setShowModal(false);
            await loadMededelingen();
            
            // Show success notification
            if (window.NotificationSystem) {
                window.NotificationSystem.success('Mededeling succesvol verwijderd.', 'Verwijderd');
            }
        } catch (err) {
            console.error('Error deleting mededeling:', err);
            if (window.NotificationSystem) {
                window.NotificationSystem.error('Fout bij het verwijderen: ' + err.message, 'Fout opgetreden');
            }
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('nl-NL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Helper function to strip HTML tags for table display
    const stripHtmlTags = (html) => {
        if (!html) return '';
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || '';
    };

    const getStatusBadge = (mededeling) => {
        const now = new Date();
        const startDate = mededeling.DatumTijdStart ? new Date(mededeling.DatumTijdStart) : null;
        const endDate = mededeling.DatumTijdEinde ? new Date(mededeling.DatumTijdEinde) : null;
        
        if (startDate && startDate > now) {
            return h('span', { className: 'status-badge pending' },
                h('i', { className: 'fas fa-clock' }),
                'Toekomstig'
            );
        } else if (endDate && endDate < now) {
            return h('span', { className: 'status-badge expired' },
                h('i', { className: 'fas fa-history' }),
                'Verlopen'
            );
        } else {
            return h('span', { className: 'status-badge active' },
                h('i', { className: 'fas fa-broadcast-tower' }),
                'Actief'
            );
        }
    };

    const getTeamTags = (uitzendenAan) => {
        if (!uitzendenAan) return '-';
        
        const teams = uitzendenAan.split(';').map(team => team.trim()).filter(team => team);
        
        return h('div', { className: 'team-tags' },
            teams.slice(0, 3).map((team, index) =>
                h('span', { key: index, className: 'team-tag' }, team)
            ),
            teams.length > 3 && h('span', { className: 'team-tag' }, `+${teams.length - 3}`)
        );
    };

    // Render loading state
    if (loading) {
        return h('div', { className: 'loading-container' },
            h('div', { className: 'loading-spinner' }),
            h('span', null, 'Applicatie laden...')
        );
    }

    // Render error state
    if (error) {
        return h('div', { className: 'error-container' },
            h('h2', null, 'Er is een fout opgetreden'),
            h('p', null, error),
            h('button', { 
                className: 'btn btn-primary',
                onClick: initializeApp 
            }, 'Opnieuw proberen')
        );
    }

    // Main render
    return h(Fragment, null,
        // Table body content
        h('tbody', { id: 'mededelingen-tbody' },
            paginatedMededelingen.length === 0 ? 
                h('tr', null,
                    h('td', { colspan: 8, style: { textAlign: 'center', padding: '40px' } },
                        h('div', null,
                            h('i', { className: 'fas fa-search', style: { fontSize: '2em', color: '#ccc', marginBottom: '10px' } }),
                            h('p', { style: { color: '#666', margin: 0 } }, 'Geen mededelingen gevonden')
                        )
                    )
                ) :
                paginatedMededelingen.map(mededeling =>
                    h('tr', { key: mededeling.ID },
                        h('td', null, mededeling.Title || '-'),
                        h('td', null,
                            h('div', { 
                                style: { 
                                    maxWidth: '200px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                },
                                title: stripHtmlTags(mededeling.Aanvulling) 
                            }, stripHtmlTags(mededeling.Aanvulling) || '-')
                        ),
                        h('td', null, formatDate(mededeling.DatumTijdStart)),
                        h('td', null, formatDate(mededeling.DatumTijdEinde)),
                        h('td', null, getStatusBadge(mededeling)),
                        h('td', null, getTeamTags(mededeling.UitzendenAan)),
                        h('td', null, mededeling.username || '-'),
                        h('td', null,
                            canManageAnnouncements ? 
                                h('div', { className: 'action-buttons' },
                                    h('button', {
                                        className: 'action-btn edit',
                                        title: 'Bewerken',
                                        onClick: () => handleEdit(mededeling)
                                    }, h('i', { className: 'fas fa-edit' })),
                                    h('button', {
                                        className: 'action-btn delete',
                                        title: 'Verwijderen',
                                        onClick: () => handleDelete(mededeling)
                                    }, h('i', { className: 'fas fa-trash' }))
                                ) : 
                                h('span', { style: { color: '#666', fontStyle: 'italic' } }, 'Geen rechten')
                        )
                    )
                )
        ),
        
        // Modal for create/edit/delete
        showModal && h(MededelingModal, {
            mode: modalMode,
            mededeling: selectedMededeling,
            teams: teams,
            onSave: handleSave,
            onDelete: handleDeleteConfirm,
            onCancel: () => setShowModal(false)
        })
    );
};

/**
 * Modal component for creating/editing/deleting mededelingen
 */
const MededelingModal = ({ mode, mededeling, teams, onSave, onDelete, onCancel }) => {
    const [formData, setFormData] = useState({
        title: mededeling?.Title || '',
        description: mededeling?.Aanvulling || '',
        startDate: mededeling?.DatumTijdStart ? 
            new Date(mededeling.DatumTijdStart).toISOString().slice(0, 16) : '',
        endDate: mededeling?.DatumTijdEinde ? 
            new Date(mededeling.DatumTijdEinde).toISOString().slice(0, 16) : '',
        targetTeams: mededeling?.UitzendenAan ? 
            mededeling.UitzendenAan.split(';').map(team => team.trim()) : []
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (mode === 'delete') {
            onDelete();
        } else {
            onSave(formData);
        }
    };

    const handleTeamToggle = (teamName) => {
        setFormData(prev => ({
            ...prev,
            targetTeams: prev.targetTeams.includes(teamName)
                ? prev.targetTeams.filter(t => t !== teamName)
                : [...prev.targetTeams, teamName]
        }));
    };

    const modalTitle = mode === 'create' ? 'Nieuwe mededeling' :
                     mode === 'edit' ? 'Mededeling bewerken' : 'Mededeling verwijderen';

    return h('div', { 
        className: 'modal-overlay',
        style: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        },
        onClick: (e) => e.target === e.currentTarget && onCancel()
    },
        h('div', {
            className: 'modal-content',
            style: {
                background: 'white',
                borderRadius: '8px',
                padding: '24px',
                maxWidth: '600px',
                width: '90%',
                maxHeight: '90vh',
                overflow: 'auto'
            }
        },
            h('div', { className: 'modal-header', style: { marginBottom: '20px' } },
                h('h2', { style: { margin: 0 } }, modalTitle),
                h('button', {
                    style: {
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: 'none',
                        border: 'none',
                        fontSize: '1.5em',
                        cursor: 'pointer'
                    },
                    onClick: onCancel
                }, '×')
            ),
            
            mode === 'delete' ? 
                h('div', null,
                    h('p', null, `Weet je zeker dat je de mededeling "${mededeling?.Title}" wilt verwijderen?`),
                    h('div', { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' } },
                        h('button', { className: 'btn btn-ghost', onClick: onCancel }, 'Annuleren'),
                        h('button', { className: 'btn', style: { background: '#f44336', color: 'white' }, onClick: onDelete }, 'Verwijderen')
                    )
                ) :
                h('form', { onSubmit: handleSubmit },
                    h('div', { style: { marginBottom: '16px' } },
                        h('label', { style: { display: 'block', marginBottom: '4px', fontWeight: '500' } }, 'Titel:'),
                        h('input', {
                            type: 'text',
                            value: formData.title,
                            onChange: (e) => setFormData(prev => ({ ...prev, title: e.target.value })),
                            required: true,
                            style: { width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }
                        })
                    ),
                    h('div', { style: { marginBottom: '16px' } },
                        h('label', { style: { display: 'block', marginBottom: '4px', fontWeight: '500' } }, 'Beschrijving:'),
                        h('textarea', {
                            value: formData.description,
                            onChange: (e) => setFormData(prev => ({ ...prev, description: e.target.value })),
                            required: true,
                            rows: 4,
                            style: { width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }
                        })
                    ),
                    h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' } },
                        h('div', null,
                            h('label', { style: { display: 'block', marginBottom: '4px', fontWeight: '500' } }, 'Startdatum:'),
                            h('input', {
                                type: 'datetime-local',
                                value: formData.startDate,
                                onChange: (e) => setFormData(prev => ({ ...prev, startDate: e.target.value })),
                                style: { width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }
                            })
                        ),
                        h('div', null,
                            h('label', { style: { display: 'block', marginBottom: '4px', fontWeight: '500' } }, 'Einddatum:'),
                            h('input', {
                                type: 'datetime-local',
                                value: formData.endDate,
                                onChange: (e) => setFormData(prev => ({ ...prev, endDate: e.target.value })),
                                style: { width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }
                            })
                        )
                    ),
                    h('div', { style: { marginBottom: '20px' } },
                        h('label', { style: { display: 'block', marginBottom: '8px', fontWeight: '500' } }, 'Doelgroep teams:'),
                        h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' } },
                            teams.map(team =>
                                h('label', { 
                                    key: team.ID,
                                    style: { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px', background: '#f5f5f5', borderRadius: '4px', cursor: 'pointer' }
                                },
                                    h('input', {
                                        type: 'checkbox',
                                        checked: formData.targetTeams.includes(team.Naam),
                                        onChange: () => handleTeamToggle(team.Naam)
                                    }),
                                    team.Naam
                                )
                            ),
                            h('label', { 
                                style: { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px', background: '#f5f5f5', borderRadius: '4px', cursor: 'pointer' }
                            },
                                h('input', {
                                    type: 'checkbox',
                                    checked: formData.targetTeams.includes('Alle teams'),
                                    onChange: () => handleTeamToggle('Alle teams')
                                }),
                                'Alle teams'
                            )
                        )
                    ),
                    h('div', { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' } },
                        h('button', { type: 'button', className: 'btn btn-ghost', onClick: onCancel }, 'Annuleren'),
                        h('button', { type: 'submit', className: 'btn btn-primary' }, mode === 'create' ? 'Aanmaken' : 'Opslaan')
                    )
                )
        )
    );
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners
    const initializeEventListeners = () => {
        // Search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                app.setSearchTerm(e.target.value);
            });
        }

        // Filter functionality
        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                app.setStatusFilter(e.target.value);
            });
        }

        const teamFilter = document.getElementById('team-filter');
        if (teamFilter) {
            teamFilter.addEventListener('change', (e) => {
                app.setTeamFilter(e.target.value);
            });
        }

        // Button functionality
        const newBtn = document.getElementById('btn-nieuwe-mededeling');
        if (newBtn) {
            newBtn.addEventListener('click', () => {
                // Check permissions before allowing creation
                if (window.mededelingenApp && window.mededelingenApp.canManageAnnouncements) {
                    app.handleCreateNew();
                } else {
                    if (window.NotificationSystem) {
                        window.NotificationSystem.error('Je hebt geen rechten om mededelingen aan te maken.', 'Toegang geweigerd');
                    }
                }
            });
        }

        const refreshBtn = document.getElementById('btn-refresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                app.loadMededelingen();
            });
        }

        const resetBtn = document.getElementById('btn-reset-filters');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                searchInput.value = '';
                statusFilter.value = '';
                teamFilter.value = '';
                app.setSearchTerm('');
                app.setStatusFilter('');
                app.setTeamFilter('');
            });
        }

        // Table sorting
        document.querySelectorAll('.data-table th.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const column = th.dataset.column;
                if (column) {
                    app.handleSort(column);
                }
            });
        });
    };

    // Create React root and render
    const container = document.getElementById('mededelingen-tbody')?.parentElement;
    if (container) {
        const root = ReactDOM.createRoot(container);
        
        // Create app instance with exposed methods for DOM event handlers
        let appInstance = null;
        window.mededelingenApp = {
            setSearchTerm: () => {},
            setStatusFilter: () => {},
            setTeamFilter: () => {},
            handleCreateNew: () => {},
            handleSort: () => {},
            loadMededelingen: () => {},
            canManageAnnouncements: false,
            setAppInstance: (instance) => { appInstance = instance; },
            updatePermissions: (canManage) => { 
                window.mededelingenApp.canManageAnnouncements = canManage; 
                console.log('🔐 Global permissions updated:', { canManage });
            }
        };
        
        root.render(h(MededelingenApp));
    }

    // Initialize event listeners
    initializeEventListeners();
});

console.log('✅ Mededelingen App loaded successfully.');