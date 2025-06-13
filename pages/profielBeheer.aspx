<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Profielbeheer - Verlofrooster</title>
	<link rel="icon" type="image/svg+xml" href="../Icoon/favicon.svg">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/profielBeheer_styles.css">
    <style>
        body {
            font-family: 'Inter', sans-serif;
        }
        .step-content { display: none; animation: fadeIn 0.4s ease-out; }
        .step-content.active { display: block; }
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
<body class="light-theme">
    <div id="page-banner" class="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-gray-800 dark:to-gray-900 text-white p-6 md:p-8 shadow-lg">
        <div class="container mx-auto max-w-4xl">
            <div class="flex justify-between items-center">
                <h1 class="text-3xl md:text-4xl font-bold">Profielbeheer</h1>
                <a href="../verlofRooster.aspx" class="btn btn-secondary bg-white/20 hover:bg-white/30 dark:bg-gray-700/50 dark:hover:bg-gray-600/60 text-white dark:text-gray-200 text-sm flex items-center gap-2 border-none shadow-md hover:shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    Terug naar Rooster
                </a>
            </div>
            <p class="mt-2 text-blue-100 dark:text-gray-300 text-sm md:text-base">Voltooi je registratie om gebruik te maken van het verlofrooster.</p>
        </div>
    </div>

    <div id="app-container" class="container mx-auto p-4 md:p-6 max-w-4xl mt-[-2rem] md:mt-[-2.5rem]">
        <div class="tab-wrapper-card bg-white dark:bg-gray-800 shadow-xl rounded-lg p-0 md:p-0 mb-8 overflow-hidden">
            <div class="px-4 md:px-6 pt-4 md:pt-5">
                <div class="step-indicator-container">
                    <div id="step-indicator-1" class="step-indicator active">
                        <div class="step-circle">1</div>
                        <span>Persoonlijke Info</span>
                    </div>
                    <div id="step-indicator-2" class="step-indicator">
                        <div class="step-circle">2</div>
                        <span>Rooster Setup</span>
                    </div>
                    <div id="step-indicator-3" class="step-indicator">
                        <div class="step-circle">3</div>
                        <span>Werkrooster</span>
                    </div>
                </div>
            </div>
            <div class="p-4 md:p-6">
                <div id="step-1-content" class="step-content active">
                    <h2 class="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-100">Stap 1: Persoonlijke Informatie</h2>
                    <form id="persoonlijke-info-form" class="space-y-6">
                        <div class="flex flex-col items-center sm:flex-row sm:items-start sm:space-x-6">
                            <div class="profile-picture-container mb-4 sm:mb-0 flex-shrink-0">
                                <img id="pg-profile-pic" src="https://placehold.co/100x100/e2e8f0/334155?text=Foto" alt="Profielfoto" class="transition-all duration-300">
                            </div>
                            <div class="flex-grow space-y-4 w-full">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label for="pg-voornaam" class="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Voornaam</label>
                                        <input type="text" id="pg-voornaam" name="voornaam" class="form-input mt-1 w-full" required>
                                    </div>
                                    <div>
                                        <label for="pg-achternaam" class="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Achternaam</label>
                                        <input type="text" id="pg-achternaam" name="achternaam" class="form-input mt-1 w-full" required>
                                    </div>
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
                                    <label for="pg-telefoon" class="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Telefoonnummer</label>
                                    <input type="tel" id="pg-telefoon" name="telefoon" class="form-input mt-1 w-full" placeholder="Je telefoonnummer (optioneel)">
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
                        <div class="pt-6 flex justify-end border-t border-gray-200 dark:border-gray-700 mt-8">
                            <button type="button" id="next-step-1-button" class="btn btn-primary">
                                Volgende
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </button>
                        </div>
                    </form>
                    <div id="persoonlijke-info-status-bericht" class="hidden status-message mt-4"></div>
                </div>

                <div id="step-2-content" class="step-content"> 
                    <h2 class="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-100">Stap 2: Rooster Weergave Instellingen</h2>
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
                        
                        <div class="pt-6 flex justify-between border-t border-gray-200 dark:border-gray-700 mt-8">
                             <button type="button" id="prev-step-2-button" class="btn btn-secondary">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                Vorige
                            </button>
                            <button type="button" id="next-step-2-button" class="btn btn-primary">
                                Volgende
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </button>
                        </div>
                    </form>
                    <div id="instellingen-status-bericht" class="hidden status-message mt-4"></div>
                </div>

                <div id="step-3-content" class="step-content">
                    <h2 class="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-100">Stap 3: Standaard Werkrooster</h2>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Stel hieronder je standaard werkdagen en -tijden in. De codes 'VVO', 'VVM', 'VVD' zullen worden weergeven in het rooster. Het is belangrijk dat je je werktijden regelmatig bijwerkt.
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-6">
                        Tip: Gebruik de globale tijdinstelling hieronder om snel alle dagen dezelfde werktijden te geven en pas daarna aan wat aangepast moet worden.
                    </p>
                    
                    <div id="standaard-werkdagen-edit-container" class="space-y-6">
                         <div class="werkrooster-form-card p-4 sm:p-6 rounded-lg shadow-md">
                            <div class="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                                <h4 class="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2">Globale Tijdinstelling</h4>
                                <div class="flex flex-col sm:flex-row items-center gap-3">
                                    <div class="flex-1 w-full sm:w-auto">
                                        <label for="global-start-time" class="sr-only">Globale Starttijd</label>
                                        <input type="time" id="global-start-time" class="form-input w-full text-sm" title="Globale starttijd">
                                    </div>
                                    <div class="flex-1 w-full sm:w-auto">
                                        <label for="global-end-time" class="sr-only">Globale Eindtijd</label>
                                        <input type="time" id="global-end-time" class="form-input w-full text-sm" title="Globale eindtijd">
                                    </div>
                                    <button type="button" id="apply-global-time-button" class="btn btn-secondary btn-sm w-full sm:w-auto text-xs">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="mr-1.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        Toepassen op alle dagen
                                    </button>
                                </div>
                            </div>
                            <div id="werkdagen-edit-form-profiel" class="space-y-3">
                                <div class="grid grid-cols-1 md:grid-cols-6 gap-x-3 gap-y-2 items-center p-2 font-semibold text-xs text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 mb-1">
                                    <span class="md:col-span-1">Dag</span>
                                    <span class="md:col-span-1 text-center">Starttijd</span>
                                    <span class="md:col-span-1 text-center">Eindtijd</span>
                                    <span class="md:col-span-1 text-center">Vrije dag</span>
                                    <span class="md:col-span-1 text-center">Berekende Soort</span>
                                    <span class="md:col-span-1 text-center">Totaal Uren</span> 
                                </div>
                                <div class="text-center py-8 text-gray-500 dark:text-gray-400 italic">
                                    Werkrooster invoervelden worden hier geladen...
                                </div>
                            </div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 mt-4">
                                Selecteer 'Vrije dag' als je op een dag niet werkt. Tijden zijn dan niet nodig.
                            </div>
                        </div>
                    </div>

                    <div class="pt-8 flex justify-between border-t border-gray-200 dark:border-gray-700 mt-8">
                         <button type="button" id="prev-step-3-button" class="btn btn-secondary">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                            Vorige
                        </button>
                        <button type="button" id="complete-registration-button" class="btn btn-success">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                            Registratie Voltooien
                        </button>
                    </div>
                    <div id="werkrooster-status-bericht" class="hidden status-message mt-4"></div>
                </div>
            </div>
            </div>

        <footer class="text-center mt-10 py-6 border-t border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-500 dark:text-gray-400">&copy; <span id="current-year"></span> Verlofrooster Applicatie</p>
        </footer>
    </div>

    <script src="../js/configLijst.js"></script>
    <script src="../js/util_auth.js"></script>
    <script src="js/profielBeheer_logic.js"></script>
</body>
</html>
