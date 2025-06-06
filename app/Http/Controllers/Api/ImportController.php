<?php

namespace	App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
					$pattern = '/^AAR_\d{4}_W\d{1,2}_[a-zA-Z0-9]+\.(xlsx|ods)$/';
					if (!preg_match($pattern, $fileName)) {
						$fail('Invalid filename format');
					}
				}
			]
		]);

		try {
			$file = $request->file('aar_file');
			$originalName = $file->getClientOriginalName();

			$tempPath	= $file->storeAs('temp', $originalName);
			$fullPath = Storage::path($tempPath);

			$result = $this->aarImportService->importAarFile($fullPath, $originalName);

			Storage::delete($tempPath);

			return response()->json($result, $result['success'] ? 200 : 400);

		} catch (\Exception $e) {
			return response()->json([
				'succes' => false,
				'message' => 'Upload failed: ' . $e->getMessage()
			], 500);
		}

	}
}