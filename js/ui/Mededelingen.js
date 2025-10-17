/**
 * @file Mededelingen.js
 * @description Component for displaying and managing announcements/mededelingen
 * Shows active announcements based on date range and target audience
 * Provides interface for privileged users to create new announcements
 */

import { fetchSharePointList, createSharePointListItem } from '../services/sharepointService.js';

const { createElement: h, useState, useEffect } = window.React;

/**
 * Create Announcement Button Component
 * @param {Object} props - Component props
 * @param {Function} props.onCreateClick - Callback when create button is clicked
 * @param {boolean} props.canManage - Whether user can manage announcements
 */
export const CreateAnnouncementButton = ({ onCreateClick, canManage }) => {
    if (!canManage) return null;
    
    return h('button', {
        className: 'btn btn-announcement',
        onClick: onCreateClick,
        title: 'Mededeling aanmaken'
    },
        h('i', { className: 'fas fa-bullhorn' }),
        'Mededeling'
    );
};

const Mededelingen = ({ teams, medewerkers, showCreateForm, onCreateFormToggle }) => {
    const [mededelingen, setMededelingen] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMededelingen();
    }, []);

    const loadMededelingen = async () => {
        try {
            setLoading(true);
            const data = await fetchSharePointList('Mededelingen');
            
            // Filter active announcements (between start and end date)
            const now = new Date();
            const activeMededelingen = (data || []).filter(m => {
                const startDate = m.DatumTijdStart ? new Date(m.DatumTijdStart) : null;
                const endDate = m.DatumTijdEinde ? new Date(m.DatumTijdEinde) : null;
                
                // Show if no dates set, or if current date is between start and end
                if (!startDate && !endDate) return true;
                if (startDate && !endDate) return now >= startDate;
                if (!startDate && endDate) return now <= endDate;
                return now >= startDate && now <= endDate;
            });
            
            setMededelingen(activeMededelingen);
        } catch (error) {
            console.error('Error loading mededelingen:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return h('div', { className: 'mededelingen-container' },
            h('p', { style: { textAlign: 'center', color: '#6b7280' } }, 'Mededelingen laden...')
        );
    }

    if (!mededelingen || mededelingen.length === 0) {
        return h('div', { className: 'mededelingen-container' },
            h('p', { className: 'geen-mededelingen' }, 'Geen actieve mededelingen')
        );
    }

    return h('div', { className: 'mededelingen-container' },
        mededelingen.map(m => {
            // ✅ Format datum correct
            const createdDate = m.Created ? new Date(m.Created) : null;
            const formattedDate = createdDate ? createdDate.toLocaleDateString('nl-NL', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : 'Onbekende datum';

            // ✅ Format start/eind datum
            const startDate = m.DatumTijdStart ? new Date(m.DatumTijdStart) : null;
            const endDate = m.DatumTijdEinde ? new Date(m.DatumTijdEinde) : null;
            
            const showFromDate = startDate ? startDate.toLocaleDateString('nl-NL', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }) : null;
            
            const showUntilDate = endDate ? endDate.toLocaleDateString('nl-NL', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }) : null;

            return h('div', { 
                key: m.ID, 
                className: 'mededeling-card',
                style: {
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '12px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    borderLeft: '4px solid #3b82f6'
                }
            },
                // Header
                h('div', { 
                    className: 'mededeling-header',
                    style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '12px'
                    }
                },
                    h('h4', { 
                        style: { 
                            margin: 0,
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#111827'
                        } 
                    }, m.Title || 'Mededeling'),
                    
                    // Datum badge
                    h('span', {
                        style: {
                            fontSize: '12px',
                            color: '#6b7280',
                            backgroundColor: '#f3f4f6',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            whiteSpace: 'nowrap'
                        }
                    }, formattedDate)
                ),
                
                // ✅ BELANGRIJKSTE FIX: Body met HTML rendering
                h('div', { 
                    className: 'mededeling-body',
                    style: {
                        fontSize: '14px',
                        lineHeight: '1.6',
                        color: '#374151',
                        marginBottom: '12px'
                    },
                    dangerouslySetInnerHTML: { 
                        __html: m.Body || '' 
                    }
                }),
                
                // Footer met metadata
                h('div', {
                    className: 'mededeling-footer',
                    style: {
                        display: 'flex',
                        gap: '16px',
                        fontSize: '12px',
                        color: '#6b7280',
                        paddingTop: '12px',
                        borderTop: '1px solid #e5e7eb',
                        flexWrap: 'wrap'
                    }
                },
                    // Auteur
                    m.username && h('span', {
                        style: { display: 'flex', alignItems: 'center', gap: '4px' }
                    },
                        h('i', { className: 'fas fa-user', style: { fontSize: '10px' } }),
                        m.username.split('\\').pop() || m.username
                    ),
                    
                    // Zichtbaar vanaf
                    showFromDate && h('span', {
                        style: { display: 'flex', alignItems: 'center', gap: '4px' }
                    },
                        h('i', { className: 'fas fa-calendar-check', style: { fontSize: '10px' } }),
                        `Vanaf: ${showFromDate}`
                    ),
                    
                    // Zichtbaar tot
                    showUntilDate && h('span', {
                        style: { display: 'flex', alignItems: 'center', gap: '4px' }
                    },
                        h('i', { className: 'fas fa-calendar-times', style: { fontSize: '10px' } }),
                        `Tot: ${showUntilDate}`
                    ),
                    
                    // Doelgroep
                    m.UitzendenAan && h('span', {
                        style: { display: 'flex', alignItems: 'center', gap: '4px' }
                    },
                        h('i', { className: 'fas fa-users', style: { fontSize: '10px' } }),
                        m.UitzendenAan
                    )
                )
            );
        })
    );
};

export default Mededelingen;