require('./bootstrap');
const L = require('leaflet')
require('select2')

let map;
let group;
let select;
let markers = []

$(document).ready(function() {
    select = $('.city-select')
    select.select2({width: '100%'});

    select.on('select2:select', ({params})=>{
        console.warn(params.data)
        const id = params.data.id

        $.get(`/api/trajets/${id}`).then((data)=>{
            console.log(data)
            resetGroup(data)
        })
    })

    map = L.map('map').setView([43.568, 1.404], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    group = L.layerGroup().addTo(map)

});

function resetGroup(collec) {

    if (map) {

        map.removeLayer(group)

    }

    group = L.layerGroup().addTo(map)
    center(collec[0].longitude, collec[0].latitude)
    collec.forEach((line, i)=> {
        const data = `${line.commune} > ${line.travail_commune}<br>
        ${duree(line.duree_auto_minutes)} mn en voiture<br>
        ${duree(line.duree_velo_minutes)} mn à vélo<br>
        ${co2(line.distance_auto_km)} kg de CO<sub>2</sub> émis<br>
        `
        markers[i] = L.marker([line.travail_latitude, line.travail_longitude]).addTo(group).bindPopup(data);
    })

}

function center (lon, lat) {
/*    var red = L.Icon({
                iconUrl: '/red.png'
     });

     L.marker([lat, lon], {icon: red}).addTo(group);
*/
    map.panTo(new L.LatLng(lat, lon))

    }

function duree(value) {
    if (value < 61) {
        return value
    }

    const hours = value / 60 | 0
    const minutes = value % 60

    return `${hours} h ${pad(minutes)}`
}

function pad(value) {
    if (value > 9) {
        return value
    }

    return `0${value}`
}

function co2(value) {
    return value * 135 / 1000;
}
