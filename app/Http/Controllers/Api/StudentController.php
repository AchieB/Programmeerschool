<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\AttendanceRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentController extends Controller
{
    public function index(Request $request)
    {
        $query = Student::with('attendanceRecords');
        
        // Filteren op jaar
        if ($request->has('jaar')) {
            $query->whereHas('attendanceRecords', function($q) use ($request) {
                $q->where('jaar', $request->jaar);
            });
        }
        
        // Filteren op week
        if ($request->has('week')) {
            $query->whereHas('attendanceRecords', function($q) use ($request) {
                $q->where('week', $request->week);
                if ($request->has('jaar')) {
                    $q->where('jaar', $request->jaar);
                }
            });
        }
        
        // Filteren op week range
        if ($request->has('week_van') && $request->has('week_tot')) {
            $query->whereHas('attendanceRecords', function($q) use ($request) {
                $q->whereBetween('week', [$request->week_van, $request->week_tot]);
                if ($request->has('jaar')) {
                    $q->where('jaar', $request->jaar);
                }
            });
        }
        
        // Paginatie
        $students = $query->paginate($request->get('per_page', 50));
        
        // Voeg berekende velden toe
        $students->getCollection()->transform(function ($student) use ($request) {
            $records = $student->attendanceRecords;
            
            // Apply filters to records
            if ($request->has('jaar')) {
                $records = $records->where('jaar', $request->jaar);
            }
            
            if ($request->has('week')) {
                $records = $records->where('week', $request->week);
            }
            
            if ($request->has('week_van') && $request->has('week_tot')) {
                $records = $records->whereBetween('week', [$request->week_van, $request->week_tot]);
            }
            
            $totalAanwezigheid = $records->sum('aanwezigheid');
            $totalRooster = $records->sum('rooster');
            $percentage = $totalRooster > 0 ? round(($totalAanwezigheid / $totalRooster) * 100, 2) : 0;
            
            return [
                'studentnummer' => $student->studentnummer,
                'naam' => $student->naam,
                'aanwezigheid_minuten' => $totalAanwezigheid,
                'rooster_minuten' => $totalRooster,
                'percentage' => $percentage,
                'categorie' => $this->getAttendanceCategory($percentage),
                'aantal_weken' => $records->count(),
                'week_details' => $records->map(function($record) {
                    return [
                        'week' => $record->week,
                        'jaar' => $record->jaar,
                        'aanwezigheid' => $record->aanwezigheid,
                        'rooster' => $record->rooster,
                        'percentage' => $record->attendance_percentage,
                        'categorie' => $record->attendance_category
                    ];
                })->sortBy('week')->values()
            ];
        });
        
        return response()->json([
            'success' => true,
            'data' => $students,
            'filters_applied' => [
                'jaar' => $request->get('jaar'),
                'week' => $request->get('week'),
                'week_van' => $request->get('week_van'),
                'week_tot' => $request->get('week_tot')
            ]
        ]);
    }
    
    public function show(Request $request, $studentnummer)
    {
        $student = Student::where('studentnummer', $studentnummer)->first();
        
        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Student niet gevonden'
            ], 404);
        }
        
        $query = $student->attendanceRecords();
        
        // Filter opties
        if ($request->has('jaar')) {
            $query->where('jaar', $request->jaar);
        }
        
        if ($request->has('week_van') && $request->has('week_tot')) {
            $query->whereBetween('week', [$request->week_van, $request->week_tot]);
        }
        
        $records = $query->orderBy('jaar')->orderBy('week')->get();
        
        // Bereken totalen
        $totalAanwezigheid = $records->sum('aanwezigheid');
        $totalRooster = $records->sum('rooster');
        $percentage = $totalRooster > 0 ? round(($totalAanwezigheid / $totalRooster) * 100, 2) : 0;
        
        return response()->json([
            'success' => true,
            'data' => [
                'student' => [
                    'studentnummer' => $student->studentnummer,
                    'naam' => $student->naam,
                    'totaal_percentage' => $percentage,
                    'categorie' => $this->getAttendanceCategory($percentage)
                ],
                'records' => $records->map(function($record) {
                    return [
                        'week' => $record->week,
                        'jaar' => $record->jaar,
                        'aanwezigheid' => $record->aanwezigheid,
                        'rooster' => $record->rooster,
                        'percentage' => $record->attendance_percentage,
                        'categorie' => $record->attendance_category,
                        'bron_bestand' => $record->bron_bestand,
                        'geimporteerd_op' => $record->geimporteerd_op
                    ];
                }),
                'statistieken' => [
                    'totaal_aanwezigheid' => $totalAanwezigheid,
                    'totaal_rooster' => $totalRooster,
                    'aantal_weken' => $records->count(),
                    'gemiddelde_per_week' => $records->count() > 0 ? round($totalAanwezigheid / $records->count()) : 0
                ]
            ]
        ]);
    }
    
    public function byWeek(Request $request, $week, $jaar)
    {
        $students = Student::whereHas('attendanceRecords', function($q) use ($week, $jaar) {
            $q->where('week', $week)->where('jaar', $jaar);
        })
        ->with(['attendanceRecords' => function($q) use ($week, $jaar) {
            $q->where('week', $week)->where('jaar', $jaar);
        }])
        ->get();
        
        $result = $students->map(function($student) use ($week, $jaar) {
            $record = $student->attendanceRecords->first();
            
            return [
                'studentnummer' => $student->studentnummer,
                'naam' => $student->naam,
                'week' => $week,
                'jaar' => $jaar,
                'aanwezigheid' => $record->aanwezigheid,
                'rooster' => $record->rooster,
                'percentage' => $record->attendance_percentage,
                'categorie' => $record->attendance_category,
                'bron_bestand' => $record->bron_bestand,
                'geimporteerd_op' => $record->geimporteerd_op
            ];
        });
        
        // Sorteer op percentage (laagste eerst voor makkelijk probleem-identificatie)
        $result = $result->sortBy('percentage')->values();
        
        return response()->json([
            'success' => true,
            'data' => [
                'week' => $week,
                'jaar' => $jaar,
                'studenten' => $result,
                'statistieken' => [
                    'totaal_studenten' => $result->count(),
                    'gemiddeld_percentage' => $result->avg('percentage'),
                    'categorien' => [
                        'Perfect' => $result->where('categorie', 'Perfect')->count(),
                        'Excellent' => $result->where('categorie', 'Excellent')->count(),
                        'Goed' => $result->where('categorie', 'Goed')->count(),
                        'Voldoende' => $result->where('categorie', 'Voldoende')->count(),
                        'Onvoldoende' => $result->where('categorie', 'Onvoldoende')->count(),
                        'Kritiek' => $result->where('categorie', 'Kritiek')->count(),
                        'Geen aanwezigheid' => $result->where('categorie', 'Geen aanwezigheid')->count()
                    ]
                ]
            ]
        ]);
    }
    
    public function weeklyProgress(Request $request, $studentnummer)
    {
        $request->validate([
            'jaar' => 'nullable|integer' // Make jaar optional
        ]);
        
        // Find the student
        $student = Student::where('studentnummer', $studentnummer)->first();
        
        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Student niet gevonden'
            ], 404);
        }
        
        // If year is not specified, find the most recent year with data
        if ($request->has('jaar')) {
            $jaar = $request->jaar;
        } else {
            // Get the most recent year with data for this student
            $latestRecord = AttendanceRecord::where('studentnummer', $studentnummer)
                ->orderBy('jaar', 'desc')
                ->first();
            
            if (!$latestRecord) {
                return response()->json([
                    'success' => false,
                    'message' => 'Geen aanwezigheidsgegevens voor deze student'
                ], 404);
            }
            
            $jaar = $latestRecord->jaar;
        }
        
        // Get attendance records for this student in the specified year
        $records = AttendanceRecord::where('studentnummer', $studentnummer)
            ->where('jaar', $jaar)
            ->orderBy('week')
            ->get();
        
        if ($records->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Geen aanwezigheidsgegevens voor deze student in het opgegeven jaar'
            ], 404);
        }
        
        // Calculate weekly progress
        $weeklyProgress = [];
        $totalAanwezigheid = 0;
        $totalRooster = 0;
        
        foreach ($records as $record) {
            $weeklyProgress[] = [
                'week' => $record->week,
                'week_aanwezigheid' => $record->aanwezigheid,
                'week_rooster' => $record->rooster,
                'week_percentage' => $record->rooster > 0 
                    ? round(($record->aanwezigheid / $record->rooster) * 100, 1)
                    : 0
            ];
            
            $totalAanwezigheid += $record->aanwezigheid;
            $totalRooster += $record->rooster;
        }
        
        // Calculate total stats
        $eindPercentage = $totalRooster > 0 
            ? round(($totalAanwezigheid / $totalRooster) * 100, 1)
            : 0;
        
        return response()->json([
            'success' => true,
            'data' => [
                'student' => $student,
                'jaar' => $jaar,
                'wekelijkse_voortgang' => $weeklyProgress,
                'eindstatistieken' => [
                    'totaal_aanwezigheid' => $totalAanwezigheid,
                    'totaal_rooster' => $totalRooster,
                    'eindpercentage' => $eindPercentage
                ]
            ]
        ]);
    }
    
    private function getAttendanceCategory($percentage)
    {
        if ($percentage === 0) return 'Geen aanwezigheid';
        if ($percentage > 100) return 'Perfect';
        if ($percentage >= 95) return 'Excellent';
        if ($percentage >= 80) return 'Goed';
        if ($percentage >= 65) return 'Voldoende';
        if ($percentage >= 50) return 'Onvoldoende';
        return 'Kritiek';
    }
}