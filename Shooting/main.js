// Declaração de variáveis para os elementos da cena
var scene, camera, renderer, mesh, clock;
var meshFloor, ambientLight, light;

var collisionSound;
var bulletSound;
var backgroundSound;

collisionSound = new Audio('563528__vibinchillin__box-break_mixdown.wav');
bulletSound = new Audio('161195__aleksnascimento__glock-shot-sound-effect.wav');

// Variáveis relacionadas à textura de uma caixa
var crate, crateTexture, crateNormalMap, crateBumpMap;

// Objeto para monitorar teclas pressionadas e informações do jogador
var keyboard = {};
var player = { height: 1.8, speed: 0.2, turnSpeed: Math.PI * 0.02, canShoot: 0 };
var USE_WIREFRAME = false;

// Tela de carregamento
var loadingScreen = {
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 100),
    box: new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.5, 0.5),
        new THREE.MeshBasicMaterial({ color: 0x4444ff })
    )
};
var loadingManager = null;
var RESOURCES_LOADED = false;

// Índice de modelos
var models = {
    uzi: {
        obj: "models/uziGold.obj",
        mtl: "models/uziGold.mtl",
        mesh: null,
        castShadow: false
    }
};

// Índice de meshes
var meshes = {};

// Array de balas
var bullets = [];

// Função de inicialização da cena
function init() {

    // som de fundo
    // backgroundSound = new Audio('Rain.mp3');
    // backgroundSound.loop = true; // Define o som para loop
    // backgroundSound.volume = 0.2; // Define o volume do som (0 a 1)
    // backgroundSound.play(); // Inicia a reprodução do som de fundo

    // Inicialização da cena, câmera e relógio
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
    clock = new THREE.Clock();

    // Configuração da tela de carregamento
    loadingScreen.box.position.set(0, 0, 5);
    loadingScreen.camera.lookAt(loadingScreen.box.position);
    loadingScreen.scene.add(loadingScreen.box);

    // Gerenciador de carregamento
    loadingManager = new THREE.LoadingManager();
    loadingManager.onProgress = function (item, loaded, total) {
        console.log(item, loaded, total);
    };
    loadingManager.onLoad = function () {
        console.log("Todos os recursos carregados.");
        RESOURCES_LOADED = true;
        onResourcesLoaded();
    };

    // Criação de elementos da cena (cubo, chão, luzes)
    mesh = new THREE.Mesh(
        // new THREE.BoxGeometry(1, 1, 1),
        // new THREE.MeshPhongMaterial({ color: 0xff4444, wireframe: USE_WIREFRAME })
    );
    mesh.position.y += 1;
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    scene.add(mesh);

    meshFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 40, 20, 20),
        new THREE.MeshPhongMaterial({ color: 0xffffff, wireframe: USE_WIREFRAME })
    );
    meshFloor.rotation.x -= Math.PI / 2;
    meshFloor.receiveShadow = true;
    scene.add(meshFloor);

    ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    light = new THREE.PointLight(0xffffff, 0.8, 18);
    light.position.set(-3, 6, -3);
    light.castShadow = true;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 25;
    scene.add(light);

    // Carregamento de texturas para a caixa
    var textureLoader = new THREE.TextureLoader(loadingManager);
    crateTexture = textureLoader.load("crate0/crate0_diffuse.jpg");
    crateBumpMap = textureLoader.load("crate0/crate0_bump.jpg");
    crateNormalMap = textureLoader.load("crate0/crate0_normal.jpg");

    // Criação da caixa com texturas
    crate = new THREE.Mesh(
        new THREE.BoxGeometry(3, 3, 3),
        new THREE.MeshPhongMaterial({
            color: 0xffffff,
            map: crateTexture,
            bumpMap: crateBumpMap,
            normalMap: crateNormalMap
        })
    );
    scene.add(crate);
    crate.position.set(2.5, 3 / 2, 2.5);
    crate.receiveShadow = true;
    crate.castShadow = true;

    // Carregar modelos
    for (var _key in models) {
        (function (key) {
            var mtlLoader = new THREE.MTLLoader(loadingManager);
            mtlLoader.load(models[key].mtl, function (materials) {
                materials.preload();
                var objLoader = new THREE.OBJLoader(loadingManager);
                objLoader.setMaterials(materials);
                objLoader.load(models[key].obj, function (mesh) {
                    mesh.traverse(function (node) {
                        if (node instanceof THREE.Mesh) {
                            if ('castShadow' in models[key])
                                node.castShadow = models[key].castShadow;
                            else
                                node.castShadow = true;

                            if ('receiveShadow' in models[key])
                                node.receiveShadow = models[key].receiveShadow;
                            else
                                node.receiveShadow = true;
                        }
                    });
                    models[key].mesh = mesh;
                });
            });
        })(_key);
    }

    // Configuração da posição e rotação da câmera
    camera.position.set(0, player.height, -5);
    camera.lookAt(new THREE.Vector3(0, player.height, 0));

    // Configuração do renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;
    document.body.appendChild(renderer.domElement);

    // Chamada da função de animação
    animate();
}

