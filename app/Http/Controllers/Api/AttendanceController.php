<?php	
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $query = AttendanceRecord::with('student');
        
        // Filters
        if ($request->has('jaar')) {
            $query->where('jaar', $request->jaar);
        }
        
        if ($request->has('week')) {
            $query->where('week', $request->week);
        }
        
        if ($request->has('studentnummer')) {
            $query->where('studentnummer', $request->studentnummer);
        }
        
        if ($request->has('week_van') && $request->has('week_tot')) {
            $query->whereBetween('week', [$request->week_van, $request->week_tot]);
        }
        
        // Sorting
        $query->orderBy('jaar', 'desc')->orderBy('week', 'desc');
        
        $records = $query->paginate($request->get('per_page', 100));
        
        return response()->json([
            'success' => true,
            'data' => $records
        ]);
    }
    
    public function statistics(Request $request)
    {
        $jaar = $request->get('jaar', date('Y'));
        
        // Basis query
        $baseQuery = AttendanceRecord::where('jaar', $jaar);
        
        // Week filter indien opgegeven
        if ($request->has('week_van') && $request->has('week_tot')) {
            $baseQuery->whereBetween('week', [$request->week_van, $request->week_tot]);
        }
        
        // Bereken statistieken
        $totalRecords = $baseQuery->count();
        $totalStudents = $baseQuery->distinct('studentnummer')->count();
        
        // Aanwezigheidspercentages per categorie
        $categorieStats = DB::table('attendance_records')
            ->select(DB::raw('
                SUM(CASE 
                    WHEN aanwezigheid = 0 THEN 1 
                    ELSE 0 
                END) as geen_aanwezigheid,
                SUM(CASE 
                    WHEN (aanwezigheid * 100.0 / rooster) > 100 THEN 1 
                    ELSE 0 
                END) as perfect,
                SUM(CASE 
                    WHEN (aanwezigheid * 100.0 / rooster) BETWEEN 95 AND 100 THEN 1 
                    ELSE 0 
                END) as excellent,
                SUM(CASE 
                    WHEN (aanwezigheid * 100.0 / rooster) BETWEEN 80 AND 94 THEN 1 
                    ELSE 0 
                END) as goed,
                SUM(CASE 
                    WHEN (aanwezigheid * 100.0 / rooster) BETWEEN 65 AND 79 THEN 1 
                    ELSE 0 
                END) as voldoende,
                SUM(CASE 
                    WHEN (aanwezigheid * 100.0 / rooster) BETWEEN 50 AND 64 THEN 1 
                    ELSE 0 
                END) as onvoldoende,
                SUM(CASE 
                    WHEN (aanwezigheid * 100.0 / rooster) < 50 AND aanwezigheid > 0 THEN 1 
                    ELSE 0 
                END) as kritiek
            '))
            ->where('jaar', $jaar);
            
        if ($request->has('week_van') && $request->has('week_tot')) {
            $categorieStats->whereBetween('week', [$request->week_van, $request->week_tot]);
        }
        
        $stats = $categorieStats->first();
        
        // Trend data per week
        $weeklyTrend = DB::table('attendance_records')
            ->select(
                'week',
                DB::raw('AVG(aanwezigheid * 100.0 / rooster) as gemiddeld_percentage'),
                DB::raw('COUNT(*) as aantal_studenten')
            )
            ->where('jaar', $jaar)
            ->groupBy('week')
            ->orderBy('week')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => [
                'overzicht' => [
                    'jaar' => $jaar,
                    'totaal_records' => $totalRecords,
                    'totaal_studenten' => $totalStudents,
                    'aantal_weken' => $weeklyTrend->count()
                ],
                'categorien' => [
                    'Geen aanwezigheid' => (int)$stats->geen_aanwezigheid,
                    'Perfect' => (int)$stats->perfect,
                    'Excellent' => (int)$stats->excellent,
                    'Goed' => (int)$stats->goed,
                    'Voldoende' => (int)$stats->voldoende,
                    'Onvoldoende' => (int)$stats->onvoldoende,
                    'Kritiek' => (int)$stats->kritiek
                ],
                'wekelijkse_trend' => $weeklyTrend
            ]
        ]);
    }
}