<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zittingvrij Melden - Verlofrooster</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="pages/css/meldingZittingsvrij_styles.css">
    <link rel="stylesheet" href="../css/enhanced_styles.css">
    <style>
        body {
            font-family: 'Inter', sans-serif;
        }
        /* Basic scrollbar styling, can be enhanced in meldingZittingsvrij_styles.css or a global CSS */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        /* Styles for input fields, consistent with other forms */
        .form-input, .form-select, .form-textarea {
            width: 100%;
            padding: 0.625rem; /* p-2.5 */
            border-radius: 0.375rem; /* rounded-md */
            border-width: 1px;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
            transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
        }
        /* Styling for hidden recurring fields container */
        .recurring-fields-container.hidden {
            display: none;
        }
    </style>
</head>
<body class="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
    <div id="app-container" class="flex flex-col min-h-screen items-center justify-center p-4">

        <div class="w-full max-w-2xl bg-white dark:bg-gray-800 shadow-2xl rounded-xl p-6 md:p-8">
            <header class="mb-6 text-center">
                <h1 id="form-title" class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Incidenteel Zittingvrij Melden</h1>
                <p id="form-subtitle" class="text-gray-600 dark:text-gray-400 mt-1">Vul de gegevens in om een medewerker zittingvrij te melden.</p>
                <a href="../verlofRooster.aspx" class="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">&larr; Terug naar het rooster</a>
            </header>

            <form id="zittingvrij-form" class="space-y-6">
                <!-- Hidden fields for SharePoint submission -->
                <input type="hidden" id="form-titel" name="Title">
                <input type="hidden" id="MedewerkerID" name="MedewerkerID">

                <div id="modal-notification-area" class="notification-area hidden rounded-md" role="alert"></div>

                <div class="intro-banner-modal bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                    <p class="text-sm text-blue-800 dark:text-blue-100">
                        Hier kunt u een medewerker incidenteel zittingvrij melden. Zorg ervoor dat alle gegevens correct zijn ingevuld.
                    </p>
                </div>

                <fieldset class="border border-gray-300 dark:border-gray-600 p-4 rounded-lg">
                    <legend class="text-sm font-semibold px-2 text-gray-700 dark:text-gray-300">Medewerker Informatie</legend>
                    <div class="space-y-4">
                        <div>
                            <label for="form-medewerker-display" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medewerker <span class="text-red-500">*</span></label>
                            <input type="text" id="form-medewerker-display" name="MedewerkerDisplay"
                                   class="form-input bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200"
                                   placeholder="Typ volledige naam medewerker..." required>
                        </div>
                        <div>
                            <label for="form-gebruikersnaam" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gebruikersnaam (ter controle)</label>
                            <input type="text" id="form-gebruikersnaam" name="Gebruikersnaam"
                                   class="form-input bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                   placeholder="Wordt automatisch gevuld" readonly>
                        </div>
                    </div>
                </fieldset>

                <fieldset class="border border-gray-300 dark:border-gray-600 p-4 rounded-lg">
                    <legend class="text-sm font-semibold px-2 text-gray-700 dark:text-gray-300">Periode Zittingvrij</legend>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="form-start-datum" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Startdatum <span class="text-red-500">*</span></label>
                            <input type="date" id="form-start-datum" name="startDatum" class="form-input dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required>
                        </div>
                        <div>
                            <label for="form-start-tijd" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Starttijd <span class="text-red-500">*</span></label>
                            <input type="time" id="form-start-tijd" name="startTijd" class="form-input dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <label for="form-eind-datum" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Einddatum <span class="text-red-500">*</span></label>
                            <input type="date" id="form-eind-datum" name="eindDatum" class="form-input dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required>
                        </div>
                        <div>
                            <label for="form-eind-tijd" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Eindtijd <span class="text-red-500">*</span></label>
                            <input type="time" id="form-eind-tijd" name="eindTijd" class="form-input dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required>
                        </div>
                    </div>
                </fieldset>

                <fieldset class="border border-gray-300 dark:border-gray-600 p-4 rounded-lg">
                    <legend class="text-sm font-semibold px-2 text-gray-700 dark:text-gray-300">Details</legend>
                    <div>
                        <label for="form-opmerking" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Opmerking (intern, voor Beheer)</label>
                        <textarea id="form-opmerking" name="Opmerking" rows="3" class="form-textarea dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" placeholder="Reden of aanvullende details..."></textarea>
                    </div>
                </fieldset>

                <fieldset class="border border-gray-300 dark:border-gray-600 p-4 rounded-lg">
                    <legend class="text-sm font-semibold px-2 text-gray-700 dark:text-gray-300">Herhaling</legend>
                    <div class="flex items-center mt-2 mb-4">
                        <input id="form-terugkerend" name="Terugkerend" type="checkbox" class="h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
                        <label for="form-terugkerend" class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Terugkerend evenement</label>
                    </div>

                    <div id="recurring-fields-container" class="space-y-4 hidden">
                        <div>
                            <label for="form-terugkeerpatroon" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Terugkeerpatroon</label>
                            <select id="form-terugkeerpatroon" name="TerugkeerPatroon" class="form-select dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                                <option value="">Niet herhalen</option>
                                <option value="Dagelijks">Dagelijks</option>
                                <option value="Wekelijks">Wekelijks (zelfde dag v/d week)</option>
                                <option value="Maandelijks">Maandelijks (zelfde dag v/d maand)</option>
                            </select>
                        </div>
                        <div>
                            <label for="form-terugkerend-tot" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Herhalen tot en met</label>
                            <input type="date" id="form-terugkerend-tot" name="TerugkerendTot" class="form-input dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                        </div>
                    </div>
                </fieldset>
                
                <div class="flex items-center justify-end pt-4 border-t border-gray-300 dark:border-gray-600 space-x-3">
                    <button type="button" id="annuleren-button"
                        class="text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center">
                        Annuleren
                    </button>
                    <button type="submit" id="indienen-button"
                        class="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center">
                        Opslaan
                    </button>
                </div>
            </form>
            
            <div id="status-bericht" class="hidden mt-6 p-4 text-sm rounded-lg">
            </div>

        </div>

        <footer class="text-center mt-8 text-xs text-gray-500 dark:text-gray-400">
            <p>&copy; <span id="current-year"></span> Verlofrooster Applicatie</p>
        </footer>
    </div>

    <script src="../js/configLijst.js"></script>
    <script src="../js/util_auth.js"></script>
    <script src="../js/machtigingen.js"></script>
    <script src="../js/ui_utilities.js"></script>
    <script src="js/meldingZittingsvrij_logic.js"></script>
</body>
</html>
