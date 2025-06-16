// Rooster/js/profielKaarten.js
// Placeholder for profile card logic
console.log("profielKaarten.js geladen");

let profileCardTimeout = null;
const PROFILE_CARD_DELAY = 300; // ms

// Function to get profile photo URL
function getProfilePhotoUrl(medewerker, size = 'M') {
    console.log('[getProfilePhotoUrl] Called with medewerker:', medewerker, 'size:', size);
    let profielFotoFinalUrl = 'Icoon/default-profile.svg'; // Default fallback

    if (!medewerker) {
        console.error("[getProfilePhotoUrl] Medewerker object is null or undefined.");
        return profielFotoFinalUrl;
    }

    const accountIdentifier = medewerker.Username || medewerker.E_x002d_mail;

    if (!accountIdentifier) {
        console.warn(`[getProfilePhotoUrl] Geen Username of E_x002d_mail gevonden voor medewerker: ${medewerker.Naam || JSON.stringify(medewerker)}. Gebruik standaardicoon.`);
    }

    if (accountIdentifier && typeof window.spWebAbsoluteUrl === 'string' && window.spWebAbsoluteUrl) {
        const baseUrl = window.spWebAbsoluteUrl.endsWith('/') ? window.spWebAbsoluteUrl.slice(0, -1) : window.spWebAbsoluteUrl;
        profielFotoFinalUrl = `${baseUrl}/_layouts/15/userphoto.aspx?size=${size}&accountname=${encodeURIComponent(accountIdentifier)}`;
        console.log(`[getProfilePhotoUrl] Generated SharePoint URL: ${profielFotoFinalUrl}`);
    } else if (!accountIdentifier) {
        // Warning already logged above
    } else {
        console.warn(`[getProfilePhotoUrl] window.spWebAbsoluteUrl ('${window.spWebAbsoluteUrl}') is niet ingesteld of geen string. Kan geen SharePoint foto URL genereren voor ${accountIdentifier}. Gebruik standaardicoon.`);
    }
    console.log(`[getProfilePhotoUrl] Returning URL: ${profielFotoFinalUrl}`);
    return profielFotoFinalUrl;
}

