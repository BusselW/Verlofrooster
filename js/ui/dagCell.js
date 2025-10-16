const { createElement: h, Fragment, useEffect, useRef } = React;
import TooltipManager from './tooltipbar.js';

/**
 * Utility function to render compensatie moments that can be shared
 * between DagCell component and inline table logic
 * @param {Array} compensatieMomenten - Array of compensatie moments
 * @param {Object} options - Optional handlers for click and context menu
 * @param {Function} options.onContextMenu - Context menu handler that receives (event, compensatieItem)
 * @param {Function} options.onClick - Click handler that receives (event, compensatieItem)
 */
const renderCompensatieMomenten = (compensatieMomenten, options = {}) => {
    return compensatieMomenten.map((moment) => {
        let iconSrc = '';
        let title = moment.item.Omschrijving || '';
        let className = 'compensatie-uur-blok';
        let linkId = `comp-${moment.item.ID}`;

        switch (moment.type) {
            case 'compensatie':
                iconSrc = './icons/compensatieuren/neutraleuren.svg';
                title = `Compensatie: ${title}`;
                className += ' compensatie-neutraal';
                break;
            case 'ruildag-gewerkt':
                iconSrc = './icons/compensatieuren/Plusuren.svg';
                const ruildagDatum = moment.item.ruildagStart ? new Date(moment.item.ruildagStart).toISOString().split('T')[0] : 'onbekend';
                title = `Gewerkte dag (geruild met ${ruildagDatum}). ${title}`;
                className += ' ruildag-plus';
                linkId = `ruildag-${moment.item.ID}`;
                break;
            case 'ruildag-vrij':
                iconSrc = './icons/compensatieuren/Minuren.svg';
                const gewerkteDatum = new Date(moment.item.StartCompensatieUren).toISOString().split('T')[0];
                title = `Vrije dag (gewerkt op ${gewerkteDatum}). ${title}`;
                className += ' ruildag-min';
                linkId = `ruildag-${moment.item.ID}`;
                break;
        }

        // Create event handlers for the compensatie block
        const handleContextMenu = (e) => {
            if (options.onContextMenu) {
                e.preventDefault();
                e.stopPropagation(); // Prevent the cell's context menu from also triggering
                console.log('Compensatie uren right-clicked:', moment.item);
                options.onContextMenu(e, moment.item);
            }
        };

        const handleClick = (e) => {
            if (options.onClick) {
                e.stopPropagation(); // Prevent the cell's click handler from also triggering
                console.log('Compensatie uren clicked:', moment.item);
                options.onClick(e, moment.item);
            }
        };

        return h('div', {
            key: `${moment.item.ID}-${moment.type}`,
            className: 'compensatie-uur-container',
            'data-medewerker': moment.item.MedewerkerNaam || 'Onbekend',
            'data-datum': moment.item.Datum || moment.item.StartCompensatieUren || new Date().toISOString(),
            'data-uren': moment.item.Uren || moment.item.AantalUren || moment.item.UrenTotaal || 0,
            'data-toelichting': moment.item.Toelichting || moment.item.Omschrijving || '',
            'data-type': moment.type,
            onContextMenu: handleContextMenu,
            onClick: handleClick,
            ref: (element) => {
                if (element && !element.dataset.tooltipAttached) {
                    TooltipManager.attach(element, () => {
                        return TooltipManager.createCompensatieTooltip({
                            ...moment.item,
                            MedewerkerNaam: moment.item.MedewerkerNaam || 'Onbekend',
                            Datum: moment.item.Datum || moment.item.StartCompensatieUren,
                            AantalUren: moment.item.Uren || moment.item.AantalUren || moment.item.UrenTotaal || 0
                        });
                    });
                }
            }
        }, h('div', {
            className: className,
            'data-link-id': linkId
        }, h('img', { src: iconSrc, className: 'compensatie-icon-svg', alt: moment.type })));
    });
};

/**
 * Component voor een enkele dag-cel in het rooster.
 * @param {object} props
 * @param {Date} props.dag - De datum van de cel.
 * @param {object} props.medewerker - De medewerker voor deze rij.
 * @param {function} props.onContextMenu - Functie die wordt aangeroepen bij een rechtermuisklik.
 * @param {function} props.getVerlofVoorDag - Functie om verlof op te halen.
 * @param {function} props.getZittingsvrijVoorDag - Functie om zittingsvrij op te halen.
 * @param {function} props.getCompensatieUrenVoorDag - Functie om compensatie-uren op te halen.
 * @param {object} props.shiftTypes - Beschikbare shift types.
 * @param {function} props.onCellClick - Functie voor cel klik.
 * @param {boolean} props.isSelected - Of deze cel geselecteerd is.
 * @param {boolean} props.isFirstClick - Of deze cel de eerste klik is.
 * @param {string} props.feestdagNaam - Naam van de feestdag (indien van toepassing).
 */
