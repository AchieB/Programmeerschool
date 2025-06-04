<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\AttendanceRecords;

class AttendanceRecordsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
       DB::table('attendence_records')->insert([
				'aanwezigheid' => number_between($min = 0, $max = 900 ),
				'rooster' => number_between($min = 5, $max = 850),
				'week' => number_between($min = 1, $max = 52) ,
				'jaar' =>year($max = 'now') ,
			 ]);
    }
}
