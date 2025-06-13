<!DOCTYPE html>
<html lang="nl" xmlns:mso="urn:schemas-microsoft-com:office:office" xmlns:msdt="uuid:C2F41010-65B3-11d1-A29F-00AA00C14882">
<%@ Register Tagprefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=16.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ziek/Beter Melden</title> <link rel="stylesheet" href="css/verlofrooster_styles.css">
    <link rel="stylesheet" href="css/profielKaart.css"> <link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="stylesheet" href="css/meldingZiekte_styles.css">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        /* Basis stijlen, geïnspireerd door TailwindCSS utility classes */
        body {
            font-family: 'Roboto', 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f9fafb; /* gray-50 */
            color: #1f2937; /* gray-800 */
            display: flex;
            flex-direction: column;
            min-height: 100vh;
        }
        .app-header {
            background-color: #ffffff; /* white */
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); /* shadow-md */
            padding: 1rem; /* p-4 */
            margin-bottom: 1.5rem; /* mb-6 */
        }
        .app-header h1 {
            font-size: 1.25rem; /* text-xl */
            font-weight: bold;
            color: #1f2937; /* gray-800 */
        }
        .form-container {
            display: flex;
            justify-content: center;
            align-items: flex-start; 
            flex-grow: 1;
            padding: 1rem; /* p-4 */
            width: 100%;
        }
        /* Specifieke class naam voor dit formulier om conflicten te voorkomen */
        .ziekmelding-form { 
            background: #ffffff; /* white */
            border-radius: 0.5rem; /* rounded-lg */
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* shadow-lg */
            width: 100%;
            max-width: 600px; /* max-w-2xl */
            padding: 1.5rem; /* p-6 */
            border: 1px solid #e5e7eb; /* border border-gray-200 */
        }
        .form-header {
            margin-bottom: 1.5rem; /* mb-6 */
            padding-bottom: 1rem; /* pb-4 */
            border-bottom: 1px solid #e5e7eb; /* border-b border-gray-200 */
        }
        .form-title {
            font-size: 1.25rem; /* text-xl */
            font-weight: 600; /* font-semibold */
            color: #111827; /* gray-900 */
            margin: 0;
        }
        .back-link {
            color: #3b82f6; /* text-blue-500 */
            text-decoration: none;
            font-size: 0.875rem; /* text-sm */
            display: inline-block;
            margin-top: 0.25rem; /* mt-1 */
        }
        .back-link:hover {
            text-decoration: underline;
            color: #2563eb; /* text-blue-600 */
        }
        .form-group {
            margin-bottom: 1rem; /* mb-4 */
        }
        .form-row {
            display: grid;
            grid-template-columns: repeat(1, minmax(0, 1fr)); /* default to 1 column */
            gap: 1rem; /* gap-4 */
        }
        @media (min-width: 640px) { /* sm breakpoint */
            .form-row {
                grid-template-columns: repeat(2, minmax(0, 1fr)); /* 2 columns on sm and up */
            }
        }
        .form-label {
            display: block;
            font-size: 0.875rem; /* text-sm */
            font-weight: 500; /* font-medium */
            margin-bottom: 0.25rem; /* mb-1 */
            color: #374151; /* text-gray-700 */
        }
        .required:after {
            content: " *";
            color: #ef4444; /* text-red-500 */
        }
        .form-input, .form-select, .form-textarea {
            width: 100%;
            padding: 0.5rem 0.75rem; /* py-2 px-3 */
            border: 1px solid #d1d5db; /* border-gray-300 */
            border-radius: 0.375rem; /* rounded-md */
            font-size: 0.875rem; /* text-sm */
            box-sizing: border-box;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
            transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
            font-family: inherit; 
        }
        .form-input:focus, .form-select:focus, .form-textarea:focus {
            outline: none;
            border-color: #3b82f6; /* focus:border-blue-500 */
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2); /* focus:ring focus:ring-blue-200 focus:ring-opacity-50 */
        }
        .form-input[readonly] {
            background-color: #f3f4f6; /* bg-gray-100 */
            color: #6b7280; /* text-gray-500 */
            cursor: not-allowed;
        }
        .form-textarea {
            resize: vertical;
            min-height: 100px;
        }
        .form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 0.5rem; /* gap-2 */
            margin-top: 1.5rem; /* mt-6 */
            padding-top: 1.5rem; /* pt-6 */
            border-top: 1px solid #e5e7eb; /* border-t border-gray-200 */
        }
        .btn {
            padding: 0.5rem 1rem; /* py-2 px-4 */
            border-radius: 0.375rem; /* rounded-md */
            font-size: 0.875rem; /* text-sm */
            font-weight: 500; /* font-medium */
            cursor: pointer;
            border: none;
            transition: background-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
            font-family: inherit; 
        }
        .btn:hover {
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); /* shadow-md */
        }
        .btn-primary {
            background-color: #3b82f6; /* bg-blue-500 */
            color: white;
        }
        .btn-primary:hover {
            background-color: #2563eb; /* hover:bg-blue-600 */
        }
        .btn-primary:disabled {
            background-color: #93c5fd; /* bg-blue-300 */
            cursor: not-allowed;
        }
        .btn-secondary {
            background-color: #e5e7eb; /* bg-gray-200 */
            color: #4b5563; /* text-gray-600 */
            border: 1px solid #d1d5db; /* border border-gray-300 */
        }
        .btn-secondary:hover {
            background-color: #d1d5db; /* hover:bg-gray-300 */
        }

        /* Dark mode styles (kunnen in een apart CSS-bestand of hier blijven voor eenvoud) */
        body.dark-mode {
            background-color: #111827; 
            color: #f3f4f6; 
        }
        body.dark-mode .app-header {
            background-color: #1f2937; 
            box-shadow: 0 1px 3px 0 rgba(0,0,0,0.3), 0 1px 2px 0 rgba(0,0,0,0.2);
        }
        body.dark-mode .app-header h1 {
             color: #f3f4f6; 
        }
        body.dark-mode .ziekmelding-form { /* Aangepaste class naam */
            background-color: #1f2937; 
            border-color: #374151; 
        }
        body.dark-mode .form-header {
            border-bottom-color: #374151; 
        }
        body.dark-mode .form-title {
            color: #f9fafb; 
        }
        body.dark-mode .back-link {
            color: #60a5fa; 
        }
        body.dark-mode .back-link:hover {
            color: #3b82f6; 
        }
        body.dark-mode .form-label {
            color: #d1d5db; 
        }
        body.dark-mode .form-input,
        body.dark-mode .form-select,
        body.dark-mode .form-textarea {
            background-color: #374151; 
            border-color: #4b5563; 
            color: #f3f4f6; 
        }
        body.dark-mode .form-input::placeholder,
        body.dark-mode .form-textarea::placeholder {
            color: #6b7280; 
        }
        body.dark-mode .form-input:focus,
        body.dark-mode .form-select:focus,
        body.dark-mode .form-textarea:focus {
            border-color: #60a5fa; 
            box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.3); 
        }
        body.dark-mode .form-input[readonly] {
            background-color: #4b5563; 
            color: #9ca3af; 
        }
        body.dark-mode .form-actions {
            border-top-color: #374151; 
        }
        body.dark-mode .btn-primary {
            background-color: #3b82f6; 
        }
        body.dark-mode .btn-primary:hover {
            background-color: #2563eb; 
        }
        body.dark-mode .btn-primary:disabled {
            background-color: #1e40af; 
        }
        body.dark-mode .btn-secondary {
            background-color: #374151; 
            color: #d1d5db; 
            border-color: #4b5563; 
        }
        body.dark-mode .btn-secondary:hover {
            background-color: #4b5563; 
        }

        /* Notification Area */
        .notification-area {
            padding: 0.75rem 1rem; 
            margin-bottom: 1rem; 
            border-radius: 0.375rem; 
            font-size: 0.875rem; 
            border-width: 1px;
            border-style: solid;
        }
        .notification-success {
            background-color: #d1fae5; 
            border-color: #6ee7b7; 
            color: #065f46; 
        }
        body.dark-mode .notification-success {
            background-color: #052e16; 
            border-color: #10b981; 
            color: #a7f3d0; 
        }
        .notification-error {
            background-color: #fee2e2; 
            border-color: #fca5a5; 
            color: #991b1b; 
        }
        body.dark-mode .notification-error {
            background-color: #450a0a; 
            border-color: #ef4444; 
            color: #fecaca; 
        }
        .notification-info {
            background-color: #e0f2fe; 
            border-color: #7dd3fc; 
            color: #075985; 
        }
        body.dark-mode .notification-info {
            background-color: #0c4a6e; 
            border-color: #38bdf8; 
            color: #bae6fd; 
        }
        .hidden {
            display: none !important;
        }
    </style>
