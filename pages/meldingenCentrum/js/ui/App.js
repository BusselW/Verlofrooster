
import { getFeedbackItems, isCurrentUserPrivileged, addFeedbackItem } from '../services/sp-service.js';
import FeedbackItem from './FeedbackItem.js';
import FeedbackForm from './FeedbackForm.js';

const { useState, useEffect, createElement: h } = React;

const App = () => {
    const [feedbackItems, setFeedbackItems] = useState([]);
    const [isPrivileged, setIsPrivileged] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState(null);

    const loadFeedback = async () => {
        try {
            console.log('📋 Loading feedback items...');
            const items = await getFeedbackItems();
            console.log('✅ Loaded items:', items);
            setFeedbackItems(Array.isArray(items) ? items : []);
            setError(null);
        } catch (error) {
            console.error("❌ Fout bij het laden van feedback:", error);
            setError('Kon meldingen niet laden. Probeer de pagina te vernieuwen.');
        }
    };

    useEffect(() => {
        const initialize = async () => {
            try {
                console.log('🚀 Initializing Meldingencentrum...');
                
                // Check permissions
                const privileged = await isCurrentUserPrivileged();
                console.log('🔐 User is privileged:', privileged);
                setIsPrivileged(privileged);
                
                // Load feedback items
                await loadFeedback();
                
                console.log('✅ Initialization complete');
            } catch (error) {
                console.error("❌ Initialization error:", error);
                setError('Fout bij het opstarten van de applicatie.');
            } finally {
                setLoading(false);
            }
        };

        initialize();
    }, []);

    const handleFormSubmit = async (title, beschrijving) => {
        try {
            console.log('📝 Submitting feedback:', { title, beschrijving });
            await addFeedbackItem(title, beschrijving);
            await loadFeedback(); // Refresh list
            setShowForm(false);
            console.log('✅ Feedback submitted successfully');
        } catch (error) {
            console.error("❌ Fout bij het toevoegen van feedback:", error);
            alert('Fout bij het toevoegen van feedback: ' + error.message);
        }
    };

    if (loading) {
        return h('div', { 
            className: 'loading-container',
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                fontFamily: 'Inter, sans-serif'
            }
        },
            h('div', { className: 'loading-spinner' }),
            h('p', { style: { marginTop: '1rem', color: '#6b7280' } }, 'Meldingen worden geladen...')
        );
    }

    if (error && feedbackItems.length === 0) {
        return h('div', { 
            className: 'error-container',
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                padding: '2rem',
                fontFamily: 'Inter, sans-serif'
            }
        },
            h('div', { 
                style: {
                    maxWidth: '500px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '2rem',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    textAlign: 'center'
                }
            },
                h('i', { 
                    className: 'fas fa-exclamation-triangle',
                    style: { fontSize: '3rem', color: '#ef4444', marginBottom: '1rem' }
                }),
                h('h2', { style: { fontSize: '1.5rem', marginBottom: '0.5rem' } }, 'Fout bij laden'),
                h('p', { style: { color: '#6b7280', marginBottom: '1.5rem' } }, error),
                h('button', {
                    className: 'button-primary',
                    onClick: () => window.location.reload(),
                    style: {
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: '500'
                    }
                }, 'Pagina Vernieuwen')
            )
        );
    }

    return h('div', { className: 'feedback-container', style: { maxWidth: '1200px', margin: '0 auto', padding: '2rem' } },
        h('header', { style: { marginBottom: '2rem' } },
            h('h1', { style: { fontSize: '2rem', fontWeight: '600', marginBottom: '0.5rem' } }, 'Meldingencentrum'),
            h('p', { style: { color: '#6b7280' } }, 'Meld functionele fouten of problemen met de applicatie')
        ),
        
        error && h('div', { 
            className: 'error-banner',
            style: {
                padding: '1rem',
                backgroundColor: '#fee2e2',
                borderRadius: '8px',
                marginBottom: '1rem',
                color: '#991b1b'
            }
        }, error),
        
        !showForm && h('button', {
            className: 'button-primary',
            onClick: () => setShowForm(true),
            style: {
                padding: '0.75rem 1.5rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
            }
        },
            h('i', { className: 'fas fa-plus' }),
            'Nieuwe Melding Toevoegen'
        ),
        
        showForm && h(FeedbackForm, {
            onSubmit: handleFormSubmit,
            onCancel: () => setShowForm(false)
        }),
        
        h('div', { className: 'feedback-list', style: { marginTop: '1.5rem' } },
            feedbackItems.length === 0 
                ? h('div', { 
                    style: { 
                        textAlign: 'center', 
                        padding: '3rem', 
                        color: '#9ca3af',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px'
                    } 
                },
                    h('i', { className: 'fas fa-inbox', style: { fontSize: '3rem', marginBottom: '1rem' } }),
                    h('p', null, 'Geen meldingen gevonden')
                )
                : feedbackItems.map(item =>
                    h(FeedbackItem, { 
                        key: item.Id, 
                        item, 
                        isPrivileged, 
                        onUpdate: loadFeedback 
                    })
                )
        )
    );
};

export default App;
