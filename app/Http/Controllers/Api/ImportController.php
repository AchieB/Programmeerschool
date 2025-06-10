<?php

namespace	App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AarImportService;
use App\Models\ImportLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

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
                'success' => false, // Fixed typo: was 'succes'
                'message' => 'Upload failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function logs()
    {
        try {
            $logs = ImportLog::latest('created_at')
                ->take(10)
                ->get()
                ->map(function($log) {
                    return [
                        'date' => $log->created_at->format('d-m-Y'),
                        'time' => $log->created_at->format('H:i'),
                        'filename' => $log->bestandsnaam,
                        'records_imported' => $log->aantal_records,
                        'status' => $log->status === 'success' ? 'Succesvol' : 'Gefaald'
                    ];
                });
            
            return response()->json($logs);
        } catch (\Exception $e) {
            Log::error('Error retrieving import logs: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve import logs: ' . $e->getMessage()
            ], 500);
        }
    }
}