// js/Mailsysteem.js

/**
 * Mailsysteem voor de Verlofrooster applicatie.
 * Beheert het versturen van e-mailnotificaties, bijvoorbeeld na een nieuwe registratie.
 */

// -------- DEBUG MODUS CONFIGURATIE --------
const DEBUG_MODUS = true; // Zet op false voor productie
const DEBUG_EMAIL_ADRES = "sharepoint.mulder@om.nl";
// -----------------------------------------

// Aanname: spWebAbsoluteUrlProfielBeheer en getLijstConfig zijn globaal beschikbaar
// vanuit de context waar dit script wordt geladen (bijv. profielBeheer.html -> profielBeheer_logic.js)

/**
 * Helper functie om een string te escapen voor OData queries.
 * @param {string} value De te escapen string.
 * @returns {string} De geëscapete string.
 */
function escapeODataStringMail(value) {
    if (value === null || value === undefined) return "null";
    return value.replace(/'/g, "''");
}

/**
 * Haalt items op uit een SharePoint lijst via REST API voor het mailsysteem.
 * @param {string} lijstIdentifier - De key van de lijstconfiguratie of de lijsttitel/GUID.
 * @param {string} [selectQuery=""] - OData $select query.
 * @param {string} [filterQuery=""] - OData $filter query.
 * @returns {Promise<Array>} Een array met de opgehaalde lijstitems, of een lege array bij een fout.
 */
async function haalMailSysteemLijstItems(lijstIdentifier, selectQuery = "", filterQuery = "") {
    const functieNaam = "haalMailSysteemLijstItems";
    if (!spWebAbsoluteUrlProfielBeheer) { 
        console.error(`[MailSysteem] ${functieNaam} - spWebAbsoluteUrlProfielBeheer is niet beschikbaar.`);
        // Probeer de globale spWebAbsoluteUrl te gebruiken als fallback, indien gedefinieerd in een ander script
        if (typeof spWebAbsoluteUrl === 'string' && spWebAbsoluteUrl) {
            console.warn(`[MailSysteem] ${functieNaam} - Fallback naar globale spWebAbsoluteUrl.`);
        } else {
            return [];
        }
    }

    const lijstConfig = typeof getLijstConfig === 'function' ? getLijstConfig(lijstIdentifier) : null;
    if (!lijstConfig) {
        console.error(`[MailSysteem] ${functieNaam} - Kon lijst configuratie niet vinden voor: ${lijstIdentifier}`);
        return [];
    }

    const lijstIdOfTitel = lijstConfig.lijstId || lijstConfig.lijstTitel;
    let apiUrlPath;
    if (/^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/.test(lijstIdOfTitel)) {
        apiUrlPath = `/_api/web/lists(guid'${lijstIdOfTitel}')/items`;
    } else {
        apiUrlPath = `/_api/web/lists/getByTitle('${encodeURIComponent(lijstIdOfTitel)}')/items`;
    }

    let queryParams = [];
    if (selectQuery) queryParams.push(selectQuery);
    if (filterQuery) queryParams.push(filterQuery);

    const urlVoorFetch = (spWebAbsoluteUrlProfielBeheer || spWebAbsoluteUrl); // Gebruik de beschikbare URL
    const apiUrl = `${urlVoorFetch.replace(/\/$/, "")}${apiUrlPath}${queryParams.length > 0 ? '?' + queryParams.join('&') : ''}`;
    console.log(`[MailSysteem] ${functieNaam} - Ophalen items: ${decodeURIComponent(apiUrl)}`);

    try {
        const response = await fetch(apiUrl, { headers: { 'Accept': 'application/json;odata=verbose' } });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: { message: { value: `HTTP error ${response.status}`}}}));
            const spErrorMessage = errorData.error?.message?.value || `HTTP error ${response.status}`;
            console.error(`[MailSysteem] ${functieNaam} - Fout bij ophalen lijst '${lijstIdentifier}': ${spErrorMessage}`);
            return [];
        }
        const data = await response.json();
        return data.d.results || [];
    } catch (error) {
        console.error(`[MailSysteem] ${functieNaam} - Uitzondering bij ophalen lijst '${lijstIdentifier}':`, error);
        return [];
    }
}

/**
 * Haalt een X-RequestDigest op.
 * @returns {Promise<string>} De Form Digest Value.
 */
