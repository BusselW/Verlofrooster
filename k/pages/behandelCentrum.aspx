<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verlofrooster - Beheercentrum</title>
    <link rel="icon" type="image/svg+xml" href="../Icoon/favicon.svg">
    <script src="../js/configLijst.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/beheerCentrum_styles.css">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            font-family: 'Inter', sans-serif;
        }
        
        .tab-button {
            position: relative;
            transition: color 0.2s ease-in-out, border-color 0.2s ease-in-out;
            padding-bottom: 0.75rem; 
            border-bottom: 3px solid transparent;
            flex-shrink: 0; /* Voorkomt dat knoppen krimpen */
        }
        .tab-button.active {
            font-weight: 600;
        }
        
        .tab-content {
            display: none;
            animation: fadeIn 0.4s ease-out;
        }
        .tab-content.active {
            display: block;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }
        /* Scrollbar styling for tab navigation on small screens */
        .tab-nav-container::-webkit-scrollbar {
            height: 4px;
        }
        .tab-nav-container::-webkit-scrollbar-track {
            background: transparent;
        }
        .tab-nav-container::-webkit-scrollbar-thumb {
            background-color: #4b5563; /* gray-600 */
            border-radius: 20px;
        }
        .dark-theme .tab-nav-container::-webkit-scrollbar-thumb {
            background-color: #6b7280; /* gray-500 */
        }
    </style>
</head>
<body class="light-theme">
    <div id="page-banner" class="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-gray-800 dark:to-gray-900 text-white p-6 md:p-8 shadow-lg relative">
        <a href="../verlofRooster.aspx" class="btn btn-back">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"></path>
            </svg>
            <span>Terug naar rooster</span>
        </a>
        
        <div class="w-full px-4 md:px-8 pr-24 md:pr-48">
            <div class="flex justify-between items-center">
                <div class="flex-1 pr-4">
                    <h1 class="text-3xl md:text-4xl font-bold">
                        Verlofrooster Beheercentrum
                    </h1>
                    <p class="mt-2 text-blue-100 dark:text-gray-300 text-sm md:text-base">
                        Beheer medewerkers, teams, verlofredenen en andere kerngegevens
                    </p>
                </div>
                <div class="text-right min-w-0 flex-shrink-0 max-w-48">
                    <div class="text-sm font-medium text-blue-100 dark:text-gray-200 truncate">
                        <span id="current-user">Gebruiker wordt geladen...</span>
                    </div>
                    <div class="text-xs mt-1 text-blue-200 dark:text-gray-300 truncate">
                        <span id="connection-status">Verbinden...</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div id="app-container" class="w-full p-4 md:p-6 mt-[-2rem] md:mt-[-2.5rem]">        
        <div class="tab-wrapper-card bg-white dark:bg-gray-800 shadow-xl rounded-lg p-0 md:p-0 mb-8 overflow-hidden">
            <div class="px-4 md:px-6 border-b border-gray-200 dark:border-gray-700">
                <!-- Container for horizontal scrolling on small screens -->
                <div class="tab-nav-container overflow-x-auto">
                    <nav class="flex -mb-px space-x-2 sm:space-x-4 md:space-x-6 whitespace-nowrap" aria-label="Tabs" id="tab-navigation">
                        <button data-tab="medewerkers" class="tab-button">
                            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
                            </svg>
                            Medewerkers
                        </button>
                        <button data-tab="dagen-indicators" class="tab-button">
                            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path>
                            </svg>
                            Dag Indicatoren
                        </button>
                        <button data-tab="functies" class="tab-button">
                            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clip-rule="evenodd"></path>
                            </svg>
                            Functies
                        </button>
                        <button data-tab="verlofredenen" class="tab-button">
                            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path>
                            </svg>
                            Verlofredenen
                        </button>
                        <button data-tab="teams" class="tab-button">
                            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"></path>
                            </svg>
                            Teams
                        </button>
                        <button data-tab="seniors" class="tab-button">
                            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                            </svg>
                            Seniors
                        </button>
                        <button data-tab="uren-per-week" class="tab-button">
                            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
                            </svg>
                            Uren Per Week
                        </button>
                        <button data-tab="incidenteel-zitting-vrij" class="tab-button">
                            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                            </svg>
                            Incidenteel Zitting Vrij
                        </button>
                    </nav>
                </div>
            </div>

            <div class="p-4 md:p-6">
                <main id="tab-content-container" class="tab-contents-wrapper">
                </main>
            </div>
        </div>

        <footer class="text-center mt-10 py-6 border-t border-gray-200 dark:border-gray-700" id="page-footer">
            <p class="text-xs text-gray-500 dark:text-gray-400">
                © <span id="current-year"></span> Verlofrooster Applicatie
            </p>
        </footer>
    </div>

    <div id="global-loading" class="hidden fixed inset-0 bg-gray-900 bg-opacity-75 z-[200] flex items-center justify-center">
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl flex items-center space-x-4">
            <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span id="loading-message" class="text-gray-800 dark:text-gray-200">Laden...</span>
        </div>
    </div>

    <div id="global-notification" class="hidden fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white z-[200]">
        <span id="notification-message"></span>
    </div>

    <div id="edit-modal" class="hidden fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <h3 id="modal-title" class="text-lg font-semibold text-gray-900 dark:text-white">Item bewerken</h3>
                <button id="modal-close" class="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div class="modal-form-content p-6 overflow-y-auto flex-grow">
                <form id="modal-form">
                    <div id="modal-fields"></div>
                </form>
                <div id="modal-status" class="mt-4"></div>
            </div>
            <div class="flex justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                <button id="modal-cancel" class="btn btn-secondary">Annuleren</button>
                <button id="modal-save" class="btn btn-primary">Opslaan</button>
            </div>
        </div>
    </div>

    <div id="confirm-modal" class="hidden fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div class="p-6">
                <div class="flex items-start">
                    <div class="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>
                    <div class="ml-4">
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Bevestiging Vereist</h3>
                        <div class="mt-2">
                            <p id="confirm-message" class="text-sm text-gray-600 dark:text-gray-300"></p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end space-x-3 rounded-b-lg">
                <button id="confirm-cancel" class="btn btn-secondary">Nee, annuleren</button>
                <button id="confirm-delete" class="btn btn-danger">Ja, verwijderen</button>
            </div>
        </div>
    </div>

    <script src="../js/configLijst.js"></script>
    <script src="../js/util_auth.js"></script>
    <script src="js/beheerCentrum_logic.js"></script>
</body>
</html>
