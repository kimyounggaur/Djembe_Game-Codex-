import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const chromePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const targetUrl = process.env.TARGET_URL || "http://127.0.0.1:4173/";
const debugPort = Number(process.env.DEBUG_PORT || 9223);
const viewportWidth = Number(process.env.VIEWPORT_WIDTH || 800);
const viewportHeight = Number(process.env.VIEWPORT_HEIGHT || 600);
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "djembe-chrome-"));

if (!fs.existsSync(chromePath)) {
  console.error(`Chrome executable not found: ${chromePath}`);
  process.exit(1);
}

const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  "--autoplay-policy=no-user-gesture-required",
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${userDataDir}`,
  "about:blank",
], { stdio: ["ignore", "pipe", "pipe"] });

const cleanup = () => {
  try { chrome.kill(); } catch (_) {}
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
};
process.on("exit", cleanup);

async function waitForJson(url, timeoutMs = 6000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch (_) {}
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

const tabs = await waitForJson(`http://127.0.0.1:${debugPort}/json/list`);
const page = tabs.find((tab) => tab.type === "page") || tabs[0];
if (!page?.webSocketDebuggerUrl) throw new Error("No debuggable Chrome page found");

const ws = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
const eventWaiters = new Map();
const errors = [];
let seq = 0;

ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(`${message.error.message}: ${message.error.data || ""}`));
    else resolve(message.result);
    return;
  }
  if (message.method === "Runtime.exceptionThrown") {
    errors.push(`Runtime exception: ${message.params.exceptionDetails?.text || "unknown"}`);
  }
  if (message.method === "Log.entryAdded" && message.params.entry?.level === "error") {
    errors.push(`Log error: ${message.params.entry.text}`);
  }
  if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
    const text = message.params.args?.map((arg) => arg.value || arg.description || "").join(" ");
    errors.push(`Console error: ${text}`);
  }
  const waiters = eventWaiters.get(message.method);
  if (waiters?.length) waiters.shift()(message.params);
});

await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve, { once: true });
  ws.addEventListener("error", reject, { once: true });
});