const DagCell = ({ dag, medewerker, onContextMenu, getVerlofVoorDag, getZittingsvrijVoorDag, getCompensatieUrenVoorDag, shiftTypes, onCellClick, isSelected, isFirstClick, feestdagNaam }) => {
    const cellRef = useRef(null);
    const verlofItem = getVerlofVoorDag(medewerker.Username, dag);
    const zittingsvrijItem = getZittingsvrijVoorDag(medewerker.Username, dag);
    const compensatieUrenVoorDag = getCompensatieUrenVoorDag(medewerker.Username, dag);

    // Check if the day is a weekend or holiday
    const isWeekend = dag.isWeekend || dag.getDay() === 0 || dag.getDay() === 6;
    const isFeestdag = dag.isFeestdag || false;
    // feestdagNaam is already passed as parameter, no need to redeclare

    // Set up a tooltip for the cell itself if it's a holiday
    useEffect(() => {
        if (cellRef.current && isFeestdag && feestdagNaam && !cellRef.current.dataset.tooltipAttached) {
            TooltipManager.attach(cellRef.current, () => {
                return TooltipManager.createFeestdagTooltip(feestdagNaam, dag);
            });
        }
    }, [isFeestdag, feestdagNaam]);

    // Handle click for opening the appropriate modal
    const handleClick = () => {
        if (onCellClick) {
            // Determine which item to edit (prioritize verlof > zittingsvrij > compensatie)
            const itemToEdit = verlofItem || zittingsvrijItem || 
                (compensatieUrenVoorDag.length > 0 ? compensatieUrenVoorDag[0] : null);
            onCellClick(medewerker, dag, itemToEdit);
        }
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        onContextMenu(e, {
            medewerker,
            dag,
            datum: dag, // Include datum for consistency
            verlofItem,
            zittingsvrijItem,
            compensatieUren: compensatieUrenVoorDag // Use same property name as MedewerkerRow
        });
    };

    const renderVerlofBlok = (verlof) => {
        const isZiekte = verlof.Status === 'Ziek';
        const verlofReden = shiftTypes[verlof.VerlofRedenId];
        const backgroundColor = isZiekte ? '#e74c3c' : (verlofReden?.kleur || verlof.shiftType?.Kleur || '#4a90e2');
        const label = isZiekte ? 'Ziekmelding' : (verlofReden?.label || verlof.shiftType?.Titel || 'Verlof');
        const afkorting = isZiekte ? 'ZK' : (verlofReden?.afkorting || verlof.shiftType?.AfkortingTitel || 'V');
        const status = verlof.Status?.toLowerCase() || 'nieuw';
        
        // CSS classes for proper styling
        const className = [
            isZiekte ? 'ziekte-blok' : 'verlof-blok',
            `status-${status}`,
            verlof.isStartBlok ? 'start-blok' : '',
            verlof.isEindBlok ? 'eind-blok' : '',
            verlof.Afkorting === 'VER' || verlof.ShiftTypeId === 1 ? 'ver-item' : '',
            isZiekte ? 'zk-item' : ''
        ].filter(Boolean).join(' ');
        
        return h('div', {
            className,
            style: { backgroundColor },
            'data-afkorting': afkorting,
            'data-titel': label,
            'data-medewerker': medewerker.Naam,
            'data-startdatum': verlof.StartDatum,
            'data-einddatum': verlof.EindDatum,
            'data-status': verlof.Status,
            'data-toelichting': verlof.Toelichting || '',
            ref: (element) => {
                if (element && !element.dataset.tooltipAttached) {
                    const tooltipFunction = isZiekte ? 
                        TooltipManager.createZiekteTooltip : 
                        TooltipManager.createVerlofTooltip;
                    
                    TooltipManager.attach(element, () => {
                        return tooltipFunction({
                            ...verlof,
                            Titel: label,
                            MedewerkerNaam: medewerker.Naam
                        });
                    });
                }
            }
        }, verlof.isStartBlok ? afkorting : '');
    };

    const renderZittingsvrijBlok = (zittingsvrij) => {
        // Use a standard color for zittingsvrij indicators with proper styling
        return h('div', {
            className: 'dag-indicator-blok zittingsvrij-blok',
            style: { backgroundColor: '#8e44ad' }, // Consistent purple color for zittingsvrij
            'data-afkorting': 'ZV',
            'data-medewerker': medewerker.Naam,
            'data-startdatum': zittingsvrij.StartDatum,
            'data-einddatum': zittingsvrij.EindDatum,
            'data-toelichting': zittingsvrij.Toelichting || '',
            ref: (element) => {
                if (element && !element.dataset.tooltipAttached) {
                    TooltipManager.attach(element, () => {
                        return TooltipManager.createZittingsvrijTooltip({
                            ...zittingsvrij,
                            MedewerkerNaam: medewerker.Naam
                        });
                    });
                }
            }
        }, 'ZV');
    };

    const renderUrenPerWeekBlok = (dag) => {
        // Check if this day has a special UrenPerWeek type (VVO, VVD, VVM)
        if (!dag.urenPerWeekType || !['VVO', 'VVD', 'VVM'].includes(dag.urenPerWeekType)) {
            return null;
        }
        
        return h('div', {
            className: 'dag-indicator-blok urenperweek-blok',
            style: { backgroundColor: dag.urenPerWeekColor || '#cccccc' },
            'data-afkorting': dag.urenPerWeekType,
            'data-medewerker': medewerker.Naam,
            'data-type': 'urenperweek',
            ref: (element) => {
                if (element && !element.dataset.tooltipAttached) {
                    TooltipManager.attach(element, () => {
                        return TooltipManager.createUrenPerWeekTooltip({
                            type: dag.urenPerWeekType,
                            MedewerkerNaam: medewerker.Naam,
                            Datum: dag
                        });
                    });
                }
            }
        }, dag.urenPerWeekType);
    };

    return h('td', {
        className: `dag-cel ${isWeekend ? 'weekend' : ''} ${isFeestdag ? 'feestdag' : ''} ${isSelected ? 'selected' : ''} ${isFirstClick ? 'first-click' : ''}`.trim(),
        'data-feestdag': isFeestdag ? feestdagNaam : undefined,
        'data-datum': dag.toISOString ? dag.toISOString().split('T')[0] : dag.toString(),
        'data-medewerker': medewerker.Naam,
        onContextMenu: handleContextMenu,
        onClick: onCellClick && (() => {
            const itemToEdit = verlofItem || zittingsvrijItem || 
                (compensatieUrenVoorDag.length > 0 ? compensatieUrenVoorDag[0] : null);
            onCellClick(medewerker, dag, itemToEdit);
        }),
        ref: cellRef
    },
        verlofItem && renderVerlofBlok(verlofItem),
        zittingsvrijItem && renderZittingsvrijBlok(zittingsvrijItem),
        // Render UrenPerWeek blocks for special day types (VVO, VVD, VVM)
        renderUrenPerWeekBlok(dag),
        // Convert compensatieUrenVoorDag to the format expected by renderCompensatieMomenten
        compensatieUrenVoorDag.length > 0 && (() => {
            const compensatieMomenten = compensatieUrenVoorDag.map(comp => {
                const isRuildag = comp.Ruildag || comp.IsRuildag || false;
                const uren = parseFloat(comp.Uren || comp.AantalUren || comp.UrenTotaal || 0);
                
                let type = 'compensatie';
                if (isRuildag) {
                    type = uren > 0 ? 'ruildag-gewerkt' : 'ruildag-vrij';
                }
                
                return { type, item: comp };
            });
            
            return renderCompensatieMomenten(compensatieMomenten, {
                onContextMenu: (e, compensatieItem) => {
                    e.preventDefault();
                    onContextMenu(e, {
                        medewerker,
                        dag,
                        datum: dag,
                        verlofItem,
                        zittingsvrijItem,
                        compensatieUren: compensatieUrenVoorDag,
                        selectedCompensatieItem: compensatieItem // Pass the specific clicked item
                    });
                },
                onClick: (e, compensatieItem) => {
                    if (onCellClick) {
                        onCellClick(medewerker, dag, compensatieItem);
                    }
                }
            });
        })()
    );
};

export default DagCell;
export { renderCompensatieMomenten };

console.log("DagCell component loaded successfully.");