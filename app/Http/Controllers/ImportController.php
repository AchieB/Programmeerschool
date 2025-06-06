<?php

namespace App\Http\Controllers;

use App\Services\AarImportService;
use App\Models\ImportLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ImportController extends Controller
{
    protected $aarImportService;

		public function __construct(AarImportService $aarImportService)
		{
			$this->aarImportService = $aarImportService;
		}

		public function index()
		{
			$recentImports = ImportLog::latest('geimporteerd_op')
						->take(10)
						->get();
			
			return view('import.index', compact('recentImports'));
		}
		
		public function upload(Request $request)
		{
			$request->validate([
				'aar_file' => [
					'required',
					'file',
					'mimes:xlsx,ods',
					'max:10240',
					function ($attribute, $value, $fail) {
						$fileName = $value->getClientOriginalName();
						$pattern = '/^AAR_\d{4}_W\d{1,2}_[a-ZA-Z0-9]+\.(xlsx|ods)$/';
						if (!preg_match($pattern, $fileName)) {
							$fail('Bestandsnaam moet het formaat AAR_[JAAR]_W[WEEK]_[CODE].extensie hebben.');
						}
					}
				]
			]);

			try {
				$file = $request->file('aar_file');
				$originalName = $file->getClientOriginalName();

				//Sla het bestand tijdelijk op
				$tempPath = $file->storeAs('temp', $originalName);
				$fullPath = Storage::path($tempPath);

				$result = $this->aarImportService->importAarFile($fullPath, $originalName);
				//Verwijder het tijdelijke bestand
				Storage::delete($tempPath);

				if ($result['succes']) {
					return redirect()->back()->with('success', [
					'message' => $result['message'],
					'stats' => $result['stats']
					]);
			} else {
				return redirect()->back()->with('error', $result['message']);
		}
	} catch (\Exception $e) {
	return redirect()->back()->with('error', 'Er is een fout opgetreden tijdens het uploaden: ' . $e->getMessage());
	}
}

public function logs()
{
	$logs = ImportLog::latest('geimporteerd_op')->paginate(20);
	return view('import.logs', compact('logs'));
}
		
}