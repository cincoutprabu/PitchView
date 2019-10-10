//PitchView.js

Physijs.scripts.worker = 'includes/js/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

var ViewPortWidth = 960;
var ViewPortHeight = 540;

var viewport, cameraComboBox, speedSlider, swingSlider;
var camera, renderer, controls, scene;
var ball;

var PRESET_CAMERA =
{
    MAIN_UMPIRE: new THREE.Vector3(0, 5, 12.5),
    LEG_UMPIRE: new THREE.Vector3(16, 4, -9.5),
    KEEPER: new THREE.Vector3(0, 5, -18),
    SLIP1: new THREE.Vector3(-3.5, 5, -19),
    SLIP2: new THREE.Vector3(-5.5, 5, -18.5),
    SLIP3: new THREE.Vector3(-7.5, 5, -18),
    POINT: new THREE.Vector3(-19, 4, -11),
    CLOSE_FIELDER_OFF: new THREE.Vector3(-16, 3, 0),
    CLOSE_FIELDER_LEG: new THREE.Vector3(16, 3, 0),
};

var GRAVITY = -10;
var groundFriction = 0.0, groundBounciness = 0.99;
var pitchFriction = 0.0, pitchBounciness = 0.99;

var ballPosition = new THREE.Vector3(-1, 4, 10);
var ballVelocity = new THREE.Vector3(1, 0, -15);

function init()
{
    viewport = document.getElementById('GameViewPort');
    cameraComboBox = document.getElementById('CameraComboBox');
    speedSlider = document.getElementById('SpeedSlider');
    swingSlider = document.getElementById('SwingSlider');

    //setup scene
    ViewPortWidth = window.innerWidth - 40;
    ViewPortHeight = window.innerHeight - 100;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(ViewPortWidth, ViewPortHeight);

    viewport.style.width = ViewPortWidth + 'px';
    viewport.style.height = ViewPortHeight + 'px';
    viewport.appendChild(renderer.domElement);

    //scene = new THREE.Scene();
    scene = new Physijs.Scene();
    scene.fog = new THREE.FogExp2(0xcccccc, 0.002);
    scene.setGravity(0, GRAVITY, 0);

    camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.copy(PRESET_CAMERA.MAIN_UMPIRE);
    camera.lookAt(scene.position);
    scene.add(camera);

    controls = new THREE.OrbitControls(camera, renderer.domElement);

    //add lights
    var ambientLight = new THREE.AmbientLight(0x0c0c0c);
    ambientLight.position.set(0, 0, 0);
    scene.add(ambientLight);

    var pointLightTop = new THREE.PointLight(0xffffff);
    pointLightTop.position.set(10, 50, 280);
    scene.add(pointLightTop);

    var pointLightBottom = new THREE.PointLight(0xffffff);
    pointLightBottom.position.set(10, 50, -280);
    scene.add(pointLightBottom);

    var pointLightLeft = new THREE.PointLight(0xffffff);
    pointLightLeft.position.set(-280, 50, 0);
    scene.add(pointLightLeft);

    var pointLightRight = new THREE.PointLight(0xffffff);
    pointLightRight.position.set(280, 50, 0);
    scene.add(pointLightRight);

    //add ground
    var outFieldGeometry = new THREE.CylinderGeometry(64, 64, .5, 64, 64, false);
    var outFieldMaterial = Physijs.createMaterial(new THREE.MeshLambertMaterial({ color: 0x0ba70e }), groundFriction, groundBounciness);
    //var outFieldMaterial = Physijs.createMaterial(new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture('includes/images/outfield.jpg') }), groundFriction, groundBounciness);
    //outFieldMaterial.map.wrapS = outFieldMaterial.map.wrapT = THREE.RepeatWrapping;
    //outFieldMaterial.map.repeat.set(4, 8);
    var outField = new Physijs.CylinderMesh(outFieldGeometry, outFieldMaterial, 0);
    outField.name = 'outfield';
    outField.position.set(0, 0, 0);
    scene.add(outField);

    var inFieldWidth = 28;
    var inFieldTopGeometry = new THREE.CylinderGeometry(inFieldWidth, inFieldWidth, .5, 32, 32, false, Math.PI / 2.0, Math.PI);
    var inFieldMaterial = Physijs.createMaterial(new THREE.MeshLambertMaterial({ color: 0x6cbb11 }), groundFriction, groundBounciness);
    var inFieldTop = new Physijs.CylinderMesh(inFieldTopGeometry, inFieldMaterial, 0);
    inFieldTop.name = 'infield-top';
    inFieldTop.position.set(0, 0.05, -15);
    scene.add(inFieldTop);

    var inFieldBottomGeometry = new THREE.CylinderGeometry(inFieldWidth, inFieldWidth, .5, 32, 32, false, -Math.PI / 2.0, Math.PI);
    var inFieldBottom = new Physijs.CylinderMesh(inFieldBottomGeometry, inFieldMaterial, 0);
    inFieldBottom.name = 'infield-bottom';
    inFieldBottom.position.set(0, 0.05, 15);
    scene.add(inFieldBottom);

    var inFieldCenterGeometry = new THREE.BoxGeometry(inFieldWidth * 1.998, .5, inFieldWidth * 1.2);
    var inFieldCenter = new Physijs.BoxMesh(inFieldCenterGeometry, inFieldMaterial, 0);
    inFieldCenter.name = 'infield-center';
    inFieldCenter.position.set(0, 0.05, 0);
    scene.add(inFieldCenter);

    //addInFieldAsCapsule(inFieldMaterial);

    var pitchGeometry = new THREE.BoxGeometry(6, .5, 20.12 + 2); //20.12m + 2m (22 yards = 20.12 meters)
    var pitchMaterial = Physijs.createMaterial(new THREE.MeshBasicMaterial({ color: 0xb97a57 }), pitchFriction, pitchBounciness);
    pitch = new Physijs.BoxMesh(pitchGeometry, pitchMaterial, 0);
    pitch.name = 'pitch';
    pitch.position.set(0, 0.1, 0);
    scene.add(pitch);

    //add batsman stumps
    addStump(-0.3, 1.2, -10.5);
    addStump(0, 1.2, -10.5);
    addStump(0.3, 1.2, -10.5);

    //add bowler stumps
    addStump(-0.3, 1.2, 10.5);
    addStump(0, 1.2, 10.5);
    addStump(0.3, 1.2, 10.5);

    //add batsman crease
    addCrease(-2.2, -10.5, 2.2, -10.5); //top line
    addCrease(-2.8, -9.2, 2.8, -9.2); //bottom line
    addCrease(-2.2, -9.2, -2.2, -11); //left line
    addCrease(2.2, -9.2, 2.2, -11); //right line

    //add bowler crease
    addCrease(-2.8, 9.2, 2.8, 9.2); //top line
    addCrease(-2.2, 10.5, 2.2, 10.5); //bottom line
    addCrease(-2.2, 9.2, -2.2, 11); //left line
    addCrease(2.2, 9.2, 2.2, 11); //right line

    //add ball
    //addBall();

    window.addEventListener('resize', onWindowResize, false);
    cameraComboBox.addEventListener('change', cameraSelected);
    speedSlider.addEventListener('input', speedChanged);
    swingSlider.addEventListener('input', swingChanged);

    viewport.addEventListener('click', viewportClicked, false);
}

