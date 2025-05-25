<script>
  import { onMount } from "svelte";
  import Card from "./lib/components/CardProxy.svelte";
  import CardList from "./Cards.svelte";
  import { collection } from "./lib/stores/collection.js";
  import { get } from "svelte/store";
  import pokemon from "pokemontcgsdk";

  export let setId = "";
  export let size = 5;

  let cards = [];
  let opened = false;

  $: if (setId) loadPack();

  async function loadPack() {
    console.log("Loading pack for set:", setId);
    const res = await pokemon.card.where({
      q: `(set.id:${setId} supertype:Pokémon)`,
      select: `id,name,number,supertype,subtypes,rarity,images,types,set`,
      orderBy: `-set.releaseDate,-number`,
      pageSize: 36,
    });
    console.log("Loaded pack for set:", setId);
    const filtered = res.data;
    cards = [];
    for (let i = 0; i < size && filtered.length; i++) {
      const rand = Math.floor(Math.random() * filtered.length);
      cards.push(filtered[rand]);
    }
    console.log(cards);
    opened = false;
  }

  function openPack() {
    opened = true;
  }

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
  <div
    class="pack"
    on:keydown={() => {}}
    on:keyup={() => {}}
    on:click={openPack}
  >
    Tap to open pack
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
