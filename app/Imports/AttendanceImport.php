<?php 

namespace App\Imports;


use App\Models\Students;
use App\Models\AttendanceRecords;
use app\Models\ImportLogs;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\ToCollection;
use Illuminate\Support\Collection;

class AttendanceImport implements ToCollection, WithHeadingRow
{
	public function collection(Collection $rows)
	{
		foreach ($rows as $row){
			$student = Students::FirstOrCreate([
				'student_nummmer' => $row['studentnummer']
			]);

			AttendanceRecords::UpdateOrCreate([
				'student_id'	=> $student->id,
				'week' =>	 $row['week'],
				'jaar' => $row['jaar'],
			],
			[
				'aanwezigheid'	=> $row['aanwezigheid'],
				'rooster'	=>	$row['rooster'],
				'import_log_id'	=>request()->import_log_id ?? null,
			]);


		}
	}
}