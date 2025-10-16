// Complete RoosterApp module - exact copy from verlofrooster_backup.aspx
// This file contains the complete RoosterApp function extracted from the original .aspx file
// All div IDs, class names, and function names are preserved exactly as in the original

// Import React and necessary hooks and utilities
import { 
    maandNamenVolledig, 
    getPasen, 
    getFeestdagen, 
    getWeekNummer, 
    getWekenInJaar, 
    getDagenInMaand, 
    formatteerDatum,
    getDagenInWeek, 
    isVandaag,
    getDagNaam,
    createLocalDate,
    toISODate,
    isSameISODate
} from '../utils/dateTimeUtils.js';
import { getInitialen, getProfilePhotoUrl } from '../utils/userUtils.js';
import { calculateWeekType } from '../services/scheduleLogic.js';
import { fetchSharePointList, getUserInfo, createSharePointListItem, updateSharePointListItem, deleteSharePointListItem, trimLoginNaamPrefix } from '../services/sharepointService.js';
import { getCurrentUserGroups, isUserInAnyGroup } from '../services/permissionService.js';
import * as linkInfo from '../services/linkInfo.js';
import LoadingLogic, { loadFilteredData, shouldReloadData, updateCacheKey, clearAllCache, logLoadingStatus } from '../services/loadingLogic.js';
import ContextMenu, { canManageOthersEvents, canUserModifyItem } from '../ui/ContextMenu.js';
import { validateFormSubmission, showCRUDRestrictionMessage } from '../services/crudPermissionService.js';
import ProfielKaarten from '../ui/profielkaarten.js';
import FAB from '../ui/FloatingActionButton.js';
import Modal from '../ui/Modal.js';
import DagCell, { renderCompensatieMomenten } from '../ui/dagCell.js';
import VerlofAanvraagForm from '../ui/forms/VerlofAanvraagForm.js';
import CompensatieUrenForm from '../ui/forms/CompensatieUrenForm.js';
import ZiekteMeldingForm from '../ui/forms/ZiekteMeldingForm.js';
import ZittingsvrijForm from '../ui/forms/ZittingsvrijForm.js';
import MedewerkerRow from '../ui/userinfo.js';
import Legenda from '../ui/Legenda.js';
import RoosterHeader from '../ui/RoosterHeader.js';
import RoosterGrid from '../ui/RoosterGrid.js';
import TooltipManager from '../ui/tooltipbar.js';
import Mededelingen from '../ui/Mededelingen.js';

const { useState, useEffect, useMemo, useCallback, useRef, createElement: h, Fragment } = React;

