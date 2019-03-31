<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>Laravel</title>

        <!-- Fonts -->
        <link href="https://fonts.googleapis.com/css?family=Nunito:200,600" rel="stylesheet">

        <!-- Styles -->
        <style>
            html, body {
                background-color: #fff;
                color: #636b6f;
                font-family: 'Nunito', sans-serif;
                font-weight: 200;
                height: 100vh;
                margin: 0;
            }

            .full-height {
                height: 100vh;
            }

            .flex-center {
                align-items: center;
                display: flex;
                justify-content: center;
            }

            .position-ref {
                position: relative;
            }

            .top-right {
                position: absolute;
                right: 10px;
                top: 18px;
            }

            .content {
                text-align: center;
            }

            .title {
                font-size: 84px;
            }

            .links > a {
                color: #636b6f;
                padding: 0 25px;
                font-size: 13px;
                font-weight: 600;
                letter-spacing: .1rem;
                text-decoration: none;
                text-transform: uppercase;
            }

            .m-b-md {
                margin-bottom: 30px;
            }

            #map {
                height: 100vh;
                width:100%;
            }
            #app {
                height: 100vh;

                width:100vw;
                display: grid;
                grid-template-columns: 500px 1fr;
            }
            .visually-hidden {
                border: 0;
                clip: rect(0 0 0 0);
                height: 1px;
                margin: -1px;
                overflow: hidden;
                padding: 0;
                position: absolute;
                width: 1px;
            }
            span.help {
                border-radius: 50%;
                border: 1px solid #333;
                display: inline-block;
                width: 2ch;
                height: 2ch;
                text-align: center;
                font-family: monospace;
                transform: scale(.8);
            }

            .cities {
                display:flex;
                margin-top:10px;
            }
            .cities .city {
                flex:50%;
                width: 50%;
                padding: 0 10px 10px 10px;
            }

            .cities .city h3 {
                margin-top:0;
            }
            .cities .origin {
                border-right:1px solid #ccc;
            }
        </style>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.4.0/dist/leaflet.css"
   integrity="sha512-puBpdR0798OZvTTbP4A8Ix/l+A4dHDD0DGqYW6RQ+9jxkRFclaxxQb/SJAWZfWAkuyeQUytO7+7N4QKrDh+drA=="
   crossorigin=""/>
   <link href="https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/css/select2.min.css" rel="stylesheet" />
    </head>
    <body>
        <div id="app">
            <aside>

                <div>
                    <button id="example">Tlse</button>
                    <button action="center">Centrer</button>
                </div>
                <div class="cities">
                    <div class="origin city">
                            <h3>Départ</h3>
                            <div>
                                <select name="city" id="city" class="city-select">
                                    <option value="">-</option>
                                    @foreach($cities as $c)
                                    <option value="{{$c}}">{{ucfirst($c)}}</option>
                                    @endforeach
                                </select>
                            </div>
                        <section id="origin"></section>
                    </div>
                    <div class="destination city">
                        <h3>Destination</h3>
                        <div>
                            <select name="dest" id="dest-select"></select>
                        </div>
                        <section id="destination"></section>
                    </div>
                </div>

            </aside>
            <div id="map"></div>
        </div>


   <script src="{{asset('js/app.js')}}"></script>

   <script>

   </script>
    </body>
</html>
