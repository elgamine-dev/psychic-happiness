require('./bootstrap');
const L = require('leaflet')
require('select2')

let map;
let group;
let layer;
let select;
let markers = []

let RedIcon = L.icon({
    iconUrl: '/red.png'
});

const ExtendedMarker = L.Marker.extend({
    options: {
        _data: {}
    }
})

$(document).ready(function () {
    select = $('.city-select')
    select.select2({ width: '100%' });

    select.on('select2:select', ({ params }) => {
        console.warn(params.data)
        const id = params.data.id

        $.get(`/api/trajets/${id}`).then(processData)
    })

    map = L.map('map').setView([43.568, 1.404], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    map.on('popupopen', (e) =>{
        console.log(e.popup._source.options._data)
    })
});


function resetGroup(collec) {

    if (map && group) {
        map.removeLayer(group)
        markers = []
    }

    layer = L.layerGroup().addTo(map)

    collec.forEach((line, i) => {
        const data = `${line.origin.nom} > ${line.destination.nom}<br>
        ${duree(line.trajet.duree.auto)} mn en voiture<br>
        ${duree(line.trajet.duree.velo)} mn à vélo<br>
        ${co2(line.trajet.distance.auto)} kg de CO<sub>2</sub> émis<br>
        `
        markers[i] = new ExtendedMarker([line.destination.lon, line.destination.lat], {_data:line}).bindPopup(data);
    })

    center(collec[0].origin)

    group = new L.featureGroup(markers)
    group.addTo(layer)
    map.fitBounds(group.getBounds())

}

function processData(data) {
        const trajets = data.par_trajet
            .filter(inconsistant)
            .map(Trajet)
        resetGroup(trajets)
}

function inconsistant(entry) {
    return entry.travail_insee !== "0" && entry.distance_auto_km < 500
}

function center({lon, lat, nom}) {
    markers.push(L.marker([lon, lat], { icon: RedIcon }).bindPopup(nom));
    map.panTo(new L.LatLng(lon, lat))
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


function Trajet (data) {
    return {
        _id: data.id,
        origin: {
            nom: data.commune,
            departement: data.departement,
            lat: data.longitude,
            lon: data.latitude,
            inter: {
                y2009: data["2009_inter"],
                y2014: data["2014_inter"],
            },
            extra: {
                y2009: data["2009_extra"],
                y2014: data["2014_extra"],
            },
            meta: {
                insee: data.insee,
                menages: data.menages,
                habitants: data.habitants,
                emplois: data.emplois,
                pers_par_menages: data.pers_par_menages,
                revenu_median: data.revenu_median,
                unite_conso_menages: data.unite_conso_menages,
            }
        },
        destination: {
            nom: data.travail_commune,
            departement: data.travail_departement,
            lat: data.travail_longitude,
            lon: data.travail_latitude,
            extra:{
                y2009: data["2009_extra_travail_commune"],
                y2014: data["2014_extra_travail_commune"],
            },
            meta: {
                insee: data.travail_insee,
                emplois: data.travail_emplois,
            }
        },
        trajet: {
            distance: {
                auto: data.distance_auto_km,
                velo: data.distance_velo_km,
                oiseau: data.distance_oiseau_km,
            },
            duree: {
                auto: data.duree_auto_minutes,
                velo: data.duree_velo_minutes,

            }
        },
    }
}