function send(method, params = {}) {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

function waitEvent(method, timeoutMs = 6000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${method}`)), timeoutMs);
    const list = eventWaiters.get(method) || [];
    list.push((params) => {
      clearTimeout(timer);
      resolve(params);
    });
    eventWaiters.set(method, list);
  });
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function waitForExpression(expression, timeoutMs = 7000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const value = await evaluate(expression);
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  throw new Error(`Timed out waiting for expression: ${expression}`);
}

await send("Page.enable");
await send("Runtime.enable");
await send("Log.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: viewportWidth,
  height: viewportHeight,
  deviceScaleFactor: viewportWidth <= 480 ? 3 : 1,
  mobile: viewportWidth <= 480,
});
await send("Page.navigate", { url: targetUrl });
await waitEvent("Page.loadEventFired", 8000);

await waitForExpression("window.__DJEMBE_GAME__ && window.__DJEMBE_GAME__.stateManager.state === 'ready'", 10000);
const readyState = await evaluate(`({
  title: document.title,
  canvas: !!document.getElementById('gameCanvas'),
  readyActive: document.getElementById('readyScreen').classList.contains('active'),
  state: window.__DJEMBE_GAME__.stateManager.state
})`);

const rect = await evaluate(`(() => {
  const r = document.getElementById('startButton').getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
})()`);

await send("Input.dispatchMouseEvent", {
  type: "mousePressed",
  x: rect.x + rect.width / 2,
  y: rect.y + rect.height / 2,
  button: "left",
  clickCount: 1,
});
await send("Input.dispatchMouseEvent", {
  type: "mouseReleased",
  x: rect.x + rect.width / 2,
  y: rect.y + rect.height / 2,
  button: "left",
  clickCount: 1,
});

await waitForExpression("window.__DJEMBE_GAME__.stateManager.state === 'rhythmSelect' && document.getElementById('rhythmSelectScreen').classList.contains('active')", 5000);
const rhythmState = await evaluate(`({
  state: window.__DJEMBE_GAME__.stateManager.state,
  visible: document.getElementById('rhythmSelectScreen').classList.contains('active'),
  cardCount: document.querySelectorAll('[data-rhythm-id]').length,
  selected: window.__DJEMBE_GAME__.selectedRhythmId,
  layout: (() => {
    const detail = document.getElementById('rhythmDetail').getBoundingClientRect();
    const firstCard = document.querySelector('[data-rhythm-id]').getBoundingClientRect();
    const list = document.getElementById('rhythmCardList').getBoundingClientRect();
    return {
      detailTop: Math.round(detail.top),
      firstCardTop: Math.round(firstCard.top),
      detailWidth: Math.round(detail.width),
      cardWidth: Math.round(firstCard.width),
      listWidth: Math.round(list.width)
    };
  })()
})`);

const previewRect = await evaluate(`(() => {
  const el = document.getElementById('previewButton');
  el.scrollIntoView({ block: 'center', inline: 'center' });
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
})()`);
await evaluate("document.getElementById('previewButton').click(); true");
await evaluate("new Promise((resolve) => setTimeout(resolve, 800))");
await waitForExpression("window.__DJEMBE_GAME__.rhythmPreviewPlayer.isPlaying()", 15000);

const startSelectedRect = await evaluate(`(() => {
  const el = document.getElementById('selectedStartButton');
  el.scrollIntoView({ block: 'center', inline: 'center' });
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
})()`);
await evaluate("document.getElementById('selectedStartButton').click(); true");
await waitForExpression("!window.__DJEMBE_GAME__.rhythmPreviewPlayer.isPlaying()", 3000);
await waitForExpression("window.__DJEMBE_GAME__.stateManager.state === 'playing'", 12000);

await send("Input.dispatchKeyEvent", { type: "keyDown", key: "d", code: "KeyD", windowsVirtualKeyCode: 68, nativeVirtualKeyCode: 68 });
await send("Input.dispatchKeyEvent", { type: "keyUp", key: "d", code: "KeyD", windowsVirtualKeyCode: 68, nativeVirtualKeyCode: 68 });
await send("Input.dispatchKeyEvent", { type: "keyDown", key: " ", code: "Space", windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32 });
await send("Input.dispatchKeyEvent", { type: "keyUp", key: " ", code: "Space", windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32 });
await send("Input.dispatchKeyEvent", { type: "keyDown", key: "k", code: "KeyK", windowsVirtualKeyCode: 75, nativeVirtualKeyCode: 75 });
await send("Input.dispatchKeyEvent", { type: "keyUp", key: "k", code: "KeyK", windowsVirtualKeyCode: 75, nativeVirtualKeyCode: 75 });

await evaluate("new Promise((resolve) => setTimeout(resolve, 250))");
const playState = await evaluate(`({
  state: window.__DJEMBE_GAME__.stateManager.state,
  audioState: window.__DJEMBE_GAME__.audio.ctx?.state || 'none',
  chartTitle: window.__DJEMBE_GAME__.currentChart?.title,
  floatingTexts: window.__DJEMBE_GAME__.floatingTexts.length,
  canvasPixels: (() => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data;
    return Array.from(data);
  })()
})`);

await evaluate("window.__DJEMBE_GAME__.finishGame(); true");
await waitForExpression("window.__DJEMBE_GAME__.stateManager.state === 'result'", 5000);
const resultState = await evaluate(`({
  state: window.__DJEMBE_GAME__.stateManager.state,
  rhythmInfo: document.getElementById('resultRhythmInfo').textContent,
  recommendation: document.getElementById('resultRecommendation').textContent,
  progress: JSON.parse(localStorage.getItem('djembeRhythmGame.progress.v1') || '{}')
})`);

const selectRect = await evaluate(`(() => {
  const el = document.getElementById('selectRhythmButton');
  el.scrollIntoView({ block: 'center', inline: 'center' });
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
})()`);
await evaluate("document.getElementById('selectRhythmButton').click(); true");
await waitForExpression("window.__DJEMBE_GAME__.stateManager.state === 'rhythmSelect'", 5000);

await evaluate("document.getElementById('selectedPracticeButton').click(); true");
await waitForExpression("window.__DJEMBE_GAME__.stateManager.state === 'playing'", 12000);
await evaluate("window.__DJEMBE_GAME__.finishGame(); true");
await waitForExpression("window.__DJEMBE_GAME__.stateManager.state === 'result'", 5000);
const practiceResultState = await evaluate(`({
  rhythmInfo: document.getElementById('resultRhythmInfo').textContent,
  recommendation: document.getElementById('resultRecommendation').textContent,
  progress: JSON.parse(localStorage.getItem('djembeRhythmGame.progress.v1') || '{}')
})`);

ws.close();
cleanup();

console.log(JSON.stringify({ readyState, rhythmState, playState, resultState, practiceResultState, errors }, null, 2));

if (!readyState.canvas || !readyState.readyActive || readyState.state !== "ready") {
  throw new Error("Ready screen did not initialize correctly");
}
if (!rhythmState.visible || rhythmState.cardCount < 12) {
  throw new Error("Rhythm selection screen did not show the rhythm library");
}
if (rhythmState.layout.detailTop > rhythmState.layout.firstCardTop || rhythmState.layout.cardWidth < 300 || rhythmState.layout.detailWidth < 300) {
  throw new Error(`Rhythm selection layout is too cramped: ${JSON.stringify(rhythmState.layout)}`);
}
if (playState.state !== "playing") {
  throw new Error("Game did not reach playing state after countdown");
}
if (!["running", "none"].includes(playState.audioState)) {
  throw new Error(`Unexpected audio state: ${playState.audioState}`);
}
if (playState.canvasPixels[3] === 0) {
  throw new Error("Canvas appears blank at center pixel");
}
if (resultState.state !== "result" || !resultState.rhythmInfo.includes("기본 박자")) {
  throw new Error("Result screen did not include the selected rhythm");
}
if (!resultState.progress.records?.intro_basic_pulse) {
  throw new Error("Normal mode result was not saved to rhythm progress");
}
if (!practiceResultState.rhythmInfo.includes("연습 모드")) {
  throw new Error("Practice result did not show practice mode");
}
if (practiceResultState.progress.records?.intro_basic_pulse?.plays !== resultState.progress.records?.intro_basic_pulse?.plays) {
  throw new Error("Practice mode result should not increment best-record plays");
}
if (errors.length) {
  throw new Error(`Browser console/runtime errors detected:\n${errors.join("\n")}`);
}
