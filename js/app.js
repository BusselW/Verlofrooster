import { ErrorBoundary } from './core/ErrorBoundary.js';
import { UserRegistrationCheck } from './components/UserRegistrationCheck.js';
import RoosterApp from './core/roosterApp.js';

const { createElement: h } = React;

// Application Bootstrap
const MainAppWrapper = () => {
    const [appData, setAppData] = React.useState(null);

    const handleUserValidated = (isValid, currentUser, userPermissions) => {
        setAppData({ currentUser, userPermissions });
    };

    return h(UserRegistrationCheck, { onUserValidated: handleUserValidated },
        appData ? h(RoosterApp, { 
            currentUser: appData.currentUser, 
            userPermissions: appData.userPermissions 
        }) : null
    );
};

// Initialize app
export function initializeApp() {
    window.React = React; // Make React globally available
    
    const container = document.getElementById('root');
    const root = ReactDOM.createRoot(container);
    
    root.render(
        h(ErrorBoundary, null,
            h(MainAppWrapper)
        )
    );
}