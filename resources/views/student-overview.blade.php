<!DOCTYPE html>
<html lang="nl">

<head>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student overzicht</title>
    <link href="{{ asset('css/student-overview.css') }}" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>

</head>

<body>
	<div class="container">
		<div class="browser-header">
			<h1 class="browser-title">Student overzicht</h1>
			<div class="browser-profile"></div>
		</div>


        <div class="student-info">
            <div class="student-field">Student Naam: Laden...</div>
            <div class="student-field">Student nr: Laden...</div>
            <div class="student-field">Student Klas: Laden...</div>
        </div>

        <div class="controls">
            <div class="period-selector">
                <div class="period-input">
                    <label for="jaar">Jaar:</label>
                    <select id="jaar">
                        <option value="2023">2023</option>
                        <option value="2024" selected>2024</option>
                        <option value="2025">2025</option>
                    </select>
                </div>
                <div class="period-input">
                    <label for="start-week">Van Week:</label>
                    <select id="start-week">
                        <option value="1">Week 1</option>
                    </select>
                </div>

                <div class="period-input">
                    <label for="end-week">Tot Week:</label>
                    <select id="end-week">
                        <option value="12">Week 12</option>
                    </select>
                </div>
            </div>
            <button class="btn" id="filter-btn">Filteren</button>
            <button class="btn" id="download-btn">Download overzicht</button>
        </div>

        <div class="summary-cards">
            <div class="summary-card">
                <h3>Gemiddelde</h3>
                <div class="value" id="average">Laden...</div>
            </div>
            <div class="summary-card">
                <h3>Status</h3>
                <div class="value" id="status">Laden...</div>
            </div>
            <div class="summary-card success">
                <h3>Beste week</h3>
                <div class="value" id="best-week">Laden...</div>
            </div>
            <div class="summary-card danger">
                <h3>Slechtste week</h3>
                <div class="value" id="worst-week">Laden...</div>
            </div>
        </div>

        <div class="weeks-section" id="weeks-section">
            <div class="weeks-title">Afgelopen weken</div>
            <div class="weeks-grid" id="weeks-grid">
                <div style="text-align: center; color: #64748b; padding: 40px;">
                    <div class="spinner" style="margin: 0 auto 16px;"></div>
                    <div>Gegevens laden...</div>
                </div>
            </div>
        </div>
    </div>

    <div class="weeks-section">
        <div class="chart-container" id="chart-container">
            <div class="back-button-container">
                <button class="btn btn-secondary" id="back-btn">← Terug naar overzicht</button>
            </div>

            <div class="charts-grid">
                <div class="line-chart">
                    <div class="chart-title">Aanwezigheid per week</div>
                    <svg class="svg-chart" id="line-chart">
                    </svg>
                </div>
                <div class="circle-chart">
                    <div class="chart-title">Gemiddelde aanwezigheid</div>
                    <div class="circle" id="attendance-circle">
                        <span class="percentage-text" id="circle-percentage">0%</span>
                    </div>
                    <div style="font-size: 14px; color: #64748b;">Alle weken</div>
                </div>
            </div>
        </div>
    </div>

    <script src="{{ asset('js/student-overview.js') }}"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>


</body>

</html>