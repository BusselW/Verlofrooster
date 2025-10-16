/**
 * @file linkInfo.js
 * @description Utility functions to match employees to their team leaders and seniors through team membership.
 * This file provides functions to establish relationships between employees, team leaders, and seniors
 * based on the team structure defined in SharePoint lists (Teams, Medewerkers, Seniors).
 */

import { fetchSharePointList } from './sharepointService.js';

// Cache for teams, employees and seniors data to avoid repeated fetching
let teamsCache = null;
let medewerkersCache = null;
let seniorsCache = null;
let lastFetchTime = 0;
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Refreshes the cache if it's expired or doesn't exist
 * @returns {Promise<{teams: Array, medewerkers: Array, seniors: Array}>} The cached teams, employees and seniors data
 */
async function refreshCacheIfNeeded() {
    const now = Date.now();
    
    // If cache is older than the expiry time or doesn't exist, refresh it
    if (!teamsCache || !medewerkersCache || !seniorsCache || now - lastFetchTime > CACHE_EXPIRY_MS) {
        try {
            // Check if SharePoint configuration exists before fetching
            if (!window.appConfiguratie || !window.appConfiguratie.instellingen || !window.appConfiguratie.instellingen.siteUrl) {
                console.warn('SharePoint configuration not found. Team information will be unavailable.');
                return { teams: [], medewerkers: [], seniors: [] };
            }
            
            // Fetch teams, employees and seniors data in parallel
            const [teamsData, medewerkersData, seniorsData] = await Promise.all([
                fetchSharePointList('Teams'),
                fetchSharePointList('Medewerkers'),
                fetchSharePointList('Seniors')
            ]);
            
            // Filter out inactive teams
            teamsCache = teamsData.filter(team => team.Actief !== false);
            medewerkersCache = medewerkersData;
            seniorsCache = seniorsData;
            lastFetchTime = now;
            
            console.log(`Cache refreshed with ${teamsCache.length} teams, ${medewerkersCache.length} employees, and ${seniorsCache.length} seniors`);
        } catch (error) {
            console.error('Error refreshing team/employee/senior cache:', error);
            // If cache already exists, keep using it despite the error
            if (!teamsCache || !medewerkersCache || !seniorsCache) {
                // Return empty arrays instead of throwing an error
                console.warn('Failed to initialize team/employee/senior data cache, returning empty lists');
                return { teams: [], medewerkers: [], seniors: [] };
            }
        }
    }
    
    return { teams: teamsCache, medewerkers: medewerkersCache, seniors: seniorsCache };
}

/**
 * Invalidates the cache, forcing a refresh on the next data request
 */
export function invalidateCache() {
    teamsCache = null;
    medewerkersCache = null;
    seniorsCache = null;
    lastFetchTime = 0;
}

/**
 * Gets the team information for a given employee
 * @param {string} employeeUsername - The username of the employee (domain\username format)
 * @returns {Promise<Object|null>} Team information or null if not found
 */
export async function getTeamForEmployee(employeeUsername) {
    const { teams, medewerkers } = await refreshCacheIfNeeded();
    
    // Normalize the username for comparison
    const normalizedUsername = employeeUsername.toLowerCase();
    
    // Find the employee
    const employee = medewerkers.find(m => 
        m.Username && m.Username.toLowerCase() === normalizedUsername
    );
    
    if (!employee || !employee.Team) {
        return null;
    }
    
    // Find the team
    const team = teams.find(t => 
        t.Naam && t.Naam.toLowerCase() === employee.Team.toLowerCase()
    );
    
    return team || null;
}

/**
 * Gets the team leader information for a given employee
 * @param {string} employeeUsername - The username of the employee (domain\username format)
 * @returns {Promise<Object|null>} Team leader information or null if not found
 */
export async function getTeamLeaderForEmployee(employeeUsername) {
    const { teams, medewerkers } = await refreshCacheIfNeeded();
    
    // Find the team for this employee
    const team = await getTeamForEmployee(employeeUsername);
    
    if (!team || !team.TeamleiderId) {
        return null;
    }
    
    // Normalize the team leader username for comparison
    const normalizedTeamLeaderId = team.TeamleiderId.toLowerCase();
    
    // Find the team leader
    const teamLeader = medewerkers.find(m => 
        m.Username && m.Username.toLowerCase() === normalizedTeamLeaderId
    );
    
    return teamLeader || null;
}

