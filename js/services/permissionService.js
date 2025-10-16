/**
 * @file permissionService.js
 * @description Service voor het beheren van gebruikersrechten en groepslidmaatschappen in SharePoint.
 * Deze service biedt functionaliteiten voor:
 * 1. Het ophalen van SharePoint groepslidmaatschappen van de huidige gebruiker
 * 2. Het valideren van toegangsrechten op basis van groepslidmaatschap
 * 3. Het tonen/verbergen van UI-elementen op basis van rechten
 */

import { getCurrentUser, fetchSharePointList } from './sharepointService.js';

/**
 * Cache voor gebruikersgroepen om herhaalde API-calls te voorkomen
 */
let userGroupsCache = null;
let authorizedGroupsCache = null;
let currentUserCache = null;

/**
 * Haalt alle SharePoint groepen op waar de huidige gebruiker lid van is.
 * @returns {Promise<Array<string>>} Array met groepenamen
 */
export async function getCurrentUserGroups() {
    // Return cached result if available
    if (userGroupsCache !== null) {
        return userGroupsCache;
    }

    try {
        const siteUrl = window.appConfiguratie.instellingen.siteUrl;
        const apiUrl = `${siteUrl.replace(/\/$/, '')}/_api/web/currentuser/groups`;

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json;odata=nometadata' },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error(`Fout bij ophalen gebruikersgroepen (${response.status}): ${response.statusText}`);
        }

        const data = await response.json();
        
        // Extract group titles/names
        userGroupsCache = data.value ? data.value.map(group => group.Title) : [];
        
        console.log('Gebruiker is lid van de volgende groepen:', userGroupsCache);
        return userGroupsCache;

    } catch (error) {
        console.error('Fout bij ophalen van gebruikersgroepen:', error);
        userGroupsCache = [];
        return userGroupsCache;
    }
}

/**
 * Haalt de geautoriseerde groepen op uit de gemachtigdenLijst
 * @returns {Promise<Array<Object>>} Array met autorisatie objecten
 */
export async function getAuthorizedGroups() {
    // Return cached result if available
    if (authorizedGroupsCache !== null) {
        return authorizedGroupsCache;
    }

    try {
        const authorizedItems = await fetchSharePointList('gemachtigdenLijst');
        authorizedGroupsCache = authorizedItems || [];
        return authorizedGroupsCache;
    } catch (error) {
        console.error('Fout bij ophalen van geautoriseerde groepen:', error);
        authorizedGroupsCache = [];
        return authorizedGroupsCache;
    }
}

/**
 * Controleert of de huidige gebruiker toegang heeft tot een specifiek gedeelte
 * @param {string} gedeelte - Het gedeelte waarvoor toegang gecontroleerd moet worden
 * @returns {Promise<boolean>} True als de gebruiker toegang heeft
 */
export async function hasAccessToSection(gedeelte) {
    try {
        const [userGroups, authorizedGroups] = await Promise.all([
            getCurrentUserGroups(),
            getAuthorizedGroups()
        ]);

        // Zoek autorisatie voor het specifieke gedeelte
        const sectionAuth = authorizedGroups.find(auth => 
            auth.Gedeelte && auth.Gedeelte.toLowerCase() === gedeelte.toLowerCase()
        );

        if (!sectionAuth || !sectionAuth.Groepen) {
            console.warn(`Geen autorisatie configuratie gevonden voor gedeelte: ${gedeelte}`);
            return false;
        }

        // Parse groepen (MultiChoice field komt binnen als string met ;# separators)
        const authorizedGroupNames = parseMultiChoiceField(sectionAuth.Groepen);
        
        // Controleer of gebruiker lid is van een van de geautoriseerde groepen
        const hasAccess = authorizedGroupNames.some(authGroup => 
            userGroups.some(userGroup => 
                userGroup.toLowerCase() === authGroup.toLowerCase()
            )
        );

        console.log(`Toegang tot '${gedeelte}':`, hasAccess, {
            userGroups,
            authorizedGroups: authorizedGroupNames
        });

        return hasAccess;

    } catch (error) {
        console.error(`Fout bij controleren toegang tot ${gedeelte}:`, error);
        return false;
    }
}

