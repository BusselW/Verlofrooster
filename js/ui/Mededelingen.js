/**
 * @file Mededelingen.js
 * @description Component for displaying and managing announcements/mededelingen
 * Shows active announcements based on date range and target audience
 * Provides interface for privileged users to create new announcements
 */

import { fetchSharePointList, createSharePointListItem } from '../services/sharepointService.js';

const { createElement: h, useState, useEffect } = window.React;
const { createPortal } = window.ReactDOM;

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

/**
 * Create Announcement Form Component - Renders in Portal
 */
const CreateAnnouncementForm = ({ onClose, onSave, teams = [] }) => {
    const [formData, setFormData] = useState({
        Title: '',
        Body: '',
        DatumTijdStart: '',
        DatumTijdEinde: '',
        UitzendenAan: 'Iedereen'
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.Title?.trim()) {
            setError('Titel is verplicht');
            return;
        }
        
        if (!formData.Body?.trim()) {
            setError('Bericht is verplicht');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            const announcementData = {
                Title: formData.Title.trim(),
                Body: formData.Body.trim(),
                DatumTijdStart: formData.DatumTijdStart || null,
                DatumTijdEinde: formData.DatumTijdEinde || null,
                UitzendenAan: formData.UitzendenAan
            };

            await createSharePointListItem('Mededeling', announcementData);
            
            if (onSave) await onSave();
            onClose();
        } catch (err) {
            console.error('Error creating announcement:', err);
            setError('Fout bij opslaan: ' + (err.message || 'Onbekende fout'));
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (error) setError(null);
    };

    // ✅ Render modal content
    const modalContent = h('div', {
        style: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,  // ✅ Very high z-index
            padding: '20px'
        },
        onClick: (e) => {
            if (e.target === e.currentTarget) onClose();
        }
    },
        h('div', {
            style: {
                backgroundColor: 'white',
                borderRadius: '8px',
                maxWidth: '95%',
                width: '100%',
                maxHeight: '85vh',
                overflow: 'auto',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            },
            onClick: (e) => e.stopPropagation()  // ✅ Prevent close when clicking inside
        },
            // Header
            h('div', {
                style: {
                    padding: '12px 16px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }
            },
                h('h2', {
                    style: {
                        margin: 0,
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#111827',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }
                },
                    h('i', { 
                        className: 'fas fa-bullhorn',
                        style: { color: '#3b82f6' }
                    }),
                    'Nieuwe Mededeling'
                ),
                h('button', {
                    onClick: onClose,
                    style: {
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        color: '#6b7280',
                        cursor: 'pointer',
                        padding: '4px',
                        lineHeight: 1
                    },
                    title: 'Sluiten'
                }, '×')
            ),
            
            // Form
            h('form', {
                onSubmit: handleSubmit,
                style: { padding: '16px' }
            },
                // Error message
                error && h('div', {
                    style: {
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        marginBottom: '12px',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }
                },
                    h('i', { className: 'fas fa-exclamation-circle' }),
                    error
                ),

                // Title
                h('div', { style: { marginBottom: '12px' } },
                    h('label', {
                        style: {
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '4px'
                        }
                    },
                        'Titel ',
                        h('span', { style: { color: '#dc2626' } }, '*')
                    ),
                    h('input', {
                        type: 'text',
                        value: formData.Title,
                        onChange: (e) => updateField('Title', e.target.value),
                        placeholder: 'Bijv: Belangrijke Mededeling',
                        style: {
                            width: '100%',
                            padding: '6px 10px',
                            fontSize: '13px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                        },
                        onFocus: (e) => e.target.style.borderColor = '#3b82f6',
                        onBlur: (e) => e.target.style.borderColor = '#d1d5db'
                    })
                ),

                // Body
                h('div', { style: { marginBottom: '12px' } },
                    h('label', {
                        style: {
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '4px'
                        }
                    },
                        'Bericht ',
                        h('span', { style: { color: '#dc2626' } }, '*')
                    ),
                    h('textarea', {
                        value: formData.Body,
                        onChange: (e) => updateField('Body', e.target.value),
                        placeholder: 'Typ hier je bericht... (HTML ondersteund)',
                        rows: 4,
                        style: {
                            width: '100%',
                            padding: '6px 10px',
                            fontSize: '13px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            outline: 'none',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            transition: 'border-color 0.2s'
                        },
                        onFocus: (e) => e.target.style.borderColor = '#3b82f6',
                        onBlur: (e) => e.target.style.borderColor = '#d1d5db'
                    }),
                    h('p', {
                        style: {
                            fontSize: '11px',
                            color: '#6b7280',
                            marginTop: '4px',
                            margin: '4px 0 0 0'
                        }
                    }, 'Je kunt HTML gebruiken voor opmaak')
                ),

                // Date range and audience in one row
                h('div', {
                    style: {
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '12px',
                        marginBottom: '16px'
                    }
                },
                    // Start date
                    h('div', null,
                        h('label', {
                            style: {
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: '500',
                                color: '#374151',
                                marginBottom: '4px'
                            }
                        }, 'Zichtbaar vanaf'),
                        h('input', {
                            type: 'datetime-local',
                            value: formData.DatumTijdStart,
                            onChange: (e) => updateField('DatumTijdStart', e.target.value),
                            style: {
                                width: '100%',
                                padding: '6px 10px',
                                fontSize: '13px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                outline: 'none'
                            }
                        })
                    ),
                    // End date
                    h('div', null,
                        h('label', {
                            style: {
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: '500',
                                color: '#374151',
                                marginBottom: '4px'
                            }
                        }, 'Zichtbaar tot'),
                        h('input', {
                            type: 'datetime-local',
                            value: formData.DatumTijdEinde,
                            onChange: (e) => updateField('DatumTijdEinde', e.target.value),
                            style: {
                                width: '100%',
                                padding: '6px 10px',
                                fontSize: '13px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                outline: 'none'
                            }
                        })
                    ),
                    // Target audience - moved into same row
                    h('div', null,
                        h('label', {
                            style: {
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: '500',
                                color: '#374151',
                                marginBottom: '4px'
                            }
                        }, 'Doelgroep'),
                        h('select', {
                            value: formData.UitzendenAan,
                            onChange: (e) => updateField('UitzendenAan', e.target.value),
                            style: {
                                width: '100%',
                                padding: '6px 10px',
                                fontSize: '13px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                outline: 'none',
                                backgroundColor: 'white',
                                cursor: 'pointer'
                            }
                        },
                            h('option', { value: 'Iedereen' }, 'Iedereen'),
                            Array.isArray(teams) ? teams.map(team => {
                                const teamName = typeof team === 'string' ? team : (team.naam || team.Naam || team.name || 'Onbekend Team');
                                const teamId = typeof team === 'string' ? team : (team.id || teamName);
                                
                                return h('option', { 
                                    key: teamId, 
                                    value: teamName 
                                }, teamName);
                            }) : null
                        )
                    )
                ),

                // Actions
                h('div', {
                    style: {
                        display: 'flex',
                        gap: '8px',
                        justifyContent: 'flex-end',
                        paddingTop: '12px',
                        borderTop: '1px solid #e5e7eb'
                    }
                },
                    h('button', {
                        type: 'button',
                        onClick: onClose,
                        disabled: saving,
                        style: {
                            padding: '6px 16px',
                            fontSize: '13px',
                            fontWeight: '500',
                            color: '#374151',
                            backgroundColor: '#f3f4f6',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            opacity: saving ? 0.5 : 1
                        }
                    }, 'Annuleren'),
                    h('button', {
                        type: 'submit',
                        disabled: saving,
                        style: {
                            padding: '6px 16px',
                            fontSize: '13px',
                            fontWeight: '500',
                            color: 'white',
                            backgroundColor: '#3b82f6',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            opacity: saving ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }
                    },
                        saving && h('i', { className: 'fas fa-spinner fa-spin' }),
                        saving ? 'Opslaan...' : 'Opslaan'
                    )
                )
            )
        )
    );

    // ✅ Render in portal to document.body (outside any parent containers)
    return createPortal(modalContent, document.body);
};

const Mededelingen = ({ teams, medewerkers, showCreateForm, onCreateFormToggle }) => {
    const [mededelingen, setMededelingen] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        loadMededelingen();
    }, []);

    const loadMededelingen = async () => {
        try {
            setLoading(true);
            const data = await fetchSharePointList('Mededeling');
            
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

    const handleCreateClick = () => {
        setShowForm(true);
        if (onCreateFormToggle) onCreateFormToggle(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        if (onCreateFormToggle) onCreateFormToggle(false);
    };

    const handleSave = async () => {
        await loadMededelingen(); // Reload announcements after save
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

    // ✅ Show form when showCreateForm prop is true OR internal showForm is true
    if (showCreateForm || showForm) {
        return h(CreateAnnouncementForm, {
            onClose: handleCloseForm,
            onSave: handleSave,
            teams: teams || []
        });
    }

    // Return null (hidden) if no announcements
    if (!mededelingen || mededelingen.length === 0) {
        return null;
    }

    return h('div', { 
        className: 'mededelingen-container',
        style: {
            width: '100%',
            margin: '0 0 16px 0',
            padding: '0'
        }
    },
        // Section header
        h('div', {
            style: {
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
                paddingBottom: '6px',
                borderBottom: '2px solid #e5e7eb'
            }
        },
            h('i', { 
                className: 'fas fa-bullhorn',
                style: { 
                    color: '#3b82f6',
                    fontSize: '16px'
                }
            }),
            h('h3', {
                style: {
                    margin: 0,
                    fontSize: '16px',
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
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }
        },
            mededelingen.map(m => {
                const createdDate = m.Created ? new Date(m.Created) : null;
                const formattedDate = createdDate ? createdDate.toLocaleDateString('nl-NL', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }) : 'Onbekende datum';

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
                        borderRadius: '6px',
                        padding: '10px 12px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                        borderLeft: '3px solid #3b82f6',
                        transition: 'all 0.2s ease',
                        cursor: 'default'
                    },
                    onMouseEnter: (e) => {
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.12)';
                        e.currentTarget.style.transform = 'translateX(2px)';
                    },
                    onMouseLeave: (e) => {
                        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.08)';
                        e.currentTarget.style.transform = 'translateX(0)';
                    }
                },
                    h('div', { 
                        className: 'mededeling-header',
                        style: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '8px',
                            gap: '12px'
                        }
                    },
                        h('h4', { 
                            style: { 
                                margin: 0,
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#111827',
                                flex: 1
                            } 
                        }, m.Title || 'Mededeling'),
                        h('div', {
                            style: {
                                display: 'flex',
                                gap: '6px',
                                alignItems: 'center'
                            }
                        },
                            h('span', {
                                style: {
                                    fontSize: '11px',
                                    color: '#6b7280',
                                    backgroundColor: '#f3f4f6',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    whiteSpace: 'nowrap',
                                    fontWeight: '500'
                                }
                            }, formattedDate.split(' ').slice(0, 3).join(' ')),
                            // Edit button
                            h('button', {
                                onClick: (e) => {
                                    e.stopPropagation();
                                    console.log('Edit mededeling:', m.ID);
                                    // TODO: Implement edit functionality
                                },
                                title: 'Bewerken',
                                style: {
                                    background: 'none',
                                    border: 'none',
                                    color: '#6b7280',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'all 0.2s'
                                },
                                onMouseEnter: (e) => {
                                    e.currentTarget.style.backgroundColor = '#eff6ff';
                                    e.currentTarget.style.color = '#2563eb';
                                },
                                onMouseLeave: (e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = '#6b7280';
                                }
                            },
                                h('i', { 
                                    className: 'fas fa-edit',
                                    style: { fontSize: '12px' }
                                })
                            ),
                            // Delete button
                            h('button', {
                                onClick: async (e) => {
                                    e.stopPropagation();
                                    if (confirm('Weet je zeker dat je deze mededeling wilt verwijderen?')) {
                                        try {
                                            const { deleteSharePointListItem } = await import('../services/sharepointService.js');
                                            await deleteSharePointListItem('Mededeling', m.ID);
                                            console.log('Mededeling verwijderd:', m.ID);
                                            // Reload announcements
                                            const loadMededelingenFn = async () => {
                                                const { fetchSharePointList } = await import('../services/sharepointService.js');
                                                const data = await fetchSharePointList('Mededeling');
                                                const now = new Date();
                                                const activeMededelingen = (data || []).filter(med => {
                                                    const start = med.DatumTijdStart ? new Date(med.DatumTijdStart) : null;
                                                    const end = med.DatumTijdEinde ? new Date(med.DatumTijdEinde) : null;
                                                    if (start && now < start) return false;
                                                    if (end && now > end) return false;
                                                    return true;
                                                });
                                                setMededelingen(activeMededelingen);
                                            };
                                            await loadMededelingenFn();
                                        } catch (err) {
                                            console.error('Error deleting announcement:', err);
                                            alert('Fout bij verwijderen: ' + err.message);
                                        }
                                    }
                                },
                                title: 'Verwijderen',
                                style: {
                                    background: 'none',
                                    border: 'none',
                                    color: '#6b7280',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'all 0.2s'
                                },
                                onMouseEnter: (e) => {
                                    e.currentTarget.style.backgroundColor = '#fef2f2';
                                    e.currentTarget.style.color = '#dc2626';
                                },
                                onMouseLeave: (e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = '#6b7280';
                                }
                            },
                                h('i', { 
                                    className: 'fas fa-trash',
                                    style: { fontSize: '12px' }
                                })
                            )
                        )
                    ),
                    h('div', { 
                        className: 'mededeling-body',
                        style: {
                            fontSize: '13px',
                            lineHeight: '1.5',
                            color: '#374151',
                            marginBottom: '8px'
                        },
                        dangerouslySetInnerHTML: { 
                            __html: m.Body || '' 
                        }
                    }),
                    m.username || showFromDate || showUntilDate || m.UitzendenAan ? h('div', {
                        className: 'mededeling-footer',
                        style: {
                            display: 'flex',
                            gap: '8px',
                            fontSize: '11px',
                            color: '#6b7280',
                            paddingTop: '8px',
                            borderTop: '1px solid #f3f4f6',
                            flexWrap: 'wrap'
                        }
                    },
                        m.username && h('span', {
                            style: { 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                backgroundColor: '#f9fafb',
                                padding: '2px 6px',
                                borderRadius: '4px'
                            }
                        },
                            h('i', { className: 'fas fa-user', style: { fontSize: '9px' } }),
                            m.username.split('\\').pop() || m.username
                        ),
                        showFromDate && h('span', {
                            style: { 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                backgroundColor: '#f0fdf4',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                color: '#15803d'
                            }
                        },
                            h('i', { className: 'fas fa-calendar-check', style: { fontSize: '9px' } }),
                            showFromDate
                        ),
                        showUntilDate && h('span', {
                            style: { 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                backgroundColor: '#fef2f2',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                color: '#991b1b'
                            }
                        },
                            h('i', { className: 'fas fa-calendar-times', style: { fontSize: '9px' } }),
                            showUntilDate
                        ),
                        m.UitzendenAan && h('span', {
                            style: { 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                backgroundColor: '#eff6ff',
                                padding: '2px 6px',
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