/**
 * @file sharepointService.js
 * @description Dit bestand bevat functies om te communiceren met de SharePoint REST API.
 * Het is specifiek opgezet om gebruikersinformatie op te halen op basis van de loginnaam.
 */

/**
 * Ophalen van gebruikersinformatie uit SharePoint op basis van een loginnaam.
 *
 * Deze functie maakt gebruik van de SharePoint REST API om informatie op te halen over een gebruiker.
 * De loginnaam moet in het formaat 'domein\\gebruiker' zijn. De functie retourneert een object met
 * de belangrijkste gebruikersgegevens, inclusief een URL naar de profielfoto. Als de gebruiker niet
 * gevonden wordt of er een fout optreedt, wordt null geretourneerd.
 *
 * @param {string} loginName - De loginnaam van de gebruiker, bijvoorbeeld 'org\\busselw'.
 * @returns {Promise<object|null>} Een Promise die wordt vervuld met een object met gebruikersdata,
 * inclusief de 'PictureURL', of null als de gebruiker niet gevonden is of er een fout optreedt.
 */
export async function getUserInfo(loginName) {
    if (!loginName) {
        console.warn("Ongeldige of ontbrekende loginName voor getUserInfo:", loginName);
        return null;
    }

    const siteUrl = window.appConfiguratie.instellingen.siteUrl;
    
    // Handle different formats of loginName and try multiple approaches
    let processedLoginName = loginName;
    
    // If loginName doesn't contain \, try to construct it
    if (!loginName.includes('\\') && loginName.length > 0) {
        // Assume it's just the username part, try common domain
        processedLoginName = `org\\${loginName}`;
    }
    
    console.log(`Trying to find user with loginName: "${processedLoginName}"`);
    
    // Try multiple API approaches
    const attempts = [
        // 1. Try with claim-based format
        {
            name: 'claim-based',
            loginName: `i:0#.w|${processedLoginName}`,
            url: `${siteUrl.replace(/\/$/, '')}/_api/web/siteusers?$filter=LoginName eq '${encodeURIComponent(`i:0#.w|${processedLoginName}`)}'`
        },
        // 2. Try without claim prefix
        {
            name: 'direct',
            loginName: processedLoginName,
            url: `${siteUrl.replace(/\/$/, '')}/_api/web/siteusers?$filter=LoginName eq '${encodeURIComponent(processedLoginName)}'`
        },
        // 3. Try with user principal name format if it contains @
        ...(processedLoginName.includes('@') ? [{
            name: 'upn',
            loginName: processedLoginName,
            url: `${siteUrl.replace(/\/$/, '')}/_api/web/siteusers?$filter=Email eq '${encodeURIComponent(processedLoginName)}'`
        }] : []),
        // 4. Try searching by user title/display name
        {
            name: 'search-all',
            loginName: processedLoginName,
            url: `${siteUrl.replace(/\/$/, '')}/_api/web/siteusers?$select=*`
        }
    ];

    for (const attempt of attempts) {
        try {
            console.log(`Attempting ${attempt.name} lookup for user "${attempt.loginName}"`);
            
            const response = await fetch(attempt.url, {
                method: 'GET',
                headers: { 'Accept': 'application/json;odata=nometadata' }
            });

            if (!response.ok) {
                console.warn(`${attempt.name} lookup failed with status ${response.status}: ${response.statusText}`);
                continue;
            }

            const data = await response.json();
            
            if (attempt.name === 'search-all') {
                // For search-all, look for a user that matches our criteria
                const user = data.value?.find(u => 
                    u.LoginName?.toLowerCase().includes(processedLoginName.toLowerCase()) ||
                    u.Email?.toLowerCase() === processedLoginName.toLowerCase() ||
                    u.Title?.toLowerCase().includes(processedLoginName.toLowerCase())
                );
                if (user) {
                    console.log(`Found user via search-all: ${user.LoginName}`);
                    const pictureUrl = `${siteUrl.replace(/\/$/, '')}/_layouts/15/userphoto.aspx?size=M&accountname=${encodeURIComponent(user.LoginName)}`;
                    return {
                        Id: user.Id,
                        Title: user.Title,
                        Email: user.Email,
                        LoginName: user.LoginName,
                        PictureURL: pictureUrl
                    };
                }
            } else {
                // For specific lookups
                if (data.value && data.value.length > 0) {
                    const user = data.value[0];
                    console.log(`Found user via ${attempt.name}: ${user.LoginName}`);
                    const pictureUrl = `${siteUrl.replace(/\/$/, '')}/_layouts/15/userphoto.aspx?size=M&accountname=${encodeURIComponent(user.LoginName)}`;

                    return {
                        Id: user.Id,
                        Title: user.Title,
                        Email: user.Email,
                        LoginName: user.LoginName,
                        PictureURL: pictureUrl
                    };
                }
            }
        } catch (error) {
            console.warn(`${attempt.name} lookup failed:`, error.message);
        }
    }

    console.warn(`Gebruiker met loginnaam '${processedLoginName}' niet gevonden na alle pogingen.`);
    return null;
}

