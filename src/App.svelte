<script>
  import Home from './Home.svelte';
  import MyCards from './MyCards.svelte';
  let tab = 'home';
</script>

<main>
  {#if tab === 'home'}
    <Home />
  {:else if tab === 'mycards'}
    <MyCards />
  {/if}
</main>

<nav class="bottom">
  <button on:click={() => tab='home'} class:active={tab==='home'}>Home</button>
  <button on:click={() => tab='mycards'} class:active={tab==='mycards'}>My Cards</button>
</nav>

<style>
main{
  padding-bottom:60px;
}
nav.bottom{
  position:fixed;
  bottom:0;
  left:0;
  right:0;
  display:flex;
  justify-content:space-around;
  background:#222;
  padding:0.5em 0;
}
nav.bottom button{
  color:white;
  background:none;
  border:none;
  font-size:1rem;
}
nav.bottom button.active{
  font-weight:bold;
}
</style>
