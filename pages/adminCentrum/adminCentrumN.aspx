<!DOCTYPE html>
<html lang="nl">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Centrum - Verlofrooster</title>
    <!-- <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet"> -->
    <link rel="icon" href="../../icons/favicon/favicon.svg" />
    
    <!-- React library -->
    <script src="https://som.org.om.local/sites/MulderT/SBeheer/CPW/L/react.development.js"></script>
    <script src="https://som.org.om.local/sites/MulderT/SBeheer/CPW/L/react-dom.development.js"></script>
    <script src="../../js/config/configLijst.js"></script>
    <script src="../../js/config/configLayout.js"></script>

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
        .admin-header {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            background-color: var(--text-primary);
            color: var(--bg-secondary);
            padding: 0.75rem 1.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            z-index: 1000;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .admin-header-left {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .admin-header-right {
            display: flex;
            align-items: center;
            gap: 1rem;
            font-size: 0.875rem;
        }

        /* Main content area */
        .admin-main-content {
            margin-top: 3.5rem;
            height: calc(100vh - 3.5rem);
            padding: 1.5rem;
            background-color: var(--bg-secondary);
            overflow-y: auto;
        }

        /* Custom tabs styling for full-width */
        .admin-tabs-container {
            height: 100%;
            display: flex;
            flex-direction: column;
        }

        .admin-tabs {
            display: flex;
            gap: 0;
            border-bottom: 1px solid var(--border);
            background-color: var(--bg-primary);
            padding: 0 1rem;
            margin: -1.5rem -1.5rem 1.5rem -1.5rem;
        }

        .admin-tab {
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
        }

        .admin-tab:hover {
            color: var(--text-primary);
            background-color: rgba(255, 255, 255, 0.5);
        }

        .admin-tab.admin-tab-active {
            color: var(--text-primary);
            border-bottom-color: var(--accent);
            background-color: var(--bg-secondary);
        }

        .admin-tab-panel {
            display: none;
            flex: 1;
            overflow-y: auto;
            padding: 1rem 0;
        }

        .admin-tab-panel.admin-tab-active {
            display: block;
        }

        /* Loading states */
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

        .status-offline {
            background-color: rgba(220, 38, 38, 0.1);
            color: var(--danger);
        }
    </style>
</head>

<body>
    <div id="root"></div>

    <script type="module">
        // Import required components and functions
        import { getCurrentUser } from '../../js/services/sharepointService.js';
        import { getCurrentUserGroups } from '../../js/services/permissionService.js';
        import { initializeSharePointContext } from '../js/sharePointContext.js';

        import BlokkenMonitor from './js/adminCentrumApp.js';

        // React destructuring
        const { createElement: h, useState, useEffect } = React;

        // =====================
        // Error Boundary
        // =====================
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
                                className: 'btn btn-primary',
                                onClick: () => window.location.reload() 
                            }, 'Vernieuw')
                        )
                    );
                }
                return this.props.children;
            }
        }

        // =====================
        // Main Admin Component
        // =====================
        const AdminCentrum = () => {
            const [loading, setLoading] = useState(true);
            const [currentUser, setCurrentUser] = useState(null);
            const [userPermissions, setUserPermissions] = useState({
                isAdmin: false,
                loading: true
            });
            const [activeTab, setActiveTab] = useState('monitoring');

            useEffect(() => {
                checkUserPermissions();
            }, []);

            const checkUserPermissions = async () => {
                try {
                    setLoading(true);

                    // Initialize SharePoint context first
                    await initializeSharePointContext();

                    // Get current user
                    const user = await getCurrentUser();
                    if (!user) {
                        console.warn('⚠️ No user info returned');
                        setLoading(false);
                        return;
                    }
                    setCurrentUser(user);

                    // Get user groups
                    const groupsArray = await getCurrentUserGroups();
                    
                    // Check for admin permissions (SharePoint beheer)
                    const permissions = {
                        isAdmin: groupsArray.some(group => 
                            group.toLowerCase().includes('admin') || 
                            group.toLowerCase().includes('beheerder') ||
                            group.toLowerCase().includes('systeembeheer') ||
                            group.toLowerCase().includes('sharepoint') ||
                            group.toLowerCase().includes('behee') // partial match for 'beheer'
                        ),
                        loading: false
                    };

                    setUserPermissions(permissions);

                } catch (error) {
                    console.error('❌ Error checking permissions:', error);
                    setUserPermissions({ isAdmin: false, loading: false });
                } finally {
                    setLoading(false);
                }
            };

            const renderMonitoringTab = () => {
                return h(BlokkenMonitor);
            };

            

            // Handle tab switching
            const switchTab = (tabId) => {
                setActiveTab(tabId);
                
                // Update visual state
                document.querySelectorAll('.admin-tab').forEach(tab => {
                    tab.classList.remove('admin-tab-active');
                });
                document.querySelectorAll('.admin-tab-panel').forEach(panel => {
                    panel.classList.remove('admin-tab-active');
                });
                
                const activeTabElement = document.querySelector(`[data-tab="${tabId}"]`);
                const activePanelElement = document.getElementById(tabId);
                
                if (activeTabElement) activeTabElement.classList.add('admin-tab-active');
                if (activePanelElement) activePanelElement.classList.add('admin-tab-active');
            };

            // Show loading state
            if (loading || userPermissions.loading) {
                return h('div', { className: 'full-width-container' },
                    h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' } },
                        h('div', { className: 'loading-spinner' }),
                        h('p', null, 'Toegangsrechten controleren...')
                    )
                );
            }

            // Check admin access
            if (!userPermissions.isAdmin) {
                return h('div', { className: 'full-width-container' },
                    h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' } },
                        h('div', { 
                            style: { 
                                width: '80px',
                                height: '80px',
                                background: '#fef3c7',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }
                        },
                            h('i', { className: 'fas fa-exclamation-triangle', style: { fontSize: '2rem', color: '#d97706' } })
                        ),
                        h('h2', null, 'Toegang Geweigerd'),
                        h('p', { style: { color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '400px' } }, 
                            'U heeft geen voldoende rechten om deze pagina te bekijken. Neem contact op met uw systeembeheerder.'
                        ),
                        h('button', { 
                            className: 'btn btn-primary',
                            onClick: () => window.history.back()
                        }, 'Terug')
                    )
                );
            }

            // Render full-width admin interface
            return h('div', { className: 'full-width-container' },
                // Custom Admin Header
                h('header', { className: 'admin-header' },
                    h('div', { className: 'admin-header-left' },
                        h('a', { 
                            href: '/sites/mulderT/CustomPW/Verlof/CPW/Rooster/Verlofrooster.aspx', 
                            className: 'header-back-link',
                            style: { textDecoration: 'none' }
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
                            h('span', null, 'Terug')
                        ),
                        h('h1', { style: { margin: 0, fontSize: '1.25rem', fontWeight: '700' } }, 'Admin Centrum'),
                        h('span', { style: { color: 'var(--text-secondary)', fontSize: '0.875rem' } }, 'Full-width Dashboard')
                    ),
                    h('div', { className: 'admin-header-right' },
                        h('span', null, `Welkom, ${currentUser?.Title || 'Administrator'}`),
                        h('div', { className: 'status-indicator status-online' },
                            h('i', { className: 'fas fa-circle' }),
                            'Online'
                        )
                    )
                ),

                // Main Content Area
                h('main', { className: 'admin-main-content' },
                    h('div', { className: 'admin-tabs-container' },
                        // Tabs Navigation
                        h('div', { className: 'admin-tabs' },
                            h('button', { 
                                className: `admin-tab ${activeTab === 'monitoring' ? 'admin-tab-active' : ''}`,
                                'data-tab': 'monitoring',
                                onClick: () => switchTab('monitoring')
                            },
                                h('i', { className: 'fas fa-chart-line', style: { marginRight: '0.5rem' } }),
                                'Monitoring'
                            ),
                            h('button', { 
                                className: `admin-tab ${activeTab === 'placeholder' ? 'admin-tab-active' : ''}`,
                                'data-tab': 'placeholder',
                                onClick: () => switchTab('placeholder')
                            },
                                h('i', { className: 'fas fa-cog', style: { marginRight: '0.5rem' } }),
                                'Configuratie'
                            )
                        ),

                        // Tab Panels
                        activeTab === 'monitoring' ? renderMonitoringTab() : null
                    )
                )
            );
        };

        // =====================
        // Application Bootstrap
        // =====================
        const App = () => {
            return h(AdminCentrum);
        };

        // =====================
        // Render Application
        // =====================
        const container = document.getElementById('root');
        const root = ReactDOM.createRoot(container);

        root.render(
            h(ErrorBoundary, null,
                h(App)
            )
        );

        
    </script>
</body>

</html>