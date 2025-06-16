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
        <div class="notification-area" id="notification-area"></div>
        
        <div class="form-header">
            <a href="../verlofRooster.aspx" class="back-link">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Terug naar rooster
            </a>
            <h1 class="form-title">Ziek/Beter Melden</h1>
        </div>
        
        <form id="ziekmelding-form" class="space-y-6">
            <!-- Super-user dropdown (hidden by default) -->
            <div class="form-group hidden" id="MedewerkerSelectGroup">
                <label for="ModalMedewerkerSelect" class="form-label">Medewerker selecteren</label>
                <select id="ModalMedewerkerSelect" class="form-select">
                    <option value="">Selecteer een medewerker...</option>
                </select>
            </div>
            
            <!-- Medewerker display fields -->
            <div class="form-row">
                <div class="form-group">
                    <label for="ModalMedewerkerDisplay" class="form-label">Medewerker</label>
                    <input type="text" id="ModalMedewerkerDisplay" class="form-input" readonly disabled>
                </div>
                
                <div class="form-group">
                    <label for="MedewerkerIDDisplay" class="form-label">Medewerker ID</label>
                    <input type="text" id="MedewerkerIDDisplay" class="form-input" readonly disabled>
                </div>
            </div>
            
            <div class="form-group">
                <label for="RedenDisplay" class="form-label">Reden</label>
                <input type="text" id="RedenDisplay" class="form-input" value="Ziekte" readonly disabled>
            </div>
            
            <!-- Datum/tijd fields -->
            <div class="form-row">
                <div class="form-group">
                    <label for="StartDatum" class="form-label">Startdatum</label>
                    <input type="date" id="StartDatum" class="form-input" required>
                </div>
                
                <div class="form-group">
                    <label for="EindDatum" class="form-label">Einddatum</label>
                    <input type="date" id="EindDatum" class="form-input" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="StartTijd" class="form-label">Starttijd</label>
                    <input type="time" id="StartTijd" class="form-input" value="09:00" required>
                </div>
                
                <div class="form-group">
                    <label for="EindTijd" class="form-label">Eindtijd</label>
                    <input type="time" id="EindTijd" class="form-input" value="17:00" required>
                </div>
            </div>
            
            <!-- Toelichting -->
            <div class="form-group">
                <label for="Toelichting" class="form-label">Toelichting (optioneel)</label>
                <textarea id="Toelichting" class="form-textarea" rows="4" 
                    placeholder="Eventuele aanvullende informatie..."></textarea>
            </div>
            
            <!-- Hidden fields for form submission -->
            <input type="hidden" id="Medewerker" name="Medewerker">
            <input type="hidden" id="MedewerkerID" name="MedewerkerID">
            <input type="hidden" id="Reden" name="Reden" value="Ziekte">
            
            <!-- Action buttons -->
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" class="btn btn-secondary" onclick="window.location.href='../verlofRooster.aspx'">
                    Annuleren
                </button>
                <button type="submit" class="btn btn-primary">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Ziekmelding Indienen
                </button>
            </div>
        </form>
    </div>
    
    <script src="../js/configLijst.js"></script>
    <script src="../js/util_auth.js"></script>
    <script src="js/meldingZiekte_logic.js"></script>
</body>
</html>