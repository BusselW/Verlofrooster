/**
 * @file profielkaarten.js
 * @description Component for displaying employee profile cards on hover
 * This file provides functionality to show detailed information about an employee
 * when hovering over their name or avatar in the schedule view.
 */

import { fetchSharePointList } from '../services/sharepointService.js';
import { getUserInfo } from '../services/sharepointService.js';
import * as linkInfo from '../services/linkInfo.js';

const fallbackAvatar = 'https://placehold.co/96x96/4a90e2/ffffff?text=';

const HOVER_DELAY_MS = 300; // Reduced from 500ms to make cards appear faster
const HOVER_HIDE_DELAY_MS = 500; // Increased from 300ms to 500ms to give more time

const ProfielKaarten = (() => {
    const h = React.createElement;
    let activeCard = null;
    let cardTimeout = null;

    /**
     * Fetch employee data by username
     * @param {string} username - The employee's username
     * @returns {Promise<Object>} - Employee data
     */
    const fetchMedewerkerData = async (username) => {
        try {
            console.log(`fetchMedewerkerData: Fetching data for username "${username}"`);
            
            // Check if fetchSharePointList is available
            if (typeof fetchSharePointList !== 'function') {
                console.error('fetchMedewerkerData: fetchSharePointList function not available');
                return null;
            }
            
            // Use the imported fetchSharePointList function
            const medewerkers = await fetchSharePointList('Medewerkers');
            
            if (!medewerkers || !Array.isArray(medewerkers)) {
                console.error('fetchMedewerkerData: Invalid response from fetchSharePointList');
                return null;
            }
            
            console.log(`fetchMedewerkerData: Received ${medewerkers.length} medewerkers`);
            
            // First try exact match
            let medewerker = medewerkers.find(m => m.Username === username);
            
            // If not found, try different username formats
            if (!medewerker) {
                console.log(`fetchMedewerkerData: Exact match failed, trying alternative formats for "${username}"`);
                
                // Normalize username - try both formats
                let alternativeUsername = null;
                
                if (username.includes('\\')) {
                    // If it has domain\username format, also try without domain
                    alternativeUsername = username.split('\\')[1];
                    console.log(`fetchMedewerkerData: Trying without domain: "${alternativeUsername}"`);
                    medewerker = medewerkers.find(m => 
                        m.Username === alternativeUsername ||
                        (m.Username && m.Username.toLowerCase() === alternativeUsername.toLowerCase())
                    );
                } else {
                    // If it doesn't have domain, also try with som\ prefix
                    alternativeUsername = `som\\${username}`;
                    console.log(`fetchMedewerkerData: Trying with domain: "${alternativeUsername}"`);
                    medewerker = medewerkers.find(m => 
                        m.Username === alternativeUsername ||
                        (m.Username && m.Username.toLowerCase() === alternativeUsername.toLowerCase())
                    );
                }
                
                // Also try case-insensitive matching
                if (!medewerker) {
                    console.log(`fetchMedewerkerData: Trying case-insensitive match for "${username}"`);
                    medewerker = medewerkers.find(m => 
                        m.Username && m.Username.toLowerCase() === username.toLowerCase()
                    );
                }
            }
            
            if (medewerker) {
                console.log('fetchMedewerkerData: Found matching medewerker:', {
                    ID: medewerker.ID,
                    Username: medewerker.Username,
                    Naam: medewerker.Naam || medewerker.Title,
                    Functie: medewerker.Functie,
                    Email: medewerker.E_x002d_mail,
                    Horen: medewerker.Horen
                });
                return medewerker;
            }
            
            console.warn(`fetchMedewerkerData: No medewerker found with username "${username}"`);
            console.log('fetchMedewerkerData: Available usernames sample:', 
                medewerkers.slice(0, 5).map(m => m.Username).filter(u => u)
            );
            return null;
        } catch (error) {
            console.error('Error fetching employee data:', error);
            return null;
        }
    };

    /**
     * Fetch working hours data for an employee
     * @param {string} medewerkerID - The employee's ID or username
     * @returns {Promise<Object>} - Working hours data
     */
    const fetchWerkroosterData = async (medewerkerID) => {
        try {
            console.log(`fetchWerkroosterData: Fetching data for medewerker "${medewerkerID}"`);
            
            // Check if fetchSharePointList is available
            if (typeof fetchSharePointList !== 'function') {
                console.error('fetchWerkroosterData: fetchSharePointList function not available');
                return null;
            }
            
            // Use the imported fetchSharePointList function
            const urenItems = await fetchSharePointList('UrenPerWeek');
            
            if (!urenItems || !Array.isArray(urenItems)) {
                console.error('fetchWerkroosterData: Invalid response from fetchSharePointList');
                return null;
            }
            
            console.log(`fetchWerkroosterData: Received ${urenItems.length} UrenPerWeek records`);
            
            // Debug: Show sample data structure and what we're looking for
            if (urenItems.length > 0) {
                console.log('fetchWerkroosterData: Sample UrenPerWeek record:', urenItems[0]);
                console.log('fetchWerkroosterData: Available MedewerkerID values:', 
                    urenItems.map(item => item.MedewerkerID).filter(id => id).slice(0, 5)
                );
            }
            console.log(`fetchWerkroosterData: Looking for medewerkerID: "${medewerkerID}"`);
            
            // Check only MedewerkerID field (UrenPerWeek doesn't have Username field)
            const filteredItems = urenItems.filter(item => 
                item.MedewerkerID === medewerkerID
            );
            
            console.log(`fetchWerkroosterData: Found ${filteredItems.length} matching records`);
            
            if (filteredItems.length === 0) {
                console.log('fetchWerkroosterData: No exact match found, trying alternatives...');
                
                // Try different username formats
                let altItems = [];
                const lowercaseID = medewerkerID.toLowerCase();
                
                // 1. Case-insensitive match
                altItems = urenItems.filter(item => 
                    (item.MedewerkerID && item.MedewerkerID.toLowerCase() === lowercaseID)
                );
                
                console.log(`fetchWerkroosterData: Found ${altItems.length} case-insensitive matches`);
                
                // 2. If no match and input has domain, try without domain
                if (altItems.length === 0 && medewerkerID.includes('\\')) {
                    const usernameWithoutDomain = medewerkerID.split('\\')[1];
                    console.log(`fetchWerkroosterData: Trying without domain: "${usernameWithoutDomain}"`);
                    altItems = urenItems.filter(item => 
                        item.MedewerkerID === usernameWithoutDomain ||
                        (item.MedewerkerID && item.MedewerkerID.toLowerCase() === usernameWithoutDomain.toLowerCase())
                    );
                    console.log(`fetchWerkroosterData: Found ${altItems.length} matches without domain`);
                }
                
                // 3. If no match and input doesn't have domain, try with som\ domain
                if (altItems.length === 0 && !medewerkerID.includes('\\')) {
                    const usernameWithDomain = `som\\${medewerkerID}`;
                    console.log(`fetchWerkroosterData: Trying with domain: "${usernameWithDomain}"`);
                    altItems = urenItems.filter(item => 
                        item.MedewerkerID === usernameWithDomain ||
                        (item.MedewerkerID && item.MedewerkerID.toLowerCase() === usernameWithDomain.toLowerCase())
                    );
                    console.log(`fetchWerkroosterData: Found ${altItems.length} matches with domain`);
                }
                
                if (altItems.length > 0) {
                    // Sort by Ingangsdatum desc
                    altItems.sort((a, b) => new Date(b.Ingangsdatum) - new Date(a.Ingangsdatum));
                    console.log('fetchWerkroosterData: Using case-insensitive match:', altItems[0]);
                    return altItems[0];
                }
                
                // Create a default work schedule if no data found
                console.log('fetchWerkroosterData: No UrenPerWeek data found, creating default schedule');
                return {
                    MedewerkerID: medewerkerID,
                    MaandagStart: '08:30',
                    MaandagEind: '17:00',
                    MaandagTotaal: '8.5',
                    MaandagSoort: 'Normaal',
                    DinsdagStart: '08:30',
                    DinsdagEind: '17:00',
                    DinsdagTotaal: '8.5',
                    DinsdagSoort: 'Normaal',
                    WoensdagStart: '08:30',
                    WoensdagEind: '17:00',
                    WoensdagTotaal: '8.5',
                    WoensdagSoort: 'Normaal',
                    DonderdagStart: '08:30',
                    DonderdagEind: '17:00',
                    DonderdagTotaal: '8.5',
                    DonderdagSoort: 'Normaal',
                    VrijdagStart: '08:30',
                    VrijdagEind: '17:00',
                    VrijdagTotaal: '8.5',
                    VrijdagSoort: 'Normaal'
                };
            }
            
            // Sort by Ingangsdatum desc
            filteredItems.sort((a, b) => new Date(b.Ingangsdatum) - new Date(a.Ingangsdatum));
            console.log('fetchWerkroosterData: Using record:', filteredItems[0]);
            return filteredItems[0];
        } catch (error) {
            console.error('Error fetching werkrooster data:', error);
            return null;
        }
    };

    /**
     * Fetch team leader data by username
     * @param {string} username - The employee's username
     * @returns {Promise<Object|null>} - Team leader data or null if not found
     */
    const fetchTeamLeaderData = async (username) => {
        try {
            console.log(`fetchTeamLeaderData: Fetching team leader for username "${username}"`);
            
            // Normalize username - try both formats (same logic as fetchSeniorData)
            let normalizedUsername = username;
            let alternativeUsername = null;
            
            if (username.includes('\\')) {
                // If it has domain\username format, also try without domain
                alternativeUsername = username.split('\\')[1];
                console.log(`fetchTeamLeaderData: Also trying alternative username "${alternativeUsername}"`);
            } else {
                // If it doesn't have domain, also try with som\ prefix
                alternativeUsername = `som\\${username}`;
                console.log(`fetchTeamLeaderData: Also trying alternative username "${alternativeUsername}"`);
            }
            
            // Try original username first
            console.log(`fetchTeamLeaderData: Trying original username "${normalizedUsername}"`);
            let teamLeader = await linkInfo.getTeamLeaderForEmployee(normalizedUsername);
            
            // If not found, try alternative format
            if (!teamLeader && alternativeUsername) {
                console.log(`fetchTeamLeaderData: Original username failed, trying alternative "${alternativeUsername}"`);
                teamLeader = await linkInfo.getTeamLeaderForEmployee(alternativeUsername);
            }
            
            if (teamLeader) {
                console.log('fetchTeamLeaderData: Found team leader:', {
                    Username: teamLeader.Username,
                    Naam: teamLeader.Title || teamLeader.Naam,
                    Functie: teamLeader.Functie
                });
                return teamLeader;
            }
            
            console.log(`fetchTeamLeaderData: No team leader found for "${username}" (tried "${normalizedUsername}" and "${alternativeUsername || 'none'}")`);
            return null;
        } catch (error) {
            console.error('Error fetching team leader data:', error);
            return null;
        }
    };

    /**
     * Fetch all senior data by username
     * @param {string} username - The employee's username
     * @returns {Promise<Array>} - Array of senior data or empty array if none found
     */
    const fetchAllSeniorData = async (username) => {
        try {
            console.log(`fetchAllSeniorData: Fetching all seniors for username "${username}"`);
            
            // Normalize username - try both formats
            let normalizedUsername = username;
            let alternativeUsername = null;
            
            if (username.includes('\\')) {
                // If it has domain\username format, also try without domain
                alternativeUsername = username.split('\\')[1];
                console.log(`fetchAllSeniorData: Also trying alternative username "${alternativeUsername}"`);
            } else {
                // If it doesn't have domain, also try with som\ prefix
                alternativeUsername = `som\\${username}`;
                console.log(`fetchAllSeniorData: Also trying alternative username "${alternativeUsername}"`);
            }
            
            // First get the employee to find their team
            const medewerkers = await fetchSharePointList('Medewerkers');
            if (!medewerkers) {
                console.error('fetchAllSeniorData: Could not fetch medewerkers list');
                return [];
            }
            
            // Find the employee
            let employee = medewerkers.find(m => m.Username === normalizedUsername);
            if (!employee && alternativeUsername) {
                employee = medewerkers.find(m => m.Username === alternativeUsername);
            }
            
            if (!employee || !employee.Team) {
                console.log(`fetchAllSeniorData: Employee not found or no team for "${username}"`);
                return [];
            }
            
            console.log(`fetchAllSeniorData: Found employee in team "${employee.Team}"`);
            
            // Get all seniors in the employee's team
            const allSeniors = await linkInfo.getSeniorsInTeam(employee.Team);
            console.log(`fetchAllSeniorData: Found ${allSeniors.length} seniors in team "${employee.Team}"`);
            
            return allSeniors || [];
        } catch (error) {
            console.error('Error fetching all senior data:', error);
            return [];
        }
    };

    /**
     * Get profile photo URL using the same logic as userinfo.js
     * @param {string} username - The employee's username
     * @param {Object} medewerker - The employee data object
     * @returns {Promise<string>} - URL to the profile photo
     */
    const getProfilePhotoUrl = async (username, medewerker) => {
        if (!username) return null;
        
        try {
            console.log(`getProfilePhotoUrl: Fetching photo for username "${username}"`);
            
            // Use the imported getUserInfo function to get SharePoint user data
            const userData = await getUserInfo(username);
            console.log('getProfilePhotoUrl: User data fetched:', userData);
            
            if (userData && userData.PictureURL) {
                console.log('getProfilePhotoUrl: Using PictureURL from SharePoint:', userData.PictureURL);
                return userData.PictureURL;
            }
            
            // Fallback to initials if no picture URL is available
            console.log('getProfilePhotoUrl: No PictureURL found, using initials');
            const match = medewerker && medewerker.Naam ? String(medewerker.Naam).match(/\b\w/g) : null;
            const initials = match ? match.join('') : '?';
            return `${fallbackAvatar}${initials}`;
        } catch (error) {
            console.error('Error getting profile photo URL:', error);
            
            // Fallback to initials on error
            const match = medewerker && medewerker.Naam ? String(medewerker.Naam).match(/\b\w/g) : null;
            const initials = match ? match.join('') : '?';
            return `${fallbackAvatar}${initials}`;
        }
    };

    /**
     * Get special background icon for specific users
     * @param {string} username - The employee's username
     * @returns {string|null} - Path to background icon or null if not applicable
     */
    const getSpecialBackgroundIcon = (username) => {
        if (!username) return null;
        
        // Extract username part from domain\username format (if applicable)
        let normalizedUsername;
        if (username.includes('\\')) {
            normalizedUsername = username.split('\\')[1].toLowerCase();
        } else if (username.includes('@')) {
            normalizedUsername = username.split('@')[0].toLowerCase();
        } else {
            normalizedUsername = username.toLowerCase();
        }
            
        console.log(`Checking for special background for normalized username: "${normalizedUsername}"`);
        
        // Support both "org\busselw" and just "busselw" formats
        // Map of usernames to special icons
        const specialUsers = {
            'busselw': 'roboy.svg',
            'schaikh': 'Hitteschild.svg',
            'tuiln': 'Queen.svg',
            'wittem1': 'Thankyou.svg',
            'nijburgc': 'yeehaw.svg',
            'schieved': 'Queen.svg',
            'biermanl': 'Thankyou.svg'
            // Add more special users here as needed
            // 'username': 'iconname.svg',
        };
        
        // Check if this user should have a special background
        const iconName = specialUsers[normalizedUsername];
        if (!iconName) {
            console.log(`No special background defined for "${normalizedUsername}"`);
            return null;
        }
        
        // Get base URL for icons
        let siteUrl;
        if (window.appConfiguratie && window.appConfiguratie.instellingen && window.appConfiguratie.instellingen.siteUrl) {
            siteUrl = window.appConfiguratie.instellingen.siteUrl;
        } else {
            siteUrl = 'https://som.org.om.local/sites/MulderT/CustomPW/Verlof';
        }
        
        // Remove trailing slash if present to prevent double slashes
        siteUrl = siteUrl.replace(/\/$/, '');
        
        // Use absolute fallback if needed
        const iconUrl = siteUrl ? 
            `${siteUrl}/cpw/Rooster/icons/profilecards/${iconName}` : 
            `https://som.org.om.local/sites/MulderT/CustomPW/Verlof/cpw/Rooster/icons/profilecards/${iconName}`;
            
        console.log(`Special background icon found for "${normalizedUsername}": "${iconUrl}"`);
        return iconUrl;
    };

    /**
     * Format time for display
     * @param {string} time - Time in HH:MM format
     * @returns {string} - Formatted time
     */
    const formatTime = (time) => {
        if (!time) return '-';
        return time;
    };

    /**
     * Get day type display text
     * @param {string} type - Day type code
     * @returns {string} - Human-readable day type
     */
    const getDayTypeDisplay = (type) => {
        switch (type) {
            case 'VVD': return 'Vrij';
            case 'VVO': return 'Ochtend vrij';
            case 'VVM': return 'Middag vrij';
            case 'Normaal': return 'Werkdag';
            default: return type || '-';
        }
    };

    /**
     * Get CSS class for day type
     * @param {string} type - Day type code
     * @returns {string} - CSS class name
     */
    const getDayTypeClass = (type) => {
        switch (type) {
            case 'VVD': return 'day-type-vvd';
            case 'VVO': return 'day-type-vvo';
            case 'VVM': return 'day-type-vvm';
            case 'Normaal': return 'day-type-normaal';
            default: return '';
        }
    };

    /**
     * Create the profile card component
     * @param {Object} medewerker - Employee data
     * @param {Object} werkrooster - Working hours data
     * @param {Object} teamLeader - Team leader data
     * @param {Array} allSeniors - Array of all senior data
     * @returns {HTMLElement} - The card element
     */
    const createProfileCard = (medewerker, werkrooster, teamLeader, allSeniors) => {
        if (!medewerker) return null;
        
        // Get base URL for icons
        let siteUrl;
        if (window.appConfiguratie && window.appConfiguratie.instellingen && window.appConfiguratie.instellingen.siteUrl) {
            siteUrl = window.appConfiguratie.instellingen.siteUrl;
            console.log('Using siteUrl from appConfiguratie:', siteUrl);
        } else {
            siteUrl = 'https://som.org.om.local/sites/MulderT/CustomPW/Verlof';
            console.log('Using hardcoded siteUrl:', siteUrl);
        }
        
        // Remove trailing slash if present to prevent double slashes
        siteUrl = siteUrl.replace(/\/$/, '');
        const iconBasePath = `${siteUrl}/cpw/Rooster/icons/profilecards`;
        console.log('Icon base path:', iconBasePath);

        // Use initials as placeholder until the photo is loaded
        const match = medewerker.Naam ? String(medewerker.Naam).match(/\b\w/g) : null;
        const initials = match ? match.join('') : '?';
        const initialPhotoUrl = `${fallbackAvatar}${initials}`;

        // Check if this user should have a special background
        const specialBackground = getSpecialBackgroundIcon(medewerker.Username);
        console.log(`Special background for ${medewerker.Username}: ${specialBackground || 'none'}`);
        const headerStyle = specialBackground ? {
            position: 'relative',
            overflow: 'hidden'
        } : {};

        return h('div', { className: 'profile-card' },
            h('div', { 
                className: 'profile-card-header',
                style: headerStyle
            },
                // Add special background if applicable
                specialBackground && h('div', {
                    style: {
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        width: '100%',
                        height: '100%',
                        backgroundImage: `url(${specialBackground})`,
                        backgroundSize: 'contain', // Changed from 'cover' to 'contain'
                        backgroundPosition: 'center center',
                        backgroundRepeat: 'no-repeat',
                        opacity: '0.3',
                        zIndex: '0',
                        transform: 'scale(1.5)', // Increased from 1.2 to 1.5 for better centering
                        pointerEvents: 'none'
                    },
                    ref: (div) => {
                        if (div) {
                            // Create an image element to check if the background loads properly
                            const img = new Image();
                            img.onerror = () => {
                                console.error(`Failed to load special background image: ${specialBackground}`);
                                // If image fails to load, hide the background div
                                if (div) div.style.display = 'none';
                            };
                            img.src = specialBackground;
                        }
                    }
                }),
                h('div', { 
                    className: 'profile-card-avatar',
                    style: specialBackground ? { position: 'relative', zIndex: '1' } : {}
                },
                    h('img', {
                        src: initialPhotoUrl, // Start with initials placeholder
                        alt: medewerker.Title || medewerker.Naam,
                        ref: async (img) => {
                            if (img) {
                                // Load the real photo asynchronously
                                try {
                                    const photoUrl = await getProfilePhotoUrl(medewerker.Username, medewerker);
                                    if (photoUrl && img.src !== photoUrl) {
                                        img.src = photoUrl;
                                    }
                                } catch (error) {
                                    console.error('Failed to load profile photo:', error);
                                    img.src = `${iconBasePath}/roboy.svg`;
                                }
                            }
                        },
                        onError: (e) => {
                            console.warn('Failed to load profile photo, using fallback');
                            e.target.src = `${iconBasePath}/roboy.svg`;
                        }
                    })
                ),
                h('div', { 
                    className: 'profile-card-info',
                    style: specialBackground ? { position: 'relative', zIndex: '1' } : {}
                },
                    h('div', { className: 'profile-card-name' }, medewerker.Naam || medewerker.Title || 'Onbekend'),
                    // Check if this person is a senior or team leader themselves
                    (() => {
                        const isSenior = allSeniors && allSeniors.some(senior => 
                            (senior.seniorInfo?.Username === medewerker.Username) ||
                            (senior.seniorInfo?.Naam === medewerker.Naam) ||
                            (senior.seniorInfo?.Title === medewerker.Naam)
                        );
                        const isTeamLeader = teamLeader && (
                            (teamLeader.Username === medewerker.Username) ||
                            (teamLeader.Naam === medewerker.Naam) ||
                            (teamLeader.Title === medewerker.Naam)
                        );
                        
                        // Style the function based on their role
                        let functionStyle = {};
                        if (isSenior) {
                            functionStyle = {
                                backgroundColor: '#ff8c00',
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                display: 'inline-block'
                            };
                        } else if (isTeamLeader) {
                            functionStyle = {
                                backgroundColor: '#007bff',
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                display: 'inline-block'
                            };
                        }
                        
                        return h('div', { 
                            className: 'profile-card-function',
                            style: Object.keys(functionStyle).length > 0 ? functionStyle : {}
                        }, medewerker.Functie || '-');
                    })(),
                    // Only show team leader if this person is NOT the team leader themselves
                    teamLeader && !(
                        (teamLeader.Username === medewerker.Username) ||
                        (teamLeader.Naam === medewerker.Naam) ||
                        (teamLeader.Title === medewerker.Naam)
                    ) && h('div', { 
                        className: 'profile-card-team-leader',
                        style: { 
                            fontSize: '0.85rem', 
                            color: '#333',
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }
                    }, 
                        h('span', { 
                            style: { 
                                fontSize: '0.8rem',
                                backgroundColor: '#ff8c00',
                                color: 'white',
                                padding: '1px 4px',
                                borderRadius: '3px',
                                fontWeight: 'bold'
                            }
                        }, 'TL'),
                        `${teamLeader.Title || teamLeader.Naam || teamLeader.Username}`
                    ),
                    // Show all seniors (excluding the person themselves if they are a senior)
                    allSeniors && allSeniors.length > 0 && (() => {
                        // Filter out seniors who are the same person as the current medewerker
                        const otherSeniors = allSeniors.filter(senior => !(
                            (senior.seniorInfo?.Username === medewerker.Username) ||
                            (senior.seniorInfo?.Naam === medewerker.Naam) ||
                            (senior.seniorInfo?.Title === medewerker.Naam)
                        ));
                        
                        if (otherSeniors.length === 0) return null;
                        
                        return h('div', { 
                            className: 'profile-card-seniors',
                            style: { 
                                fontSize: '0.85rem', 
                                color: '#333',
                                marginTop: '4px'
                            }
                        }, 
                            h('div', {
                                style: {
                                    fontWeight: 'bold',
                                    marginBottom: '2px',
                                    fontSize: '0.8rem',
                                    color: '#666'
                                }
                            }, otherSeniors.length === 1 ? 'Senior:' : 'Senioren:'),
                            ...otherSeniors.map((senior, index) => 
                                h('div', {
                                    key: `senior-${index}`,
                                    style: {
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        marginBottom: index < otherSeniors.length - 1 ? '2px' : '0'
                                    }
                                },
                                    h('span', { 
                                        style: { 
                                            fontSize: '0.75rem',
                                            backgroundColor: '#ff8c00',
                                            color: 'white',
                                            padding: '1px 4px',
                                            borderRadius: '3px',
                                            fontWeight: 'bold',
                                            minWidth: '20px',
                                            textAlign: 'center'
                                        }
                                    }, 'SR'),
                                    h('span', {
                                        style: { flex: 1 }
                                    }, senior.naam || senior.seniorInfo?.Naam || 'Onbekende senior')
                                )
                            )
                        );
                    })(),
                    h('div', { className: 'profile-card-email' }, 
                        h('a', { 
                            href: `mailto:${medewerker.E_x002d_mail || ''}`,
                            title: medewerker.E_x002d_mail || 'Geen e-mail beschikbaar'
                        }, medewerker.E_x002d_mail || '-')
                    ),
                    h('div', { className: 'profile-card-hearing' },
                        'Horen: ',
                        h('img', {
                            className: 'profile-card-hearing-icon',
                            src: medewerker.Horen 
                                ? (iconBasePath && iconBasePath !== 'undefined' 
                                    ? `${iconBasePath}/horen-ja.svg` 
                                    : 'https://som.org.om.local/sites/MulderT/customPW/Verlof/cpw/Rooster/icons/profilecards/horen-ja.svg')
                                : (iconBasePath && iconBasePath !== 'undefined'
                                    ? `${iconBasePath}/horen-nee.svg`
                                    : 'https://som.org.om.local/sites/MulderT/customPW/Verlof/cpw/Rooster/icons/profilecards/horen-nee.svg'),
                            alt: medewerker.Horen ? 'Ja' : 'Nee',
                            title: medewerker.Horen ? 'Ja' : 'Nee',
                            onError: (e) => {
                                console.warn('Failed to load hearing icon, showing text instead');
                                e.target.parentNode.innerHTML = `Horen: ${medewerker.Horen ? 'Ja' : 'Nee'}`;
                            }
                        })
                    )
                )
            ),
            werkrooster && h('div', { className: 'profile-card-hours' },
                h('h3', { className: 'profile-card-hours-title' }, 'Werkrooster'),
                h('div', { className: 'profile-card-hours-grid' },
                    h('div', { className: 'day-header' },
                        h('span', null, 'Dag'),
                        h('span', null, 'Tijd'),
                        h('span', null, 'Uren'),
                        h('span', null, 'Type')
                    ),
                    h('div', { className: 'day-row' },
                        h('div', { className: 'day-name' }, 'Ma'),
                        h('div', { className: 'day-time' }, werkrooster.MaandagStart && werkrooster.MaandagEind ? 
                            `${formatTime(werkrooster.MaandagStart)} - ${formatTime(werkrooster.MaandagEind)}` : '-'),
                        h('div', { className: 'day-hours' }, werkrooster.MaandagTotaal || '-'),
                        h('div', { className: 'day-type' }, 
                            h('span', { className: `day-type-chip ${getDayTypeClass(werkrooster.MaandagSoort)}` }, 
                                getDayTypeDisplay(werkrooster.MaandagSoort))
                        )
                    ),
                    h('div', { className: 'day-row' },
                        h('div', { className: 'day-name' }, 'Di'),
                        h('div', { className: 'day-time' }, werkrooster.DinsdagStart && werkrooster.DinsdagEind ? 
                            `${formatTime(werkrooster.DinsdagStart)} - ${formatTime(werkrooster.DinsdagEind)}` : '-'),
                        h('div', { className: 'day-hours' }, werkrooster.DinsdagTotaal || '-'),
                        h('div', { className: 'day-type' }, 
                            h('span', { className: `day-type-chip ${getDayTypeClass(werkrooster.DinsdagSoort)}` }, 
                                getDayTypeDisplay(werkrooster.DinsdagSoort))
                        )
                    ),
                    h('div', { className: 'day-row' },
                        h('div', { className: 'day-name' }, 'Wo'),
                        h('div', { className: 'day-time' }, werkrooster.WoensdagStart && werkrooster.WoensdagEind ? 
                            `${formatTime(werkrooster.WoensdagStart)} - ${formatTime(werkrooster.WoensdagEind)}` : '-'),
                        h('div', { className: 'day-hours' }, werkrooster.WoensdagTotaal || '-'),
                        h('div', { className: 'day-type' }, 
                            h('span', { className: `day-type-chip ${getDayTypeClass(werkrooster.WoensdagSoort)}` }, 
                                getDayTypeDisplay(werkrooster.WoensdagSoort))
                        )
                    ),
                    h('div', { className: 'day-row' },
                        h('div', { className: 'day-name' }, 'Do'),
                        h('div', { className: 'day-time' }, werkrooster.DonderdagStart && werkrooster.DonderdagEind ? 
                            `${formatTime(werkrooster.DonderdagStart)} - ${formatTime(werkrooster.DonderdagEind)}` : '-'),
                        h('div', { className: 'day-hours' }, werkrooster.DonderdagTotaal || '-'),
                        h('div', { className: 'day-type' }, 
                            h('span', { className: `day-type-chip ${getDayTypeClass(werkrooster.DonderdagSoort)}` }, 
                                getDayTypeDisplay(werkrooster.DonderdagSoort))
                        )
                    ),
                    h('div', { className: 'day-row' },
                        h('div', { className: 'day-name' }, 'Vr'),
                        h('div', { className: 'day-time' }, werkrooster.VrijdagStart && werkrooster.VrijdagEind ? 
                            `${formatTime(werkrooster.VrijdagStart)} - ${formatTime(werkrooster.VrijdagEind)}` : '-'),
                        h('div', { className: 'day-hours' }, werkrooster.VrijdagTotaal || '-'),
                        h('div', { className: 'day-type' }, 
                            h('span', { className: `day-type-chip ${getDayTypeClass(werkrooster.VrijdagSoort)}` }, 
                                getDayTypeDisplay(werkrooster.VrijdagSoort))
                        )
                    )
                )
            )
        );
    };

    /**
     * Show profile card on hover
     * @param {Event} event - The mouse event
     * @param {string} username - The employee's username
     * @param {HTMLElement} targetElement - The element that triggered the hover
     */
    const showProfileCard = async (event, username, targetElement) => {
        console.log(`ProfielKaarten: Showing card for username "${username}"`);
        
        if (cardTimeout) {
            clearTimeout(cardTimeout);
            cardTimeout = null;
        }
        
        // Remove any existing card
        hideProfileCard();
        
        // If the targetElement is not provided or no longer in DOM, use the event target
        const element = targetElement || event.currentTarget;
        if (!element || !document.body.contains(element)) {
            console.warn(`ProfielKaarten: Target element is no longer in the DOM for "${username}"`);
            return;
        }
        
        // Fetch data
        console.log(`ProfielKaarten: Fetching medewerker data for "${username}"`);
        const medewerkerData = await fetchMedewerkerData(username);
        if (!medewerkerData) {
            console.warn(`ProfielKaarten: No medewerker data found for "${username}"`);
            return;
        }
        
        // Check again if element is still in DOM after async operation
        if (!document.body.contains(element)) {
            console.warn(`ProfielKaarten: Target element was removed during data fetch for "${username}"`);
            return;
        }
        
        console.log(`ProfielKaarten: Fetching werkrooster data for "${medewerkerData.Username}"`);
        const werkroosterData = await fetchWerkroosterData(medewerkerData.Username);
        
        console.log(`ProfielKaarten: Fetching team leader data for "${medewerkerData.Username}"`);
        const teamLeaderData = await fetchTeamLeaderData(medewerkerData.Username);
        
        console.log(`ProfielKaarten: Fetching senior data for "${medewerkerData.Username}"`);
        const seniorData = await fetchAllSeniorData(medewerkerData.Username);
        
        console.log('ProfielKaarten: Data fetched:', { 
            medewerker: medewerkerData, 
            werkrooster: werkroosterData, 
            teamLeader: teamLeaderData,
            allSeniors: seniorData
        });
        
        // Create card element
        const cardElement = createProfileCard(medewerkerData, werkroosterData, teamLeaderData, seniorData);
        if (!cardElement) {
            console.warn(`ProfielKaarten: Failed to create card for "${username}"`);
            return;
        }
        
        // Check again if element is still in DOM
        if (!document.body.contains(element)) {
            console.warn(`ProfielKaarten: Target element was removed during render for "${username}"`);
            return;
        }
        
        // Get position
        const rect = element.getBoundingClientRect();
        const cardContainer = document.createElement('div');
        cardContainer.id = 'profile-card-container';
        cardContainer.style.position = 'fixed'; // Use fixed positioning instead of absolute
        cardContainer.style.zIndex = '9999';
        
        // Position the card
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Render the card to get its dimensions
        document.body.appendChild(cardContainer);
        const root = ReactDOM.createRoot(cardContainer);
        cardContainer.reactRoot = root;
        root.render(cardElement);
        
        const cardRect = cardContainer.getBoundingClientRect();
        
        // Adjust position to ensure the card is fully visible
        let top = rect.bottom + 5;
        let left = rect.left;
        
        // If card would extend below viewport, position it above the element
        if (top + cardRect.height > viewportHeight) {
            top = rect.top - cardRect.height - 5;
        }
        
        // If card would extend beyond right edge, align right edge with viewport
        if (left + cardRect.width > viewportWidth) {
            left = viewportWidth - cardRect.width - 10;
        }
        
        cardContainer.style.top = `${top}px`;
        cardContainer.style.left = `${left}px`;
        
        console.log(`ProfielKaarten: Card positioned at top:${top}px, left:${left}px`);
        
        // Add mouse events to the card itself
        cardContainer.addEventListener('mouseenter', () => {
            if (cardTimeout) {
                clearTimeout(cardTimeout);
                cardTimeout = null;
            }
        });
        
        cardContainer.addEventListener('mouseleave', () => {
            if (cardTimeout) {
                clearTimeout(cardTimeout);
            }
            cardTimeout = setTimeout(() => {
                hideProfileCard();
                cardTimeout = null;
            }, HOVER_HIDE_DELAY_MS);
        });
        
        activeCard = cardContainer;
    };

    /**
     * Hide the active profile card
     */
    const hideProfileCard = () => {
        console.log(`🔒 HIDE PROFILE CARD: Starting hide process`, {
            activeCardExists: !!activeCard,
            cardTimeoutExists: !!cardTimeout
        });
        
        if (activeCard) {
            console.log(`🔒 HIDE PROFILE CARD: Active card found, proceeding with cleanup`);
            try {
                // Safely unmount React component using createRoot
                if (activeCard.reactRoot) {
                    console.log(`🔒 HIDE PROFILE CARD: Unmounting React root`);
                    activeCard.reactRoot.unmount();
                    activeCard.reactRoot = null;
                }
                
                // Remove the element if it's still in the DOM
                if (document.body.contains(activeCard)) {
                    console.log(`🔒 HIDE PROFILE CARD: Removing card from DOM`);
                    activeCard.remove();
                } else {
                    console.log(`🔒 HIDE PROFILE CARD: Card already removed from DOM`);
                }
            } catch (error) {
                console.error('🔒 HIDE PROFILE CARD: Error while hiding profile card:', error);
            }
            
            activeCard = null;
            console.log(`🔒 HIDE PROFILE CARD: Cleanup complete, activeCard set to null`);
        } else {
            console.log(`🔒 HIDE PROFILE CARD: No active card to hide`);
        }
        
        // Clear any pending timeouts
        if (cardTimeout) {
            console.log(`🔒 HIDE PROFILE CARD: Clearing cardTimeout`);
            clearTimeout(cardTimeout);
            cardTimeout = null;
        }
    };

    /**
     * Apply profile card hover behavior to elements
     * @param {string} selector - CSS selector for elements to apply hover behavior to
     * Default targets only employee name column and profile info, excluding calendar cells
     */
    const init = (selector = '.medewerker-kolom[data-username], .medewerker-info [data-username]') => {
        console.log(`🔧 ProfielKaarten: Initializing with selector "${selector}"`);
        console.log(`🔧 ProfielKaarten: Document ready state: ${document.readyState}`);
        console.log(`🔧 ProfielKaarten: activeCard status:`, activeCard);
        console.log(`🔧 ProfielKaarten: cardTimeout status:`, cardTimeout);
        
        // Use a WeakSet to track initialized elements, allowing GC when elements are removed
        const initializedElements = new WeakSet();
        
        /**
         * Apply profile card hover behavior to matching elements
         */
        function applyProfileCardHover() {
            const elements = document.querySelectorAll(selector);
            console.log(`🔍 ProfielKaarten: Found ${elements.length} elements matching "${selector}"`);
            
            // Debug: Show what types of elements we're targeting
            const elementTypes = Array.from(elements).map(el => ({
                tagName: el.tagName,
                className: el.className,
                username: el.dataset.username
            }));
            console.log(`🔍 ProfielKaarten: Element types found:`, elementTypes);
            
            let newElementsCount = 0;
            
            elements.forEach((element, index) => {
                // Skip if already initialized (using WeakSet)
                if (initializedElements.has(element)) return;
                
                newElementsCount++;
                console.log(`🔍 ProfielKaarten: Initializing NEW element ${newElementsCount} for username "${element.dataset.username}"`);
                
                const username = element.dataset.username;
                if (!username) {
                    console.log('ProfielKaarten: Element missing data-username attribute', element);
                    return;
                }
                
                // Skip if element already has tooltip attached to prevent conflicts
                if (element.dataset.tooltipAttached === 'true') {
                    console.log(`ProfielKaarten: Skipping element with existing tooltip for username "${username}"`);
                    return;
                }
                
                console.log(`✅ ProfielKaarten: Adding hover behavior to element for username "${username}"`);
                
                element.addEventListener('mouseenter', (event) => {
                    console.log(`🐭 MOUSEENTER: Started for username "${username}"`, {
                        targetElement: event.currentTarget.tagName,
                        className: event.currentTarget.className,
                        currentCardTimeout: cardTimeout,
                        activeCardExists: !!activeCard
                    });
                    
                    // Store a reference to the element
                    const targetElement = event.currentTarget;
                    
                    // Clear any existing hide timeout
                    if (cardTimeout) {
                        console.log(`🕐 MOUSEENTER: Clearing existing cardTimeout:`, cardTimeout);
                        clearTimeout(cardTimeout);
                        cardTimeout = null;
                    }
                    
                    // If a card is already showing, hide it first and proceed with new one
                    if (activeCard) {
                        console.log(`⚠️ MOUSEENTER: Active card already exists, hiding it before showing new one for "${username}"`);
                        hideProfileCard();
                    }
                    
                    // Set a delay before showing the card
                    console.log(`⏱️ MOUSEENTER: Setting timeout for "${username}" with delay ${HOVER_DELAY_MS}ms`);
                    cardTimeout = setTimeout(async () => {
                        try {
                            console.log(`⏰ TIMEOUT TRIGGERED: Starting card creation for "${username}"`);
                            
                            // First, verify the element is still in the DOM
                            if (!document.body.contains(targetElement)) {
                                console.warn(`❌ TIMEOUT: Target element no longer in DOM for "${username}"`);
                                return;
                            }
                            
                            console.log(`✅ TIMEOUT: Target element still in DOM for "${username}"`);
                            
                            // Create a placeholder div for the card immediately
                            console.log(`📦 TIMEOUT: Creating card container for "${username}"`);
                            const cardContainer = document.createElement('div');
                            cardContainer.id = 'profile-card-container';
                            cardContainer.style.position = 'fixed';
                            cardContainer.style.zIndex = '9999';
                            cardContainer.innerHTML = '<div class="profile-card-loading">Loading...</div>';
                            
                            // Add a smooth show animation
                            cardContainer.style.opacity = '0';
                            cardContainer.style.transform = 'translateY(-5px)';
                            cardContainer.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
                            
                            document.body.appendChild(cardContainer);
                            console.log(`📦 TIMEOUT: Card container added to DOM for "${username}"`);
                            
                            // Trigger show animation
                            setTimeout(() => {
                                if (cardContainer.parentNode) {
                                    cardContainer.style.opacity = '1';
                                    cardContainer.style.transform = 'translateY(0)';
                                }
                            }, 10);
                            // Position it near the target element
                            const rect = targetElement.getBoundingClientRect();
                            cardContainer.style.top = `${rect.bottom + 8}px`;
                            cardContainer.style.left = `${rect.left}px`;
                            console.log(`📍 TIMEOUT: Card positioned at (${rect.left}, ${rect.bottom + 8}) for "${username}"`);
                            
                            // Set as active card
                            if (activeCard) {
                                console.log(`🔄 TIMEOUT: Hiding existing active card before setting new one for "${username}"`);
                                hideProfileCard();
                            }
                            activeCard = cardContainer;
                            console.log(`✅ TIMEOUT: Set as active card for "${username}"`);
                            
                            // Add mouse events to the card itself to prevent hiding when mouse moves to card
                            console.log(`🐭 TIMEOUT: Adding mouse events to card for "${username}"`);
                            
                            cardContainer.addEventListener('mouseenter', () => {
                                console.log(`🐭 CARD MOUSEENTER: Entered card for "${username}", keeping card visible`);
                                if (cardTimeout) {
                                    console.log(`🕐 CARD MOUSEENTER: Clearing hide timeout for "${username}"`);
                                    clearTimeout(cardTimeout);
                                    cardTimeout = null;
                                }
                            });
                            
                            cardContainer.addEventListener('mouseleave', (e) => {
                                console.log(`🐭 CARD MOUSELEAVE: Left card for "${username}"`);
                                
                                // Check if mouse is moving to the original element (prevent hiding)
                                const relatedTarget = e.relatedTarget;
                                if (relatedTarget && targetElement && targetElement.contains(relatedTarget)) {
                                    console.log(`🎯 CARD MOUSELEAVE: Mouse moved to original element, not hiding card`);
                                    return;
                                }
                                
                                if (cardTimeout) {
                                    console.log(`🕐 CARD MOUSELEAVE: Clearing existing timeout for "${username}"`);
                                    clearTimeout(cardTimeout);
                                }
                                console.log(`⏱️ CARD MOUSELEAVE: Setting hide timeout for "${username}" with delay ${HOVER_HIDE_DELAY_MS}ms`);
                                cardTimeout = setTimeout(() => {
                                    console.log(`⏰ CARD HIDE TIMEOUT: Hiding card for "${username}"`);
                                    hideProfileCard();
                                    cardTimeout = null;
                                }, HOVER_HIDE_DELAY_MS);
                            });
                            
                            // Now fetch data asynchronously
                            console.log(`Fetching medewerker data for username: "${username}"`);
                            
                            // Add debug info about available functions
                            console.log('Available functions check:', {
                                fetchSharePointList: typeof fetchSharePointList,
                                linkInfoAvailable: typeof linkInfo,
                                getUserInfo: typeof getUserInfo
                            });
                            
                            const medewerkerData = await fetchMedewerkerData(username);
                            console.log('Medewerker data received:', medewerkerData);
                            
                            if (!medewerkerData) {
                                console.warn(`No medewerker data found for "${username}"`);
                                return hideProfileCard();
                            }
                            
                            console.log(`Fetching werkrooster data for: "${medewerkerData.Username}"`);
                            const werkroosterData = await fetchWerkroosterData(medewerkerData.Username);
                            console.log('Werkrooster data received:', werkroosterData);
                            
                            console.log(`Fetching team leader data for: "${medewerkerData.Username}"`);
                            const teamLeaderData = await fetchTeamLeaderData(medewerkerData.Username);
                            console.log('Team leader data received:', teamLeaderData);
                            
                            console.log(`Fetching all senior data for: "${medewerkerData.Username}"`);
                            const allSeniorData = await fetchAllSeniorData(medewerkerData.Username);
                            console.log('All senior data received:', allSeniorData);
                            
                            // Check if card is still active after async operations
                            if (activeCard !== cardContainer) {
                                console.log('Card was hidden during data fetch');
                                return;
                            }
                            
                            // Create the actual card content
                            const cardElement = createProfileCard(medewerkerData, werkroosterData, teamLeaderData, allSeniorData);
                            if (!cardElement) {
                                console.warn(`Failed to create card for "${username}"`);
                                return hideProfileCard();
                            }
                            
                            // Render the content into our container
                            const root = ReactDOM.createRoot(cardContainer);
                            cardContainer.reactRoot = root;
                            root.render(cardElement);
                            
                            // Reposition the card now that we know its size
                            const cardRect = cardContainer.getBoundingClientRect();
                            const viewportHeight = window.innerHeight;
                            const viewportWidth = window.innerWidth;
                            
                            let top = rect.bottom + 8; // Reduced gap from 5px to 8px for better mouse movement
                            let left = rect.left;
                            
                            // If card would extend below viewport, position it above the element
                            if (top + cardRect.height > viewportHeight) {
                                top = rect.top - cardRect.height - 8; // Use consistent 8px gap
                            }
                            
                            // If card would extend beyond right edge, align right edge with viewport
                            if (left + cardRect.width > viewportWidth) {
                                left = viewportWidth - cardRect.width - 10;
                            }
                            
                            // Ensure card doesn't go off the left edge
                            if (left < 10) {
                                left = 10;
                            }
                            
                            cardContainer.style.top = `${top}px`;
                            cardContainer.style.left = `${left}px`;
                            
                        } catch (error) {
                            console.error('Error showing profile card:', error);
                            hideProfileCard();
                        }
                    }, HOVER_DELAY_MS);
                });
                
                element.addEventListener('mouseleave', (e) => {
                    console.log(`🐭 ELEMENT MOUSELEAVE: Left element for username "${username}"`, {
                        targetElement: element.tagName,
                        className: element.className,
                        currentCardTimeout: cardTimeout,
                        activeCardExists: !!activeCard
                    });
                    
                    // Check if mouse is moving to the profile card (prevent hiding)
                    const relatedTarget = e.relatedTarget;
                    if (relatedTarget && activeCard && activeCard.contains(relatedTarget)) {
                        console.log(`🎯 ELEMENT MOUSELEAVE: Mouse moved to profile card, not hiding`);
                        return;
                    }
                    
                    // Only set hide timeout if we're not already in a hide timeout
                    if (cardTimeout) {
                        console.log(`🕐 ELEMENT MOUSELEAVE: Clearing existing timeout for "${username}"`);
                        clearTimeout(cardTimeout);
                    }
                    
                    // Set a hide timeout
                    console.log(`⏱️ ELEMENT MOUSELEAVE: Setting hide timeout for "${username}" with delay ${HOVER_HIDE_DELAY_MS}ms`);
                    cardTimeout = setTimeout(() => {
                        console.log(`⏰ ELEMENT HIDE TIMEOUT: Hiding card for "${username}"`);
                        hideProfileCard();
                        cardTimeout = null;
                    }, HOVER_HIDE_DELAY_MS);
                });
                
                // Mark as initialized in WeakSet
                initializedElements.add(element);
                console.log(`✅ ProfielKaarten: Successfully initialized element for username "${username}"`);
            });
            
            console.log(`🔍 ProfielKaarten: Initialized ${newElementsCount} new elements out of ${elements.length} total elements`);
        }
        
        // Apply immediately for existing elements
        applyProfileCardHover();
        
        // Set up a mutation observer to watch for changes and reapply as needed
        const observer = new MutationObserver((mutations) => {
            let hasRelevantChanges = false;
            
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if any added nodes contain elements matching our specific selector
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if ((node.hasAttribute && node.hasAttribute('data-username') && 
                                 (node.classList.contains('medewerker-kolom') || node.closest('.medewerker-info'))) || 
                                (node.querySelector && node.querySelector('.medewerker-kolom[data-username], .medewerker-info [data-username]'))) {
                                hasRelevantChanges = true;
                                break;
                            }
                        }
                    }
                    if (hasRelevantChanges) break;
                }
            }
            
            if (hasRelevantChanges) {
                console.log(`🔍 ProfielKaarten: MutationObserver detected relevant changes, reapplying hover behavior`);
                applyProfileCardHover();
            }
        });
        
        console.log(`🔍 ProfielKaarten: Starting MutationObserver for DOM changes`);
        observer.observe(document.body, { childList: true, subtree: true });
    };

    // Public API
    return {
        init,
        hideProfileCard
    };
})();

