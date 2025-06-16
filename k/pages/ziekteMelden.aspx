<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ziek/Beter Melden</title>
    <link rel="icon" type="image/svg+xml" href="../Icoon/favicon.svg">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        /* Basis stijlen consistent met de rest van de applicatie */
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f3f4f6; /* gray-100 */
            color: #1f2937; /* gray-800 */
            display: flex;
            flex-direction: column;
            min-height: 100vh;
        }
        
        /* Consistent met andere .aspx pagina's */
        .form-container {
            max-width: 800px;
            margin: 2rem auto;
            padding: 2rem;
            background-color: #ffffff;
            border-radius: 0.75rem; /* rounded-lg */
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            border: 1px solid #e5e7eb; /* border-gray-200 */
        }
        
        .form-header {
            border-bottom: 1px solid #e5e7eb; /* border-gray-200 */
            padding-bottom: 1rem;
            margin-bottom: 2rem;
        }
        
        .form-title {
            font-size: 1.875rem; /* text-3xl */
            font-weight: 700; /* font-bold */
            color: #1f2937; /* text-gray-800 */
            margin: 0;
        }
        
        .back-link {
            display: inline-flex;
            align-items: center;
            color: #3b82f6; /* text-blue-500 */
            text-decoration: none;
            font-weight: 500;
            margin-bottom: 1rem;
            transition: color 0.15s ease;
        }
        
        .back-link:hover {
            color: #1d4ed8; /* hover:text-blue-700 */
        }
        
        .form-label {
            display: block;
            font-weight: 500; /* font-medium */
            color: #374151; /* text-gray-700 */
            margin-bottom: 0.5rem;
            font-size: 0.875rem; /* text-sm */
        }
        
        .form-input, .form-select, .form-textarea {
            width: 100%;
            padding: 0.75rem; /* p-3 */
            border: 1px solid #d1d5db; /* border-gray-300 */
            border-radius: 0.5rem; /* rounded-lg */
            font-size: 0.875rem; /* text-sm */
            background-color: #ffffff;
            color: #1f2937;
            transition: border-color 0.15s ease, box-shadow 0.15s ease;
            font-family: inherit;
        }
        
        .form-input:focus, .form-select:focus, .form-textarea:focus {
            outline: none;
            border-color: #3b82f6; /* focus:border-blue-500 */
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); /* focus:ring */
        }
        
        .form-input[readonly], .form-input[disabled],
        .form-select[readonly], .form-select[disabled] {
            background-color: #f3f4f6; /* bg-gray-100 */
            color: #6b7280; /* text-gray-500 */
            cursor: not-allowed;
            opacity: 0.7;
        }
        
        .form-group {
            margin-bottom: 1.5rem;
        }
        
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }
        
        @media (max-width: 640px) {
            .form-row {
                grid-template-columns: 1fr;
            }
        }
        
        .btn {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 0.5rem;
            font-weight: 500;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.15s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            text-decoration: none;
            font-family: inherit;
        }
        
        .btn-primary {
            background-color: #3b82f6; /* bg-blue-500 */
            color: white;
        }
        
        .btn-primary:hover {
            background-color: #1d4ed8; /* hover:bg-blue-700 */
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        
        .btn-secondary {
            background-color: #6b7280; /* bg-gray-500 */
            color: white;
        }
        
        .btn-secondary:hover {
            background-color: #4b5563; /* hover:bg-gray-600 */
        }
        
        .notification-area {
            margin-bottom: 1.5rem;
        }
        
        .hidden {
            display: none !important;
        }
        
        /* Dark mode styles */
        body.dark-theme {
            background-color: #111827; /* gray-900 */
            color: #f3f4f6; /* gray-100 */
        }
        
        body.dark-theme .form-container {
            background-color: #1f2937; /* gray-800 */
            border-color: #374151; /* border-gray-600 */
        }
        
        body.dark-theme .form-header {
            border-bottom-color: #374151; /* border-gray-600 */
        }
        
        body.dark-theme .form-title {
            color: #f9fafb; /* text-gray-50 */
        }
        
        body.dark-theme .back-link {
            color: #60a5fa; /* text-blue-400 */
        }
        
        body.dark-theme .back-link:hover {
            color: #3b82f6; /* hover:text-blue-500 */
        }
        
        body.dark-theme .form-label {
            color: #d1d5db; /* text-gray-300 */
        }
        
        body.dark-theme .form-input, 
        body.dark-theme .form-select, 
        body.dark-theme .form-textarea {
            background-color: #374151; /* bg-gray-600 */
            border-color: #4b5563; /* border-gray-500 */
            color: #f3f4f6; /* text-gray-100 */
        }
        
        body.dark-theme .form-input[readonly], 
        body.dark-theme .form-input[disabled],
        body.dark-theme .form-select[readonly], 
        body.dark-theme .form-select[disabled] {
            background-color: #4b5563; /* bg-gray-500 */
            color: #9ca3af; /* text-gray-400 */
        }
    </style>
</head>
<body class="light-theme">
    <div class="form-container">
        <div class="notification-area" id="modal-notification-area"></div>
        
        <div class="form-header">
            <!-- Titel en terugknop worden nu meer dynamisch beheerd door de modal zelf of de standalone pagina logica -->
        </div>
        
        <form id="ziekmeldenForm" class="space-y-6"> <!-- Changed ID to ziekmeldenForm -->
            <!-- Verborgen velden die essentieel zijn voor SharePoint integratie -->
            <input type="hidden" id="Title" name="Title"> <!-- Wordt vaak automatisch gegenereerd -->
            <input type="hidden" id="MedewerkerID" name="MedewerkerID"> <!-- SharePoint User ID van de medewerker -->
            <input type="hidden" id="AanvraagTijdstip" name="AanvraagTijdstip"> <!-- ISO string van het moment van aanvraag -->
            <input type="hidden" id="Status" name="Status" value="Nieuw"> <!-- Standaard status -->
            <input type="hidden" id="RedenId" name="RedenId"> <!-- ID van de verlofreden (bijv. Ziekte) -->
            <input type="hidden" id="Reden" name="Reden" value="Ziekte"> <!-- Tekst van de reden, kan ook via RedenId -->

            <!-- Visuele header binnen het formulier -->
            <div class="form-header mb-6">
                <h2 class="form-title" id="modalFormTitle">Ziek/Beter Melden</h2>
                <!-- De teruglink is minder relevant in een modal, maar kan blijven voor standalone gebruik -->
                <a href="../verlofRooster.aspx" class="back-link mt-2 text-sm" title="Terug naar het volledige verlofrooster" id="backToRoosterLink">← Terug naar rooster</a>
            </div>

            <!-- Sectie voor Medewerker Selectie (Superuser) -->
            <div class="form-group hidden" id="medewerkerSelectRow" style="border: 1px solid #e5e7eb; padding: 1rem; border-radius: 0.5rem;">
                <label for="ModalMedewerkerSelect" class="form-label">Medewerker (voor supervisors):</label>
                <select id="ModalMedewerkerSelect" name="ModalMedewerkerSelect" class="form-select">
                    <option value="">Selecteer een medewerker...</option>
                </select>
            </div>

            <!-- Sectie voor Medewerker Weergave (Standaard gebruiker / Geselecteerde medewerker) -->
            <div class="form-group" id="medewerkerDisplayRow" style="border: 1px solid #e5e7eb; padding: 1rem; border-radius: 0.5rem;">
                <div class="form-group">
                    <label for="ModalMedewerkerDisplay" class="form-label">Medewerker:</label>
                    <input type="text" id="ModalMedewerkerDisplay" name="ModalMedewerkerDisplay" class="form-input" readonly style="background-color: #f9fafb; border: 1px solid #d1d5db;">
                </div>
                <div class="form-group">
                    <label for="ModalMedewerkerIDDisplay" class="form-label">Medewerker ID (SP User):</label>
                    <input type="text" id="ModalMedewerkerIDDisplay" name="ModalMedewerkerIDDisplay" class="form-input" readonly style="background-color: #f9fafb; border: 1px solid #d1d5db;">
                </div>
            </div>
            
            <!-- Reden (vast op "Ziekte" voor deze modal, maar getoond voor duidelijkheid) -->
            <div class="form-group" id="redenDisplayRow" style="border: 1px solid #e5e7eb; padding: 1rem; border-radius: 0.5rem;">
                <label for="ModalRedenDisplay" class="form-label">Reden:</label>
                <input type="text" id="ModalRedenDisplay" name="ModalRedenDisplay" class="form-input" value="Ziekte" readonly style="background-color: #f9fafb; border: 1px solid #d1d5db;">
            </div>

            <!-- Datum en Tijd Selectie -->
            <div class="form-row" style="border: 1px solid #e5e7eb; padding: 1rem; border-radius: 0.5rem;">
                <div class="form-group">
                    <label for="ModalBegindatum" class="form-label">Begindatum:</label>
                    <input type="date" id="ModalBegindatum" name="StartDatum" class="form-input" required>
                </div>
                <div class="form-group">
                    <label for="ModalEinddatum" class="form-label">Einddatum (leeg indien nog ziek):</label>
                    <input type="date" id="ModalEinddatum" name="EindDatum" class="form-input">
                </div>
            </div>
            <div class="form-row" style="border: 1px solid #e5e7eb; padding: 1rem; border-radius: 0.5rem;">
                <div class="form-group">
                    <label for="ModalBegintijd" class="form-label">Begintijd:</label>
                    <input type="time" id="ModalBegintijd" name="StartTijd" class="form-input">
                </div>
                <div class="form-group">
                    <label for="ModalEindtijd" class="form-label">Eindtijd:</label>
                    <input type="time" id="ModalEindtijd" name="EindTijd" class="form-input">
                </div>
            </div>
            <div class="form-group flex items-center" style="border: 1px solid #e5e7eb; padding: 1rem; border-radius: 0.5rem;">
                <input type="checkbox" id="ModalHeleDag" name="HeleDag" class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2" checked>
                <label for="ModalHeleDag" class="form-label mb-0">Hele dag</label>
            </div>

            <!-- Opmerkingen -->
            <div class="form-group" style="border: 1px solid #e5e7eb; padding: 1rem; border-radius: 0.5rem;">
                <label for="ModalOpmerkingen" class="form-label">Opmerkingen:</label>
                <textarea id="ModalOpmerkingen" name="Opmerkingen" rows="3" class="form-textarea"></textarea>
            </div>

            <!-- Actieknoppen (worden nu door de generieke modal logic in verlofroosterModal_logic.js afgehandeld) -->
            <!-- De knoppen hieronder zijn dus meer voor standalone testen -->
             <div class="flex justify-end space-x-3 mt-8" id="standaloneActionButtons">
                <button type="button" id="cancelZiekmeldingBtnStandalone" class="btn btn-secondary">Annuleren</button>
                <button type="submit" id="submitZiekmeldingBtnStandalone" class="btn btn-primary">Melding Opslaan</button>
            </div>
        </form>
    </div>
    
    <script src="../js/configLijst.js"></script>
    <script src="../js/util_auth.js"></script>
    <!-- Zorg dat de globale functies zoals getAlleMedewerkers beschikbaar zijn -->
    <script src="../js/verlofrooster_logic.js"></script> <!-- Voor getAlleMedewerkers etc. -->
    <script src="js/meldingZiekte_logic.js"></script>
    <script>
        // Standalone initialization if not in modal
        // This part is more for testing the .aspx page directly.
        // In modal context, initializeZiekmeldingModal will be called by verlofroosterModal_logic.js
        document.addEventListener('DOMContentLoaded', async () => {
            if (typeof initializeZiekmeldingModal === 'function' && 
                !document.body.classList.contains('modal-loaded-content')) { // Voorkom dubbele init
                
                // Mock current user info for standalone testing
                // In a real scenario, this would come from _spPageContextInfo of a global var
                const mockCurrentUser = window.huidigeGebruiker || { 
                    loginNaam: "i:0#.w|domain\\testuser",
                    displayName: "Test User (Afdeling)",
                    normalizedUsername: "domain\\testuser",
                    email: "testuser@example.com",
                    id: 1, // Mock SP User ID
                    medewerkerNaamVolledig: "Test User",
                    isSupervisor: true // Set to true or false to test scenarios
                };
                const mockSiteUrl = window.spWebAbsoluteUrl || "/sites/jouwomgeving"; // Pas aan indien nodig

                // Ensure global dependencies are loaded or mocked
                if (typeof window.getAlleMedewerkers !== 'function') {
                    window.getAlleMedewerkers = async () => { 
                        console.warn('Mocking getAlleMedewerkers');
                        return [
                            { LoginName: "i:0#.w|domain\\\\testuser", Account: "i:0#.w|domain\\\\testuser", VolledigeNaam: "Test User", DisplayName: "Test User", Id: 1, Email: "testuser@example.com" },
                            { LoginName: "i:0#.w|domain\\\\collega1", Account: "i:0#.w|domain\\\\collega1", VolledigeNaam: "Collega Een", DisplayName: "Collega Een", Id: 2, Email: "collega1@example.com" },
                            { LoginName: "i:0#.w|domain\\\\collega2", Account: "i:0#.w|domain\\\\collega2", VolledigeNaam: "Collega Twee", DisplayName: "Collega Twee", Id: 3, Email: "collega2@example.com" }
                        ];
                    };
                }
                 if (typeof window.getLijstItemsAlgemeen !== 'function') {
                    window.getLijstItemsAlgemeen = async (listTitle) => {
                        if (listTitle === 'Verlofredenen') {
                            return [
                                { Id: 1, Title: 'Verlof/vakantie' },
                                { Id: 2, Title: 'Ziekte' },
                                { Id: 3, Title: 'Speciaal verlof' }
                            ];
                        }
                        return [];
                    };
                }
                if (typeof window.isUserPrivilegedGroup !== 'function') { // Nodig voor isUserSuperUser
                     window.isUserPrivilegedGroup = () => mockCurrentUser.isSupervisor; // Simpele mock
                }


                try {
                    await initializeZiekmeldingModal(mockCurrentUser, mockSiteUrl, mockCurrentUser.isSupervisor);
                    console.log("Standalone ziekteMelden.aspx initialized.");
                } catch (error) {
                    console.error("Error initializing standalone ziekteMelden.aspx:", error);
                    const notificationArea = document.getElementById('modal-notification-area');
                    if(notificationArea) notificationArea.innerHTML = `<p class="text-red-500">Fout bij initialiseren: ${error.message}</p>`;
                }
            }
        });
    </script>
</body>
</html>