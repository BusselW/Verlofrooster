<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gebruikersinstellingen - Verlofrooster</title>
		<link rel="icon" type="image/svg+xml" href="../Icoon/favicon.svg">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/gInstellingen_styles.css">
    <style>
        body {
            font-family: 'Inter', sans-serif;
        }

        .tab-button {
            position: relative;
            transition: color 0.2s ease-in-out, border-color 0.2s ease-in-out;
            padding-bottom: 0.75rem; 
            border-bottom: 3px solid transparent;
        }
        .tab-button.active {
            font-weight: 600;
            /* Kleuren worden via CSS variabelen en thema klassen beheerd */
        }
        /* De ::after pseudo-element voor de underline wordt nu volledig in gInstellingen_styles.css beheerd */
        
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

        .toggle-switch { position: relative; display: inline-block; width: 42px; height: 24px; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e0; transition: .3s; border-radius: 24px; }
        .toggle-slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; }
        input:checked + .toggle-slider { background-color: var(--primary-licht, #3b82f6); }
        input:checked + .toggle-slider:before { transform: translateX(18px); }
    </style>
</head>
<body class="light-theme"> <div id="page-banner" class="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-gray-800 dark:to-gray-900 text-white p-6 md:p-8 shadow-lg">
        <div class="container mx-auto max-w-4xl">
            <div class="flex justify-between items-center">
                <h1 class="text-3xl md:text-4xl font-bold">
                    Gebruikersinstellingen
                </h1>
                <a href="../verlofRooster.aspx" class="btn btn-secondary bg-white/20 hover:bg-white/30 dark:bg-gray-700/50 dark:hover:bg-gray-600/60 text-white dark:text-gray-200 text-sm flex items-center gap-2 border-none shadow-md hover:shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    Terug naar Rooster
                </a>
            </div>
            <p class="mt-2 text-blue-100 dark:text-gray-300 text-sm md:text-base">Beheer hier uw persoonlijke gegevens, werkrooster en rooster voorkeuren.</p>
        </div>
    </div>

    <div id="app-container" class="container mx-auto p-4 md:p-6 max-w-4xl mt-[-2rem] md:mt-[-2.5rem]">
        <div class="tab-wrapper-card bg-white dark:bg-gray-800 shadow-xl rounded-lg p-0 md:p-0 mb-8 overflow-hidden">
            <div class="px-4 md:px-6 border-b border-gray-200 dark:border-gray-700">
                <nav class="flex flex-wrap -mb-px space-x-2 sm:space-x-4 md:space-x-6" aria-label="Tabs">
                    <button data-tab="profiel" class="tab-button active py-3 px-2 sm:px-3 md:px-4 inline-flex items-center gap-x-2 text-sm font-medium text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1 md:mr-2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        Mijn Profiel
                    </button>
                    <button data-tab="werkuren" class="tab-button py-3 px-2 sm:px-3 md:px-4 inline-flex items-center gap-x-2 text-sm font-medium text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1 md:mr-2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        Mijn Werktijden
                    </button>
                    <button data-tab="instellingen" class="tab-button py-3 px-2 sm:px-3 md:px-4 inline-flex items-center gap-x-2 text-sm font-medium text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1 md:mr-2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                        Instellingen
                    </button>
                </nav>
            </div>

            <div class="p-4 md:p-6">
                <div id="tab-content-profiel" class="tab-content active">
                    <h2 class="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-100">Mijn Profiel</h2>
                    <form id="persoonlijke-gegevens-form" class="space-y-6">
                        <div class="flex flex-col items-center sm:flex-row sm:items-start sm:space-x-6">
                            <div class="profile-picture-container mb-4 sm:mb-0 flex-shrink-0">
                                <img id="pg-profile-pic" src="https://placehold.co/100x100/e2e8f0/334155?text=Foto" alt="Profielfoto" class="transition-all duration-300">
                            </div>
                            <div class="flex-grow space-y-4 w-full">
                                <div>
                                    <label for="pg-naam" class="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Volledige Naam</label>
                                    <input type="text" id="pg-naam" name="naam" class="form-input mt-1 w-full">
                                </div>
                                <div>
                                    <label for="pg-username" class="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Gebruikersnaam (Login)</label>
                                    <input type="text" id="pg-username" name="username" class="form-input mt-1 w-full cursor-not-allowed opacity-75" readonly>
                                </div>
                                <div>
                                    <label for="pg-email" class="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">E-mailadres</label>
                                    <input type="email" id="pg-email" name="email" class="form-input mt-1 w-full cursor-not-allowed opacity-75" readonly>
                                </div>
                                 <div>
                                    <label for="pg-geboortedatum" class="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Geboortedatum</label>
                                    <input type="date" id="pg-geboortedatum" name="geboortedatum" class="form-input mt-1 w-full">
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label for="pg-team" class="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Team</label>
                                        <select id="pg-team" name="team" class="form-select mt-1 w-full">
                                            <option value="">Laden...</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label for="pg-functie" class="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Functie</label>
                                        <select id="pg-functie" name="functie" class="form-select mt-1 w-full">
                                            <option value="">Laden...</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="pt-4 flex justify-end border-t border-gray-200 dark:border-gray-700 mt-6">
                            <button type="button" id="opslaan-persoonlijke-gegevens-knop" class="btn btn-success">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                                Profiel Opslaan
                            </button>
                        </div>
                    </form>
                    <div id="persoonlijke-gegevens-status-bericht" class="hidden status-message mt-4"></div>
                </div>
    
                <div id="tab-content-werkuren" class="tab-content">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 md:mb-0">
                            Mijn Werktijden
                        </h2>
                        <button type="button" id="wijzig-werkrooster-knop" class="btn btn-primary text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            Werkrooster Wijzigen
                        </button>
                    </div>
                    <p class="text-sm mb-5 text-gray-600 dark:text-gray-400">Hieronder ziet u uw huidige standaard werkrooster. Klik op "Werkrooster Wijzigen" om een nieuw werkrooster (met nieuwe ingangsdatum) toe te voegen.</p>
    
                    <div id="werkdagen-display-container" class="rounded-lg overflow-x-auto">
                        <table class="schedule-table min-w-full">
                            <thead>
                                <tr>
                                    <th scope="col" class="w-1/3 md:w-1/4">Dag</th>
                                    <th scope="col" class="w-1/3 md:w-1/2">Werktijden</th>
                                    <th scope="col" class="w-1/3 md:w-1/4">Status</th>
                                </tr>
                            </thead>
                            <tbody id="werkdagen-tabel-body">
                                <tr>
                                    <td colspan="3" class="py-6 text-center text-gray-500 dark:text-gray-400 italic">Werkrooster informatie wordt geladen...</td>
                                </tr>
                            </tbody>
                        </table>
                        <p id="rooster-geldig-vanaf" class="text-xs p-3 text-gray-500 dark:text-gray-400 hidden italic text-center"></p>
                    </div>
    
                    <div id="werkrooster-edit-form-container" class="hidden mt-6 space-y-6">
                        <div>
                            <label for="werkrooster-wijzigingsdatum" class="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Ingangsdatum Nieuw Werkrooster <span class="text-red-500">*</span></label>
                            <input type="date" id="werkrooster-wijzigingsdatum" name="wijzigingsdatum" class="form-input mt-1 w-full md:w-auto">
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Selecteer de datum vanaf wanneer dit nieuwe rooster geldig is.</p>
                        </div>
                        
                        <div class="werkrooster-form-card p-4 sm:p-6 rounded-lg shadow-sm">
                             <div class="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                                <h4 class="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2">Globale Tijdinstelling (voor Ma-Vr)</h4>
                                <div class="flex flex-col sm:flex-row items-center gap-3">
                                    <div class="flex-1 w-full sm:w-auto">
                                        <label for="global-start-time-ginst" class="sr-only">Globale Starttijd</label>
                                        <input type="time" id="global-start-time-ginst" class="form-input w-full text-sm" title="Globale starttijd">
                                    </div>
                                    <div class="flex-1 w-full sm:w-auto">
                                        <label for="global-end-time-ginst" class="sr-only">Globale Eindtijd</label>
                                        <input type="time" id="global-end-time-ginst" class="form-input w-full text-sm" title="Globale eindtijd">
                                    </div>
                                    <button type="button" id="apply-global-time-button-ginst" class="btn btn-secondary btn-sm w-full sm:w-auto text-xs">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="mr-1.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        Toepassen op alle dagen
                                    </button>
                                </div>
                            </div>
                            <div id="werkrooster-input-rows" class="space-y-3">
                                 <div class="grid grid-cols-1 md:grid-cols-5 gap-x-3 gap-y-2 items-center p-2 font-semibold text-xs text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 mb-1">
                                    <span class="md:col-span-1">Dag</span>
                                    <span class="md:col-span-1 text-center">Starttijd</span>
                                    <span class="md:col-span-1 text-center">Eindtijd</span>
                                    <span class="md:col-span-1 text-center">Vrije dag</span>
                                    <span class="md:col-span-1 text-center">Berekende Soort</span>
                                </div>
                                <div class="text-center py-8 text-gray-500 dark:text-gray-400 italic">
                                    Werkrooster invoervelden worden hier geladen...
                                </div>
                            </div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 mt-3">
                             Selecteer 'Vrije dag' als u op een dag niet werkt. Tijden zijn dan niet nodig.
                            </div>
                        </div>

                        <div class="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
                            <button type="button" id="annuleer-werkrooster-knop" class="btn btn-secondary w-full sm:w-auto">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                Annuleren
                            </button>
                            <button type="button" id="opslaan-werkrooster-knop" class="btn btn-success w-full sm:w-auto">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                                Nieuw Werkrooster Opslaan
                            </button>
                        </div>
                        <div id="werkrooster-status-bericht" class="hidden status-message"></div>
                    </div>
                </div>
    
                <div id="tab-content-instellingen" class="tab-content">
                    <h2 class="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-100">Rooster Weergave Instellingen</h2>
                    <form id="rooster-instellingen-form" class="space-y-6">
                        <div>
                            <label for="inst-thema" class="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Thema Voorkeur</label>
                            <select id="inst-thema" name="soortWeergave" class="form-select mt-1 w-full">
                                <option value="light">Licht Thema</option>
                                <option value="dark">Donker Thema</option>
                            </select>
                        </div>
                        
                        <div class="space-y-3 pt-2">
                            <div class="toggle-row-container flex items-center justify-between p-3.5 rounded-md shadow-sm">
                                <label for="inst-eigen-team" class="text-sm text-gray-700 dark:text-gray-300 mr-3">Standaard alleen eigen team tonen in rooster</label>
                                <label class="toggle-switch flex-shrink-0">
                                    <input type="checkbox" id="inst-eigen-team" name="eigenTeamWeergeven">
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                            
                            <div class="toggle-row-container flex items-center justify-between p-3.5 rounded-md shadow-sm">
                                <label for="inst-weekenden" class="text-sm text-gray-700 dark:text-gray-300 mr-3">Weekenden (za/zo) weergeven in het rooster</label>
                                <label class="toggle-switch flex-shrink-0">
                                    <input type="checkbox" id="inst-weekenden" name="weekendenWeergeven">
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
                            <button type="button" id="opslaan-instellingen-button" class="btn btn-primary hidden">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                                Instellingen Opslaan
                            </button>
                        </div>
                    </form>
                    <div id="instellingen-status-bericht" class="hidden status-message mt-4"></div>
                </div>
            </div>
        </div>

        <footer class="text-center mt-10 py-6 border-t border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-500 dark:text-gray-400">&copy; <span id="current-year"></span> Verlofrooster Applicatie</p>
        </footer>
    </div>

    <script src="../js/configLijst.js"></script>
    <script src="../js/util_auth.js"></script>
    <script src="js/gInstellingen_logic.js"></script>
</body>
</html>