/**
 * Controleert of de huidige gebruiker lid is van een specifieke groep
 * @param {string} groupName - Naam van de groep
 * @returns {Promise<boolean>} True als de gebruiker lid is van de groep
 */
export async function isUserInGroup(groupName) {
    try {
        const userGroups = await getCurrentUserGroups();
        return userGroups.some(group => 
            group.toLowerCase() === groupName.toLowerCase()
        );
    } catch (error) {
        console.error(`Fout bij controleren groepslidmaatschap van ${groupName}:`, error);
        return false;
    }
}

/**
 * Controleert of de huidige gebruiker lid is van een van de opgegeven groepen
 * @param {Array<string>} groupNames - Array met groepsnamen
 * @returns {Promise<boolean>} True als de gebruiker lid is van minstens een groep
 */
export async function isUserInAnyGroup(groupNames) {
    try {
        const userGroups = await getCurrentUserGroups();
        return groupNames.some(groupName =>
            userGroups.some(userGroup => 
                userGroup.toLowerCase() === groupName.toLowerCase()
            )
        );
    } catch (error) {
        console.error('Fout bij controleren groepslidmaatschap:', error);
        return false;
    }
}

/**
 * Haalt de huidige gebruiker op (met caching)
 * @returns {Promise<Object|null>} Gebruikersobject of null
 */
export async function getCachedCurrentUser() {
    if (currentUserCache !== null) {
        return currentUserCache;
    }

    currentUserCache = await getCurrentUser();
    return currentUserCache;
}

/**
 * Parse een MultiChoice field van SharePoint (format: ;#Value1;#Value2;#)
 * @param {string} multiChoiceValue - De MultiChoice waarde
 * @returns {Array<string>} Array met individuele waardes
 */
function parseMultiChoiceField(multiChoiceValue) {
    if (!multiChoiceValue || typeof multiChoiceValue !== 'string') {
        return [];
    }

    // Remove leading/trailing ;# and split by ;#
    return multiChoiceValue
        .replace(/^;#|;#$/g, '')
        .split(';#')
        .filter(value => value.trim() !== '');
}

/**
 * Helper functie om alle geautoriseerde gedeeltes voor de huidige gebruiker op te halen
 * @returns {Promise<Array<string>>} Array met gedeeltes waartoe de gebruiker toegang heeft
 */
export async function getUserAuthorizedSections() {
    try {
        const [userGroups, authorizedGroups] = await Promise.all([
            getCurrentUserGroups(),
            getAuthorizedGroups()
        ]);

        const authorizedSections = [];

        for (const auth of authorizedGroups) {
            if (!auth.Gedeelte || !auth.Groepen) continue;

            const authorizedGroupNames = parseMultiChoiceField(auth.Groepen);
            const hasAccess = authorizedGroupNames.some(authGroup => 
                userGroups.some(userGroup => 
                    userGroup.toLowerCase() === authGroup.toLowerCase()
                )
            );

            if (hasAccess) {
                authorizedSections.push(auth.Gedeelte);
            }
        }

        return authorizedSections;
    } catch (error) {
        console.error('Fout bij ophalen geautoriseerde gedeeltes:', error);
        return [];
    }
}

/**
 * Reset de cache (gebruik na logout of bij wijzigingen in groepslidmaatschap)
 */
export function clearPermissionCache() {
    userGroupsCache = null;
    authorizedGroupsCache = null;
    currentUserCache = null;
    console.log('Permission cache gecleared');
}

// Export alle functies voor gebruik in andere modules
export default {
    getCurrentUserGroups,
    getAuthorizedGroups,
    hasAccessToSection,
    isUserInGroup,
    isUserInAnyGroup,
    getCachedCurrentUser,
    getUserAuthorizedSections,
    clearPermissionCache
};
