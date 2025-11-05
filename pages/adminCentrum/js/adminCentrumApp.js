const { createElement: h, useState, useEffect } = React;
import { getBlokkenCounts } from './dataService.js';
import { getSharePointContext, initializeSharePointContext } from '../../js/sharePointContext.js';

const BlokkenMonitor = () => {
    const [counts, setCounts] = useState({
        verlof: 0,
        ziekte: 0,
        zittingsvrij: 0,
        zvvo: 0,
        zvm: 0,
        compensatie: 0,
        total: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBlokkenCounts = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log('🔍 BlokkenMonitor: Starting to fetch blokken counts...');

                // Ensure SharePoint context is initialized
                const context = getSharePointContext();
                if (!context.siteUrl || !context.requestDigest) {
                    console.log('⚠️ SharePoint context not initialized, initializing now...');
                    await initializeSharePointContext();
                }

                // Use the existing getBlokkenCounts function
                const blokkenCounts = await getBlokkenCounts();
                console.log('✅ BlokkenMonitor: Successfully fetched counts:', blokkenCounts);

                setCounts(blokkenCounts);
            } catch (err) {
                console.error("❌ BlokkenMonitor: Error fetching blokken counts:", err);
                setError("Fout bij het laden van blokken tellingen: " + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchBlokkenCounts();
    }, []); // Empty dependency array means this effect runs once on mount

    if (loading) {
        return h('div', { className: 'admin-tab-panel admin-tab-active', style: { textAlign: 'center', padding: '3rem' } },
            h('div', { className: 'loading-spinner' }),
            h('p', null, 'Blokken tellingen laden...')
        );
    }

    if (error) {
        return h('div', { className: 'admin-tab-panel admin-tab-active', style: { textAlign: 'center', padding: '3rem', color: 'var(--danger)' } },
            h('i', { className: 'fas fa-exclamation-triangle', style: { fontSize: '2rem', marginBottom: '1rem' } }),
            h('h3', null, 'Fout bij het laden'),
            h('p', null, error),
            h('button', { 
                className: 'btn btn-primary',
                onClick: () => window.location.reload(),
                style: { marginTop: '1rem' }
            }, 'Vernieuw Pagina')
        );
    }

    // Use total from API or calculate if not provided
    const totalBlokken = counts.total || (counts.verlof + counts.ziekte + counts.zittingsvrij + counts.zvvo + counts.zvm + counts.compensatie);
    
    return h('div', { className: 'admin-tab-panel admin-tab-active', id: 'monitoring-content' },
        h('fieldset', null,
            h('legend', null, 'Blokken Monitor (Huidige Maand)'),
            
            // Summary card
            h('div', { 
                className: 'summary-card', 
                style: { 
                    padding: '1.5rem', 
                    backgroundColor: 'var(--accent, #FF6D22)', 
                    color: 'white', 
                    borderRadius: '0.75rem', 
                    textAlign: 'center',
                    marginBottom: '1.5rem',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                } 
            },
                h('h3', { style: { margin: '0 0 0.5rem', fontSize: '1.125rem', fontWeight: '600' } }, 'Totaal Blokken'),
                h('p', { style: { margin: '0', fontSize: '3rem', fontWeight: '700' } }, totalBlokken),
                h('p', { style: { margin: '0.5rem 0 0', fontSize: '0.875rem', opacity: '0.9' } }, 
                    `${new Date().toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}`
                )
            ),
            
            // Individual counts grid - organized by category
            h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' } },
                // VER - Verlof
                h('div', { 
                    className: 'count-card', 
                    style: { 
                        padding: '1rem', 
                        backgroundColor: 'var(--bg-secondary)', 
                        border: '1px solid var(--border)', 
                        borderRadius: '0.5rem', 
                        textAlign: 'center',
                        borderLeft: '4px solid #22c55e'
                    } 
                },
                    h('h4', { style: { margin: '0 0 0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '600' } }, 'VER - Verlof'),
                    h('p', { style: { margin: '0', fontSize: '2rem', fontWeight: '700', color: '#22c55e' } }, counts.verlof),
                    h('p', { style: { margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' } }, 
                        `${((counts.verlof / totalBlokken) * 100 || 0).toFixed(1)}%`
                    )
                ),
                // ZKT - Ziekte
                h('div', { 
                    className: 'count-card', 
                    style: { 
                        padding: '1rem', 
                        backgroundColor: 'var(--bg-secondary)', 
                        border: '1px solid var(--border)', 
                        borderRadius: '0.5rem', 
                        textAlign: 'center',
                        borderLeft: '4px solid #ef4444'
                    } 
                },
                    h('h4', { style: { margin: '0 0 0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '600' } }, 'ZKT - Ziekte'),
                    h('p', { style: { margin: '0', fontSize: '2rem', fontWeight: '700', color: '#ef4444' } }, counts.ziekte),
                    h('p', { style: { margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' } }, 
                        `${((counts.ziekte / totalBlokken) * 100 || 0).toFixed(1)}%`
                    )
                ),
                // ZV - Zittingsvrij
                h('div', { 
                    className: 'count-card', 
                    style: { 
                        padding: '1rem', 
                        backgroundColor: 'var(--bg-secondary)', 
                        border: '1px solid var(--border)', 
                        borderRadius: '0.5rem', 
                        textAlign: 'center',
                        borderLeft: '4px solid #f59e0b'
                    } 
                },
                    h('h4', { style: { margin: '0 0 0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '600' } }, 'ZV - Zittingsvrij'),
                    h('p', { style: { margin: '0', fontSize: '2rem', fontWeight: '700', color: '#f59e0b' } }, counts.zittingsvrij),
                    h('p', { style: { margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' } }, 
                        `${((counts.zittingsvrij / totalBlokken) * 100 || 0).toFixed(1)}%`
                    )
                ),
                // ZVVO
                h('div', { 
                    className: 'count-card', 
                    style: { 
                        padding: '1rem', 
                        backgroundColor: 'var(--bg-secondary)', 
                        border: '1px solid var(--border)', 
                        borderRadius: '0.5rem', 
                        textAlign: 'center',
                        borderLeft: '4px solid #f97316'
                    } 
                },
                    h('h4', { style: { margin: '0 0 0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '600' } }, 'ZVVO'),
                    h('p', { style: { margin: '0', fontSize: '2rem', fontWeight: '700', color: '#f97316' } }, counts.zvvo),
                    h('p', { style: { margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' } }, 
                        `${((counts.zvvo / totalBlokken) * 100 || 0).toFixed(1)}%`
                    )
                ),
                // ZVM
                h('div', { 
                    className: 'count-card', 
                    style: { 
                        padding: '1rem', 
                        backgroundColor: 'var(--bg-secondary)', 
                        border: '1px solid var(--border)', 
                        borderRadius: '0.5rem', 
                        textAlign: 'center',
                        borderLeft: '4px solid #fb923c'
                    } 
                },
                    h('h4', { style: { margin: '0 0 0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '600' } }, 'ZVM'),
                    h('p', { style: { margin: '0', fontSize: '2rem', fontWeight: '700', color: '#fb923c' } }, counts.zvm),
                    h('p', { style: { margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' } }, 
                        `${((counts.zvm / totalBlokken) * 100 || 0).toFixed(1)}%`
                    )
                ),
                // Compensatie-uren
                h('div', { 
                    className: 'count-card', 
                    style: { 
                        padding: '1rem', 
                        backgroundColor: 'var(--bg-secondary)', 
                        border: '1px solid var(--border)', 
                        borderRadius: '0.5rem', 
                        textAlign: 'center',
                        borderLeft: '4px solid #3b82f6'
                    } 
                },
                    h('h4', { style: { margin: '0 0 0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '600' } }, 'Compensatie-uren'),
                    h('p', { style: { margin: '0', fontSize: '2rem', fontWeight: '700', color: '#3b82f6' } }, counts.compensatie),
                    h('p', { style: { margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' } }, 
                        `${((counts.compensatie / totalBlokken) * 100 || 0).toFixed(1)}%`
                    )
                )
            ),
            
            // Debug info (only shown in development)
            window.location.hostname === 'localhost' && h('div', { 
                style: { 
                    marginTop: '2rem', 
                    padding: '1rem', 
                    backgroundColor: '#f8f9fa', 
                    border: '1px solid #e9ecef',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace'
                } 
            },
                h('h4', { style: { margin: '0 0 0.5rem', fontSize: '0.875rem' } }, 'Debug Info'),
                h('p', { style: { margin: '0.25rem 0' } }, `Counts: ${JSON.stringify(counts)}`),
                h('p', { style: { margin: '0.25rem 0' } }, `Total: ${totalBlokken}`),
                h('p', { style: { margin: '0.25rem 0' } }, `Current Date: ${new Date().toISOString()}`)
            )
        )
    );
};

export default BlokkenMonitor;