<?php

use App\Commune;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    $communes = Commune::orderBy('field_commune')->get('field_commune')->map(function($c){ return $c->field_commune;})->unique();
    $trajets = Trajet::get('field_commune')->map(function($c){ return $c->field_commune;})->unique();
    $cities = $communes->filter(function($city) use ($trajets){
        return $trajets->contains($city);
    });
    $debug = request()->has('debug');
    return view('welcome', compact('cities', 'debug'));
});


Route::get('/api/trajets/{commune}', function($commune) {
    return [
        "par_trajet" => Trajet::where('field_commune', strtoupper($commune))->orderBy('field_travail_commune', 'asc')->get(),
        "par_commune" => Commune::where('field_commune', strtoupper($commune))->first()
    ];
});



Route::get('/api/commune/{commune}', function($commune) {
    return [
        "par_commune" => Commune::where('field_commune', strtoupper($commune))->first()
    ];
});