async function getMailSysteemRequestDigest() {
    const urlVoorFetch = (spWebAbsoluteUrlProfielBeheer || spWebAbsoluteUrl);
    if (!urlVoorFetch) throw new Error("Web absolute URL niet beschikbaar voor Request Digest in Mailsysteem.");
    const apiUrl = `${urlVoorFetch.replace(/\/$/, "")}/_api/contextinfo`;
    const response = await fetch(apiUrl, { method: 'POST', headers: { 'Accept': 'application/json;odata=verbose' } });
    if (!response.ok) {
        const errorText = await response.text().catch(() => "Onbekende serverfout bij ophalen digest.");
        throw new Error(`Kon Request Digest niet ophalen (${response.status}). Details: ${errorText.substring(0,500)}`);
    }
    const data = await response.json();
    return data.d.GetContextWebInformation.FormDigestValue;
}


/**
 * Verzendt een e-mail via de SharePoint SP.Utilities.Utility.SendEmail methode.
 * @param {string[]} naar - Array van e-mailadressen van de ontvangers.
 * @param {string[]} cc - Array van e-mailadressen voor de CC.
 * @param {string} onderwerp - Het onderwerp van de e-mail.
 * @param {string} bodyHtml - De inhoud van de e-mail, als HTML.
 * @param {string} [vanAdres=null] - Optioneel 'Van' adres (kan door SP worden overschreven).
 * @returns {Promise<boolean>} True als succesvol, false bij een fout.
 */
async function verzendEmailViaSharePointUtility(naar, cc, onderwerp, bodyHtml, vanAdres = null) {
    const functieNaam = "verzendEmailViaSharePointUtility";
    console.log(`[MailSysteem] ${functieNaam} - Poging tot verzenden e-mail. Naar:`, naar, "CC:", cc);
    
    const urlVoorFetch = (spWebAbsoluteUrlProfielBeheer || spWebAbsoluteUrl);
    if (!urlVoorFetch) {
        console.error(`[MailSysteem] ${functieNaam} - Web absolute URL is niet beschikbaar.`);
        return false;
    }
    if (!naar || naar.length === 0 || !onderwerp || !bodyHtml) {
        console.error(`[MailSysteem] ${functieNaam} - 'Aan', onderwerp, en body zijn verplicht.`);
        return false;
    }

    const apiUrl = `${urlVoorFetch.replace(/\/$/, "")}/_api/SP.Utilities.Utility.SendEmail`;
    
    const emailEigenschappen = {
        'properties': {
            '__metadata': { 'type': 'SP.Utilities.EmailProperties' },
            'To': { 'results': naar },
            'CC': { 'results': cc || [] },
            'Subject': onderwerp,
            'Body': bodyHtml,
            'AdditionalHeaders': {
                "__metadata": { "type": "Collection(SP.KeyValue)" },
                "results": [
                    {
                        "__metadata": { "type": 'SP.KeyValue' },
                        "Key": "content-type",
                        "Value": "text/html",
                        "ValueType": "Edm.String"
                    }
                ]
            }
        }
    };

    if (vanAdres) {
        emailEigenschappen.properties.From = vanAdres;
    }

    try {
        const requestDigest = await getMailSysteemRequestDigest();
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json;odata=verbose',
                'Content-Type': 'application/json;odata=verbose',
                'X-RequestDigest': requestDigest
            },
            body: JSON.stringify(emailEigenschappen)
        });

        if (!response.ok) {
            let foutDetail = `HTTP error ${response.status}`;
            try {
                const errorData = await response.json();
                foutDetail = errorData.error?.message?.value || foutDetail;
            } catch (e) { /* Kon JSON niet parsen */ }
            
            console.error(`[MailSysteem] ${functieNaam} - Fout bij verzenden e-mail: ${foutDetail}`);
            if (typeof logFoutNaarSharePoint === 'function') { // Controleer of de logfunctie bestaat
                logFoutNaarSharePoint(foutDetail, null, `${functieNaam} (MailSysteem)`, { ontvangers: naar, onderwerp: onderwerp });
            }
            return false;
        }

        console.log(`[MailSysteem] ${functieNaam} - E-mail succesvol verzonden (status: ${response.status}).`);
        return true;

    } catch (error) {
        console.error(`[MailSysteem] ${functieNaam} - Uitzondering bij verzenden e-mail:`, error);
        if (typeof logFoutNaarSharePoint === 'function') {
            logFoutNaarSharePoint(error.message, error.stack, `${functieNaam} (MailSysteem)`, { ontvangers: naar, onderwerp: onderwerp });
        }
        return false;
    }
}

/**
 * Verstuurt een notificatie e-mail na succesvolle registratie van een nieuwe gebruiker.
 * @param {object} huidigeGebruiker - Het object van de huidige ingelogde gebruiker (aangever). Moet 'Email' en 'Title' bevatten.
 * @param {object} nieuweMedewerkerData - Data van de nieuw geregistreerde medewerker. Moet 'Naam', 'Team', 'Functie', 'Username' bevatten.
 */
