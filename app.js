import './config.js'
if (!config) console.error("Config not set! Make a copy of 'config_template.js', add in your access token, and save the file as 'config.js'.");
//import * as THREE from 'https://threejs.org/build/three.module.js';
mapboxgl.accessToken = config.accessToken;

let origin = [-77.0372625, -12.09721933, 0];
let buildings = [];
let baseMaterialColor;
var canvas = document.getElementById("canvas");

let minZoom = 12;
let names = {
    compositeSource: "composite",
    compositeSourceLayer: "building",
    compositeLayer: "3d-buildings"
}
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/santaclaradev/cl0jvla1e000f14o2cmxziurr',
    center: origin,
    zoom: 20,
    pitch: 60,
    antialias: true,
    heading: 0,
    hash: true
});

// we can add Threebox to mapbox to add built-in mouseover/mouseout and click behaviors
window.tb = new Threebox(
    map,
    map.getCanvas().getContext('webgl'),
    {
        defaultLights: true,
        enableSelectingFeatures: false, //change this to false to disable fill-extrusion features selection
        enableSelectingObjects: false, //change this to false to disable 3D objects selection
        enableDraggingObjects: false, //change this to false to disable 3D objects drag & move once selected
        enableRotatingObjects: false, //change this to false to disable 3D objects rotation once selected
        enableTooltips: false, // change this to false to disable default tooltips on fill-extrusion and 3D models
    }
);

import { GUI } from 'https://threejs.org/examples/jsm/libs/lil-gui.module.min.js';
import Stats from 'https://threejs.org/examples/jsm/libs/stats.module.js';

let stats, gui;
function animate() {
    requestAnimationFrame(animate);
    stats.update();
}

var active = false
map.on('style.load', function () {
    init();

    //map.addLayer(createCompositeLayer());

    map.addLayer({
        id: 'custom_layer',
        type: 'custom',
        renderingMode: '3d',
        onAdd: function (map, mbxContext) {

            tb.altitudeStep = 1;

            var options = {
                obj: './models/building.glb',
                type: 'gltf',
                scale: 1.58,
                units: 'meters',
                rotation: { x: 90, y: 75, z: 0 }, //default rotation
                anchor: 'center'
            }

            tb.loadObj(options, function (model) {
                console.log(model);
                //origin[2] += model.modelSize.z;
                let city = model.setCoords(origin);
                model.addTooltip("edificios", true);
                
                var shapes = model.children[0].children[0].children;
                console.log(shapes);
                shapes.map((item) => {
                    if (item.name.includes("Plane") && item.type === "Mesh") {
                        //item.material.color.setHex( 0x00ff00 );
                        buildings.push(item);
                        baseMaterialColor = item.material;
                    }
                });

                tb.add(city);
                // play animation 3, for 10 seconds
                // city.playAnimation(options = { animation: 1, duration: 10000 });

                var highlighted = [];
                // map.on('mousedown', function(e){
                //     // Clear old objects
                //     highlighted.forEach(function(h) {
                //         h.material = baseMaterialColor;
                //     });
                //     highlighted.length = 0;

                //     // calculate objects intersecting the picking ray
                //     var intersect = tb.queryRenderedFeatures(e.point)[0]
                //     var intersectionExists = typeof intersect == "object"
                //     canvas.style.display = "none";
                //     // if intersect exists, highlight it
                //     if (intersect) {
                //         var nearestObject = intersect.object;
                //         var clone = nearestObject.material.clone();
                //         clone.emissive.setHex(0x00ff00);
                //         nearestObject.material = clone;
                //         highlighted.push(nearestObject);
                //         var num = intersect.object.name.replace(/^\D+/g, "");
                //         num = parseInt(num);
                //         intersect.object.material = clone;
                //         fetch(`https://pokeapi.co/api/v2/pokemon/${num}`)
                //             .then((response) => response.json())
                //             .then((data) => {
                //                 openModal(data.name.toUpperCase(), data.sprites.other.home.front_default, num);
                //             });
                //     }
                // });

            })

        },

        render: function (gl, matrix) {
            tb.update();
        }
    });
    //document.addEventListener("mousedown", onDocumentMouseDown, false);
});

function openModal(name = null, imgUrl = null, num = null) {
    canvas.innerHTML = "";
    canvas.style.display = "block";
    canvas.innerHTML += "<h2 style='font-family: Cambria'>bloque numero: "+num+"</h2><h1>"+name+"</h1><img src="+imgUrl+" alt='pokemon' width='250'>";
    canvas.innerHTML += "<button id='pokeButton'>Botón 2</button>"
    canvas.style.backgroundColor = "rgba(255, 255, 255, .8)";
    var button = document.getElementById("pokeButton");
    let data = {
        num: num,
        name: name,
        imgUrl: imgUrl
    };
    button.onclick = ()=>showModal(data);
}

function showModal(data) {
    console.log(data);
    swal.fire({
        title: data.name,
        text: `Oficina: ${data.num}`,
        imageUrl: data.imgUrl,
        imageHeight: 205,
        padding: 10,
        animation: true,
    });
}

function onDocumentMouseDown(event) {
    let intersectionExists
    let intersects = [];
    console.log(event.point);
    mousePos1(event)
    /*if (map.tb.enableSelectingObjects) {
        //raycast only if we are in a custom layer, for other layers go to the else, this avoids duplicated calls to raycaster
        intersects = this.tb.queryRenderedFeatures(e.point);
    }*/
}
function mousePos1(e) {
    var rect = canvas.getBoundingClientRect();
    console.log(rect);
}

// Return the xy coordinates of the mouse position
function mousePos(e) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: e.originalEvent.clientX - rect.left - canvas.clientLeft,
        y: e.originalEvent.clientY - rect.top - canvas.clientTop
    };
}

function createLabelIcon(text) {
    let popup = document.createElement('div');
    popup.innerHTML = '<span title="' + text + '" style="font-size: 30px;color: yellow;">&#9762;</span>';
    return popup;
}

let api = {
    fov: Math.atan(3 / 4) * 180 / Math.PI,
    orthographic: false
};

function init() {
    // stats
    stats = new Stats();
    map.getContainer().appendChild(stats.dom);
    animate();
    // gui
    gui = new GUI();
    // going below 2.5 degrees will start to generate serious issues with polygons in fill-extrusions and 3D meshes
    // going above 45 degrees will also produce clipping and performance issues
    gui.add(api, 'fov', 2.5, 45.0).step(0.1).onChange(changeFOV);
    // this will set 0.01 degrees in Mapbox which is the minimum possible and an OrthographicCamera in three.js
    gui.add(api, 'orthographic').name('pure orthographic').onChange(changeFOV);
}

function changeFOV() {
    tb.orthographic = api.orthographic;
    tb.fov = api.fov;
}