// Functie om de profielkaart te tonen
// Parameter 'medewerker' is nu het volledige medewerker object
function showProfileCard(medewerker, targetElement) { 
    clearTimeout(profileCardTimeout); 

    const cardContainer = document.getElementById('profile-card-container');
    if (!targetElement) {
        console.warn("[ProfielKaart] TargetElement niet gevonden voor showProfileCard.");
        return;
    }
    if (!cardContainer) {
        console.warn("[ProfielKaart] Card container niet gevonden.");
        return;
    }

    let contentHtml;
    let cardIdentifierLog = 'onbekende medewerker';

    if (!medewerker || typeof medewerker !== 'object' || Object.keys(medewerker).length === 0) {
        console.warn("[ProfielKaart] Geen of ongeldige medewerker data ontvangen.", medewerker);
        // Gebruik p-2 zoals in het originele bestand voor de content div
        contentHtml = '<div class="profile-card-content p-2 text-red-500">Profielinformatie niet beschikbaar.</div>';
        cardIdentifierLog = 'data niet beschikbaar';
    } else {
        cardIdentifierLog = medewerker.Naam || medewerker.Username || medewerker.ID || 'medewerker';
        console.log(`[ProfielKaart] Profielkaart data voorbereiden voor: ${cardIdentifierLog}`);

        const profielFotoFinalUrl = getProfilePhotoUrl(medewerker, 'M'); // Use the new utility function with size 'M'
        
        let horenStatusHTML = '';
        if (medewerker.hasOwnProperty('Horen') && typeof medewerker.Horen === 'boolean') {
            if (medewerker.Horen === true) {
                horenStatusHTML = `<p class="text-xs text-green-600 text-center mb-2">Beschikbaar om gepland te worden voor het horen</p>`;
            } else {
                horenStatusHTML = `<p class="text-xs text-red-600 text-center mb-2">Geen beschikbaarheid om gepland te worden voor het horen</p>`;
            }
        }
        
        // Badge SVGs - replace with your actual SVG content or paths
        const teamleiderSVG = medewerker.Teamleider ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="inline-block mr-1 text-blue-500" title="Teamleider"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"></path></svg>` : '';
        const seniorSVG = medewerker.Senior ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="inline-block mr-1 text-green-500" title="Senior"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path></svg>` : '';
        
        let badgesHTML = '';
        if (teamleiderSVG || seniorSVG) {
            badgesHTML = `<div class="text-center mt-2 mb-1">${teamleiderSVG}${seniorSVG}</div>`;
        }

        // Werkuren - Placeholder, needs integration with actual data source
        // This is a simplified example. You'll need to fetch and format this properly.
        let werkurenHTML = '<div class="mt-3 pt-2 border-t border-gray-200">';
        werkurenHTML += '<h4 class="text-xs font-semibold text-gray-500 mb-1">Werkuren:</h4>';
        
        let werkurenContent = '<p class="text-xs text-gray-600">Niet beschikbaar</p>'; // Default
        
        // Check if alleUrenPerWeekItems is available and the medewerker has a username
        if (typeof alleUrenPerWeekItems !== 'undefined' && alleUrenPerWeekItems && alleUrenPerWeekItems.length > 0 && medewerker.Username) {
            // Normalize the current medewerker's username
            const genormaliseerdeMedewerkerUsername = typeof window.trimLoginNaamPrefix === 'function' 
                ? window.trimLoginNaamPrefix(medewerker.Username) 
                : medewerker.Username;
            console.log(`[WerkurenDebug] User: ${medewerker.Naam}, NormalizedUsername: ${genormaliseerdeMedewerkerUsername}`);

            // Filter schedules for the current medewerker and ensure they are currently effective
            const medewerkerSchedules = alleUrenPerWeekItems
                .filter(upw => {
                    // Normalize the MedewerkerID from the schedule item
                    const scheduleMedewerkerID = typeof window.trimLoginNaamPrefix === 'function' 
                        ? window.trimLoginNaamPrefix(upw.MedewerkerID) 
                        : upw.MedewerkerID;
                    
                    const effectiveDate = typeof getUrenPerWeekEffectiveDate === 'function' 
                        ? getUrenPerWeekEffectiveDate(upw) 
                        : new Date(upw.Ingangsdatum || upw.Startdatum);
                    
                    const isMatch = scheduleMedewerkerID === genormaliseerdeMedewerkerUsername;
                    const isActive = effectiveDate && effectiveDate <= new Date();
                    // Optional: Log details for each schedule item being checked if needed for deeper debugging
                    // console.log(`[WerkurenDebug] User: ${medewerker.Naam}, Checking UPW item ID: ${upw.Id || 'N/A'}, ScheduleMedID: ${scheduleMedewerkerID}, Match: ${isMatch}, EffectiveDate: ${effectiveDate}, IsActive: ${isActive}`);
                    return isMatch && isActive;
                })
                .sort((a, b) => {
                    // Sort by effective date in descending order to get the latest schedule first
                    const dateA = typeof getUrenPerWeekEffectiveDate === 'function' ? getUrenPerWeekEffectiveDate(a) : new Date(a.Ingangsdatum || a.Startdatum);
                    const dateB = typeof getUrenPerWeekEffectiveDate === 'function' ? getUrenPerWeekEffectiveDate(b) : new Date(b.Ingangsdatum || b.Startdatum);
                    return dateB - dateA;
                });

            if (medewerkerSchedules.length > 0) {
                const latestSchedule = medewerkerSchedules[0]; // Get the most current active schedule
                console.log(`[WerkurenDebug] User: ${medewerker.Naam}, Found ${medewerkerSchedules.length} active schedule(s). Latest schedule ID: ${latestSchedule.Id || 'N/A'}, Ingangsdatum: ${latestSchedule.Ingangsdatum || latestSchedule.Startdatum}`);

                const daysConfig = [
                    { label: 'Ma', startKey: 'MaandagStart', endKey: 'MaandagEind' },
                    { label: 'Di', startKey: 'DinsdagStart', endKey: 'DinsdagEind' },
                    { label: 'Wo', startKey: 'WoensdagStart', endKey: 'WoensdagEind' },
                    { label: 'Do', startKey: 'DonderdagStart', endKey: 'DonderdagEind' }, // Assuming field name based on pattern
                    { label: 'Vr', startKey: 'VrijdagStart', endKey: 'VrijdagEind' }       // Assuming field name based on pattern
                ];

                let tableRowsHTML = '';
                let hasAnyData = false; // To check if any day has actual start or end times

                daysConfig.forEach(day => {
                    const startTimeValue = latestSchedule[day.startKey];
                    const endTimeValue = latestSchedule[day.endKey];

                    const displayStart = (startTimeValue !== null && startTimeValue !== undefined && String(startTimeValue).trim() !== "") 
                                       ? String(startTimeValue).trim() 
                                       : '-';
                    const displayEnd = (endTimeValue !== null && endTimeValue !== undefined && String(endTimeValue).trim() !== "") 
                                     ? String(endTimeValue).trim() 
                                     : '-';

                    if (displayStart !== '-' || displayEnd !== '-') {
                        hasAnyData = true;
                    }

                    tableRowsHTML += `<tr class="border-t border-gray-100">
                                        <td class="py-0.5 pr-2">${day.label}</td>
                                        <td class="py-0.5">${displayStart}</td>
                                        <td class="py-0.5">${displayEnd}</td>
                                      </tr>`;
                });
                
                if (!hasAnyData) {
                    werkurenContent = '<p class="text-xs text-gray-600">Geen specifieke start- of eindtijden gevonden voor het huidige rooster.</p>';
                    console.warn(`[WerkurenDebug] User: ${medewerker.Naam}, Active schedule found (ID: ${latestSchedule.Id || 'N/A'}) but no start/end time values were extracted. LatestSchedule object:`, JSON.stringify(latestSchedule));
                } else {
                    werkurenContent = `
                        <table class="text-xs w-full mt-1">
                            <thead>
                                <tr class="text-left">
                                    <th class="pb-1 font-semibold text-gray-500">Dag</th>
                                    <th class="pb-1 font-semibold text-gray-500">Start</th>
                                    <th class="pb-1 font-semibold text-gray-500">Einde</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRowsHTML}
                            </tbody>
                        </table>`;
                }
            } else {
                werkurenContent = '<p class="text-xs text-gray-600">Geen actueel werkrooster gevonden.</p>';
                console.warn(`[WerkurenDebug] User: ${medewerker.Naam}, No active work schedule found. Total UrenPerWeek items checked: ${alleUrenPerWeekItems.length}`);
            }
        } else if (medewerker && !medewerker.Username) { // Added medewerker check here
            werkurenContent = '<p class="text-xs text-gray-500">Werkuren niet beschikbaar (geen gebruikersnaam).</p>';
        } else {
            werkurenContent = '<p class="text-xs text-gray-500">Werkuren data (alleUrenPerWeekItems) niet geladen of medewerker info onvolledig.</p>';
        }
        
        werkurenHTML += werkurenContent;
        werkurenHTML += '</div>';

        contentHtml = `
            <div class="profile-card-content p-4 bg-white rounded-lg shadow-xl border border-gray-200 w-64">
                <h3 class="text-lg font-semibold text-center text-gray-800 mb-2">${medewerker.Naam || 'N/A'}</h3>
                <img src="${profielFotoFinalUrl}" 
                     alt="Profielfoto van ${medewerker.Naam || 'medewerker'}" 
                     class="w-20 h-20 rounded-full mx-auto mb-2 border-2 border-gray-300 object-cover" 
                     onerror="this.onerror=null; this.src='Icoon/default-profile.svg';">
                ${horenStatusHTML}
                ${badgesHTML}
                <p class="text-sm text-gray-600 text-center truncate" title="${medewerker.Functie || ''}">${medewerker.Functie || 'Functie niet beschikbaar'}</p>
                
                <div class="mt-3 pt-2 border-t border-gray-200">
                    <p class="text-xs text-gray-500">E-mail:</p>
                    <p class="text-sm text-gray-700 truncate" title="${medewerker.E_x002d_mail || ''}">${medewerker.E_x002d_mail || 'Niet beschikbaar'}</p>
                </div>
                <div class="mt-1">
                    <p class="text-xs text-gray-500">Telefoon:</p>
                    <p class="text-sm text-gray-700">${medewerker.Telefoonnummer || medewerker.Telefoon || 'Niet beschikbaar'}</p>
                </div>
                ${werkurenHTML}
            </div>
        `;
    }

    cardContainer.innerHTML = contentHtml;

    // Positioning logic (single pass)
    const rect = targetElement.getBoundingClientRect();
    let cardLeft = window.scrollX + rect.right + 10; 
    let cardTop = window.scrollY + rect.top;      

    // Make it visible at 0,0 to measure its dimensions correctly
    cardContainer.style.left = '0px'; 
    cardContainer.style.top = '0px';
    cardContainer.classList.remove('hidden');

    const cardWidth = cardContainer.offsetWidth;
    const cardHeight = cardContainer.offsetHeight;

    // Adjust if it goes off screen right
    if ((cardLeft + cardWidth) > window.innerWidth) {
        cardLeft = window.scrollX + rect.left - cardWidth - 10; // Try to the left of target
    }
    // Adjust if it goes off screen bottom
    if ((cardTop + cardHeight) > window.innerHeight) {
        cardTop = window.scrollY + window.innerHeight - cardHeight - 10; // Align to bottom edge - 10px
    }
    // Ensure it doesn't go above the viewport top
    if (cardTop < window.scrollY) {
        cardTop = window.scrollY + 10; // Align to top edge + 10px
    }
    // Ensure it doesn't go off screen left (especially if switched to left of target or initial position was too far left)
    if (cardLeft < window.scrollX) { 
        cardLeft = window.scrollX + 10; // Align to left edge + 10px
    }
    
    cardContainer.style.left = `${cardLeft}px`;
    cardContainer.style.top = `${cardTop}px`;

    cardContainer.removeEventListener('mouseleave', delayedHideProfileCard);
    cardContainer.addEventListener('mouseleave', delayedHideProfileCard);
    cardContainer.removeEventListener('mouseenter', cancelHideProfileCard);
    cardContainer.addEventListener('mouseenter', cancelHideProfileCard);

    if (!medewerker || typeof medewerker !== 'object' || Object.keys(medewerker).length === 0) {
        // If data was invalid, set a timeout to hide the error message
        profileCardTimeout = setTimeout(hideProfileCard, 3000); 
    }
    console.log(`[ProfielKaart] Profielkaart getoond en gepositioneerd voor: ${cardIdentifierLog}`);
}

function cancelHideProfileCard() {
    clearTimeout(profileCardTimeout);
}

function delayedHideProfileCard() {
    clearTimeout(profileCardTimeout);
    profileCardTimeout = setTimeout(hideProfileCard, PROFILE_CARD_DELAY / 2); // Kortere delay als muis van kaart af gaat
}

// Functie om de profielkaart te verbergen
function hideProfileCard() {
    clearTimeout(profileCardTimeout);
    const cardContainer = document.getElementById('profile-card-container');
    if (cardContainer) {
        cardContainer.classList.add('hidden');
        // cardContainer.innerHTML = ''; // Optioneel: leegmaken bij verbergen
    }
    console.log("[ProfielKaart] Kaart verborgen.");
}

// Eventueel een hoofdfunctie om alles te starten na het laden van de DOM
// document.addEventListener('DOMContentLoaded', function() {
//     initProfileCardEventListeners(); // Wordt nu afgehandeld in verlofrooster_logic.js
// });

// Globale functies beschikbaar maken indien nodig (als ze nog niet globaal zijn)
window.showProfileCard = showProfileCard;
window.hideProfileCard = hideProfileCard;
window.delayedHideProfileCard = delayedHideProfileCard;
window.cancelHideProfileCard = cancelHideProfileCard;
window.getProfilePhotoUrl = getProfilePhotoUrl; // Make the new function globally available

console.log("[ProfielKaart] Functies (show, hide, delayedHide, cancelHide, getProfilePhotoUrl) zijn nu globaal beschikbaar.");
