import { renderCompensatieMomenten } from './dagCell.js';
import MedewerkerRow from './userinfo.js';
import { isVandaag } from '../utils/dateTimeUtils.js';

const { createElement: h, Fragment } = React;

const RoosterGrid = ({ 
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
}) => {
    return h('main', { className: 'main-content' },
        h('div', { className: 'table-responsive-wrapper' },
            h('table', {
                id: 'rooster-table',
                className: `rooster-table ${weergaveType}-view`,
                style: { '--day-count': periodeData.length }
            },
                h('thead', { className: 'rooster-thead' },
                    h.apply(h, ['tr', null].concat(createHeaderCells()))
                ),
                h('tbody', null,
                    // Render teams and medewerkers with actual data
                    (gegroepeerdeData ? Object.keys(gegroepeerdeData) : []).map(teamId => {
                        const team = (teams || []).find(t => t.id === teamId) || { id: 'geen_team', naam: 'Geen Team', kleur: '#ccc' };
                        const teamMedewerkers = gegroepeerdeData[teamId];
                        if (!teamMedewerkers || teamMedewerkers.length === 0) return null;

                        return h(Fragment, { key: teamId },
                            h('tr', { className: 'team-rij' }, 
                                h('td', { colSpan: periodeData.length + 1 }, 
                                    h('div', { className: 'team-header', style: { '--team-kleur': team.kleur } }, team.naam)
                                )
                            ),
                            (teamMedewerkers || []).map(medewerker =>
                                h('tr', { key: medewerker.id, className: 'medewerker-rij' },
                                    h('td', { 
                                        className: 'medewerker-kolom',
                                        'data-username': medewerker.Username
                                    }, 
                                        h(MedewerkerRow, { medewerker: medewerker || {} })
                                    ),
                                    // Render calendar cells for each day with proper data blocks
                                    ...(() => {
                                        const dagenMetBlokInfo = periodeData.map((dag) => {
                                            const verlofItem = getVerlofVoorDag(medewerker.Username, dag);
                                            const zittingsvrijItem = getZittingsvrijVoorDag(medewerker.Username, dag);
                                            const compensatieItems = getCompensatieUrenVoorDag(medewerker.Username, dag);

                                            // Debug logging for compensatie uren detection
                                            if (compensatieItems.length > 0) {
                                                console.log(`Found ${compensatieItems.length} compensatie items for ${medewerker.Username} on ${dag.toDateString()}:`, compensatieItems);
                                            }

                                            // Priority: verlof > zittingsvrij (compensatie uren have their own rendering)
                                            let item = verlofItem || zittingsvrijItem;
                                            // Compensatie uren are excluded from primary item selection because they
                                            // have their own visual representation via renderCompensatieMomenten

                                            return {
                                                dag,
                                                item: item,
                                                compensatieMomenten: getCompensatieMomentenVoorDag(dag).filter(m => m.item.MedewerkerID === medewerker.Username)
                                            };
                                        });

                                        for (let i = 0; i < dagenMetBlokInfo.length; i++) {
                                            if (dagenMetBlokInfo[i].item) {
                                                const isStart = i === 0 || dagenMetBlokInfo[i].item !== dagenMetBlokInfo[i - 1].item;
                                                if (isStart) {
                                                    let length = 1;
                                                    while (i + length < dagenMetBlokInfo.length && dagenMetBlokInfo[i + length].item === dagenMetBlokInfo[i].item) { length++; }
                                                    const middleIndex = i + Math.floor((length - 1) / 2);
                                                    for (let k = 0; k < length; k++) {
                                                        dagenMetBlokInfo[i + k].isMiddle = (i + k === middleIndex);
                                                        dagenMetBlokInfo[i + k].isStart = (k === 0);
                                                        dagenMetBlokInfo[i + k].isEnd = (k === length - 1);
                                                    }
                                                }
                                            }
                                        }

                                        return dagenMetBlokInfo.map(({ dag, item, isStart, isEnd, isMiddle, compensatieMomenten }) => {
                                            const isWeekend = dag.getDay() === 0 || dag.getDay() === 6;
                                            const feestdagNaam = feestdagen[dag.toISOString().split('T')[0]];
                                            const isSelected = isDateInSelection(dag, medewerker.Username);
                                            const isToday = isVandaag(dag);
                                            const classes = `dag-kolom ${isWeekend ? 'weekend' : ''} ${feestdagNaam ? 'feestdag' : ''} ${isToday ? 'vandaag' : ''} ${isSelected ? 'selected' : ''}`;

                                            // Check if this is the first-clicked cell
                                            const isFirstClick = firstClickData &&
                                                firstClickData.medewerker.Username === medewerker.Username &&
                                                firstClickData.dag.toDateString() === dag.toDateString();
                                            
                                            // Create tooltip component for the first clicked cell
                                            const tooltipElement = (isFirstClick && showTooltip) ?
                                                h('div', {
                                                    className: 'selection-tooltip visible'
                                                }, 'Klik nu op een tweede dag en open het menu met je rechtermuisknop.') : null;

                                            let teRenderenBlok = null;

                                            // Logica voor UrenPerWeek                                                        
                                            const urenSchema = getUrenPerWeekForDate(medewerker.Username, dag);
                                            if (urenSchema) {
                                                const dagNamen = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
                                                const dagNaam = dagNamen[dag.getDay()];
                                                const soortVeld = `${dagNaam}Soort`;
                                                const dagSoort = urenSchema[soortVeld];

                                                if (dagSoort && dagenIndicators[dagSoort]) {
                                                    const indicator = dagenIndicators[dagSoort];
                                                    teRenderenBlok = h('div', {
                                                        className: 'verlof-blok',
                                                        style: { backgroundColor: indicator.kleur, borderRadius: '6px' },
                                                        title: `${indicator.Beschrijving || indicator.Title} (vanaf ${urenSchema.Ingangsdatum.toLocaleDateString()})`
                                                    }, indicator.Title);
                                                   
                                                    console.log(`🔍 Rendered UrenPerWeek block for ${medewerker.Username} on ${dag.toDateString()}: ${dagSoort} (record from ${urenSchema.Ingangsdatum.toLocaleDateString()})`);
                                                }
                                            }

                                            if (item && !teRenderenBlok) { // Alleen tonen als er geen UrenPerWeek blok is
                                                console.log(`🎯 Rendering primary item block for ${medewerker.Username} on ${dag.toDateString()}:`, item);
                                                const blokClasses = ['verlof-blok'];
                                                if (isStart) blokClasses.push('start-blok');
                                                if (isEnd) blokClasses.push('eind-blok');

                                                const isVerlof = 'RedenId' in item;
                                                const isZittingsvrij = 'ZittingsVrijeDagTijd' in item;
                                                const isCompensatie = 'StartCompensatieUren' in item;

                                                if (isCompensatie) {
                                                    console.warn(`⚠️ Compensatie item unexpectedly selected as primary item:`, item);
                                                }

                                                const shiftType = isVerlof ? shiftTypes[item.RedenId] : null;
                                                const afkorting = isVerlof && shiftType ? shiftType.afkorting : (item.Afkorting || 'ZV');
                                                const kleur = isVerlof && shiftType ? shiftType.kleur : (item.Kleur || '#8e44ad');
                                                const titel = isVerlof && shiftType ? (item.Omschrijving || shiftType.label) : (item.Opmerking || item.Title);
                                                const status = isVerlof ? (item.Status || 'Goedgekeurd').toLowerCase() : 'goedgekeurd';

                                                if (afkorting === 'VER') {
                                                    blokClasses.push('ver-item');
                                                }

                                                // Log when rendering VER items with Nieuw status for debugging
                                                if (afkorting === 'VER' && status === 'nieuw') {
                                                    console.log(`🔍 Rendering VER item with Nieuw status (will show at 40% opacity via CSS) for ${medewerker.Username} on ${dag.toDateString()}`);
                                                }

                                                teRenderenBlok = h('div', {
                                                    className: `${blokClasses.join(' ')} status-${status}`,
                                                    'data-afkorting': afkorting,
                                                    'data-medewerker': medewerker.naam || medewerker.Username,
                                                    'data-startdatum': item.StartDatum || dag.toISOString(),
                                                    'data-einddatum': item.EindDatum || dag.toISOString(),
                                                    'data-status': status,
                                                    'data-titel': titel,
                                                    'data-toelichting': item.Toelichting || item.Omschrijving || '',
                                                    style: { backgroundColor: kleur },
                                                    title: titel
                                                }, isMiddle ? afkorting : '');
                                            }

                                            const compensatieMomentenBlokken = renderCompensatieMomenten(compensatieMomenten, {
                                                onContextMenu: (e, compensatieItem) => {
                                                    console.log('Compensatie item right-clicked, showing context menu:', compensatieItem);
                                                    showContextMenu(e, medewerker, dag, compensatieItem);
                                                },
                                                onClick: (e, compensatieItem) => {
                                                    console.log('Compensatie item clicked, opening edit modal:', compensatieItem);
                                                    handleCellClick(medewerker, dag, compensatieItem);
                                                }
                                            });

                                            return h('td', {
                                                key: dag.toISOString(),
                                                className: classes,
                                                id: medewerker.id === 1 && dag.getDate() === 1 ? 'dag-cel' : undefined,
                                                'data-username': medewerker.Username,
                                                onClick: () => handleCellClick(medewerker, dag),
                                                onContextMenu: (e) => {
                                                    e.preventDefault();
                                                    console.log('🖱️ Cell right-clicked:', {
                                                        employee: medewerker.Username,
                                                        date: dag.toDateString(),
                                                        hasItem: !!item,
                                                        item: item,
                                                        currentSelection: selection
                                                    });
                                                    showContextMenu(e, medewerker, dag, item || null);
                                                },
                                                style: isFirstClick ? { position: 'relative' } : {}
                                            },
                                                teRenderenBlok,
                                                compensatieMomentenBlokken,
                                                tooltipElement
                                            );
                                        });
                                    })()
                                )
                            )
                        );
                    })
                )
            )
        )
    );
};

export default RoosterGrid;