<!DOCTYPE html>
<html lang="nl">
    
</html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ziekmelding</title>
</head>
<body class="ziekte-modal-body"> 
    <div class="form-container">
        <form id="ziekte-form" class="ziekte-form" novalidate>
            <input type="hidden" id="Title" name="Title">
            <input type="hidden" id="MedewerkerID" name="MedewerkerID"> 
            <input type="hidden" id="AanvraagTijdstip" name="AanvraagTijdstip">
            <input type="hidden" id="StartDatum" name="StartDatum"> 
            <input type="hidden" id="EindDatum" name="EindDatum">   
            <input type="hidden" id="Status" name="Status" value="Nieuw">
            <input type="hidden" id="RedenId" name="RedenId">
            <input type="hidden" id="Reden" name="Reden" value="Ziekte">

            <div class="form-header">
                <h2 class="form-title">Ziekmelding</h2>
            </div>

            <div id="modal-notification-area" class="notification-area hidden" role="alert">
                </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="ModalMedewerkerDisplay" class="form-label">Medewerker</label>
                    <input type="text" id="ModalMedewerkerDisplay" name="MedewerkerDisplay" class="form-input bg-gray-100 dark:bg-gray-700 cursor-not-allowed" readonly title="je naam zoals bekend in het systeem.">
                </div>
                 <div class="form-group">
                    <label for="ModalMedewerkerIDDisplay" class="form-label">Medewerker ID</label>
                    <input type="text" id="ModalMedewerkerIDDisplay" name="MedewerkerIDDisplay" class="form-input bg-gray-100 dark:bg-gray-700 cursor-not-allowed" readonly title="Je gebruikersnaam.">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="ModalStartDatePicker" class="form-label required">Startdatum</label>
                    <input type="date" id="ModalStartDatePicker" name="StartDatePicker" class="form-input" required title="Selecteer de startdatum van je ziekmelding.">
                </div>
                <div class="form-group">
                    <label for="ModalStartTimePicker" class="form-label required">Starttijd</label>
                    <input type="time" id="ModalStartTimePicker" name="StartTimePicker" class="form-input" value="09:00" required title="Selecteer de starttijd van je ziekmelding.">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="ModalEndDatePicker" class="form-label required">Einddatum</label>
                    <input type="date" id="ModalEndDatePicker" name="EndDatePicker" class="form-input" required title="Selecteer de einddatum van je ziekmelding.">
                </div>
                <div class="form-group">
                    <label for="ModalEndTimePicker" class="form-label required">Eindtijd</label>
                    <input type="time" id="ModalEndTimePicker" name="EndTimePicker" class="form-input" value="17:00" required title="Selecteer de eindtijd van je ziekmelding.">
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Reden</label>
                <input type="text" class="form-input bg-gray-100 dark:bg-gray-700 cursor-not-allowed" value="Ziekte" readonly title="De reden voor deze aanvraag is standaard Ziekte.">
            </div>

            <div class="form-group">
                <label for="ModalOmschrijving" class="form-label">Omschrijving (optioneel)</label>
                <textarea id="ModalOmschrijving" name="Omschrijving" class="form-textarea" placeholder="Eventuele toelichting, bijv. specifieke details over gedeeltelijke dag." title="Geef hier eventueel een extra toelichting op je ziekmelding."></textarea>
            </div>
            </form>
    </div>
    </body>
</html>