/**
 * Gets all employees for a given team leader
 * @param {string} teamLeaderUsername - The username of the team leader (domain\username format)
 * @returns {Promise<Array>} Array of employees that have this person as their team leader
 */
export async function getEmployeesForTeamLeader(teamLeaderUsername) {
    const { teams, medewerkers } = await refreshCacheIfNeeded();
    
    // Normalize the team leader username for comparison
    const normalizedTeamLeaderUsername = teamLeaderUsername.toLowerCase();
    
    // Find all teams where this person is a team leader
    const leadingTeams = teams.filter(t => 
        t.TeamleiderId && t.TeamleiderId.toLowerCase() === normalizedTeamLeaderUsername
    );
    
    if (leadingTeams.length === 0) {
        return [];
    }
    
    // Get team names led by this person
    const teamNames = leadingTeams.map(t => t.Naam.toLowerCase());
    
    // Find all employees in these teams
    const teamEmployees = medewerkers.filter(m => 
        m.Team && teamNames.includes(m.Team.toLowerCase()) &&
        // Exclude the team leader from the list (unless you want to include them)
        m.Username.toLowerCase() !== normalizedTeamLeaderUsername
    );
    
    return teamEmployees;
}

/**
 * Checks if one employee is a team leader for another
 * @param {string} potentialLeaderUsername - Username of the potential leader
 * @param {string} employeeUsername - Username of the employee
 * @returns {Promise<boolean>} True if the potential leader is a team leader for the employee
 */
export async function isTeamLeaderFor(potentialLeaderUsername, employeeUsername) {
    // Don't check if they are the same person
    if (potentialLeaderUsername.toLowerCase() === employeeUsername.toLowerCase()) {
        return false;
    }
    
    const teamLeader = await getTeamLeaderForEmployee(employeeUsername);
    
    if (!teamLeader || !teamLeader.Username) {
        return false;
    }
    
    return teamLeader.Username.toLowerCase() === potentialLeaderUsername.toLowerCase();
}

/**
 * Gets all team information
 * @returns {Promise<Array>} Array of all teams
 */
export async function getAllTeams() {
    const { teams } = await refreshCacheIfNeeded();
    return teams;
}

/**
 * Gets the team name for a given team leader
 * @param {string} teamLeaderUsername - The username of the team leader
 * @returns {Promise<Array>} Array of team names led by this person
 */
export async function getTeamNamesForTeamLeader(teamLeaderUsername) {
    const { teams } = await refreshCacheIfNeeded();
    
    // Normalize the team leader username for comparison
    const normalizedTeamLeaderUsername = teamLeaderUsername.toLowerCase();
    
    // Find all teams where this person is a team leader
    const leadingTeams = teams.filter(t => 
        t.TeamleiderId && t.TeamleiderId.toLowerCase() === normalizedTeamLeaderUsername
    );
    
    return leadingTeams.map(t => t.Naam);
}

/**
 * Checks if a user is a team leader for any team
 * @param {string} username - The username to check
 * @returns {Promise<boolean>} True if the user is a team leader for any team
 */
export async function isTeamLeader(username) {
    const { teams } = await refreshCacheIfNeeded();
    
    // Normalize the username for comparison
    const normalizedUsername = username.toLowerCase();
    
    // Check if this person is a team leader for any team
    return teams.some(t => 
        t.TeamleiderId && t.TeamleiderId.toLowerCase() === normalizedUsername
    );
}

/**
 * Gets all employees in a given team
 * @param {string} teamName - The name of the team
 * @returns {Promise<Array>} Array of employees in this team
 */
export async function getEmployeesInTeam(teamName) {
    const { medewerkers } = await refreshCacheIfNeeded();
    
    // Normalize the team name for comparison
    const normalizedTeamName = teamName.toLowerCase();
    
    // Find all employees in this team
    return medewerkers.filter(m => 
        m.Team && m.Team.toLowerCase() === normalizedTeamName
    );
}

/**
 * Gets the senior information for a given employee
 * @param {string} employeeUsername - The username of the employee (domain\username format)
 * @returns {Promise<Object|null>} Senior information or null if not found
 */
