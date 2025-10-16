const { useState, useEffect, useCallback, createElement: h } = React;

/**
 * A reusable Autocomplete component for searching SharePoint users.
 * @param {{
 *   onSelect: (user: object) => void;
 *   searchFunction: (query: string) => Promise<object[]>;
 * }} props
 */
export const Autocomplete = ({ onSelect, searchFunction }) => {
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
            placeholder: 'Zoek op naam, e-mail of username...',
        }),
        showResults && h('ul', { className: 'autocomplete-results' },
            loading && h('li', { className: 'loading-item' }, 'Laden...'),
            !loading && results.length === 0 && query.length >= 3 && h('li', { className: 'no-results' }, 'Geen resultaten'),
            results.map(user => h('li', {
                key: user.Id,
                onClick: () => handleSelect(user),
            }, 
                h('div', { className: 'user-title' }, user.Title), // e.g., Bussel, van, W.
                h('div', { className: 'user-details' }, `${user.LoginName} - ${user.Email}`)
            ))
        )
    );
};
