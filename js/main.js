var camera, 
	scene, 
	renderer, 
	projector,
	mesh,
	mat,
	path,
	verticeHandles = [],
	selectedHandle,
	segments = [],
	windowHalfX = window.innerWidth / 2,
	windowHalfY = window.innerHeight / 2,
	keys = [],
	SHIFT = false,
	OPT = false,
	mouse = {x: 0, y: 0, z: 0};

init();
animate();

function init() {
  	projector = new THREE.Projector();

	camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 1000);
	camera.position.set(0, 50, 500);

	scene = new THREE.Scene();

	var light = new THREE.DirectionalLight(0xffffff);
	light.position.set(0, 0, 1);
	scene.add(light);

	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setSize(window.innerWidth, window.innerHeight);
	  
	document.body.appendChild(renderer.domElement);
	document.addEventListener('mousedown', handle_MOUSE_DOWN);
	document.addEventListener('mouseup', handle_MOUSE_UP);
	document.addEventListener('mousemove', handle_MOUSE_MOVE);
	
	document.addEventListener('keydown', handle_KEY_DOWN);
	document.addEventListener('keyup', handle_KEY_UP);
	setInterval(KEY_CHECK, 100);
}

function resetSelected() {
	try{
		selectedHandle.material.color.setHex(0x00cc00);
	} catch(e) {};
	selectedHandle = null;
}

function handle_MOUSE_DOWN(e) {
	var vector,
		raycaster,
		intersects;
	
	vector = new THREE.Vector3((e.clientX / window.innerWidth) * 2 - 1, - (e.clientY / window.innerHeight) * 2 + 1, 0.5);
	projector.unprojectVector(vector, camera);

	raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
	intersects = raycaster.intersectObjects(verticeHandles);

	if (intersects.length > 0) {
		resetSelected();
		intersects[0].object.material.color.setHex(0x0000cc);
		selectedHandle = intersects[0].object;
	} else {
		resetSelected();
	}
}

function handle_MOUSE_UP(e) {

}

function handle_MOUSE_MOVE(e) {
	mouse = {x: window.pageX, y: window.pageY, z: 0};
}

function handle_KEY_DOWN(e) {
	var i;
	
	console.log(e.keyCode);
	
	if (keys.length === 0) {
		keys.push(e.keyCode);
	}
	for (i = 0; i < keys.length; i += 1) {		
		if (e.keyCode !== keys[i] && i == keys.length - 1) {
			keys.push(e.keyCode);
		}
	}
	
	switch(e.keyCode) {
	case 65: //A
		if (typeof(path) !== 'undefined') {
			addSegment();
		} else {
			createPath();	
		}
		break;
	}
}

function handle_KEY_UP(e) {
	var i;
	
	for (i = 0; i < keys.length; i += 1) {
		if (e.keyCode == keys[i]) {
			keys.splice(i, 1);
		}
	}
}

function KEY_CHECK() {
	if (!selectedHandle) {
		navigateScene();
	} else {
		moveSelectedHandle();
	}
}

function navigateScene() {
	var i,
		amt = 1;
		
	SHIFT = false;
	OPT = false;
	
	for (i = 0; i < keys.length; i += 1) {
		if(keys[i] == 16) { //SHIFT
			SHIFT = true;
			amt = 10;
		}
		
		if (keys[i] == 18) { //OPT
			OPT = true;
		}
	}
	
	for (i = 0; i < keys.length; i += 1) {
		switch(keys[i]) {
		case 37: //LEFT
			camera.position.x -= amt;
			break;
		case 39: //RIGHT
			camera.position.x += amt;
			break;
		case 38: //UP
			if (OPT) {
				camera.position.z -= amt;
			} else {
				camera.position.y += amt;
			}
			break;
		case 40: //DOWN
			if (OPT) {
				camera.position.z += amt;
			} else {
				camera.position.y -= amt;
			}
			break;
		case 87: //W
			camera.rotation.x -= amt / Math.PI / 100;
			break;
		case 83: //S
			camera.rotation.x += amt / Math.PI / 100;
			break;
		}
	}
}

