<!DOCTYPE html>
<!-- Following coding instructions from .github/copilot-instructions.md -->
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verlofaanvragen Behandelen</title>
    <link rel="icon" type="image/svg+xml" href="../../icons/favicon/favicon.svg">
    
    <!-- Fonts and Icons -->
    <!-- <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet"> -->
    
    <!-- ConfigLayout System -->
    <script src="../../js/config/configLayout.js"></script>
    
    <!-- CSS files -->
    <link rel="stylesheet" href="../../css/verlofrooster_s.css">
    <link rel="stylesheet" href="../../css/verlofrooster_s1.css">
    <link rel="stylesheet" href="css/behandelCentrumN.css">
    <link rel="stylesheet" href="css/pagination.css">
</head>
<body class="light-theme">
    <!-- Hoofd Header -->
    <div class="header">
        <div class="header-content">
            <div class="header-left">
                <h1>Verlofaanvragen Behandelcentrum</h1>
            </div>
            <div class="header-acties">
                <!-- Emulation dropdown for super user -->
                <div id="header-emulation-container" class="header-emulation" style="display: none;">
                    <span class="header-emulation-label">Bekijk als teamleider:</span>
                    <select id="header-emulation-select" class="header-emulation-select">
                        <option value="">Alle teams (standaard)</option>
                    </select>
                </div>
                
                <div class="navigation-buttons">
                    <div class="nav-buttons-right">
                        <button id="btn-terug-rooster" class="btn btn-functional">
                            <i class="fas fa-arrow-left"></i>
                            <span>Terug naar rooster</span>
                        </button>
                        <div class="user-info">
                            <span class="user-name" id="huidige-gebruiker">Gebruiker wordt geladen...</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Hoofd Container -->
    <div id="app-container" class="app-container">
        <!-- Main Content Area -->
        <div class="content-container">
            <div id="behandelcentrum-root"></div>
        </div>
        
        <!-- Footer -->
        <footer class="page-footer" id="pagina-footer">
            <p class="footer-text">
                &copy; <span id="huidig-jaar"></span> Verlofrooster Applicatie
            </p>
        </footer>
    </div>
    
    <!-- JS files -->
    <!-- React libraries from CDN -->
    <script src="https://som.org.om.local/sites/MulderT/SBeheer/CPW/L/react.development.js"></script>
    <script src="https://som.org.om.local/sites/MulderT/SBeheer/CPW/L/react-dom.development.js"></script>
    <script>
        // Declare h as global variable for React
        const h = React.createElement;
        
        // Setup navigation for "Terug naar rooster" button
        document.addEventListener('DOMContentLoaded', function() {
            const btnTerugRooster = document.getElementById('btn-terug-rooster');
            if (btnTerugRooster) {
                btnTerugRooster.addEventListener('click', function() {
                    // Use global linkInfo service to get verlofRooster URL
                    const targetUrl = window.linkInfo ? window.linkInfo.getVerlofRoosterUrl() : '/sites/mulderT/CustomPW/Verlof/CPW/Rooster/Verlofrooster.aspx';
                    window.location.href = targetUrl;
                });
            }
        });
    </script>
    
    <script src="../../js/config/configLijst.js"></script>
    <script src="../../js/config/configHelper.js"></script>
    <script src="../../js/services/sharepointService-global.js"></script>
    <script src="../../js/services/linkInfo-global.js"></script>
    <script src="js/app.js"></script>
    
    <style>
        /* Integration with configLayout.js design system */
        body {
            font-family: var(--font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif);
            background-color: var(--bg-primary, #E6E8EB);
            color: var(--text-primary, #001935);
        }
        
        /* Header integration with configLayout system */
        .header {
            background-color: var(--text-primary, #001935);
            color: var(--bg-secondary, #FFFFFF);
            box-shadow: var(--shadow, 0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07));
        }
        
        .header h1 {
            font-family: var(--font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif);
            color: var(--bg-secondary, #FFFFFF);
        }
        
        /* Button integration */
        .btn {
            border-radius: var(--radius-md, 0.5rem);
            font-family: var(--font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif);
            transition: all 0.2s var(--ease-in-out-quad, cubic-bezier(0.45, 0, 0.55, 1));
        }
        
        .btn-functional {
            background-color: var(--accent, #FF6D22);
            color: var(--bg-secondary, #FFFFFF);
            border: none;
        }
        
        .btn-functional:hover {
            background-color: var(--accent-hover, #E5621E);
        }
        
        /* Content container integration */
        .content-container {
            background-color: var(--bg-secondary, #FFFFFF);
            border-radius: var(--radius-lg, 0.75rem);
            box-shadow: var(--shadow, 0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07));
            border: 1px solid var(--border, #CCD1D7);
        }
        
        /* App container */
        .app-container {
            background-color: var(--bg-primary, #E6E8EB);
        }
        
        /* Footer integration */
        .page-footer {
            color: var(--text-secondary, #99A3AE);
            font-family: var(--font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif);
        }
        
        /* Header emulation dropdown integration */
        .header-emulation-select {
            background-color: var(--bg-secondary, #FFFFFF);
            color: var(--text-primary, #001935);
            border: 1px solid var(--border, #CCD1D7);
            border-radius: var(--radius-md, 0.5rem);
            font-family: var(--font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif);
        }
        
        /* User info styling */
        .user-info {
            color: var(--bg-secondary, #FFFFFF);
            font-family: var(--font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif);
        }
        
        /* Ensure consistent transitions */
        * {
            transition-timing-function: var(--ease-in-out-quad, cubic-bezier(0.45, 0, 0.55, 1));
        }
        
        /* Override any conflicting fonts to use Apple system fonts */
        h1, h2, h3, h4, h5, h6, p, span, div, button, input, select, textarea {
            font-family: var(--font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif) !important;
        }
    </style>
</body>
</html>