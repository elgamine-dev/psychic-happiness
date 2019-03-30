require('./bootstrap');
const L = require('leaflet')
require('select2')

let map;
let group;
let layer;
let select;
let originFragment;
let destinationFragment;

let RedIcon = L.icon({
    iconUrl: '/red.png'
});

const store = window.store =  {
    markers:[],
    current: {}
}

const ExtendedMarker = L.Marker.extend({
    options: {
        _data: {}
    }
})

$(document).ready(function () {
    select = $('.city-select')
    originFragment = $('aside #origin')
    destinationFragment = $('aside #destination')


    select.select2({ width: '100%' });

    map = L.map('map').setView([43.568, 1.404], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    listeners()
});

function listeners() {

    select.on('select2:select', ({ params }) => {
        console.warn(params.data)
        const id = params.data.id

        $.get(`/api/trajets/${id}`).then(processData)
    })

    $("#example").on('click', ()=>{
        const ex = "toulouse"
        $.get(`/api/trajets/${ex}`).then(processData)
    })

    $("button[action]").on('click', (e)=>{
        actions($(e.target).attr('action'), e.target)
    })

    map.on('popupopen', (e) =>{
        console.log(e.popup._source.options._data)
        if (typeof e.popup._source.options._data !== 'undefined') {
            const commune = e.popup._source.options._data.destination.nom
            $.get(`/api/commune/${commune}`).then(updateDestination)
        }

    })
}

function resetGroup(collec) {

    if (map && group) {
        map.removeLayer(group)
        store.markers = []
    }

    layer = L.layerGroup().addTo(map)

    collec.forEach((line, i) => {
        const data = `<h4>${line.origin.nom} > ${line.destination.nom}</h4>
        ${duree(line.trajet.duree.auto)} mn en voiture<br>
        ${duree(line.trajet.duree.velo)} mn à vélo<br>
        ${co2(line.trajet.distance.auto)} kg de CO<sub>2</sub> émis<br>
        `
        store.markers[i] = new ExtendedMarker([line.destination.lon, line.destination.lat], {_data:line}).bindPopup(data);
    })

    center(collec[0].origin)

    group = new L.featureGroup(store.markers)
    group.addTo(layer)
    map.fitBounds(group.getBounds())

}

function processData(data) {
    const trajets = data.par_trajet
        .filter(inconsistant)
        .map(Trajet)
    const commune = new Commune(data.par_commune)
    store.current = commune
    render(originFragment, {name:commune.nom, commune:commune})
    resetGroup(trajets)
}

function updateDestination(data) {
    const commune = new Commune(data.par_commune)
    render(destinationFragment, {name:commune.nom, commune:commune})
}


function render(sel, data) {
    console.warn(data)
    const tpl = template(data);
    sel.html(tpl)
}

function template({name, commune}) {
    const details = ({name, value, prefix, postfix, definition}) =>(`
    <dt title="${definition}">${name} <span class="help">?</span><dfn class="visually-hidden" title="${definition}">${definition}</dfn></dt>
    <dd>${prefix} ${value} ${postfix}</dd>
    `);
    return `
        <div>
            <h3>${name}</h3>
            <dl>
                ${serializeCommune(commune).map(details).reduce(html, '')}
            </dl>
        </div>
    `
}

function html (carry,fragment) {
    return carry + '\n' + fragment
}

function serializeCommune (entry) {
    try {
        return [
            {...getDefinition('commune', 'meta.habitants'), value: humanNumber(entry.meta.habitants)},
            {...getDefinition('commune', 'meta.menages'), value: humanNumber(entry.meta.menages)},
            {...getDefinition('commune', 'meta.emplois'), value: humanNumber(entry.meta.emplois)},
            {...getDefinition('commune', 'actifs'), value: humanNumber(entry.actifs.y2015)},
            {...getDefinition('commune', 'meta.revenu_median'), value: euros(entry.meta.revenu_median)},
        ]
    } catch(e) {
        console.error(e)
    }

}

function humanNumber (value) {
    return new Intl.NumberFormat('fr-FR', { maximumSignificantDigits: 3 }).format(value);
}
function euros (value) {
    return new Intl.NumberFormat('fr-FR', { style: "currency", currency: 'EUR' }).format(value);
}
function inconsistant(entry) {
    return entry.field_travail_insee !== "0"
        && entry.field_distance_auto_km < 200
}

function center({lon, lat, nom}) {
    store.markers.push(L.marker([lon, lat], { icon: RedIcon }).bindPopup(nom));
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
            nom: data.field_commune,
            departement: data.field_departement,
            lat: data.field_longitude,
            lon: data.field_latitude,
            inter: {
                y2009: data.field_2009_inter,
                y2014: data.field_2014_inter,
            },
            extra: {
                y2009: data.field_2009_extra,
                y2014: data.field_2014_extra,
            },
            meta: {
                insee: data.field_insee,
                menages: data.field_menages,
                habitants: data.field_habitants,
                emplois: data.field_emplois,
                pers_par_menages: data.field_pers_par_menages,
                revenu_median: data.field_revenu_median,
                unite_conso_menages: data.field_unite_conso_menages,
            }
        },
        destination: {
            nom: data.field_travail_commune,
            departement: data.field_travail_departement,
            lat: data.field_travail_longitude,
            lon: data.field_travail_latitude,
            extra:{
                y2009: data.field_2009_extra_travail_commune,
                y2014: data.field_2014_extra_travail_commune,
            },
            meta: {
                insee: data.field_travail_insee,
                emplois: data.field_travail_emplois,
            }
        },
        trajet: {
            distance: {
                auto: data.field_distance_auto_km,
                velo: data.field_distance_velo_km,
                oiseau: data.field_distance_oiseau_km,
            },
            duree: {
                auto: data.field_duree_auto_minutes,
                velo: data.field_duree_velo_minutes,

            }
        },
    }
}

