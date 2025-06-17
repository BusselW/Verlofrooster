<!DOCTYPE html>
<html lang="nl">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verlofrooster</title>
    <link rel="icon" type="image/svg+xml" href="Icoon/favicon.svg">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/verlofrooster_styles.css">
    <link rel="stylesheet" href="css/profielKaart.css">
    <link rel="stylesheet" href="css/verlofRooster_tour.css">
    <link rel="stylesheet" href="css/enhanced_styles.css">
    <link rel="stylesheet" href="pages/css/meldingZittingsvrij_styles.css">
	<link rel="stylesheet" href="css/contextMenu.css">
	<link rel="stylesheet" href="pages/css/meldingVerlof_styles.css">
	<link rel="stylesheet" href="pages/css/meldingZiekte_styles.css">
    <style>
        body {
            font-family: 'Inter', sans-serif;
        }

        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }

        #fab-menu {
            transition: opacity 0.2s ease-out, transform 0.2s ease-out;
        }

        .fab-menu-item {
            transition: background-color 0.15s ease-in-out;
        }

        #rooster-dropdown-menu {
            transition: opacity 0.2s ease-out, transform 0.2s ease-out;
        }

        #app-container {
            min-height: 100vh;
        }

        /* Custom animations for What's New modal */
        .demo-date:hover {
            transform: scale(1.05);
            transition: all 0.2s ease;
        }
        
        .demo-date.selected {
            transform: scale(1.1);
            box-shadow: 0 0 0 2px #3b82f6;
        }
        
        .demo-cell:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: all 0.2s ease;
        }
        
        .tab-button {
            transition: all 0.3s ease;
            position: relative;
        }
        
        .tab-button:hover {
            background-color: rgba(59, 130, 246, 0.1);
        }
        
        .tab-content {
            animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .demo-calendar .demo-date {
            transition: all 0.2s ease;
        }
        
        .demo-roster-grid {
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        #demo-context-menu {
            animation: slideIn 0.2s ease-out;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        @keyframes slideIn {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .demo-menu-item:hover {
            transform: translateX(2px);
            transition: transform 0.1s ease;
        }
    </style>
    <script src="js/util_auth.js"></script>
    <script src="js/machtigingen.js"></script>
</head>

<body class="light-theme transition-colors duration-300">
    <script>
        (async () => {
            // Wacht tot machtigingen.js klaar is en window.huidigeGebruiker beschikbaar is
            // Ensure machtigingenInitializationPromise is available
            if (typeof window.machtigingenInitializationPromise === 'undefined') {
                console.error("machtigingenInitializationPromise is not defined. machtigingen.js might not have loaded correctly or in time.");
                // Optionally, redirect to an error page or show a critical error message to the user.
                // For now, we'll let it try and potentially fail further down, which will be caught.
            }

            try {
                await window.machtigingenInitializationPromise;

                if (window.huidigeGebruiker && window.huidigeGebruiker.normalizedUsername) {
                    const normalizedUsername = window.huidigeGebruiker.normalizedUsername;
                    const lijstNaam = "Medewerkers";
                    const selectQuery = "$select=Username,Actief";
                    const filterQuery = `$filter=Username eq '${normalizedUsername.replace(/'/g, "''")}'`;

                    if (typeof window.getLijstItemsAlgemeen === 'function') {
                        const gebruikersData = await window.getLijstItemsAlgemeen(lijstNaam, selectQuery, filterQuery);

                        if (gebruikersData && gebruikersData.length > 0 && gebruikersData[0].Actief) {
                            console.log("Gebruiker gevonden en actief, laadt verlofrooster.");
                        } else {
                            console.log("Gebruiker niet gevonden of niet actief, redirect naar profielBeheer.aspx.");
                            window.location.href = 'pages/profielBeheer.aspx';
                        }
                    } else {
                        console.error("Functie getLijstItemsAlgemeen niet gevonden. Kan gebruiker niet valideren. Redirecting to registration as a fallback.");
                        window.location.href = 'pages/profielBeheer.aspx'; // Fallback redirect
                    }
                } else {
                    console.error("Huidige gebruiker of normalizedUsername niet beschikbaar. Kan gebruiker niet valideren. Redirecting to registration as a fallback.");
                    // If user info is critical and not available, redirecting might be a safe default.
                    window.location.href = 'pages/profielBeheer.aspx'; // Fallback redirect
                }
            } catch (error) {
                console.error("Fout bij het controleren van gebruikersregistratie of tijdens await:", error);
                // Fallback bij fout: overweeg een foutpagina of redirect naar registratie.
                // For now, redirecting to registration if any error occurs in this critical block.
                console.log("Redirecting to profielBeheer.aspx due to an error during registration check.");
                window.location.href = 'pages/profielBeheer.aspx';
            }
        })();
    </script>
    <div id="app-container" class="flex flex-col h-screen">
        <header id="app-header" class="bg-white shadow-md p-3 md:p-4 space-y-3 print:hidden">            <div class="flex justify-between items-center">
                <div class="flex items-center space-x-3 md:space-x-4">
                    <h1 id="app-title" class="text-lg sm:text-xl font-bold text-gray-800">Teamverlofrooster</h1>
                    <a id="melding-button" href="pages/meldingMaken.aspx" title="Nieuwe melding maken (fout, suggestie)" class="text-gray-600 hover:text-blue-600 hover:bg-gray-100 py-1.5 px-2 md:py-2 md:px-3 rounded-lg flex items-center space-x-1 transition-colors border border-gray-200 hover:border-blue-300 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span class="sm:inline ml-1">Melding</span>
                    </a>
                    <button id="whats-new-button" title="Nieuwe functies en verbeteringen" class="text-gray-600 hover:text-green-600 hover:bg-green-50 py-1.5 px-2 md:py-2 md:px-3 rounded-lg flex items-center space-x-1 transition-colors border border-gray-200 hover:border-green-300 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                            <line x1="9" y1="9" x2="9.01" y2="9"></line>
                            <line x1="15" y1="9" x2="15.01" y2="9"></line>
                        </svg>
                        <span class="sm:inline ml-1">Nieuw!</span>
                    </button>
                    <div id="notification-placeholder" class="text-xs sm:text-sm text-gray-500 italic"></div>
                </div>
                <div class="flex items-center space-x-2 md:space-x-3">
                    <div id="admin-buttons-header" class="flex space-x-1 md:space-x-2">
                        <a id="admin-instellingen-button" href="pages/adminCentrum.aspx" title="Administrator instellingen" class="text-gray-600 hover:text-blue-600 hover:bg-gray-100 py-1.5 px-2 md:py-2 md:px-3 rounded-lg flex items-center space-x-1 transition-colors border border-gray-200 hover:border-blue-300 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 20h9"></path>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                            <span class="sm:inline ml-1">Admin</span>
                        </a>
                        <a id="beheer-centrum-button" href="pages/beheerCentrum.aspx" title="Beheer Centrum" class="text-gray-600 hover:text-blue-600 hover:bg-gray-100 py-1.5 px-2 md:py-2 md:px-3 rounded-lg flex items-center space-x-1 transition-colors border border-gray-200 hover:border-blue-300 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                            <span class="sm:inline ml-1">Beheer</span>
                        </a>
                        <a id="behandelen-button" href="pages/behandelCentrum.aspx" title="Behandel Centrum" class="text-gray-600 hover:text-blue-600 hover:bg-gray-100 py-1.5 px-2 md:py-2 md:px-3 rounded-lg flex items-center space-x-1 transition-colors border border-gray-200 hover:border-blue-300 shadow-sm dark:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-600 dark:hover:border-blue-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                                <path d="m9 14 2 2 4-4"></path>
                            </svg>
                            <span class="sm:inline ml-1">Behandelen</span>
                        </a>
                    </div>
                    <button id="help-button" title="Hulp & Interactieve Tour" class="text-gray-600 hover:text-blue-600 hover:bg-gray-100 py-1.5 px-2 md:py-2 md:px-3 rounded-lg flex items-center space-x-1 transition-colors border border-gray-200 hover:border-blue-300 shadow-sm dark:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-600 dark:hover:border-blue-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                        <span class="hidden sm:inline ml-1">Help</span>
                    </button>
                    <div class="relative">
                        <button id="rooster-dropdown-button" title="Gebruikersinstellingen en persoonlijke gegevens" class="bg-gray-200 hover:bg-gray-300 text-gray-700 py-1.5 px-2 md:py-2 md:px-3 rounded-lg flex items-center space-x-1 shadow hover:shadow-md transition-all border border-gray-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <span id="gebruikersnaam-display" class="text-xs sm:text-sm">Gebruiker</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>
                        <div id="rooster-dropdown-menu" class="hidden absolute right-0 mt-2 w-64 bg-white rounded-md shadow-xl py-1 z-50 transform scale-95 opacity-0 border border-gray-200">
                            <a href="pages/gInstellingen.aspx?tab=persoonlijk" class="dropdown-item block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">Persoonlijke gegevens & Werkdagen</a>
                            <a href="pages/gInstellingen.aspx?tab=instellingen" class="dropdown-item block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">Instellingen Rooster</a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
                <div class="flex items-center space-x-1 md:space-x-2">
                    <button id="prev-month-button" title="Vorige periode" class="nav-button p-2 rounded-md text-gray-600 hover:bg-gray-100 border border-gray-200 shadow-sm transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <span id="current-month-year" class="text-md sm:text-lg font-semibold text-gray-800 w-32 text-center">Laden...</span>
                    <button id="next-month-button" title="Volgende periode" class="nav-button p-2 rounded-md text-gray-600 hover:bg-gray-100 border border-gray-200 shadow-sm transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                    <button id="today-button" title="Ga naar vandaag" class="nav-button-alt bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300 py-1.5 px-2 md:py-2 md:px-3 rounded-lg text-xs sm:text-sm shadow hover:shadow-md transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1 inline-block">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        Vandaag
                    </button>
                    <div class="view-toggle-group inline-flex rounded-md shadow-sm" role="group">
                        <button id="week-view-button" type="button" class="view-button py-2 px-2.5 md:px-3 text-xs sm:text-sm font-medium bg-white text-gray-600 border border-gray-300 rounded-l-lg hover:bg-gray-100 focus:z-10 focus:ring-2 focus:ring-blue-500 focus:bg-blue-500 focus:text-white transition-colors">
                            Week
                        </button>
                        <button id="month-view-button" type="button" class="view-button py-2 px-2.5 md:px-3 text-xs sm:text-sm font-medium bg-blue-500 text-white border-r border-t border-b border-gray-300 rounded-r-lg hover:bg-blue-600 transition-colors">
                            Maand
                        </button>
                    </div>
                </div>
                <div class="flex items-center space-x-1 md:space-x-2">
                    <div class="relative w-full sm:w-auto">
                        <input type="search" id="rooster-search-input" placeholder="Zoek medewerker..." class="filter-input bg-white text-gray-800 border border-gray-300 placeholder-gray-500 text-xs sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 pl-8 shadow w-full sm:w-48 md:w-64">
                        <div class="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </div>
                    </div>
                    <select id="team-filter-select" title="Filter op team" class="filter-input bg-white text-gray-800 border border-gray-300 text-xs sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 shadow w-full sm:w-auto max-w-[150px] sm:max-w-xs">
                        <option selected value="all">Alle teams</option>
                    </select>
                </div>
            </div>            <section id="legenda-section" class="bg-white p-2 md:p-3 rounded-lg mb-3 md:mb-4 shadow print:hidden border border-gray-200">
                <div class="flex flex-col md:flex-row gap-4">
                    <!-- Legenda half -->
                    <div class="flex-1">
                        <div id="legenda-items-container" class="flex flex-wrap items-center gap-x-3 gap-y-1 md:gap-x-4 md:gap-y-2">
                            <h3 id="legenda-title" class="text-sm sm:text-md font-semibold text-gray-800 mr-2">Legenda:</h3>
                        </div>
                    </div>
                    
                    <!-- Count data control and section - only visible to Sharepoint beheer -->
                    <div id="count-data-container" class="hidden">
                        <!-- Control section - always visible when user has permission -->
                        <div class="flex items-center justify-end gap-2 mb-2">
                            <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" id="count-data-toggle" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2">
                                <span>Toon Data Telling</span>
                            </label>
                            <div class="relative group">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400 hover:text-gray-600 cursor-help">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                </svg>
                                <div class="absolute bottom-full right-0 mb-2 w-64 bg-gray-800 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                                    Als één van deze tellingen niet voorbij de 100 gaat, dan in machtigingen.js query instellen op $top=5000
                                    <div class="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Count data section -->
                        <div id="count-data-section" class="hidden">
                            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 md:gap-x-4 md:gap-y-2 justify-end">
                                <h3 class="text-sm sm:text-md font-semibold text-gray-800 mr-2">Data Telling:</h3>
                                <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                    <span id="count-verlof" class="bg-blue-100 text-blue-800 px-2 py-1 rounded">Verlof: <strong>-</strong></span>
                                    <span id="count-ziekte" class="bg-red-100 text-red-800 px-2 py-1 rounded">Ziekte: <strong>-</strong></span>
                                    <span id="count-compensatie" class="bg-green-100 text-green-800 px-2 py-1 rounded">Compensatie: <strong>-</strong></span>
                                    <span id="count-zittingvrij" class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Zittingvrij: <strong>-</strong></span>
                                    <span id="count-medewerkers" class="bg-purple-100 text-purple-800 px-2 py-1 rounded">Medewerkers: <strong>-</strong></span>
                                    <span id="count-teams" class="bg-indigo-100 text-indigo-800 px-2 py-1 rounded">Teams: <strong>-</strong></span>
                                    <span id="count-verlofredenen" class="bg-pink-100 text-pink-800 px-2 py-1 rounded">Verlofredenen: <strong>-</strong></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section id="rooster-grid-header-container" class="w-full overflow-x-auto">
                <div id="rooster-grid-header" class="grid grid-cols-[200px_repeat(31,minmax(40px,1fr))] gap-px bg-gray-300 sticky top-0 z-20 rounded-t-md">
                    <div class="rooster-header-medewerker sticky left-0 bg-gray-100 p-2 font-semibold z-30 rounded-tl-md flex items-center text-gray-700">
                        <span>Medewerker</span>
                        <button id="sort-medewerker-button" title="Sorteer medewerkers" class="ml-auto p-1 hover:bg-gray-300 rounded">
                            </button>
                    </div>
                    </div>
            </section>
        </header>

        <main class="flex-grow p-3 md:p-4">
            <div id="registratie-melding" class="hidden bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 md:p-4 mb-3 md:mb-4 rounded-md shadow" role="alert">
                <div class="flex">
                    <div class="py-1"><svg class="fill-current h-6 w-6 text-yellow-600 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 5v6h2V5H9zm0 8v2h2v-2H9z" />
                        </svg></div>
                    <div>
                        <p class="font-bold">Registratie Vereist</p>
                        <p id="registratie-melding-tekst" class="text-sm">Uw gebruikersnaam is niet herkend in de
                            medewerkerslijst. Registreer alstublieft om toegang te krijgen.</p>
                        <button id="start-registratie-button" class="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded-md text-sm shadow hover:shadow-md transition-all">Start
                            Registratie</button>
                    </div>
                </div>
            </div>

            <section id="rooster-grid-container" class="bg-gray-200 p-px rounded-lg shadow-xl overflow-x-auto border border-gray-300">
                <div id="rooster-data-rows" class="divide-y divide-gray-300">
                </div>
                <div class="rooster-bottom-line bg-gray-300 p-px rounded-b-md h-1"></div>
            </section>
            <p id="footer-text" class="mt-4 text-xs text-gray-500 text-center print:hidden">Gegevens worden geladen
                vanuit SharePoint. Wijzigingen kunnen even duren om zichtbaar te worden.</p>
        </main>

        <div class="fixed bottom-4 right-4 md:bottom-6 md:right-6 print:hidden z-40">
            <div id="fab-menu" class="absolute bottom-16 right-0 mb-2 w-60 bg-white rounded-lg shadow-xl py-2 transform scale-95 opacity-0 pointer-events-none border border-gray-200">
                <a href="javascript:void(0)" id="fab-verlof-aanvragen" class="fab-menu-item block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">Verlof
                    aanvragen</a>
                <a href="javascript:void(0)" id="fab-compensatie-doorgeven" class="fab-menu-item block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">Compensatieuren
                    doorgeven</a>
                <a href="javascript:void(0);" id="fab-ziek-melden" class="fab-menu-item restricted-fab-item block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">Ziek/Beter
                    melden</a>
                <button type="button" id="fab-zittingvrij-modal-trigger" class="fab-menu-item restricted-fab-item block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">Zittingvrij
                    (incidenteel)</button>
            </div>
            <button id="fab-add-button" title="Nieuwe melding toevoegen" class="bg-blue-600 hover:bg-blue-700 text-white w-12 h-12 md:w-14 md:h-14 rounded-full shadow-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all">
                <svg id="fab-icon-plus" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <svg id="fab-icon-close" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="hidden">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
        <div id="modal-placeholder" class="hidden fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 print:hidden">
            <div class="modal-dialog w-full max-w-md mx-auto">
                <div class="modal-card bg-white p-5 md:p-6 rounded-lg shadow-xl w-full transform transition-all scale-95 opacity-0 border border-gray-200">
                    <div class="flex justify-between items-center mb-4">
                        <h3 id="modal-title" class="text-lg font-semibold text-gray-800">Modal Titel</h3>
                        <button id="modal-close-button-x" class="modal-close-x-button text-gray-500 hover:text-gray-700 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div id="modal-step-navigation-container" class="hidden mb-4">
                    </div>
                    <div id="modal-content" class="text-sm text-gray-700">
                    </div>
                    <div id="modal-actions" class="mt-6 flex justify-end space-x-3">
                        <button id="modal-close-button" class="modal-button-secondary bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg text-sm shadow hover:shadow-md transition-all">Sluiten</button>
                        <button id="modal-action-button" class="modal-button-primary bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg text-sm shadow hover:shadow-md transition-all">Actie</button>
                    </div>
                </div>
            </div>        </div>        <!-- What's New Modal -->
        <div id="whats-new-modal" class="hidden fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 print:hidden">
            <div class="modal-dialog w-full max-w-6xl mx-auto">
                <div class="modal-card bg-white p-6 md:p-8 rounded-lg shadow-xl w-full transform transition-all scale-95 opacity-0 border border-gray-200 max-h-[95vh] overflow-hidden">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-2xl font-bold text-gray-800 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-3 text-green-600">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                                <line x1="15" y1="9" x2="15.01" y2="9"></line>
                            </svg>
                            Nieuwe Functies & Verbeteringen
                        </h3>
                        <button id="whats-new-close" class="text-gray-500 hover:text-gray-700 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    
                    <!-- Tab Navigation -->                    <div class="flex space-x-1 mb-6 border-b border-gray-200">
                        <button id="demo-tab-btn" class="tab-button px-6 py-3 text-sm font-medium border-b-2 border-blue-500 text-blue-600 bg-blue-50 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 inline-block">
                                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                            </svg>
                            Interactieve Demo
                        </button>
                        <button id="features-tab-btn" class="tab-button px-6 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 inline-block">
                                <path d="M9 12l2 2 4-4"></path>
                                <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h9z"></path>
                                <path d="M3 19c-.552 0-1-.448-1-1v-6c0-.552.448-1 1-1h18c.552 0 1 .448 1 1v6c0 .552-.448 1-1 1H3z"></path>
                            </svg>
                            Alle Functies
                        </button>
                        <button id="admin-tab-btn" class="tab-button hidden px-6 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 inline-block">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                            </svg>
                            Beheerders
                        </button>
                    </div>
                    
                    <!-- Tab Content Container -->
                    <div class="overflow-y-auto max-h-[60vh]">                        <!-- Demo Tab -->
                        <div id="demo-tab-content" class="tab-content">
                            <div class="space-y-8">
                                <!-- Demo Header -->
                                <div class="text-center">
                                    <h4 class="text-2xl font-bold text-gray-800 mb-2">🚀 Probeer de Nieuwe Functies Uit!</h4>
                                    <p class="text-gray-600">Klik, experimenteer en ontdek hoe eenvoudig het nieuwe systeem werkt.</p>
                                </div>
                                
                                <!-- Main Demo Grid - Horizontaler -->
                                <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                    <!-- Date Selection Demo -->
                                    <div class="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 shadow-sm">
                                        <div class="flex items-center justify-center mb-6">
                                            <div class="bg-blue-500 p-3 rounded-full mr-4">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 class="text-xl font-bold text-blue-800">Snelle Datum Selectie</h4>
                                                <p class="text-blue-600 text-sm">Klik eerst op start, dan op einddatum</p>
                                            </div>
                                        </div>
                                        
                                        <!-- Enhanced Calendar Demo -->
                                        <div class="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                                            <div class="text-center mb-3">
                                                <span class="text-sm font-medium text-gray-700">Januari 2024</span>
                                            </div>
                                            <div class="demo-calendar">
                                                <div class="grid grid-cols-7 gap-1">
                                                    <div class="text-xs font-medium text-gray-500 p-2 text-center">Ma</div>
                                                    <div class="text-xs font-medium text-gray-500 p-2 text-center">Di</div>
                                                    <div class="text-xs font-medium text-gray-500 p-2 text-center">Wo</div>
                                                    <div class="text-xs font-medium text-gray-500 p-2 text-center">Do</div>
                                                    <div class="text-xs font-medium text-gray-500 p-2 text-center">Vr</div>
                                                    <div class="text-xs font-medium text-gray-500 p-2 text-center bg-gray-50 rounded">Za</div>
                                                    <div class="text-xs font-medium text-gray-500 p-2 text-center bg-gray-50 rounded">Zo</div>
                                                    
                                                    <div class="demo-date p-3 text-sm text-center hover:bg-blue-100 cursor-pointer rounded-lg font-medium transition-all duration-200" data-date="15">15</div>
                                                    <div class="demo-date p-3 text-sm text-center hover:bg-blue-100 cursor-pointer rounded-lg font-medium transition-all duration-200" data-date="16">16</div>
                                                    <div class="demo-date p-3 text-sm text-center hover:bg-blue-100 cursor-pointer rounded-lg font-medium transition-all duration-200" data-date="17">17</div>
                                                    <div class="demo-date p-3 text-sm text-center hover:bg-blue-100 cursor-pointer rounded-lg font-medium transition-all duration-200" data-date="18">18</div>
                                                    <div class="demo-date p-3 text-sm text-center hover:bg-blue-100 cursor-pointer rounded-lg font-medium transition-all duration-200" data-date="19">19</div>
                                                    <div class="demo-date p-3 text-sm text-center bg-gray-50 text-gray-400 cursor-pointer rounded-lg font-medium" data-date="20">20</div>
                                                    <div class="demo-date p-3 text-sm text-center bg-gray-50 text-gray-400 cursor-pointer rounded-lg font-medium" data-date="21">21</div>
                                                    
                                                    <div class="demo-date p-3 text-sm text-center hover:bg-blue-100 cursor-pointer rounded-lg font-medium transition-all duration-200" data-date="22">22</div>
                                                    <div class="demo-date p-3 text-sm text-center hover:bg-blue-100 cursor-pointer rounded-lg font-medium transition-all duration-200" data-date="23">23</div>
                                                    <div class="demo-date p-3 text-sm text-center hover:bg-blue-100 cursor-pointer rounded-lg font-medium transition-all duration-200" data-date="24">24</div>
                                                    <div class="demo-date p-3 text-sm text-center hover:bg-blue-100 cursor-pointer rounded-lg font-medium transition-all duration-200" data-date="25">25</div>
                                                    <div class="demo-date p-3 text-sm text-center hover:bg-blue-100 cursor-pointer rounded-lg font-medium transition-all duration-200" data-date="26">26</div>
                                                    <div class="demo-date p-3 text-sm text-center bg-gray-50 text-gray-400 cursor-pointer rounded-lg font-medium" data-date="27">27</div>
                                                    <div class="demo-date p-3 text-sm text-center bg-gray-50 text-gray-400 cursor-pointer rounded-lg font-medium" data-date="28">28</div>
                                                </div>
                                            </div>
                                            
                                            <div id="date-selection-feedback" class="mt-4 text-sm text-gray-700 bg-blue-50 p-3 rounded-lg hidden border border-blue-200">
                                                <div class="flex items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 text-blue-600">
                                                        <path d="M9 12l2 2 4-4"></path>
                                                        <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h9z"></path>
                                                    </svg>
                                                    <strong>Geselecteerde periode:</strong> <span id="selected-period" class="ml-1">Geen</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Steps Indicator -->
                                        <div class="flex justify-center space-x-4 mt-4">
                                            <div class="flex items-center text-sm text-gray-600">
                                                <div class="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">1</div>
                                                <span>Start</span>
                                            </div>
                                            <div class="flex items-center text-sm text-gray-600">
                                                <div class="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">2</div>
                                                <span>Eind</span>
                                            </div>
                                            <div class="flex items-center text-sm text-gray-600">
                                                <div class="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">✓</div>
                                                <span>Klaar!</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Context Menu Demo -->
                                    <div class="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200 shadow-sm">
                                        <div class="flex items-center justify-center mb-6">
                                            <div class="bg-green-500 p-3 rounded-full mr-4">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <path d="M3 12h18m-9-9v18"></path>
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 class="text-xl font-bold text-green-800">Context Menu</h4>
                                                <p class="text-green-600 text-sm">Rechtermuisklik voor snelle acties</p>
                                            </div>
                                        </div>
                                        
                                        <!-- Enhanced Roster Demo -->
                                        <div class="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                                            <div class="text-center mb-3">
                                                <span class="text-sm font-medium text-gray-700">Week 3 - Januari 2024</span>
                                            </div>
                                            <div class="demo-roster-grid overflow-hidden rounded-lg border border-gray-200">
                                                <div class="grid grid-cols-6 gap-px bg-gray-200">
                                                    <div class="bg-gray-100 p-3 text-xs font-bold text-gray-700 text-center">Medewerker</div>
                                                    <div class="bg-gray-100 p-3 text-xs font-bold text-gray-700 text-center">Ma 15</div>
                                                    <div class="bg-gray-100 p-3 text-xs font-bold text-gray-700 text-center">Di 16</div>
                                                    <div class="bg-gray-100 p-3 text-xs font-bold text-gray-700 text-center">Wo 17</div>
                                                    <div class="bg-gray-100 p-3 text-xs font-bold text-gray-700 text-center">Do 18</div>
                                                    <div class="bg-gray-100 p-3 text-xs font-bold text-gray-700 text-center">Vr 19</div>
                                                    
                                                    <div class="bg-white p-3 text-xs font-medium text-gray-800">Jan Jansen</div>
                                                    <div class="demo-cell bg-white p-3 text-sm text-center cursor-pointer hover:bg-gray-50 font-medium border-l border-gray-100 transition-all duration-200" data-type="empty" data-employee="Jan Jansen" data-date="15">-</div>
                                                    <div class="demo-cell bg-blue-100 p-3 text-sm text-center cursor-pointer hover:bg-blue-200 font-bold text-blue-800 transition-all duration-200" data-type="verlof" data-employee="Jan Jansen" data-date="16">V</div>
                                                    <div class="demo-cell bg-blue-100 p-3 text-sm text-center cursor-pointer hover:bg-blue-200 font-bold text-blue-800 transition-all duration-200" data-type="verlof" data-employee="Jan Jansen" data-date="17">V</div>
                                                    <div class="demo-cell bg-white p-3 text-sm text-center cursor-pointer hover:bg-gray-50 font-medium border-l border-gray-100 transition-all duration-200" data-type="empty" data-employee="Jan Jansen" data-date="18">-</div>
                                                    <div class="demo-cell bg-green-100 p-3 text-sm text-center cursor-pointer hover:bg-green-200 font-bold text-green-800 transition-all duration-200" data-type="compensatie" data-employee="Jan Jansen" data-date="19">C</div>
                                                    
                                                    <div class="bg-white p-3 text-xs font-medium text-gray-800">Marie Smit</div>
                                                    <div class="demo-cell bg-red-100 p-3 text-sm text-center cursor-pointer hover:bg-red-200 font-bold text-red-800 transition-all duration-200" data-type="ziekte" data-employee="Marie Smit" data-date="15">Z</div>
                                                    <div class="demo-cell bg-white p-3 text-sm text-center cursor-pointer hover:bg-gray-50 font-medium border-l border-gray-100 transition-all duration-200" data-type="empty" data-employee="Marie Smit" data-date="16">-</div>
                                                    <div class="demo-cell bg-white p-3 text-sm text-center cursor-pointer hover:bg-gray-50 font-medium border-l border-gray-100 transition-all duration-200" data-type="empty" data-employee="Marie Smit" data-date="17">-</div>
                                                    <div class="demo-cell bg-white p-3 text-sm text-center cursor-pointer hover:bg-gray-50 font-medium border-l border-gray-100 transition-all duration-200" data-type="empty" data-employee="Marie Smit" data-date="18">-</div>
                                                    <div class="demo-cell bg-white p-3 text-sm text-center cursor-pointer hover:bg-gray-50 font-medium border-l border-gray-100 transition-all duration-200" data-type="empty" data-employee="Marie Smit" data-date="19">-</div>
                                                </div>
                                            </div>
                                            
                                            <!-- Demo Context Menu -->
                                            <div id="demo-context-menu" class="hidden absolute z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-2 min-w-52">
                                                <div id="demo-menu-content"></div>
                                            </div>
                                            
                                            <div id="context-menu-feedback" class="mt-4 text-sm text-gray-700 bg-green-50 p-3 rounded-lg hidden border border-green-200">
                                                <div class="flex items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 text-green-600">
                                                        <path d="M9 12l2 2 4-4"></path>
                                                    </svg>
                                                    <strong>Actie uitgevoerd:</strong> <span id="context-action" class="ml-1">Geen</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Legend for cells -->
                                        <div class="grid grid-cols-2 gap-2 mt-4 text-xs">
                                            <div class="flex items-center">
                                                <div class="w-6 h-6 bg-white border border-gray-300 rounded mr-2 flex items-center justify-center text-xs font-medium">-</div>
                                                <span class="text-gray-600">Lege cel → "Toevoegen"</span>
                                            </div>
                                            <div class="flex items-center">
                                                <div class="w-6 h-6 bg-blue-100 border border-blue-300 rounded mr-2 flex items-center justify-center text-xs font-bold text-blue-800">V</div>
                                                <span class="text-gray-600">Verlof → "Bewerken/Verwijderen"</span>
                                            </div>
                                            <div class="flex items-center">
                                                <div class="w-6 h-6 bg-green-100 border border-green-300 rounded mr-2 flex items-center justify-center text-xs font-bold text-green-800">C</div>
                                                <span class="text-gray-600">Compensatie → "Bewerken/Verwijderen"</span>
                                            </div>
                                            <div class="flex items-center">
                                                <div class="w-6 h-6 bg-red-100 border border-red-300 rounded mr-2 flex items-center justify-center text-xs font-bold text-red-800">Z</div>
                                                <span class="text-gray-600">Ziekte → "Bewerken/Verwijderen"</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Quick Tips Section -->
                                <div class="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200 shadow-sm">
                                    <h5 class="text-lg font-bold text-purple-800 mb-4 text-center">💡 Snelle Tips voor Optimaal Gebruik</h5>
                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div class="bg-white p-4 rounded-lg border border-purple-100">
                                            <div class="flex items-center mb-2">
                                                <span class="text-2xl mr-2">⚡</span>
                                                <strong class="text-purple-800">Snelkoppeling</strong>
                                            </div>
                                            <p class="text-gray-600">Gebruik Shift+klik voor meerdere dagen selecteren</p>
                                        </div>
                                        <div class="bg-white p-4 rounded-lg border border-purple-100">
                                            <div class="flex items-center mb-2">
                                                <span class="text-2xl mr-2">🖱️</span>
                                                <strong class="text-purple-800">Context Menu</strong>
                                            </div>
                                            <p class="text-gray-600">Rechtermuisklik is altijd beschikbaar op alle cellen</p>
                                        </div>
                                        <div class="bg-white p-4 rounded-lg border border-purple-100">
                                            <div class="flex items-center mb-2">
                                                <span class="text-2xl mr-2">📱</span>
                                                <strong class="text-purple-800">Mobiel</strong>
                                            </div>
                                            <p class="text-gray-600">Lang indrukken op mobile voor context menu</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Features Tab -->
                        <div id="features-tab-content" class="tab-content hidden">
                            <div class="space-y-6">
                                <div class="bg-blue-50 p-6 rounded-lg border border-blue-200">
                                    <h4 class="text-xl font-semibold text-blue-800 mb-4 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="9" cy="7" r="4"></circle>
                                            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                        </svg>
                                        Voor Alle Gebruikers
                                    </h4>
                                    
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div class="bg-white p-4 rounded border-l-4 border-blue-500">
                                            <h5 class="font-semibold text-gray-800 mb-2 flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                                </svg>
                                                Snelle Datum Selectie
                                            </h5>
                                            <ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
                                                <li>Klik eerst op startdatum, dan op einddatum</li>
                                                <li>Automatische periode invulling bij verlofaanvraag</li>
                                                <li>Visuele feedback tijdens selectie</li>
                                            </ul>
                                        </div>
                                        
                                        <div class="bg-white p-4 rounded border-l-4 border-green-500">
                                            <h5 class="font-semibold text-gray-800 mb-2 flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                                                    <path d="M3 12h18m-9-9v18"></path>
                                                </svg>
                                                Context Menu
                                            </h5>
                                            <ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
                                                <li>Rechtermuisklik voor snelle acties</li>
                                                <li>Toevoegen, bewerken, verwijderen</li>
                                                <li>Commentaar toevoegen aan entries</li>
                                            </ul>
                                        </div>
                                        
                                        <div class="bg-white p-4 rounded border-l-4 border-purple-500">
                                            <h5 class="font-semibold text-gray-800 mb-2 flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                                                    <path d="M12 2l2 3h3l-1 3 1 3h-3l-2 3-2-3H7l1-3-1-3h3l2-3z"></path>
                                                </svg>
                                                Verbeterde UX
                                            </h5>
                                            <ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
                                                <li>Snellere navigatie met sticky headers</li>
                                                <li>Beter zichtbare weekenden</li>
                                                <li>Verbeterde responsiveness</li>
                                                <li>Tooltips en hulpteksten</li>
                                            </ul>
                                        </div>
                                        
                                        <div class="bg-white p-4 rounded border-l-4 border-orange-500">
                                            <h5 class="font-semibold text-gray-800 mb-2 flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                                                    <circle cx="11" cy="11" r="8"></circle>
                                                    <path d="m21 21-4.35-4.35"></path>
                                                </svg>
                                                Performance
                                            </h5>
                                            <ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
                                                <li>Sneller laden (alleen huidige periode)</li>
                                                <li>Automatisch herladen bij navigatie</li>
                                                <li>Betere foutafhandeling</li>
                                                <li>Verbeterde zoekfunctionaliteit</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Admin Tab -->
                        <div id="admin-tab-content" class="tab-content hidden">
                            <div class="bg-amber-50 p-6 rounded-lg border border-amber-200">
                                <h4 class="text-xl font-semibold text-amber-800 mb-4 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                                    </svg>
                                    Extra Functies voor Beheerders
                                </h4>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div class="bg-white p-4 rounded border-l-4 border-red-500">
                                        <h5 class="font-semibold text-gray-800 mb-2 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                                <circle cx="9" cy="7" r="4"></circle>
                                                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                            </svg>
                                            Beheer Namens Anderen
                                        </h5>
                                        <ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
                                            <li>Selecteer eerst een medewerker</li>
                                            <li>Context menu voor anderen</li>
                                            <li>Ziekmelding voor team</li>
                                            <li>Bulkacties via Behandel Centrum</li>
                                        </ul>
                                    </div>
                                    
                                    <div class="bg-white p-4 rounded border-l-4 border-indigo-500">
                                        <h5 class="font-semibold text-gray-800 mb-2 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                                                <path d="M3 3v18h18"></path>
                                                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path>
                                            </svg>
                                            Uitgebreide Data Toegang
                                        </h5>
                                        <ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
                                            <li>Data Telling (checkbox in legenda)</li>
                                            <li>Beheercentra toegang</li>
                                            <li>Uitgebreide rapportages</li>
                                            <li>Gebruikersbeheer</li>
                                        </ul>
                                    </div>
                                    
                                    <div class="bg-white p-4 rounded border-l-4 border-green-600">
                                        <h5 class="font-semibold text-gray-800 mb-2 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                                                <circle cx="12" cy="12" r="3"></circle>
                                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                                            </svg>
                                            Geavanceerde Instellingen
                                        </h5>
                                        <ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
                                            <li>Systeem configuratie</li>
                                            <li>Data limits ($top=5000 in machtigingen.js)</li>
                                            <li>Bulk import/export</li>
                                            <li>Audit trails</li>
                                        </ul>
                                    </div>
                                    
                                    <div class="bg-white p-4 rounded border-l-4 border-yellow-500">
                                        <h5 class="font-semibold text-gray-800 mb-2 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                                                <path d="M12 9v6m0 0l-3-3m3 3l3-3M12 3a9 9 0 110 18 9 9 0 010-18z"></path>
                                            </svg>
                                            Belangrijke Tips
                                        </h5>
                                        <ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
                                            <li>Check data telling voor performance</li>
                                            <li>Bij lage tellingen: controleer $top waarde</li>
                                            <li>Gebruik bulk functies voor efficiency</li>
                                            <li>Monitor audit logs regelmatig</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-6 flex justify-between items-center">
                        <div class="text-sm text-gray-500">
                            💡 <strong>Tip:</strong> Voor meer hulp gebruik de "Help" knop rechtsbovenin
                        </div>
                        <button id="whats-new-close-button" class="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg text-sm shadow hover:shadow-md transition-all">
                            Begrepen!
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <div id="profile-card-container" class="profile-card hidden"></div>
    </div>
	
	<div id="rooster-context-menu" class="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg py-1 min-w-48">
        <ul>
            <li>
                <a href="#" id="context-menu-bewerken" class="context-menu-item block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block mr-2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Bewerken
                </a>
            </li>            <li>
                <a href="#" id="context-menu-verwijderen" class="context-menu-item block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block mr-2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                    Verwijderen
                </a>
            </li>
            <li>
                <a href="#" id="context-menu-nieuwe-toevoegen" class="context-menu-item block px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block mr-2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Nieuwe toevoegen
                </a>
            </li>
            <li>
                <a href="#" id="context-menu-commentaar" class="context-menu-item block px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/40">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block mr-2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Commentaar bewerken
                </a>
            </li>
        </ul>
    </div>    <script src="js/ui_utilities.js"></script>
    <script src="js/configLijst.js"></script>
    <script src="js/profielKaarten.js"></script>
    <script src="pages/js/meldingVerlof_logic.js"></script>
    <script src="pages/js/meldingZiekte_logic.js"></script>
    <script src="js/verlofroosterModal_logic.js"></script>
    <script src="js/verlofrooster_logic.js"></script>
    <script src="js/theme-toggle.js"></script>
    <script src="pages/js/meldingZittingsvrij_logic.js"></script>    <script src="js/verlofRooster_tour.js"></script>
    <script src="js/contextMenu_logic.js"></script>    <script>
        // Count Data Functionality for Sharepoint beheer group
        async function updateCountData() {
            // Check if user has permission using the proper permission system
            console.log('[CountData] Checking permissions for count data section...');
            console.log('[CountData] huidigeGebruiker:', window.huidigeGebruiker);
            console.log('[CountData] sharePointGroepen:', window.huidigeGebruiker?.sharePointGroepen);
            
            const hasPermission = window.heeftGebruikerMachtiging && 
                                  window.huidigeGebruiker && 
                                  window.huidigeGebruiker.sharePointGroepen &&
                                  window.heeftGebruikerMachtiging("CountDataSection", window.huidigeGebruiker.sharePointGroepen);

            console.log('[CountData] hasPermission:', hasPermission);

            if (hasPermission) {
                const countContainer = document.getElementById('count-data-container');
                const countToggle = document.getElementById('count-data-toggle');
                const countSection = document.getElementById('count-data-section');
                
                console.log('[CountData] Elements found:', {
                    countContainer: !!countContainer,
                    countToggle: !!countToggle,
                    countSection: !!countSection
                });
                
                if (countContainer) {
                    countContainer.classList.remove('hidden');
                    console.log('[CountData] Container made visible');
                }
                
                // Add checkbox event listener (only once)
                if (countToggle && countSection && !countToggle.hasAttribute('data-listener-added')) {
                    countToggle.setAttribute('data-listener-added', 'true');
                    countToggle.addEventListener('change', function() {
                        console.log('[CountData] Checkbox toggled:', this.checked);
                        if (this.checked) {
                            countSection.classList.remove('hidden');
                        } else {
                            countSection.classList.add('hidden');
                        }
                    });
                    console.log('[CountData] Checkbox event listener added');
                }
            } else {
                console.log('[CountData] User does not have permission for count data section');
            }

            // Direct SharePoint API call to get real counts (always get totals, not filtered)
            async function getDirectListCounts() {
                const results = {};
                
                try {
                    if (typeof window.getLijstItemsAlgemeen === 'function') {
                        // Get verlof count (always full count)
                        const verlofItems = await window.getLijstItemsAlgemeen(
                            'Verlof', 
                            '$select=ID,Title,MedewerkerID,StartDatum,EindDatum,Reden&$top=5000', 
                            ''
                        );
                        results.verlof = verlofItems ? verlofItems.length : 0;
                        
                        // Get compensatie count (always full count)
                        const compensatieItems = await window.getLijstItemsAlgemeen(
                            'CompensatieUren', 
                            '$select=ID,Title&$top=5000', 
                            ''
                        );
                        results.compensatie = compensatieItems ? compensatieItems.length : 0;
                        
                        // Get zittingvrij count (always full count)
                        const zittingVrijItems = await window.getLijstItemsAlgemeen(
                            'IncidenteelZittingVrij', 
                            '$select=ID,Title&$top=5000', 
                            ''
                        );
                        results.zittingvrij = zittingVrijItems ? zittingVrijItems.length : 0;
                        
                        console.log('Direct API counts:', results);
                    }
                } catch (error) {
                    console.error('Error getting direct list counts:', error);
                }
                
                return results;
            }

            // Get real counts using direct API (for total counts, not filtered)
            const directCounts = await getDirectListCounts();
            
            // Try to access data using different possible variable names (fallback for other counts)
            const verlofData = window.alleVerlofItems || window.alleVerlof || window.verlofData || window.Verlof || [];
            const compensatieData = window.alleCompensatieUrenItems || window.alleCompensatieUren || window.CompensatieUren || [];
            const zittingVrijData = window.alleIncidenteelZittingVrijItems || window.IncidenteelZittingVrij || [];

            // Count various data types using direct API first, then fallback to variables
            const counts = {
                verlof: directCounts.verlof || verlofData?.length || 0,
                compensatie: directCounts.compensatie || compensatieData?.length || 0,
                zittingvrij: directCounts.zittingvrij || zittingVrijData?.length || 0,
                medewerkers: window.alleMedewerkers ? window.alleMedewerkers.filter(m => m.Actief && !m.Verbergen).length : 0,
                teams: window.alleTeams ? window.alleTeams.length : 0,
                verlofredenen: window.alleVerlofredenen ? window.alleVerlofredenen.length : 0,
            };

            // Count ziekte items (verlof items with specific reasons)
            let ziekteCount = 0;
            if (window.alleVerlofItems && window.alleVerlofItems.length > 0) {
                ziekteCount = window.alleVerlofItems.filter(item => {
                    const reden = (item.VerlofReden || '').toLowerCase();
                    return reden.includes('ziekte') || reden.includes('ziek') || reden.includes('ziekmelding');
                }).length;
            }
            counts.ziekte = ziekteCount;

            console.log('Final counts:', counts);
            
            // Update the display
            const countElements = {
                'count-verlof': counts.verlof,
                'count-ziekte': counts.ziekte,
                'count-compensatie': counts.compensatie,
                'count-zittingvrij': counts.zittingvrij,
                'count-medewerkers': counts.medewerkers,
                'count-teams': counts.teams,
                'count-verlofredenen': counts.verlofredenen
            };

            Object.entries(countElements).forEach(([elementId, count]) => {
                const element = document.getElementById(elementId);
                if (element) {
                    const strongElement = element.querySelector('strong');
                    if (strongElement) {
                        strongElement.textContent = count.toString();
                    }
                }
            });

            // Log for debugging (only for authorized users)
            if (hasPermission) {
                console.log('Count Data Updated:', counts);
                console.log('User SharePoint Groups:', window.huidigeGebruiker.sharePointGroepen);
            }
        }
        
        // Hook into the existing data loading process
        const originalLaadInitieleData = window['Laadinitiele'];
        if (originalLaadInitieleData) {
            window['Laadinitiele'] = async function(...args) {
                const result = await originalLaadInitieleData.apply(this, args);
                // Update counts after data is loaded
                setTimeout(async () => {
                    await updateCountData();
                }, 500);
                return result;
            };
        }

        // Also update counts when roster is redrawn
        const originalTekenRooster = window.tekenRooster;
        if (originalTekenRooster) {
            window.tekenRooster = function(...args) {
                const result = originalTekenRooster.apply(this, args);
                // Update counts after roster is drawn
                setTimeout(async () => {
                    await updateCountData();
                }, 100);
                return result;
            };
        }

        // Initialize count data when page loads
        document.addEventListener('DOMContentLoaded', () => {
            // Wait for machtigingen to initialize
            if (window.machtigingenInitializationPromise) {
                window.machtigingenInitializationPromise.then(async () => {
                    setTimeout(async () => {
                        await updateCountData();
                    }, 1000);
                });
            } else {
                // Fallback if promise doesn't exist
                setTimeout(async () => {
                    await updateCountData();
                }, 2000);
            }
        });        // Make updateCountData available globally for manual calls
        window.updateCountData = updateCountData;
          // What's New Modal Functionality
        function initializeWhatsNewModal() {
            const whatsNewButton = document.getElementById('whats-new-button');
            const whatsNewModal = document.getElementById('whats-new-modal');
            const whatsNewClose = document.getElementById('whats-new-close');
            const whatsNewCloseButton = document.getElementById('whats-new-close-button');
            
            // Tab functionality
            const demoTabBtn = document.getElementById('demo-tab-btn');
            const featuresTabBtn = document.getElementById('features-tab-btn');
            const adminTabBtn = document.getElementById('admin-tab-btn');
            
            const demoTabContent = document.getElementById('demo-tab-content');
            const featuresTabContent = document.getElementById('features-tab-content');
            const adminTabContent = document.getElementById('admin-tab-content');
            
            let demoStartDate = null;
            let demoEndDate = null;
            
            // Check if user has privileged access
            function checkPrivilegedAccess() {
                if (window.huidigeGebruiker && window.huidigeGebruiker.sharePointGroepen) {
                    const privilegedGroups = [
                        "1. Sharepoint beheer", 
                        "1.1. Mulder MT", 
                        "2.6. Roosteraars", 
                        "2.3. Senioren beoordelen"
                    ];
                    
                    const hasPrivilegedAccess = window.huidigeGebruiker.sharePointGroepen.some(groep =>
                        privilegedGroups.some(privilegedGroup => 
                            groep.toLowerCase().includes(privilegedGroup.toLowerCase())
                        )
                    );
                    
                    if (hasPrivilegedAccess && adminTabBtn) {
                        adminTabBtn.classList.remove('hidden');
                    }
                }
            }
            
            // Tab switching functionality
            function switchTab(activeTab, activeContent) {
                // Reset all tabs
                [demoTabBtn, featuresTabBtn, adminTabBtn].forEach(btn => {
                    if (btn) {
                        btn.classList.remove('border-blue-500', 'text-blue-600', 'bg-blue-50');
                        btn.classList.add('border-transparent', 'text-gray-500');
                    }
                });
                
                // Reset all content
                [demoTabContent, featuresTabContent, adminTabContent].forEach(content => {
                    if (content) content.classList.add('hidden');
                });
                
                // Activate selected tab
                if (activeTab) {
                    activeTab.classList.remove('border-transparent', 'text-gray-500');
                    activeTab.classList.add('border-blue-500', 'text-blue-600', 'bg-blue-50');
                }
                
                // Show selected content
                if (activeContent) {
                    activeContent.classList.remove('hidden');
                }
            }
            
            // Initialize demo interactions
            function initializeDemoInteractions() {
                // Date selection demo
                const demoDates = document.querySelectorAll('.demo-date');
                const dateSelectionFeedback = document.getElementById('date-selection-feedback');
                const selectedPeriodSpan = document.getElementById('selected-period');
                
                demoDates.forEach(dateEl => {
                    dateEl.addEventListener('click', () => {
                        const clickedDate = parseInt(dateEl.dataset.date);
                        
                        if (!demoStartDate) {
                            // First click - set start date
                            demoStartDate = clickedDate;
                            dateEl.classList.add('bg-blue-500', 'text-white');
                            dateEl.classList.remove('hover:bg-blue-100');
                            
                            if (selectedPeriodSpan) {
                                selectedPeriodSpan.textContent = `Start: ${clickedDate}`;
                            }
                            if (dateSelectionFeedback) {
                                dateSelectionFeedback.classList.remove('hidden');
                            }
                        } else if (!demoEndDate && clickedDate !== demoStartDate) {
                            // Second click - set end date
                            demoEndDate = clickedDate;
                            dateEl.classList.add('bg-blue-500', 'text-white');
                            dateEl.classList.remove('hover:bg-blue-100');
                            
                            // Highlight range
                            const startDate = Math.min(demoStartDate, demoEndDate);
                            const endDate = Math.max(demoStartDate, demoEndDate);
                            
                            demoDates.forEach(el => {
                                const date = parseInt(el.dataset.date);
                                if (date >= startDate && date <= endDate) {
                                    el.classList.add('bg-blue-200');
                                }
                            });
                            
                            if (selectedPeriodSpan) {
                                selectedPeriodSpan.textContent = `${startDate} t/m ${endDate} (${endDate - startDate + 1} dagen)`;
                            }
                        } else {
                            // Reset demo
                            resetDateDemo();
                        }
                    });
                });
                
                function resetDateDemo() {
                    demoStartDate = null;
                    demoEndDate = null;
                    demoDates.forEach(el => {
                        el.classList.remove('bg-blue-500', 'text-white', 'bg-blue-200');
                        el.classList.add('hover:bg-blue-100');
                    });
                    if (dateSelectionFeedback) {
                        dateSelectionFeedback.classList.add('hidden');
                    }
                }
                
                // Context menu demo
                const demoCells = document.querySelectorAll('.demo-cell');
                const demoContextMenu = document.getElementById('demo-context-menu');
                const demoMenuContent = document.getElementById('demo-menu-content');
                const contextMenuFeedback = document.getElementById('context-menu-feedback');
                const contextAction = document.getElementById('context-action');
                  demoCells.forEach(cell => {
                    // Right-click context menu
                    cell.addEventListener('contextmenu', (e) => {
                        e.preventDefault();
                        showDemoContextMenu(e, cell);
                    });
                    
                    // Touch and hold for mobile (long press)
                    let touchTimer;
                    cell.addEventListener('touchstart', (e) => {
                        touchTimer = setTimeout(() => {
                            e.preventDefault();
                            showDemoContextMenu(e.touches[0], cell);
                        }, 500); // 500ms long press
                    });
                    
                    cell.addEventListener('touchend', () => {
                        clearTimeout(touchTimer);
                    });
                    
                    cell.addEventListener('touchmove', () => {
                        clearTimeout(touchTimer);
                    });
                });
                
                function showDemoContextMenu(event, cell) {
                    const cellType = cell.dataset.type;
                    const employee = cell.dataset.employee;
                    const date = cell.dataset.date;
                          // Create appropriate menu based on cell type
                        let menuHTML = '';
                        if (cellType === 'empty') {
                            menuHTML = `
                                <div class="px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 cursor-pointer demo-menu-item border-b border-gray-100 transition-all duration-200" data-action="nieuwe-toevoegen">
                                    <div class="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-3">
                                            <line x1="12" y1="5" x2="12" y2="19"></line>
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                        </svg>
                                        <div>
                                            <div class="font-medium">Nieuwe toevoegen</div>
                                            <div class="text-xs text-gray-500">Verlof of ziekte registreren</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer demo-menu-item transition-all duration-200" data-action="selecteer-periode">
                                    <div class="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-3">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                        </svg>
                                        <div>
                                            <div class="font-medium">Selecteer periode</div>
                                            <div class="text-xs text-gray-500">Meerdere dagen tegelijk</div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        } else {
                            const typeName = cellType === 'verlof' ? 'Verlof' : cellType === 'ziekte' ? 'Ziekmelding' : 'Compensatie';
                            const typeColor = cellType === 'verlof' ? 'blue' : cellType === 'ziekte' ? 'red' : 'green';
                            
                            menuHTML = `
                                <div class="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer demo-menu-item border-b border-gray-100 transition-all duration-200" data-action="bewerken">
                                    <div class="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-3">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                        <div>
                                            <div class="font-medium">Bewerken</div>
                                            <div class="text-xs text-gray-500">${typeName} aanpassen</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="px-4 py-3 text-sm text-${typeColor}-600 hover:bg-${typeColor}-50 cursor-pointer demo-menu-item border-b border-gray-100 transition-all duration-200" data-action="dupliceren">
                                    <div class="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-3">
                                            <rect x="5" y="5" width="14" height="14" rx="2" ry="2"></rect>
                                            <path d="M3 10h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z"></path>
                                        </svg>
                                        <div>
                                            <div class="font-medium">Dupliceren</div>
                                            <div class="text-xs text-gray-500">Voor andere periode</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="px-4 py-3 text-sm text-green-600 hover:bg-green-50 cursor-pointer demo-menu-item border-b border-gray-100 transition-all duration-200" data-action="commentaar">
                                    <div class="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-3">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                        </svg>
                                        <div>
                                            <div class="font-medium">Commentaar</div>
                                            <div class="text-xs text-gray-500">Notitie toevoegen</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="px-4 py-3 text-sm text-red-600 hover:bg-red-50 cursor-pointer demo-menu-item transition-all duration-200" data-action="verwijderen">
                                    <div class="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-3">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                                        </svg>
                                        <div>
                                            <div class="font-medium">Verwijderen</div>
                                            <div class="text-xs text-gray-500">${typeName} wissen</div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }
                        
                        if (demoMenuContent) {
                            demoMenuContent.innerHTML = menuHTML;
                        }
                        
                        // Position and show menu
                        if (demoContextMenu) {
                            demoContextMenu.style.left = e.pageX + 'px';
                            demoContextMenu.style.top = e.pageY + 'px';
                            demoContextMenu.classList.remove('hidden');
                        }
                          // Add click handlers to demo menu items
                        document.querySelectorAll('.demo-menu-item').forEach(item => {
                            item.addEventListener('click', (e) => {
                                e.stopPropagation();
                                const action = item.dataset.action;
                                let actionDescription = '';
                                
                                switch(action) {
                                    case 'nieuwe-toevoegen':
                                        actionDescription = `Nieuwe registratie voor ${employee} op ${date} januari`;
                                        break;
                                    case 'selecteer-periode':
                                        actionDescription = `Periode selectie gestart vanaf ${date} januari`;
                                        break;
                                    case 'bewerken':
                                        actionDescription = `${cellType.charAt(0).toUpperCase() + cellType.slice(1)} bewerken voor ${employee} op ${date} januari`;
                                        break;
                                    case 'dupliceren':
                                        actionDescription = `${cellType.charAt(0).toUpperCase() + cellType.slice(1)} dupliceren voor ${employee} vanaf ${date} januari`;
                                        break;
                                    case 'commentaar':
                                        actionDescription = `Commentaar bewerken voor ${employee} op ${date} januari`;
                                        break;
                                    case 'verwijderen':
                                        actionDescription = `${cellType.charAt(0).toUpperCase() + cellType.slice(1)} verwijderen voor ${employee} op ${date} januari`;
                                        break;
                                    default:
                                        actionDescription = `${action} voor ${employee} op ${date} januari`;
                                }
                                
                                if (contextAction) {
                                    contextAction.textContent = actionDescription;
                                }
                                if (contextMenuFeedback) {
                                    contextMenuFeedback.classList.remove('hidden');
                                    
                                    // Add animation effect
                                    contextMenuFeedback.style.transform = 'scale(0.95)';
                                    contextMenuFeedback.style.opacity = '0';
                                    setTimeout(() => {
                                        contextMenuFeedback.style.transform = 'scale(1)';
                                        contextMenuFeedback.style.opacity = '1';
                                        contextMenuFeedback.style.transition = 'all 0.2s ease-out';
                                    }, 50);
                                }
                                if (demoContextMenu) {
                                    demoContextMenu.classList.add('hidden');
                                }
                                
                                // Auto-hide feedback after 5 seconds
                                setTimeout(() => {
                                    if (contextMenuFeedback) {
                                        contextMenuFeedback.style.opacity = '0.7';
                                        setTimeout(() => {
                                            contextMenuFeedback.classList.add('hidden');
                                            contextMenuFeedback.style.opacity = '1';
                                        }, 2000);
                                    }
                                }, 5000);
                            });
                        });
                    });
                });
                
                // Hide context menu when clicking elsewhere
                document.addEventListener('click', () => {
                    if (demoContextMenu) {
                        demoContextMenu.classList.add('hidden');
                    }
                });
            }
            
            // Open modal
            function openWhatsNewModal() {
                if (whatsNewModal) {
                    checkPrivilegedAccess();
                    whatsNewModal.classList.remove('hidden');
                    
                    // Animate in
                    setTimeout(() => {
                        const modalCard = whatsNewModal.querySelector('.modal-card');
                        if (modalCard) {
                            modalCard.style.opacity = '1';
                            modalCard.style.transform = 'scale(1)';
                        }
                    }, 10);
                    
                    // Initialize demo interactions
                    initializeDemoInteractions();
                    
                    // Prevent body scroll
                    document.body.style.overflow = 'hidden';
                }
            }
            
            // Close modal
            function closeWhatsNewModal() {
                if (whatsNewModal) {
                    const modalCard = whatsNewModal.querySelector('.modal-card');
                    if (modalCard) {
                        modalCard.style.opacity = '0';
                        modalCard.style.transform = 'scale(0.95)';
                    }
                    
                    setTimeout(() => {
                        whatsNewModal.classList.add('hidden');
                        document.body.style.overflow = '';
                    }, 200);
                }
            }
            
            // Event listeners for tabs
            if (demoTabBtn) {
                demoTabBtn.addEventListener('click', () => switchTab(demoTabBtn, demoTabContent));
            }
            if (featuresTabBtn) {
                featuresTabBtn.addEventListener('click', () => switchTab(featuresTabBtn, featuresTabContent));
            }
            if (adminTabBtn) {
                adminTabBtn.addEventListener('click', () => switchTab(adminTabBtn, adminTabContent));
            }
            
            // Event listeners for modal
            if (whatsNewButton) {
                whatsNewButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    openWhatsNewModal();
                });
            }
            
            if (whatsNewClose) {
                whatsNewClose.addEventListener('click', closeWhatsNewModal);
            }
            
            if (whatsNewCloseButton) {
                whatsNewCloseButton.addEventListener('click', closeWhatsNewModal);
            }
            
            // Close on background click
            if (whatsNewModal) {
                whatsNewModal.addEventListener('click', (e) => {
                    if (e.target === whatsNewModal) {
                        closeWhatsNewModal();
                    }
                });
            }
            
            // Close on Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !whatsNewModal.classList.contains('hidden')) {
                    closeWhatsNewModal();
                }
            });
        }
        
        // Initialize What's New modal when DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initializeWhatsNewModal, 500);
        });
    </script>

</body>
</html>