export async function getSeniorForEmployee(employeeUsername) {
    const { medewerkers, seniors } = await refreshCacheIfNeeded();
    
    // Normalize the username for comparison - try multiple formats
    const normalizedUsername = employeeUsername.toLowerCase();
    
    console.log(`getSeniorForEmployee: Looking for employee "${employeeUsername}"`);
    console.log(`getSeniorForEmployee: Available employees sample:`, medewerkers.slice(0, 3).map(m => ({ Username: m.Username, Naam: m.Naam, Team: m.Team })));
    
    // Find the employee - try exact match first, then partial matches
    let employee = medewerkers.find(m => 
        m.Username && m.Username.toLowerCase() === normalizedUsername
    );
    
    // If not found, try without domain prefix
    if (!employee && employeeUsername.includes('\\')) {
        const usernameWithoutDomain = employeeUsername.split('\\')[1].toLowerCase();
        console.log(`getSeniorForEmployee: Trying without domain: "${usernameWithoutDomain}"`);
        employee = medewerkers.find(m => 
            m.Username && (
                m.Username.toLowerCase() === usernameWithoutDomain ||
                m.Username.toLowerCase().endsWith(`\\${usernameWithoutDomain}`)
            )
        );
    }
    
    // If still not found, try with som\ prefix
    if (!employee && !employeeUsername.includes('\\')) {
        const usernameWithDomain = `som\\${employeeUsername.toLowerCase()}`;
        console.log(`getSeniorForEmployee: Trying with domain: "${usernameWithDomain}"`);
        employee = medewerkers.find(m => 
            m.Username && m.Username.toLowerCase() === usernameWithDomain
        );
    }
    
    if (!employee) {
        console.log(`getSeniorForEmployee: Employee not found for "${employeeUsername}"`);
        return null;
    }
    
    if (!employee.Team) {
        console.log(`getSeniorForEmployee: Employee "${employeeUsername}" has no team assigned`);
        return null;
    }
    
    console.log(`getSeniorForEmployee: Found employee:`, { Username: employee.Username, Naam: employee.Naam, Team: employee.Team });
    console.log(`getSeniorForEmployee: Available seniors sample:`, seniors.slice(0, 3).map(s => ({ Team: s.Team, MedewerkerID: s.MedewerkerID })));
    
    // Find seniors in the same team
    const teamSeniors = seniors.filter(s => 
        s.Team && s.Team.toLowerCase() === employee.Team.toLowerCase()
    );
    
    console.log(`getSeniorForEmployee: Found ${teamSeniors.length} seniors in team "${employee.Team}"`);
    
    if (teamSeniors.length === 0) {
        return null;
    }
    
    // For each senior, find their employee information
    for (const senior of teamSeniors) {
        if (senior.MedewerkerID) {
            console.log(`getSeniorForEmployee: Checking senior with MedewerkerID: "${senior.MedewerkerID}"`);
            
            // Try multiple matching strategies for senior MedewerkerID
            let seniorEmployee = medewerkers.find(m => 
                m.Username && m.Username.toLowerCase() === senior.MedewerkerID.toLowerCase()
            );
            
            // If not found, try without domain prefix on senior ID
            if (!seniorEmployee && senior.MedewerkerID.includes('\\')) {
                const seniorIdWithoutDomain = senior.MedewerkerID.split('\\')[1].toLowerCase();
                seniorEmployee = medewerkers.find(m => 
                    m.Username && (
                        m.Username.toLowerCase() === seniorIdWithoutDomain ||
                        m.Username.toLowerCase().endsWith(`\\${seniorIdWithoutDomain}`)
                    )
                );
            }
            
            // If still not found, try with som\ prefix on senior ID
            if (!seniorEmployee && !senior.MedewerkerID.includes('\\')) {
                const seniorIdWithDomain = `som\\${senior.MedewerkerID.toLowerCase()}`;
                seniorEmployee = medewerkers.find(m => 
                    m.Username && m.Username.toLowerCase() === seniorIdWithDomain
                );
            }
            
            if (seniorEmployee) {
                console.log(`getSeniorForEmployee: Found senior employee:`, { Username: seniorEmployee.Username, Naam: seniorEmployee.Naam });
                // Return the first matching senior with their employee details
                return {
                    ...senior,
                    seniorInfo: seniorEmployee,
                    naam: seniorEmployee.Naam
                };
            } else {
                console.log(`getSeniorForEmployee: No employee found for senior MedewerkerID: "${senior.MedewerkerID}"`);
            }
        }
    }
    
    return null;
}

/**
 * Gets all seniors for a given team
 * @param {string} teamName - The name of the team
 * @returns {Promise<Array>} Array of seniors in this team with their employee information
 */