function Commune (data) {
    return {
        nom : data.field_commune,
        departement : data.field_departement,
        departement_nom : data.field_departement_nom,
        lat : data.field_longitude,
        lon : data.field_latitude,
        meta: {
            insee: data.field_insee,
            menages: data.field_menages,
            pers_par_menages : data.field_pers_par_menages,
            unite_conso_menages: data.field_unite_conso_menages,
            statut : data.field_statut,
            habitants: data.field_habitants,
            superficie : data.field_superficie,
            emplois: data.field_emplois,
            pers_par_menages: data.field_pers_par_menages,
            revenu_median: data.field_revenu_median,
            altitude_moy : data.field_altitude_moy,
        },
        actifs: {
            y2014 : data.field_2014,
            y2009 : data.field_2009,
            y2015 : data.field_2015,
        },
        inter: {
            y2009: {
                nb : data.field_2009_inter,
            },
            y2014: {
                nb: data.field_2014_inter,
            },
            y2015: {
                voiture : data.field_2015_inter_voiture,
                sansvoiture: data.field_2015_sansvoiture,
                csp1 : data.field_2015_inter_csp1,
                csp2 : data.field_2015_inter_csp2,
                csp3 : data.field_2015_inter_csp3,
            }
        },
        extra: {
            y2009: {
                nb: data.field_2009_extra,
                kms: data.field_2009_extra_km,
                heures: data.field_2009_extra_heure,
                communes: data.field_2009_extra_communes,
            },
            y2014 : {
                nb : data.field_2014_extra,
                kms : data.field_2014_extra_km,
                heures : data.field_2014_extra_heure,
                communes : data.field_2014_extra_communes,
            },
            y2015: {
                voiture : data.field_2015_extra_voiture,
                csp1 : data.field_2015_extra_csp1,
                csp2 : data.field_2015_extra_csp2,
                csp3 : data.field_2015_extra_csp3,
            }
        },
        intra: {
            y2009: {
                communes : data.field_2009_intra_communes,
                kms : data.field_2009_intra_km,
                heures : data.field_2009_intra_heure,
            },
            y2014: {
                communes : data.field_2014_intra_communes,
                kms : data.field_2014_intra_km,
                heures : data.field_2014_intra_heure,
            }
        }
    }
}


