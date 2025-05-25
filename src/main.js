import App from "./App.svelte";
const password_env = import.meta.env.VITE_PASSWORD;

const password = prompt("Enter password:");
if (password !== password_env) {
  alert("Incorrect password. Access denied.");
  throw new Error("Unauthorized");
}

const app = new App({
  target: document.getElementById("app"),
});

export default app;
