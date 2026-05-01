/**
 * FBL NPC Generator
 *
 * Builds a Forbidden Lands NPC actor from the typical NPCs and personal
 * quirks tables (GM Guide p.184-187) plus a kin-appropriate name from the
 * Players Handbook kin sections (p.17-23).
 *
 * Quirks: Per the book, Personal Quirks is a D66 table with three columns
 * (Occupation, Characteristic, Quirk). The book's flavor — and how groups
 * actually use it — is to roll each column INDEPENDENTLY rather than taking
 * the row that comes up. We honor that here.
 *
 * Hosting: This module docks onto fbl-core-game's adventure-site button
 * via the renderJournalDirectory hook, so the requirements list points at
 * fbl-core-game.
 */

const MODULE_ID = "fbl-npc-generator";

let CACHED_TYPICAL = null;
let CACHED_QUIRKS = null;
let CACHED_KIN = null;

async function loadJSON(rel) {
	const url = `modules/${MODULE_ID}/${rel}`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
	return res.json();
}

async function getTables() {
	if (!CACHED_TYPICAL) CACHED_TYPICAL = await loadJSON("manifests/typical-npcs.json");
	if (!CACHED_QUIRKS) CACHED_QUIRKS = await loadJSON("manifests/personal-quirks.json");
	if (!CACHED_KIN) CACHED_KIN = await loadJSON("manifests/kin-names.json");
	return { typical: CACHED_TYPICAL, quirks: CACHED_QUIRKS, kin: CACHED_KIN };
}

function d(n) {
	return Math.floor(Math.random() * n) + 1;
}

function d66() {
	// Returns a string "11".."66"
	return `${d(6)}${d(6)}`;
}

