<?php

// app/Services/AarImportService.php
namespace App\Services;

use App\Models\Student;
use App\Models\AttendanceRecord;
use App\Models\ImportLog;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class AarImportService
{
    public function importAarFile($filePath, $originalFileName)
    {
        $startTime = now();
        $stats = [
            'aantal_records' => 0,
            'aantal_nieuwe_studenten' => 0,
            'aantal_updates' => 0,
            'fouten' => []
        ];

        try {
            // Valideer bestandsnaam
            if (!$this->validateFileName($originalFileName)) {
                throw new Exception("Ongeldige bestandsnaam. Verwacht formaat: AAR_[JAAR]_W[WEEK]_[CODE].[extensie]");
            }

            // Parse bestandsnaam voor week en jaar info
            $fileInfo = $this->parseFileName($originalFileName);
            
            // Laad spreadsheet
            $spreadsheet = IOFactory::load($filePath);
            $worksheet = $spreadsheet->getActiveSheet();
            $data = $worksheet->toArray();

            // Valideer headers
            if (!$this->validateHeaders($data[0])) {
                throw new Exception("Ongeldige kolom headers. Verwacht: Studentnummer, Aanwezigheid, Rooster, Week, Jaar");
            }

            // Begin database transactie
            DB::beginTransaction();

            // Verwerk data rijen (skip header)
            for ($i = 1; $i < count($data); $i++) {
                $row = $data[$i];
                
                // Skip lege rijen
                if ($this->isEmptyRow($row)) {
                    continue;
                }

                $result = $this->processRow($row, $originalFileName, $startTime);
                
                if ($result['success']) {
                    $stats['aantal_records']++;
                    if ($result['new_student']) {
                        $stats['aantal_nieuwe_studenten']++;
                    }
                    if ($result['updated']) {
                        $stats['aantal_updates']++;
                    }
                } else {
                    $stats['fouten'][] = "Rij " . ($i + 1) . ": " . $result['error'];
                }
            }

            // Commit transactie
            DB::commit();

            // Log succesvolle import
            $this->logImport($originalFileName, 'success', 
                "Import succesvol voltooid. {$stats['aantal_records']} records verwerkt.", 
                $stats, $startTime);

            return [
                'success' => true,
                'message' => "Bestand succesvol geïmporteerd",
                'stats' => $stats
            ];

        } catch (Exception $e) {
            DB::rollback();
            
            $errorMessage = "Import gefaald: " . $e->getMessage();
            $this->logImport($originalFileName, 'error', $errorMessage, $stats, $startTime);
            
            Log::error("AAR Import Error", [
                'file' => $originalFileName,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'message' => $errorMessage,
                'stats' => $stats
            ];
        }
    }

    private function validateFileName($fileName)
    {
        // AAR_[JAAR]_W[WEEK]_[CODE].[extensie]
        $pattern = '/^AAR_\d{4}_W\d{1,2}_[a-zA-Z0-9]+\.(xlsx|ods)$/';
        return preg_match($pattern, $fileName);
    }

    private function parseFileName($fileName)
    {
        preg_match('/AAR_(\d{4})_W(\d{1,2})_([a-zA-Z0-9]+)\./', $fileName, $matches);
        
        return [
            'jaar' => (int)$matches[1],
            'week' => (int)$matches[2],
            'code' => $matches[3]
        ];
    }

    private function validateHeaders($headers)
    {
        $expectedHeaders = ['Studentnummer', 'Aanwezigheid', 'Rooster', 'Week', 'Jaar'];
        
        // Trim whitespace from headers
        $cleanHeaders = array_map('trim', $headers);
        
        return $cleanHeaders === $expectedHeaders;
    }

    private function isEmptyRow($row)
    {
        return empty(array_filter($row, function($cell) {
            return !empty(trim($cell));
        }));
    }

    private function processRow($row, $fileName, $importTime)
    {
        try {
            // Extract en valideer data
            $studentnummer = trim($row[0]);
            $aanwezigheid = (int)$row[1];
            $rooster = (int)$row[2];
            $week = (int)$row[3];
            $jaar = (int)$row[4];

            // Validatie
            if (empty($studentnummer)) {
                throw new Exception("Studentnummer is verplicht");
            }
            if ($aanwezigheid < 0) {
                throw new Exception("Aanwezigheid moet >= 0 zijn");
            }
            if ($rooster <= 0) {
                throw new Exception("Rooster moet > 0 zijn");
            }
            if ($week <= 0 || $week > 53) {
                throw new Exception("Week moet tussen 1 en 53 zijn");
            }
            if ($jaar < 2020 || $jaar > 2030) {
                throw new Exception("Jaar moet tussen 2020 en 2030 zijn");
            }

            // Zoek of maak student
            $student = Student::firstOrCreate(['studentnummer' => $studentnummer]);
            $newStudent = $student->wasRecentlyCreated;

            // Zoek bestaand record
            $existingRecord = AttendanceRecord::where([
                'studentnummer' => $studentnummer,
                'week' => $week,
                'jaar' => $jaar
            ])->first();

            $updated = false;

            if ($existingRecord) {
                // Update bestaand record alleen als de nieuwe data "beter" is
                // (dit kan uitgebreid worden met meer logica indien nodig)
                $existingRecord->update([
                    'aanwezigheid' => $aanwezigheid,
                    'rooster' => $rooster,
                    'bron_bestand' => $fileName,
                    'geimporteerd_op' => $importTime
                ]);
                $updated = true;
            } else {
                // Nieuw record aanmaken
                AttendanceRecord::create([
                    'studentnummer' => $studentnummer,
                    'aanwezigheid' => $aanwezigheid,
                    'rooster' => $rooster,
                    'week' => $week,
                    'jaar' => $jaar,
                    'bron_bestand' => $fileName,
                    'geimporteerd_op' => $importTime
                ]);
            }

            return [
                'success' => true,
                'new_student' => $newStudent,
                'updated' => $updated
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    private function logImport($fileName, $status, $message, $stats, $startTime)
    {
        ImportLog::create([
            'bestandsnaam' => $fileName,
            'status' => $status,
            'bericht' => $message,
            'aantal_records' => $stats['aantal_records'],
            'aantal_nieuwe_studenten' => $stats['aantal_nieuwe_studenten'],
            'aantal_updates' => $stats['aantal_updates'],
            'geimporteerd_op' => $startTime
        ]);
    }
}