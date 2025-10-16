<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Roulerende Werkroosters - Testomgeving</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.2em;
            margin-bottom: 10px;
            font-weight: 300;
        }

        .header p {
            font-size: 1.1em;
            opacity: 0.9;
        }

        .content {
            padding: 30px;
        }

        .help-section {
            background: #e8f4fd;
            border: 1px solid #bee5eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }

        .help-section h2 {
            color: #0c5460;
            margin-bottom: 15px;
            font-size: 1.3em;
        }

        .help-section p {
            color: #495057;
            line-height: 1.6;
            margin-bottom: 10px;
        }

        .controls-section {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 25px;
            margin-bottom: 30px;
        }

        .controls-section h3 {
            color: #2c3e50;
            margin-bottom: 20px;
            font-size: 1.2em;
        }

        .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }

        .form-group {
            display: flex;
            flex-direction: column;
        }

        .form-group label {
            font-weight: 600;
            margin-bottom: 8px;
            color: #2c3e50;
            font-size: 14px;
        }

        .form-group input, .form-group select {
            padding: 10px;
            border: 2px solid #e1e5e9;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.3s;
        }

        .form-group input:focus, .form-group select:focus {
            outline: none;
            border-color: #3498db;
        }

        .week-config {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 20px;
        }

        .week-block {
            background: white;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            padding: 20px;
        }

        .week-block h4 {
            color: #2c3e50;
            margin-bottom: 15px;
            text-align: center;
            padding: 8px;
            border-radius: 6px;
            font-size: 1.1em;
        }

        .week-a h4 {
            background: #e8f5e8;
            color: #27ae60;
        }

        .week-b h4 {
            background: #fff3cd;
            color: #f39c12;
        }

        .day-config {
            display: grid;
            gap: 8px;
        }

        .day-row {
            display: grid;
            grid-template-columns: 70px 1fr;
            gap: 10px;
            align-items: center;
        }

        .day-label {
            font-weight: 600;
            color: #2c3e50;
            font-size: 12px;
        }

        .btn {
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
        }

        .roster-view {
            margin-top: 30px;
        }

        .week-display {
            background: white;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 20px;
        }

        .week-header {
            padding: 15px 20px;
            font-weight: 600;
            text-align: center;
            color: white;
        }

        .week-type-a .week-header {
            background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
        }

        .week-type-b .week-header {
            background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
        }

        .days-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
        }

        .day-cell {
            padding: 15px 10px;
            text-align: center;
            border-right: 1px solid #e1e5e9;
        }

        .day-cell:last-child {
            border-right: none;
        }

        .day-header {
            font-weight: 600;
            color: #2c3e50;
            background: #f8f9fa;
            padding: 10px;
            font-size: 12px;
        }

        .day-content {
            min-height: 60px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 5px;
        }

        .day-type {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .day-type.vvm {
            background: #fff3cd;
            color: #f39c12;
        }

        .day-type.vvd {
            background: #f8d7da;
            color: #721c24;
        }

        .day-type.normaal {
            background: #d1ecf1;
            color: #0c5460;
        }

        .day-type.flexibel {
            background: #e2e3f3;
            color: #383d41;
        }

        .back-button {
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 8px 16px;
            border-radius: 6px;
            text-decoration: none;
            font-size: 14px;
            transition: all 0.3s;
        }

        .back-button:hover {
            background: rgba(255, 255, 255, 0.3);
            text-decoration: none;
            color: white;
        }

        .example-section {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
        }

        .example-section h4 {
            color: #856404;
            margin-bottom: 10px;
        }

        .example-section p {
            color: #533f03;
            font-size: 13px;
            margin-bottom: 5px;
        }

        @media (max-width: 768px) {
            .form-grid {
                grid-template-columns: 1fr;
            }
            
            .week-config {
                grid-template-columns: 1fr;
            }
            
            .days-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header" style="position: relative;">
            <a href="../instellingenCentrumN.aspx" class="back-button">← Terug naar instellingen</a>
            <h1>🧪 Roulerende Schema Tester</h1>
            <p>Test hoe uw A/B week rooster eruit ziet voordat u het opslaat</p>
        </div>

        <div class="content">
            <div class="help-section">
                <h2>💡 Wat doet deze tool?</h2>
                <p><strong>Probleem:</strong> U wilt een roulerend schema instellen maar weet niet zeker of u het goed doet?</p>
                <p><strong>Oplossing:</strong> Test hier eerst hoe uw schema eruitziet! Stel hieronder uw Week A en Week B in en zie direct hoe het rooster eruitziet over meerdere weken.</p>
                <p><strong>Tip:</strong> Als het er goed uitziet, gaat u terug naar de instellingen en voert u dezelfde gegevens daar in.</p>
            </div>

            <div class="example-section">
                <h4>📋 Voorbeeld scenario (al ingevuld):</h4>
                <p>• <strong>Week A:</strong> Maandag VVM (vrije voormiddag), rest van de week normaal werken</p>
                <p>• <strong>Week B:</strong> Maandag t/m donderdag normaal werken, vrijdag VVD (vrije dag)</p>
                <p>• <strong>Cyclus start:</strong> 7 juli 2025 (wanneer Week A begint)</p>
            </div>

            <div class="controls-section">
                <h3>⚙️ Stel uw schema in</h3>
                
                <div class="form-grid">
                    <div class="form-group">
                        <label for="cycleStartDate">📅 Wanneer begint Week A?</label>
                        <input type="date" id="cycleStartDate" value="2025-07-07">
                        <small style="color: #6c757d; font-size: 11px; margin-top: 4px;">Kies een maandag</small>
                    </div>
                </div>

                <div class="week-config">
                    <div class="week-block week-a">
                        <h4>Week A - Eerste week van de cyclus</h4>
                        <div class="day-config">
                            <div class="day-row">
                                <span class="day-label">Ma:</span>
                                <select id="weekA-monday">
                                    <option value="VVM" selected>VVM - Vrije voormiddag</option>
                                    <option value="VVD">VVD - Vrije dag</option>
                                    <option value="Normaal">Normaal - Hele dag werken</option>
                                    <option value="Flexibel">Flexibel - Thuiswerken</option>
                                </select>
                            </div>
                            <div class="day-row">
                                <span class="day-label">Di:</span>
                                <select id="weekA-tuesday">
                                    <option value="VVM">VVM - Vrije voormiddag</option>
                                    <option value="VVD">VVD - Vrije dag</option>
                                    <option value="Normaal" selected>Normaal - Hele dag werken</option>
                                    <option value="Flexibel">Flexibel - Thuiswerken</option>
                                </select>
                            </div>
                            <div class="day-row">
                                <span class="day-label">Wo:</span>
                                <select id="weekA-wednesday">
                                    <option value="VVM">VVM - Vrije voormiddag</option>
                                    <option value="VVD">VVD - Vrije dag</option>
                                    <option value="Normaal" selected>Normaal - Hele dag werken</option>
                                    <option value="Flexibel">Flexibel - Thuiswerken</option>
                                </select>
                            </div>
                            <div class="day-row">
                                <span class="day-label">Do:</span>
                                <select id="weekA-thursday">
                                    <option value="VVM">VVM - Vrije voormiddag</option>
                                    <option value="VVD">VVD - Vrije dag</option>
                                    <option value="Normaal" selected>Normaal - Hele dag werken</option>
                                    <option value="Flexibel">Flexibel - Thuiswerken</option>
                                </select>
                            </div>
                            <div class="day-row">
                                <span class="day-label">Vr:</span>
                                <select id="weekA-friday">
                                    <option value="VVM">VVM - Vrije voormiddag</option>
                                    <option value="VVD">VVD - Vrije dag</option>
                                    <option value="Normaal" selected>Normaal - Hele dag werken</option>
                                    <option value="Flexibel">Flexibel - Thuiswerken</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="week-block week-b">
                        <h4>Week B - Tweede week van de cyclus</h4>
                        <div class="day-config">
                            <div class="day-row">
                                <span class="day-label">Ma:</span>
                                <select id="weekB-monday">
                                    <option value="VVM">VVM - Vrije voormiddag</option>
                                    <option value="VVD">VVD - Vrije dag</option>
                                    <option value="Normaal" selected>Normaal - Hele dag werken</option>
                                    <option value="Flexibel">Flexibel - Thuiswerken</option>
                                </select>
                            </div>
                            <div class="day-row">
                                <span class="day-label">Di:</span>
                                <select id="weekB-tuesday">
                                    <option value="VVM">VVM - Vrije voormiddag</option>
                                    <option value="VVD">VVD - Vrije dag</option>
                                    <option value="Normaal" selected>Normaal - Hele dag werken</option>
                                    <option value="Flexibel">Flexibel - Thuiswerken</option>
                                </select>
                            </div>
                            <div class="day-row">
                                <span class="day-label">Wo:</span>
                                <select id="weekB-wednesday">
                                    <option value="VVM">VVM - Vrije voormiddag</option>
                                    <option value="VVD">VVD - Vrije dag</option>
                                    <option value="Normaal" selected>Normaal - Hele dag werken</option>
                                    <option value="Flexibel">Flexibel - Thuiswerken</option>
                                </select>
                            </div>
                            <div class="day-row">
                                <span class="day-label">Do:</span>
                                <select id="weekB-thursday">
                                    <option value="VVM">VVM - Vrije voormiddag</option>
                                    <option value="VVD">VVD - Vrije dag</option>
                                    <option value="Normaal" selected>Normaal - Hele dag werken</option>
                                    <option value="Flexibel">Flexibel - Thuiswerken</option>
                                </select>
                            </div>
                            <div class="day-row">
                                <span class="day-label">Vr:</span>
                                <select id="weekB-friday">
                                    <option value="VVM">VVM - Vrije voormiddag</option>
                                    <option value="VVD" selected>VVD - Vrije dag</option>
                                    <option value="Normaal">Normaal - Hele dag werken</option>
                                    <option value="Flexibel">Flexibel - Thuiswerken</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 20px;">
                    <button class="btn" onclick="updateRoster()">🔄 Bekijk resultaat</button>
                </div>
            </div>

            <div class="roster-view">
                <h3>📅 Zo ziet uw rooster eruit:</h3>
                <div id="rosterDisplay"></div>
                <div style="text-align: center; margin-top: 20px;">
                    <p style="color: #6c757d; font-size: 13px;">
                        Ziet het er goed uit? Ga terug naar de instellingen en voer dezelfde gegevens in!
                    </p>
                </div>
            </div>
        </div>
    </div>

    <script type="module">
        // Import our modularized utilities
        import { 
            maandNamenVolledig as dutchMonths, 
            getDagenInWeek,
            isVandaag,
            formatteerDatum 
        } from '../../../../js/utils/dateTimeUtils.js';
        
        import { getInitialen } from '../../../../js/utils/userUtils.js';

        // Nederlandse dagen (keeping local as it's different format than dateTimeUtils)
        const dutchDays = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];

        // Use the modularized calculateWeekType function (similar to what's in verlofRooster.aspx)
        function calculateWeekType(targetDate, cycleStartDate) {
            if (!cycleStartDate || !(cycleStartDate instanceof Date)) {
                return { weekType: 'A', error: 'Geen geldige startdatum cyclus' };
            }
           
            // Calculate which calendar week each date falls into
            // We use Monday as the start of the week (getDay(): Sun=0, Mon=1, ..., Sat=6)
            const getWeekStartDate = (date) => {
                const d = new Date(date);
                const day = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
                const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
                d.setDate(diff);
                d.setHours(0, 0, 0, 0);
                return d;
            };
           
            // Get the Monday of the week containing the cycle start date
            const cycleWeekStart = getWeekStartDate(cycleStartDate);
            
            // Get the Monday of the week containing the target date
            const targetWeekStart = getWeekStartDate(targetDate);
           
            // Calculate the number of weeks between these Mondays
            const timeDiff = targetWeekStart.getTime() - cycleWeekStart.getTime();
            const weeksSinceCycleStart = Math.floor(timeDiff / (7 * 24 * 60 * 60 * 1000));
           
            // Handle negative weeks (dates before cycle start) properly
            // Even weeks = A, Odd weeks = B (using mathematical modulo to handle negatives)
            const weekType = ((weeksSinceCycleStart % 2) + 2) % 2 === 0 ? 'A' : 'B';
            
            return {
                weekType,
                weeksSinceCycleStart
            };
        }

        function formatDutchDate(date) {
            const day = date.getDate();
            const month = dutchMonths[date.getMonth()].toLowerCase(); // Convert to lowercase to match original
            const weekday = dutchDays[date.getDay()];
            return `${weekday} ${day} ${month}`;
        }

        function getWeekConfig(weekType) {
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
            const config = {};
            
            days.forEach(day => {
                const elementId = `week${weekType}-${day}`;
                const element = document.getElementById(elementId);
                config[day] = element ? element.value : 'Normaal';
            });
            
            return config;
        }

        function updateRoster() {
            const cycleStartInput = document.getElementById('cycleStartDate').value;

            if (!cycleStartInput) {
                alert('Vul de startdatum in!');
                return;
            }

            const cycleStartDate = new Date(cycleStartInput);
            
            // Zorg dat cycleStartDate een maandag is
            const cycleStartDay = cycleStartDate.getDay();
            if (cycleStartDay !== 1) { // Als het geen maandag is
                const diff = cycleStartDay === 0 ? -6 : 1 - cycleStartDay;
                cycleStartDate.setDate(cycleStartDate.getDate() + diff);
                // Update het input veld
                document.getElementById('cycleStartDate').value = cycleStartDate.toISOString().split('T')[0];
            }

            const weekAConfig = getWeekConfig('A');
            const weekBConfig = getWeekConfig('B');

            let rosterHTML = '';

            // Toon 4 weken startend vanaf de cyclus startdatum
            for (let week = 0; week < 4; week++) {
                const weekStartDate = new Date(cycleStartDate);
                weekStartDate.setDate(cycleStartDate.getDate() + (week * 7));
                
                const calculation = calculateWeekType(weekStartDate, cycleStartDate);
                const weekType = calculation.weekType;
                const config = weekType === 'A' ? weekAConfig : weekBConfig;

                rosterHTML += `
                    <div class="week-display week-type-${weekType.toLowerCase()}">
                        <div class="week-header">
                            Week ${weekType} - ${formatDutchDate(weekStartDate)} t/m ${formatDutchDate(new Date(weekStartDate.getTime() + 4 * 24 * 60 * 60 * 1000))}
                        </div>
                        <div class="days-grid">
                            <div class="day-cell day-header">Ma</div>
                            <div class="day-cell day-header">Di</div>
                            <div class="day-cell day-header">Wo</div>
                            <div class="day-cell day-header">Do</div>
                            <div class="day-cell day-header">Vr</div>
                `;

                const workdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
                
                workdays.forEach(workday => {
                    const dayType = config[workday];
                    const dayTypeClass = dayType.toLowerCase();

                    rosterHTML += `
                        <div class="day-cell">
                            <div class="day-content">
                                <div class="day-type ${dayTypeClass}">${dayType}</div>
                            </div>
                        </div>
                    `;
                });

                rosterHTML += '</div></div>';
            }

            document.getElementById('rosterDisplay').innerHTML = rosterHTML;
        }

        // Initiële weergave bij laden van pagina
        document.addEventListener('DOMContentLoaded', function() {
            updateRoster();
        });

        // Update automatisch bij wijzigingen
        document.getElementById('cycleStartDate').addEventListener('change', updateRoster);
        
        // Update bij wijzigingen in week configuraties
        ['weekA-monday', 'weekA-tuesday', 'weekA-wednesday', 'weekA-thursday', 'weekA-friday',
         'weekB-monday', 'weekB-tuesday', 'weekB-wednesday', 'weekB-thursday', 'weekB-friday'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', updateRoster);
            }
        });
    </script>
</body>
</html>