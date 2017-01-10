var camera, 
	scene, 
	scene2,
	renderer, 
	projector,
	mesh,
	geometry,
	mat,
	path,
	pathCamera,
	cameraOnPath,
	cameraHelper,
	controls,
	vertices = [],
	verticeHandles = [],
	segments = [],
	selectedHandle,
	pixelRatio = window.devicePixelRatio,
	codeElement = document.getElementById('code'),
	codeCopyElement = document.getElementById('codeCopy'),
	uiElement = document.getElementById('ui'),
	codeButton = document.getElementById('codeButton'),
	helpButton = document.getElementById('helpButton'),
	loadButton = document.getElementById('loadButton'),
	saveButton = document.getElementById('saveButton'),
	fileInput = document.getElementById('fileInput'),
	sliderHolder = document.getElementById('sliderHolder'),
	slider = document.getElementById('slider'),
	SLIDER_DRAGGING = false,
	keys = [],
	vr = true,
	effect,
	controller1,
	controller2,
	delta = 0,
	ANIMATE = true,
	SHIFT = false,
	OPT = false,
	renderer2,
	group,
	tv,
	tvmaterial,
	cameraTexture,
	cameraCanvas,
	tempMatrix = new THREE.Matrix4(),
	mouse = {x: 0, y: 0, z: 0};

init();
animate();