async function verzendRegistratieNotificatieEmail(huidigeGebruiker, nieuweMedewerkerData) {
    const functieNaam = "verzendRegistratieNotificatieEmail";
    console.log(`[MailSysteem] ${functieNaam} - Voorbereiden e-mail voor nieuwe registratie:`, nieuweMedewerkerData);

    if (!huidigeGebruiker || !huidigeGebruiker.Email) {
        console.error(`[MailSysteem] ${functieNaam} - E-mailadres van huidige gebruiker (aangever) ontbreekt.`);
        return;
    }
    if (!nieuweMedewerkerData || !nieuweMedewerkerData.Naam || !nieuweMedewerkerData.Team || !nieuweMedewerkerData.Functie) {
        console.error(`[MailSysteem] ${functieNaam} - Essentiële data van nieuwe medewerker ontbreekt.`);
        return;
    }

    const ccAdres = [huidigeGebruiker.Email];
    let aanAdressen = [];

    if (DEBUG_MODUS) {
        aanAdressen = [DEBUG_EMAIL_ADRES];
        console.log(`[MailSysteem] ${functieNaam} - DEBUG MODUS ACTIEF. E-mail 'Aan': ${DEBUG_EMAIL_ADRES}`);
    } else {
        try {
            const seniorItems = await haalMailSysteemLijstItems("Seniors", "$select=MedewerkerID,Title");
            if (!seniorItems || seniorItems.length === 0) {
                console.warn(`[MailSysteem] ${functieNaam} - Geen seniors gevonden in 'Seniors' lijst.`);
            } else {
                const seniorUsernames = seniorItems.map(s => s.MedewerkerID).filter(Boolean);
                if (seniorUsernames.length > 0) {
                    const usernameFilters = seniorUsernames.map(username => `(Username eq '${escapeODataStringMail(username)}')`);
                    const medewerkersFilter = usernameFilters.join(' or ');
                    
                    const medewerkerDetails = await haalMailSysteemLijstItems("Medewerkers", "$select=E_x002d_mail,Username", medewerkersFilter);
                    
                    medewerkerDetails.forEach(med => {
                        if (med.E_x002d_mail) {
                            aanAdressen.push(med.E_x002d_mail);
                        } else {
                            console.warn(`[MailSysteem] ${functieNaam} - Geen e-mailadres gevonden voor senior: ${med.Username}`);
                        }
                    });
                }
            }
        } catch (error) {
            console.error(`[MailSysteem] ${functieNaam} - Fout bij ophalen senior e-mailadressen:`, error);
            // Log deze fout eventueel ook naar SharePoint
            if (typeof logFoutNaarSharePoint === 'function') {
                logFoutNaarSharePoint(error.message, error.stack, `${functieNaam} - Ophalen Seniors (MailSysteem)`);
            }
        }
    }

    if (aanAdressen.length === 0) {
        console.warn(`[MailSysteem] ${functieNaam} - Geen 'Aan' adressen bepaald (ook niet in debug modus). E-mail wordt alleen naar CC (aangever) gestuurd indien beschikbaar.`);
        if (ccAdres.length > 0 && ccAdres[0]) { // Controleer of er een CC adres is
            aanAdressen = [...ccAdres]; // Fallback: stuur naar aangever in 'Aan'
            console.log(`[MailSysteem] ${functieNaam} - Fallback: e-mail wordt naar de aangever gestuurd in 'Aan'.`);
        } else {
            console.error(`[MailSysteem] ${functieNaam} - Geen ontvangers (Aan of CC) beschikbaar. E-mail niet verzonden.`);
            return; // Stop als er helemaal geen ontvanger is
        }
    }

    const onderwerp = `Nieuwe Registratie Verlofrooster: ${nieuweMedewerkerData.Naam}`;
    const emailBody = `
        <p>Beste Senior(s),</p>
        <p>Een nieuwe medewerker heeft het registratieproces voor het Verlofrooster voltooid:</p>
        <ul>
            <li><strong>Naam:</strong> ${nieuweMedewerkerData.Naam}</li>
            <li><strong>Team:</strong> ${nieuweMedewerkerData.Team}</li>
            <li><strong>Functie:</strong> ${nieuweMedewerkerData.Functie}</li>
            <li><strong>Gebruikersnaam:</strong> ${nieuweMedewerkerData.Username || 'Niet opgegeven'}</li>
            <li><strong>Geregistreerd door:</strong> ${huidigeGebruiker.Title || huidigeGebruiker.Email}</li>
        </ul>
        <p>Controleer eventueel de gegevens en het ingestelde werkrooster in het systeem.</p>
        <p>Met vriendelijke groet,<br>Verlofrooster Applicatie</p>
    `;

    await verzendEmailViaSharePointUtility(aanAdressen, ccAdres, onderwerp, emailBody);
}

console.log("js/Mailsysteem.js geladen.");
