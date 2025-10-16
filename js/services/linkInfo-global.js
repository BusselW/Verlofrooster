/**
 * @file linkInfo-global.js
 * @description Non-module version of linkInfo.js for use in non-module contexts.
 * Exposes functions to match employees to their team leaders through team membership.
 */

// Immediately-invoked function expression to avoid polluting the global scope
(function() {
    // Cache for teams and employees data to avoid repeated fetching
    let teamsCache = null;
    let medewerkersCache = null;
    let lastFetchTime = 0;
    const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

    /**
     * Refreshes the cache if it's expired or doesn't exist
     * @returns {Promise<{teams: Array, medewerkers: Array}>} The cached teams and employees data
     */
    async function refreshCacheIfNeeded() {
        const now = Date.now();
        
        // If cache is older than the expiry time or doesn't exist, refresh it
        if (!teamsCache || !medewerkersCache || now - lastFetchTime > CACHE_EXPIRY_MS) {
            try {
                // Check if SharePoint configuration exists before fetching
                if (!window.appConfiguratie || !window.appConfiguratie.instellingen || !window.appConfiguratie.instellingen.siteUrl) {
                    console.warn('SharePoint configuration not found. Team information will be unavailable.');
                    return { teams: [], medewerkers: [] };
                }
                
                // Fetch teams and employees data in parallel
                const [teamsData, medewerkersData] = await Promise.all([
                    window.SharePointService.fetchSharePointList('Teams'),
                    window.SharePointService.fetchSharePointList('Medewerkers')
                ]);
                
                // Filter out inactive teams
                teamsCache = teamsData.filter(team => team.Actief !== false);
                medewerkersCache = medewerkersData;
                lastFetchTime = now;
                
                console.log(`Cache refreshed with ${teamsCache.length} teams and ${medewerkersCache.length} employees`);
                
                // Debug: Log sample data structure
                if (teamsCache.length > 0) {
                    console.log('Sample team data:', teamsCache[0]);
                }
                if (medewerkersCache.length > 0) {
                    console.log('Sample employee data:', medewerkersCache[0]);
                }
            } catch (error) {
                console.error('Error refreshing team/employee cache:', error);
                // If cache already exists, keep using it despite the error
                if (!teamsCache || !medewerkersCache) {
                    // Return empty arrays instead of throwing an error
                    console.warn('Failed to initialize team/employee data cache, returning empty lists');
                    return { teams: [], medewerkers: [] };
                }
            }
        }
        
        return { teams: teamsCache, medewerkers: medewerkersCache };
    }

    /**
     * Gets the team information for a given employee
     * @param {string} employeeUsername - The username of the employee (domain\username format)
     * @returns {Promise<Object|null>} Team information or null if not found
     */
    async function getTeamForEmployee(employeeUsername) {
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
     * @returns {Promise<string|null>} Team leader display name or null if not found
     */
    async function getTeamLeaderForEmployee(employeeUsername) {
        const { teams, medewerkers } = await refreshCacheIfNeeded();
        
        if (!teams.length || !medewerkers.length) {
            console.warn('Teams or Medewerkers data not available');
            return null;
        }
        
        // Normalize the username for comparison
        const normalizedUsername = employeeUsername.toLowerCase();
        console.log(`Looking for team leader for employee: ${employeeUsername} (normalized: ${normalizedUsername})`);
        
        // Step 1: Find the employee by Username
        const employee = medewerkers.find(m => 
            m.Username && m.Username.toLowerCase() === normalizedUsername
        );
        
        if (!employee) {
            console.warn(`Employee not found: ${employeeUsername}`);
            console.log('Available usernames:', medewerkers.map(m => m.Username).filter(u => u));
            return null;
        }
        
        if (!employee.Team) {
            console.warn(`Employee has no team assigned: ${employeeUsername}`);
            return null;
        }
        
        console.log(`Found employee: ${employee.Naam || employee.Username}, Team: ${employee.Team}`);
        
        // Step 2: Find the team by matching employee's Team with Teams.Naam
        const team = teams.find(t => 
            t.Naam && t.Naam.toLowerCase() === employee.Team.toLowerCase()
        );
        
        if (!team) {
            console.warn(`Team not found: ${employee.Team}`);
            console.log('Available teams:', teams.map(t => t.Naam).filter(n => n));
            return null;
        }
        
        if (!team.TeamleiderId) {
            console.warn(`Team has no team leader assigned: ${employee.Team}`);
            return null;
        }
        
        console.log(`Found team: ${team.Naam}, TeamleiderId: ${team.TeamleiderId}`);
        
        // Step 3: Find the team leader by matching TeamleiderId with Medewerkers.Username
        const normalizedTeamLeaderId = team.TeamleiderId.toLowerCase();
        const teamLeader = medewerkers.find(m => 
            m.Username && m.Username.toLowerCase() === normalizedTeamLeaderId
        );
        
        if (!teamLeader) {
            console.warn(`Team leader not found: ${team.TeamleiderId}`);
            return null;
        }
        
        const teamLeaderName = teamLeader.Naam || teamLeader.Title || teamLeader.Username;
        console.log(`Found team leader: ${teamLeaderName}`);
        
        // Return the display name of the team leader
        return teamLeaderName;
    }

    /**
     * Gets all employees for a given team leader
     * @param {string} teamLeaderUsername - The username of the team leader (domain\username format)
     * @returns {Promise<Array>} Array of employees that have this person as their team leader
     */
    async function getEmployeesForTeamLeader(teamLeaderUsername) {
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
    async function isTeamLeaderFor(potentialLeaderUsername, employeeUsername) {
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
     * Gets all teams from the cache
     * @returns {Promise<Array>} Array of all teams
     */
    async function getAllTeams() {
        const { teams } = await refreshCacheIfNeeded();
        return teams;
    }

    /**
     * Gets the team name for a given team leader
     * @param {string} teamLeaderUsername - The username of the team leader
     * @returns {Promise<Array>} Array of team names led by this person
     */
    async function getTeamNamesForTeamLeader(teamLeaderUsername) {
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
    async function isTeamLeader(username) {
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
    async function getEmployeesInTeam(teamName) {
        const { medewerkers } = await refreshCacheIfNeeded();
        
        // Normalize the team name for comparison
        const normalizedTeamName = teamName.toLowerCase();
        
        // Find all employees in this team
        return medewerkers.filter(m => 
            m.Team && m.Team.toLowerCase() === normalizedTeamName
        );
    }

    /**
     * Invalidates the cache, forcing a refresh on the next data request
     */
    function invalidateCache() {
        teamsCache = null;
        medewerkersCache = null;
        lastFetchTime = 0;
    }

    /**
     * Gets the base URL for navigation, using the SharePoint site URL configuration
     * @returns {string} The base URL for the application
     */
    function getBaseUrl() {
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
    function getVerlofRoosterUrl() {
        const baseUrl = getBaseUrl();
        
        // The verlofRooster page is located at: baseUrl/CPW/Rooster/Verlofrooster.aspx
        return `${baseUrl}/CPW/Rooster/Verlofrooster.aspx`;
    }

    /**
     * Fetches a SharePoint list using the app configuration
     * @param {string} lijstNaam - The name of the list as defined in appConfiguratie
     * @returns {Promise<Array>} A Promise with the list items or an empty array on error
     */
    async function fetchSharePointList(lijstNaam) {
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

    // Expose the functions to the global scope through the LinkInfo object
    window.LinkInfo = {
        getTeamForEmployee,
        getTeamLeaderForEmployee,
        getEmployeesForTeamLeader,
        isTeamLeaderFor,
        getAllTeams,
        getTeamNamesForTeamLeader,
        isTeamLeader,
        getEmployeesInTeam,
        invalidateCache,
        getBaseUrl,
        getVerlofRoosterUrl
    };
    
    // Create alias for linkInfo (lowercase)
    window.linkInfo = window.LinkInfo;

    // Initialize LinkInfo object if the module failed to do so
    if (!window.LinkInfo) {
        console.warn('LinkInfo not initialized, creating fallback object');
        window.LinkInfo = {
            getTeamForEmployee: async () => null,
            getTeamLeaderForEmployee: async () => null,
            getEmployeesForTeamLeader: async () => [],
            isTeamLeaderFor: async () => false,
            getAllTeams: async () => [],
            getTeamNamesForTeamLeader: async () => [],
            isTeamLeader: async () => false,
            getEmployeesInTeam: async () => [],
            invalidateCache: () => {},
            getBaseUrl: () => 'https://som.org.om.local/sites/MulderT/CustomPW/Verlof',
            getVerlofRoosterUrl: () => 'https://som.org.om.local/sites/MulderT/CustomPW/Verlof/CPW/Rooster/Verlofrooster.aspx'
        };
    }
})();