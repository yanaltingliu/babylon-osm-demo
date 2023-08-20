const canvas = document.getElementById("renderCanvas"); 
const engine = new BABYLON.Engine(canvas, true); 

const createScene = async function(engine) {
  const scene = new BABYLON.Scene(engine);

  const options = {
    groundSize: 500,
    skyboxSize: 500,
    skyboxTexture: new BABYLON.CubeTexture("./assets/TropicalSunnyDay", scene),
  };

  const camera1 = new BABYLON.UniversalCamera("camera1", new BABYLON.Vector3(-10, 50, -80), scene);
  camera1.attachControl(canvas, true);

  // Create a directional light to simulate the sun
  var sun = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(0, -1, 0), scene);
  sun.position = new BABYLON.Vector3(0, 1000, 0);
  sun.intensity = 1;

  // Create a skybox to provide the background color and texture
  var skybox = BABYLON.MeshBuilder.CreateBox("skybox", {size: 800.0}, scene);
  var skyboxMaterial = new BABYLON.StandardMaterial("skyboxMaterial", scene);
  skyboxMaterial.backFaceCulling = false;
  skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("./assets/TropicalSunnyDay", scene);
  skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
  skyboxMaterial.disableLighting = true;
  skybox.material = skyboxMaterial;

  var env = scene.createDefaultEnvironment({
    enableGroundShadow: true,
    groundSize: options.groundSize,
  });

  // adjust the ground position
  env.ground.position.y = 380;

  scene.onPointerDown = evt => {
    if (evt.button === 0) engine.enterPointerlock();
    if (evt.button === 1) engine.exitPointerlock();
  };

  // apply gravity and collisions
  const framesPerSecond = 60;
  const gravity = -9.81;
  scene.gravity = new BABYLON.Vector3(0, gravity / framesPerSecond, 0);
  scene.collisionsEnabled = true;

  camera1.applyGravity = true;
  camera1.checkCollisions = true;
  camera1.ellipsoid = new BABYLON.Vector3(1, 1, 1);

  camera1.minZ = 0.75;
  camera1.speed = 0.5;
  camera1.angularSpeed = 0.05;
  camera1.angle = Math.PI / 2;
  camera1.direction = new BABYLON.Vector3(Math.cos(camera1.angle), 0, Math.sin(camera1.angle));

  camera1.keysUp.push(87); // W
  camera1.keysDown.push(83); // S
  camera1.keysLeft.push(65); // A
  camera1.keysRight.push(68); // D

  // add a label to show the mouse and keyboard controls' instructions
  // place the label at the bottom left corner of the screen with 10px margin
  const label = new BABYLON.GUI.Rectangle();
  label.width = "240px";
  label.height = "200px";
  label.cornerRadius = 20;
  label.color = "white";
  label.thickness = 4;
  label.background = "black";
  label.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
  label.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
  label.top = "10px";
  label.left = "10px";
  label.paddingBottom = "50px";
  label.zIndex = 5;
  // adjust the label's transparency
  label.alpha = 0.7;
  const labelContent = new BABYLON.GUI.TextBlock();
  labelContent.text = "FPC mode\nLeft-click: enter Pointerlock\nMoving mouse: look around\nEsc: exit Pointerlock\nW/A/S/D: move\n\nRight-click: show mesh name";
  labelContent.color = "white";
  labelContent.fontSize = 16;
  label.addControl(labelContent);
  const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
  advancedTexture.addControl(label);
  
  BABYLON.SceneLoader.Append("./data/", "downtown.glb", scene, function (meshes) {
    // get the ground mesh
    const groundMesh = meshes.meshes[5];
    console.log('groundMesh', groundMesh);

    meshes.meshes.map(mesh => {
      mesh.checkCollisions = true;
    });
  });

  // add a pointer observable to the scene to detect a mouse right-click on the mesh
  scene.onPointerObservable.add((pointerInfo) => {
    if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN && pointerInfo.event.button === 2) {
      if (pointerInfo.pickInfo.hit) {
        let pickedMesh = pointerInfo.pickInfo.pickedMesh;
        const meshName = pickedMesh.name;
        const shortName = meshName.split('_')[0];
        console.log("pointer down on mesh: ", shortName);
        console.log(pickedMesh);
        // create a popup to show the mesh name
        const popup = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        const text1 = new BABYLON.GUI.TextBlock();
        text1.text = shortName;
        text1.color = "white";
        text1.fontSize = 24;
        popup.addControl(text1);
        // remove the popup after 2 seconds
        setTimeout(() => {
          popup.dispose();
        }, 2000);
        }
      }
  });

  const xrHelper = await scene.createDefaultXRExperienceAsync();

  const featuresManager = xrHelper.baseExperience.featuresManager;

  featuresManager.enableFeature(BABYLON.WebXRFeatureName.POINTER_SELECTION, "stable", {
      xrInput: xrHelper.input,
      enablePointerSelectionOnAllControllers: true        
  });

  featuresManager.enableFeature(BABYLON.WebXRFeatureName.TELEPORTATION, "stable", {
      xrInput: xrHelper.input,
      floorMeshes: [env.ground],
  });

  return scene;
}

createScene(engine).then(sceneToRender => {
  engine.runRenderLoop(() => sceneToRender.render());
});

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
  engine.resize();
});