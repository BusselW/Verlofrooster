document.addEventListener('DOMContentLoaded', function() {
            // Globale variabelen voor deze pagina
            const spWebAbsoluteUrl = "https://som.org.om.local/sites/MulderT/CustomPW/Verlof";

            let currentUserLoginName = "";
            let currentUserDisplayName = "";
            let currentUserNormalizedLoginName = "";

            // DOM Elementen
            const form = document.getElementById('compensatie-form');
            const notificationArea = document.getElementById('notification-area');
            const submitButton = document.getElementById('submit-button');

            const medewerkerDisplayInput = document.getElementById('MedewerkerDisplay');
            const medewerkerIdInput = document.getElementById('MedewerkerID');
            const titleInput = document.getElementById('Title');
            const aanvraagTijdstipInput = document.getElementById('AanvraagTijdstip');

            const startCompensatieDatumInput = document.getElementById('StartCompensatieDatum');
            const startCompensatieTijdInput = document.getElementById('StartCompensatieTijd');
            const eindeCompensatieDatumInput = document.getElementById('EindeCompensatieDatum');
            const eindeCompensatieTijdInput = document.getElementById('EindeCompensatieTijd');
            
            const startCompensatieUrenISOInput = document.getElementById('StartCompensatieUrenISO'); // Verborgen
            const eindeCompensatieUrenISOInput = document.getElementById('EindeCompensatieUrenISO'); // Verborgen

            const urenTotaalInput = document.getElementById('UrenTotaal');
            const omschrijvingTextarea = document.getElementById('Omschrijving');
            const statusInput = document.getElementById('Status');

            /**
             * Utility functie om SharePoint claims prefix van loginnaam te verwijderen.
             */

            /**
             * Haalt een X-RequestDigest op.
             */
            async function getRequestDigest() {
                console.log("Ophalen Request Digest van:", `${spWebAbsoluteUrl}/_api/contextinfo`);
                const response = await fetch(`${spWebAbsoluteUrl}/_api/contextinfo`, {
                    method: 'POST',
                    headers: { 'Accept': 'application/json;odata=verbose' }
                });
                if (!response.ok) {
                    console.error("Fout bij ophalen request digest:", response.status, await response.text().catch(()=>""));
                    throw new Error('Kon request digest niet ophalen.');
                }
                const data = await response.json();
                console.log("Request Digest succesvol opgehaald.");
                return data.d.GetContextWebInformation.FormDigestValue;
            }

            /**
             * Toont een notificatie bericht.
             */
            function toonNotificatie(bericht, type = 'info', autoHideDelay = 7000) {
                console.log(`[Notificatie] Type: ${type}, Bericht: ${bericht}`);
                notificationArea.textContent = bericht;
                notificationArea.className = 'notification-area'; // Reset classes
                notificationArea.classList.add(`notification-${type}`);
                notificationArea.classList.remove('hidden');

                if (notificationArea.timeoutId) clearTimeout(notificationArea.timeoutId);
                if (autoHideDelay !== false) {
                    notificationArea.timeoutId = setTimeout(() => {
                        notificationArea.classList.add('hidden');
                    }, autoHideDelay);
                }
            }

            /**
             * Initialiseert gebruikersinformatie en thema.
             */
            async function initializeGebruikersInfoEnThema() {
                console.log("Start initialisatie gebruikersinfo en thema voor compensatieformulier.");
                console.log("Gebruikte SharePoint Web Absolute URL:", spWebAbsoluteUrl);

                try {
                    const userResponse = await fetch(`${spWebAbsoluteUrl}/_api/web/currentUser?$select=LoginName,Title`, {
                        headers: { 'Accept': 'application/json;odata=verbose' }
                    });
                    if (!userResponse.ok) {
                        const errorText = await userResponse.text().catch(()=>"");
                        console.error("Fout bij ophalen gebruikersdata:", userResponse.status, errorText);
                        throw new Error(`Kon gebruikersdata niet ophalen: ${userResponse.status}`);
                    }
                    const userData = await userResponse.json();

                    currentUserLoginName = userData.d.LoginName;
                    currentUserDisplayName = userData.d.Title;
                    currentUserNormalizedLoginName = window.trimLoginNaamPrefix(currentUserLoginName);
                    console.log(`Huidige gebruiker: ${currentUserDisplayName} (Genormaliseerd: ${currentUserNormalizedLoginName})`);

                    medewerkerDisplayInput.value = currentUserDisplayName;
                    medewerkerIdInput.value = currentUserNormalizedLoginName;
                    
                    // Add this line to populate the new display field
                    document.getElementById('MedewerkerIDDisplay').value = currentUserNormalizedLoginName;

                    const today = new Date();
                    const dateStr = today.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    titleInput.value = `Compensatie ${currentUserDisplayName} - ${dateStr}`;
                    aanvraagTijdstipInput.value = today.toISOString();

                    // Pas thema toe
                    const instellingenCfg = getLijstConfig('gebruikersInstellingen');
                    if (instellingenCfg && instellingenCfg.lijstId) {
                        const themeApiUrl = `${spWebAbsoluteUrl}/_api/web/lists(guid'${instellingenCfg.lijstId}')/items?$filter=Title eq '${encodeURIComponent(currentUserNormalizedLoginName)}'&$select=soortWeergave`;
                        const themeResponse = await fetch(themeApiUrl, { headers: { 'Accept': 'application/json;odata=verbose' } });
                        if (themeResponse.ok) {
                            const themeData = await themeResponse.json();
                            if (themeData.d.results.length > 0 && themeData.d.results[0].soortWeergave === 'dark') {
                                document.body.classList.add('dark-mode');
                            } else {
                                document.body.classList.remove('dark-mode');
                            }
                        } else { document.body.classList.remove('dark-mode'); }
                    } else { document.body.classList.remove('dark-mode'); }
                } catch (error) {
                    console.error('Fout bij ophalen gebruikersdata of thema:', error);
                    toonNotificatie('Kon gebruikersinformatie of thema niet laden.', 'error');
                    medewerkerDisplayInput.value = 'Gebruiker (fout)';
                    document.body.classList.remove('dark-mode');
                }
            }
            
            /**
             * Berekent het totaal aantal uren tussen start- en eindtijd.
             */
            function berekenUrenTotaal() {
                const startDatumValue = startCompensatieDatumInput.value;
                const startTijdValue = startCompensatieTijdInput.value;
                const eindDatumValue = eindeCompensatieDatumInput.value;
                const eindTijdValue = eindeCompensatieTijdInput.value;

                if (startDatumValue && startTijdValue && eindDatumValue && eindTijdValue) {
                    const startDatumTijd = new Date(`${startDatumValue}T${startTijdValue}`);
                    const eindDatumTijd = new Date(`${eindDatumValue}T${eindTijdValue}`);

                    if (!isNaN(startDatumTijd.getTime()) && !isNaN(eindDatumTijd.getTime()) && eindDatumTijd > startDatumTijd) {
                        const verschilInMs = eindDatumTijd - startDatumTijd;
                        const verschilInUren = verschilInMs / (1000 * 60 * 60);
                        urenTotaalInput.value = verschilInUren.toFixed(2) + " uur";
                    } else {
                        urenTotaalInput.value = "Ongeldige periode";
                    }
                } else {
                    urenTotaalInput.value = "";
                }
            }

            /**
             * Valideert het formulier.
             */
            function valideerFormulier() {
                if (!startCompensatieDatumInput.value || !startCompensatieTijdInput.value || 
                    !eindeCompensatieDatumInput.value || !eindeCompensatieTijdInput.value || 
                    !omschrijvingTextarea.value) {
                    toonNotificatie('Vul alle verplichte velden (*) in.', 'error');
                    return false;
                }
                const startDatumTijd = new Date(`${startCompensatieDatumInput.value}T${startCompensatieTijdInput.value}`);
                const eindDatumTijd = new Date(`${eindeCompensatieDatumInput.value}T${eindeCompensatieTijdInput.value}`);

                if (isNaN(startDatumTijd.getTime()) || isNaN(eindDatumTijd.getTime())) {
                    toonNotificatie('Ongeldige datum of tijd ingevoerd.', 'error');
                    return false;
                }
                if (eindDatumTijd <= startDatumTijd) {
                    toonNotificatie('De einddatum en -tijd moeten na de startdatum en -tijd liggen.', 'error');
                    return false;
                }
                return true;
            }

            /**
             * Verwerkt het verzenden van het formulier.
             */
            async function handleFormulierVerzenden(e) {
                e.preventDefault();
                console.log("Compensatie formulierverwerking gestart...");
                submitButton.disabled = true;
                submitButton.textContent = 'Bezig met indienen...';
                toonNotificatie('Bezig met indienen van uw compensatie...', 'info', false);

                if (!valideerFormulier()) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Dien Compensatie In';
                    return;
                }
                
                // Update aanvraagtijdstip en titel
                aanvraagTijdstipInput.value = new Date().toISOString();
                const startDatumVoorTitel = new Date(`${startCompensatieDatumInput.value}T${startCompensatieTijdInput.value}`);
                const dateStr = startDatumVoorTitel.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
                titleInput.value = `Compensatie ${currentUserDisplayName} - ${dateStr}`;

                // Combineer datum en tijd naar ISO strings voor SharePoint
                const startDateTimeISO = new Date(`${startCompensatieDatumInput.value}T${startCompensatieTijdInput.value}`).toISOString();
                const eindeDateTimeISO = new Date(`${eindeCompensatieDatumInput.value}T${eindeCompensatieTijdInput.value}`).toISOString();
                startCompensatieUrenISOInput.value = startDateTimeISO;
                eindeCompensatieUrenISOInput.value = eindeDateTimeISO;


                const compensatieLijstConfig = getLijstConfig('CompensatieUren');
                if (!compensatieLijstConfig || !compensatieLijstConfig.lijstId || !compensatieLijstConfig.lijstTitel) {
                    toonNotificatie('Fout: Compensatie kan niet worden verwerkt (configuratie ontbreekt).', 'error', false);
                    submitButton.disabled = false;
                    submitButton.textContent = 'Dien Compensatie In';
                    console.error("Configuratie voor 'CompensatieUren' lijst niet gevonden of incompleet.");
                    return;
                }
                const listNameForMetadata = compensatieLijstConfig.lijstTitel.replace(/\s+/g, '_');

                const formDataPayload = {
                    __metadata: { type: `SP.Data.${listNameForMetadata}ListItem` },
                    Title: titleInput.value,
                    Medewerker: medewerkerDisplayInput.value,
                    MedewerkerID: medewerkerIdInput.value,
                    AanvraagTijdstip: aanvraagTijdstipInput.value,
                    StartCompensatieUren: startCompensatieUrenISOInput.value, // Gebruik de ISO string
                    EindeCompensatieUren: eindeCompensatieUrenISOInput.value, // Gebruik de ISO string
                    UrenTotaal: urenTotaalInput.value,
                    Omschrijving: omschrijvingTextarea.value,
                    Status: statusInput.value // "Ingediend"
                };

                console.log('Voor te bereiden payload voor SharePoint (CompensatieUren):', JSON.stringify(formDataPayload, null, 2));

                try {
                    const requestDigest = await getRequestDigest();
                    const createItemUrl = `${spWebAbsoluteUrl}/_api/web/lists(guid'${compensatieLijstConfig.lijstId}')/items`;
                    console.log("Versturen van data naar:", createItemUrl);

                    const response = await fetch(createItemUrl, {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json;odata=verbose',
                            'Content-Type': 'application/json;odata=verbose',
                            'X-RequestDigest': requestDigest
                        },
                        body: JSON.stringify(formDataPayload)
                    });

                    if (!response.ok && response.status !== 201) {
                        const errorData = await response.json().catch(() => null);
                        const spErrorMessage = errorData?.error?.message?.value || `Serverfout: ${response.status}`;
                        console.error("Fout bij opslaan compensatie in SharePoint:", response.status, spErrorMessage, errorData);
                        throw new Error(`Kon compensatie niet opslaan. ${spErrorMessage}`);
                    }

                    console.log("Compensatie succesvol opgeslagen in SharePoint.");
                    toonNotificatie('Compensatie-uren succesvol ingediend!', 'success');
                    form.reset();
                    // Herstel standaardwaarden na reset
                    medewerkerDisplayInput.value = currentUserDisplayName;
                    medewerkerIdInput.value = currentUserNormalizedLoginName;
                    const todayForTitle = new Date();
                    const dateStrForTitle = todayForTitle.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    titleInput.value = `Compensatie ${currentUserDisplayName} - ${dateStrForTitle}`;
                    aanvraagTijdstipInput.value = todayForTitle.toISOString();
                    statusInput.value = "Ingediend";
                    urenTotaalInput.value = "";
                    // Reset date/time pickers
                    setDefaultDateTimes();


                } catch (error) {
                    console.error('Fout bij indienen compensatie:', error);
                    toonNotificatie(`Fout bij indienen: ${error.message}. Probeer het opnieuw.`, 'error', false);
                } finally {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Dien Compensatie In';
                }
            }
            
            /**
             * Stelt de standaard datum en tijd in voor de pickers.
             */
            function setDefaultDateTimes() {
                const nu = new Date();
                const vandaagISO = nu.toISOString().split('T')[0];
                const nuTijd = nu.toTimeString().slice(0,5); // HH:mm

                startCompensatieDatumInput.value = vandaagISO;
                startCompensatieTijdInput.value = nuTijd;

                // Standaard eindtijd 1 uur later
                const eindTijdStandaard = new Date(nu.getTime() + (60 * 60 * 1000));
                eindeCompensatieDatumInput.value = eindTijdStandaard.toISOString().split('T')[0];
                eindeCompensatieTijdInput.value = eindTijdStandaard.toTimeString().slice(0,5);
                
                berekenUrenTotaal(); // Herbereken uren
            }


            // Event listeners
            if (form) {
                form.addEventListener('submit', handleFormulierVerzenden);
            }
            // Koppel berekenUrenTotaal aan alle vier de datum/tijd inputs
            [startCompensatieDatumInput, startCompensatieTijdInput, eindeCompensatieDatumInput, eindeCompensatieTijdInput].forEach(input => {
                if (input) { // Check of element bestaat
                    input.addEventListener('change', berekenUrenTotaal);
                }
            });


            // Start de initialisatie
            async function initPagina() {
                toonNotificatie('Pagina initialiseren...', 'info', 2000);
                try {
                    await initializeGebruikersInfoEnThema();
                    setDefaultDateTimes(); // Standaard datums en tijden instellen
                    console.log("Compensatie pagina initialisatie voltooid.");
                } catch (initError) {
                    console.error("Kritieke fout tijdens compensatie pagina initialisatie:", initError);
                    toonNotificatie("Kon de pagina niet correct initialiseren. Probeer het later opnieuw.", "error", false);
                }
            }
            
            if (typeof getLijstConfig === 'function' && typeof sharepointLijstConfiguraties !== 'undefined') {
                initPagina();
            } else {
                console.error("configLijst.js of getLijstConfig is niet beschikbaar. Pagina kan niet initialiseren.");
                toonNotificatie("Kritieke fout: Applicatieconfiguratie kon niet geladen worden.", "error", false);
            }
        });