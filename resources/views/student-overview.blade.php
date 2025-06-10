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
			<h1 class="browser-title">Student overzicht</h1>
			<div class="browser-profile"></div>
		</div>

		<!-- Student info section -->
		<div class="student-info">
			<!-- Will be populated by JavaScript -->
		</div>

		<!-- Summary cards -->
		<div class="summary-cards">
			<div class="summary-card">
				<h3>GEMIDDELDE</h3>
				<div class="value" id="average">--%</div>
			</div>
			<div class="summary-card">
				<h3>STATUS</h3>
				<div class="value" id="status">--</div>
			</div>
			<div class="summary-card">
				<h3>BESTE WEEK</h3>
				<div class="value" id="best-week">Week --</div>
			</div>
			<div class="summary-card">
				<h3>SLECHTSTE WEEK</h3>
				<div class="value" id="worst-week">Week --</div>
			</div>
		</div>

		<!-- Controls section -->
		<div class="controls">
			<div class="period-selector">
				<div class="period-input">
					<label>Van Week:</label>
					<select id="start-week">
						@for ($i = 1; $i <= 52; $i++)
							<option value="{{ $i }}" {{ $i == 1 ? 'selected' : '' }}>Week {{ $i }}</option>
						@endfor
					</select>
				</div>
				<div class="period-input">
					<label>Tot Week:</label>
					<select id="end-week">
						@for ($i = 1; $i <= 52; $i++)
							<option value="{{ $i }}" {{ $i == 52 ? 'selected' : '' }}>Week {{ $i }}</option>
						@endfor
					</select>
				</div>
			</div>
			<button id="filter-btn" class="btn">Filteren</button>
		</div>

		<!-- Weeks grid section - Dit is de grafiek die je mist! -->
		<div class="weeks-section" id="weeks-section">
			<div class="weeks-grid" id="weeks-grid"></div>
		</div>

		<!-- Script sectie -->
		<script>
			// Define API endpoints for JavaScript to use
			window.studentDataUrl = "{{ $apiEndpoints['studentData'] }}";
			window.weeklyDataUrl = "{{ $apiEndpoints['weeklyData'] }}";

			// Pass student number to JavaScript if available
			@if($studentnummer)
				window.studentnummer = "{{ $studentnummer }}";
			@endif

			// Initial student data from server (if available)
			@if($student)
				window.initialStudentData = {
					name: "{{ $student->naam }}",
					number: "{{ $student->studentnummer }}",
					class: "{{ $student->klas }}"
				};
			@endif
		</script>

		<script src="{{ asset('js/student-overview.js') }}"></script>
	</div>
</body>

</html>