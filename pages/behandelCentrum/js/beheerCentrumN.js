// Main App Component using React
function App() {
    const [isLoading, setIsLoading] = useState(true);
    
    // Component did mount
    useEffect(() => {
        // Initialize app
        const initApp = async () => {
            try {
                // Connect to SharePoint
                const connected = await initialiseerSharePointVerbinding();
                
                if (!connected) {
                    toonNotificatie('Er is een probleem met de verbinding. Probeer de pagina te herladen.', 'error', 0);
                }
                
                // Set current year in footer
                document.getElementById('huidig-jaar').textContent = new Date().getFullYear();
                
                // Initialize with default theme
                pasThemaToe('light');
                
            } catch (error) {
                console.error('Fout bij initialiseren app:', error);
                toonNotificatie('Er is een fout opgetreden bij het laden van de applicatie.', 'error', 0);
            } finally {
                setIsLoading(false);
            }
        };
        
        initApp();
    }, []);
    
    // Render main app content
    return h(Fragment, null, 
        h('div', { className: 'app-content' },
            isLoading 
                ? h('div', { className: 'loading-indicator' }, 'Applicatie wordt geladen...')
                : h('div', { className: 'content-card' },
                    h('div', { className: 'card-header' },
                        h('h2', null, 'Beheercentrum')
                    ),
                    h('div', { className: 'card-body' },
                        h('p', null, 'Welkom bij het nieuwe Beheercentrum')
                    )
                )
        )
    );
}