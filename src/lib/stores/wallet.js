import { writable } from 'svelte/store';

const stored = localStorage.getItem('wallet');
const initial = stored ? parseFloat(stored) : 0;

export const wallet = writable(initial);

wallet.subscribe(value => {
  localStorage.setItem('wallet', value.toString());
});
