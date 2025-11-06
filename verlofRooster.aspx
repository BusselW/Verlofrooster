<!DOCTYPE html>
<html lang="nl">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verlofrooster</title>
    
    <!-- CSS bestanden -->
    <link href="css/verlofrooster_s.css" rel="stylesheet">
    <link href="css/verlofrooster_s1.css" rel="stylesheet">
    <link href="css/mededelingen.css?v=4" rel="stylesheet">
    <link rel="icon" href="icons/favicon/favicon.svg" />
    
    <!-- ✨ Font Awesome voor iconen -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
          crossorigin="anonymous" 
          referrerpolicy="no-referrer" />

    <!-- React en configuratie bestanden -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    
    <!-- Fallback script -->
    <script>  
        if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
            document.write('<script src="https://som.org.om.local/sites/MulderT/SBeheer/CPW/L/react.development.js"><\/script>');
            document.write('<script src="https://som.org.om.local/sites/MulderT/SBeheer/CPW/L/react-dom.development.js"><\/script>');
        }
    </script>
    <script src="js/config/configLijst.js"></script>
</head>
<body>
    <div id="root"></div>

    <script type="module">
        console.log('🚀 Main script starting execution...');
        
        // Make React available globally BEFORE imports
        window.React = React;
        window.ReactDOM = ReactDOM;
        
        // =====================
        // Import Components
        // =====================
        import { ErrorBoundary } from './js/core/ErrorBoundary.js';
        import { UserRegistrationCheck } from './js/components/UserRegistrationCheck.js';
        import RoosterApp from './js/core/roosterApp.js';
        
        // =====================
        // Import Services (RoosterApp needs these!)
        // =====================
        import { fetchSharePointList, getUserInfo, getCurrentUser, createSharePointListItem, updateSharePointListItem, deleteSharePointListItem, trimLoginNaamPrefix } from './js/services/sharepointService.js';
        import { getCurrentUserGroups, isUserInAnyGroup } from './js/services/permissionService.js';
        import * as linkInfo from './js/services/linkInfo.js';
        import LoadingLogic, { loadFilteredData, shouldReloadData, updateCacheKey, clearAllCache, logLoadingStatus } from './js/services/loadingLogic.js';
        
        // =====================
        // Import UI Components (RoosterApp needs these!)
        // =====================
        import { canManageOthersEvents, canUserModifyItem } from './js/ui/contextmenu.js';
        import TooltipManager from './js/ui/tooltipbar.js';
        import ProfielKaarten from './js/ui/profielkaarten.js';
        import { getProfilePhotoUrl } from './js/utils/userUtils.js';
        
        // =====================
        // Import Tutorial
        // =====================
        import { roosterHandleiding, openHandleiding } from './js/tutorial/roosterHandleiding.js';
        import { roosterTutorial } from './js/tutorial/roosterTutorialOrange.js';

        const { useState, createElement: h } = React;

        // =====================
        // Main App Component
        // =====================
        const App = ({ currentUser, userPermissions }) => {
            console.log('🎯 App component rendering with permissions:', userPermissions);
            
            return h(RoosterApp, { 
                isUserValidated: true, 
                currentUser: currentUser, 
                userPermissions: userPermissions
            });
        };

        // =====================
        // Application Bootstrap
        // =====================
        const MainAppWrapper = () => {
            console.log('🏗️ [MainAppWrapper] Component function called');
            const [appData, setAppData] = useState(null);
            console.log('🏗️ [MainAppWrapper] Current appData:', appData);

            const handleUserValidated = (isValid, currentUser, userPermissions) => {
                console.log('🏗️ [MainAppWrapper] handleUserValidated called:', { isValid, currentUser: currentUser?.Title, userPermissions });
                setAppData({ currentUser, userPermissions });
            };

            const children = appData ? h(App, { 
                currentUser: appData.currentUser, 
                userPermissions: appData.userPermissions 
            }) : null;
            
            console.log('🏗️ [MainAppWrapper] Rendering UserRegistrationCheck with children:', children === null ? 'null' : 'App component');

            return h(UserRegistrationCheck, { onUserValidated: handleUserValidated }, children);
        };
            
        // =====================
        // Render Application
        // =====================
        console.log('🎭 [Main] Creating React root and rendering application...');
        const container = document.getElementById('root');
        console.log('🎭 [Main] Root container:', container);
        const root = ReactDOM.createRoot(container);
        console.log('🎭 [Main] React root created, rendering ErrorBoundary > MainAppWrapper...');

        root.render(
            h(ErrorBoundary, null,
                h(MainAppWrapper)
            )
        );
        
        console.log('🎭 [Main] Application render call complete');

        // Make tutorial functions globally available
        window.startTutorial = roosterTutorial;
        window.openHandleiding = openHandleiding;
            
    </script>
</body>
</html>
