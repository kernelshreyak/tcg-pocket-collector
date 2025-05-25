<script>
  import CardList from "./Cards.svelte";
  import Card from "./lib/components/CardProxy.svelte";
  import { collection } from "./lib/stores/collection.js";
  import { wallet } from "./lib/stores/wallet.js";

  async function sell(card) {
    try {
      const res = await fetch(`https://api.pokemontcg.io/v2/cards/${card.id}`);
      const data = await res.json();
      let price = 0;
      if (data.data && data.data.tcgplayer && data.data.tcgplayer.prices) {
        const prices = data.data.tcgplayer.prices;
        const key = Object.keys(prices)[0];
        price = prices[key].market || 0;
      }
      wallet.update((w) => w + price);
    } catch (e) {}
    collection.update((c) => c.filter((x) => x.id !== card.id));
  }
</script>

<h3>Wallet: ${$wallet.toFixed(2)}</h3>
<CardList>
  {#each $collection as card}
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
      <button on:click={() => sell(card)}>Sell</button>
    </div>
  {/each}
</CardList>

<style>
  .card-holder {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  button {
    margin-top: 0.5em;
  }
</style>
