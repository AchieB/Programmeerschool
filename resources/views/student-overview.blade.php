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
        <div class="browser-header">
            <div class="browser-title">Student overzicht</div>
            <div class="browser-profile"></div>
        </div>

        <div class="student-info">
            <div class="student-field">Student Naam:</div>
            <div class="student-field">Student nr:</div>
            <div class="student-field">Student Klas:</div>
        </div>

        <div class="controls">
            <div class="period-selector">
                <div class="period-input">
                    <label for="start-week">Van Week:</label>
                    <select id="start-week">
                        <option value="1">Week 1</option>
                        <option value="2">Week 2</option>
                        <option value="3" selected>Week 3</option>
                        <option value="4">Week 4</option>
                        <option value="5">Week 5</option>
                        <option value="6">Week 6</option>
                        <option value="7">Week 7</option>
                        <option value="8">Week 8</option>
                        <option value="9">Week 9</option>
                        <option value="10">Week 10</option>
                        <option value="11">Week 11</option>
                        <option value="12">Week 12</option>
                    </select>
                </div>
                <div class="period-input">
                    <label for="end-week">Tot Week:</label>
                    <select id="end-week">
                        <option value="1">Week 1</option>
                        <option value="2">Week 2</option>
                        <option value="3">Week 3</option>
                        <option value="4">Week 4</option>
                        <option value="5">Week 5</option>
                        <option value="6">Week 6</option>
                        <option value="7">Week 7</option>
                        <option value="8" selected>Week 8</option>
                        <option value="9">Week 9</option>
                        <option value="10">Week 10</option>
                        <option value="11">Week 11</option>
                        <option value="12">Week 12</option>
                    </select>
                </div>
            </div>
            <button class="btn" id="filter-btn">Filteren</button>
        </div>

        <div class="summary-cards">
            <div class="summary-card">
                <h3>Gemiddelde</h3>
                <div class="value good" id="average">68%</div>
            </div>
            <div class="summary-card">
                <h3>Status</h3>
                <div class="value voldoende" id="status">Voldoende</div>
            </div>
            <div class="summary-card success">
                <h3>Beste week</h3>
                <div class="value" id="best-week">Week 1</div>
            </div>
            <div class="summary-card danger">
                <h3>Slechtste week</h3>
                <div class="value" id="worst-week">Week 5</div>
            </div>
        </div>

        <div class="weeks-section" id="weeks-section">
            <div class="weeks-title">Afgelopen weken</div>
            <div class="weeks-grid" id="weeks-grid">
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
                            <span class="percentage-text" id="circle-percentage">70%</span>
                        </div>
                        <div style="font-size: 14px; color: #64748b;">Week 3 - Week 8</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="{{ asset('js/student-overview.js') }}"></script>
</body>

</html>
