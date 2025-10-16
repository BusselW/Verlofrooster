<!DOCTYPE html>
<!-- Following coding instructions from .github/copilot-instructions.md -->
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mededelingen Beheer</title>
    <link rel="icon" type="image/svg+xml" href="../../icons/favicon/favicon.svg">
    
    <!-- Fonts and Icons -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    
    <!-- CSS files -->
    <link rel="stylesheet" href="../../css/verlofrooster_stijl.css">
    <link rel="stylesheet" href="../../css/verlofrooster_styling.css">
    <link rel="stylesheet" href="css/mededelingenCentrum.css">
</head>
<body class="light-theme">
    <!-- Hoofd Header -->
    <div class="header">
        <div class="header-content">
            <div class="header-left">
                <h1>
                    <i class="fas fa-bullhorn"></i>
                    Mededelingen Beheercentrum
                </h1>
                <p class="header-subtitle">Beheer aankondigingen en mededelingen voor teams</p>
            </div>
            <div class="header-acties">
                <!-- Status indicator -->
                <div id="header-status-container" class="header-status" style="display: none;">
                    <span class="status-indicator">
                        <i class="fas fa-circle status-dot"></i>
                        <span class="status-text">Verbonden</span>
                    </span>
                </div>
                
                <div class="navigation-buttons">
                    <div class="nav-buttons-right">
                        <!-- Quick Actions - Only for privileged users -->
                        <div id="privileged-actions-container" style="display: none;">
                            <button id="btn-nieuwe-mededeling" class="btn btn-primary" title="Nieuwe mededeling aanmaken">
                                <i class="fas fa-plus"></i>
                                <span>Nieuwe mededeling</span>
                            </button>
                        </div>
                        
                        <button id="btn-refresh" class="btn btn-functional" title="Gegevens verversen">
                            <i class="fas fa-sync-alt"></i>
                            <span>Verversen</span>
                        </button>
                        
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

    <!-- Filter and Search Bar -->
    <div class="toolbar-container">
        <div class="toolbar-content">
            <div class="search-section">
                <div class="search-group">
                    <label for="search-input">Zoeken:</label>
                    <input type="text" id="search-input" placeholder="Zoek in titel of beschrijving..." class="search-input">
                </div>
            </div>
            
            <div class="filter-section">
                <div class="filter-group">
                    <label for="status-filter">Status:</label>
                    <select id="status-filter" class="filter-select">
                        <option value="">Alle mededelingen</option>
                        <option value="actief">Actief</option>
                        <option value="verlopen">Verlopen</option>
                        <option value="toekomstig">Toekomstig</option>
                    </select>
                </div>
                
                <div class="filter-group">
                    <label for="team-filter">Team:</label>
                    <select id="team-filter" class="filter-select">
                        <option value="">Alle teams</option>
                    </select>
                </div>
                
                <button id="btn-reset-filters" class="btn btn-ghost" title="Filters wissen">
                    <i class="fas fa-times"></i>
                    Reset
                </button>
            </div>
        </div>
    </div>

    <!-- Hoofd Container -->
    <div id="app-container" class="app-container">
        <!-- Statistics Cards -->
        <div class="stats-container">
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-bullhorn"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-number" id="stat-totaal">0</div>
                    <div class="stat-label">Totaal mededelingen</div>
                </div>
            </div>
            
            <div class="stat-card active">
                <div class="stat-icon">
                    <i class="fas fa-broadcast-tower"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-number" id="stat-actief">0</div>
                    <div class="stat-label">Actief</div>
                </div>
            </div>
            
            <div class="stat-card pending">
                <div class="stat-icon">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-number" id="stat-toekomstig">0</div>
                    <div class="stat-label">Toekomstig</div>
                </div>
            </div>
            
            <div class="stat-card expired">
                <div class="stat-icon">
                    <i class="fas fa-history"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-number" id="stat-verlopen">0</div>
                    <div class="stat-label">Verlopen</div>
                </div>
            </div>
        </div>

        <!-- Main Content Area -->
        <div class="content-container">
            <!-- Mededelingen Table -->
            <div class="table-container">
                <div class="table-header">
                    <h2>
                        <i class="fas fa-list"></i>
                        Mededelingen Overzicht
                    </h2>
                    <div class="table-actions">
                        <button id="btn-export" class="btn btn-ghost" title="Exporteer naar Excel">
                            <i class="fas fa-download"></i>
                            Export
                        </button>
                    </div>
                </div>
                
                <div class="table-wrapper">
                    <table id="mededelingen-table" class="data-table">
                        <thead>
                            <tr>
                                <th class="sortable" data-column="Title">
                                    <span>Titel</span>
                                    <i class="fas fa-sort sort-icon"></i>
                                </th>
                                <th class="sortable" data-column="Aanvulling">
                                    <span>Beschrijving</span>
                                    <i class="fas fa-sort sort-icon"></i>
                                </th>
                                <th class="sortable" data-column="DatumTijdStart">
                                    <span>Start</span>
                                    <i class="fas fa-sort sort-icon"></i>
                                </th>
                                <th class="sortable" data-column="DatumTijdEinde">
                                    <span>Einde</span>
                                    <i class="fas fa-sort sort-icon"></i>
                                </th>
                                <th>Status</th>
                                <th>Doelgroep</th>
                                <th class="sortable" data-column="username">
                                    <span>Aangemaakt door</span>
                                    <i class="fas fa-sort sort-icon"></i>
                                </th>
                                <th class="actions-column">Acties</th>
                            </tr>
                        </thead>
                        <tbody id="mededelingen-tbody">
                            <!-- Data will be populated by JavaScript -->
                            <tr class="loading-row">
                                <td colspan="8" class="loading-cell">
                                    <div class="loading-content">
                                        <div class="loading-spinner"></div>
                                        <span>Mededelingen laden...</span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <!-- Pagination -->
                <div class="pagination-container">
                    <div class="pagination-info">
                        <span id="pagination-info">Geen gegevens beschikbaar</span>
                    </div>
                    <div class="pagination-controls">
                        <button id="btn-prev-page" class="btn btn-ghost" disabled>
                            <i class="fas fa-chevron-left"></i>
                            Vorige
                        </button>
                        <span id="pagination-status" class="pagination-status">Pagina 1 van 1</span>
                        <button id="btn-next-page" class="btn btn-ghost" disabled>
                            Volgende
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <footer class="page-footer" id="pagina-footer">
            <p class="footer-text">
                &copy; <span id="huidig-jaar"></span> Mededelingen Beheercentrum - Verlofrooster Applicatie
            </p>
        </footer>
    </div>

    <!-- Modal Container -->
    <div id="modal-container"></div>
    
    <!-- JS files -->
    <!-- React libraries from CDN -->
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script>
        // Declare h as global variable for React
        const h = React.createElement;
        
        // Set current year in footer
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('huidig-jaar').textContent = new Date().getFullYear();
            
            // Setup navigation for "Terug naar rooster" button
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
    
    <!-- Configuration and Services -->
    <script src="../../js/config/configLijst.js"></script>
    <script src="../../js/config/configHelper.js"></script>
    <script src="../../js/services/sharepointService-global.js"></script>
    <script src="../../js/services/linkInfo-global.js"></script>
    
    <!-- Notification System -->
    <script src="../../js/ui/NotificationSystem.js"></script>
    
    <!-- Application Scripts -->
    <script type="module" src="js/mededelingenApp.js"></script>
</body>
</html>