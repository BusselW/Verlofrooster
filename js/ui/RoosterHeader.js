import { maandNamenVolledig } from '../utils/dateTimeUtils.js';

const { createElement: h } = React;

const RoosterHeader = ({ 
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
    canManageAnnouncements = false,
    onNieuweMededeling
}) => {
    return h('div', { className: 'toolbar-content' },
        h('div', { id: 'periode-navigatie', className: 'periode-navigatie' },
            h('button', { onClick: vorige }, h('i', { className: 'fas fa-chevron-left' })),
            h('div', { className: 'periode-display' }, 
                weergaveType === 'week' 
                    ? `Week ${huidigWeek}, ${huidigJaar}` 
                    : `${maandNamenVolledig[huidigMaand]} ${huidigJaar}`
            ),
            h('button', { onClick: volgende }, h('i', { className: 'fas fa-chevron-right' })),
            h('div', { 
                'data-weergave': weergaveType, 
                className: 'weergave-toggle', 
                style: { marginLeft: '2rem' } 
            },
                h('span', { className: 'glider' }),
                h('button', { 
                    className: 'weergave-optie', 
                    onClick: () => setWeergaveType('week') 
                }, 'Week'),
                h('button', { 
                    className: 'weergave-optie', 
                    onClick: () => setWeergaveType('maand') 
                }, 'Maand')
            )
        ),
        h('div', { id: 'filter-groep', className: 'filter-groep' },
            h('input', { 
                type: 'text', 
                className: 'zoek-input', 
                placeholder: 'Zoek medewerker...', 
                value: zoekTerm, 
                onChange: (e) => setZoekTerm(e.target.value) 
            }),
            h('select', { 
                className: 'filter-select', 
                value: geselecteerdTeam, 
                onChange: (e) => setGeselecteerdTeam(e.target.value) 
            },
                h('option', { value: '' }, 'Alle teams'),
                (teams || []).map(team => 
                    h('option', { key: team.id, value: team.id }, team.naam)
                )
            ),
            canManageAnnouncements && h('button', {
                className: 'btn btn-primary',
                onClick: onNieuweMededeling,
                title: 'Nieuwe mededeling aanmaken'
            },
                h('i', { className: 'fas fa-plus' }),
                ' Nieuwe mededeling'
            )
        )
    );
};

export default RoosterHeader;