/**
 * Genereert een directe URL naar de profielfoto van een gebruiker in SharePoint.
 *
 * Gebruik deze functie als je alleen de foto-URL nodig hebt en niet de volledige gebruikersinformatie.
 * De loginnaam moet in het formaat 'domein\\gebruiker' zijn. De grootte van de foto kan worden opgegeven
 * als 'S' (Small), 'M' (Medium), of 'L' (Large).
 *
 * @param {string} loginName - De loginnaam van de gebruiker (bijv. 'org\\busselw').
 * @param {'S' | 'M' | 'L'} [size='M'] - De gewenste grootte van de foto.
 * @returns {string|null} De volledige URL naar de afbeelding, of null bij een ongeldige input.
 */
export function getProfilePictureUrl(loginName, size = 'M') {
    if (!loginName || !loginName.includes('\\')) {
        console.warn("Ongeldige of ontbrekende loginName voor getProfilePictureUrl:", loginName);
        return null;
    }

    const siteUrl = window.appConfiguratie.instellingen.siteUrl;
    const claimBasedLoginName = `i:0#.w|${loginName}`;
    const imageUrl = `${siteUrl.replace(/\/$/, '')}/_layouts/15/userphoto.aspx?size=${size}&accountname=${encodeURIComponent(claimBasedLoginName)}`;

    return imageUrl;
}

/**
 * Haalt een lijst met items op uit SharePoint op basis van de lijstnaam uit de appConfiguratie.
 *
 * Deze functie maakt gebruik van de SharePoint REST API om alle items van een opgegeven lijst op te halen.
 * De lijstnaam moet overeenkomen met een configuratie in window.appConfiguratie. Bij een fout wordt een
 * error gegooid. De functie retourneert een array met lijstitems.
 *
 * @param {string} lijstNaam - De naam van de lijst zoals gedefinieerd in appConfiguratie.
 * @returns {Promise<Array>} Een Promise met de lijstitems of een lege array bij fout.
 */
export async function fetchSharePointList(lijstNaam) {
    try {
        if (!window.appConfiguratie || !window.appConfiguratie.instellingen) {
            console.warn('App configuratie niet gevonden. Fallback naar lege lijst.');
            return [];
        }
        
        const siteUrl = window.appConfiguratie.instellingen.siteUrl;
        if (!siteUrl) {
            console.warn('SharePoint site URL niet gevonden. Fallback naar lege lijst.');
            return [];
        }
        
        const lijstConfig = window.appConfiguratie[lijstNaam];
        if (!lijstConfig) {
            console.warn(`Configuratie voor lijst '${lijstNaam}' niet gevonden. Fallback naar lege lijst.`);
            return [];
        }

        const lijstTitel = lijstConfig.lijstTitel;
        const apiUrl = `${siteUrl.replace(/\/$/, "")}/_api/web/lists/getbytitle('${lijstTitel}')/items?$top=5000`;
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json;odata=nometadata' },
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            console.warn(`Fout bij ophalen van ${lijstNaam}: ${response.statusText}. Fallback naar lege lijst.`);
            return [];
        }
        
        const data = await response.json();
        return data.value || [];
    } catch (error) {
        console.error(`Fout bij ophalen van lijst ${lijstNaam}:`, error);
        console.warn('Fallback naar lege lijst vanwege fout.');
        return [];
    }
}

/**
 * Haalt de informatie van de huidige ingelogde gebruiker op.
 * @returns {Promise<object|null>} Een Promise die wordt vervuld met een object met gebruikersdata, of null bij een fout.
 */
export async function getCurrentUserInfo() {
    if (!window.appConfiguratie || !window.appConfiguratie.instellingen || !window.appConfiguratie.instellingen.siteUrl) {
        console.error("SiteUrl configuratie is niet beschikbaar.");
        return null;
    }
    const siteUrl = window.appConfiguratie.instellingen.siteUrl;
    const apiUrl = `${siteUrl.replace(/\/$/, '')}/_api/web/currentuser`;

    try {
        console.log('Getting current user from:', apiUrl);
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json;odata=nometadata' }
        });

        if (!response.ok) {
            throw new Error(`Fout bij ophalen huidige gebruiker (${response.status}): ${response.statusText}`);
        }

        const user = await response.json();
        console.log('Raw current user data:', user);

        if (user) {
            const pictureUrl = `${siteUrl.replace(/\/$/, '')}/_layouts/15/userphoto.aspx?size=M&accountname=${encodeURIComponent(user.LoginName)}`;
            const result = {
                ...user,
                PictureURL: pictureUrl
            };
            console.log('Processed current user data:', result);
            return result;
        }
        return null;
    } catch (error) {
        console.error("Fout tijdens het ophalen van huidige gebruikersinformatie:", error);
        return null;
    }
}

