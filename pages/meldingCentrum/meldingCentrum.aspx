<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Feedback Portaal - Verlofrooster</title>
	<link rel="icon" type="image/svg+xml" href="../Icoon/favicon.svg">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/meldingMaken_styles.css">
    <style>
        /* Minimale inline styles, voornamelijk voor basis layout en animaties die niet direct thema-afhankelijk zijn */
        body {
            font-family: 'Inter', sans-serif;
            /* Thema-specifieke achtergrond en tekstkleur worden beheerd door meldingMaken_styles.css */
        }
        /* De JS-geïnjecteerde banner zal via meldingMaken_styles.css worden gestyled om niet als een paginabanner te ogen */
    </style>
</head>
<body class="light-theme">
    <div id="page-banner" class="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-gray-800 dark:to-gray-900 text-white p-6 md:p-8 shadow-lg">
        <div class="container mx-auto max-w-4xl">
            <div class="flex flex-col sm:flex-row justify-between items-center">
                <div class="flex items-center mb-4 sm:mb-0">
                    <svg class="w-10 h-10 sm:w-12 sm:h-12 mr-3 sm:mr-4 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"></path>
                    </svg>
                    <div>
                        <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-white">Feedback Portaal</h1>
                        <p class="mt-1 text-blue-100 dark:text-gray-300 text-sm md:text-base">Meld dingen die niet werken of beter kunnen! :)</p>
                    </div>
                </div>
                <a href="../verlofRooster.aspx" class="btn btn-secondary bg-white/20 hover:bg-white/30 dark:bg-gray-700/50 dark:hover:bg-gray-600/60 text-white dark:text-gray-200 text-sm flex items-center gap-2 border-none shadow-md hover:shadow-lg px-4 py-2 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    Terug naar Rooster
                </a>
            </div>
        </div>
    </div>

    <div id="app-container" class="container mx-auto p-4 md:p-6 max-w-4xl mt-[-2rem] md:mt-[-2.5rem]">
        <div class="bg-white dark:bg-gray-800 shadow-xl rounded-lg mb-8 overflow-hidden">
            <div class="relative"> <button id="theme-toggle" type="button" title="Wissel thema"
                        class="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-2.5 z-10">
                    <svg id="theme-toggle-dark-icon" class="hidden w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
                    <svg id="theme-toggle-light-icon" class="hidden w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm-.707 10.607a1 1 0 011.414-1.414l-.707-.707a1 1 0 01-1.414 1.414l.707.707zm12.728 0l.707-.707a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
                </button>

                <div class="px-4 md:px-6 pt-6 md:pt-8"> <section id="bestaande-feedback-sectie" class="mb-10">
                        <div class="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                     
                            <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                                <select id="feedback-filter" class="form-input text-sm py-2 px-3 w-full sm:w-auto">
                                    <option value="all">Alle feedback</option>
                                    <option value="mine">Mijn feedback</option>
                                    <option value="nieuw">Status: Nieuw</option>
                                    <option value="in-behandeling">Status: In behandeling</option>
                                    <option value="opgelost">Status: Opgelost</option>
                                </select>
                                <select id="feedback-sort" class="form-input text-sm py-2 px-3 w-full sm:w-auto">
                                    <option value="newest">Nieuwste eerst</option>
                                    <option value="oldest">Oudste eerst</option>
                                    <option value="status">Op status</option>
                                </select>
                            </div>
                        </div>
                        
                        <div id="feedback-loading-indicator" class="text-center py-6">
                            <div class="inline-flex items-center">
                                <svg class="animate-spin -ml-1 mr-3 h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <p class="text-gray-600 dark:text-gray-400 text-base">Feedback items laden...</p>
                            </div>
                        </div>
                        
                        <div id="feedback-items-container" class="space-y-4">
                            </div>
                        
                        <div id="geen-feedback-bericht" class="hidden text-center py-10">
                            <svg class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                            <p class="mt-3 text-lg font-medium text-gray-700 dark:text-gray-300">Geen feedback items gevonden</p>
                            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Pas de filters aan of wees de eerste die feedback geeft.</p>
                        </div>
                    </section>

                    <section id="nieuwe-feedback-sectie" class="border-t border-gray-300 dark:border-gray-700 pt-8">
                        <h2 class="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
                            Nieuwe Feedback Toevoegen
                        </h2>

                        <form id="melding-form" class="space-y-6 max-w-2xl mx-auto">
                            <input type="hidden" id="melding-type" name="meldingType" value="Feedback">

                            <fieldset class="border border-gray-300 dark:border-gray-600 p-4 rounded-lg">
                                <legend class="text-sm font-semibold px-2 text-gray-700 dark:text-gray-300">Uw Gegevens</legend>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                    <div>
                                        <label for="medewerker-naam" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Naam</label>
                                        <input type="text" id="medewerker-naam" name="medewerkerNaam" class="form-input bg-gray-100 dark:bg-gray-700 cursor-not-allowed" readonly>
                                    </div>
                                    <div>
                                        <label for="medewerker-team" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Team</label>
                                        <input type="text" id="medewerker-team" name="medewerkerTeam" class="form-input bg-gray-100 dark:bg-gray-700 cursor-not-allowed" readonly>
                                    </div>
                                </div>
                            </fieldset>

                            <fieldset class="border border-gray-300 dark:border-gray-600 p-4 rounded-lg">
                                <legend class="text-sm font-semibold px-2 text-gray-700 dark:text-gray-300">Feedback Details</legend>
                                <input type="hidden" id="feedback-titel" name="feedbackTitel"> 
                                <div class="mt-2">
                                    <label for="feedback-waarfout" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Onderwerp / Locatie</label>
                                    <input type="text" id="feedback-waarfout" name="feedbackWaarFout" class="form-input" list="fout-locaties" placeholder="Bijv. VerlofRooster pagina, Profielkaart">
                                    <datalist id="fout-locaties">
                                        <option value="VerlofRooster pagina"></option>
                                        <option value="Profielkaart"></option>
                                        <option value="Melding maken"></option>
                                        <option value="Admin Centrum"></option>
                                        <option value="Beheer Centrum"></option>
                                        <option value="Algemeen"></option>
                                    </datalist>
                                </div>
                                <div class="mt-4">
                                    <label for="feedback-beschrijving" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Beschrijving van uw feedback <span class="text-red-500">*</span></label>
                                    <textarea id="feedback-beschrijving" name="feedbackBeschrijving" rows="5" class="form-input" required></textarea>
                                </div>
                            </fieldset>
                            
                            <div class="flex items-center justify-end pt-4 space-x-3">
                                <button type="button" id="annuleren-button" class="btn btn-secondary">
                                    Annuleren
                                </button>
                                <button type="submit" id="indienen-button" class="btn btn-primary">
                                    Feedback Indienen
                                </button>
                            </div>
                        </form>
                    </section>
                    <div id="status-bericht" class="hidden mt-6 p-4 text-sm rounded-lg"></div>
                </div>
            </div>
        </div>
        
        <footer class="text-center mt-12 py-6 border-t border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-500 dark:text-gray-400">&copy; <span id="current-year"></span> Verlofrooster Applicatie</p>
        </footer>
    </div>

    <script src="../js/configLijst.js"></script>
    <script src="../js/theme-toggle.js"></script>
    <script src="js/meldingMaken_logic.js"></script>
</body>
</html>