// =====================
// Hoofd RoosterApp Component
// =====================
const RoosterApp = ({ isUserValidated = true, currentUser, userPermissions }) => {
    // Helper function to create header cells
    const createHeaderCells = () => {
        const cells = [
            h('th', { className: 'medewerker-kolom', id: 'medewerker-kolom' }, 
                h('div', { 
                    className: 'medewerker-header-container',
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px'
                    }
                },
                    h('span', null, 'Medewerker'),
                    h('button', {
                        className: 'sort-button',
                        onClick: toggleSortDirection,
                        title: `Huidige sortering: ${sortDirection === 'asc' ? 'A-Z' : 'Z-A'} (klik om te wisselen)`,
                        style: {
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px 6px',
                            borderRadius: '4px',
                            color: '#6b7280',
                            fontSize: '12px',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            lineHeight: 1
                        },
                        onMouseOver: (e) => {
                            e.target.style.backgroundColor = '#f3f4f6';
                            e.target.style.color = '#374151';
                        },
                        onMouseOut: (e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = '#6b7280';
                        }
                    }, 
                    h('i', { 
                        className: `fas ${sortDirection === 'asc' ? 'fa-sort-down' : 'fa-sort-up'}`,
                        style: { fontSize: '10px' }
                    })
                )
            ))
        ];
        
        (periodeData || []).forEach((dag, index) => {
            const isWeekend = dag.getDay() === 0 || dag.getDay() === 6;
            const feestdagNaam = feestdagen[dag.toISOString().split('T')[0]];
            const isToday = isVandaag(dag);
            const classes = `dag-kolom ${isWeekend ? 'weekend' : ''} ${feestdagNaam ? 'feestdag' : ''} ${isToday ? 'vandaag' : ''}`;
           
            // Create a ref callback to add tooltip for holiday
            const headerRef = (element) => {
                if (element && feestdagNaam && !element.dataset.tooltipAttached) {
                    // Set data attributes for tooltip system to find
                    element.dataset.feestdag = feestdagNaam;
                    element.dataset.datum = dag.toISOString().split('T')[0];
                    
                    // Attach tooltip if TooltipManager is available
                    if (typeof TooltipManager !== 'undefined' && TooltipManager.attach) {
                        TooltipManager.attach(element, () => {
                            return TooltipManager.createFeestdagTooltip(feestdagNaam, dag);
                        });
                    }
                }
            };
           
            cells.push(h('th', {
                key: `dag-${index}-${dag.toISOString()}`,
                className: classes,
                ref: headerRef
            },
                h('div', { className: 'dag-header' },
                    h('span', { className: 'dag-naam' }, getDagNaam(dag)),
                    h('span', { className: 'dag-nummer' }, dag.getDate()),
                    isToday && h('div', { className: 'vandaag-indicator' })
                )
            ));
        });
        
        return cells;
    };

    console.log('🏠 RoosterApp component initialized');
    const [weergaveType, setWeergaveType] = useState('maand');
    const [huidigJaar, setHuidigJaar] = useState(new Date().getFullYear());
    const [huidigMaand, setHuidigMaand] = useState(new Date().getMonth());
    const [medewerkers, setMedewerkers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [shiftTypes, setShiftTypes] = useState({});
    const [verlofItems, setVerlofItems] = useState([]);
    const [feestdagen, setFeestdagen] = useState({});
    const [loading, setLoading] = useState(false); // Start with false, let data loading set this to true
    const [backgroundRefreshing, setBackgroundRefreshing] = useState(false); // For silent updates
    const [error, setError] = useState(null);
    const [huidigWeek, setHuidigWeek] = useState(getWeekNummer(new Date()));
    const [zoekTerm, setZoekTerm] = useState('');
    const [geselecteerdTeam, setGeselecteerdTeam] = useState('');
    const [sortDirection, setSortDirection] = useState('asc'); // 'asc' for A-Z, 'desc' for Z-A
    const [zittingsvrijItems, setZittingsvrijItems] = useState([]);
    const [compensatieUrenItems, setCompensatieUrenItems] = useState([]);
    const [urenPerWeekItems, setUrenPerWeekItems] = useState([]);
    const [dagenIndicators, setDagenIndicators] = useState({});
    const [contextMenu, setContextMenu] = useState(null);
    const [isVerlofModalOpen, setIsVerlofModalOpen] = useState(false);
    const [isCompensatieModalOpen, setIsCompensatieModalOpen] = useState(false);
    const [isZiekModalOpen, setIsZiekModalOpen] = useState(false);
    const [isZittingsvrijModalOpen, setIsZittingsvrijModalOpen] = useState(false);
    const [selection, setSelection] = useState(null);
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipTimeout, setTooltipTimeout] = useState(null);
    const [firstClickData, setFirstClickData] = useState(null);
    
    // Header dropdown states
    const [helpDropdownOpen, setHelpDropdownOpen] = useState(false);
    const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
    
    // Permission states for proper SharePoint group checking
    const [permissions, setPermissions] = useState({
        isAdmin: false,
        isFunctional: false,
        isTaakbeheer: false,
        loading: true
    });
    const [canManageAnnouncements, setCanManageAnnouncements] = useState(false);
    const mededelingenRef = useRef(null);
    const [userInfo, setUserInfo] = useState({
        naam: currentUser?.Title || '',
        pictureUrl: '',
        loading: !currentUser
    });

    // Debug modal state changes
    useEffect(() => {
        console.log('🏠 Modal state changed:', {
            compensatie: isCompensatieModalOpen,
            zittingsvrij: isZittingsvrijModalOpen,
            verlof: isVerlofModalOpen,
            ziek: isZiekModalOpen
        });
    }, [isCompensatieModalOpen, isZittingsvrijModalOpen, isVerlofModalOpen, isZiekModalOpen]);

    // Load proper SharePoint group permissions
    useEffect(() => {
        const loadPermissions = async () => {
            try {
                console.log('🔐 Loading SharePoint group permissions...');
                
                // Define the SharePoint groups for each permission level
                const adminGroups = ["1. Sharepoint beheer", "1.1. Mulder MT"];
                const functionalGroups = ["1. Sharepoint beheer", "1.1. Mulder MT", "2.6 Roosteraars"];
                const taakbeheerGroups = ["1. Sharepoint beheer", "1.1. Mulder MT", "2.6 Roosteraars", "2.3. Senioren beoordelen", "2.4. Senioren administratie"];
                
                // Check permissions for each group
                const [isAdmin, isFunctional, isTaakbeheer, canManage] = await Promise.all([
                    isUserInAnyGroup(adminGroups),
                    isUserInAnyGroup(functionalGroups),
                    isUserInAnyGroup(taakbeheerGroups),
                    canManageOthersEvents()
                ]);
                
                console.log('🔐 Permissions loaded:', { isAdmin, isFunctional, isTaakbeheer, canManage });
                
                setPermissions({
                    isAdmin,
                    isFunctional,
                    isTaakbeheer,
                    loading: false
                });
                setCanManageAnnouncements(canManage);
            } catch (error) {
                console.error('❌ Error loading permissions:', error);
                setPermissions({
                    isAdmin: false,
                    isFunctional: false,
                    isTaakbeheer: false,
                    loading: false
                });
            }
        };
        
        loadPermissions();
    }, []);

    // Load user info and profile photo
    useEffect(() => {
        if (currentUser && currentUser.Email) {
            setUserInfo(prev => ({ 
                ...prev, 
                naam: currentUser.Title || currentUser.LoginName, 
                loading: false 
            }));
            
            // Get profile photo URL from SharePoint
            try {
                const photoUrl = `/_layouts/15/userphoto.aspx?size=M&username=${encodeURIComponent(currentUser.Email)}`;
                setUserInfo(prev => ({ ...prev, pictureUrl: photoUrl }));
            } catch (error) {
                console.warn('Error getting profile photo URL:', error);
                // Fallback to SharePoint default user photo
                setUserInfo(prev => ({ 
                    ...prev,
                    pictureUrl: `/_layouts/15/userphoto.aspx?size=M&username=${encodeURIComponent(currentUser.Email || '')}`
                }));
            }
        }
    }, [currentUser]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (helpDropdownOpen && !event.target.closest('.help-dropdown')) {
                setHelpDropdownOpen(false);
            }
            if (settingsDropdownOpen && !event.target.closest('.user-dropdown')) {
                setSettingsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [helpDropdownOpen, settingsDropdownOpen]);

    // Initialize profile cards for employee hover information
    useEffect(() => {
        console.log('🃏 Initializing profile cards...');
        try {
            ProfielKaarten.init('.medewerker-naam, .medewerker-avatar');
        } catch (error) {
            console.error('❌ Error initializing profile cards:', error);
        }
    }, [medewerkers]); // Re-initialize when employees change

    useEffect(() => {
        const jaren = [huidigJaar - 1, huidigJaar, huidigJaar + 1];
        const alleFeestdagen = jaren.reduce((acc, jaar) => ({ ...acc, ...getFeestdagen(jaar) }), {});
        setFeestdagen(alleFeestdagen);
    }, [huidigJaar]);

    // Real data loading function - copied from backup
    const refreshData = useCallback(async (forceReload = false) => {
        try {
            console.log('🔄 Starting refreshData...');
            setLoading(true);
            setError(null);

            // Wait for configuration to be available with timeout
            let configWaitAttempts = 0;
            const maxConfigWaitAttempts = 50; // 5 seconds max wait
            while (!window.appConfiguratie && configWaitAttempts < maxConfigWaitAttempts) {
                console.log(`⏳ Waiting for appConfiguratie... attempt ${configWaitAttempts + 1}/${maxConfigWaitAttempts}`);
                await new Promise(r => setTimeout(r, 100));
                configWaitAttempts++;
            }

            if (!window.appConfiguratie) {
                throw new Error('Configuration not loaded after timeout');
            }

            // Check if fetchSharePointList is available
            if (typeof fetchSharePointList !== 'function') {
                throw new Error('SharePoint service not available');
            }

            // Fetch current user info
            console.log('👤 Current user from props:', currentUser);

            // Check if we need to reload data for the current period
            const needsReload = forceReload || shouldReloadData(weergaveType, huidigJaar, weergaveType === 'week' ? huidigWeek : huidigMaand);
            
            if (needsReload) {
                console.log('� Loading data for new period...');
                // Update cache key for current period
                updateCacheKey(weergaveType, huidigJaar, weergaveType === 'week' ? huidigWeek : huidigMaand);
            } else {
                console.log('✅ Using cached data for current period');
            }

            console.log('📊 Fetching SharePoint lists...');
            
            // Always load static data (these are small lists and don't change often)
            const [medewerkersData, teamsData, verlofredenenData, urenPerWeekData, dagenIndicatorsData] = await Promise.all([
                fetchSharePointList('Medewerkers'),
                fetchSharePointList('Teams'),
                fetchSharePointList('Verlofredenen'),
                fetchSharePointList('UrenPerWeek'),
                fetchSharePointList('DagenIndicators')
            ]);

            // Load period-specific data with smart filtering
            let verlofData, zittingsvrijData, compensatieUrenData;
            
            if (needsReload) {
                console.log('🔍 Loading period-specific data with filtering...');
                [verlofData, zittingsvrijData, compensatieUrenData] = await Promise.all([
                    loadFilteredData(fetchSharePointList, 'Verlof', 'verlof', weergaveType, huidigJaar, weergaveType === 'week' ? huidigWeek : huidigMaand),
                    loadFilteredData(fetchSharePointList, 'IncidenteelZittingVrij', 'zittingsvrij', weergaveType, huidigJaar, weergaveType === 'week' ? huidigWeek : huidigMaand),
                    loadFilteredData(fetchSharePointList, 'CompensatieUren', 'compensatie', weergaveType, huidigJaar, weergaveType === 'week' ? huidigWeek : huidigMaand)
                ]);
                
                // Log loading statistics
                logLoadingStatus();
            } else {
                // Use cached data
                verlofData = LoadingLogic.getCachedData('verlof') || [];
                zittingsvrijData = LoadingLogic.getCachedData('zittingsvrij') || [];
                compensatieUrenData = LoadingLogic.getCachedData('compensatie') || [];
                
                console.log(`📁 Using cached data: ${verlofData.length} verlof, ${zittingsvrijData.length} zittingsvrij, ${compensatieUrenData.length} compensatie items`);
            }

            console.log('✅ Data fetched successfully, processing...');
            const teamsMapped = (teamsData || []).map(item => ({ id: item.Title || item.ID?.toString(), naam: item.Naam || item.Title, kleur: item.Kleur || '#cccccc' }));
            console.log(`👥 Loaded ${teamsMapped.length} teams:`, teamsMapped.map(t => `${t.naam} (${t.id})`));
            setTeams(teamsMapped);
            const teamNameToIdMap = teamsMapped.reduce((acc, t) => { acc[t.naam] = t.id; return acc; }, {});
            const transformedShiftTypes = (verlofredenenData || []).reduce((acc, item) => {
                if (item.Title) { acc[item.ID] = { id: item.ID, label: item.Title, kleur: item.Kleur || '#999999', afkorting: item.Afkorting || '??' }; }
                return acc;
            }, {});
            setShiftTypes(transformedShiftTypes);
            const medewerkersProcessed = (medewerkersData || [])
                .filter(item => item.Naam && item.Actief !== false)
                .map(item => ({ ...item, id: item.ID, naam: item.Naam, team: teamNameToIdMap[item.Team] || '', Username: item.Username || null }));
            setMedewerkers(medewerkersProcessed);
            setVerlofItems((verlofData || []).map(v => ({ ...v, StartDatum: createLocalDate(v.StartDatum), EindDatum: createLocalDate(v.EindDatum) })));
            setZittingsvrijItems((zittingsvrijData || []).map(z => ({ ...z, StartDatum: createLocalDate(z.ZittingsVrijeDagTijd), EindDatum: createLocalDate(z.ZittingsVrijeDagTijdEind) })));
            setCompensatieUrenItems((compensatieUrenData || []).map(c => ({
                ...c,
                StartCompensatieUren: createLocalDate(c.StartCompensatieUren),
                EindeCompensatieUren: createLocalDate(c.EindeCompensatieUren),
                ruildagStart: c.ruildagStart ? createLocalDate(c.ruildagStart) : null
            })));
            setUrenPerWeekItems((urenPerWeekData || []).map(u => {
                // Normalize Ingangsdatum by properly parsing and resetting time components
                let ingangsDate;
               
                try {
                    // Handle Dutch date format (DD-MM-YYYY)
                    if (typeof u.Ingangsdatum === 'string' && u.Ingangsdatum.match(/^\d{1,2}-\d{1,2}-\d{4}/)) {
                        const parts = u.Ingangsdatum.split(' ')[0].split('-');
                        const day = parseInt(parts[0], 10);
                        const month = parseInt(parts[1], 10) - 1; // Months are 0-based in JS
                        const year = parseInt(parts[2], 10);
                       
                        ingangsDate = new Date(year, month, day);
                    } else {
                        ingangsDate = new Date(u.Ingangsdatum);
                    }
                   
                    // Check if date is valid
                    if (isNaN(ingangsDate.getTime())) {
                        console.error('Invalid date after parsing:', u.Ingangsdatum);
                        ingangsDate = null;
                    } else {
                        // Reset time components for consistent comparison
                        ingangsDate.setHours(0, 0, 0, 0);
                    }
                } catch (error) {
                    console.error('Error parsing date:', error, u.Ingangsdatum);
                    ingangsDate = null;
                }
               
                // Parse CycleStartDate if present (for 2-week rotations)
                let cycleStartDate = null;
                if (u.CycleStartDate) {
                    try {
                        cycleStartDate = new Date(u.CycleStartDate);
                        if (isNaN(cycleStartDate.getTime())) {
                            cycleStartDate = null;
                        } else {
                            cycleStartDate.setHours(0, 0, 0, 0);
                        }
                    } catch (error) {
                        console.error('Error parsing CycleStartDate:', error, u.CycleStartDate);
                        cycleStartDate = null;
                    }
                }
               
                // Handle WeekType field - preserve original value but normalize case
                let weekType = null;
                if (u.WeekType !== undefined && u.WeekType !== null && u.WeekType !== '') {
                    weekType = String(u.WeekType).trim().toUpperCase();
                    // Validate it's either A or B
                    if (weekType !== 'A' && weekType !== 'B') {
                        console.error(`Invalid WeekType '${u.WeekType}' for record ID ${u.Id}, expected 'A' or 'B'`);
                        weekType = null;
                    }
                }
               
                // Handle IsRotatingSchedule field (defaults to false for backwards compatibility)  
                const isRotatingSchedule = u.IsRotatingSchedule === true || u.IsRotatingSchedule === 'true';
               
                // WeekType processing for rotating schedules
               
                return {
                    ...u,
                    Ingangsdatum: ingangsDate,
                    CycleStartDate: cycleStartDate,
                    WeekType: weekType,
                    IsRotatingSchedule: isRotatingSchedule
                };
            }));
           
            // Processed UrenPerWeek data for employee scheduling
           
            const indicatorsMapped = (dagenIndicatorsData || []).reduce((acc, item) => {
                if (item.Title) {
                    acc[item.Title] = { ...item, kleur: item.Kleur || '#cccccc', Beschrijving: item.Beschrijving || '' };
                }
                return acc;
            }, {});
            setDagenIndicators(indicatorsMapped);

            console.log('✅ Data processing complete!');

            // Debug: Log medewerkers data for troubleshooting
            // Medewerkers data loaded successfully

        } catch (err) {
            console.error('❌ Error in refreshData:', err);
            setError(`Fout bij laden: ${err.message}`);
        } finally {
            console.log('🏁 refreshData complete, setting loading to false');
            setLoading(false);
        }
    }, [weergaveType, huidigJaar, huidigMaand, huidigWeek]);

    // Silent background refresh function - no loading spinner
    const silentRefreshData = useCallback(async (forceReload = true) => {
        try {
            console.log('🔄 Starting silent background refresh...');
            setBackgroundRefreshing(true);
            // Note: NOT setting setLoading(true) to avoid spinner

            // Wait for configuration to be available with timeout
            let configWaitAttempts = 0;
            const maxConfigWaitAttempts = 50; // 5 seconds max wait
            while (!window.appConfiguratie && configWaitAttempts < maxConfigWaitAttempts) {
                await new Promise(r => setTimeout(r, 100));
                configWaitAttempts++;
            }

            if (!window.appConfiguratie) {
                throw new Error('Configuratie niet beschikbaar na wachten');
            }

            // Check if we need to reload data for the current period
            const needsReload = forceReload || shouldReloadData(weergaveType, huidigJaar, weergaveType === 'week' ? huidigWeek : huidigMaand);
            
            if (needsReload) {
                console.log('🔄 Silent loading data for current period...');
                updateCacheKey(weergaveType, huidigJaar, weergaveType === 'week' ? huidigWeek : huidigMaand);
            }

            // Always load static data (these are small lists and don't change often)
            const [medewerkersData, teamsData, verlofredenenData, urenPerWeekData, dagenIndicatorsData] = await Promise.all([
                fetchSharePointList('Medewerkers'),
                fetchSharePointList('Teams'),
                fetchSharePointList('Verlofredenen'),
                fetchSharePointList('UrenPerWeek'),
                fetchSharePointList('DagenIndicators')
            ]);

            // Load period-specific data with smart filtering
            let verlofData, zittingsvrijData, compensatieUrenData;
            
            if (needsReload) {
                console.log('🔍 Silent loading period-specific data...');
                [verlofData, zittingsvrijData, compensatieUrenData] = await Promise.all([
                    loadFilteredData(fetchSharePointList, 'Verlof', 'verlof', weergaveType, huidigJaar, weergaveType === 'week' ? huidigWeek : huidigMaand),
                    loadFilteredData(fetchSharePointList, 'IncidenteelZittingVrij', 'zittingsvrij', weergaveType, huidigJaar, weergaveType === 'week' ? huidigWeek : huidigMaand),
                    loadFilteredData(fetchSharePointList, 'CompensatieUren', 'compensatie', weergaveType, huidigJaar, weergaveType === 'week' ? huidigWeek : huidigMaand)
                ]);
            } else {
                // Use cached data
                verlofData = LoadingLogic.getCachedData('verlof') || [];
                zittingsvrijData = LoadingLogic.getCachedData('zittingsvrij') || [];
                compensatieUrenData = LoadingLogic.getCachedData('compensatie') || [];
            }

            console.log('✅ Silent data refresh complete, updating state...');
            const teamsMapped = (teamsData || []).map(item => ({ id: item.Title || item.ID?.toString(), naam: item.Naam || item.Title, kleur: item.Kleur || '#cccccc' }));
            setTeams(teamsMapped);
            const teamNameToIdMap = teamsMapped.reduce((acc, t) => { acc[t.naam] = t.id; return acc; }, {});
            const transformedShiftTypes = (verlofredenenData || []).reduce((acc, item) => {
                if (item.Title) { acc[item.ID] = { id: item.ID, label: item.Title, kleur: item.Kleur || '#999999', afkorting: item.Afkorting || '??' }; }
                return acc;
            }, {});
            setShiftTypes(transformedShiftTypes);

            const medewerkersTransformed = (medewerkersData || []).map(m => ({
                id: m.ID,
                naam: m.Naam || m.Title || 'Onbekend',
                team: teamNameToIdMap[m.Team] || 'geen_team',
                username: m.Username || '',
                Username: m.Username || '',
                Title: m.Naam || m.Title || 'Onbekend',
                profilePhoto: getProfilePhotoUrl(m.Username),
                horenStatus: m.HorenStatus
            }));
            setMedewerkers(medewerkersTransformed);
            setVerlofItems((verlofData || []).map(v => ({ ...v, StartDatum: createLocalDate(v.StartDatum), EindDatum: createLocalDate(v.EindDatum) })));
            setZittingsvrijItems((zittingsvrijData || []).map(z => ({ ...z, StartDatum: createLocalDate(z.ZittingsVrijeDagTijd), EindDatum: createLocalDate(z.ZittingsVrijeDagTijdEind) })));
            setCompensatieUrenItems((compensatieUrenData || []).map(c => ({
                ...c,
                StartCompensatieUren: createLocalDate(c.StartCompensatieUren),
                EindeCompensatieUren: createLocalDate(c.EindeCompensatieUren)
            })));
            setUrenPerWeekItems(urenPerWeekData || []);

            const transformedDagenIndicators = (dagenIndicatorsData || []).reduce((acc, item) => {
                if (item.Title) { acc[item.Title] = { Title: item.Title, kleur: item.Kleur || '#999999', Beschrijving: item.Beschrijving || '' }; }
                return acc;
            }, {});
            setDagenIndicators(transformedDagenIndicators);

            console.log('🎉 Silent refresh completed successfully');

        } catch (err) {
            console.error('❌ Error in silent refresh:', err);
            // Only set error state if we have no existing data (first load scenario)
            if (medewerkers.length === 0) {
                console.error('🚨 Initial data load failed, showing error to user');
                setError('Fout bij het laden van data: ' + err.message);
            } else {
                console.log('🔄 Silent refresh failed, user can continue with cached data');
            }
        } finally {
            setBackgroundRefreshing(false);
        }
    }, [weergaveType, huidigJaar, huidigMaand, huidigWeek]);

    // Initial data load when user is validated
    useEffect(() => {
        // Only start loading data after user is validated
        if (isUserValidated) {
            // Use regular refreshData for initial load to show errors if needed
            refreshData();
        }
    }, [refreshData, isUserValidated]);

    // Effect to reload data when period changes (maand/week navigation)
    useEffect(() => {
        if (isUserValidated) {
            console.log(`📅 Period changed to ${weergaveType}: ${weergaveType === 'week' ? `week ${huidigWeek}` : maandNamenVolledig[huidigMaand]} ${huidigJaar}`);
            
            // Check if we need to reload data for the new period
            if (shouldReloadData(weergaveType, huidigJaar, weergaveType === 'week' ? huidigWeek : huidigMaand)) {
                console.log('🔄 Triggering silent data reload for new period...');
                silentRefreshData(false); // Don't force reload, let loadingLogic decide
            } else {
                console.log('✅ Data already cached for this period');
            }
        }
    }, [weergaveType, huidigJaar, huidigMaand, huidigWeek, isUserValidated, silentRefreshData]);

    // Form submission handlers
    const handleVerlofSubmit = useCallback(async (formData) => {
        try {
            console.log("Submitting verlof form data:", formData);
            console.log("Detailed form data breakdown:", {
                Title: formData.Title,
                Medewerker: formData.Medewerker,
                MedewerkerID: formData.MedewerkerID,
                StartDatum: formData.StartDatum,
                EindDatum: formData.EindDatum,
                RedenId: formData.RedenId,
                Omschrijving: formData.Omschrijving,
                Status: formData.Status
            });

            // Validate required fields
            if (!formData.MedewerkerID) {
                throw new Error('MedewerkerID is required but missing');
            }
            if (!formData.StartDatum || !formData.EindDatum) {
                throw new Error('Start and end dates are required');
            }

            const result = await createSharePointListItem('Verlof', formData);
            console.log('Verlofaanvraag ingediend:', result);
            setIsVerlofModalOpen(false);
            
            // Graceful data refresh without full page reload
            console.log('🔄 Refreshing data silently to update verlof...');
            setBackgroundRefreshing(true);
            await silentRefreshData();
            setBackgroundRefreshing(false);
        } catch (error) {
            console.error('Fout bij het indienen van verlofaanvraag:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                formData: formData
            });
            alert('Fout bij het indienen van verlofaanvraag: ' + error.message);
        }
    }, [silentRefreshData]);

    const handleZiekteSubmit = useCallback(async (formData) => {
        try {
            console.log("Submitting ziekte form data:", formData);
            const result = await createSharePointListItem('Verlof', formData);
            console.log('Ziekmelding ingediend:', result);
            setIsZiekModalOpen(false);
            
            // Graceful data refresh without full page reload
            console.log('🔄 Refreshing data silently to update ziekte...');
            setBackgroundRefreshing(true);
            await silentRefreshData();
            setBackgroundRefreshing(false);
        } catch (error) {
            console.error('Fout bij het indienen van ziekmelding:', error);
            alert('Fout bij het indienen van ziekmelding: ' + error.message);
        }
    }, [silentRefreshData]);

    const handleCompensatieSubmit = useCallback(async (formData) => {
        try {
            console.log("🟡 handleCompensatieSubmit called with data:", formData);
            const result = await createSharePointListItem('CompensatieUren', formData);
            console.log('✅ Compensatie-uren ingediend successfully:', result);
            setIsCompensatieModalOpen(false);
            
            // Graceful data refresh without full page reload
            console.log('🔄 Refreshing data silently to update compensatie...');
            setBackgroundRefreshing(true);
            await silentRefreshData();
            setBackgroundRefreshing(false);
        } catch (error) {
            console.error('❌ Fout bij het indienen van compensatie-uren:', error);
            alert('Fout bij het indienen van compensatie-uren: ' + error.message);
        }
    }, [silentRefreshData]);

    const handleZittingsvrijSubmit = useCallback(async (formData) => {
        try {
            console.log("🔵 handleZittingsvrijSubmit called with data:", formData);
            // Use the list name from formData if provided, otherwise default to 'IncidenteelZittingVrij'
            const listName = formData._listName || 'IncidenteelZittingVrij';
            delete formData._listName; // Remove this property before sending to SharePoint

            const result = await createSharePointListItem(listName, formData);
            console.log('✅ Zittingsvrij ingediend successfully:', result);
            setIsZittingsvrijModalOpen(false);
            
            // Graceful data refresh without full page reload
            console.log('🔄 Refreshing data silently to update zittingsvrij...');
            setBackgroundRefreshing(true);
            await silentRefreshData();
            setBackgroundRefreshing(false);
        } catch (error) {
            console.error('❌ Fout bij het indienen van zittingsvrij:', error);
            alert('Fout bij het indienen van zittingsvrij: ' + error.message);
        }
    }, [silentRefreshData]);

    // Context menu handler
    const showContextMenu = useCallback(async (e, medewerker, dag, item) => {
        console.log('showContextMenu called:', {
            medewerker: medewerker?.Username,
            dag: toISODate(dag),
            item: item?.ID,
            hasItem: !!item,
            itemType: item ? Object.keys(item).filter(key => ['RedenId', 'StartCompensatieUren', 'ZittingsVrijeDagTijd'].includes(key)) : 'none',
            currentSelection: selection
        });

        // Check if we're right-clicking on a different employee than the current selection
        if (selection && selection.medewerkerId && selection.medewerkerId !== medewerker.Username) {
            console.log('⚠️ Context menu opened for different employee than selection. Selection employee:', selection.medewerkerId, 'Context menu employee:', medewerker.Username);
        }

        const currentUsername = currentUser?.LoginName?.split('|')[1] || currentUser?.LoginName;
        const menuItems = [];

        // If there's an existing item, show edit/delete options
        if (item) {
            console.log('🔍 Existing item found, checking permissions for edit/delete');
            
            // Check if user can modify this item
            const canModify = await canUserModifyItem(item, currentUsername);
            console.log('🔐 User can modify item:', canModify);
            
            if (canModify) {
                // Determine item type and add appropriate edit option
                const isVerlof = 'RedenId' in item;
                const isZittingsvrij = 'ZittingsVrijeDagTijd' in item;
                const isCompensatie = 'StartCompensatieUren' in item;
                
                if (isVerlof) {
                    menuItems.push({
                        label: 'Verlof bewerken',
                        icon: 'fa-edit',
                        onClick: (context) => {
                            console.log('✏️ Verlof bewerken clicked with context:', context);
                            const itemData = context?.contextData?.item || item;
                            const employeeData = context?.contextData?.medewerker || medewerker;
                            
                            setSelection({
                                start: new Date(itemData.StartDatum),
                                end: new Date(itemData.EindDatum),
                                medewerkerId: itemData.MedewerkerID,
                                itemData: itemData,
                                medewerkerData: employeeData
                            });
                            setIsVerlofModalOpen(true);
                            setContextMenu(null);
                        }
                    });
                } else if (isZittingsvrij) {
                    menuItems.push({
                        label: 'Zittingsvrij bewerken',
                        icon: 'fa-edit',
                        onClick: (context) => {
                            console.log('✏️ Zittingsvrij bewerken clicked with context:', context);
                            const itemData = context?.contextData?.item || item;
                            const employeeData = context?.contextData?.medewerker || medewerker;
                            
                            setSelection({
                                start: new Date(itemData.StartDatum),
                                end: new Date(itemData.EindDatum),
                                medewerkerId: itemData.Gebruikersnaam,
                                itemData: itemData,
                                medewerkerData: employeeData
                            });
                            setIsZittingsvrijModalOpen(true);
                            setContextMenu(null);
                        }
                    });
                } else if (isCompensatie) {
                    menuItems.push({
                        label: 'Compensatie uren bewerken',
                        icon: 'fa-edit',
                        onClick: (context) => {
                            console.log('✏️ Compensatie uren bewerken clicked with context:', context);
                            const itemData = context?.contextData?.item || item;
                            const employeeData = context?.contextData?.medewerker || medewerker;
                            
                            setSelection({
                                start: new Date(itemData.StartCompensatieUren),
                                end: new Date(itemData.EindeCompensatieUren),
                                medewerkerId: itemData.MedewerkerID,
                                itemData: itemData,
                                medewerkerData: employeeData
                            });
                            setIsCompensatieModalOpen(true);
                            setContextMenu(null);
                        }
                    });
                }

                // Add comment edit option for items that have comments
                if (item.Omschrijving || item.Opmerking || item.Comments) {
                    menuItems.push({
                        label: 'Commentaar bewerken',
                        icon: 'fa-comment-edit',
                        onClick: (context) => {
                            console.log('✏️ Commentaar bewerken clicked with context:', context);
                            const itemData = context?.contextData?.item || item;
                            
                            // Open a simple comment edit modal
                            const newComment = prompt('Bewerk commentaar:', itemData.Omschrijving || itemData.Opmerking || itemData.Comments || '');
                            if (newComment !== null) {
                                // Update the item with new comment
                                const updateData = { 
                                    ...itemData, 
                                    [itemData.Omschrijving !== undefined ? 'Omschrijving' : (itemData.Opmerking !== undefined ? 'Opmerking' : 'Comments')]: newComment 
                                };
                                
                                if (isVerlof) {
                                    handleVerlofSubmit(updateData);
                                } else if (isZittingsvrij) {
                                    handleZittingsvrijSubmit(updateData);
                                } else if (isCompensatie) {
                                    handleCompensatieSubmit(updateData);
                                }
                            }
                            setContextMenu(null);
                        }
                    });
                }

                // Add delete option
                menuItems.push({
                    label: 'Verwijderen',
                    icon: 'fa-trash',
                    onClick: async (context) => {
                        console.log('🗑️ Verwijderen clicked with context:', context);
                        const itemData = context?.contextData?.item || item;
                        
                        // Determine item type from the actual item being deleted
                        const isVerlofItem = 'RedenId' in itemData;
                        const isZittingsvrijItem = 'ZittingsVrijeDagTijd' in itemData;
                        const isCompensatieItem = 'StartCompensatieUren' in itemData;
                        
                        const itemDescription = isVerlofItem ? 'verlof aanvraag' : 
                                              isZittingsvrijItem ? 'zittingsvrij periode' : 
                                              isCompensatieItem ? 'compensatie uren' : 'item';
                        
                        if (confirm(`Weet je zeker dat je deze ${itemDescription} wilt verwijderen?`)) {
                            try {
                                console.log('🗑️ Deleting item:', itemData);
                                console.log('🗑️ Item type detection:', {
                                    isVerlof: isVerlofItem,
                                    isZittingsvrij: isZittingsvrijItem,
                                    isCompensatie: isCompensatieItem,
                                    itemId: itemData.ID || itemData.Id
                                });
                                
                                const listName = isVerlofItem ? 'Verlof' : 
                                               isZittingsvrijItem ? 'IncidenteelZittingVrij' : 
                                               isCompensatieItem ? 'CompensatieUren' : 'Unknown';
                                
                                console.log('🗑️ Using list name:', listName);
                                
                                await deleteSharePointListItem(
                                    listName,
                                    itemData.ID || itemData.Id
                                );
                                
                                // Refresh data after deletion - only refresh the specific data type
                                try {
                                    if (listName === 'Verlof') {
                                        const verlofData = await loadFilteredData(fetchSharePointList, 'Verlof', 'verlof', weergaveType, huidigJaar, weergaveType === 'week' ? huidigWeek : huidigMaand);
                                        setVerlofItems((verlofData || []).map(v => ({ ...v, StartDatum: createLocalDate(v.StartDatum), EindDatum: createLocalDate(v.EindDatum) })));
                                    } else if (listName === 'IncidenteelZittingVrij') {
                                        const zittingsvrijData = await loadFilteredData(fetchSharePointList, 'IncidenteelZittingVrij', 'zittingsvrij', weergaveType, huidigJaar, weergaveType === 'week' ? huidigWeek : huidigMaand);
                                        setZittingsvrijItems((zittingsvrijData || []).map(z => ({ ...z, StartDatum: createLocalDate(z.ZittingsVrijeDagTijd), EindDatum: createLocalDate(z.ZittingsVrijeDagTijdEind) })));
                                    } else if (listName === 'CompensatieUren') {
                                        const compensatieData = await loadFilteredData(fetchSharePointList, 'CompensatieUren', 'compensatie', weergaveType, huidigJaar, weergaveType === 'week' ? huidigWeek : huidigMaand);
                                        setCompensatieUrenItems((compensatieData || []).map(c => ({
                                            ...c,
                                            StartCompensatieUren: createLocalDate(c.StartCompensatieUren),
                                            EindeCompensatieUren: createLocalDate(c.EindeCompensatieUren)
                                        })));
                                    }
                                    console.log(`✅ ${listName} data refreshed after deletion`);
                                } catch (error) {
                                    console.error(`❌ Error refreshing ${listName} data:`, error);
                                    // Fallback to full refresh if targeted refresh fails
                                    clearAllCache();
                                    await silentRefreshData(true);
                                }
                                console.log('✅ Item deleted successfully');
                            } catch (error) {
                                console.error('❌ Error deleting item:', error);
                                console.error('❌ Error details:', {
                                    message: error.message,
                                    stack: error.stack,
                                    itemData: itemData,
                                    itemId: itemData.ID || itemData.Id
                                });
                                alert(`Fout bij verwijderen: ${error.message || 'Onbekende fout'}`);
                            }
                        }
                        setContextMenu(null);
                    }
                });
            }

            // Add separator if we have edit options
            if (menuItems.length > 0) {
                menuItems.push({ 
                    label: '---', 
                    disabled: true 
                });
            }
        }

        // Always show "Nieuw" options
        menuItems.push({
            label: 'Nieuw',
            icon: 'fa-plus',
            subItems: [
                {
                    label: 'Verlof aanvragen',
                    icon: 'fa-calendar-plus',
                    onClick: (context) => {
                        console.log('🏖️ Context menu Verlof clicked with context:', context);
                        
                        // Use context data if provided, fallback to closure values
                        const employeeData = context?.contextData?.medewerker || medewerker;
                        const dateData = context?.contextData?.dag || dag;
                        const selectionData = context?.selection || selection;
                        const firstClickState = context?.firstClickData || firstClickData;
                        
                        console.log('🏖️ Using data:', {
                            employee: employeeData?.Username,
                            date: dateData?.toDateString(),
                            hasSelection: !!selectionData,
                            hasFirstClick: !!firstClickState
                        });
                        
                        // Use existing selection if available, valid, and for the same employee
                        if (selectionData && selectionData.start && selectionData.end && selectionData.medewerkerId && selectionData.medewerkerId === employeeData.Username) {
                            console.log('🏖️ Context menu Verlof clicked. Using existing selection for same employee:', selectionData);
                            // Keep existing selection as-is - this respects the two-click selection
                        } else if (firstClickState && firstClickState.medewerker && firstClickState.medewerker.Username === employeeData.Username) {
                            // If we have a first click for this employee, use it as start and current date as end
                            const startDate = new Date(firstClickState.dag);
                            const endDate = new Date(dateData);
                            const actualStart = startDate <= endDate ? startDate : endDate;
                            const actualEnd = startDate <= endDate ? endDate : startDate;
                            
                            const rangeSelection = {
                                start: actualStart,
                                end: actualEnd,
                                medewerkerId: employeeData.Username,
                                medewerkerData: employeeData
                            };
                            console.log('🏖️ Context menu Verlof: Using two-click range selection:', rangeSelection);
                            setSelection(rangeSelection);
                            setFirstClickData(null); // Clear first click data
                        } else {
                            const currentSelection = {
                                start: dateData,
                                end: dateData,
                                medewerkerId: employeeData.Username,
                                medewerkerData: employeeData
                            };
                            console.log('🏖️ Context menu Verlof clicked. Creating single-day selection:', currentSelection);
                            if (selectionData && selectionData.medewerkerId !== employeeData.Username) {
                                console.log('🔄 Switching from employee', selectionData.medewerkerId, 'to', employeeData.Username);
                            }
                            setSelection(currentSelection);
                        }
                            setIsVerlofModalOpen(true);
                        setContextMenu(null);
                    }
                },
                {
                    label: 'Ziek melden',
                    icon: 'fa-notes-medical',
                    onClick: (context) => {
                        console.log('🏥 Context menu Ziekte clicked with context:', context);
                        
                        // Use context data if provided, fallback to closure values
                        const employeeData = context?.contextData?.medewerker || medewerker;
                        const dateData = context?.contextData?.dag || dag;
                        const selectionData = context?.selection || selection;
                        const firstClickState = context?.firstClickData || firstClickData;
                        
                        console.log('🏥 Using data:', {
                            employee: employeeData?.Username,
                            date: dateData?.toDateString(),
                            hasSelection: !!selectionData,
                            hasFirstClick: !!firstClickState
                        });
                        
                        // Use existing selection if available, valid, and for the same employee
                        if (selectionData && selectionData.start && selectionData.end && selectionData.medewerkerId && selectionData.medewerkerId === employeeData.Username) {
                            console.log('🏥 Context menu Ziekte: Using existing selection for same employee:', selectionData);
                            finalSelection = selectionData;
                        } else if (firstClickState && firstClickState.medewerker && firstClickState.medewerker.Username === employeeData.Username) {
                            // If we have a first click for this employee, use it as start and current date as end
                            const startDate = new Date(firstClickState.dag);
                            const endDate = new Date(dateData);
                            const actualStart = startDate <= endDate ? startDate : endDate;
                            const actualEnd = startDate <= endDate ? endDate : startDate;
                            
                            finalSelection = {
                                start: actualStart,
                                end: actualEnd,
                                medewerkerId: employeeData.Username,
                                medewerkerData: employeeData
                            };
                            console.log('🏥 Context menu Ziekte: Using two-click range selection:', finalSelection);
                            setFirstClickData(null); // Clear first click data
                        } else {
                            finalSelection = {
                                start: dateData,
                                end: dateData,
                                medewerkerId: employeeData.Username,
                                medewerkerData: employeeData
                            };
                            console.log('🏥 Context menu Ziekte: Creating single-day selection:', finalSelection);
                            if (selectionData && selectionData.medewerkerId !== employeeData.Username) {
                                console.log('🔄 Switching from employee', selectionData.medewerkerId, 'to', employeeData.Username);
                            }
                        }
                        
                        // Ensure selection is set before opening modal
                        setSelection(finalSelection);
                        
                        // Use setTimeout to ensure state update completes before opening modal
                        setTimeout(() => {
                            console.log('🏥 Opening Ziekte modal with final selection:', finalSelection);
                            setIsZiekModalOpen(true);
                        }, 0);
                        setContextMenu(null);
                    }
                },
                {
                    label: 'Compensatieuren doorgeven',
                    icon: './icons/compensatieuren/neutraleuren.svg',
                    iconType: 'svg',
                    onClick: (context) => {
                        console.log('⏰ Context menu Compensatie clicked with context:', context);
                        
                        // Use context data if provided, fallback to closure values
                        const employeeData = context?.contextData?.medewerker || medewerker;
                        const dateData = context?.contextData?.dag || dag;
                        const selectionData = context?.selection || selection;
                        const firstClickState = context?.firstClickData || firstClickData;
                        
                        console.log('⏰ Using data:', {
                            employee: employeeData?.Username,
                            date: dateData?.toDateString(),
                            hasSelection: !!selectionData,
                            hasFirstClick: !!firstClickState
                        });
                        
                        // Determine the correct selection to use
                        let finalSelection = null;
                        
                        // Use existing selection if available, valid, and for the same employee
                        if (selectionData && selectionData.start && selectionData.end && selectionData.medewerkerId && selectionData.medewerkerId === employeeData.Username) {
                            console.log('⏰ Context menu Compensatie: Using existing selection for same employee:', selectionData);
                            finalSelection = selectionData;
                        } else if (firstClickState && firstClickState.medewerker && firstClickState.medewerker.Username === employeeData.Username) {
                            // If we have a first click for this employee, use it as start and current date as end
                            const startDate = new Date(firstClickState.dag);
                            const endDate = new Date(dateData);
                            const actualStart = startDate <= endDate ? startDate : endDate;
                            const actualEnd = startDate <= endDate ? endDate : startDate;
                            
                            finalSelection = {
                                start: actualStart,
                                end: actualEnd,
                                medewerkerId: employeeData.Username,
                                medewerkerData: employeeData
                            };
                            console.log('⏰ Context menu Compensatie: Using two-click range selection:', finalSelection);
                            setFirstClickData(null); // Clear first click data
                        } else {
                            finalSelection = {
                                start: dateData,
                                end: dateData,
                                medewerkerId: employeeData.Username,
                                medewerkerData: employeeData
                            };
                            console.log('⏰ Context menu Compensatie: Creating single-day selection:', finalSelection);
                            if (selectionData && selectionData.medewerkerId !== employeeData.Username) {
                                console.log('🔄 Switching from employee', selectionData.medewerkerId, 'to', employeeData.Username);
                            }
                        }
                        
                        // Ensure selection is set before opening modal
                        setSelection(finalSelection);
                        
                        // Use setTimeout to ensure state update completes before opening modal
                        setTimeout(() => {
                            console.log('⏰ Opening Compensatie modal with final selection:', finalSelection);
                            setIsCompensatieModalOpen(true);
                        }, 0);
                        setContextMenu(null);
                    }
                },
                {
                    label: 'Zittingsvrij maken',
                    icon: 'fa-gavel',
                    onClick: (context) => {
                        console.log('⚖️ Context menu Zittingsvrij clicked with context:', context);
                        
                        // Use context data if provided, fallback to closure values
                        const employeeData = context?.contextData?.medewerker || medewerker;
                        const dateData = context?.contextData?.dag || dag;
                        const selectionData = context?.selection || selection;
                        const firstClickState = context?.firstClickData || firstClickData;
                        
                        console.log('⚖️ Using data:', {
                            employee: employeeData?.Username,
                            date: dateData?.toDateString(),
                            hasSelection: !!selectionData,
                            hasFirstClick: !!firstClickState
                        });
                        
                        // Determine the correct selection to use
                        let finalSelection = null;
                        
                        // Use existing selection if available, valid, and for the same employee
                        if (selectionData && selectionData.start && selectionData.end && selectionData.medewerkerId && selectionData.medewerkerId === employeeData.Username) {
                            console.log('⚖️ Context menu Zittingsvrij: Using existing selection for same employee:', selectionData);
                            finalSelection = selectionData;
                        } else if (firstClickState && firstClickState.medewerker && firstClickState.medewerker.Username === employeeData.Username) {
                            // If we have a first click for this employee, use it as start and current date as end
                            const startDate = new Date(firstClickState.dag);
                            const endDate = new Date(dateData);
                            const actualStart = startDate <= endDate ? startDate : endDate;
                            const actualEnd = startDate <= endDate ? endDate : startDate;
                            
                            finalSelection = {
                                start: actualStart,
                                end: actualEnd,
                                medewerkerId: employeeData.Username,
                                medewerkerData: employeeData
                            };
                            console.log('⚖️ Context menu Zittingsvrij: Using two-click range selection:', finalSelection);
                            setFirstClickData(null); // Clear first click data
                        } else {
                            finalSelection = {
                                start: dateData,
                                end: dateData,
                                medewerkerId: employeeData.Username,
                                medewerkerData: employeeData
                            };
                            console.log('⚖️ Context menu Zittingsvrij: Creating single-day selection:', finalSelection);
                            if (selectionData && selectionData.medewerkerId !== employeeData.Username) {
                                console.log('🔄 Switching from employee', selectionData.medewerkerId, 'to', employeeData.Username);
                            }
                        }
                        
                        // Ensure selection is set before opening modal
                        setSelection(finalSelection);
                        
                        // Use setTimeout to ensure state update completes before opening modal
                        setTimeout(() => {
                            console.log('⚖️ Opening Zittingsvrij modal with final selection:', finalSelection);
                            setIsZittingsvrijModalOpen(true);
                        }, 0);
                        setContextMenu(null);
                    }
                }
            ]
        });

        // Add cancel option
        menuItems.push({
            label: 'Annuleren',
            icon: 'fa-times',
            onClick: (context) => {
                console.log('Annuleren clicked with context:', context);
                setContextMenu(null);
            }
        });

        console.log('Final context menu items:', menuItems);
        console.log('🎯 Setting context menu with state:', {
            hasFirstClickData: !!firstClickData,
            hasSelection: !!selection,
            firstClickData: firstClickData ? {
                employee: firstClickData.medewerker?.Username,
                date: firstClickData.dag?.toDateString()
            } : null,
            selection: selection ? {
                employee: selection.medewerkerId,
                start: selection.start?.toDateString(),
                end: selection.end?.toDateString()
            } : null
        });
        
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            items: menuItems,
            onClose: () => setContextMenu(null),
            currentUsername: currentUsername,
            firstClickData: firstClickData,
            selection: selection,
            contextData: {
                medewerker: medewerker,
                dag: dag,
                item: item
            }
        });
    }, [medewerkers, currentUser, canUserModifyItem, handleVerlofSubmit, handleZittingsvrijSubmit, handleCompensatieSubmit, silentRefreshData]);

    // Computed values
    const ziekteRedenId = useMemo(() => {
        if (!shiftTypes || Object.keys(shiftTypes).length === 0) return null;
        const ziekteType = Object.values(shiftTypes).find(st => st.label && st.label.toLowerCase() === 'ziekte');
        return ziekteType ? ziekteType.id : null;
    }, [shiftTypes]);

    // Helper functions and computed values
    const urenPerWeekByMedewerker = useMemo(() => {
        const map = {};
       
        // Filter out items with invalid dates first
        const validItems = urenPerWeekItems.filter(item =>
            item.Ingangsdatum instanceof Date && !isNaN(item.Ingangsdatum.getTime())
        );
       
        // Group items by medewerker
        for (const item of validItems) {
            if (!map[item.MedewerkerID]) {
                map[item.MedewerkerID] = [];
            }
            map[item.MedewerkerID].push(item);
        }
       
        // Sort each employee's records by Ingangsdatum (newest first)
        // This is just for organizing the initial data - the actual selection
        // logic is in getUrenPerWeekForDate
        for (const medewerkerId in map) {
            map[medewerkerId].sort((a, b) => b.Ingangsdatum - a.Ingangsdatum);
           
            // Process grouped records for employees with rotating schedules
        }
       
        return map;
    }, [urenPerWeekItems]);

    const getUrenPerWeekForDate = useCallback((medewerkerId, date) => {
        const schedules = urenPerWeekByMedewerker[medewerkerId];
        if (!schedules) return null;
       
        // Normalize the input date for proper comparison
        let normalizedDate;
        try {
            normalizedDate = new Date(date);
            normalizedDate.setHours(0, 0, 0, 0);
        } catch (error) {
            console.error('Error normalizing date in getUrenPerWeekForDate:', error, date);
            return null;
        }
       
        // Sort the applicable records by Ingangsdatum (newest first)
        // We need to find the most recent record where Ingangsdatum <= target date
        const applicableRecords = schedules
            .filter(s => {
                // Ensure valid date object
                if (!(s.Ingangsdatum instanceof Date) || isNaN(s.Ingangsdatum.getTime())) {
                    console.warn(`Invalid Ingangsdatum for record ID ${s.Id} for medewerker ${medewerkerId}:`, s.Ingangsdatum);
                    return false;
                }
                // Only include records where Ingangsdatum is on or before our target date
                const isApplicable = s.Ingangsdatum <= normalizedDate;
                if (medewerkerId.toLowerCase().includes('rauf') && Math.random() < 0.01) {  // Only log occasionally for Rauf
                    console.log(`UrenPerWeek comparison for ${medewerkerId} on ${normalizedDate.toLocaleDateString()}:`,
                        `Record ID ${s.Id} with date ${s.Ingangsdatum.toLocaleDateString()} is ${isApplicable ? 'applicable' : 'not applicable'}`);
                }
                return isApplicable;
            })
            .sort((a, b) => b.Ingangsdatum - a.Ingangsdatum);
       
        // If no applicable records found, return null
        if (applicableRecords.length === 0) {
            if (medewerkerId.toLowerCase().includes('rauf') && Math.random() < 0.01) {
                console.log(`⚠️ No applicable UrenPerWeek record found for ${medewerkerId} on ${normalizedDate.toLocaleDateString()}`);
            }
            return null;
        }
       
        // Check if this employee has rotating schedules
        const hasRotatingSchedule = applicableRecords.some(record => record.IsRotatingSchedule === true);
       
        if (hasRotatingSchedule) {
            // For rotating schedules, we need to find the correct schedule period and week type
            // Group records by schedule period (same Ingangsdatum + IsRotatingSchedule)
            const schedulePeriodsMap = new Map();
           
            for (const record of applicableRecords) {
                const periodKey = `${record.Ingangsdatum.getTime()}_${record.IsRotatingSchedule}`;
               
                if (!schedulePeriodsMap.has(periodKey)) {
                    schedulePeriodsMap.set(periodKey, {
                        ingangsdatum: record.Ingangsdatum,
                        isRotating: record.IsRotatingSchedule,
                        cycleStartDate: record.CycleStartDate,
                        records: []
                    });
                }
               
                schedulePeriodsMap.get(periodKey).records.push(record);
            }
           
            // Convert to array and sort by date (newest first)
            const schedulePeriods = Array.from(schedulePeriodsMap.values())
                .sort((a, b) => b.ingangsdatum - a.ingangsdatum);
           
            // Find the most recent period that applies to our target date
            let selectedPeriod = null;
           
            for (const period of schedulePeriods) {
                if (period.ingangsdatum <= normalizedDate) {
                    selectedPeriod = period;
                    break;
                }
            }
           
            if (!selectedPeriod) {
                console.warn(`⚠️ No applicable schedule period found for ${medewerkerId} on ${normalizedDate.toLocaleDateString()}`);
                return null;
            }
           
            // Enhanced Week B lookup processing
           
            if (selectedPeriod.isRotating) {
                // This is a rotating schedule period - find the correct week type
                const cycleStartDate = selectedPeriod.cycleStartDate || selectedPeriod.ingangsdatum;
                const requiredWeekType = calculateWeekType(normalizedDate, cycleStartDate);
               
                // Week type lookup in rotating period
               
                // Find the record for this week type in this period
                const weekTypeRecord = selectedPeriod.records.find(record => {
                    // Ensure case-insensitive comparison
                    const recordWeekType = record.WeekType ? String(record.WeekType).trim().toUpperCase() : null;
                    return recordWeekType === requiredWeekType.toUpperCase();
                });
               
                if (weekTypeRecord) {
                    if (medewerkerId.toLowerCase().includes('rauf') || Math.random() < 0.1) {
                        console.log(`✅ Found Week ${requiredWeekType} record for ${medewerkerId}: ID ${weekTypeRecord.Id}`);
                    }
                    return weekTypeRecord;
                } else {
                    // Enhanced error logging
                    console.error(`❌ Could not find Week ${requiredWeekType} record for ${medewerkerId} on ${normalizedDate.toLocaleDateString()}`);
                    console.error(`❌ Available WeekTypes in period:`, selectedPeriod.records.map(r => r.WeekType));
                    console.error(`❌ CycleStartDate used for calculation: ${cycleStartDate.toLocaleDateString()}`);
                   
                    // Fall back to any available record from this period
                    console.warn(`⚠️ Could not find Week ${requiredWeekType} record for ${medewerkerId}, falling back to available record`);
                    return selectedPeriod.records[0];
                }
            } else {
                // This is a non-rotating schedule period that happens to be in a list with rotating schedules
                console.log(`✅ Using non-rotating record from mixed schedule for ${medewerkerId}: ID ${selectedPeriod.records[0].Id}`);
                return selectedPeriod.records[0];
            }
        } else {
            // For non-rotating schedules, use the most recent applicable record
            const selectedRecord = applicableRecords[0];
           
            console.log(`✅ Selected standard UrenPerWeek record for ${medewerkerId} on ${normalizedDate.toLocaleDateString()}: Record ID ${selectedRecord.Id} from ${selectedRecord.Ingangsdatum.toLocaleDateString()}`);
            return selectedRecord;
        }
    }, [urenPerWeekByMedewerker]);

    const compensatieMomentenByDate = useMemo(() => {
        const moments = {};
        const addMoment = (date, type, item) => {
            if (!date || isNaN(date)) return; // Skip invalid dates
            // Extract date part as UTC to avoid timezone conversion issues
            const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const key = utcDate.toISOString().split('T')[0];
            if (!moments[key]) {
                moments[key] = [];
            }
            moments[key].push({ type, item });
        };

        compensatieUrenItems.forEach(item => {
            if (item.Ruildag === true) {
                addMoment(item.StartCompensatieUren, 'ruildag-gewerkt', item);
                if (item.ruildagStart) {
                    addMoment(item.ruildagStart, 'ruildag-vrij', item);
                }
            } else {
                addMoment(item.StartCompensatieUren, 'compensatie', item);
            }
        });
        return moments;
    }, [compensatieUrenItems]);

    const getCompensatieMomentenVoorDag = useCallback((datum) => {
        // Use the same UTC date key format as addMoment function to ensure consistency
        const utcDate = new Date(Date.UTC(datum.getFullYear(), datum.getMonth(), datum.getDate()));
        const key = utcDate.toISOString().split('T')[0];
        return compensatieMomentenByDate[key] || [];
    }, [compensatieMomentenByDate]);

    const getVerlofVoorDag = useCallback((medewerkerUsername, datum) => {
        if (!medewerkerUsername) return null;
        const datumCheck = new Date(datum).setHours(12, 0, 0, 0);
        return verlofItems.find(v => v.MedewerkerID === medewerkerUsername && v.Status !== 'Afgewezen' && datumCheck >= new Date(v.StartDatum).setHours(12, 0, 0, 0) && datumCheck <= new Date(v.EindDatum).setHours(12, 0, 0, 0));
    }, [verlofItems]);

    const getZittingsvrijVoorDag = useCallback((medewerkerUsername, datum) => {
        if (!medewerkerUsername) return null;
        const datumCheck = new Date(datum).setHours(12, 0, 0, 0);
        return zittingsvrijItems.find(z => z.Gebruikersnaam === medewerkerUsername && datumCheck >= new Date(z.StartDatum).setHours(12, 0, 0, 0) && datumCheck <= new Date(z.EindDatum).setHours(12, 0, 0, 0));
    }, [zittingsvrijItems]);

    const getCompensatieUrenVoorDag = useCallback((medewerkerUsername, dag) => {
        if (!medewerkerUsername || !compensatieUrenItems || compensatieUrenItems.length === 0) {
            return [];
        }

        // Normalize the calendar day to a UTC start and end for accurate comparison
        const dagStartUTC = new Date(Date.UTC(dag.getFullYear(), dag.getMonth(), dag.getDate(), 0, 0, 0));
        const dagEindUTC = new Date(Date.UTC(dag.getFullYear(), dag.getMonth(), dag.getDate(), 23, 59, 59));

        return compensatieUrenItems.filter(item => {
            if (item.MedewerkerID !== medewerkerUsername) {
                return false;
            }

            // Parse SharePoint dates directly as Date objects (they are already in UTC)
            const startCompensatie = new Date(item.StartCompensatieUren);
            const eindeCompensatie = new Date(item.EindeCompensatieUren);

            // Check if the compensation period overlaps with the current day (in UTC)
            return startCompensatie <= dagEindUTC && eindeCompensatie >= dagStartUTC;
        });
    }, [compensatieUrenItems]);

    const periodeData = useMemo(() => {
        return weergaveType === 'week' ? getDagenInWeek(huidigWeek, huidigJaar) : getDagenInMaand(huidigMaand, huidigJaar);
    }, [weergaveType, huidigWeek, huidigMaand, huidigJaar]);

    const volgende = () => { if (weergaveType === 'week') { const maxWeken = getWekenInJaar(huidigJaar); if (huidigWeek >= maxWeken) { setHuidigWeek(1); setHuidigJaar(huidigJaar + 1); } else { setHuidigWeek(huidigWeek + 1); } } else { if (huidigMaand === 11) { setHuidigMaand(0); setHuidigJaar(huidigJaar + 1); } else { setHuidigMaand(huidigMaand + 1); } } };
    const vorige = () => { if (weergaveType === 'week') { if (huidigWeek === 1) { const vorigJaar = huidigJaar - 1; setHuidigWeek(getWekenInJaar(vorigJaar)); setHuidigJaar(vorigJaar); } else { setHuidigWeek(huidigWeek - 1); } } else { if (huidigMaand === 0) { setHuidigMaand(11); setHuidigJaar(huidigJaar - 1); } else { setHuidigMaand(huidigMaand - 1); } } };

    // Toggle sort direction for medewerkers
    const toggleSortDirection = () => {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    // =====================
    // Helper: Check if a date is in the current selection for a medewerker
    // =====================
    function isDateInSelection(dag, medewerkerUsername) {
        if (!selection || !selection.start || !selection.end || !selection.medewerkerId) return false;
        // Only highlight if the medewerker matches
        if (medewerkerUsername !== selection.medewerkerId) return false;
        // Compare only the date part (ignore time)
        const d = new Date(dag);
        d.setHours(0, 0, 0, 0);
        const s = new Date(selection.start);
        s.setHours(0, 0, 0, 0);
        const e = new Date(selection.end);
        e.setHours(0, 0, 0, 0);
        return d >= s && d <= e;
    }
    
    // Initialize the tooltip manager when the component mounts
    useEffect(() => {
        // Start the TooltipManager system
        console.log('🔍 Starting TooltipManager from RoosterApp');
        if (typeof TooltipManager !== 'undefined' && TooltipManager.start) {
            TooltipManager.start();
        }
    }, []);
   
    // Initialize profile cards after data is loaded
    useEffect(() => {
        if (!loading && medewerkers.length > 0) {
            setTimeout(() => {
                if (typeof ProfielKaarten !== 'undefined' && ProfielKaarten.init) {
                    ProfielKaarten.init();
                }
            }, 500);
        }
    }, [loading, medewerkers]);

    // Trigger tooltip re-attachment after data loads and DOM updates
    useEffect(() => {
        if (!loading && medewerkers.length > 0) {
            // Allow React to finish rendering before attaching tooltips
            setTimeout(() => {
                console.log('🔄 Triggering tooltip re-attachment after data load');
                if (typeof TooltipManager !== 'undefined' && TooltipManager.autoAttachTooltips) {
                    TooltipManager.autoAttachTooltips();
                }
                
                // Dispatch custom event for any components listening
                const event = new CustomEvent('react-update', {
                    detail: { 
                        verlofItems: verlofItems.length, 
                        compensatieItems: compensatieUrenItems.length,
                        zittingsvrijItems: zittingsvrijItems.length 
                    }
                });
                window.dispatchEvent(event);
            }, 200);
        }
    }, [loading, verlofItems, compensatieUrenItems, zittingsvrijItems, medewerkers, huidigMaand, huidigJaar, weergaveType]);

    // Check if required services are available
    useEffect(() => {
        if (typeof fetchSharePointList !== 'function') {
            setError('Required services not available. Please refresh the page.');
            setLoading(false);
        }
    }, []);

    // Expose tutorial functions globally
    useEffect(() => {
        window.startTutorial = () => {
            if (typeof roosterTutorial !== 'undefined' && roosterTutorial.start) {
                roosterTutorial.start();
            }
        };

        window.openHandleiding = (section = 'algemeen') => {
            if (typeof openHandleiding === 'function') {
                openHandleiding(section);
            }
        };

        document.addEventListener('tutorial-completed', () => {
            console.log('Tutorial completed');
        }, { once: true });

        document.addEventListener('handleiding-closed', () => {
            console.log('Handleiding closed');
        }, { once: true });

        return () => {
            delete window.startTutorial;
            delete window.openHandleiding;
        };
    }, []);

    // Functies voor het openen van de modals
    const handleVrijvragen = useCallback((start, end, medewerkerId) => {
        console.log('handleVrijvragen called:', { start, end, medewerkerId });
        setSelection({ start, end, medewerkerId });
        setIsVerlofModalOpen(true);
    }, []);

    const handleZiekMelden = useCallback((start, end, medewerkerId) => {
        console.log('handleZiekMelden called:', { start, end, medewerkerId });
        setSelection({ start, end, medewerkerId });
        setIsZiekModalOpen(true);
    }, []);

    const handleCompensatie = useCallback((start, end, medewerkerId) => {
        console.log('handleCompensatie called:', { start, end, medewerkerId });
        setSelection({ start, end, medewerkerId });
        setIsCompensatieModalOpen(true);
    }, []);

    const handleZittingsvrij = useCallback((start, end, medewerkerId) => {
        console.log('handleZittingsvrij called:', { start, end, medewerkerId });
        setSelection({ start, end, medewerkerId });
        setIsZittingsvrijModalOpen(true);
    }, []);

    const handleNieuweMededeling = useCallback(() => {
        console.log('🔔 Nieuwe mededeling button clicked');
        // Call the Mededelingen component to show the create form
        if (mededelingenRef.current && mededelingenRef.current.showCreateForm) {
            mededelingenRef.current.showCreateForm();
        }
    }, []);

    // Calendar cell click handler with two-click selection support
    function handleCellClick(medewerker, dag, specificItem = null) {
        // If a specific item is provided (e.g., compensatie item), open the appropriate modal directly
        if (specificItem) {
            console.log('Opening modal for specific item:', specificItem);
            const { type } = (() => {
                if ('RedenId' in specificItem) return { type: 'verlof' };
                if ('ZittingsVrijeDagTijd' in specificItem) return { type: 'zittingsvrij' };
                if ('StartCompensatieUren' in specificItem) return { type: 'compensatie' };
                if ('Status' in specificItem && specificItem.Status === 'Ziek') return { type: 'ziekte' };
                return { type: null };
            })();

            const targetMedewerker = medewerkers.find(m => m.Username === medewerker.Username);

            if (type === 'compensatie') {
                setSelection({
                    start: new Date(specificItem.StartCompensatieUren),
                    end: new Date(specificItem.EindeCompensatieUren),
                    medewerkerId: specificItem.MedewerkerID,
                    itemData: specificItem,
                    medewerkerData: targetMedewerker
                });
                setIsCompensatieModalOpen(true);
                return;
            } else if (type === 'verlof') {
                setSelection({
                    start: new Date(specificItem.StartDatum),
                    end: new Date(specificItem.EindDatum),
                    medewerkerId: specificItem.MedewerkerID,
                    itemData: specificItem,
                    medewerkerData: targetMedewerker
                });
                setIsVerlofModalOpen(true);
                return;
            } else if (type === 'zittingsvrij') {
                setSelection({
                    start: new Date(specificItem.StartDatum),
                    end: new Date(specificItem.EindDatum),
                    medewerkerId: specificItem.Gebruikersnaam,
                    itemData: specificItem,
                    medewerkerData: targetMedewerker
                });
                setIsZittingsvrijModalOpen(true);
                return;
            } else if (type === 'ziekte') {
                setSelection({
                    start: new Date(specificItem.StartDatum),
                    end: new Date(specificItem.EindDatum),
                    medewerkerId: specificItem.MedewerkerID,
                    itemData: specificItem,
                    medewerkerData: targetMedewerker
                });
                setIsZiekModalOpen(true);
                return;
            }
        }

        // Regular cell click behavior (date range selection)
        if (!firstClickData) {
            // First click: Set start of selection
            console.log(`📅 First click: Selected start date ${dag.toDateString()} for ${medewerker.Username}`);
            setFirstClickData({ medewerker, dag });
            setSelection({ start: dag, end: dag, medewerkerId: medewerker.Username });

            // Show tooltip after first click
            setShowTooltip(true);

            // Auto-hide tooltip after 5 seconds
            if (tooltipTimeout) {
                clearTimeout(tooltipTimeout);
            }

            const timeout = setTimeout(() => {
                setShowTooltip(false);
            }, 5000);
            setTooltipTimeout(timeout);

        } else if (firstClickData.medewerker.Username === medewerker.Username) {
            // Second click on same employee: Set end of selection
            const startDate = new Date(firstClickData.dag);
            const endDate = new Date(dag);
            const actualStart = startDate <= endDate ? startDate : endDate;
            const actualEnd = startDate <= endDate ? endDate : startDate;

            console.log(`📅 Second click: Date range selected from ${actualStart.toDateString()} to ${actualEnd.toDateString()} for ${medewerker.Username}`);
            setSelection({
                start: actualStart,
                end: actualEnd,
                medewerkerId: medewerker.Username
            });
            setFirstClickData(null); // Reset for next selection
            setShowTooltip(false); // Hide tooltip after selection is complete

            if (tooltipTimeout) {
                clearTimeout(tooltipTimeout);
                setTooltipTimeout(null);
            }
        } else {
            // Click on different employee: Start new selection
            setFirstClickData({ medewerker, dag });
            setSelection({ start: dag, end: dag, medewerkerId: medewerker.Username });

            // Show tooltip for this new selection too
            setShowTooltip(true);

            // Auto-hide tooltip after 5 seconds
            if (tooltipTimeout) {
                clearTimeout(tooltipTimeout);
            }

            const timeout = setTimeout(() => {
                setShowTooltip(false);
            }, 5000);
            setTooltipTimeout(timeout);
        }
    }

    // Track selection changes for debugging
    useEffect(() => {
        console.log('🎯 Selection updated:', selection);
        if (selection) {
            console.log('📅 Start date:', selection.start?.toDateString());
            console.log('📅 End date:', selection.end?.toDateString());
            console.log('👤 Employee ID:', selection.medewerkerId);
            console.log('📋 Item data:', selection.itemData ? 'Has item data' : 'No item data');
        }
    }, [selection]);

    const gegroepeerdeData = useMemo(() => {
        // Ensure we have valid teams and medewerkers data before processing
        if (!teams || !Array.isArray(teams) || teams.length === 0) {
            console.log('⚠️ Teams data not yet available for grouping');
            return {};
        }
        
        if (!medewerkers || !Array.isArray(medewerkers)) {
            console.log('⚠️ Medewerkers data not yet available for grouping');
            return {};
        }

        const gefilterdeMedewerkers = medewerkers.filter(m => (!zoekTerm || m.naam.toLowerCase().includes(zoekTerm.toLowerCase())) && (!geselecteerdTeam || m.team === geselecteerdTeam));
        
        // Sort medewerkers by Title column from Medewerkers SharePoint list based on sortDirection
        const gesorteerdeFilters = gefilterdeMedewerkers.sort((a, b) => {
            // Use the Title field from the SharePoint Medewerkers list specifically
            const titleA = (a.Title || a.Naam || a.naam || 'Onbekend').toLowerCase().trim();
            const titleB = (b.Title || b.Naam || b.naam || 'Onbekend').toLowerCase().trim();
            
            if (sortDirection === 'asc') {
                return titleA.localeCompare(titleB, 'nl', { numeric: true, sensitivity: 'base' });
            } else {
                return titleB.localeCompare(titleA, 'nl', { numeric: true, sensitivity: 'base' });
            }
        });
        
        // Create grouped data with better error handling
        const data = teams.reduce((acc, team) => { 
            if (team && team.id) { 
                const teamMedewerkers = gesorteerdeFilters.filter(m => m.team === team.id);
                if (teamMedewerkers.length > 0) {
                    acc[team.id] = teamMedewerkers;
                    console.log(`👥 Team '${team.naam}' has ${teamMedewerkers.length} members`);
                }
            } 
            return acc; 
        }, {});
        
        const medewerkersZonderTeam = gesorteerdeFilters.filter(m => !m.team);
        if (medewerkersZonderTeam.length > 0) { 
            data['geen_team'] = medewerkersZonderTeam; 
            console.log(`👤 ${medewerkersZonderTeam.length} medewerkers without team`);
        }
        
        console.log(`📊 Grouped data created with ${Object.keys(data).length} teams`);
        return data;
    }, [medewerkers, teams, zoekTerm, geselecteerdTeam, sortDirection]);

    // Show loading state while refreshing data or if data is not ready
    if (loading || !periodeData || periodeData.length === 0 || !teams || teams.length === 0) {
        return h('div', {
            className: 'flex items-center justify-center min-h-screen bg-gray-50',
            style: { fontFamily: 'Inter, sans-serif' }
        },
            h('div', { className: 'text-center' },
                h('div', { className: 'loading-spinner', style: { margin: '0 auto 16px' } }),
                h('h2', { className: 'text-xl font-medium text-gray-900' }, 'Rooster wordt geladen...'),
                h('p', { className: 'text-gray-600 mt-2' }, 'Even geduld, we laden de roostergegevens.')
            )
        );
    }

    // Show error state if there's an error
    if (error) {
        return h('div', {
            className: 'flex items-center justify-center min-h-screen bg-gray-50',
            style: { fontFamily: 'Inter, sans-serif' }
        },
            h('div', { className: 'max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center' },
                h('div', { className: 'mb-6' },
                    h('div', {
                        className: 'mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4'
                    },
                        h('i', { className: 'fas fa-exclamation-triangle text-red-600' })
                    ),
                    h('h2', { className: 'text-xl font-semibold text-gray-900 mb-2' }, 'Fout bij laden'),
                    h('p', { className: 'text-gray-600' }, error)
                ),
                h('button', {
                    className: 'bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200',
                    onClick: () => window.location.reload()
                },
                    h('i', { className: 'fas fa-sync-alt mr-2' }),
                    'Pagina Vernieuwen'
                )
            )
        );
    }

    // Render de roosterkop en de medewerkerrijen
    return h('div', { className: 'app-container' },
        // Subtle background refresh indicator
        backgroundRefreshing && h('div', {
            className: 'background-refresh-indicator',
            style: {
                position: 'fixed',
                top: '10px',
                right: '20px',
                background: 'rgba(59, 130, 246, 0.9)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '500',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                animation: 'fadeInOut 0.3s ease-in-out'
            }
        },
            h('div', {
                style: {
                    width: '12px',
                    height: '12px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }
            }),
            'Gegevens bijwerken...'
        ),
        h('div', { className: 'sticky-header-container' },
            h('header', { id: 'header', className: 'header' },
                h('div', { className: 'header-content' },
                    // Left side - Melding button and title
                    h('div', { className: 'header-left' },
                        h('button', {
                            className: 'btn btn-melding',
                            onClick: () => window.location.href = 'pages/meldingMaken.aspx',
                            title: 'Melding Maken'
                        },
                            h('i', { className: 'fas fa-exclamation-triangle' }),
                            'Melding'
                        ),
                        h('h1', null, 'Verlofrooster')
                    ),
                    
                    // Right side - Admin buttons and dropdowns
                    h('div', { className: 'header-acties' },
                        h('div', { className: 'nav-buttons-right' },
                            permissions && !permissions.loading && permissions.isAdmin && h('button', {
                                className: 'btn btn-admin',
                                onClick: () => window.location.href = 'pages/adminCentrum/adminCentrumN.aspx',
                                title: 'Administratie Centrum'
                            },
                                h('i', { className: 'fas fa-cog' }),
                                'Admin'
                            ),
                            
                            permissions && !permissions.loading && permissions.isFunctional && h('button', {
                                className: 'btn btn-functional',
                                onClick: () => window.location.href = 'pages/beheerCentrum/beheerCentrumN.aspx',
                                title: 'Beheer Centrum'
                            },
                                h('i', { className: 'fas fa-tools' }),
                                'Beheer'
                            ),
                            
                            permissions && !permissions.loading && permissions.isTaakbeheer && h('button', {
                                className: 'btn btn-taakbeheer',
                                onClick: () => window.location.href = 'pages/behandelCentrum/behandelCentrumN.aspx',
                                title: 'Behandel Centrum'
                            },
                                h('i', { className: 'fas fa-clipboard-check' }),
                                'Behandelen'
                            ),
                            
                            // Help dropdown
                            h('div', { className: 'help-dropdown' },
                                h('button', {
                                    className: 'btn btn-help',
                                    onClick: () => setHelpDropdownOpen(!helpDropdownOpen),
                                    title: 'Hulp en documentatie'
                                },
                                    h('i', { className: 'fas fa-question-circle' }),
                                    'Help',
                                    h('i', {
                                        className: `fas fa-chevron-${helpDropdownOpen ? 'up' : 'down'}`,
                                        style: { fontSize: '0.8rem', marginLeft: '0.5rem' }
                                    })
                                ),
                                helpDropdownOpen && h('div', { className: 'help-dropdown-menu' },
                                    h('button', {
                                        className: 'help-dropdown-item',
                                        onClick: () => {
                                            if (window.startTutorial) window.startTutorial();
                                            setHelpDropdownOpen(false);
                                        }
                                    },
                                        h('i', { className: 'fas fa-route' }),
                                        h('div', { className: 'help-item-content' },
                                            h('span', { className: 'help-item-title' }, 'Interactieve tour'),
                                            h('span', { className: 'help-item-description' }, 'Ontdek de belangrijkste functies van het rooster')
                                        )
                                    ),
                                    h('button', {
                                        className: 'help-dropdown-item',
                                        onClick: () => {
                                            if (window.openHandleiding) window.openHandleiding();
                                            setHelpDropdownOpen(false);
                                        },
                                        title: 'Open uitgebreide handleiding'
                                    },
                                        h('i', { className: 'fas fa-book' }),
                                        h('div', { className: 'help-item-content' },
                                            h('span', { className: 'help-item-title' }, 'Handleiding'),
                                            h('span', { className: 'help-item-description' }, 'Uitgebreide documentatie en instructies')
                                        )
                                    )
                                )
                            ),
                            
                            // User dropdown with profile picture
                            h('div', { id: 'user-dropdown', className: 'user-dropdown' },
                                h('button', {
                                    className: 'btn btn-settings user-settings-btn',
                                    onClick: () => setSettingsDropdownOpen(!settingsDropdownOpen),
                                    title: 'Gebruikersinstellingen'
                                },
                                    h('img', {
                                        className: 'user-avatar-small',
                                        src: userInfo.pictureUrl,
                                        alt: userInfo.naam,
                                        onError: (e) => { e.target.onerror = null; e.target.src = '_layouts/15/userphoto.aspx?size=S'; }
                                    }),
                                    h('span', { className: 'user-name' }, userInfo.naam),
                                    h('i', {
                                        className: `fas fa-chevron-${settingsDropdownOpen ? 'up' : 'down'}`,
                                        style: { fontSize: '0.8rem', marginLeft: '0.5rem' }
                                    })
                                ),
                                settingsDropdownOpen && h('div', { className: 'user-dropdown-menu' },
                                    h('div', { className: 'dropdown-item-group' },
                                        h('button', {
                                            className: 'dropdown-item',
                                            onClick: () => {
                                                // Use consistent navigation with proper base URL
                                                const baseUrl = linkInfo.getBaseUrl();
                                                window.location.href = `${baseUrl}/pages/instellingenCentrum/instellingenCentrumN.aspx`;
                                            }
                                        },
                                            h('i', { className: 'fas fa-user-edit' }),
                                            h('div', { className: 'dropdown-item-content' },
                                                h('span', { className: 'dropdown-item-title' }, 'Persoonlijke instellingen'),
                                                h('span', { className: 'dropdown-item-description' }, 'Beheer uw profiel en voorkeuren')
                                            )
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            ),
            h('div', { id: 'toolbar', className: 'toolbar' },
                h(RoosterHeader, {
                    weergaveType,
                    setWeergaveType,
                    huidigWeek,
                    huidigJaar,
                    huidigMaand,
                    vorige,
                    volgende,
                    zoekTerm,
                    setZoekTerm,
                    geselecteerdTeam,
                    setGeselecteerdTeam,
                    teams,
                    canManageAnnouncements,
                    onNieuweMededeling: handleNieuweMededeling
                }),
                h(Mededelingen, {
                    teams,
                    ref: mededelingenRef
                }),
                h(Legenda, {
                    shiftTypes,
                    dagenIndicators
                })
            )
        ),
        h(RoosterGrid, {
            weergaveType,
            periodeData,
            createHeaderCells,
            gegroepeerdeData,
            teams,
            feestdagen,
            selection,
            firstClickData,
            showTooltip,
            isDateInSelection,
            getVerlofVoorDag,
            getZittingsvrijVoorDag,
            getCompensatieUrenVoorDag,
            getCompensatieMomentenVoorDag,
            getUrenPerWeekForDate,
            dagenIndicators,
            shiftTypes,
            handleCellClick,
            showContextMenu
        }),
        // Context menu
        contextMenu && h(ContextMenu, {
            x: contextMenu.x,
            y: contextMenu.y,
            items: contextMenu.items,
            onClose: () => setContextMenu(null),
            currentUsername: contextMenu.currentUsername,
            firstClickData: contextMenu.firstClickData,
            selection: contextMenu.selection,
            contextData: contextMenu.contextData
        }),
        // FAB
        h(FAB, {
            id: 'fab-container',
            actions: [
                {
                    label: 'Verlof aanvragen',
                    icon: 'fa-calendar-plus',
                    onClick: () => {
                        console.log('🏖️ FAB Verlof clicked with selection:', selection);
                        // Keep existing selection if valid, otherwise it will be handled by the modal
                        setIsVerlofModalOpen(true);
                    }
                },
                {
                    label: 'Ziek melden',
                    icon: 'fa-notes-medical',
                    onClick: () => {
                        console.log('🏥 FAB Ziekte clicked with selection:', selection);
                        // Keep existing selection if valid, otherwise it will be handled by the modal
                        setIsZiekModalOpen(true);
                    }
                },
                {
                    label: 'Compensatieuren doorgeven',
                    icon: 'fa-clock',
                    onClick: () => {
                        console.log('⏰ FAB Compensatie clicked with selection:', selection);
                        // Keep existing selection if valid, otherwise it will be handled by the modal
                        setIsCompensatieModalOpen(true);
                    }
                },
                {
                    label: 'Zittingsvrij maken',
                    icon: 'fa-gavel',
                    onClick: () => {
                        console.log('⚖️ FAB Zittingsvrij clicked with selection:', selection);
                        // Keep existing selection if valid, otherwise it will be handled by the modal
                        setIsZittingsvrijModalOpen(true);
                    }
                }
            ]
        }),
        // Modals
        h(Modal, {
            isOpen: isVerlofModalOpen,
            onClose: () => setIsVerlofModalOpen(false),
            title: selection && selection.itemData ? "Verlof Bewerken" : "Verlof Aanvragen"
        }, h(VerlofAanvraagForm, {
            onClose: () => setIsVerlofModalOpen(false),
            medewerkers: medewerkers,
            verlofItems: verlofItems,
            shiftTypes: shiftTypes,
            selection: selection,
            initialData: selection && selection.itemData ? selection.itemData : {},
            onSubmit: handleVerlofSubmit
        })),
        h(Modal, {
            isOpen: isCompensatieModalOpen,
            onClose: () => setIsCompensatieModalOpen(false),
            title: selection && selection.itemData ? "Compensatie Uren Bewerken" : "Compensatie Uren Aanvragen"
        }, h(CompensatieUrenForm, {
            onClose: () => setIsCompensatieModalOpen(false),
            medewerkers: medewerkers,
            compensatieUrenItems: compensatieUrenItems,
            selection: selection,
            initialData: selection && selection.itemData ? selection.itemData : {},
            onSubmit: handleCompensatieSubmit
        })),
        h(Modal, {
            isOpen: isZiekModalOpen,
            onClose: () => setIsZiekModalOpen(false),
            title: selection && selection.itemData ? "Ziekmelding Bewerken" : "Ziek Melden"
        }, h(ZiekteMeldingForm, {
            onClose: () => setIsZiekModalOpen(false),
            onSubmit: handleZiekteSubmit,
            medewerkers: medewerkers,
            selection: selection,
            initialData: selection && selection.itemData ? selection.itemData : {},
            ziekteRedenId: ziekteRedenId
        })),
        h(Modal, {
            isOpen: isZittingsvrijModalOpen,
            onClose: () => setIsZittingsvrijModalOpen(false),
            title: selection && selection.itemData ? "Zittingsvrij Bewerken" : "Zittingsvrij Maken"
        }, h(ZittingsvrijForm, {
            onClose: () => setIsZittingsvrijModalOpen(false),
            onSubmit: handleZittingsvrijSubmit,
            medewerkers: medewerkers,
            selection: selection,
            initialData: selection && selection.itemData ? selection.itemData : {}
        }))
    );
};

export default RoosterApp;