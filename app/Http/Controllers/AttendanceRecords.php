<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecords;
use Illuminate\Http\Request;

class AttendanceRecords extends Controller
{
	public function index(Request $request) {
		$query = AttendanceRecords::query();

		

	} 
}