function init() {

	if ( vr == true && WEBVR.isAvailable() === false ) {
		document.body.appendChild( WEBVR.getMessage() );
		vr = false;
	}

  	projector = new THREE.Projector();

	camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 10000);
	camera.position.set(0, 50, 500);

	pathCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 1000);
	pathCamera.position.set(0, 50, 500);

	scene2 = new THREE.Scene();

	scene = new THREE.Scene();
	scene.add(camera);

	var light = new THREE.DirectionalLight(0xffffff);
	light.position.set(0, 0, 1);
	scene.add(light);
	
	var light = new THREE.AmbientLight(0x333333);
	scene.add(light);

	renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setClearColor(0xefefef);

	group = new THREE.Group();
	scene.add( group );

	var axis = new THREE.AxisHelper(75);
	scene.add(axis);

	///camera
	cameraCanvas = document.createElement('canvas');
	cameraCanvas.height = cameraCanvas.width = 512;

	renderer2 = new THREE.WebGLRenderer({antialias: true, alpha: true, canvas: cameraCanvas});
	renderer2.setSize(window.innerWidth, window.innerHeight);
	renderer2.setPixelRatio( window.devicePixelRatio );
	renderer2.setClearColor(0xefefef);

	cameraTexture = new THREE.Texture(cameraCanvas);
	cameraTexture.minFilter = THREE.LinearFilter
	tvmaterial = new THREE.SpriteMaterial({map: cameraTexture, transparent: true, opacity: 0});
	tv = new THREE.Sprite(tvmaterial);
	tv.scale.set(0.5, 0.25, 1);
	tv.position.set(0, 0, -1);
	camera.add(tv);


	if (vr == true) {
		controls = new THREE.VRControls( camera );
		controls.standing = true;

		controller1 = new THREE.ViveController( 0 );
		controller1.standingMatrix = controls.getStandingMatrix();
		controller1.addEventListener( 'gripsdown', onGripDown );
		controller1.addEventListener( 'gripsup', onGripUp );
		controller1.addEventListener( 'thumbpaddown', onThumbPadDown );
		controller1.addEventListener( 'triggerdown', onTriggerDown );
		controller1.addEventListener( 'triggerup', onTriggerUp );
		scene.add( controller1 );

		controller2 = new THREE.ViveController( 1 );
		controller2.standingMatrix = controls.getStandingMatrix();
		controller2.addEventListener( 'gripsdown', onGripDown );
		controller2.addEventListener( 'gripsup', onGripUp );
		controller2.addEventListener( 'thumbpaddown', onThumbPadDown );
		controller2.addEventListener( 'triggerdown', onTriggerDown );
		controller2.addEventListener( 'triggerup', onTriggerUp );
		scene.add( controller2 );

		var loader = new THREE.OBJLoader();
		loader.setPath( 'models/obj/vive-controller/' );
		loader.load( 'vr_controller_vive_1_5.obj', function ( object ) {

			var loader = new THREE.TextureLoader();
			loader.setPath( 'models/obj/vive-controller/' );

			var controller = object.children[ 0 ];
			controller.material.map = loader.load( 'onepointfive_texture.png' );
			controller.material.specularMap = loader.load( 'onepointfive_spec.png' );

			controller1.add( object.clone() );
			controller2.add( object.clone() );

		} );

		var geometry = new THREE.Geometry();
		geometry.vertices.push( new THREE.Vector3( 0, 0, 0 ) );
		geometry.vertices.push( new THREE.Vector3( 0, 0, - 1 ) );

		var line = new THREE.Line( geometry );
		line.name = 'line';
		line.scale.z = 5;

		controller1.add( line.clone() );
		controller2.add( line.clone() );

		raycaster = new THREE.Raycaster();

		effect = new THREE.VREffect( renderer );

		if ( WEBVR.isAvailable() === true ) {
			document.body.appendChild( WEBVR.getButton( effect ) );
		}

	} else {
		controls = new THREE.EditorControls(camera);
	}
	
	document.body.appendChild(renderer.domElement);
	
	codeButton.addEventListener('click', handle_codeButton_CLICK);
	helpButton.addEventListener('click', handle_helpButton_CLICK);
	loadButton.addEventListener('click', handle_loadButton_CLICK);
	saveButton.addEventListener('click', handle_saveButton_CLICK);
	fileInput.addEventListener('change', handle_LOAD);
	
	slider.addEventListener('mousedown', handle_slider_MOUSE_DOWN);
	sliderHolder.addEventListener('mousemove', handle_sliderHolder_MOUSE_MOVE);
	
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


	function onGripDown(event) {
		tvmaterial.opacity = 1;
		tvmaterial.needsUpdate = true;
	}

	function onGripUp(event) {
		tvmaterial.opacity = 0;
		tvmaterial.needsUpdate = true;
	}


	var dragging;

	function onThumbPadDown(event) {
		if (vertices.length == 0) {
			addPath(6);	
		} else {
			addPath(5);
		}
		drawPath();
		generatePathCode();
	}

	function onTriggerDown( event ) {

				var controller = event.target;

				var intersections = getIntersections( controller );

				if ( intersections.length > 0 ) {

					var intersection = intersections[ 0 ];

					tempMatrix.getInverse( controller.matrixWorld );

					var object = intersection.object;
					object.matrix.premultiply( tempMatrix );
					object.matrix.decompose( object.position, object.quaternion, object.scale );
					controller.add( object );

					controller.userData.selected = object;

					resetSelected();
					intersection.object.material.color.setHex(0x0000cc);
					selectedHandle = intersection.object;

				}

	}

			function onTriggerUp( event ) {

				var controller = event.target;

				if ( controller.userData.selected !== undefined ) {

					var object = controller.userData.selected;
					object.matrix.premultiply( controller.matrixWorld );
					object.matrix.decompose( object.position, object.quaternion, object.scale );
					group.add( object );

					controller.userData.selected = undefined;

	

					selectedHandle.obj.update();

					drawPath();

				}


			}

			function getIntersections( controller ) {

				tempMatrix.identity().extractRotation( controller.matrixWorld );

				raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
				raycaster.ray.direction.set( 0, 0, -1 ).applyMatrix4( tempMatrix );

				return raycaster.intersectObjects( group.children );

			}

			function intersectObjects( controller ) {

				// Do not highlight when already selected

				if ( controller.userData.selected !== undefined ) return;

				var line = controller.getObjectByName( 'line' );
				var intersections = getIntersections( controller );

				if ( intersections.length > 0 ) {

					var intersection = intersections[ 0 ];

					var object = intersection.object;
					//object.material.emissive.r = 1;
					intersected.push( object );

					line.scale.z = intersection.distance;

				} else {

					line.scale.z = 5;

				}

			}

			function cleanIntersected() {

				while ( intersected.length ) {

					var object = intersected.pop();
					//object.material.emissive.r = 0;

				}

			}

