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
        title: 'Mededeling aanmaken',
        style: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
        },
        onMouseEnter: (e) => {
            e.target.style.backgroundColor = '#2563eb';
            e.target.style.boxShadow = '0 4px 6px rgba(59, 130, 246, 0.3)';
            e.target.style.transform = 'translateY(-1px)';
        },
        onMouseLeave: (e) => {
            e.target.style.backgroundColor = '#3b82f6';
            e.target.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
            e.target.style.transform = 'translateY(0)';
        }
    },
        h('i', { 
            className: 'fas fa-bullhorn',
            style: { fontSize: '14px' }
        }),
        'Nieuwe Mededeling'
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
        return h('div', { 
            className: 'mededelingen-container',
            style: {
                padding: '16px',
                textAlign: 'center'
            }
        },
            h('div', {
                style: {
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#6b7280',
                    fontSize: '14px'
                }
            },
                h('i', { 
                    className: 'fas fa-spinner fa-spin',
                    style: { fontSize: '14px' }
                }),
                'Mededelingen laden...'
            )
        );
    }

    // ✅ FIX 1: Return null (hidden) if no announcements
    if (!mededelingen || mededelingen.length === 0) {
        return null;
    }

    return h('div', { 
        className: 'mededelingen-container',
        style: {
            maxWidth: '1200px',
            margin: '0 auto 24px',
            padding: '0 16px'
        }
    },
        // Optional: Section header
        h('div', {
            style: {
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
                paddingBottom: '8px',
                borderBottom: '2px solid #e5e7eb'
            }
        },
            h('i', { 
                className: 'fas fa-bullhorn',
                style: { 
                    color: '#3b82f6',
                    fontSize: '18px'
                }
            }),
            h('h3', {
                style: {
                    margin: 0,
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#111827'
                }
            }, 'Mededelingen'),
            h('span', {
                style: {
                    marginLeft: 'auto',
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                }
            }, mededelingen.length)
        ),
        
        // Announcements grid
        h('div', {
            className: 'mededelingen-grid',
            style: {
                display: 'grid',
                gap: '16px',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))'
            }
        },
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
                        borderRadius: '12px',
                        padding: '20px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        borderLeft: '4px solid #3b82f6',
                        transition: 'all 0.2s ease',
                        cursor: 'default'
                    },
                    onMouseEnter: (e) => {
                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    },
                    onMouseLeave: (e) => {
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }
                },
                    // Header
                    h('div', { 
                        className: 'mededeling-header',
                        style: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '16px',
                            gap: '12px'
                        }
                    },
                        h('h4', { 
                            style: { 
                                margin: 0,
                                fontSize: '18px',
                                fontWeight: '600',
                                color: '#111827',
                                flex: 1
                            } 
                        }, m.Title || 'Mededeling'),
                        
                        // Datum badge
                        h('span', {
                            style: {
                                fontSize: '11px',
                                color: '#6b7280',
                                backgroundColor: '#f3f4f6',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                whiteSpace: 'nowrap',
                                fontWeight: '500'
                            }
                        }, formattedDate.split(' ').slice(0, 3).join(' ')) // Shortened date
                    ),
                    
                    // ✅ Body met HTML rendering
                    h('div', { 
                        className: 'mededeling-body',
                        style: {
                            fontSize: '14px',
                            lineHeight: '1.6',
                            color: '#374151',
                            marginBottom: '16px'
                        },
                        dangerouslySetInnerHTML: { 
                            __html: m.Body || '' 
                        }
                    }),
                    
                    // Footer met metadata
                    m.username || showFromDate || showUntilDate || m.UitzendenAan ? h('div', {
                        className: 'mededeling-footer',
                        style: {
                            display: 'flex',
                            gap: '12px',
                            fontSize: '11px',
                            color: '#6b7280',
                            paddingTop: '12px',
                            borderTop: '1px solid #e5e7eb',
                            flexWrap: 'wrap'
                        }
                    },
                        // Auteur
                        m.username && h('span', {
                            style: { 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                backgroundColor: '#f9fafb',
                                padding: '4px 8px',
                                borderRadius: '4px'
                            }
                        },
                            h('i', { className: 'fas fa-user', style: { fontSize: '9px' } }),
                            m.username.split('\\').pop() || m.username
                        ),
                        
                        // Zichtbaar vanaf
                        showFromDate && h('span', {
                            style: { 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                backgroundColor: '#f0fdf4',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                color: '#15803d'
                            }
                        },
                            h('i', { className: 'fas fa-calendar-check', style: { fontSize: '9px' } }),
                            showFromDate
                        ),
                        
                        // Zichtbaar tot
                        showUntilDate && h('span', {
                            style: { 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                backgroundColor: '#fef2f2',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                color: '#991b1b'
                            }
                        },
                            h('i', { className: 'fas fa-calendar-times', style: { fontSize: '9px' } }),
                            showUntilDate
                        ),
                        
                        // Doelgroep
                        m.UitzendenAan && h('span', {
                            style: { 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                backgroundColor: '#eff6ff',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                color: '#1e40af'
                            }
                        },
                            h('i', { className: 'fas fa-users', style: { fontSize: '9px' } }),
                            m.UitzendenAan
                        )
                    ) : null
                );
            })
        )
    );
};

export default Mededelingen;