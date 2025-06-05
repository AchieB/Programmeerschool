<!DOCTYPE html>
<html lang="nl">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student overzicht</title>
    <link href="{{ asset('css/student-overview.css') }}" rel="stylesheet">
</head>

<body>
    <div class="container">
        <!-- BROWSER HEADER - Browser-achtige header zoals in de foto -->
        <div class="browser-header">

            <div class="browser-title"> Student overzicht</div>

        </div>

        <!-- HEADER - De titel bovenaan (nu verborgen) -->
        <div class="header">
            Student overzicht
        </div>

        <!-- STUDENT INFO - Filter panel zoals in de foto -->
        <div class="student-info">

            <div class="student-field">Student Naam:</div>
            <div class="student-field">Student nr:</div>
            <div class="student-field">Student Klas:</div>

            <div class="browser-profile"></div>
        </div>

        <!-- CONTROLS - Knoppen voor navigatie -->
        <div class="controls">
            <button class="btn">Filteren</button>
            <div class="dropdown">
                <button class="btn">Week ▼</button>
                <div class="dropdown-content">
                    <div class="dropdown-item">Week 1</div>
                    <div class="dropdown-item">Week 2</div>
                    <div class="dropdown-item">Week 3</div>
                    <div class="dropdown-item">Week 4</div>
                    <div class="dropdown-item">Week 5</div>
                    <div class="dropdown-item">Week 6</div>
                    <div class="dropdown-item">Week 7</div>
                    <div class="dropdown-item">Week 8</div>
                    <div class="dropdown-item">Week 9</div>
                    <div class="dropdown-item">Week 10</div>
                    <div class="dropdown-item">Week 11</div>
                    <div class="dropdown-item">Week 12</div>
                </div>
            </div>
        </div>

        <!-- SUMMARY CARDS - De 4 belangrijkste statistieken zoals in de foto -->
        <div class="summary-cards">
            <div class="summary-card">
                <h3>Gemiddelde Aanwezigheid</h3>
                <div class="value good" id="average">68%</div>
            </div>
            <div class="summary-card danger">
                <h3>Aantal 0 Studenten</h3>
                <div class="value" id="zero-students">2</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 4px;">&lt;50%</div>
            </div>
            <div class="summary-card success">
                <h3>Aantal Top Studenten</h3>
                <div class="value" id="top-students">2</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 4px;">&gt;85%</div>
            </div>
        </div>

        <!-- WEEKS SECTION - Alle individuele weken -->
        <div class="weeks-section">
            <div class="weeks-title">Afgelopen weken</div>
            <div class="weeks-grid" id="weeks-grid">
                <!-- Deze week kaartjes worden vervangen door JavaScript -->
                <div class="week-card">
                    <div class="week-title">Week 1</div>
                    <div class="week-percentage goed">80%</div>
                </div>
                <div class="week-card">
                    <div class="week-title">Week 2</div>
                    <div class="week-percentage goed">80%</div>
                </div>
                <div class="week-card">
                    <div class="week-title">Week 3</div>
                    <div class="week-percentage goed">81%</div>
                </div>
                <div class="week-card">
                    <div class="week-title">Week 4</div>
                    <div class="week-percentage goed">80%</div>
                </div>
                <div class="week-card">
                    <div class="week-title">Week 5</div>
                    <div class="week-percentage kritiek">32%</div>
                </div>
                <div class="week-card">
                    <div class="week-title">Week 6</div>
                    <div class="week-percentage goed">84%</div>
                </div>
                <div class="week-card">
                    <div class="week-title">Week 7</div>
                    <div class="week-percentage goed">88%</div>
                </div>
                <div class="week-card">
                    <div class="week-title">Week 8</div>
                    <div class="week-percentage voldoende">72%</div>
                </div>
                <div class="week-card">
                    <div class="week-title">Week 9</div>
                    <div class="week-percentage onvoldoende">58%</div>
                </div>
                <div class="week-card">
                    <div class="week-title">Week 10</div>
                    <div class="week-percentage kritiek">45%</div>
                </div>
                <div class="week-card">
                    <div class="week-title">Week 11</div>
                    <div class="week-percentage goed">83%</div>
                </div>
                <div class="week-card">
                    <div class="week-title">Week 12</div>
                    <div class="week-percentage voldoende">69%</div>
                </div>
            </div>
        </div>

        <!-- BROWSER FOOTER -->
    </div>



    <script src="{{ asset('js/student-overview.js') }}"></script>
</body>

</html>
