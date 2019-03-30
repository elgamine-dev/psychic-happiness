<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class Trajets extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('trajets', function ($table) {
            $table->increments('id');

            $headers = [];
            $collection = [];
            $row = 1;
            if (($handle = fopen(database_path('hackaviz/par_trajet.csv'), "r")) !== false) {
                while (($data = fgetcsv($handle, 1000, ",")) !== false) {
                    $num = count($data);

                    if ($row === 1) {
                        for ($c = 0; $c < $num; $c++) {
                            $table->string("field_".$data[$c])->nullable();
                        }
                        break;
                    }
                }
                fclose($handle);
            }
        });

        Schema::create('communes', function ($table) {
            $table->increments('id');

            $headers = [];
            $collection = [];
            $row = 1;
            if (($handle = fopen(database_path('hackaviz/par_commune.csv'), "r")) !== false) {
                while (($data = fgetcsv($handle, 1000, ",")) !== false) {
                    $num = count($data);

                    if ($row === 1) {
                        for ($c = 0; $c < $num; $c++) {
                            $table->string("field_".$data[$c])->nullable();
                        }
                        break;
                    }
                }
                fclose($handle);
            }
        });

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
