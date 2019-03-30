<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class PopulateTrajts extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        $headers = [];
        $collection = [];
        $row = 1;
        if (($handle = fopen(database_path('hackaviz/par_trajet.csv'), "r")) !== false) {
            while (($data = fgetcsv($handle, 1000, ",")) !== false) {
                $num = count($data);

                if ($row === 1) {
                    $headers = $data;
                    $row++;

                    continue;
                }
                $row++;
                $formatted = [];

                for ($c = 0; $c < $num; $c++) {
                    $formatted["field_".$headers[$c]] = utf8_encode($data[$c]);
                }

                DB::table('trajets')->insert($formatted);

            }
            fclose($handle);
        }

    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        //
    }
}
