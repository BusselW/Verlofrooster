/**
 * @file Mededelingen.js
 * @description Component for displaying and managing announcements/mededelingen
 * Shows active announcements based on date range and target audience
 * Provides interface for privileged users to create new announcements
 */

import { fetchSharePointList, createSharePointListItem, updateSharePointListItem, deleteSharePointListItem } from '../services/sharepointService.js';
import { getCurrentUserInfo } from '../services/sharepointService.js';
import { canManageOthersEvents } from './ContextMenu.js';

const { createElement: h, useState, useEffect, useRef } = React;

/**
 * Mededelingen Component
 * @param {Object} props - Component props
 * @param {Array} props.teams - Available teams for targeting announcements
 * @param {Array} props.medewerkers - Medewerkers data from main app
 * @param {boolean} props.showCreateForm - External control for create form visibility
 * @param {Function} props.onCreateFormToggle - Callback when create form should be toggled
 */
const Mededelingen = ({ teams = [], medewerkers = [], showCreateForm = false, onCreateFormToggle }) => {
    const [announcements, setAnnouncements] = useState([]);
    const [canManageAnnouncements, setCanManageAnnouncements] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    
    // Debug logging for teams
    useEffect(() => {
        console.log('📝 Mededelingen: Teams received:', teams.length, 'teams');
        console.log('📝 Mededelingen: Medewerkers received:', medewerkers.length, 'medewerkers');
    }, [teams, medewerkers]);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        targetTeams: []
    });

    // Edit state
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [showEditForm, setShowEditForm] = useState(false);

    useEffect(() => {
        initializeComponent();
    }, []);

    // Reload announcements when medewerkers data changes
    useEffect(() => {
        if (currentUser && medewerkers.length > 0) {
            loadAnnouncements();
        }
    }, [medewerkers, currentUser]);

    const initializeComponent = async () => {
        try {
            setLoading(true);

            // Check user permissions
            const user = await getCurrentUserInfo();
            setCurrentUser(user);
            
            const hasPermissions = await canManageOthersEvents();
            setCanManageAnnouncements(hasPermissions);

            // Load announcements with user info
            await loadAnnouncements(user);
        } catch (error) {
            console.error('Error initializing Mededelingen component:', error);
        } finally {
            setLoading(false);
        }
    };

    // Helper function to get full domain\username format from SharePoint LoginName
    const getFullLoginName = (loginName) => {
        if (!loginName) return '';
        
        // Remove claim prefix if present (i:0#.w|domain\username -> domain\username)
        let processed = loginName;
        if (processed.startsWith('i:0#.w|')) {
            processed = processed.substring(7);
        }
        
        // Return the full domain\username format
        return processed;
    };

    // Helper function to escape HTML but preserve newlines
    const escapeHtmlWithNewlines = (text) => {
        if (!text) return '';
        
        // First escape HTML entities
        const escaped = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        
        // Then convert newlines to <br> tags
        return escaped.replace(/\n/g, '<br>');
    };

    const loadAnnouncements = async (user = null) => {
        try {
            const allAnnouncements = await fetchSharePointList('Mededeling');
            
            // Get current user's team from passed Medewerkers data
            let userTeam = null;
            const userToCheck = user || currentUser;
            
            if (userToCheck && userToCheck.LoginName && medewerkers.length > 0) {
                try {
                    const sanitizedLoginName = getFullLoginName(userToCheck.LoginName);
                    
                    const userRecord = medewerkers.find(m => 
                        m.Username && m.Username.toLowerCase() === sanitizedLoginName.toLowerCase()
                    );
                    if (userRecord && userRecord.Team) {
                        userTeam = userRecord.Team;
                        console.log('📝 User team found:', userTeam);
                    } else {
                        console.log('📝 No team found for user:', sanitizedLoginName);
                    }
                } catch (teamError) {
                    console.warn('Could not fetch user team:', teamError);
                }
            }
            
            const activeAnnouncements = filterActiveAnnouncements(allAnnouncements, userTeam);
            setAnnouncements(activeAnnouncements);
        } catch (error) {
            console.error('Error loading announcements:', error);
        }
    };

    const filterActiveAnnouncements = (announcements, userTeam = null) => {
        const now = new Date();
        
        const filtered = announcements.filter(announcement => {
            // Check if announcement is within date range
            const startDate = announcement.DatumTijdStart ? new Date(announcement.DatumTijdStart) : null;
            const endDate = announcement.DatumTijdEinde ? new Date(announcement.DatumTijdEinde) : null;

            const isActive = (!startDate || startDate <= now) && (!endDate || endDate >= now);

            // Check team targeting
            if (announcement.UitzendenAan && announcement.UitzendenAan.trim()) {
                const targetTeams = announcement.UitzendenAan.split(';').map(team => team.trim());
                
                // If "Alle teams" is in the target list, show to everyone
                if (targetTeams.includes('Alle teams')) {
                    return isActive;
                }
                
                // If user has a team, check if their team is in the target list
                if (userTeam && targetTeams.includes(userTeam)) {
                    return isActive;
                }
                
                // If user's team is not in the target list, hide the announcement
                return false;
            }
            
            // If no targeting specified, show to everyone
            return isActive;
        });
        
        console.log('📝 Filtered', filtered.length, 'announcements for team:', userTeam);
        return filtered;
    };

    const handleCreateAnnouncement = async (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            if (window.NotificationSystem) {
                window.NotificationSystem.error('Gebruikersinformatie niet beschikbaar', 'Fout');
            }
            return;
        }

        try {
            const username = currentUser.LoginName?.split('|')[1] || currentUser.LoginName;
            
            const announcementData = {
                Title: formData.title,
                Aanvulling: formData.description,
                DatumTijdStart: formData.startDate ? new Date(formData.startDate).toISOString() : null,
                DatumTijdEinde: formData.endDate ? new Date(formData.endDate).toISOString() : null,
                UitzendenAan: formData.targetTeams.join('; '),
                username: username
            };

            await createSharePointListItem('Mededeling', announcementData);
            
            // Reset form and reload announcements
            setFormData({
                title: '',
                description: '',
                startDate: '',
                endDate: '',
                targetTeams: []
            });
            if (onCreateFormToggle) onCreateFormToggle(false);
            
            await loadAnnouncements();
            
            if (window.NotificationSystem) {
                window.NotificationSystem.success('Mededeling succesvol aangemaakt', 'Aangemaakt');
            }
            console.log('✅ Announcement created successfully');
        } catch (error) {
            console.error('❌ Error creating announcement:', error);
            if (window.NotificationSystem) {
                window.NotificationSystem.error('Fout bij het aanmaken van de mededeling: ' + error.message, 'Fout opgetreden');
            }
        }
    };

    const handleEditAnnouncement = (announcement) => {
        setEditingAnnouncement(announcement);
        setFormData({
            title: announcement.Title || '',
            description: announcement.Aanvulling || '',
            startDate: announcement.DatumTijdStart ? 
                new Date(announcement.DatumTijdStart).toISOString().slice(0, 16) : '',
            endDate: announcement.DatumTijdEinde ? 
                new Date(announcement.DatumTijdEinde).toISOString().slice(0, 16) : '',
            targetTeams: announcement.UitzendenAan ? 
                announcement.UitzendenAan.split(';').map(team => team.trim()) : []
        });
        setShowEditForm(true);
        if (onCreateFormToggle) onCreateFormToggle(false);
    };

    const handleUpdateAnnouncement = async (e) => {
        e.preventDefault();
        
        if (!editingAnnouncement) return;

        try {
            const updateData = {
                Title: formData.title,
                Aanvulling: formData.description,
                DatumTijdStart: formData.startDate ? new Date(formData.startDate).toISOString() : null,
                DatumTijdEinde: formData.endDate ? new Date(formData.endDate).toISOString() : null,
                UitzendenAan: formData.targetTeams.join('; ')
            };

            await updateSharePointListItem('Mededeling', editingAnnouncement.ID, updateData);
            
            // Reset form and reload announcements
            setFormData({
                title: '',
                description: '',
                startDate: '',
                endDate: '',
                targetTeams: []
            });
            setEditingAnnouncement(null);
            setShowEditForm(false);
            
            await loadAnnouncements();
            
            if (window.NotificationSystem) {
                window.NotificationSystem.success('Mededeling succesvol bijgewerkt', 'Bijgewerkt');
            }
            console.log('✅ Announcement updated successfully');
        } catch (error) {
            console.error('❌ Error updating announcement:', error);
            if (window.NotificationSystem) {
                window.NotificationSystem.error('Fout bij het bijwerken van de mededeling: ' + error.message, 'Fout opgetreden');
            }
        }
    };

    const handleDeleteAnnouncement = async (announcement) => {
        if (!canManageAnnouncements) {
            if (window.NotificationSystem) {
                window.NotificationSystem.error('Je hebt geen rechten om mededelingen te verwijderen.', 'Toegang geweigerd');
            }
            return;
        }

        // Simple confirmation using confirm() - could be enhanced with modal later
        if (confirm(`Weet je zeker dat je de mededeling "${announcement.Title}" wilt verwijderen?`)) {
            try {
                await deleteSharePointListItem('Mededeling', announcement.ID);
                await loadAnnouncements();
                
                if (window.NotificationSystem) {
                    window.NotificationSystem.success('Mededeling succesvol verwijderd', 'Verwijderd');
                }
                console.log('✅ Announcement deleted successfully');
            } catch (error) {
                console.error('❌ Error deleting announcement:', error);
                if (window.NotificationSystem) {
                    window.NotificationSystem.error('Fout bij het verwijderen van de mededeling: ' + error.message, 'Fout opgetreden');
                }
            }
        }
    };

    const handleCancelEdit = () => {
        setEditingAnnouncement(null);
        setShowEditForm(false);
        setFormData({
            title: '',
            description: '',
            startDate: '',
            endDate: '',
            targetTeams: []
        });
    };

    const handleTeamToggle = (teamName) => {
        setFormData(prev => {
            let newTargetTeams;
            
            if (teamName === 'Alle teams') {
                // If "Alle teams" is selected, clear all other selections
                newTargetTeams = prev.targetTeams.includes('Alle teams') 
                    ? [] 
                    : ['Alle teams'];
            } else {
                // If a specific team is selected, remove "Alle teams" and toggle the team
                const withoutAlleTeams = prev.targetTeams.filter(t => t !== 'Alle teams');
                newTargetTeams = withoutAlleTeams.includes(teamName)
                    ? withoutAlleTeams.filter(t => t !== teamName)
                    : [...withoutAlleTeams, teamName];
            }
            
            console.log('📝 Team toggle:', teamName, 'New selection:', newTargetTeams);
            
            return {
                ...prev,
                targetTeams: newTargetTeams
            };
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('nl-NL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    if (loading) {
        return h('div', { className: 'mededelingen-container loading' },
            h('div', { className: 'loading-spinner' }),
            h('span', null, 'Mededelingen laden...')
        );
    }

    // Hide the mededelingen-container completely until we have an active broadcast or creating one
    if (announcements.length === 0 && !showCreateForm) {
        return null;
    }

    return h('div', { className: 'mededelingen-container' },
        // Header with title only (button moved to main header)
        h('div', { className: 'mededelingen-header' },
            h('h3', { className: 'mededelingen-title' },
                h('i', { className: 'fas fa-bullhorn' }),
                ' Mededelingen'
            )
        ),

        // Create form (if visible)
        showCreateForm && h('div', { className: 'announcement-form-container' },
            h('form', { className: 'announcement-form', onSubmit: handleCreateAnnouncement },
                h('div', { className: 'form-group' },
                    h('label', { htmlFor: 'announcement-title' }, 'Titel:'),
                    h('input', {
                        id: 'announcement-title',
                        type: 'text',
                        value: formData.title,
                        onChange: (e) => setFormData(prev => ({ ...prev, title: e.target.value })),
                        required: true,
                        placeholder: 'Titel van de mededeling'
                    })
                ),
                h('div', { className: 'form-group' },
                    h('label', { htmlFor: 'announcement-description' }, 'Beschrijving:'),
                    h('textarea', {
                        id: 'announcement-description',
                        value: formData.description,
                        onChange: (e) => setFormData(prev => ({ ...prev, description: e.target.value })),
                        required: true,
                        placeholder: 'Inhoud van de mededeling',
                        rows: 3
                    })
                ),
                h('div', { className: 'form-row' },
                    h('div', { className: 'form-group' },
                        h('label', { htmlFor: 'announcement-start' }, 'Startdatum:'),
                        h('input', {
                            id: 'announcement-start',
                            type: 'datetime-local',
                            value: formData.startDate,
                            onChange: (e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))
                        })
                    ),
                    h('div', { className: 'form-group' },
                        h('label', { htmlFor: 'announcement-end' }, 'Einddatum:'),
                        h('input', {
                            id: 'announcement-end',
                            type: 'datetime-local',
                            value: formData.endDate,
                            onChange: (e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))
                        })
                    )
                ),
                h('div', { className: 'form-group' },
                    h('label', null, 'Doelgroep teams:'),
                    h('div', { className: 'team-checkboxes' },
                        teams.length > 0 ? teams.map(team => 
                            h('label', { 
                                key: team.Id || team.ID || team.Naam,
                                className: 'team-checkbox'
                            },
                                h('input', {
                                    type: 'checkbox',
                                    checked: formData.targetTeams.includes(team.Naam),
                                    onChange: () => handleTeamToggle(team.Naam)
                                }),
                                h('span', null, team.Naam)
                            )
                        ) : h('div', { style: { color: '#666', fontSize: '0.9em' } }, 'Geen teams beschikbaar...'),
                        h('label', { className: 'team-checkbox' },
                            h('input', {
                                type: 'checkbox',
                                checked: formData.targetTeams.includes('Alle teams'),
                                onChange: () => handleTeamToggle('Alle teams')
                            }),
                            h('span', null, 'Alle teams')
                        )
                    )
                ),
                h('div', { className: 'form-actions' },
                    h('button', {
                        type: 'button',
                        className: 'btn-cancel',
                        onClick: () => onCreateFormToggle && onCreateFormToggle(false)
                    }, 'Annuleren'),
                    h('button', {
                        type: 'submit',
                        className: 'btn-submit'
                    }, 'Aanmaken')
                )
            )
        ),

        // Edit form (if visible)
        showEditForm && h('div', { className: 'announcement-form-container' },
            h('form', { className: 'announcement-form', onSubmit: handleUpdateAnnouncement },
                h('div', { className: 'form-group' },
                    h('label', { htmlFor: 'edit-announcement-title' }, 'Titel:'),
                    h('input', {
                        id: 'edit-announcement-title',
                        type: 'text',
                        value: formData.title,
                        onChange: (e) => setFormData(prev => ({ ...prev, title: e.target.value })),
                        required: true,
                        placeholder: 'Titel van de mededeling'
                    })
                ),
                h('div', { className: 'form-group' },
                    h('label', { htmlFor: 'edit-announcement-description' }, 'Beschrijving:'),
                    h('textarea', {
                        id: 'edit-announcement-description',
                        value: formData.description,
                        onChange: (e) => setFormData(prev => ({ ...prev, description: e.target.value })),
                        required: true,
                        placeholder: 'Inhoud van de mededeling',
                        rows: 3
                    })
                ),
                h('div', { className: 'form-row' },
                    h('div', { className: 'form-group' },
                        h('label', { htmlFor: 'edit-announcement-start' }, 'Startdatum:'),
                        h('input', {
                            id: 'edit-announcement-start',
                            type: 'datetime-local',
                            value: formData.startDate,
                            onChange: (e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))
                        })
                    ),
                    h('div', { className: 'form-group' },
                        h('label', { htmlFor: 'edit-announcement-end' }, 'Einddatum:'),
                        h('input', {
                            id: 'edit-announcement-end',
                            type: 'datetime-local',
                            value: formData.endDate,
                            onChange: (e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))
                        })
                    )
                ),
                h('div', { className: 'form-group' },
                    h('label', null, 'Doelgroep:'),
                    h('div', { className: 'team-checkboxes' },
                        teams.length > 0 ? teams.map(team => 
                            h('label', { 
                                key: team.Id || team.ID || team.Naam,
                                className: 'team-checkbox'
                            },
                                h('input', {
                                    type: 'checkbox',
                                    checked: formData.targetTeams.includes(team.Naam),
                                    onChange: () => handleTeamToggle(team.Naam)
                                }),
                                h('span', null, team.Naam)
                            )
                        ) : h('div', { style: { color: '#666', fontSize: '0.9em' } }, 'Geen teams beschikbaar...'),
                        h('label', { className: 'team-checkbox' },
                            h('input', {
                                type: 'checkbox',
                                checked: formData.targetTeams.includes('Alle teams'),
                                onChange: () => handleTeamToggle('Alle teams')
                            }),
                            h('span', null, 'Alle teams')
                        )
                    )
                ),
                h('div', { className: 'form-actions' },
                    h('button', {
                        type: 'button',
                        className: 'btn-cancel',
                        onClick: handleCancelEdit
                    }, 'Annuleren'),
                    h('button', {
                        type: 'submit',
                        className: 'btn-submit'
                    }, 'Bijwerken')
                )
            )
        ),

        // Active announcements
        announcements.length > 0 && h('div', { className: 'announcements-list' },
            announcements.map(announcement => 
                h('div', { 
                    key: announcement.ID || announcement.Id,
                    className: 'announcement-item'
                },
                    h('div', { className: 'announcement-content' },
                        h('h4', { className: 'announcement-title' }, announcement.Title),
                        h('div', { 
                            className: 'announcement-description',
                            dangerouslySetInnerHTML: { __html: escapeHtmlWithNewlines(announcement.Aanvulling || '') }
                        }),
                        h('div', { className: 'announcement-meta' },
                            announcement.DatumTijdStart && h('span', { className: 'announcement-date' },
                                h('i', { className: 'fas fa-calendar' }),
                                ` Vanaf: ${formatDate(announcement.DatumTijdStart)}`
                            ),
                            announcement.DatumTijdEinde && h('span', { className: 'announcement-date' },
                                h('i', { className: 'fas fa-calendar-times' }),
                                ` Tot: ${formatDate(announcement.DatumTijdEinde)}`
                            ),
                            announcement.UitzendenAan && h('span', { className: 'announcement-audience' },
                                h('i', { className: 'fas fa-users' }),
                                ' Voor: ',
                                h('span', { 
                                    dangerouslySetInnerHTML: { __html: escapeHtmlWithNewlines(announcement.UitzendenAan) } 
                                })
                            )
                        )
                    ),
                    // Action buttons (only for privileged users)
                    canManageAnnouncements && h('div', { className: 'announcement-actions' },
                        h('button', {
                            className: 'btn-edit',
                            onClick: () => handleEditAnnouncement(announcement),
                            title: 'Bewerken'
                        },
                            h('i', { className: 'fas fa-edit' })
                        ),
                        h('button', {
                            className: 'btn-delete',
                            onClick: () => handleDeleteAnnouncement(announcement),
                            title: 'Verwijderen'
                        },
                            h('i', { className: 'fas fa-trash' })
                        )
                    )
                )
            )
        )
    );
};

/**
 * Create Announcement Button Component
 * @param {Object} props - Component props
 * @param {Function} props.onCreateClick - Callback when create button is clicked
 * @param {boolean} props.canManage - Whether user can manage announcements
 */
export const CreateAnnouncementButton = ({ onCreateClick, canManage }) => {
    if (!canManage) return null;
    
    return h('button', {
        className: 'btn-create-announcement',
        onClick: onCreateClick,
        title: 'Nieuwe mededeling aanmaken'
    },
        h('i', { className: 'fas fa-plus' }),
        ' Nieuwe mededeling'
    );
};

export default Mededelingen;

console.log('✅ Mededelingen component loaded successfully.');