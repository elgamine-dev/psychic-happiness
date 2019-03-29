<?php

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
    $cities = Trajet::orderBy('commune')->get('commune')->map(function($c){ return $c->commune;})->unique();
    return view('welcome', compact('cities'));
});


Route::get('/api/trajets/{commune}', function( $commune) {
    return Trajet::whereCommune(strtoupper($commune))->get();
});
