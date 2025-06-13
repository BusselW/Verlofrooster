<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Compensatie-uren Indienen</title>
    <link rel="stylesheet" href="../css/meldingCompensatieuren_styles.css">
    <link rel="stylesheet" href="../css/verlofrooster_styles.css">
    <link rel="stylesheet" href="../css/profielKaart.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
</head>
<body>
    <header class="app-header">
        <h1>Verlofrooster</h1>
    </header>

    <div class="form-container">
        <form id="compensatie-form" class="compensatie-form">
            <input type="hidden" id="Title" name="Title">
            <input type="hidden" id="MedewerkerID" name="MedewerkerID">
            <input type="hidden" id="AanvraagTijdstip" name="AanvraagTijdstip">
            <input type="hidden" id="Status" name="Status" value="Ingediend">
            <input type="hidden" id="StartCompensatieUrenISO" name="StartCompensatieUrenISO">
            <input type="hidden" id="EindeCompensatieUrenISO" name="EindeCompensatieUrenISO">


            <div class="form-header">
                <h2 class="form-title">Compensatie-uren Indienen</h2>
                <a href="../verlofRooster.aspx" class="back-link" title="Terug naar het volledige verlofrooster">← Terug naar rooster</a>
            </div>

            <div id="notification-area" class="notification-area hidden" role="alert">
                </div>

            <div class="form-group">
                <label for="MedewerkerDisplay" class="form-label">Medewerker</label>
                <input type="text" id="MedewerkerDisplay" name="MedewerkerDisplay" class="form-input" readonly title="Uw naam zoals bekend in het systeem.">
            </div>
            
            <div class="form-group">
                <label for="MedewerkerIDDisplay" class="form-label">Medewerker ID</label>
                <input type="text" id="MedewerkerIDDisplay" class="form-input" disabled title="Uw gebruikersnaam in het systeem.">
            </div>

            <fieldset class="form-group border border-gray-300 dark:border-gray-600 p-4 rounded-md">
                <legend class="text-sm font-medium text-gray-700 dark:text-gray-300 px-1">Start Compensatie</legend>
                <div class="form-row mt-2">
                    <div class="form-group">
                        <label for="StartCompensatieDatum" class="form-label required">Startdatum</label>
                        <input type="date" id="StartCompensatieDatum" name="StartCompensatieDatum" class="form-input" required title="Selecteer de startdatum van de compensatie.">
                    </div>
                    <div class="form-group">
                        <label for="StartCompensatieTijd" class="form-label required">Starttijd</label>
                        <input type="time" id="StartCompensatieTijd" name="StartCompensatieTijd" class="form-input" value="09:00" required title="Selecteer de starttijd van de compensatie.">
                    </div>
                </div>
            </fieldset>

            <fieldset class="form-group border border-gray-300 dark:border-gray-600 p-4 rounded-md">
                <legend class="text-sm font-medium text-gray-700 dark:text-gray-300 px-1">Einde Compensatie</legend>
                <div class="form-row mt-2">
                    <div class="form-group">
                        <label for="EindeCompensatieDatum" class="form-label required">Einddatum</label>
                        <input type="date" id="EindeCompensatieDatum" name="EindeCompensatieDatum" class="form-input" required title="Selecteer de einddatum van de compensatie.">
                    </div>
                    <div class="form-group">
                        <label for="EindeCompensatieTijd" class="form-label required">Eindtijd</label>
                        <input type="time" id="EindeCompensatieTijd" name="EindeCompensatieTijd" class="form-input" value="17:00" required title="Selecteer de eindtijd van de compensatie.">
                    </div>
                </div>
            </fieldset>
            
            <div class="form-group">
                <label for="UrenTotaal" class="form-label">Totaal Uren</label>
                <input type="text" id="UrenTotaal" name="UrenTotaal" class="form-input" readonly title="Wordt automatisch berekend.">
            </div>

            <div class="form-group">
                <label for="Omschrijving" class="form-label required">Omschrijving</label>
                <textarea id="Omschrijving" name="Omschrijving" class="form-textarea" required placeholder="Geef een duidelijke omschrijving (bijv. project, reden van overwerk)." title="Geef een duidelijke omschrijving voor deze compensatie-uren."></textarea>
            </div>

            <div class="form-actions">
                <a href="../verlofRooster.aspx" class="btn btn-secondary">Annuleren</a>
                <button type="submit" id="submit-button" class="btn btn-primary">Dien Compensatie In</button>
            </div>
        </form>
    </div>

    <script src="../js/configLijst.js"></script>
    <script src="../js/util_auth.js"></script>
    <script src="js/meldingCompensatieuren.js"></script>
</body>
</html>