function handle_slider_MOUSE_DOWN(e) {
	SLIDER_DRAGGING = true;
}

function handle_sliderHolder_MOUSE_MOVE(e) {
	var _x;
	
	if (SLIDER_DRAGGING) {
		_x = e.pageX - sliderHolder.offsetLeft;
		if (_x > sliderHolder.offsetWidth - slider.offsetWidth) {
			_x = sliderHolder.offsetWidth - slider.offsetWidth;
		} else if (_x < 0) {
			_x = sliderHolder.offsetLeft
		}
		slider.style.left = _x + 'px';
		
		delta = _x / (sliderHolder.offsetWidth - slider.offsetWidth);
		printNodeData();
	}
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
		model.materials[i] = new THREE.MeshLambertMaterial({ambient: color, color: color, side: THREE.DoubleSide, shading: THREE.FlatShading});
	}
	
	mesh = new THREE.Mesh(model.geometry, new THREE.MeshFaceMaterial(model.materials));
	mesh.scale.set(0.1, 0.1, 0.1);
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
	content = JSON.parse(contentString);
	
	loadPath(content.vertices);
	drawPath();
	generatePathCode();
}

function handle_saveButton_CLICK(e) {
	var filestring = '',
		blob,
		i;
	
	filestring += '{"vertices": [\n';
	
	for (i = 0; i < vertices.length; i += 1) {
		filestring += '{"x": ' + vertices[i].x + ', "y": ' + vertices[i].y  + ', "z": ' + vertices[i].z + '}';
		
		if (i !== vertices.length - 1) {
			filestring += ',\n';
		} else {
			filestring += '\n';	
		}
	}
	
	filestring += ']}';
	
	blob = new Blob([filestring], {type: "text/plain;charset=utf-8"});
	saveAs(blob, "path.json");
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
	//projector.unprojectVector(vector, camera);
	vector.unproject(camera);

	raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
	intersects = raycaster.intersectObjects(verticeHandles);

	if (intersects.length > 0) {
		resetSelected();
		intersects[0].object.material.color.setHex(0x0000cc);
		selectedHandle = intersects[0].object;
		printNodeData();
	} else {
		resetSelected();
	}
}