// Alias for compatibility
export const getCurrentUser = getCurrentUserInfo;

/**
 * Haalt de Form Digest Value op die nodig is voor POST requests.
 * @returns {Promise<string>} De Form Digest Value.
 */
async function getRequestDigest() {
    const siteUrl = window.appConfiguratie.instellingen.siteUrl;
    const apiUrl = `${siteUrl.replace(/\/$/, '')}/_api/contextinfo`;

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Accept': 'application/json;odata=nometadata' },
        credentials: 'same-origin'
    });

    if (!response.ok) {
        throw new Error(`Fout bij ophalen van request digest: ${response.statusText}`);
    }

    const data = await response.json();
    return data.FormDigestValue;
}

export const getSharePointListItems = async (listName) => {
    try {
        if (!window.appConfiguratie || !window.appConfiguratie.instellingen) {
            throw new Error('App configuratie niet gevonden.');
        }
        const siteUrl = window.appConfiguratie.instellingen.siteUrl;
        const lijstConfig = window.appConfiguratie[listName];
        if (!lijstConfig) throw new Error(`Configuratie voor lijst '${listName}' niet gevonden.`);

        const lijstTitel = lijstConfig.lijstTitel;
        const apiUrl = `${siteUrl.replace(/\/$/, "")}/_api/web/lists/getbytitle('${lijstTitel}')/items?$top=5000`;
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json;odata=nometadata' },
            credentials: 'same-origin'
        });
        if (!response.ok) throw new Error(`Fout bij ophalen van ${listName}: ${response.statusText}`);
        const data = await response.json();
        return data.value || [];
    } catch (error) {
        console.error(`Fout bij ophalen van lijst ${listName}:`, error);
        throw error;
    }
};

export const createSharePointListItem = async (listName, itemData) => {
    try {
        if (!window.appConfiguratie || !window.appConfiguratie.instellingen) {
            throw new Error('App configuratie niet gevonden.');
        }
        const siteUrl = window.appConfiguratie.instellingen.siteUrl;
        const lijstConfig = window.appConfiguratie[listName];
        if (!lijstConfig) throw new Error(`Configuratie voor lijst '${listName}' niet gevonden.`);

        const lijstTitel = lijstConfig.lijstTitel;
        const apiUrl = `${siteUrl.replace(/\/$/, "")}/_api/web/lists/getbytitle('${lijstTitel}')/items`;
        
        console.log(`Creating item in list ${listName} (${lijstTitel})`);
        console.log('Item data:', itemData);
        console.log('API URL:', apiUrl);
        
        // Validate required fields based on list configuration
        if (listName === 'Verlof') {
            const requiredFields = ['Title', 'Medewerker', 'MedewerkerID', 'StartDatum', 'EindDatum'];
            const missingFields = requiredFields.filter(field => !itemData[field]);
            if (missingFields.length > 0) {
                throw new Error(`Vereiste velden ontbreken voor ${listName}: ${missingFields.join(', ')}`);
            }
            
            // Validate date formats
            if (!itemData.StartDatum.includes('T') || !itemData.EindDatum.includes('T')) {
                throw new Error('Datum velden moeten in ISO formaat zijn (YYYY-MM-DDTHH:mm:ss)');
            }
            
            // Ensure RedenId is a string (SharePoint expects Edm.String)
            if (itemData.RedenId !== undefined && typeof itemData.RedenId !== 'string') {
                itemData.RedenId = String(itemData.RedenId);
                console.log('Converted RedenId to string:', itemData.RedenId);
            }
        }
        
        // Generic conversion for other potential numeric fields that should be strings
        const fieldsToStringify = ['RedenId', 'UrenTotaal', 'MedewerkerID'];
        fieldsToStringify.forEach(field => {
            if (itemData[field] !== undefined && itemData[field] !== null && typeof itemData[field] !== 'string') {
                itemData[field] = String(itemData[field]);
                console.log(`Converted ${field} to string:`, itemData[field]);
            }
        });

        const requestDigest = await getRequestDigest();

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json;odata=nometadata',
                'Content-Type': 'application/json;odata=nometadata',
                'X-RequestDigest': requestDigest,
                'IF-MATCH': '*',
                'X-HTTP-Method': 'POST'
            },
            credentials: 'same-origin',
            body: JSON.stringify(itemData)
        });

        if (!response.ok) {
            // Log the response for debugging
            const errorText = await response.text();
            console.error(`SharePoint API Error (${response.status}):`, errorText);
            console.error('Request data was:', itemData);
            console.error('Request headers were:', {
                'Accept': 'application/json;odata=nometadata',
                'Content-Type': 'application/json;odata=nometadata',
                'X-RequestDigest': requestDigest?.substring(0, 20) + '...',
                'IF-MATCH': '*',
                'X-HTTP-Method': 'POST'
            });
            
            // Try to parse the error for more specific information
            let errorDetails = errorText;
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.error && errorJson.error.message) {
                    errorDetails = errorJson.error.message.value || errorJson.error.message;
                }
            } catch (parseError) {
                console.warn('Could not parse error response as JSON');
            }
            
            throw new Error(`Fout bij aanmaken van item in ${listName}: ${response.statusText} - ${errorDetails}`);
        }

        const data = await response.json();
        console.log('Successfully created item:', data);
        return data;
    } catch (error) {
        console.error(`Fout bij aanmaken van item in lijst ${listName}:`, error);
        throw error;
    }
};

