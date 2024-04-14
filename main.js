import * as THREE from 'three';

let scene, camera, renderer, mesh;
let meshFloor, ambientLight, light;
let crate, crateTexture, crateNormalMap, crateBumpMap;
let keyboard = {};
let player = { height: 1.8, speed: 0.2, turnSpeed: Math.PI * 0.02 };
let USE_WIREFRAME = false;

function init() {
    // Configuração da cena
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);

    // Criação do chão
    meshFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20, 10, 10),
        new THREE.MeshPhongMaterial({ color: 0xffffff, wireframe: USE_WIREFRAME })
    );
    meshFloor.rotation.x -= Math.PI / 2;
    meshFloor.receiveShadow = true;
    scene.add(meshFloor);

    // Luz ambiente
    ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Luz direcional
    light = new THREE.PointLight(0xffffff, 0.8, 18);
    light.position.set(-3, 6, -3);
    light.castShadow = true;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 25;
    scene.add(light);

    // Criação de um objeto (caixa) com texturas
    crateTexture = new THREE.TextureLoader().load("crate0/crate0_diffuse.png");
    crate = new THREE.Mesh(
        new THREE.BoxGeometry(3, 3, 3),
        new THREE.MeshPhongMaterial({
            map: crateTexture,
            bumpMap: crateBumpMap,
            normalMap: crateNormalMap,
            shininess: 10
        })
    );
    scene.add(crate);
    crate.position.set(2.5, 3 / 2, 2.5);
    crate.receiveShadow = true;
    crate.castShadow = true;

    // Criação da arma
    const gunGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.5); // Modificado para ser mais pequeno e ter forma de retângulo
    const gunMaterial = new THREE.MeshPhongMaterial({ color: 0x999999 });
    mesh = new THREE.Mesh(gunGeometry, gunMaterial);
    camera.add(mesh);
    mesh.position.set(0.01, -0.05, -0.5); // Ajustado para centralizar a arma na câmera
    camera.add(mesh);
    scene.add(camera);

    // Configuração da câmera
    camera.position.set(0, player.height, -5);
    camera.lookAt(new THREE.Vector3(0, player.height, 0));

    // Configuração do renderizador
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;
    document.body.appendChild(renderer.domElement);

    // Adiciona listeners de teclado
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);

    // Inicia a animação
    animate();
}

function animate() {
    requestAnimationFrame(animate);

    // Rotação da caixa
    crate.rotation.y += 0.01;

    // Movimentação do jogador
    if (keyboard[87]) { // W key
        camera.position.x -= Math.sin(camera.rotation.y) * player.speed;
        camera.position.z -= -Math.cos(camera.rotation.y) * player.speed;
    }
    if (keyboard[83]) { // S key
        camera.position.x += Math.sin(camera.rotation.y) * player.speed;
        camera.position.z += -Math.cos(camera.rotation.y) * player.speed;
    }
    if (keyboard[65]) { // A key
        camera.position.x += Math.sin(camera.rotation.y + Math.PI / 2) * player.speed;
        camera.position.z += -Math.cos(camera.rotation.y + Math.PI / 2) * player.speed;
    }
    if (keyboard[68]) { // D key
        camera.position.x += Math.sin(camera.rotation.y - Math.PI / 2) * player.speed;
        camera.position.z += -Math.cos(camera.rotation.y - Math.PI / 2) * player.speed;
    }

    // Rotação da câmera
    if (keyboard[37]) { // left arrow key
        camera.rotation.y -= player.turnSpeed;
    }
    if (keyboard[39]) { // right arrow key
        camera.rotation.y += player.turnSpeed;
    }

    // Renderiza a cena
    renderer.render(scene, camera);
}

function keyDown(event) {
    keyboard[event.keyCode] = true;
}

function keyUp(event) {
    keyboard[event.keyCode] = false;
}

window.onload = init;