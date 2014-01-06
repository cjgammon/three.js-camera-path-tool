var camera, 
	scene, 
	renderer, 
	projector,
	mesh,
	geometry,
	mat,
	path,
	pathCamera,
	controls,
	vertices = [],
	verticeHandles = [],
	segments = [],
	selectedHandle,
	codeElement = document.getElementById('code'),
	codeCopyElement = document.getElementById('codeCopy'),
	uiElement = document.getElementById('ui'),
	codeButton = document.getElementById('codeButton'),
	helpButton = document.getElementById('helpButton'),
	loadButton = document.getElementById('loadButton'),
	saveButton = document.getElementById('saveButton'),
	fileInput = document.getElementById('fileInput'),
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

	camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 10000);
	camera.position.set(0, 50, 500);

	pathCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 1000);
	pathCamera.position.set(0, 50, 500);

	scene = new THREE.Scene();

	var light = new THREE.DirectionalLight(0xffffff);
	light.position.set(0, 0, 1);
	scene.add(light);
	
	var light = new THREE.AmbientLight(0x333333);
	scene.add(light);

	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setSize(window.innerWidth, window.innerHeight);
	
	var axis = new THREE.AxisHelper(75);
	scene.add(axis);
	
	controls = new THREE.EditorControls(camera);
	
	document.body.appendChild(renderer.domElement);
	
	codeButton.addEventListener('click', handle_codeButton_CLICK);
	helpButton.addEventListener('click', handle_helpButton_CLICK);
	loadButton.addEventListener('click', handle_loadButton_CLICK);
	saveButton.addEventListener('click', handle_saveButton_CLICK);
	fileInput.addEventListener('change', handle_LOAD);
	
	document.body.addEventListener('dragover', handle_DRAG_OVER);
	document.body.addEventListener('dragenter', handle_DRAG_ENTER);
	document.body.addEventListener('dragleave', handle_DRAG_LEAVE);
	document.body.addEventListener('drop', handle_DROP);
	
	document.addEventListener('mousedown', handle_MOUSE_DOWN);
	document.addEventListener('mouseup', handle_MOUSE_UP);
	document.addEventListener('mousemove', handle_MOUSE_MOVE);
	
	document.addEventListener('keydown', handle_KEY_DOWN);
	document.addEventListener('keyup', handle_KEY_UP);
	setInterval(KEY_CHECK, 100);
}

function handle_DRAG_OVER(e) {
	e.preventDefault();
	console.log('drag over');
}

function handle_DRAG_ENTER(e) {
	console.log('drag enter');
}

function handle_DRAG_LEAVE(e) {
	console.log('drag leave');
}

function handle_DROP(e) {
	e.preventDefault();
	console.log('drop');

	var reader = new FileReader();
	reader.addEventListener('load', handle_MODEL_LOAD);
	reader.readAsText(e.dataTransfer.files[0]);
}

function handle_MODEL_LOAD(e) {
	var contentString,
		content,
		loader,
		model,
		mesh,
		color;
	
	contentString = e.target.result;
	content = JSON.parse(contentString);
	
	loader = new THREE.JSONLoader();
	model = loader.parse(content);
	
	for (i = 0; i < model.materials.length; i += 1) {
		color = new THREE.Color(0xffffff);
		color.setRGB(Math.random(), Math.random(), Math.random());
		model.materials[i] = new THREE.MeshLambertMaterial({ambient: color, color: color, side: THREE.DoubleSide});
	}
	mesh = new THREE.Mesh(model.geometry, new THREE.MeshFaceMaterial(model.materials));
	mesh.scale.set(40, 40, 40);
	scene.add(mesh);
}

function handle_MODEL_COMPLETE(e) {
	
}

function handle_loadButton_CLICK(e) {
	var evt = document.createEvent("MouseEvents");
	evt.initEvent("click", true, false);
	fileInput.dispatchEvent(evt);
}

function handle_LOAD(e) {
	var reader = new FileReader();
	reader.addEventListener('load', handle_FILE_LOAD);
	reader.readAsText(e.target.files[0]); 
}

function handle_FILE_LOAD(e) {
	var contentString,
		content;
		
	contentString = e.target.result;
	content = JSON.parse('{"vertices":' + contentString + '}');
	
	loadPath(content.vertices);
	drawPath();
	generatePathCode();
}

function handle_saveButton_CLICK(e) {
	var filestring = '',
		blob,
		i;
	
	filestring += '[\n';
	
	for (i = 0; i < vertices.length; i += 1) {
		filestring += '{"x": ' + vertices[i].x + ', "y": ' + vertices[i].y  + ', "z": ' + vertices[i].z + '}';
		
		if (i !== vertices.length - 1) {
			filestring += ',\n';
		} else {
			filestring += '\n';	
		}
	}
	
	filestring += ']';
	
	blob = new Blob([filestring], {type: "text/plain;charset=utf-8"});
	saveAs(blob, "path.txt");
}

function handle_codeButton_CLICK(e) {
	var range = document.createRange();
	range.selectNodeContents(codeCopyElement);
	
	var sel = window.getSelection();
	sel.removeAllRanges();
	sel.addRange(range);
}

function handle_helpButton_CLICK(e) {
	if (uiElement.style.display == 'block') {
		uiElement.style.display = 'none';
	} else {
		uiElement.style.display = 'block';
	}
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
	case 187: //=
		if (vertices.length == 0) {
			addPath(6);	
		} else {
			addPath(5);
		}
		drawPath();
		generatePathCode();
		break;
	case 189: //-
		removePath();
		drawPath();
		generatePathCode();
		break;
	case 72: //H
		if (codeElement.style.display == 'block') {
			codeElement.style.display = 'none';
		} else {
			codeElement.style.display = 'block';
		}
		break;
	case 32: //SPACE
		//TOGGLE CAMERA
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
		return;
	} else {
		moveSelectedHandle();
	}
}

