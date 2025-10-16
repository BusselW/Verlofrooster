// js/ui/userinfo.js

/**
 * @file userinfo.js
 * @description React component voor het weergeven van een enkele medewerker-rij.
 */

// Haal de benodigde React-functies en de service op.
const { useState, useEffect, createElement: h } = React;
import { getUserInfo } from '../services/sharepointService.js';
import { renderHorenStatus } from './horen.js';

const fallbackAvatar = 'https://placehold.co/96x96/4a90e2/ffffff?text=';

function MedewerkerRow({ medewerker }) {
    // Debug logging
    console.log('🧑‍💼 MedewerkerRow rendering:', medewerker);
    
    // Voeg een defensieve controle toe om ervoor te zorgen dat medewerker altijd een object is.
    if (!medewerker) {
        console.error('🧑‍💼 MedewerkerRow: No medewerker data provided');
        // Render niets of een placeholder als medewerker niet wordt verstrekt.
        // Dit voorkomt fouten als de component ooit onjuist wordt gebruikt.
        return h('div', { className: 'medewerker-info' }, 'Geen data');
    }

    const [sharePointUser, setSharePointUser] = useState({ PictureURL: null, IsLoading: true });

    useEffect(() => {
        let isMounted = true;
        const fetchUserData = async () => {
            // Controleer ook op medewerker en Username in het effect
            if (medewerker && medewerker.Username) {
                if (isMounted) setSharePointUser({ PictureURL: null, IsLoading: true });
                const userData = await getUserInfo(medewerker.Username);
                if (isMounted) {
                    setSharePointUser({ ...(userData || {}), IsLoading: false });
                }
            } else if (isMounted) {
                setSharePointUser({ PictureURL: null, IsLoading: false });
            }
        };

        fetchUserData();
        return () => { isMounted = false; };
    }, [medewerker.Username]); // Afhankelijkheid van medewerker.Username

    const getAvatarUrl = () => {
        if (sharePointUser.IsLoading) return '';
        if (sharePointUser.PictureURL) return sharePointUser.PictureURL;
        // Robuuste initialen extractie
        const match = medewerker.Naam ? String(medewerker.Naam).match(/\b\w/g) : null;
        const initials = match ? match.join('') : '?';
        return `${fallbackAvatar}${initials}`;
    };

    const handleImageError = (e) => {
        e.target.onerror = null;
        // Robuuste initialen extractie
        const match = medewerker.Naam ? String(medewerker.Naam).match(/\b\w/g) : null;
        const initials = match ? match.join('') : '?';
        e.target.src = `${fallbackAvatar}${initials}`;
    };

    // UI opgebouwd met h() calls in plaats van JSX
    return h('div', { className: 'medewerker-info' },
        h('div', { className: 'medewerker-profile' },
            h('img', {
                src: getAvatarUrl(),
                className: 'medewerker-avatar',
                'data-username': medewerker.Username, // Add data-username attribute for profile cards
                alt: `Profielfoto van ${medewerker.Naam || 'onbekend'}`, // Fallback voor alt-tekst
                onError: handleImageError
            }),
            h('div', { className: 'medewerker-text' }, // Named wrapper for text elements
                h('span', { 
                    className: 'medewerker-naam', 
                    'data-username': medewerker.Username // Add data-username attribute for profile cards
                }, medewerker.naam || medewerker.Title || 'Onbekende medewerker'), // Fallback voor naam
                medewerker.Functie ? h('span', { className: 'medewerker-functie' }, medewerker.Functie) : null
            )
        ),
        renderHorenStatus(medewerker)
    );
}

export default MedewerkerRow;