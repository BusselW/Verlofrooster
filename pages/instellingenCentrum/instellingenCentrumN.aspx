<!DOCTYPE html>
<html lang="nl">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Instellingen Centrum</title>
    <!-- <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"> -->
    <link rel="icon" href="data:," />

    <!-- React Libraries -->
    <script src="https://som.org.om.local/sites/MulderT/SBeheer/CPW/L/react.development.js"></script>
    <script src="https://som.org.om.local/sites/MulderT/SBeheer/CPW/L/react-dom.development.js"></script>

    <!-- Configuration -->
    <script src="../../js/config/configLijst.js"></script>

    <!-- Instellingen Styles -->
    <link href="css/instellingencentrum_s.css" rel="stylesheet">
</head>

<body>
    <div id="root"></div>

    <script type="module">
        // Import services (adjust paths as needed)
        import { fetchSharePointList, getCurrentUser, getUserInfo } from '../../js/services/sharepointService.js';
        
        // Import tab components
        import { ProfileTab } from './js/componenten/profielTab.js';
        import { WorkHoursTab } from './js/componenten/werktijdenTab.js';
        import { SettingsTab } from './js/componenten/instellingenTab.js';

        // React setup
        const { useState, useEffect, useMemo, useCallback, createElement: h, Fragment } = React;

        // =====================
        // Main Application Component
        // =====================
        const App = () => {
            const [loading, setLoading] = useState(true);
            const [error, setError] = useState(null);
            const [user, setUser] = useState(null);
            const [data, setData] = useState({});

            // Initialize application
            useEffect(() => {
                const initializeApp = async () => {
                    try {
                        setLoading(true);
                        setError(null);

                        // Load current user
                        const currentUser = await getCurrentUser();
                        setUser(currentUser);

                        // Load additional data as needed
                        // const someData = await fetchSharePointList('SomeList');
                        // setData({ someData });

                        console.log('App initialized successfully');
                    } catch (err) {
                        console.error('Error initializing app:', err);
                        setError(err.message);
                    } finally {
                        setLoading(false);
                    }
                };

                initializeApp();
            }, []);

            // Handle loading state
            if (loading) {
                return h('div', { className: 'loading' },
                    h('div', null,
                        h('div', { className: 'spinner' }),
                        h('p', { className: 'mt-4 text-muted' }, 'Laden...')
                    )
                );
            }

            // Handle error state
            if (error) {
                return h('div', { className: 'container' },
                    h('div', { className: 'error' },
                        h('h3', null, 'Er is een fout opgetreden'),
                        h('p', null, error)
                    )
                );
            }

            // Main application render
            return h('div', null,
                h(Header, { user }),
                h('div', { className: 'container' },
                    h(MainContent, { user, data })
                )
            );
        };

        // =====================
        // Header Component
        // =====================
        const Header = ({ user }) => {
            return h('div', { className: 'header' },
                h('div', { className: 'container' },
                    h('h1', null, 'Instellingen Centrum'),
                    h('p', null, `Welkom, ${user?.Title || 'Gebruiker'}`)
                )
            );
        };

        // =====================
        // Main Content Component
        // =====================
        const MainContent = ({ user, data }) => {
            const [activeTab, setActiveTab] = useState('profile');

            return h('div', null,
                h('div', { className: 'tab-navigation' },
                    ...tabs.map(tab =>
                        h('button', {
                            key: tab.id,
                            className: `btn tab-btn ${activeTab === tab.id ? 'btn-primary active' : 'btn-secondary'}`,
                            onClick: () => setActiveTab(tab.id)
                        },
                            h('span', { className: 'tab-icon' }, tab.icon),
                            h('span', { className: 'tab-label' }, tab.label)
                        )
                    )
                ),
                h(TabContent, { activeTab, user, data })
            );
        };

        // Tab definitions moved here for reuse
        const tabs = [
            { 
                id: 'profile', 
                label: 'Mijn profiel', 
                icon: h('svg', { 
                    width: '20', 
                    height: '20', 
                    fill: 'currentColor', 
                    viewBox: '0 0 20 20' 
                }, 
                    h('path', { 
                        fillRule: 'evenodd', 
                        d: 'M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z', 
                        clipRule: 'evenodd' 
                    })
                )
            },
            { 
                id: 'workhours', 
                label: 'Mijn werktijden', 
                icon: h('svg', { 
                    width: '20', 
                    height: '20', 
                    fill: 'currentColor', 
                    viewBox: '0 0 20 20' 
                }, 
                    h('path', { 
                        fillRule: 'evenodd', 
                        d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z', 
                        clipRule: 'evenodd' 
                    })
                )
            },
            { 
                id: 'settings', 
                label: 'Instellingen', 
                icon: h('svg', { 
                    width: '20', 
                    height: '20', 
                    fill: 'currentColor', 
                    viewBox: '0 0 20 20' 
                }, 
                    h('path', { 
                        fillRule: 'evenodd', 
                        d: 'M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z', 
                        clipRule: 'evenodd' 
                    })
                )
            }
        ];

        // =====================
        // Tab Content Component
        // =====================
        const TabContent = ({ activeTab, user, data }) => {
            switch (activeTab) {
                case 'profile':
                    return h(ProfileTab, { user, data });
                case 'workhours':
                    return h(WorkHoursTab, { user, data });
                case 'settings':
                    return h(SettingsTab, { user, data });
                default:
                    return h('div', { className: 'card' },
                        h('p', null, 'Selecteer een tabblad')
                    );
            }
        };

        // =====================
        // Application Initialization
        // =====================
        const initializeApplication = () => {
            const container = document.getElementById('root');
            if (container) {
                const root = ReactDOM.createRoot(container);
                root.render(h(App));
                console.log('Template application initialized successfully');
            } else {
                console.error('Root container not found');
            }
        };

        // Start the application
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeApplication);
        } else {
            initializeApplication();
        }

    </script>
</body>

</html>