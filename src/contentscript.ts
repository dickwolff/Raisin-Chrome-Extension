import { RaisinAddon } from "./addon";

window.onload = () => {

    let ra = new RaisinAddon();
    ra.initialize();

    console.log("Raisin add-on loaded!");
}