<!--[if gte mso 9]><SharePoint:CTFieldRefs runat=server Prefix="mso:" FieldList="FileLeafRef,TaxCatchAllLabel,Opmerrking_x0020_over_x0020_bestand"><xml>
<mso:CustomDocumentProperties>
<mso:Opmerrking_x0020_over_x0020_bestand msdt:dt="string">&lt;div class=&quot;ExternalClassDA8E285E62074DCA87770320AC71D965&quot;&gt;De bestanden met prefix ''melding'' worden niet daadwerkelijk ingeladen als component in het verlofrooster zelf. Deze bestanden bestaan omdat het makkelijker is om een stand-alone pagina te maken en daar een samengevatte modal van te maken voor oinze modals (pop-up formulieren)&lt;br&gt;&lt;/div&gt;</mso:Opmerrking_x0020_over_x0020_bestand>
</mso:CustomDocumentProperties>
</xml></SharePoint:CTFieldRefs><![endif]-->
</head>
<body class="ziekmelding-modal-body"> <header class="app-header">
        <h1>Verlofrooster</h1>
    </header>

    <div class="form-container">
        <form id="ziekmelding-form" class="ziekmelding-form" novalidate>
            <input type="hidden" id="Title" name="Title">
            <input type="hidden" id="MedewerkerID" name="MedewerkerID">
            <input type="hidden" id="AanvraagTijdstip" name="AanvraagTijdstip">
            <input type="hidden" id="StartDatum" name="StartDatum">
            <input type="hidden" id="EindDatum" name="EindDatum">
            <input type="hidden" id="Status" name="Status" value="Nieuw"> <input type="hidden" id="RedenId" name="RedenId"> <input type="hidden" id="Reden" name="Reden" value="Ziekte"> <div class="form-header">
                <h2 class="form-title">Ziek/Beter Melden</h2> <a href="verlofRooster.aspx" class="back-link" title="Terug naar het volledige verlofrooster">&larr; Terug naar rooster</a>
            </div>

            <div id="modal-notification-area" class="notification-area hidden" role="alert">
                </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="MedewerkerDisplay" class="form-label">Medewerker</label>
                    <input type="text" id="MedewerkerDisplay" name="MedewerkerDisplay" class="form-input" readonly title="Uw naam zoals bekend in het systeem.">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="StartDatePicker" class="form-label required">Startdatum Ziekmelding</label>
                    <input type="date" id="StartDatePicker" name="StartDatePicker" class="form-input" required title="Selecteer de startdatum van uw ziekmelding.">
                </div>
                <div class="form-group">
                    <label for="StartTimePicker" class="form-label required">Starttijd</label>
                    <input type="time" id="StartTimePicker" name="StartTimePicker" class="form-input" value="09:00" required title="Selecteer de starttijd van uw ziekmelding.">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="EndDatePicker" class="form-label required">Verwachte Einddatum (of Beter gemeld op)</label>
                    <input type="date" id="EndDatePicker" name="EndDatePicker" class="form-input" required title="Selecteer de verwachte einddatum of de datum waarop u beter bent gemeld.">
                </div>
                <div class="form-group">
                    <label for="EndTimePicker" class="form-label required">Eindtijd</label>
                    <input type="time" id="EndTimePicker" name="EndTimePicker" class="form-input" value="17:00" required title="Selecteer de eindtijd (relevant bij beter melden op dezelfde dag).">
                </div>
            </div>

            <div class="form-group">
                <label for="Omschrijving" class="form-label">Toelichting (optioneel)</label>
                <textarea id="Omschrijving" name="Omschrijving" class="form-textarea" placeholder="Eventuele aanvullende informatie over uw ziekmelding." title="Geef hier eventueel een extra toelichting."></textarea>
            </div>

            <div class="form-actions">
                <a href="verlofRooster.aspx" class="btn btn-secondary">Annuleren</a>
                <button type="submit" id="submit-button" class="btn btn-primary">Melding Indienen</button>
            </div>
        </form>
    </div>

    <script src="js/configLijst.js"></script>
    <script src="js/util_auth.js"></script>
    <script src="js/js/meldingZiekte_logic.js"></script>
</body>
</html>