function render()
{
    requestAnimationFrame(render);
    scene.simulate();
    renderer.render(scene, camera);
};

document.body.onload = function ()
{
    init();
    render();

    alert('Click on the pitch to bowl.');
}

////////////////
//Control Events

function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}

function cameraSelected()
{
    var cameraKey = cameraComboBox.value;
    camera.position.copy(PRESET_CAMERA[cameraKey]);
    camera.lookAt(scene.position);
}

function speedChanged()
{
    document.getElementById('SpeedLabel').textContent = speedSlider.value + ' kmph';
}

function swingChanged()
{
    document.getElementById('SwingLabel').textContent = swingSlider.value + '';
}

/////////////
//Game Events

function ballAdded()
{
    //bowl();
}

var collided = false;
var collidedList = [];

function ballCollided(other, linearVelocity, angularVelocity, contactNormal)
{
    //"this" has collided with "other" with an impact speed of "linearVelocity" and a rotational force of "angularVelocity" and at normal "contactNormal"

    if (collided) return;

    collidedList.push(other.name);
    //document.title = 'Ball hit ' + collidedList.join(',');

    var v = ball.getLinearVelocity();
    if (swingSlider.value != 0) v.x = swingSlider.value;
    ball.setLinearVelocity(v);
    ball.__dirtyRotation = true;
    ball.__dirtyPosition = true;

    collided = true;
}

function ballTrackTimer_Tick()
{
    //camera.position.addVectors(ball.position, new THREE.Vector3(0, 0, 0));
    //camera.__dirtyRotation = true;
    //camera.__dirtyPosition = true;

    //try to keep the ball within the ground
    if ((ball.position.z < -60 || ball.position.z > 60) || (ball.position.x < -55 || ball.position.x > 55))
    {
        ball.setLinearVelocity(new THREE.Vector3(0, 0, 0));
        clearInterval(ballTrackTimer);
    }
}

