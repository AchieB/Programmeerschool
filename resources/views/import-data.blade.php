@extends('layouts.app')

@section('title', 'import-data')

@section('content')
	<meta name="csrf-token" content="{{ csrf_token() }}">

	<div class="container">
		<!-- BROWSER HEADER -->
		<div class="browser-header">
			<div class="browser-title">Import data</div>
		</div>

		<!-- MAIN CONTENT -->
		<div class="main-content">

			<!-- AANWEZIGHEID IMPORTEREN SECTION -->
			<div class="section">
				<div class="section-title">Aanwezigheid importeren</div>
				<div class="section-content">
					<p style="color: #64748b; font-size: 14px; margin: 0;">
						Upload AAR-bestanden (.xlsx, .xls, .ods) om aanwezigheidsgegevens te importeren.
					</p>
				</div>
			</div>

			<!-- BESTAND UPLOADEN SECTION -->
			<div class="section">
				<div class="section-title">Bestand uploaden</div>
				<div class="section-content">

					<!-- UPLOAD AREA -->
					<div class="upload-area" onclick="document.getElementById('fileInput').click()" id="uploadArea">
						<div class="upload-icon">📁</div>
						<div class="upload-text">Klik om bestand te selecteren of sleep het hierheen</div>
						<div class="upload-subtext">Ondersteunde formaten: .xlsx, .xls, .ods (max 10MB)</div>
						<button type="button" class="btn">Selecteer Bestand</button>
					</div>

					<!-- FILE INFO -->
					<div class="file-info" id="fileInfo">
						<div class="file-name" id="fileName">Geen bestand geselecteerd</div>
						<div class="file-details" id="fileDetails">Selecteer een AAR-bestand om te uploaden</div>
					</div>

					<!-- UPLOAD BUTTON -->
					<div style="margin-top: 16px; text-align: center;">
						<button type="button" class="btn" onclick="uploadFile()" id="uploadBtn" disabled>
							Upload Bestand
						</button>
					</div>

					<!-- PROGRESS BAR -->
					<div class="upload-progress" id="uploadProgress">
						<div class="progress-bar">
							<div class="progress-fill" id="progressFill"></div>
						</div>
						<div class="progress-text" id="progressText">0%</div>
					</div>

					<!-- HIDDEN FILE INPUT -->
					<input type="file" id="fileInput" accept=".xlsx,.xls,.ods" onchange="handleFileSelect(event)">
				</div>
			</div>

			<!-- IMPORT STATUS SECTION -->
			<div class="section">
				<div class="section-title">Import status</div>
				<div class="section-content" id="statusContent">

					@if (session('success'))
						<div class="status-message success">
							{{ session('success') }}
						</div>
					@endif

					@if (session('error'))
						<div class="status-message error">
							{{ session('error') }}
						</div>
					@endif

					@if ($errors->any())
						<div class="status-message error">
							@foreach ($errors->all() as $error)
								{{ $error }}<br>
							@endforeach
						</div>
					@endif

					<div class="status-message" id="statusMessage" style="display: none;">
						<!-- Dynamic status message -->
					</div>
				</div>
			</div>

			<!-- IMPORT HISTORY SECTION -->
			<div class="section">
				<div class="section-title">Import history</div>
				<div class="section-content">
					<table class="history-table">
						<thead>
							<tr>
								<th>Datum</th>
								<th>Tijd</th>
								<th>Bestand naam</th>
								<th>Records</th>
								<th>Status</th>
							</tr>
						</thead>
						<tbody id="historyTableBody">
							@forelse($importHistory ?? [] as $record)
								<tr>
									<td>{{ $record->created_at->format('d-m-Y') }}</td>
									<td>{{ $record->created_at->format('H:i') }}</td>
									<td>{{ $record->filename }}</td>
									<td>{{ $record->records_imported ?? '-' }}</td>
									<td>
										<span class="status-{{ strtolower($record->status) }}">
											{{ $record->status }}
										</span>
									</td>
								</tr>
							@empty
								<tr>
									<td colspan="5" style="text-align: center; color: #64748b;">
										Nog geen imports uitgevoerd
									</td>
								</tr>
							@endforelse
						</tbody>
					</table>
				</div>
			</div>

		</div>

		<!-- BROWSER FOOTER -->
		<div class="browser-footer"></div>
	</div>

	<!-- Include CSS and JS -->
	<link rel="stylesheet" href="{{ asset('css/import.css') }}">
	<script src="{{ asset('js/import.js') }}"></script>

	<script>
		// Temporary URLs for testing (will be replaced when backend is ready)
		window.uploadUrl = 'api/import/upload';
		window.historyUrl = 'api/import/logs';
		console.log('Import page loaded in test mode');
	</script>

@endsection