function handle_MOUSE_UP(e) {
	SLIDER_DRAGGING = false;
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
		if (sliderHolder.style.display == 'block') {
			sliderHolder.style.display = 'none';
			ANIMATE = true;
		} else {
			sliderHolder.style.display = 'block';
			ANIMATE = false;
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
		vert = new Vert(Math.floor(-0.5 + Math.random() * 2), 0.5 + Math.floor(Math.random() * 2), Math.floor(-0.5 + Math.random() * 1));
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
	scene.remove(cameraOnPath);
	scene.remove(cameraHelper);
	
	if (vertices.length == 0) {
		return;
	}
	
	path = new THREE.CurvePath();
	
	for (i = 0; i < vertices.length; i += 1) {
		splineVectors.push(vertices[i].v);
	}
	
	spline = new THREE.CatmullRomCurve3(splineVectors);
	path.add(spline);
		
	geometry = new THREE.TubeGeometry(path, vertices.length * 20, 0.01, 20);
	mat = new THREE.MeshBasicMaterial({color: 0xccc000, wireframe: true, transparent: true});
	mesh = new THREE.Mesh(geometry, mat);
	scene.add(mesh);
	
	addCameraToPath();
	cameraHelper = new THREE.CameraHelper(pathCamera);
	scene.add(cameraHelper);
}

function addCameraToPath() {
	var g = new THREE.SphereGeometry(0.02, 5),
		m = new THREE.MeshBasicMaterial({color: 0xff0000});
		
	cameraOnPath = new THREE.Mesh(g, m);
	scene.add(cameraOnPath);
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
		binormal,
		segments,
		pickt,
		pick,
		pickNext,
		pathLength;
	
	if (ANIMATE !== false) {
		time = Date.now();
		looptime = 20 * 1000;
		t = ( time % looptime ) / looptime;	
	} else {
		t = delta;
	}
	
	pos = geometry.parameters.path.getPointAt(t);
	dir = geometry.parameters.path.getTangentAt(t);
	normal = new THREE.Vector3(0, 0, 1);
	binormal = new THREE.Vector3();
	
	segments = geometry.tangents.length;
	pickt = t * segments;
	pick = Math.floor(pickt);
	pickNext = (pick + 1) % segments;

	binormal.subVectors(geometry.binormals[pickNext], geometry.binormals[pick]);
	binormal.multiplyScalar(pickt - pick).add(geometry.binormals[pick]);
	normal.copy(binormal).cross(dir).multiplyScalar(-1);

	pathCamera.position.set(pos.x, pos.y, pos.z);

	pathLength = geometry.parameters.path.getLength();
	lookAt = geometry.parameters.path.getPointAt((t + 30 / pathLength) % 1);
		
	lookAt.copy(pos).add(dir);
	pathCamera.matrix.lookAt(pathCamera.position, lookAt, normal);

	var euler = new THREE.Euler().setFromRotationMatrix(pathCamera.matrix, pathCamera.rotation.order);
	pathCamera.rotation.set(euler.x, euler.y, euler.z);
}

function positionCameraOnPath() {
	if (vertices.length == 0) {
		return;
	}
	
	cameraOnPath.position.set(pathCamera.position.x, pathCamera.position.y, pathCamera.position.z);
	cameraOnPath.rotation.set(pathCamera.rotation.x, pathCamera.rotation.y, pathCamera.rotation.z);

}

function printNodeData() {
	var el = document.getElementById('nodeDetails');
	
	el.innerHTML = '';
	
	if (ANIMATE !== false) {
		el.innerHTML += 'x: ' + selectedHandle.position.x + '<br/>';
		el.innerHTML += 'y: ' + selectedHandle.position.y + '<br/>';
		el.innerHTML += 'z: ' + selectedHandle.position.z + '<br/>';
	} else {
		el.innerHTML += 'camera <br/>';
		el.innerHTML += 'x: ' + Math.round(pathCamera.position.x) + '<br/>';
		el.innerHTML += 'y: ' + Math.round(pathCamera.position.y) + '<br/>';
		el.innerHTML += 'z: ' + Math.round(pathCamera.position.z) + '<br/>';	
	}
}

function render() {
	positionPathCamera();
	positionCameraOnPath();


	if (vr) {
		controller1.update();
		controller2.update();

		controls.update();

		if (mat) {
			mat.opacity = 1;
		}

		effect.render( scene, camera );

		if (mat) {
			mat.opacity = 0;
		}
		
		cameraTexture.needsUpdate = true;
		renderer2.render(scene, pathCamera);
	} else {
		renderer.setViewport(0, 0, window.innerWidth * pixelRatio, window.innerHeight * pixelRatio);
		renderer.setScissor(0, 0, window.innerWidth * pixelRatio, window.innerHeight * pixelRatio);
		renderer.enableScissorTest(true);
		renderer.setClearColor(0xffffff);
		renderer.render(scene, camera);	
		
		renderer.setViewport((window.innerWidth * pixelRatio) - 250 * pixelRatio, 0, 250 * pixelRatio, 150 * pixelRatio);
		renderer.setScissor((window.innerWidth * pixelRatio) - 250 * pixelRatio, 0, 250 * pixelRatio, 150 * pixelRatio);
		renderer.enableScissorTest(true);
		renderer.setClearColor(0x111115, 0.1);
		renderer.render(scene, pathCamera);
	}
	
}

function animate() {
	if (effect) {
		effect.requestAnimationFrame( animate );
	} else {
		requestAnimationFrame(animate);
	}
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
	
	sphere = new THREE.SphereGeometry(0.05, 10, 10);
	material = new THREE.MeshBasicMaterial({color: 0x00cc00, transparent: true, opacity: 0.5});
	this.mesh = new THREE.Mesh(sphere, material);
	this.mesh.position.set(this.x, this.y, this.z);
	group.add(this.mesh);
	
	this.update = function () {
		instance.x = instance.mesh.position.x;
		instance.y = instance.mesh.position.y;
		instance.z = instance.mesh.position.z;
		
		instance.v = new THREE.Vector3(instance.x, instance.y, instance.z);
		//drawPath();
		generatePathCode();
	}
}
