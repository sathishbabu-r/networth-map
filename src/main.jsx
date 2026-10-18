import { loadEntry } from "./route-entry.mjs";
loadEntry(window.location.pathname).then(entry => entry.mount());
