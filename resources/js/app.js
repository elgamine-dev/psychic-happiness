require('./bootstrap');
const L = require('leaflet')
require('select2')

let map;
let group;
let layer;
let originSelect;
let destSelect;
let originFragment;
let destinationFragment;

let RedIcon = L.icon({
    iconUrl: '/red.png'
});

const store = window.store =  {
    markers:[],
    homeMarker:null,
    current: {}
}

const ExtendedMarker = L.Marker.extend({
    options: {
        _data: {}
    }
})

$(document).ready(function () {
    originSelect = $('.city-select')
    destSelect = $('#dest-select')
    originFragment = $('aside #origin')
    destinationFragment = $('aside #destination')


    originSelect.select2({ width: '100%' });
    destSelect.select2({ width: '100%'});

    map = L.map('map').setView([43.568, 1.404], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    listeners()
});

function listeners() {

    originSelect.on('select2:select', ({ params }) => {
        const id = params.data.id
        $.get(`/api/trajets/${id}`).then(processData)
    })

    destSelect.on('select2:select', ({params})=>{
        const id = params.data.id;
        console.log(id)

        if(id !== null) {
            store.markers[id].openPopup()
        }
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
        if (typeof e.popup._source.options._data === 'undefined') {
            return false;
        }

        const commune = e.popup._source.options._data.destination
        $.get(`/api/commune/${commune.nom}`).then(updateDestination)


        if (destSelect.val() !== e.popup._source.options._data._pos) {
            destSelect.val(e.popup._source.options._data._pos).trigger('change')
        }

        const boundaries = [
            [commune.lon, commune.lat],
            [store.current.lat, store.current.lon]
        ]

        console.log(boundaries)
        map.fitBounds(boundaries, {padding:[100, 100]})
    })
}

function resetGroup(collec) {

    store.markers = []

    if (map && group) {
        map.removeLayer(group)
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

    group = new L.featureGroup([...store.markers, store.homeMarker])
    group.addTo(layer)
    map.fitBounds(group.getBounds(), {padding:[100, 100]})

}

function processData(data) {
    const trajets = data.par_trajet
        .filter(inconsistant)
        .map(Trajet)
    const commune = new Commune(data.par_commune)
    store.current = commune
    render(originFragment, {name:commune.nom, commune:commune})
    resetGroup(trajets)
    populateDestSelect()
}

function updateDestination(data) {
    const commune = new Commune(data.par_commune)
    render(destinationFragment, {name:commune.nom, commune:commune})
}


function render(sel, data) {
    const tpl = template(data);
    sel.html(tpl)
}

function template({name, commune}) {
    const details = ({name, value, prefix, postfix, definition}) =>(`
    <dt title="${definition}">${name} <span class="help">?</span><dfn class="visually-hidden" title="${definition}">${definition}</dfn></dt>
    <dd>${prefix} ${value} ${postfix}</dd>
    `);
    const sections = ({section, entries}) => {
        const title = section && `<h4>${section}</h4>` || ''

        return `
        ${title}
        ${entries.map(details).reduce(html, '')}
        `
    };
    return `
        <div>
            <dl>
                ${serializeCommune(commune).map(sections).reduce(html, '')}
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
            {section: false, entries: [
                {...getDefinition('commune', 'meta.habitants'), value: humanNumber(entry.meta.habitants)},
                {...getDefinition('commune', 'meta.menages'), value: humanNumber(entry.meta.menages)},
                {...getDefinition('commune', 'meta.emplois'), value: humanNumber(entry.meta.emplois)},
                {...getDefinition('commune', 'actifs'), value: humanNumber(entry.actifs.y2015)},
                {...getDefinition('commune', 'meta.revenu_median'), value: euros(entry.meta.revenu_median)},
            ]},
            {section: "Déplacements Internes", entries:[
                {...getDefinition('commune', 'inter.sansvoiture'), value: humanNumber(entry.inter.y2015.sansvoiture)},
                {...getDefinition('commune', 'inter.voiture'), value: humanNumber(entry.inter.y2015.voiture)},
                {...getDefinition('commune', 'inter.csp1'), value: humanNumber(entry.inter.y2015.csp1)},
                {...getDefinition('commune', 'inter.csp2'), value: humanNumber(entry.inter.y2015.csp2)},
                {...getDefinition('commune', 'inter.csp3'), value: humanNumber(entry.inter.y2015.csp3)},
            ]},
            {section: "Déplacements Externes", entries:[
                {...getDefinition('commune', 'extra.voiture'), value: humanNumber(entry.extra.y2015.voiture)},
                {...getDefinition('commune', 'extra.nb'), value: humanNumber(entry.extra.y2014.nb)},
                {...getDefinition('commune', 'extra.communes'), value: humanNumber(entry.extra.y2014.communes)},
                {...getDefinition('commune', 'extra.kms'), value: humanNumber(entry.extra.y2014.kms), postfix: "kms"},
                {...getDefinition('commune', 'extra.heures'), value: humanNumber(entry.extra.y2014.heures), postfix: "heures"},
                {...getDefinition('commune', 'extra.csp1'), value: humanNumber(entry.extra.y2015.csp1)},
                {...getDefinition('commune', 'extra.csp2'), value: humanNumber(entry.extra.y2015.csp2)},
                {...getDefinition('commune', 'extra.csp3'), value: humanNumber(entry.extra.y2015.csp3)},
            ]},
        ]
    } catch(e) {
        console.error(e)
    }

}

function populateDestSelect() {

    const sel = destSelect.empty().val(null).trigger('change')
    const values = store.markers.map(s =>{
        const data = s.options._data.destination
        const pos = s.options._data._pos;
        return {id:pos, text: data.nom}
    })

    destSelect.select2({
        data: [
            {id:'', text:"-"},
            ...values
        ]
    }).val(null).trigger('change')
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
    store.homeMarker = L.marker([lon, lat], { icon: RedIcon }).bindPopup(nom);
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


function Trajet (data, position) {
    return {
        _id: data.id,
        _pos: position,
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
        "extra.kms": {name:"Total kms", prefix:'', postfix:'', definition: "total de km parcourus tous les jours (A-R) en voiture par toutes les personnes actives extérieuresqui viennent travailler dans de la commune de résidence"},
        "extra.heures": {name:"Total heures", prefix:'', postfix:'', definition: "temps passé tous les jours (A-R) en voiture par toutes les personnes actives de la commune de résidence qui travaillent en dehors de la commune de résidence"},
        "intra.heures": {name:"Total heures", prefix:'', postfix:'', definition: "temps passé tous les jours (A-R) en voiture par toutes les personnes actives de la commune de résidence qui travaillent en dehors de la commune de résidence"},
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
        return defs[prop]
    }
    throw new Error('Cant find this definition ' + prop)
}


function actions (name, node) {
    const methods = {
        center: ()=>{
            map.panTo(new L.LatLng(store.current.lat, store.current.lon))
        }
    }

    return methods[name](node)
}