// Initialize the profile cards when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 ProfielKaarten: DOM Content Loaded, initializing...');
    console.log('🚀 ProfielKaarten: Document ready state:', document.readyState);
    console.log('🚀 ProfielKaarten: Elements with specific selector:', document.querySelectorAll('.medewerker-kolom[data-username], .medewerker-info [data-username]').length);
    console.log('🚀 ProfielKaarten: All elements with data-username:', document.querySelectorAll('[data-username]').length);
    ProfielKaarten.init();
});

// Check if we're in a module environment before exporting
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProfielKaarten;
} else if (typeof window !== 'undefined') {
    window.ProfielKaarten = ProfielKaarten;
}

export default ProfielKaarten;

console.log('🎯 ProfielKaarten module loaded successfully.', {
    fetchSharePointListAvailable: typeof fetchSharePointList,
    linkInfoAvailable: typeof linkInfo,
    getUserInfoAvailable: typeof getUserInfo,
    documentReadyState: document.readyState,
    elementsWithSpecificSelector: document.querySelectorAll('.medewerker-kolom[data-username], .medewerker-info [data-username]').length,
    allElementsWithDataUsername: document.querySelectorAll('[data-username]').length,
    HOVER_DELAY_MS: HOVER_DELAY_MS,
    HOVER_HIDE_DELAY_MS: HOVER_HIDE_DELAY_MS
});
