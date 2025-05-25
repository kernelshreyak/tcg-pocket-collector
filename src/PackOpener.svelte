<script>
  import { onMount } from "svelte";
  import * as THREE from "three";
  import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
  import pokemon from "pokemontcgsdk";
  import Card from "./lib/components/CardProxy.svelte";
  import CardList from "./Cards.svelte";
  import { collection } from "./lib/stores/collection.js";
  import { get } from "svelte/store";

  export let setId = "";
  export let size = 5;

  let scene, camera, renderer, raycaster, mouse;
  let packGroup, packBody, packTop;
  let animationId;
  let torn = false;
  let loading = false;

  let cards = [];
  let initialCards = [];
  let opened = false;

  $: if (setId) initPack();
  async function initPack() {
    if (loading) return;
    opened = false;
    torn = false;
    loading = true;
    // if (packGroup) {
    //   console.log("clearning pachgroup");
    //   scene.remove(packGroup);
    //   packGroup.traverse((child) => {
    //     if (child.geometry) child.geometry.dispose();
    //     if (child.material) {
    //       if (Array.isArray(child.material)) {
    //         child.material.forEach((m) => m.dispose());
    //       } else {
    //         child.material.dispose();
    //       }
    //     }
    //     if (child.texture) child.texture.dispose();
    //   });
    //   packGroup = null;
    //   packBody = null;
    //   packTop = null;
    // }
    // if (renderer) {
    //   renderer.dispose();
    //   const container = document.getElementById("three-container");
    //   while (container.firstChild) {
    //     container.removeChild(container.firstChild);
    //   }
    //   renderer = null;
    // }
    // if (animationId) {
    //   cancelAnimationFrame(animationId);
    //   animationId = null;
    // }

    // Fetch card data for the pack
    console.log("Loading pack for set:", setId);
    const resCards = await pokemon.card.where({
      q: `(set.id:${setId} supertype:Pokémon)`,
      select: `id,name,number,supertype,subtypes,rarity,images,types,set`,
      orderBy: `-set.releaseDate,-number`,
      pageSize: 36,
    });
    console.log("Loaded pack for set:", setId);
    initialCards = resCards.data;
    cards = [];
    for (let i = 0; i < size && initialCards.length; i++) {
      const rand = Math.floor(Math.random() * initialCards.length);
      cards.push(initialCards[rand]);
    }

    // Load set logo from local JSON
    const res = await fetch("/data/sets.json");
    const json = await res.json();
    const sets = json.data || json;
    const setData = sets.find((s) => s.id === setId);
    if (!setData) {
      console.error(`Set with id ${setId} not found`);
      return;
    }
    const logoUrl = setData.images.logo;

    // Initialize Three.js scene
    scene = new THREE.Scene();

    // Fixed camera in front at specific zoom
    camera = new THREE.PerspectiveCamera(
      85,
      window.innerWidth / window.innerHeight,
      0.3,
      1000,
    );
    camera.position.set(0, 0, 2); // fixed distance in front
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.cursor = "pointer";
    document.getElementById("three-container").appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);

    // Setup raycaster for interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    window.addEventListener("resize", onWindowResize);
    renderer.domElement.addEventListener("click", onClick);

    // Load 3D models and logo texture
    const gltfLoader = new GLTFLoader();
    const [bodyGltf, topGltf, logoTexture, logoTexture2] = await Promise.all([
      new Promise((resolve) =>
        gltfLoader.load("/assets/models/pack-body.glb", resolve),
      ),
      new Promise((resolve) =>
        gltfLoader.load("/assets/models/pack-top.glb", resolve),
      ),
      new Promise((resolve) =>
        new THREE.TextureLoader().load(logoUrl, resolve),
      ),
      new Promise((resolve) =>
        new THREE.TextureLoader().load("/assets/tcg_logo.svg", resolve),
      ),
    ]);

    buildPack(bodyGltf.scene, topGltf.scene, logoTexture, logoTexture2);
    animate();
    loading = false;
  }

  function buildPack(bodyModel, topModel, logoTexture, logoTexture2) {
    packGroup = new THREE.Group();

    // Body model
    packBody = bodyModel;
    packBody.name = "body";
    packBody.traverse((child) => {
      if (child.isMesh) child.castShadow = true;
    });
    packGroup.add(packBody);

    // Logo overlay on body front
    const logoGeom = new THREE.PlaneGeometry(0.6, 0.6);
    const logoMat = new THREE.MeshBasicMaterial({
      map: logoTexture,
      transparent: true,
    });
    const logoMesh = new THREE.Mesh(logoGeom, logoMat);
    logoMesh.position.set(0, -0.2, 0.4);
    packGroup.add(logoMesh);

    // Logo of TCG on top
    const logoGeom2 = new THREE.PlaneGeometry(0.6, 0.6);
    const logoMat2 = new THREE.MeshBasicMaterial({
      map: logoTexture2,
      transparent: true,
    });
    const logoMesh2 = new THREE.Mesh(logoGeom2, logoMat2);
    logoMesh2.position.set(0, 0.55, 0.4);
    packGroup.add(logoMesh2);

    // Top model
    packTop = topModel;
    packTop.position.set(0, 1.1, 0);
    packTop.name = "top";
    packTop.traverse((child) => {
      if (child.isMesh) child.castShadow = true;
    });
    packGroup.add(packTop);

    scene.add(packGroup);
  }

  function onClick(event) {
    if (torn) {
      document.getElementById("three-container").style.display = "none";
      setTimeout(() => {
        opened = true;
      }, 1500);
    }
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([packBody], true);
    if (intersects.length > 0 && !torn) torn = true;
  }

  function animate() {
    animationId = requestAnimationFrame(animate);
    if (torn) {
      packTop.position.y += 0.02;
      packTop.rotation.x -= 0.02;
    }
    renderer.render(scene, camera);
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onMount(() => {
    initPack();
    return () => {
      cancelAnimationFrame(animationId);
      renderer.domElement.removeEventListener("click", onClick);
      window.removeEventListener("resize", onWindowResize);
    };
  });
  function toggle(card) {
    collection.update((c) => {
      const idx = c.findIndex((x) => x.id === card.id);
      if (idx === -1) return [...c, card];
      c.splice(idx, 1);
      return [...c];
    });
  }

  function inCollection(id) {
    return get(collection).some((c) => c.id === id);
  }
</script>

{#if !opened}
  <div id="three-container">
    {#if loading}
      <div class="loader">Loading booster pack...</div>
    {/if}
  </div>
{:else}
  <CardList>
    {#each cards as card}
      <div class="card-holder">
        <Card
          id={card.id}
          name={card.name}
          set={card.set}
          number={card.number}
          types={card.types}
          supertype={card.supertype}
          subtypes={card.subtypes}
          rarity={card.rarity}
          isReverse={card.isReverse}
        />
        <button on:click={() => toggle(card)}>
          {inCollection(card.id) ? "Remove" : "Add"}
        </button>
      </div>
    {/each}
  </CardList>
{/if}

<style>
  #three-container {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }
  .loader {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 255, 255, 0.8);
    padding: 1em 2em;
    border-radius: 8px;
    font-weight: bold;
  }
  .pack {
    width: 150px;
    height: 200px;
    margin: 2em auto;
    background: #c00;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    perspective: 800px;
    cursor: pointer;
    transition: transform 0.5s;
  }
  .pack:hover {
    transform: rotateX(20deg);
  }
  .card-holder {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  button {
    margin-top: 0.5em;
  }
</style>