function viewportClicked(ev)
{
    var pos = getMouseWorldPosition(ev);
    if (pos != undefined)
    {
        var minSpeed = speedSlider.min;
        var maxSpeed = speedSlider.max;
        var speed = speedSlider.value;

        //calculate ball duration based on speed
        var maxT = 1.6, minT = 0.4;
        var tUnit = (maxT - minT) / (maxSpeed - minSpeed);
        var t = maxT - ((speed - minSpeed) * tUnit);

        //calculate ball bounciness based on speed
        var maxR = 0.99, minR = 0.5;
        var rUnit = (maxR - minR) / (maxSpeed - minSpeed);
        var r = minR + ((speed - minSpeed) * rUnit);

        addBall(r);
        //ball.material._physijs.restitution = r;
        ballVelocity = findInitialVelocity(ballPosition, pos, t);

        //document.title = 't: ' + t + ', r: ' + r;
        //document.title = 'Ball to be pitched on: ' + V3ToString(pos) + 'with InitVelocity ' + V3ToString(ballVelocity);

        bowl();
    }
}

//////////////////
//Internal Methods

function addStump(x, y, z)
{
    var geometry = new THREE.CylinderGeometry(0.06, 0.06, 1.8, 32, 32, false);
    var material = new THREE.MeshLambertMaterial({ color: 0x400000 });
    var stump = new Physijs.CylinderMesh(geometry, material, 0);
    stump.position.set(x, y, z);
    scene.add(stump);
}

function addCrease(x1, z1, x2, z2)
{
    var material = new THREE.LineBasicMaterial({ color: 0xffffff });
    var geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(x1, 0.36, z1), new THREE.Vector3(x2, 0.36, z2));
    var line = new THREE.Line(geometry, material);
    scene.add(line);
}

function addBall(bounciness)
{
    if (ball) scene.remove(ball);

    var ballMaterial = Physijs.createMaterial(new THREE.MeshLambertMaterial({ color: 0xCC0000, opacity: 0.0, transparent: true }), 0.0, bounciness);
    ball = new Physijs.SphereMesh(new THREE.SphereGeometry(0.1, 32, 32), ballMaterial, undefined, { restitution: bounciness });
    ball.position.copy(ballPosition);
    ball.addEventListener('ready', ballAdded);
    ball.addEventListener('collision', ballCollided);
    ball.setCcdMotionThreshold(0.1); //Enable CCD if the object moves more than 1 meter in one simulation frame
    ball.setCcdSweptSphereRadius(0.02); //Set the radius of the embedded sphere such that it is smaller than the object
    scene.add(ball);
    ball.__dirtyRotation = true;
    ball.__dirtyPosition = true;
}

var ballTrackTimer;

function bowl()
{
    ball.position.copy(ballPosition);
    ball.setLinearVelocity(ballVelocity);
    ball.__dirtyRotation = true;
    ball.__dirtyPosition = true;
    ball.material.opacity = 0.8;

    collided = false;

    clearInterval(ballTrackTimer);
    ballTrackTimer = setInterval(ballTrackTimer_Tick, 100);
}

function getMouseWorldPosition(ev)
{
    var mouseX = ev.pageX - viewport.offsetLeft, mouseY = ev.pageY - viewport.offsetTop;

    var mouse3D = new THREE.Vector3();
    mouse3D.x = (mouseX / viewport.clientWidth) * 2 - 1;
    mouse3D.y = -(mouseY / viewport.clientHeight) * 2 + 1;
    mouse3D.z = 0.5;

    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse3D, camera);

    var intersects = raycaster.intersectObjects(scene.children);
    for (var i = 0; i < intersects.length; i++)
    {
        if (intersects[i].object.name == 'pitch')
        {
            //intersects[i].object.material.color.set(0xff0000);
            return intersects[i].point;
        }
    }
    return undefined;
}

function addInFieldAsCapsule(material)
{
    var capsuleRadius = 8;
    var capsuleHeight = 82;
    var cyl = new THREE.CylinderGeometry(capsuleRadius, capsuleRadius, capsuleHeight, 32, 32, false);
    var top = new THREE.SphereGeometry(capsuleRadius, 32, 32);
    var bot = new THREE.SphereGeometry(capsuleRadius, 32, 32);
    var matrix = new THREE.Matrix4();
    matrix.makeTranslation(0, capsuleHeight / 2.0, 0);
    top.applyMatrix(matrix);
    var matrix = new THREE.Matrix4();
    matrix.makeTranslation(0, -capsuleHeight / 2.0, 0);
    bot.applyMatrix(matrix);

    //Merge to create a capsule
    var merged = new THREE.Geometry();
    merged.merge(top);
    merged.merge(bot);
    merged.merge(cyl);

    //Create capsule mesh
    var capsule = new Physijs.CapsuleMesh(merged, material);
    capsule.position.set(0, 20, 0);
    capsule.rotation.set(Math.PI / 2, 0, 0);
    scene.add(capsule);
}

////////////////
//Helper Methods

function dumpObject(obj)
{
    var text = '';
    for (var p in obj)
    {
        text += p + ':' + obj[p] + '\r\n';
    }
    alert(text);
}

function V3ToString(v)
{
    return v.x.toFixed(2) + ',' + v.y.toFixed(2) + ',' + v.z.toFixed(2);
}