export const updateSharePointListItem = async (listName, itemId, updateData) => {
    try {
        if (!window.appConfiguratie || !window.appConfiguratie.instellingen) {
            throw new Error('App configuratie niet gevonden.');
        }
        const siteUrl = window.appConfiguratie.instellingen.siteUrl;
        const lijstConfig = window.appConfiguratie[listName];
        if (!lijstConfig) throw new Error(`Configuratie voor lijst '${listName}' niet gevonden.`);

        const lijstTitel = lijstConfig.lijstTitel;
        const apiUrl = `${siteUrl.replace(/\/$/, "")}/_api/web/lists/getbytitle('${lijstTitel}')/items(${itemId})`;
        const requestDigest = await getRequestDigest();

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json;odata=nometadata',
                'Content-Type': 'application/json;odata=nometadata',
                'X-RequestDigest': requestDigest,
                'IF-MATCH': '*',
                'X-HTTP-Method': 'MERGE'
            },
            credentials: 'same-origin',
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            throw new Error(`Fout bij bijwerken van item in ${listName}: ${response.statusText}`);
        }

        return { success: true };
    } catch (error) {
        console.error(`Fout bij bijwerken van item in lijst ${listName}:`, error);
        throw error;
    }
};

export const deleteSharePointListItem = async (listName, itemId) => {
    try {
        if (!window.appConfiguratie || !window.appConfiguratie.instellingen) {
            throw new Error('App configuratie niet gevonden.');
        }
        const siteUrl = window.appConfiguratie.instellingen.siteUrl;
        const lijstConfig = window.appConfiguratie[listName];
        if (!lijstConfig) throw new Error(`Configuratie voor lijst '${listName}' niet gevonden.`);

        const lijstTitel = lijstConfig.lijstTitel;
        const apiUrl = `${siteUrl.replace(/\/$/, "")}/_api/web/lists/getbytitle('${lijstTitel}')/items(${itemId})`;
        const requestDigest = await getRequestDigest();

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json;odata=nometadata',
                'X-RequestDigest': requestDigest,
                'IF-MATCH': '*',
                'X-HTTP-Method': 'DELETE'
            },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error(`Fout bij verwijderen van item uit ${listName}: ${response.statusText}`);
        }

        return { success: true };
    } catch (error) {
        console.error(`Fout bij verwijderen van item uit lijst ${listName}:`, error);
        throw error;
    }
};

/**
 * Verwijdert het domain prefix van een loginnaam en retourneert alleen de gebruikersnaam.
 * Bijvoorbeeld: 'org\\busselw' wordt 'busselw', 'i:0#.w|org\\busselw' wordt 'busselw'
 * 
 * @param {string} loginName - De volledige loginnaam
 * @returns {string} De gebruikersnaam zonder domain prefix
 */
export function trimLoginNaamPrefix(loginName) {
    if (!loginName) return '';
    
    // Remove claim prefix if present (i:0#.w|domain\username -> domain\username)
    let processed = loginName;
    if (processed.startsWith('i:0#.w|')) {
        processed = processed.substring(7);
    }
    
    // Remove domain prefix (domain\username -> username)
    if (processed.includes('\\')) {
        const parts = processed.split('\\');
        return parts[parts.length - 1]; // Return the last part (username)
    }
    
    return processed;
}

// Note: This file maintains ES6 module exports for the main rooster application
// For global (non-module) usage, see sharepointService-global.js instead