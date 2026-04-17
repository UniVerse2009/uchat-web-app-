const fs = require("fs");
const path = require("path");
const simpleGit = require("simple-git");

require('dotenv').config();

const GH_USER = process.env.GH_USER;
const GH_TOKEN = process.env.GH_TOKEN;

if (!GH_USER || !GH_TOKEN) {
	throw new Error("GH_USER or GH_TOKEN not set");
}

const TARGET_REDIRECT = process.argv[2];

if (!TARGET_REDIRECT) {
	throw new Error("Usage: node file.js https://target.com");
}

const REPO_URL = `https://${GH_USER}:${GH_TOKEN}@github.com/UniVerse2009/chat_splash_screen.git`;
const LOCAL_DIR = path.join(__dirname, "splash");
const TARGET_FILE = "index.html";

async function run() {
	const git = simpleGit();

	if (!fs.existsSync(LOCAL_DIR)) {
		await git.clone(REPO_URL, LOCAL_DIR);
	}

	const repo = simpleGit(LOCAL_DIR);

	await repo.pull();

	const filePath = path.join(LOCAL_DIR, TARGET_FILE);

	if (!fs.existsSync(filePath)) {
		throw new Error("HTML file not found");
	}

	let html = fs.readFileSync(filePath, "utf8");

	const before = html;

	html = html.replace(
		/const\s+TARGET_REDIRECT\s*=\s*["'][^"']*["'];?/,
		`const TARGET_REDIRECT = "${TARGET_REDIRECT}";`
	);

	if (html === before) {
		throw new Error("TARGET_REDIRECT not found in HTML");
	}

	fs.writeFileSync(filePath, html);

	await repo.add(TARGET_FILE);
	await repo.commit(`Update redirect to ${TARGET_REDIRECT}`);
	await repo.push();

	console.log("Redirect updated and pushed.");
}

run().catch(console.error);
