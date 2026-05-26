import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";

const root = new URL("../", import.meta.url);
const indexPath = new URL("index.html", root);
const assetsPath = new URL("assets/", root);

async function readIndex() {
  return readFile(indexPath, "utf8");
}

test("single-file game shell exposes the required modules and manifests", async () => {
  const html = await readIndex();

  assert.match(html, /<canvas[^>]+id="gameCanvas"/);
  assert.match(html, /const\s+ASSETS\s*=/);
  assert.match(html, /const\s+CONFIG\s*=/);
  assert.match(html, /const\s+CHARTS\s*=/);

  [
    "AssetLoader",
    "AudioEngine",
    "Game",
    "GameStateManager",
    "InputController",
    "ChartManager",
    "NoteManager",
    "ScoringSystem",
    "ParticleSystem",
    "Renderer",
    "UIManager",
    "CalibrationManager",
  ].forEach((className) => {
    assert.match(html, new RegExp(`class\\s+${className}\\b`));
  });
});

test("assets folder contains the uploaded image and audio files referenced by the manifest", async () => {
  assert.equal(existsSync(assetsPath), true, "assets directory should exist");

  [
    "vertical-shot-drum-white.jpg",
    "Djembe(크몽)[실사].png",
    "젬베 게임 앱 Source.png",
    "젬베_아이콘_크몽__채색_-removebg-preview.png",
    "젬베 게임 앱 Source02-1.png",
    "젬베 게임 앱 Source02-2.png",
    "젬베 게임 앱 Source02-3.png",
    "Djembe-slap.wav",
    "Djembe-Bass.wav",
    "Djembe_Mid.wav",
    "Djembe_hit20.wav",
    "Djembe_slice_sample.wav",
  ].forEach((fileName) => {
    assert.equal(existsSync(new URL(`assets/${encodeURI(fileName)}`, root)), true, fileName);
  });
});

test("chart and input safeguards are implemented in the shipped HTML", async () => {
  const html = await readIndex();

  assert.match(html, /validateChartSpacing\s*\(/);
  assert.match(html, /validateNoOverlappingNotes\s*\(/);
  assert.match(html, /validateLaneIds\s*\(/);
  assert.match(html, /minGlobalGapMs:\s*420/);
  assert.match(html, /minSameLaneGapMs:\s*720/);
  assert.match(html, /approachTimeMs:\s*2600/);
  assert.match(html, /pointerdown/);
  assert.match(html, /preventDefault\(\)/);
  assert.match(html, /localStorage/);
  assert.match(html, /navigator\.vibrate/);
});

test("gameplay does not auto-start a djembe rhythm backing track", async () => {
  const html = await readIndex();

  assert.doesNotMatch(
    html,
    /this\.audio\.startBgm\(/,
    "starting or resuming gameplay should not launch the djembe rhythm loop automatically",
  );
});
