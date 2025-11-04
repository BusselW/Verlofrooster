const { useState, useEffect, useCallback, createElement: h } = React;

/**
 * A reusable Autocomplete component for searching SharePoint users.
 * @param {{
 *   onSelect: (user: object) => void;
 *   searchFunction: (query: string) => Promise<object[]>;
 *   placeholder?: string;
 * }} props
 */
export const Autocomplete = ({ onSelect, searchFunction, placeholder }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const handleSearch = useCallback(async (searchQuery) => {
        if (searchQuery.length < 3) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            const users = await searchFunction(searchQuery);
            setResults(users);
        } catch (error) {
            console.error('Autocomplete search failed:', error);
            setResults([]);
        }
        setLoading(false);
    }, [searchFunction]);

    useEffect(() => {
        const debounceTimeout = setTimeout(() => {
            handleSearch(query);
        }, 300); // Debounce requests

        return () => clearTimeout(debounceTimeout);
    }, [query, handleSearch]);

    const handleSelect = (user) => {
        setQuery(user.Title); // Display user's name in input
        setShowResults(false);
        onSelect(user);
    };

    return h('div', { className: 'autocomplete-container' },
        h('input', {
            type: 'text',
            value: query,
            onChange: (e) => {
                setQuery(e.target.value);
                setShowResults(true);
            },
            onBlur: () => setTimeout(() => setShowResults(false), 200), // Delay to allow click
            placeholder: placeholder || 'Zoek op naam, e-mail of username...',
            className: 'autocomplete-input'
        }),
        h('span', { className: 'autocomplete-icon', 'aria-hidden': 'true' }, '🔍'),
        showResults && h('div', { className: 'autocomplete-dropdown' },
            loading && h('div', { className: 'autocomplete-option loading-item' }, 
                h('span', {}, '⏳ Laden...')
            ),
            !loading && results.length === 0 && query.length >= 3 && h('div', { className: 'autocomplete-option no-results' }, 
                h('span', {}, '❌ Geen resultaten gevonden')
            ),
            !loading && results.length === 0 && query.length < 3 && query.length > 0 && h('div', { className: 'autocomplete-option hint-item' }, 
                h('span', {}, '💡 Type minimaal 3 karakters om te zoeken')
            ),
            results.map(user => h('div', {
                key: user.Id,
                className: 'autocomplete-option',
                onClick: () => handleSelect(user),
            }, 
                h('div', { className: 'user-title' }, 
                    h('span', { className: 'user-icon' }, '👤'),
                    user.Title
                ),
                h('div', { className: 'user-details' }, `${user.LoginName} - ${user.Email}`)
            ))
        )
    );
};