export async function getSeniorsInTeam(teamName) {
    const { medewerkers, seniors } = await refreshCacheIfNeeded();
    
    // Normalize the team name for comparison
    const normalizedTeamName = teamName.toLowerCase();
    
    // Find seniors in this team
    const teamSeniors = seniors.filter(s => 
        s.Team && s.Team.toLowerCase() === normalizedTeamName
    );
    
    // Map seniors to their employee information
    const seniorsWithInfo = [];
    
    for (const senior of teamSeniors) {
        if (senior.MedewerkerID) {
            const seniorEmployee = medewerkers.find(m => 
                m.Username && m.Username.toLowerCase() === senior.MedewerkerID.toLowerCase()
            );
            
            if (seniorEmployee) {
                seniorsWithInfo.push({
                    ...senior,
                    seniorInfo: seniorEmployee,
                    naam: seniorEmployee.Naam
                });
            }
        }
    }
    
    return seniorsWithInfo;
}

/**
 * Gets all employees that have a specific person as their senior
 * @param {string} seniorUsername - The username of the senior (domain\username format)
 * @returns {Promise<Array>} Array of employees that have this person as their senior
 */
export async function getEmployeesForSenior(seniorUsername) {
    const { medewerkers, seniors } = await refreshCacheIfNeeded();
    
    // Normalize the senior username for comparison
    const normalizedSeniorUsername = seniorUsername.toLowerCase();
    
    // Find all senior records for this person
    const seniorRecords = seniors.filter(s => 
        s.MedewerkerID && s.MedewerkerID.toLowerCase() === normalizedSeniorUsername
    );
    
    if (seniorRecords.length === 0) {
        return [];
    }
    
    // Get team names where this person is a senior
    const seniorTeams = seniorRecords.map(s => s.Team.toLowerCase());
    
    // Find all employees in these teams (excluding the senior themselves)
    const teamEmployees = medewerkers.filter(m => 
        m.Team && seniorTeams.includes(m.Team.toLowerCase()) &&
        m.Username.toLowerCase() !== normalizedSeniorUsername
    );
    
    return teamEmployees;
}

/**
 * Checks if one employee is a senior for another
 * @param {string} potentialSeniorUsername - Username of the potential senior
 * @param {string} employeeUsername - Username of the employee
 * @returns {Promise<boolean>} True if the potential senior is a senior for the employee
 */
export async function isSeniorFor(potentialSeniorUsername, employeeUsername) {
    // Don't check if they are the same person
    if (potentialSeniorUsername.toLowerCase() === employeeUsername.toLowerCase()) {
        return false;
    }
    
    const senior = await getSeniorForEmployee(employeeUsername);
    
    if (!senior || !senior.seniorInfo || !senior.seniorInfo.Username) {
        return false;
    }
    
    return senior.seniorInfo.Username.toLowerCase() === potentialSeniorUsername.toLowerCase();
}

/**
 * Checks if a user is a senior for any team
 * @param {string} username - The username to check
 * @returns {Promise<boolean>} True if the user is a senior for any team
 */
export async function isSenior(username) {
    const { seniors } = await refreshCacheIfNeeded();
    
    // Normalize the username for comparison
    const normalizedUsername = username.toLowerCase();
    
    // Check if this person is a senior for any team
    return seniors.some(s => 
        s.MedewerkerID && s.MedewerkerID.toLowerCase() === normalizedUsername
    );
}

/**
 * Gets team names where a person serves as senior
 * @param {string} seniorUsername - The username of the senior
 * @returns {Promise<Array>} Array of team names where this person is a senior
 */
export async function getTeamNamesForSenior(seniorUsername) {
    const { seniors } = await refreshCacheIfNeeded();
    
    // Normalize the senior username for comparison
    const normalizedSeniorUsername = seniorUsername.toLowerCase();
    
    // Find all teams where this person is a senior
    const seniorTeams = seniors.filter(s => 
        s.MedewerkerID && s.MedewerkerID.toLowerCase() === normalizedSeniorUsername
    );
    
    return seniorTeams.map(s => s.Team);
}

/**
 * Global constant for storing current user's senior information
 * This will be populated when the user's profile is loaded
 */
export let currentUserSenior = null;

/**
 * Sets the current user's senior information for global use
 * @param {Object|null} seniorInfo - The senior information object or null
 */
