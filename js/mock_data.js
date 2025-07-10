// js/mock_data.js

/**
 * Mock data provider for development and testing when SharePoint is not available.
 * This file provides sample data that matches the expected SharePoint list structure.
 */

(function() {
    'use strict';
    
    /**
     * Mock SharePoint data sets
     */
    const mockData = {
        currentUser: {
            LoginName: "i:0#.w|development\\testuser",
            Title: "Test Gebruiker",
            Id: 1,
            Email: "test@example.com",
            IsSiteAdmin: false
        },
        
        Medewerkers: [
            {
                ID: 1,
                Title: "Jan van der Berg",
                Naam: "Jan van der Berg",
                Username: "jan.vandenberg@example.com",
                Team: "Team Alpha",
                Actief: true,
                Verbergen: false,
                Functie: "Projectmanager",
                "E_x002d_mail": "jan.vandenberg@example.com",
                Horen: true
            },
            {
                ID: 2,
                Title: "Sarah de Wit",
                Naam: "Sarah de Wit", 
                Username: "sarah.dewit@example.com",
                Team: "Team Beta",
                Actief: true,
                Verbergen: false,
                Functie: "Developer",
                "E_x002d_mail": "sarah.dewit@example.com",
                Horen: false
            },
            {
                ID: 3,
                Title: "Peter Janssen",
                Naam: "Peter Janssen",
                Username: "peter.janssen@example.com", 
                Team: "Team Alpha",
                Actief: true,
                Verbergen: false,
                Functie: "Analist",
                "E_x002d_mail": "peter.janssen@example.com",
                Horen: true
            },
            {
                ID: 4,
                Title: "Lisa Bakker",
                Naam: "Lisa Bakker",
                Username: "lisa.bakker@example.com",
                Team: "Team Gamma",
                Actief: true,
                Verbergen: false,
                Functie: "Designer",
                "E_x002d_mail": "lisa.bakker@example.com",
                Horen: false
            }
        ],
        
        Teams: [
            {
                ID: 1,
                Title: "Team Alpha",
                Naam: "Team Alpha",
                Kleur: "#3B82F6",
                Actief: true
            },
            {
                ID: 2,
                Title: "Team Beta", 
                Naam: "Team Beta",
                Kleur: "#10B981",
                Actief: true
            },
            {
                ID: 3,
                Title: "Team Gamma",
                Naam: "Team Gamma", 
                Kleur: "#F59E0B",
                Actief: true
            }
        ],
        
        Verlof: [
            {
                ID: 1,
                Title: "Vakantie Jan",
                MedewerkerID: "jan.vandenberg@example.com",
                StartDatum: new Date(new Date().getFullYear(), new Date().getMonth(), 15).toISOString(),
                EindDatum: new Date(new Date().getFullYear(), new Date().getMonth(), 18).toISOString(),
                RedenId: 1,
                Reden: "Vakantie",
                Omschrijving: "Kerstvakantie",
                Status: "Goedgekeurd"
            },
            {
                ID: 2,
                Title: "Verlof Sarah",
                MedewerkerID: "sarah.dewit@example.com",
                StartDatum: new Date(new Date().getFullYear(), new Date().getMonth(), 22).toISOString(),
                EindDatum: new Date(new Date().getFullYear(), new Date().getMonth(), 23).toISOString(),
                RedenId: 2,
                Reden: "Persoonlijk",
                Omschrijving: "Medische afspraak",
                Status: "Goedgekeurd"
            }
        ],
        
        CompensatieUren: [
            {
                ID: 1,
                Title: "Overwerk Peter",
                MedewerkerID: "peter.janssen@example.com",
                AanvraagTijdstip: new Date().toISOString(),
                StartCompensatieUren: new Date(new Date().getFullYear(), new Date().getMonth(), 10, 9, 0).toISOString(),
                EindeCompensatieUren: new Date(new Date().getFullYear(), new Date().getMonth(), 10, 17, 0).toISOString(),
                Omschrijving: "Weekend werk project deadline",
                Status: "Goedgekeurd",
                UrenTotaal: "8"
            }
        ],
        
        Verlofredenen: [
            {
                ID: 1,
                Title: "Vakantie",
                Naam: "Vakantie", 
                Kleur: "#3B82F6",
                VerlofDag: true
            },
            {
                ID: 2,
                Title: "Persoonlijk",
                Naam: "Persoonlijk",
                Kleur: "#10B981", 
                VerlofDag: true
            },
            {
                ID: 3,
                Title: "Ziekte",
                Naam: "Ziekte",
                Kleur: "#EF4444",
                VerlofDag: true
            },
            {
                ID: 4,
                Title: "Training",
                Naam: "Training",
                Kleur: "#8B5CF6",
                VerlofDag: false
            }
        ],
        
        keuzelijstFuncties: [
            { ID: 1, Title: "Projectmanager" },
            { ID: 2, Title: "Developer" },
            { ID: 3, Title: "Analist" },
            { ID: 4, Title: "Designer" },
            { ID: 5, Title: "Tester" }
        ],
        
        DagenIndicators: [],
        UrenPerWeek: [],
        IncidenteelZittingVrij: [],
        gebruikersInstellingen: [],
        statuslijstOpties: [
            { ID: 1, Title: "Ingediend" },
            { ID: 2, Title: "Goedgekeurd" },
            { ID: 3, Title: "Afgewezen" }
        ]
    };
    
    /**
     * Mock SharePoint API functions
     */
    let mockModeEnabled = false;
    
    /**
     * Enable mock mode for development
     */
    function enableMockMode() {
        console.log("[MockData] 🧪 Enabling mock mode for development");
        mockModeEnabled = true;
        
        // Mock the SharePoint web URL
        window.spWebAbsoluteUrl = window.location.origin + "/mock-sharepoint/";
        
        // Mock current user
        window.huidigeGebruiker = {
            loginNaam: mockData.currentUser.LoginName,
            normalizedUsername: window.trimLoginNaamPrefix ? window.trimLoginNaamPrefix(mockData.currentUser.LoginName) : "testuser",
            Id: mockData.currentUser.Id,
            Title: mockData.currentUser.Title,
            Email: mockData.currentUser.Email,
            isSiteAdmin: mockData.currentUser.IsSiteAdmin,
            sharePointGroepen: []
        };
        
        console.log("[MockData] Mock user set:", window.huidigeGebruiker);
        
        // Override the SharePoint API function
        const originalGetLijstItemsAlgemeen = window.getLijstItemsAlgemeen;
        window.getLijstItemsAlgemeen = mockGetLijstItemsAlgemeen;
        
        // Store the original for potential restoration
        window.originalGetLijstItemsAlgemeen = originalGetLijstItemsAlgemeen;
        
        console.log("[MockData] Mock mode enabled successfully");
    }
    
    /**
     * Disable mock mode and restore original functions
     */
    function disableMockMode() {
        console.log("[MockData] Disabling mock mode");
        mockModeEnabled = false;
        
        if (window.originalGetLijstItemsAlgemeen) {
            window.getLijstItemsAlgemeen = window.originalGetLijstItemsAlgemeen;
            delete window.originalGetLijstItemsAlgemeen;
        }
        
        // Reset SharePoint context
        window.spWebAbsoluteUrl = null;
        window.huidigeGebruiker = null;
        
        console.log("[MockData] Mock mode disabled");
    }
    
    /**
     * Mock implementation of getLijstItemsAlgemeen
     */
    async function mockGetLijstItemsAlgemeen(lijstConfigKey, selectQuery = "", filterQuery = "", expandQuery = "", orderbyQuery = "") {
        console.log(`[MockData] 📊 Mock API call: ${lijstConfigKey}`, { selectQuery, filterQuery, expandQuery, orderbyQuery });
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 300));
        
        // Get mock data for the requested list
        let data = mockData[lijstConfigKey] || [];
        
        // Apply basic filtering (simplified)
        if (filterQuery && filterQuery.includes('$filter=')) {
            console.log(`[MockData] Applying basic filter: ${filterQuery}`);
            // For demo purposes, just return the data as-is
            // In a real implementation, you'd parse OData filters
        }
        
        console.log(`[MockData] Returning ${data.length} items for ${lijstConfigKey}:`, data);
        return data;
    }
    
    /**
     * Mock SharePoint connectivity test
     */
    async function mockTestSharePointConnectivity() {
        console.log("[MockData] 🧪 Mock connectivity test");
        await new Promise(resolve => setTimeout(resolve, 200));
        return true;
    }
    
    /**
     * Auto-enable mock mode when SharePoint is not available
     */
    async function autoEnableMockMode() {
        // Check if we're in a development environment
        const isDevelopment = window.location.hostname === 'localhost' || 
                              window.location.hostname === '127.0.0.1' ||
                              window.location.hostname.includes('dev') ||
                              window.location.port !== '';
        
        if (!isDevelopment) {
            console.log("[MockData] Not in development environment, skipping auto-mock");
            return false;
        }
        
        // Test if SharePoint is available
        try {
            if (window.spWebAbsoluteUrl && typeof window.testSharePointConnectivity === 'function') {
                const isConnected = await window.testSharePointConnectivity();
                if (isConnected) {
                    console.log("[MockData] SharePoint is available, not enabling mock mode");
                    return false;
                }
            }
        } catch (error) {
            console.log("[MockData] SharePoint connectivity test failed:", error);
        }
        
        console.log("[MockData] SharePoint not available in development environment, enabling mock mode");
        enableMockMode();
        
        // Override the connectivity test as well
        if (typeof window.testSharePointConnectivity === 'function') {
            window.originalTestSharePointConnectivity = window.testSharePointConnectivity;
            window.testSharePointConnectivity = mockTestSharePointConnectivity;
        }
        
        return true;
    }
    
    /**
     * Export functions to global scope
     */
    window.mockData = {
        enable: enableMockMode,
        disable: disableMockMode,
        autoEnable: autoEnableMockMode,
        isEnabled: () => mockModeEnabled,
        data: mockData
    };
    
    console.log("[MockData] Mock data provider loaded. Use window.mockData.enable() to activate mock mode.");
})();