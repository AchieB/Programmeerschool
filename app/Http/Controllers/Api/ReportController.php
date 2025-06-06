<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\AttendanceRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
	public function studentsPercentageFilter(Request $request)
	{
      $request->validate([
            'min_percentage' => 'required|numeric|min:0',
            'max_percentage' => 'nullable|numeric|min:0',
            'jaar' => 'required|integer'
        ]);
        
				$minPercentage = $request->min_percentage;
        $maxPercentage = $request->max_percentage ?? 999;
        $jaar = $request->jaar;

				//SubQuery voor percentage berekening per student
        $studentsWithPercentage = DB::table('attendance_records')
            ->select(
                'studentnummer',
                DB::raw('SUM(aanwezigheid) as totaal_aanwezigheid'),
                DB::raw('SUM(rooster) as totaal_rooster'),
                DB::raw('(SUM(aanwezigheid) * 100.0 / SUM(rooster)) as percentage')
            )
            ->where('jaar', $jaar)
            ->groupBy('studentnummer')
            ->havingRaw('(SUM(aanwezigheid) * 100.0 / SUM(rooster)) BETWEEN ? AND ?', [$minPercentage, $maxPercentage]);
        
        $students = Student::joinSub($studentsWithPercentage, 'stats', function ($join) {
                $join->on('students.studentnummer', '=', 'stats.studentnummer');
            })
            ->select('students.*', 'stats.totaal_aanwezigheid', 'stats.totaal_rooster', 'stats.percentage')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => [
                'filters' => [
                    'min_percentage' => $minPercentage,
                    'max_percentage' => $maxPercentage,
                    'jaar' => $jaar
                ],
                'studenten' => $students,
                'aantal_gevonden' => $students->count()
            ]
        ]);
    }

		public function weeklyComparison(Request $request)
		{
			$request->validate([
				'week1' => 'required|integer|min:1|max:53',
				'week2' => 'required|integer|min:1|max:53',
				'jaar' => 'required|integer'
			]);

			  $week1 = $request->week1;
        $week2 = $request->week2;
        $jaar = $request->jaar;

				$comparison = DB::table('attendance_records as ar1')
						->leftJoin('attendance_records as ar2', function($join) use ($week2, $jaar) {
							$join->on('ar1.studentnummer', '=',  'ar2.studentnummer')
									->where('ar2.week', $week2)
									->where('ar.jaar', $jaar);
			
				})
				->leftJoin('students', 'ar1.studentnummer', '=', 'students.studentnummer')
				->select(
					'ar1.studentnummer',
					DB::raw('ar1.aanwezigheid as week1_aanwezigheid'),
					DB::raw('ar1.rooster as week1_rooster'),
					DB::raw('(ar1.aanwezigheid * 100.0 / ar1.rooster) as week1_percentage'),
					DB::raw('COALESCE(ar2.aanwezigheid, 0) as week2_aanwezigheid'),
				 	DB::raw('COALESCE(ar2.rooster, 0) as week2_rooster'),
				 	DB::raw('CASE 
       	      WHEN ar2.rooster > 0 THEN (ar2.aanwezigheid * 100.0 / ar2.rooster)
              ELSE 0 
          END as week2_percentage'),
         	DB::raw('CASE 
              WHEN ar2.rooster > 0 THEN ((ar2.aanwezigheid * 100.0 / ar2.rooster) - (ar1.aanwezigheid * 100.0 / ar1.rooster))
              ELSE NULL 
          END as percentage_verschil')
        )
         ->where('ar1.week', $week1)
         ->where('ar1.jaar', $jaar)
         ->get();
				 
				        return response()->json([
            'success' => true,
            'data' => [
                'vergelijking' => [
                    'week1' => $week1,
                    'week2' => $week2,
                    'jaar' => $jaar
                ],
                'resultaten' => $comparison
            ]
        ]);
    }
}
