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

test("rhythm selection feature exposes the required data, classes, and UI hooks", async () => {
  const html = await readIndex();

  assert.match(html, /RHYTHM_SELECT:\s*"rhythmSelect"/);
  assert.match(html, /const\s+DIFFICULTY_CONFIG\s*=/);
  assert.match(html, /const\s+STORAGE_KEYS\s*=/);
  assert.match(html, /const\s+RHYTHM_LIBRARY_DATA\s*=\s*\[/);

  [
    "RhythmLibrary",
    "ProgressManager",
    "RhythmPreviewPlayer",
    "RhythmSelectUI",
  ].forEach((className) => {
    assert.match(html, new RegExp(`class\\s+${className}\\b`));
  });

  [
    "rhythmSelectScreen",
    "difficultyTabs",
    "rhythmCardList",
    "rhythmDetail",
    "previewPatternCanvas",
    "previewButton",
    "selectedPracticeButton",
    "selectedStartButton",
    "rhythmBackButton",
    "selectRhythmButton",
    "recommendedRhythmButton",
  ].forEach((id) => {
    assert.match(html, new RegExp(`id="${id}"`), `${id} should exist in the HTML`);
  });

  const rhythmIds = [...html.matchAll(/id:\s*"(intro_|beginner_|intermediate_|advanced_)[^"]+"/g)];
  assert.ok(rhythmIds.length >= 12, "at least 12 selectable rhythm definitions should be shipped");
});

test("start flow routes through rhythm selection and supports selected rhythm charts", async () => {
  const html = await readIndex();

  assert.match(html, /this\.elements\.startButton\.addEventListener\("click",\s*\(\)\s*=>\s*game\.openRhythmSelect\(\)\)/);
  assert.doesNotMatch(html, /startButton\.addEventListener\("click",\s*\(\)\s*=>\s*game\.startGame\("tutorial"\)\)/);
  assert.match(html, /loadChartByRhythmId\s*\(/);
  assert.match(html, /startSelectedRhythm\s*\(\s*mode\s*=\s*"normal"/);
  assert.match(html, /currentRhythm/);
  assert.match(html, /currentMode/);
  assert.match(html, /updateBestRecord\s*\(/);
});

test("rhythm selection layout stays readable inside the narrow game frame", async () => {
  const html = await readIndex();

  assert.match(html, /\.rhythm-select\s*\{[\s\S]*?word-break:\s*keep-all/);
  assert.match(html, /\.difficulty-tabs\s*\{[\s\S]*?position:\s*sticky[\s\S]*?z-index:\s*5/);
  assert.match(html, /\.rhythm-layout\s*\{[\s\S]*?margin-top:\s*8px/);
  assert.match(html, /\.rhythm-detail\s*\{[\s\S]*?order:\s*-1[\s\S]*?position:\s*static/);
  assert.match(html, /\.rhythm-card-list\s*\{[\s\S]*?grid-template-columns:\s*1fr/);
  assert.doesNotMatch(
    html,
    /@media\s*\(min-width:\s*760px\)\s*\{[\s\S]*?\.rhythm-layout[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1\.2fr\)\s*minmax\(260px,\s*0\.8fr\)/,
    "desktop viewport rules must not force a two-column rhythm layout inside the 520px game frame",
  );
});

test("ready screen content is lifted toward the top of the portrait frame", async () => {
  const html = await readIndex();

  assert.match(html, /#readyScreen\s*\{[\s\S]*?justify-content:\s*flex-start/);
  assert.match(html, /#readyScreen\s*\{[\s\S]*?padding-top:\s*clamp\(36px,\s*7vh,\s*72px\)/);
  assert.match(html, /#readyScreen\s+\.learn-card\s*\{[\s\S]*?min-height:\s*96px/);
  assert.match(html, /#readyScreen\s+\.button-stack\s*\{[\s\S]*?margin-top:\s*clamp\(12px,\s*2vh,\s*18px\)/);
  assert.match(html, /#readyScreen\s+\.hero-drum\s*\{[\s\S]*?bottom:\s*-12%/);
});
