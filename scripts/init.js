import { generateNPC } from "./npc-generator.js";

const MODULE_ID = "fbl-npc-generator";
const BUTTON_ID = "create-fbl-npc";

/**
 * Dock our "Generate NPC" button in the Journal directory header, next to
 * the official Adventure Site button (#create-adventure-site) added by
 * fbl-core-game / forbidden-lands system. We hook on renderJournalDirectory
 * because that's the same hook the system itself uses for its button.
 */
Hooks.on("renderJournalDirectory", app => {
	const root = app.element instanceof HTMLElement ? app.element : (app.element?.[0] ?? null);
	if (!root) return;
	const header = root.querySelector(".header-actions");
	if (!header || header.querySelector(`#${BUTTON_ID}`)) return;

	const button = document.createElement("button");
	button.id = BUTTON_ID;
	button.type = "button";
	button.innerHTML = `<i class="fas fa-user-pen"></i> Generate NPC`;
	button.addEventListener("click", () => generateNPC());

	const after = header.querySelector("#create-adventure-site");
	if (after && after.nextSibling) header.insertBefore(button, after.nextSibling);
	else header.appendChild(button);
});

/**
 * Convenience: expose generator on the global namespace so it can also be
 * fired from a macro or chat command.
 */
Hooks.once("ready", () => {
	game.modules.get(MODULE_ID).api = { generateNPC };
});

Hooks.on("chatMessage", (_html, content) => {
	const m = content.match(/^\/npc$/i);
	if (!m) return;
	generateNPC();
	return false;
});