export function setCurrentUserSenior(seniorInfo) {
    currentUserSenior = seniorInfo;
}

/**
 * Gets the current user's senior information
 * @returns {Object|null} The current user's senior information or null
 */
export function getCurrentUserSenior() {
    return currentUserSenior;
}

/*
USAGE EXAMPLES for Senior Functions:

// Get senior for a specific employee
const senior = await getSeniorForEmployee('som\\john.doe');
if (senior) {
    console.log('Senior name:', senior.naam);
    console.log('Senior team:', senior.Team);
}

// Get all seniors in a team
const teamSeniors = await getSeniorsInTeam('IT Support');
teamSeniors.forEach(senior => {
    console.log('Senior in team:', senior.naam);
});

// Check if someone is a senior
const isSeniorUser = await isSenior('som\\jane.senior');
console.log('Is senior:', isSeniorUser);

// Set current user's senior for global use
const currentUserSeniorInfo = await getSeniorForEmployee(currentUser.LoginName);
setCurrentUserSenior(currentUserSeniorInfo);

// Later, get current user's senior from global constant
const mySenior = getCurrentUserSenior();
if (mySenior) {
    console.log('My senior is:', mySenior.naam);
}
*/

/**
 * Gets the base URL for navigation, using the SharePoint site URL configuration
 * @returns {string} The base URL for the application
 */
export function getBaseUrl() {
    let baseUrl = null;
    let source = 'unknown';
    
    // Method 1: Get the base URL from SharePoint configuration
    if (window.appConfiguratie?.instellingen?.siteUrl) {
        baseUrl = window.appConfiguratie.instellingen.siteUrl.replace(/\/$/, '');
        source = 'appConfiguratie';
    }
    
    // Method 2: Fallback to current location if configuration is not available
    if (!baseUrl) {
        const currentUrl = window.location.href;
        
        // Extract the base part up to the site collection
        // Expected pattern: https://som.org.om.local/sites/MulderT/CustomPW/Verlof/
        const baseUrlPattern = /^(https?:\/\/[^\/]+\/sites\/[^\/]+\/[^\/]+\/[^\/]+)/;
        const match = currentUrl.match(baseUrlPattern);
        
        if (match) {
            baseUrl = match[1];
            source = 'currentUrl';
        }
    }
    
    // Method 3: Last resort fallback
    if (!baseUrl) {
        baseUrl = 'https://som.org.om.local/sites/MulderT/CustomPW/Verlof';
        source = 'fallback';
    }
    
    // Ensure base URL includes the CPW/Rooster path for navigation
    if (baseUrl && !baseUrl.includes('/CPW/Rooster')) {
        baseUrl = `${baseUrl}/CPW/Rooster`;
        source = `${source}+cpwRooster`;
    }
    
    // Debug logging for org\busselw
    const currentUser = window.currentUser || {};
    const isDebugUser = currentUser.LoginName?.toLowerCase().includes('busselw') || 
                       currentUser.Email?.toLowerCase().includes('busselw');
    
    if (isDebugUser) {
        console.log('🔗 getBaseUrl() Debug Info:', {
            baseUrl,
            source,
            configSiteUrl: window.appConfiguratie?.instellingen?.siteUrl,
            currentLocation: window.location.href
        });
    }
    
    return baseUrl;
}

/**
 * Gets the full URL for the verlofRooster page
 * @returns {string} The full URL to the verlofRooster page
 */
export function getVerlofRoosterUrl() {
    const baseUrl = getBaseUrl();
    
    // The verlofRooster page is located at: baseUrl/Verlofrooster.aspx
    // (baseUrl already includes /CPW/Rooster)
    return `${baseUrl}/Verlofrooster.aspx`;
}

export default {
    getTeamForEmployee,
    getTeamLeaderForEmployee,
    getEmployeesForTeamLeader,
    isTeamLeaderFor,
    getAllTeams,
    getTeamNamesForTeamLeader,
    isTeamLeader,
    getEmployeesInTeam,
    // New senior-related functions
    getSeniorForEmployee,
    getSeniorsInTeam,
    getEmployeesForSenior,
    isSeniorFor,
    isSenior,
    getTeamNamesForSenior,
    setCurrentUserSenior,
    getCurrentUserSenior,
    invalidateCache,
    // Navigation helpers
    getBaseUrl,
    getVerlofRoosterUrl
};