function CommuneDefinition () {
    return {
        nom: {name:"Commune", definition:"Commune de résidence"},
        "meta.insee": {name:"Code INSEE", prefix:'', postfix:'', definition: "Code insee de la commune"},
        "departement_nom": {name:"Département", prefix:'', postfix:'', definition: "Nom du département"},
        "lat": {name:"Latitude", prefix:'', postfix:'', definition: "Latitude du centre géométrique de la commune"},
        "lon": {name:"Longitude", prefix:'', postfix:'', definition: "Longitude du centre géométrique de la commune"},
        "meta.statut": {name:"Statut", prefix:'', postfix:'', definition: "Statut de la commune"},
        "meta.departement": {name:"Département", prefix:'', postfix:'', definition: "N° de département de la commune"},
        "meta.superficie": {name:"Supérificie", prefix:'', postfix:'', definition: "Superficie de la commune"},
        "meta.emplois": {name:"Emplois", prefix:'', postfix:'', definition: "Nombre d'emploi dans la commune de résidence"},
        "meta.habitants": {name:"Habitants", prefix:'', postfix:'', definition: "Nombre d'habitants dans la commune de résidence"},
        "meta.menages": {name:"Ménages", prefix:'', postfix:'', definition: "Nombre de ménages fiscaux dans la commune de résidence"},
        "meta.pers_par_menages": {name:"Personnes pour ménages", prefix:'', postfix:'', definition: "Nombre de personnes dans les ménages fiscaux de la commune de résidence"},
        "meta.unite_conso_menages": {name:"Parts fiscales", prefix:'', postfix:'', definition: "Nombre d'unités de consommation dans les ménages fiscaux"},
        "meta.revenu_median": {name:"Revenu médian", prefix:'', postfix:'', definition: "médiane revenu disponible par unité de consommation"},
        "actifs": {name:"Actifs", prefix:'', postfix:'', definition: "Nombre de personne actives dans la commune de résidence"},
        "inter.voiture": {name:"Actifs en voiture", prefix:'', postfix:'', definition: "Nombre de personnes actives qui travaillent dans la commune de résidence et qui se déplacent en voiture pour se rendre au travail"},
        "extra.voiture": {name:"Actifs en voiture", prefix:'', postfix:'', definition: "Nombre de personnes actives qui travaillent en dehors de la commune de résidence et qui se déplacent en voiture pour se rendre au travail"},
        "inter.sansvoiture": {name:"Actifs sans voiture", prefix:'', postfix:'', definition: "Nombre de personnes actives  qui se déplacent sans voiture pour se rendre au travail"},
        "extra.csp1": {name:"CSP 1", prefix:'', postfix:'', definition: "Nombre de personnes actives &laquo;cadres&raquo; (catégorie 1) qui travaillent en dehors de la commune de résidence"},
        "extra.csp2": {name:"CSP 2", prefix:'', postfix:'', definition: "Nombre de personnes actives &laquo;professions intermédiaires&raquo; (catégorie 2) qui travaillent en dehors de la commune de résidence"},
        "extra.csp3": {name:"CSP 3", prefix:'', postfix:'', definition: "Nombre de personnes actives &laquo;Employés / ouvriers&raquo; (catégorie 3) qui travaillent en dehors de  la commune de résidence"},
        "inter.csp1": {name:"CSP 1", prefix:'', postfix:'', definition: "Nombre de personnes actives &laquo;cadres&raquo; (catégorie 1) qui travaillent dans la commune de résidence"},
        "inter.csp2": {name:"CSP 2", prefix:'', postfix:'', definition: "Nombre de personnes actives &laquo;professions intermédiaires&raquo; (catégorie 2) qui travaillent dans la commune de résidence"},
        "inter.csp3": {name:"CSP 3", prefix:'', postfix:'', definition: "Nombre de personnes actives &laquo;Employés / ouvriers&raquo; (catégorie 3) qui travaillent dans la commune de résidence"},
        "inter.nb": {name:"Actifs", prefix:'', postfix:'', definition: "Nombre de personnes actives dans la commune de résidence qui travaillent dans la commune de résidence"},
        "extra.nb": {name:"Actifs", prefix:'', postfix:'', definition: "Nombre de personnes actives dans la commune de résidence qui travaillent en dehors de la commune de résidence"},
        "extra.communes": {name:"Communes", prefix:'', postfix:'', definition: "Nombre de communes  vers lesquelles vont les actifs de la commune de résidence"},
        "intra.communes": {name:"Communes", prefix:'', postfix:'', definition: "Nombre de communes depuis lesquelles viennent les actifs qui travaillent dans la commune de résidence"},
        "intra.kms": {name:"Total kms", prefix:'', postfix:'', definition: "total de km parcourus tous les jours (A-R) en voiture par toutes les personnes actives de la commune de résidence qui travaillent en dehors de la commune de résidence"},
        "extra.kms": {name:"Total heures", prefix:'', postfix:'', definition: "total de km parcourus tous les jours (A-R) en voiture par toutes les personnes actives extérieuresqui viennent travailler dans de la commune de résidence"},
        "extra.heures": {name:"Total", prefix:'', postfix:'', definition: "temps passé tous les jours (A-R) en voiture par toutes les personnes actives de la commune de résidence qui travaillent en dehors de la commune de résidence"},
        "intra.heures": {name:"Total", prefix:'', postfix:'', definition: "temps passé tous les jours (A-R) en voiture par toutes les personnes actives de la commune de résidence qui travaillent en dehors de la commune de résidence"},
        "inter.nb": {name:"Nb actifs", prefix:'', postfix:'', definition: "Nombre de personnes actives dans la commune de résidence qui travaillent dans la commune de résidence"},
        "extra.nb": {name:"Nb actifs", prefix:'', postfix:'', definition: "Nombre de personnes actives dans la commune de résidence  qui travaillent en dehors de la commune de résidence"},
    }
}


function TrajetDefinition () {
    return {
        nom: {label:"Commune", def:"Nom de la commune"},
        //...
    }
}


function getDefinition(model, prop) {
    let defs;
    if (model == 'commune') {
        defs = CommuneDefinition()
    }


    if(typeof defs[prop] !== 'undefined') {
        console.warn('found definition', defs[prop])
        return defs[prop]
    }
    throw new Error('Cant fond this definition ' + prop)
    return {name:"woot", value:'n/a', prefix:'', postfix:'', definition: "/!\\"}
}


function actions (name, node) {
    const methods = {
        center: ()=>{
            map.panTo(new L.LatLng(store.current.lat, store.current.lon))
        }
    }

    return methods[name](node)
}