function resetSelected() {
	try{
		selectedHandle.material.color.setHex(0x00cc00);
	} catch(e) {};
	selectedHandle = null;
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

function loadPath(v) {
	var i;
	
	for (i = 0; i < v.length; i += 1) {
		vert = new Vert(v[i].x, v[i].y, v[i].z);
		vert.mesh.obj = vert;
		vertices.push(vert);
		verticeHandles.push(vert.mesh);		
	}
}

function addPath(count) {
	var i;
	
	for (i = 0; i < count; i += 1) {
		vert = new Vert(Math.floor(Math.random() * 200), Math.floor(Math.random() * 200), Math.floor(Math.random() * 200));
		vert.mesh.obj = vert;
		vertices.push(vert);
		verticeHandles.push(vert.mesh);
	}	
}

function removePath() {
	var removedVertices,
	 	removedHandles,
		i,
		amt;
	
	if (vertices.length < 1) {
		return;
	} else if (vertices.length > 6) {
		amt = 5;
	} else {
		amt = 6;
	}
	
	removedVertices = vertices.splice(vertices.length - amt, amt);
	removedHandles = verticeHandles.splice(verticeHandles.length - amt, amt);
	
	for (i = 0; i < removedHandles.length; i += 1) {
		scene.remove(removedHandles[i]);
	}
	
	generatePathCode();
}

function drawPath() {
	var i,
		j = 0,
		splineVectors = [];
		
	scene.remove(mesh) //clear path
	
	if (vertices.length == 0) {
		return;
	}
	
	path = new THREE.CurvePath();
	
	for (i = 0; i < vertices.length; i += 1) {
		splineVectors.push(vertices[i].v);
		j += 1;
		
		if (j == 6) {
			j = 1;
			spline = new THREE.SplineCurve3(splineVectors);
			path.add(spline);
			
			splineVectors = [];
			splineVectors.push(vertices[i].v);
		}
	}
	
	geometry = new THREE.TubeGeometry(path, vertices.length * 20, 3, 20, false, false);
	mat = new THREE.MeshBasicMaterial({color: 0xccc000, wireframe: true});
	mesh = new THREE.Mesh(geometry, mat);
	scene.add(mesh);
}

function generatePathCode() {
	var i, 
		j = 0, 
		k, 
		m,
		splineVectors = [];
		codeString = "";
	
	codeString += "var path = new THREE.CurvePath();<br/><br/>";
	
	for (i = 0; i < vertices.length; i += 1) {
		splineVectors.push(vertices[i].v);
		j += 1;
		m = i / 5;
		
		if (j == 6) {
			j = 1;
			
			codeString += "var vectors" + m + " = [<br/>";
			for (k = 0; k < splineVectors.length; k += 1) {
				codeString += "new THREE.Vector3(" + splineVectors[k].x + ", " + splineVectors[k].y + ", " + splineVectors[k].z + ")";
				if (k < splineVectors.length - 1) {
					codeString += ", <br/>";
				} else {
					codeString += "<br/>]<br/><br/>";
				}
			}
			
			codeString += "var spline" + m + " = new THREE.SplineCurve3(vectors" + m + ");<br/>";
			codeString += "path.add(spline" + m + ");<br/><br/>";
			
			splineVectors = [];
			splineVectors.push(vertices[i].v);
		}
	}
	
	codeString += "var g = new THREE.TubeGeometry(path, 100, 3, 20, false, false);<br/>";
	codeString += "var m = new THREE.MeshBasicMaterial({color: 0xccc000, wireframe: true});<br/>";
	codeString += "var mesh = new THREE.Mesh(g, m);<br/>";
	
	codeCopyElement.innerHTML = codeString;
}

function positionPathCamera() {
	if (vertices.length == 0) {
		return;
	}
	
	var time, 
		looptime, 
		t, 
		lookAt, 
		pos, 
		dir, 
		normal,
		pathLength;
	
	time = Date.now();
	looptime = 20 * 1000;
	t = ( time % looptime ) / looptime;
	
	pos = geometry.path.getPointAt(t);
	dir = geometry.path.getTangentAt(t);
	normal = new THREE.Vector3();

	pathCamera.position = pos;
	
	pathLength = geometry.path.getLength();
	lookAt = geometry.path.getPointAt( ( t + 30 / pathLength ) % 1 );
		
	lookAt.copy( pos ).add( dir );
	pathCamera.matrix.lookAt(pathCamera.position, lookAt, normal);
	pathCamera.rotation.setEulerFromRotationMatrix( pathCamera.matrix, pathCamera.eulerOrder );
}

function render() {
	positionPathCamera();
	
	renderer.setViewport(0, 0, window.innerWidth * 2, window.innerHeight * 2);
	renderer.setScissor(0, 0, window.innerWidth * 2, window.innerHeight * 2);
	renderer.enableScissorTest(true);
	renderer.setClearColor(0xffffff);
	renderer.render(scene, camera);	
	
	renderer.setViewport((window.innerWidth * 2) - 500, 0, 500, 300);
	renderer.setScissor((window.innerWidth * 2) - 500, 0, 500, 300);
	renderer.enableScissorTest(true);
	renderer.setClearColor(0x111115, 0.1);
	renderer.render(scene, pathCamera);
}

function animate() {
	requestAnimationFrame(animate);
	render();
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
		drawPath();
		generatePathCode();
	}
}
