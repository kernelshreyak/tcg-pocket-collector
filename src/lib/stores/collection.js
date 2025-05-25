import { writable } from 'svelte/store';

const stored = localStorage.getItem('collection');
const initial = stored ? JSON.parse(stored) : [];

export const collection = writable(initial);

collection.subscribe(value => {
  localStorage.setItem('collection', JSON.stringify(value));
});

export function hasCard(id) {
  let exists = false;
  collection.update(items => {
    exists = items.some(c => c.id === id);
    return items;
  });
  return exists;
}
