// /workspaces/VerloughOm/Rooster/pages/js/meldingMaken_logic.js
// Logica voor de feedbackportaal (meldingMaken.aspx)

// Globale variabelen
let currentUserNormalizedUsername = null;
let currentUserFullLoginName = null; // Voor SP queries
let allFeedbackItems = [];
let canEditReactions = false; 
let expandedItems = new Set(); 

// Hardgecodeerde SharePoint site URL
const spSiteUrl = "https://som.org.om.local/sites/MulderT/CustomPW/Verlof"; // PAS DEZE AAN INDIEN NODIG

document.addEventListener('DOMContentLoaded', function () {
    document.title = "Verlofrooster - Feedback Portaal";

    if (typeof window.initializeThemeToggle === 'function') {
        window.initializeThemeToggle(); 
    } else {
        console.warn('[MeldingMaken] initializeThemeToggle functie niet gevonden. Thema schakelaar werkt mogelijk niet initieel correct.');
    }

    const meldingForm = document.getElementById('melding-form');
    const medewerkerNaamInput = document.getElementById('medewerker-naam');
    const medewerkerTeamInput = document.getElementById('medewerker-team');
    const feedbackTitelInput = document.getElementById('feedback-titel');
    const feedbackWaarFoutInput = document.getElementById('feedback-waarfout');
    const feedbackBeschrijvingInput = document.getElementById('feedback-beschrijving');
    const statusBerichtDiv = document.getElementById('status-bericht');
    const annulerenButton = document.getElementById('annuleren-button');
    const currentYearSpan = document.getElementById('current-year');
    const meldingTypeInput = document.getElementById('melding-type'); 
    const filterSelect = document.getElementById('feedback-filter');
    const sortSelect = document.getElementById('feedback-sort');
    
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    window.spWebAbsoluteUrlMelding = spSiteUrl;

    function showStatusMessage(message, type = 'success') {
        if (!statusBerichtDiv) return;
        statusBerichtDiv.innerHTML = message; 
        statusBerichtDiv.className = 'status-bericht mt-6 p-4 text-sm rounded-lg'; 
        
        statusBerichtDiv.classList.remove('status-success', 'status-error', 'status-info');

        if (type === 'success') {
            statusBerichtDiv.classList.add('status-success');
        } else if (type === 'error') {
            statusBerichtDiv.classList.add('status-error');
        } else if (type === 'info') {
            statusBerichtDiv.classList.add('status-info');
        }
        statusBerichtDiv.classList.remove('hidden');
        
        if (type !== 'error') {
            setTimeout(() => {
                statusBerichtDiv.classList.add('hidden');
            }, 7000);
        }
    }

    let currentUser = null; // Object om volledige gebruikersdata op te slaan

    async function checkUserPermissions() {
        console.log("[MeldingMaken] checkUserPermissions gestart.");
        try {
            const response = await fetch(`${spSiteUrl}/_api/web/currentuser?$select=Id,Title,Email,LoginName`, {
                method: 'GET',
                headers: { 'Accept': 'application/json;odata=verbose' }
            });
            
            if (response.ok) {
                const userData = await response.json();
                currentUser = { // Sla hier de volledige gebruikersdata op
                    NormalizedUsername: normalizeUsername(userData.d.LoginName),
                    Title: userData.d.Title, // DisplayName
                    Id: userData.d.Id,
                    Email: userData.d.Email,
                    LoginName: userData.d.LoginName // Volledige LoginName (bv. i:0#.w|domein\gebruiker)
                };
                
                currentUserNormalizedUsername = currentUser.NormalizedUsername; // Voor UI en vergelijkingen
                currentUserFullLoginName = currentUser.LoginName; // Voor SP queries op Title veld

                canEditReactions = currentUser.NormalizedUsername.includes('admin') || 
                                   currentUser.NormalizedUsername.includes('mulder') ||
                                   (currentUser.Email && currentUser.Email.includes('admin'));
                
                console.log("[MeldingMaken] Gebruiker geladen (checkUserPermissions):", currentUser);
                return true;
            } else {
                console.warn('[MeldingMaken] Kon gebruikersdata niet ophalen via checkUserPermissions. Status:', response.status);
                return false;
            }
        } catch (error) {
            console.error('[MeldingMaken] Fout bij controleren gebruikersrechten:', error);
            return false;
        }
    }
    
    async function laadGebruikersInstellingenEnPasThemaToe() {
        const functieNaam = "[MeldingMaken - laadGebruikersInstellingenEnPasThemaToe]";
        if (!currentUserFullLoginName) { // Gebruik de volledige loginnaam voor de query
            console.warn(`${functieNaam} Kan instellingen niet ophalen: currentUserFullLoginName ontbreekt.`);
            if (typeof window.applyOsThemePreference === 'function') {
                 window.applyOsThemePreference();
            }
            return;
        }

        try {
            const lijstConfig = getLijstConfig("gebruikersInstellingen");
            if (!lijstConfig) {
                console.error(`${functieNaam} Configuratie voor 'gebruikersInstellingen' niet gevonden.`);
                if (typeof window.applyOsThemePreference === 'function') { window.applyOsThemePreference(); }
                return;
            }
            
            // Het 'Title' veld in 'gebruikersInstellingen' bevat de volledige LoginName
            const filterQuery = `$filter=Title eq '${currentUserFullLoginName.replace(/'/g, "''")}'`; // Escape single quotes
            const selectQuery = "$select=soortWeergave";
            const apiUrl = `${spSiteUrl}/_api/web/lists/getByTitle('${lijstConfig.lijstTitel}')/items?${selectQuery}&${filterQuery}`;
            
            console.log(`${functieNaam} Ophalen thema instelling via: ${apiUrl}`);
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json;odata=verbose' }
            });

            if (!response.ok) {
                console.warn(`${functieNaam} Fout bij ophalen gebruikersinstellingen van SP: ${response.status} ${response.statusText}`);
                if (typeof window.applyOsThemePreference === 'function') { window.applyOsThemePreference(); }
                return;
            }

            const data = await response.json();
            if (data.d.results && data.d.results.length > 0) {
                const instelling = data.d.results[0];
                const themaVanSP = instelling.soortWeergave; 
                if (themaVanSP && (themaVanSP === 'light' || themaVanSP === 'dark')) {
                    console.log(`${functieNaam} Thema voorkeur van SharePoint: ${themaVanSP}`);
                    localStorage.setItem('theme', themaVanSP); 
                    if (typeof window.updateTheme === 'function') {
                        window.updateTheme(); 
                    } else {
                        console.warn(`${functieNaam} window.updateTheme() is niet beschikbaar in theme-toggle.js.`);
                    }
                } else {
                    console.log(`${functieNaam} Geen (valide) 'soortWeergave' ('${themaVanSP}') gevonden in SharePoint instellingen.`);
                    if (typeof window.applyOsThemePreference === 'function') { window.applyOsThemePreference(); }
                }
            } else {
                console.log(`${functieNaam} Geen gebruikersinstellingen gevonden voor '${currentUserFullLoginName}' in SharePoint.`);
                 if (typeof window.applyOsThemePreference === 'function') { window.applyOsThemePreference(); }
            }
        } catch (error) {
            console.error(`${functieNaam} Fout bij laden/toepassen thema van SP:`, error);
            if (typeof window.applyOsThemePreference === 'function') { window.applyOsThemePreference(); }
        }
    }

    async function initializePageData() {
        console.log("[MeldingMaken] initializePageData gestart.");
        const userPermissionsOK = await checkUserPermissions(); 
        
        if (userPermissionsOK && currentUser) {
            // currentUserNormalizedUsername en currentUserFullLoginName zijn al gezet in checkUserPermissions
            if (medewerkerNaamInput) medewerkerNaamInput.value = currentUser.Title || currentUserNormalizedUsername;
            if (feedbackTitelInput) feedbackTitelInput.value = currentUserNormalizedUsername; 
            if (medewerkerTeamInput) {
                 // Probeer team uit currentUser.Team (als dat bestaat en gevuld wordt)
                 // Anders een placeholder. Idealiter wordt dit via een Medewerkers lijst opgehaald.
                medewerkerTeamInput.value = currentUser.Team || 'Nog te bepalen';
            }
        } else {
            console.warn("[MeldingMaken] Gebruikerspermissies konden niet geverifieerd worden of currentUser is niet gezet. Fallback naar _spPageContextInfo indien beschikbaar.");
            if (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userLoginName) {
                currentUserNormalizedUsername = normalizeUsername(_spPageContextInfo.userLoginName);
                currentUserFullLoginName = _spPageContextInfo.userLoginName; // Gebruik volledige loginnaam
                if (medewerkerNaamInput) medewerkerNaamInput.value = _spPageContextInfo.userDisplayName || currentUserNormalizedUsername;
                if (feedbackTitelInput) feedbackTitelInput.value = currentUserNormalizedUsername;
                if (medewerkerTeamInput) medewerkerTeamInput.value = 'Nog te bepalen';
                 console.log("[MeldingMaken] Gebruikersinfo (gedeeltelijk) geladen via _spPageContextInfo.");
            } else {
                console.error("[MeldingMaken] Kritieke fout: Geen gebruikersinformatie beschikbaar.");
                if (medewerkerNaamInput) medewerkerNaamInput.value = 'Onbekend';
                if (medewerkerTeamInput) medewerkerTeamInput.value = 'Onbekend';
                showStatusMessage('Fout: Kon gebruikersinformatie niet laden. Feedback kan mogelijk niet correct worden toegewezen.', 'error');
            }
        }
        
        // Laad thema *nadat* currentUserFullLoginName potentieel is gezet.
        await laadGebruikersInstellingenEnPasThemaToe(); 

        canEditReactions = true; 

        if (meldingTypeInput) {
            meldingTypeInput.value = 'Feedback'; 
        }
        console.log("[MeldingMaken] initializePageData voltooid.");
    }

    function normalizeUsername(username) {
        if (!username) return '';
        return username.split(/[\\|]/).pop();
    }

    // Start de initialisatie
    initializePageData().then(() => {
        loadAndDisplayFeedbackItems(); 
    }).catch(error => {
        console.error("[MeldingMaken] Fout tijdens initialisatie:", error);
        showStatusMessage("Algemene initialisatiefout opgetreden.", "error");
    });

    if (filterSelect) filterSelect.addEventListener('change', filterAndSortFeedbackItems);
    if (sortSelect) sortSelect.addEventListener('change', filterAndSortFeedbackItems);

    if (meldingForm) {
        meldingForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            if (!feedbackBeschrijvingInput.value.trim()) {
                showStatusMessage('Vul a.u.b. een beschrijving in voor uw feedback.', 'error');
                feedbackBeschrijvingInput.focus(); return;
            }
            showStatusMessage('Feedback verzenden...', 'info');
            const submitButton = document.getElementById('indienen-button');
            if(submitButton) submitButton.disabled = true;

            if (!currentUserNormalizedUsername) { // Moet hier zijn na initializePageData
                showStatusMessage('Fout: Gebruikersinformatie niet beschikbaar. Kan feedback niet verzenden.', 'error');
                if(submitButton) submitButton.disabled = false; return;
            }
            const feedbackData = {
                Title: currentUserNormalizedUsername, 
                Beschrijving_x0020_fout: feedbackBeschrijvingInput.value,
                WaarFout: feedbackWaarFoutInput.value || 'Niet gespecificeerd',
                Status: 'Nieuw'
            };
            try {
                const targetListUrl = `${spSiteUrl}/_api/web/lists/getByTitle('MeldFouten')/items`;
                const digestResponse = await fetch(`${spSiteUrl}/_api/contextinfo`, { method: 'POST', headers: { 'Accept': 'application/json;odata=verbose' }});
                if (!digestResponse.ok) throw new Error('Kon request digest niet ophalen.');
                const digestData = await digestResponse.json();
                const requestDigest = digestData.d.GetContextWebInformation.FormDigestValue;
                const response = await fetch(targetListUrl, {
                    method: 'POST',
                    headers: { 'Accept': 'application/json;odata=verbose', 'Content-Type': 'application/json;odata=verbose', 'X-RequestDigest': requestDigest },
                    body: JSON.stringify({ '__metadata': { 'type': 'SP.Data.MeldFoutenListItem' }, ...feedbackData })
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => null);
                    throw new Error(`SharePoint API fout: ${response.statusText} - ${errorData ? JSON.stringify(errorData) : 'Onbekende serverfout'}`);
                }
                showStatusMessage('Feedback succesvol verzonden! Bedankt.<br>Het feedback overzicht wordt bijgewerkt.', 'success');
                meldingForm.reset();
                if (currentUser && currentUser.NormalizedUsername) {
                    if (medewerkerNaamInput) medewerkerNaamInput.value = currentUser.Title || currentUserNormalizedUsername;
                    if (feedbackTitelInput) feedbackTitelInput.value = currentUserNormalizedUsername;
                    if (medewerkerTeamInput && currentUser.Team) medewerkerTeamInput.value = currentUser.Team;
                }
                setTimeout(() => { loadAndDisplayFeedbackItems(); }, 1000);
            } catch (error) {
                console.error('[MeldingMaken] Fout bij verzenden van feedback:', error);
                showStatusMessage(`Fout bij het verzenden van feedback: ${error.message || error}`, 'error');
            } finally {
                if(submitButton) submitButton.disabled = false;
            }
        });
    }

    if (annulerenButton) {
        annulerenButton.addEventListener('click', () => { window.location.href = '../verlofRooster.aspx'; });
    }

    function handleReactionUpdate(feedbackId, reactionText, status) {
        if (!canEditReactions) {
            showStatusMessage('U heeft geen toestemming om reacties te bewerken.', 'error'); return;
        }
        updateFeedbackReaction(feedbackId, reactionText, status);
    }

    async function updateFeedbackReaction(feedbackId, reactionText, status) {
        try {
            showStatusMessage('Reactie bijwerken...', 'info');
            const targetListUrl = `${spSiteUrl}/_api/web/lists/getByTitle('MeldFouten')/items(${feedbackId})`;
            const digestResponse = await fetch(`${spSiteUrl}/_api/contextinfo`, { method: 'POST', headers: { 'Accept': 'application/json;odata=verbose' }});
            if (!digestResponse.ok) throw new Error('Kon request digest niet ophalen.');
            const digestData = await digestResponse.json();
            const requestDigest = digestData.d.GetContextWebInformation.FormDigestValue;
            const updateData = { '__metadata': { 'type': 'SP.Data.MeldFoutenListItem' }, 'Reactie': reactionText };
            if (status) { updateData.Status = status; }
            const response = await fetch(targetListUrl, {
                method: 'POST',
                headers: { 'Accept': 'application/json;odata=verbose', 'Content-Type': 'application/json;odata=verbose', 'X-RequestDigest': requestDigest, 'X-HTTP-Method': 'MERGE', 'If-Match': '*' },
                body: JSON.stringify(updateData)
            });
            if (!response.ok && response.status !== 204) {
                const errorData = await response.json().catch(() => null);
                throw new Error(`SharePoint API fout: ${response.statusText} - ${errorData ? JSON.stringify(errorData) : 'Onbekende serverfout'}`);
            }
            let statusTextMsg = '';
            if (status === 'In behandeling') statusTextMsg = ' Status bijgewerkt naar "In behandeling".';
            else if (status === 'Opgelost') statusTextMsg = ' Status bijgewerkt naar "Opgelost".';
            showStatusMessage(`Reactie succesvol bijgewerkt!${statusTextMsg}`, 'success');
            setTimeout(() => { loadAndDisplayFeedbackItems(); }, 1000);
        } catch (error) {
            console.error('[MeldingMaken] Fout bij bijwerken van feedback reactie:', error);
            showStatusMessage(`Fout bij het bijwerken van de reactie: ${error.message || error}`, 'error');
        }
    }

    async function loadAndDisplayFeedbackItems() {
        const container = document.getElementById('feedback-items-container');
        const loadingIndicator = document.getElementById('feedback-loading-indicator');
        const geenFeedbackBericht = document.getElementById('geen-feedback-bericht');
        if (!container || !loadingIndicator || !geenFeedbackBericht) {
            console.error('[MeldingMaken] DOM elementen voor feedback weergave niet gevonden.');
            showStatusMessage('Fout: Kan feedback items niet weergeven op de pagina.', 'error'); return;
        }
        loadingIndicator.classList.remove('hidden');
        container.innerHTML = ''; 
        geenFeedbackBericht.classList.add('hidden');
        try {
            const requestUrl = `${spSiteUrl}/_api/web/lists/getByTitle('MeldFouten')/items?$select=ID,Title,Beschrijving_x0020_fout,WaarFout,Status,Created,Modified,Reactie,Author/Title,Editor/Title&$expand=Author,Editor&$orderby=Created desc`;
            const response = await fetch(requestUrl, { method: 'GET', headers: { 'Accept': 'application/json;odata=verbose' }});
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(`SharePoint API fout bij ophalen feedback: ${response.statusText} - ${errorData ? JSON.stringify(errorData) : 'Onbekende serverfout'}`);
            }
            const data = await response.json();
            allFeedbackItems = data.d.results || [];
            loadingIndicator.classList.add('hidden');
            filterAndSortFeedbackItems();
        } catch (error) {
            console.error('[MeldingMaken] Fout bij laden van feedback items:', error);
            loadingIndicator.classList.add('hidden');
            showStatusMessage(`Fout bij het laden van feedback items: ${error.message}`, 'error');
            geenFeedbackBericht.classList.remove('hidden');
            geenFeedbackBericht.querySelector('p:first-of-type').textContent = 'Kon feedback items niet laden.';
            geenFeedbackBericht.querySelector('p:last-of-type').textContent = 'Probeer het later opnieuw of neem contact op met de beheerder.';
        }
    }

    function filterAndSortFeedbackItems() {
        const container = document.getElementById('feedback-items-container');
        const geenFeedbackBericht = document.getElementById('geen-feedback-bericht');
        const filterSelect = document.getElementById('feedback-filter');
        const sortSelect = document.getElementById('feedback-sort');
        if (!container || !geenFeedbackBericht || !filterSelect || !sortSelect) return;
        container.innerHTML = '';
        let filteredItems = [...allFeedbackItems];
        const filterValue = filterSelect.value;

        if (filterValue === 'mine' && currentUserNormalizedUsername) {
            filteredItems = filteredItems.filter(item => {
                const authorLoginNormalized = item.Author && item.Author.LoginName ? normalizeUsername(item.Author.LoginName).toLowerCase() : '';
                const titleNormalized = item.Title ? normalizeUsername(item.Title).toLowerCase() : '';
                return authorLoginNormalized === currentUserNormalizedUsername.toLowerCase() || titleNormalized === currentUserNormalizedUsername.toLowerCase();
            });
        } else if (filterValue !== 'all') {
            const statusFilter = filterValue === 'nieuw' ? 'Nieuw' : 
                                filterValue === 'in-behandeling' ? 'In behandeling' : 
                                filterValue === 'opgelost' ? 'Opgelost' : null;
            if (statusFilter) {
                filteredItems = filteredItems.filter(item => item.Status === statusFilter);
            }
        }
        
        const sortValue = sortSelect.value;
        if (sortValue === 'oldest') {
            filteredItems.sort((a, b) => new Date(a.Created) - new Date(b.Created));
        } else if (sortValue === 'status') {
            const statusPriority = { 'Nieuw': 1, 'In behandeling': 2, 'Opgelost': 3, 'Afgezien': 4, 'Afgehandeld': 5 };
            filteredItems.sort((a, b) => (statusPriority[a.Status] || 99) - (statusPriority[b.Status] || 99));
        }
        
        if (filterValue !== 'mine' && currentUserNormalizedUsername) {
            filteredItems.sort((a, b) => {
                const isUserItemA = (a.Author && a.Author.LoginName ? normalizeUsername(a.Author.LoginName).toLowerCase() : normalizeUsername(a.Title).toLowerCase()) === currentUserNormalizedUsername.toLowerCase();
                const isUserItemB = (b.Author && b.Author.LoginName ? normalizeUsername(b.Author.LoginName).toLowerCase() : normalizeUsername(b.Title).toLowerCase()) === currentUserNormalizedUsername.toLowerCase();
                if (isUserItemA && !isUserItemB) return -1;
                if (!isUserItemA && isUserItemB) return 1;
                return 0;
            });
        }
        
        if (filteredItems.length === 0) {
            geenFeedbackBericht.classList.remove('hidden');
        } else {
            geenFeedbackBericht.classList.add('hidden');
            filteredItems.forEach(item => {
                const itemDiv = createFeedbackItemElement(item);
                container.appendChild(itemDiv);
            });
            
            document.querySelectorAll('.reactie-edit-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const itemId = this.dataset.itemId;
                    document.querySelector(`.reactie-content-${itemId}`)?.classList.add('hidden');
                    document.querySelector(`.reactie-edit-${itemId}`)?.classList.remove('hidden');
                });
            });
            document.querySelectorAll('.tussentijds-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const itemId = this.dataset.itemId;
                    const textarea = document.querySelector(`.reactie-textarea-${itemId}`);
                    if (textarea) handleReactionUpdate(itemId, textarea.value, 'In behandeling');
                });
            });
            document.querySelectorAll('.reactie-final-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const itemId = this.dataset.itemId;
                    const textarea = document.querySelector(`.reactie-textarea-${itemId}`);
                    if (textarea) handleReactionUpdate(itemId, textarea.value, 'Opgelost');
                });
            });
            document.querySelectorAll('.reactie-cancel-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const itemId = this.dataset.itemId;
                    document.querySelector(`.reactie-edit-${itemId}`)?.classList.add('hidden');
                    document.querySelector(`.reactie-content-${itemId}`)?.classList.remove('hidden');
                });
            });
            document.querySelectorAll('.feedback-toggle-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const itemId = this.dataset.itemId;
                    const detailsSection = document.querySelector(`.feedback-details-${itemId}`);
                    const expandIcon = this.querySelector(`.expand-icon-${itemId}`);
                    const collapseIcon = this.querySelector(`.collapse-icon-${itemId}`);
                    if (detailsSection) {
                        const isCurrentlyHidden = detailsSection.classList.contains('hidden');
                        detailsSection.classList.toggle('hidden', !isCurrentlyHidden);
                        if (isCurrentlyHidden) expandedItems.add(itemId); else expandedItems.delete(itemId);
                        if (expandIcon) expandIcon.classList.toggle('hidden', !isCurrentlyHidden);
                        if (collapseIcon) collapseIcon.classList.toggle('hidden', isCurrentlyHidden);
                        this.setAttribute('aria-expanded', String(!isCurrentlyHidden));
                    }
                });
            });
        }
    }

    function createFeedbackItemElement(item) {
        const div = document.createElement('div');
        const itemAuthorLoginNormalized = item.Author && item.Author.LoginName ? normalizeUsername(item.Author.LoginName).toLowerCase() : '';
        const itemTitleNormalized = item.Title ? normalizeUsername(item.Title).toLowerCase() : '';
        const isUserFeedback = currentUserNormalizedUsername && 
                              (itemAuthorLoginNormalized === currentUserNormalizedUsername.toLowerCase() || 
                               itemTitleNormalized === currentUserNormalizedUsername.toLowerCase());
        
        const isNewItem = item.Status === 'Nieuw';
        const isExpanded = isNewItem || expandedItems.has(item.ID.toString());
        
        div.className = `feedback-item p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out mb-4`;
        if (isUserFeedback) {
            div.classList.add('is-user-feedback');
        }
        div.dataset.id = item.ID;
        
        const createdDate = item.Created ? new Date(item.Created).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Onbekend';
        const modifiedDate = item.Modified ? new Date(item.Modified).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : createdDate;
        const authorName = item.Author ? item.Author.Title : (normalizeUsername(item.Title) || 'Anoniem');
        
        let statusText = item.Status || 'Nieuw';
        let statusIndicatorClass = 'status-' + statusText.toLowerCase().replace(/\s+/g, '-');

        let summaryHTML = `
            <div class="flex justify-between items-start mb-3">
                <div class="flex-1">
                    <div class="flex items-center">
                        <h3 class="text-lg font-semibold">${item.WaarFout || 'Algemene Feedback'}</h3>
                        ${isUserFeedback ? '<span class="ml-2 my-feedback-badge">Mijn feedback</span>' : ''}
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Ingediend door: <span class="font-medium">${authorName}</span> op ${createdDate}
                    </p>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="status-indicator ${statusIndicatorClass}">${statusText}</span>
                    <button type="button" class="feedback-toggle-btn p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" data-item-id="${item.ID}" aria-expanded="${isExpanded ? 'true' : 'false'}">
                        <svg class="expand-icon-${item.ID} w-5 h-5 text-gray-500 dark:text-gray-400 ${isExpanded ? 'hidden' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        <svg class="collapse-icon-${item.ID} w-5 h-5 text-gray-500 dark:text-gray-400 ${isExpanded ? '' : 'hidden'}" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>
                    </button>
                </div>
            </div>
            ${!isExpanded ? `<div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-md"><p class="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">${item.Beschrijving_x0020_fout || 'Geen beschrijving.'}</p></div>` : ''}
        `;

        let detailsHTML = `
            <div class="feedback-details-${item.ID} ${isExpanded ? '' : 'hidden'}">
                <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-md mb-3 mt-3">
                    <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">${item.Beschrijving_x0020_fout || 'Geen beschrijving.'}</p>
                </div>
                <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div class="flex justify-between items-center mb-1">
                        <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Reactie:</h4>
                        ${canEditReactions ? `<button type="button" class="reactie-edit-btn text-xs text-indigo-600 dark:text-indigo-400 hover:underline" data-item-id="${item.ID}"><svg class="inline-block w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>Bewerken</button>` : ''}
                    </div>
                    <div class="reactie-content-${item.ID}"><p class="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap pl-3 border-l-2 border-indigo-300 dark:border-indigo-700">${item.Reactie || 'Nog geen reactie.'}</p></div>
                    <div class="reactie-edit-${item.ID} hidden">
                        <textarea class="reactie-textarea-${item.ID} form-input w-full text-sm p-2 min-h-[80px]" placeholder="Voer een reactie in...">${item.Reactie || ''}</textarea>
                        <div class="flex flex-wrap justify-end mt-2 space-x-2 space-y-2 sm:space-y-0">
                            <button type="button" class="reactie-cancel-btn btn btn-secondary text-xs" data-item-id="${item.ID}">Annuleren</button>
                            <button type="button" class="tussentijds-btn btn text-xs" data-item-id="${item.ID}"><svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>Tussentijds</button>
                            <button type="button" class="reactie-final-btn btn text-xs" data-item-id="${item.ID}"><svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Opgelost</button>
                        </div>
                    </div>
                </div>
                ${item.Modified && new Date(item.Modified).getTime() !== new Date(item.Created).getTime() ? `<div class="mt-2 text-xs text-gray-400 dark:text-gray-500 text-right">Laatst bijgewerkt: ${modifiedDate}</div>` : ''}
            </div>
        `;
        div.innerHTML = summaryHTML + detailsHTML;
        return div;
    }
});

if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function(str, newStr){
        if (Object.prototype.toString.call(str).toLowerCase() === '[object regexp]') {
            return this.replace(str, newStr);
        }
        return this.replace(new RegExp(str, 'g'), newStr);
    };
}

function getLijstConfig(lijstKey) {
    if (typeof window.sharepointLijstConfiguraties !== 'undefined' && window.sharepointLijstConfiguraties[lijstKey]) {
        return window.sharepointLijstConfiguraties[lijstKey];
    }
    console.warn(`[MeldingMaken] Kon lijstconfiguratie niet vinden voor: ${lijstKey}. Zorg dat configLijst.js geladen is en sharepointLijstConfiguraties bevat.`);
    return null;
}

if (typeof initializeMeldingContext === 'undefined') {
    async function initializeMeldingContext() { // Moet async zijn als het Promises gebruikt
        console.log("[MeldingMaken] initializeMeldingContext placeholder aangeroepen.");
        window.spWebAbsoluteUrlMelding = "https://som.org.om.local/sites/MulderT/CustomPW/Verlof"; 
        if (typeof _spPageContextInfo !== 'undefined') {
            window.huidigeGebruikerMelding = {
                loginNaam: _spPageContextInfo.userLoginName,
                Id: _spPageContextInfo.userId,
                Title: _spPageContextInfo.userDisplayName,
                Email: _spPageContextInfo.userEmail,
                normalizedUsername: normalizeUsername(_spPageContextInfo.userLoginName), // Zorg dat normalizeUsername hier beschikbaar is of verplaats de aanroep
                medewerkerData: { Team: 'Nog op te halen' } 
            };
            console.log("[MeldingMaken] Context geïnitialiseerd vanuit _spPageContextInfo.");
            return true;
        }
        console.warn("[MeldingMaken] _spPageContextInfo niet beschikbaar, gebruikt alleen hardgecodeerde URL.");
        return true; 
    }
    // Helper normalizeUsername binnen deze scope als het hier nodig is en niet globaal
    function normalizeUsername(username) { 
        if (!username) return '';
        return username.split(/[\\|]/).pop();
    }
}