function pick(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Roll three independent D66 rolls — one per column. Per the book, the
 * Personal Quirks table is intentionally combinatorial (216 occupation × 36
 * characteristic × 36 quirk variations are possible).
 */
function rollQuirks(quirks) {
	const occRoll = d66();
	const charRoll = d66();
	const quirkRoll = d66();
	return {
		occupation: { roll: occRoll, value: quirks.occupation[occRoll] ?? "" },
		characteristic: { roll: charRoll, value: quirks.characteristic[charRoll] ?? "" },
		quirk: { roll: quirkRoll, value: quirks.quirk[quirkRoll] ?? "" },
	};
}

function rollName(kinData, sex) {
	const pool = sex === "female" ? kinData.female : kinData.male;
	return pick(pool);
}

/**
 * Build the system data block for a "character" actor with subtype "npc".
 * The FBL system fills missing fields itself — we only provide what the
 * book says.
 */
function buildSystemData(typical, kinData) {
	const attr = typical.attributes ?? {};
	const skl = typical.skills ?? {};
	// Skills in the system template use kebab-case keys for two of them.
	const skillKeyMap = {
		sleight_of_hand: "sleight-of-hand",
		animal_handling: "animal-handling",
	};
	const skill = {};
	for (const [k, v] of Object.entries(skl)) {
		const key = skillKeyMap[k] ?? k;
		skill[key] = { value: v };
	}
	return {
		subtype: { type: "npc" },
		attribute: {
			strength: { value: attr.strength ?? 3, max: attr.strength ?? 3 },
			agility: { value: attr.agility ?? 3, max: attr.agility ?? 3 },
			wits: { value: attr.wits ?? 3, max: attr.wits ?? 3 },
			empathy: { value: attr.empathy ?? 3, max: attr.empathy ?? 3 },
		},
		skill,
		bio: {
			kin: { value: kinData.label },
			profession: { value: typical.label },
		},
	};
}

/**
 * Format a chat-card / actor-bio HTML summary of the rolled NPC.
 */
function buildBioHTML({ kinKey, kinData, sex, typical, quirks, useQuirks, name }) {
	const sexLabel = sex === "female" ? "Female" : "Male";
	const lines = [];
	lines.push(`<h2 style="margin-bottom:4px;">${name}</h2>`);
	lines.push(`<p style="margin:0 0 8px 0;"><i>${sexLabel} ${kinData.label} — ${typical.label}</i></p>`);
	lines.push(`<p style="margin:0 0 4px 0;"><b>Key Attribute:</b> ${kinData.key_attribute}<br/>`);
	lines.push(`<b>Kin Talent:</b> ${kinData.kin_talent}</p>`);

	const attrLine = Object.entries(typical.attributes)
		.map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)} ${v}`)
		.join(", ");
	lines.push(`<p style="margin:0 0 4px 0;"><b>Attributes:</b> ${attrLine}</p>`);

	const skillLine = Object.entries(typical.skills)
		.map(([k, v]) => `${k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())} ${v}`)
		.join(", ");
	lines.push(`<p style="margin:0 0 4px 0;"><b>Skills:</b> ${skillLine}</p>`);

	lines.push(`<p style="margin:0 0 8px 0;"><b>Equipment:</b> ${typical.equipment}</p>`);

	if (useQuirks) {
		lines.push(`<hr/>`);
		lines.push(`<h3 style="margin:8px 0 4px 0;">Personal Quirks</h3>`);
		lines.push(`<table style="width:100%;border-collapse:collapse;">`);
		lines.push(`<tbody>`);
		lines.push(`<tr><td style="width:120px;"><b>Occupation</b><br/><i style="opacity:0.6;">D66 ${quirks.occupation.roll}</i></td><td>${quirks.occupation.value}</td></tr>`);
		lines.push(`<tr><td><b>Characteristic</b><br/><i style="opacity:0.6;">D66 ${quirks.characteristic.roll}</i></td><td>${quirks.characteristic.value}</td></tr>`);
		lines.push(`<tr><td><b>Quirk</b><br/><i style="opacity:0.6;">D66 ${quirks.quirk.roll}</i></td><td>${quirks.quirk.value}</td></tr>`);
		lines.push(`</tbody></table>`);
	}

	return lines.join("\n");
}

/**
 * Open the create-NPC dialog. Returns the form values, or null if cancelled.
 */
async function openDialog(tables) {
	const kinOptions = [
		`<option value="random">Random</option>`,
		...Object.entries(tables.kin).map(([key, data]) => `<option value="${key}">${data.label}</option>`),
	].join("");

	const sexOptions = [
		`<option value="random">Random</option>`,
		`<option value="female">Female</option>`,
		`<option value="male">Male</option>`,
	].join("");

	const typeOptions = [
		`<option value="random">Random</option>`,
		...Object.entries(tables.typical).map(([key, data]) => `<option value="${key}">${data.label}</option>`),
	].join("");

	const content = `
		<form class="fbl-npc-generator-form" style="margin-block:12px;">
			<p style="margin-bottom:8px;">Roll up an NPC. Each dropdown can stay on <i>Random</i>.</p>
			<div class="form-group">
				<label>Kin</label>
				<select name="kin">${kinOptions}</select>
			</div>
			<div class="form-group">
				<label>Sex</label>
				<select name="sex">${sexOptions}</select>
			</div>
			<div class="form-group">
				<label>NPC Type</label>
				<select name="type">${typeOptions}</select>
			</div>
			<div class="form-group">
				<label>Personal Quirks</label>
				<div class="form-fields" style="justify-content:flex-start;">
					<input type="checkbox" name="quirks" checked />
					<span style="margin-left:6px;opacity:0.7;">Roll three independent D66s (occupation, characteristic, quirk).</span>
				</div>
			</div>
			<div class="form-group">
				<label>Open Sheet After Creation</label>
				<div class="form-fields" style="justify-content:flex-start;">
					<input type="checkbox" name="openSheet" checked />
				</div>
			</div>
		</form>
	`;

	return Dialog.wait({
		title: "Generate NPC",
		content,
		buttons: {
			ok: {
				icon: '<i class="fas fa-dice-d6"></i>',
				label: "Roll",
				callback: jq => {
					const form = jq.find("form")[0];
					return {
						kin: form.kin.value,
						sex: form.sex.value,
						type: form.type.value,
						useQuirks: form.quirks.checked,
						openSheet: form.openSheet.checked,
					};
				},
			},
			cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancel", callback: () => null },
		},
		default: "ok",
		close: () => null,
	}).catch(() => null);
}

/**
 * Public entry point: opens the dialog, rolls an NPC, creates the actor.
 */
export async function generateNPC() {
	if (!game.user.isGM) {
		ui.notifications?.warn("Only the GM can generate NPCs.");
		return;
	}

	let tables;
	try {
		tables = await getTables();
	} catch (err) {
		ui.notifications?.error(`Could not load NPC generator data: ${err.message}`);
		return;
	}

	const choice = await openDialog(tables);
	if (!choice) return;

	const kinKeys = Object.keys(tables.kin);
	const typeKeys = Object.keys(tables.typical);

	const kinKey = choice.kin === "random" ? pick(kinKeys) : choice.kin;
	const typeKey = choice.type === "random" ? pick(typeKeys) : choice.type;
	const sex = choice.sex === "random" ? (Math.random() < 0.5 ? "female" : "male") : choice.sex;

	const kinData = tables.kin[kinKey];
	const typical = tables.typical[typeKey];

	const name = rollName(kinData, sex);
	const quirks = choice.useQuirks ? rollQuirks(tables.quirks) : null;

	const systemData = buildSystemData(typical, kinData);
	const bioHTML = buildBioHTML({ kinKey, kinData, sex, typical, quirks, useQuirks: choice.useQuirks, name });
	systemData.bio.note = { value: bioHTML };

	const actorData = {
		name,
		type: "character",
		system: systemData,
		prototypeToken: {
			actorLink: false,
			disposition: 0,
		},
	};

	const actor = await Actor.create(actorData);
	if (!actor) return;

	if (choice.openSheet) actor.sheet.render(true);

	const summary = `<div class="forbidden-lands chat-item">${bioHTML}</div>`;
	ChatMessage.create({
		content: summary,
		whisper: [game.user.id],
		speaker: { alias: "NPC Generator" },
	});

	return actor;
}
