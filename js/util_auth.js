(function(global){
    /**
     * Verwijdert bekende SharePoint claims prefixen uit een loginnaam.
     * @param {string} loginNaam - De volledige SharePoint loginnaam.
     * @returns {string} De loginnaam zonder claims prefix.
     */
    function trimLoginNaamPrefix(loginNaam) {
        if (!loginNaam) return '';
        const prefixesToRemove = ["i:0#.w|", "c:0(.s|true|", "i:05.t|"];
        for (const prefix of prefixesToRemove) {
            if (loginNaam.toLowerCase().startsWith(prefix.toLowerCase())) {
                return loginNaam.substring(prefix.length);
            }
        }
        return loginNaam.startsWith('|') ? loginNaam.substring(1) : loginNaam;
    }

    // Expose globally
    global.trimLoginNaamPrefix = trimLoginNaamPrefix;
})(typeof window !== 'undefined' ? window : this);
