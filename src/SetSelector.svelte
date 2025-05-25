<script>
  import { onMount, createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
  export let selected = "";
  let sets = [];
  onMount(async () => {
    const res = await fetch("/data/sets.json");
    const data = await res.json();
    sets = data.data || data;
    // @ts-ignore
    sets.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    if (!selected && sets.length) {
      selected = sets[0].id;
      dispatch("change", { id: selected });
    }
  });
</script>

<select
  bind:value={selected}
  on:change={() => dispatch("change", { id: selected })}
>
  {#each sets as set}
    <option value={set.id}>{set.name}</option>
  {/each}
</select>

<style>
  select {
    font-size: 1rem;
    padding: 0.5em;
    margin: 1em 0;
  }
</style>
