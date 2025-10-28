import { updateFeedbackItem, deleteFeedbackItem } from '../services/sp-service.js';
import { config } from '../config/config.js';

const { useState, createElement: h } = React;

const FeedbackItem = ({ item, isPrivileged, onUpdate }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [newReactie, setNewReactie] = useState('');

    const toggleExpand = () => setIsExpanded(!isExpanded);

    const handleDelete = async () => {
        if (confirm('Weet je zeker dat je deze melding wilt verwijderen?')) {
            try {
                await deleteFeedbackItem(item.Id);
                onUpdate();
            } catch (error) {
                console.error('Fout bij verwijderen:', error);
                alert('Fout bij verwijderen: ' + error.message);
            }
        }
    };

    const handleReactieSubmit = async () => {
        if (!newReactie.trim()) {
            alert('Reactie mag niet leeg zijn.');
            return;
        }

        try {
            const currentReactie = item.Reactie || '';
            const timestamp = new Date().toLocaleString('nl-NL');
            const updatedReactie = currentReactie 
                ? `${currentReactie}\n\n---\n\n[${timestamp}]\n${newReactie}`
                : `[${timestamp}]\n${newReactie}`;

            await updateFeedbackItem(item.Id, { Reactie: updatedReactie });
            setNewReactie('');
            onUpdate();
        } catch (error) {
            console.error('Fout bij toevoegen van reactie:', error);
            alert('Fout bij toevoegen van reactie: ' + error.message);
        }
    };

    const handleStatusChange = async (e) => {
        try {
            await updateFeedbackItem(item.Id, { Status: e.target.value });
            onUpdate();
        } catch (error) {
            console.error('Fout bij status wijzigen:', error);
            alert('Fout bij status wijzigen: ' + error.message);
        }
    };

    const renderReacties = () => {
        if (!item.Reactie) return null;
        
        const reacties = item.Reactie.split('\n\n---\n\n');
        
        return reacties.map((reactie, index) => {
            const lines = reactie.split('\n');
            const timestampMatch = lines[0].match(/\[(.*)\]/);
            const timestamp = timestampMatch ? timestampMatch[1] : 'Onbekende datum';
            const text = timestampMatch ? lines.slice(1).join('\n') : reactie;

            return h('div', { 
                key: index, 
                className: 'response-item',
                style: {
                    padding: '1rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    marginBottom: '0.75rem'
                }
            },
                h('div', { 
                    className: 'response-header',
                    style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem',
                        fontSize: '0.875rem',
                        color: '#6b7280'
                    }
                },
                    h('span', { className: 'response-date' }, timestamp)
                ),
                h('p', { 
                    className: 'response-text',
                    style: {
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        color: '#374151'
                    }
                }, text)
            );
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleString('nl-NL');
        } catch {
            return dateString;
        }
    };

    const statusColor = {
        'Nieuw': '#ef4444',
        'In behandeling': '#f59e0b',
        'Afgesloten': '#10b981'
    };

    return h('div', { 
        className: 'feedback-item',
        style: {
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            marginBottom: '1rem',
            overflow: 'hidden'
        }
    },
        h('div', { 
            className: 'feedback-header', 
            onClick: toggleExpand,
            style: {
                padding: '1rem 1.5rem',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f9fafb',
                transition: 'background-color 0.2s'
            },
            onMouseEnter: (e) => e.currentTarget.style.backgroundColor = '#f3f4f6',
            onMouseLeave: (e) => e.currentTarget.style.backgroundColor = '#f9fafb'
        },
            h('div', { style: { display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 } },
                h('i', { 
                    className: `fas fa-chevron-${isExpanded ? 'down' : 'right'}`,
                    style: { color: '#9ca3af', fontSize: '0.875rem' }
                }),
                h('span', { 
                    className: 'feedback-title',
                    style: {
                        fontWeight: '600',
                        fontSize: '1rem',
                        color: '#111827'
                    }
                }, item.Title || 'Geen titel')
            ),
            h('span', { 
                className: `feedback-status`,
                style: {
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    backgroundColor: `${statusColor[item.Status] || '#6b7280'}20`,
                    color: statusColor[item.Status] || '#6b7280'
                }
            }, item.Status || 'Nieuw')
        ),
        
        isExpanded && h('div', { 
            className: 'feedback-body',
            style: {
                padding: '1.5rem'
            }
        },
            h('div', { style: { marginBottom: '1.5rem' } },
                h('h4', { 
                    style: { 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        color: '#6b7280',
                        marginBottom: '0.5rem' 
                    } 
                }, 'Beschrijving'),
                h('p', { 
                    className: 'feedback-content',
                    style: {
                        whiteSpace: 'pre-wrap',
                        color: '#374151',
                        lineHeight: '1.6'
                    }
                }, item.FoutBeschrijving || item.Beschrijving_x0020_fout || 'Geen beschrijving')
            ),
            
            h('div', { 
                className: 'feedback-meta',
                style: {
                    display: 'flex',
                    gap: '1.5rem',
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    marginBottom: '1.5rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid #e5e7eb'
                }
            },
                item.Author && h('span', null, 
                    h('i', { className: 'fas fa-user', style: { marginRight: '0.5rem' } }),
                    `Ingezonden door: ${item.Author.Title}`
                ),
                item.Created && h('span', null,
                    h('i', { className: 'fas fa-clock', style: { marginRight: '0.5rem' } }),
                    `Datum: ${formatDate(item.Created)}`
                ),
                item.WaarFout && h('span', null,
                    h('i', { className: 'fas fa-map-marker-alt', style: { marginRight: '0.5rem' } }),
                    `Locatie: ${item.WaarFout}`
                )
            ),
            
            isPrivileged && h('div', { 
                className: 'feedback-actions',
                style: {
                    display: 'flex',
                    gap: '0.75rem',
                    marginBottom: '1.5rem',
                    paddingBottom: '1.5rem',
                    borderBottom: '1px solid #e5e7eb'
                }
            },
                h('select', { 
                    onChange: handleStatusChange, 
                    value: item.Status,
                    style: {
                        padding: '0.5rem 1rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        cursor: 'pointer'
                    }
                },
                    config.statusOptions.map(opt => h('option', { key: opt, value: opt }, opt))
                ),
                h('button', { 
                    className: 'button-danger', 
                    onClick: handleDelete,
                    style: {
                        padding: '0.5rem 1rem',
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }
                },
                    h('i', { className: 'fas fa-trash' }),
                    'Verwijderen'
                )
            ),
            
            h('div', { className: 'response-area' },
                h('h4', { 
                    style: { 
                        fontSize: '1rem', 
                        fontWeight: '600', 
                        marginBottom: '1rem',
                        color: '#111827'
                    } 
                }, 'Reacties'),
                h('div', { className: 'response-history', style: { marginBottom: '1rem' } }, 
                    renderReacties()
                ),
                isPrivileged && h('div', { 
                    className: 'response-form',
                    style: {
                        marginTop: '1rem'
                    }
                },
                    h('textarea', {
                        placeholder: 'Schrijf een reactie...',
                        value: newReactie,
                        onChange: (e) => setNewReactie(e.target.value),
                        rows: 3,
                        style: {
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            marginBottom: '0.75rem',
                            boxSizing: 'border-box'
                        }
                    }),
                    h('button', { 
                        className: 'button-primary', 
                        onClick: handleReactieSubmit,
                        style: {
                            padding: '0.5rem 1rem',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }
                    },
                        h('i', { className: 'fas fa-paper-plane' }),
                        'Reactie Toevoegen'
                    )
                )
            )
        )
    );
};

export default FeedbackItem;
