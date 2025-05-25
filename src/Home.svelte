<script>
  import SetSelector from './SetSelector.svelte';
  import PackOpener from './PackOpener.svelte';

  let setId = '';
</script>

<SetSelector bind:selected={setId} on:change={(e)=>setId = e.detail.id} />
{#if setId}
  <PackOpener {setId} size={5} />
{/if}