// Função chamada quando todos os recursos são carregados
function onResourcesLoaded() {
    // Clonar modelos em meshes
    meshes["playerweapon"] = models.uzi.mesh.clone();
    // Adicionar mesh da arma do jogador à cena
    meshes["playerweapon"].position.set(0, 2, 0);
    meshes["playerweapon"].scale.set(10, 10, 10);
    scene.add(meshes["playerweapon"]);
}

// Função de animação
function animate() {
    // Renderizar a tela de carregamento até que todos os recursos sejam carregados
    if (RESOURCES_LOADED == false) {
        requestAnimationFrame(animate);
        loadingScreen.box.position.x -= 0.05;
        if (loadingScreen.box.position.x < -10) loadingScreen.box.position.x = 10;
        loadingScreen.box.position.y = Math.sin(loadingScreen.box.position.x);
        renderer.render(loadingScreen.scene, loadingScreen.camera);
        return;
    }

    requestAnimationFrame(animate);

    // Variáveis para calcular tempo e delta
    var time = Date.now() * 0.0005;
    var delta = clock.getDelta();

    // Rotação dos objetos na cena
    // mesh.rotation.x += 0.01;
    // mesh.rotation.y += 0.02;
    crate.rotation.y += 0.01;

    // Atualização da posição das balas
    for (var index = 0; index < bullets.length; index += 1) {
        if (bullets[index] === undefined) continue;
        if (bullets[index].alive == false) {
            bullets.splice(index, 1);
            continue;
        }
        bullets[index].position.add(bullets[index].velocity);
    }

    // Controle do jogador
    if (keyboard[87]) { // Tecla W
        camera.position.x -= Math.sin(camera.rotation.y) * player.speed;
        camera.position.z -= -Math.cos(camera.rotation.y) * player.speed;
    }
    if (keyboard[83]) { // Tecla S
        camera.position.x += Math.sin(camera.rotation.y) * player.speed;
        camera.position.z += -Math.cos(camera.rotation.y) * player.speed;
    }
    if (keyboard[65]) { // Tecla A
        camera.position.x += Math.sin(camera.rotation.y + Math.PI / 2) * player.speed;
        camera.position.z += -Math.cos(camera.rotation.y + Math.PI / 2) * player.speed;
    }
    if (keyboard[68]) { // Tecla D
        camera.position.x += Math.sin(camera.rotation.y - Math.PI / 2) * player.speed;
        camera.position.z += -Math.cos(camera.rotation.y - Math.PI / 2) * player.speed;
    }
    if (keyboard[37]) { // Tecla seta esquerda
        camera.rotation.y -= player.turnSpeed;
    }
    if (keyboard[39]) { // Tecla seta direita
        camera.rotation.y += player.turnSpeed;
    }

    // Atirar uma bala
    if (keyboard[32] && player.canShoot <= 0) { // Tecla de espaço
        var bullet = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );

        bullet.position.set(
            meshes["playerweapon"].position.x,
            meshes["playerweapon"].position.y + 0.15,
            meshes["playerweapon"].position.z
        );

        bullet.velocity = new THREE.Vector3(
            -Math.sin(camera.rotation.y),
            0,
            Math.cos(camera.rotation.y)
        );

        bullet.alive = true;
        setTimeout(function () {
            bullet.alive = false;
            scene.remove(bullet);
        }, 1000);

        bullets.push(bullet);
        scene.add(bullet);
        bulletSound.volume = 0.2;
        bulletSound.play();
        player.canShoot = 10;
    }
    if (player.canShoot > 0) player.canShoot -= 1;

    // Posicionamento da arma à frente da câmera
    meshes["playerweapon"].position.set(
        camera.position.x - Math.sin(camera.rotation.y + Math.PI / 6) * 0.75,
        camera.position.y - 0.5 + Math.sin(time * 4 + camera.position.x + camera.position.z) * 0.01,
        camera.position.z + Math.cos(camera.rotation.y + Math.PI / 6) * 0.75
    );
    meshes["playerweapon"].rotation.set(
        camera.rotation.x,
        camera.rotation.y - Math.PI,
        camera.rotation.z
    );

    // Detecção de colisão entre balas e a caixa
    for (var index = 0; index < bullets.length; index++) {
        if (bullets[index] === undefined) continue;
        if (bullets[index].alive == false) continue;
        // Verificar colisão com a caixa
        if (bullets[index].position.distanceTo(crate.position) < 1.5) {
            // Remover a bala da cena
            scene.remove(bullets[index]);
            bullets[index].alive = false;
            // Respawn da caixa em um novo local dentro da base
            var newX = Math.random() * 8 - 4; // Gera uma posição X aleatória dentro da base
            var newZ = Math.random() * 8 - 4; // Gera uma posição Z aleatória dentro da base
            crate.position.set(newX, 1.5, newZ);
            collisionSound.play();
        }
    }

    // Renderização da cena
    renderer.render(scene, camera);
}

// Função para lidar com pressionamento de teclas
function keyDown(event) {
    keyboard[event.keyCode] = true;
}

// Função para lidar com soltura de teclas
function keyUp(event) {
    keyboard[event.keyCode] = false;
}

// Adicionar event listeners para teclado
window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);

// Iniciar a cena quando a janela for carregada
window.onload = init;