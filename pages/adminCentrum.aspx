<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Administrator Centrum - Verlofrooster</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/adminCentrum_styles.css">
    <style>
        body {
            font-family: 'Inter', sans-serif;
        }
        /* Custom scrollbar (consistent met hoofdpagina) */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #2d3748; border-radius: 4px; } /* gray-700 */
        ::-webkit-scrollbar-thumb { background: #4a5568; border-radius: 4px; } /* gray-600 */
        ::-webkit-scrollbar-thumb:hover { background: #718096; } /* gray-500 */

        /* Stijlen voor actieve tab (indien tabs gebruikt worden) */
        .tab-button.active {
            border-color: #3b82f6; /* blue-500 */
            color: #3b82f6;
            background-color: #374151; /* gray-700 (donker thema) */
        }
        body.light-theme .tab-button.active { /* Wordt overschreven in adminCentrum_styles.css */ }

        .tab-content { display: none; }
        .tab-content.active { display: block; }
    </style>
</head>
<body class="bg-gray-800 text-gray-100"> <div id="app-container" class="container mx-auto p-4 md:p-8">
        <header class="mb-6 md:mb-8">
            <h1 class="text-2xl md:text-3xl font-bold text-white">Administrator Centrum</h1>
            <p class="text-gray-400 mt-1">Geavanceerd beheer en configuratie van de Verlofrooster applicatie.</p>
            <div id="admin-status-bericht-algemeen" class="hidden mt-4 p-3 text-sm rounded-lg"></div>
        </header>

        <main id="admin-content-container" class="space-y-8">
            
            <section id="sectie-app-config" class="bg-gray-700 p-4 md:p-6 rounded-lg shadow-md">
                <h2 class="text-xl font-semibold text-white mb-4">Applicatie Configuratie</h2>
                <p class="text-gray-400 mb-2">Hier kunnen instellingen beheerd worden die de werking van de gehele applicatie beïnvloeden.</p>
                <p class="text-gray-500 text-sm italic">(Deze sectie is een placeholder. Specifieke configuratie-opties moeten nog gedefinieerd worden.)</p>
                </section>

            <section id="sectie-foutenlogboek" class="bg-gray-700 p-4 md:p-6 rounded-lg shadow-md">
                <h2 class="text-xl font-semibold text-white mb-4">Foutenlogboek Beheer</h2>
                <p class="text-gray-400 mb-4">Overzicht en beheer van gemelde fouten in de `FoutenLogboek` lijst.</p>
                <div class="overflow-x-auto">
                    <table class="min-w-full editable-table">
                        <thead class="bg-gray-600">
                            <tr>
                                <th class="text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</th>
                                <th class="text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Titel</th>
                                <th class="text-left text-xs font-medium text-gray-300 uppercase tracking-wider">FoutBeschrijving</th>
                                <th class="text-left text-xs font-medium text-gray-300 uppercase tracking-wider">FoutCode</th>
                                <th class="text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Behandelplan</th>
                                <th class="text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Acties</th>
                            </tr>
                        </thead>
                        <tbody id="foutenlogboek-tabel-body" class="divide-y divide-gray-600">
                            </tbody>
                    </table>
                </div>
                <div id="foutenlogboek-status" class="mt-3 text-sm"></div>
            </section>
            
            </main>

        <footer class="text-center mt-8 md:mt-12 py-4 border-t border-gray-700">
            <a href="../verlofRooster.aspx" class="text-sm text-blue-400 hover:text-blue-300 hover:underline">
                &larr; Terug naar het Verlofrooster
            </a>
            <p class="text-xs text-gray-500 mt-2">&copy; <span id="current-year"></span> Verlofrooster Applicatie</p>
        </footer>
    </div>

    <div id="admin-modal" class="hidden fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div class="bg-gray-800 p-5 md:p-6 rounded-lg shadow-xl w-full max-w-xl transform transition-all scale-95 opacity-0">
            <div class="flex justify-between items-center mb-4">
                <h3 id="admin-modal-title" class="text-lg font-semibold text-white">Details / Bewerken</h3>
                <button id="admin-modal-close-x" class="text-gray-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            <form id="admin-modal-form" class="space-y-4">
                <div id="admin-modal-fields-container">
                    </div>
                <div id="admin-modal-status" class="mt-3 text-sm"></div>
            </form>
            <div class="mt-6 flex justify-end space-x-3">
                <button id="admin-modal-cancel-button" class="bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-lg text-sm shadow hover:shadow-md transition-all">Annuleren/Sluiten</button>
                <button id="admin-modal-save-button" class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg text-sm shadow hover:shadow-md transition-all">Opslaan</button>
            </div>
        </div>
    </div>

    <script src="../js/configLijst.js"></script>
    <script src="js/adminCentrum_logic.js"></script>

</body>
</html>