function moveSelectedHandle() {
	var i,
		amt = 1;
		
	SHIFT = false;
	OPT = false;
	
	for (i = 0; i < keys.length; i += 1) {
		if(keys[i] == 16) { //SHIFT
			SHIFT = true;
			amt = 10;
		}
		
		if (keys[i] == 18) { //OPT
			OPT = true;
		}
	}
	
	for (i = 0; i < keys.length; i += 1) {
		switch(keys[i]) {
		case 37: //LEFT
			selectedHandle.position.x -= amt;
			break;
		case 39: //RIGHT
			selectedHandle.position.x += amt;
			break;
		case 38: //UP
			if (OPT) {
				selectedHandle.position.z -= amt;
			} else {
				selectedHandle.position.y += amt;
			}
			break;
		case 40: //DOWN
			if (OPT) {
				selectedHandle.position.z += amt;
			} else {
				selectedHandle.position.y -= amt;
			}
			break;
		}
	}
	
	selectedHandle.obj.update();
}

function createPath() {
	var segment;
	
	segment = new Spline();
	segments.push(segment)
	
	path = new THREE.CurvePath();
	path.add(segment.spline);
	
	geometry = new THREE.TubeGeometry(path, 100, 2, 10, false, false);
	mat = new THREE.MeshBasicMaterial({color: 0xccc000, wireframe: true});
	mesh = new THREE.Mesh(geometry, mat);
	scene.add(mesh);
}

function addSegment() {
	var segment;
	
	scene.remove(mesh);
	
	segment = new Spline();
	segments.push(segment)
	path.add(segment.spline);
	
	geometry = new THREE.TubeGeometry(path, 100, 2, 10, false, false);
	mesh = new THREE.Mesh(geometry, mat);
	scene.add(mesh);
}

function updatePath() {
	var i;
	
	scene.remove(mesh);
	
	path = new THREE.CurvePath();
	for (i = 0; i < segments.length; i += 1) {
		path.add(segments[i].spline);
	}
		
	geometry = new THREE.TubeGeometry(path, 100, 2, 10, false, false);
	mesh = new THREE.Mesh(geometry, mat);
	scene.add(mesh);
}

function render() {
	renderer.render( scene, camera );
}

function animate() {
	render();
	requestAnimationFrame(animate); 
}

var Spline = function () {
	var i,
		vert,
		splineVectors,
		instance = this;
	
	this.vectors = [];
	this.verts = [];
	
	for (i = 0; i < 6; i += 1) {
		vert = new Vert(Math.random() * 200, Math.random() * 200, Math.random() * 200);
		this.verts.push(vert);
		vert.mesh.obj = vert;
		vert.spline = this;
		verticeHandles.push(vert.mesh);
		this.vectors.push(vert.v);
	}
	
	this.spline = new THREE.SplineCurve3(this.vectors);
	
	this.update = function () {
		instance.vectors = [];
		
		for (i = 0; i < instance.verts.length; i += 1) {
			instance.vectors.push(instance.verts[i].v);
		}
		
		instance.spline = new THREE.SplineCurve3(instance.vectors);
	}
}

var Vert = function (x, y, z) {
	var sphere,
		material,
		instance = this;
		
	this.x = x;
	this.y = y;
	this.z = z;
	this.v = new THREE.Vector3(this.x, this.y, this.z);
	
	sphere = new THREE.SphereGeometry(10, 10, 10);
	material = new THREE.MeshBasicMaterial({color: 0x00cc00, wireframe: true});
	this.mesh = new THREE.Mesh(sphere, material);
	this.mesh.position.set(this.x, this.y, this.z);
	scene.add(this.mesh);
	
	this.update = function () {
		instance.x = instance.mesh.position.x;
		instance.y = instance.mesh.position.y;
		instance.z = instance.mesh.position.z;
		
		instance.v = new THREE.Vector3(instance.x, instance.y, instance.z);
		instance.spline.update();
		updatePath();
	}
}

