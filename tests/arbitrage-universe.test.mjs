import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { SimulatedUniverseSource } from "../app/lib/arbitrageUniverseSource.ts";
import { universeStatusAtMultiplier } from "../app/lib/arbitrageUniverseStatus.ts";
import {
  syncArbitrageUniverse,
  universeCoreFingerprint,
  validateArbitrageUniverse,
  validateUniverseEngineCommitPin,
  validateUniverseRemoteSourceUrl,
} from "../scripts/sync-arbitrage-universe.mjs";

const fixtureUrl = new URL("../public/data/arbitrage-universe.v1.json", import.meta.url);
const sourceUrl = new URL("../app/lib/arbitrageUniverseSource.ts", import.meta.url);

async function fixture() {
  return JSON.parse(await readFile(fixtureUrl, "utf8"));
}

class FakeScheduler {
  nextId = 1;
  callbacks = new Map();

  setInterval(callback, intervalMs) {
    assert.equal(intervalMs, 1000);
    const id = this.nextId;
    this.nextId += 1;
    this.callbacks.set(id, callback);
    return id;
  }

  clearInterval(id) {
    this.callbacks.delete(id);
  }

  tick() {
    for (const callback of [...this.callbacks.values()]) callback();
  }

  get activeCount() {
    return this.callbacks.size;
  }
}

test("validates the committed universe artifact and authenticated fingerprint", async () => {
  const universe = await fixture();
  const result = validateArbitrageUniverse(universe);

  assert.equal(result.marketCount, universe.summary.marketCount);
  assert.equal(result.assetCount, universe.summary.assetCount);
  assert.equal(result.triangleSetCount, universe.summary.triangleSetCount);
  assert.equal(result.routeCount, universe.summary.routeCount);
  assert.equal(result.frameCount, 60);
  assert.equal(result.fingerprint, universe.provenance.coreFingerprint);
  assert.equal(universeCoreFingerprint(universe), universe.provenance.coreFingerprint);

  const generatedAtOnly = structuredClone(universe);
  generatedAtOnly.provenance.generatedAt = "2026-08-02T00:00:00.000Z";
  assert.equal(universeCoreFingerprint(generatedAtOnly), universe.provenance.coreFingerprint);
  assert.doesNotThrow(() => validateArbitrageUniverse(generatedAtOnly));
});

test("contains both directions and every amount × fee combination for every triangle", async () => {
  const universe = await fixture();
  const routeById = new Map(universe.routeDetails.routes.map((route) => [route.id, route]));
  const bookById = new Map(universe.routeDetails.marketBooks.map((book) => [book.id, book]));

  assert.equal(universe.routeDetails.routes.length, universe.triangleSets.length * 2);
  for (const triangle of universe.triangleSets) {
    const routes = triangle.routeIds.map((routeId) => routeById.get(routeId));
    assert.deepEqual(routes.map((route) => route?.direction), ["forward", "reverse"]);

    for (const route of routes) {
      assert.ok(route);
      assert.equal(route.bookIds.length, 3);
      route.bookIds.forEach((bookId) => {
        const book = bookById.get(bookId);
        assert.ok(book, `missing market book ${bookId}`);
        assert.equal(book.bids.length, 5);
        assert.equal(book.asks.length, 5);
      });

      const expectedKeys = new Set(
        route.startAmounts.flatMap((amount) => universe.summary.feeBps.map((fee) => `${amount}|${fee}`)),
      );
      const actualKeys = new Set(route.feeRows.map((row) => `${row.startAmount}|${row.feeBps}`));
      assert.deepEqual(actualKeys, expectedKeys, `incomplete fee matrix for ${route.id}`);
      assert.equal(route.feeRows.length, 9);
    }
  }

  assert.equal(universe.frames.length, 60);
  universe.frames.forEach((frame, index) => {
    assert.equal(frame.streamId, universe.frames[0].streamId);
    assert.equal(frame.sequence, index + 1);
    assert.equal(frame.demoTime, frame.at);
    assert.equal(frame.marketDataTime, frame.at);
    assert.equal(frame.index, index);
    assert.equal(frame.offsetMs, index * 1000);
    assert.equal(frame.routeValues.length, universe.routeDetails.routes.length);
    assert.ok(frame.routeValues.every((value) => value.length === 5));
  });
});

test("derives eligible and profitable display state at the selected fee multiplier", async () => {
  const universe = await fixture();
  const frame = universe.frames[0];
  const profitableAtFiveButNotTen = frame.routeValues.find(
    (value) => value[4] === 1 && value[1] > 1 && value[2] <= 1,
  );
  const eligibleAtFiveButProfitableAtZero = frame.routeValues.find(
    (value) => value[4] === 0 && value[1] <= 1 && value[0] > 1,
  );
  const stale = frame.routeValues.find((value) => value[4] === 2);

  assert.ok(profitableAtFiveButNotTen);
  assert.ok(eligibleAtFiveButProfitableAtZero);
  assert.ok(stale);
  assert.equal(universeStatusAtMultiplier(universe, profitableAtFiveButNotTen[4], profitableAtFiveButNotTen[1]).key, "profitable");
  assert.equal(universeStatusAtMultiplier(universe, profitableAtFiveButNotTen[4], profitableAtFiveButNotTen[2]).key, "eligible");
  assert.equal(universeStatusAtMultiplier(universe, eligibleAtFiveButProfitableAtZero[4], eligibleAtFiveButProfitableAtZero[0]).key, "profitable");
  assert.equal(universeStatusAtMultiplier(universe, stale[4], 1.25).key, "stale");
});

test("strict validation rejects missing columns, combinations, secrets, and unauthenticated changes", async () => {
  const universe = await fixture();

  const missingFrameValue = structuredClone(universe);
  missingFrameValue.frames[1].routeValues.pop();
  assert.throws(() => validateArbitrageUniverse(missingFrameValue), /routeValues.*exactly|routeValues.*items/);

  const missingFeeRow = structuredClone(universe);
  missingFeeRow.routeDetails.routes[0].feeRows.pop();
  assert.throws(() => validateArbitrageUniverse(missingFeeRow), /feeRows.*exactly|feeRows.*items/);

  const secretField = structuredClone(universe);
  secretField.authorization = "Bearer not-a-real-token";
  assert.throws(() => validateArbitrageUniverse(secretField), /Forbidden account or credential field|Bearer credential/);

  const alteredValue = structuredClone(universe);
  alteredValue.frames[0].routeValues[0][0] += 0.000001;
  assert.throws(() => validateArbitrageUniverse(alteredValue), /snapshot fee multiplier|Fingerprint mismatch/);
});

test("sync check is non-mutating and remote inputs require both exact pins", async () => {
  const universe = await fixture();
  const checked = await syncArbitrageUniverse([
    "--check",
    "--source",
    fileURLToPath(fixtureUrl),
    "--engine-commit",
    universe.provenance.engineCommit,
  ]);
  assert.equal(checked.checkedOnly, true);

  const artifactCommit = "a".repeat(40);
  const source = `https://raw.githubusercontent.com/Moon-Young-Choi/triangular-arbitrage-detector/${artifactCommit}/artifacts/universe-demo.v1.json`;
  assert.equal(validateUniverseRemoteSourceUrl(source, artifactCommit), source);
  assert.equal(validateUniverseEngineCommitPin(universe.provenance.engineCommit, universe.provenance.engineCommit), universe.provenance.engineCommit);
  assert.throws(() => validateUniverseRemoteSourceUrl(`${source}?download=1`, artifactCommit), /Remote source must be exactly/);
  assert.throws(() => validateUniverseRemoteSourceUrl(source.replace("raw.githubusercontent.com", "example.com"), artifactCommit), /Remote source must be exactly/);
  assert.throws(() => validateUniverseEngineCommitPin("0".repeat(40), universe.provenance.engineCommit), /must match/);
});

test("simulated source advances deterministically at 1 Hz and emits state transitions once", async () => {
  const universe = await fixture();
  const scheduler = new FakeScheduler();
  const source = new SimulatedUniverseSource(universe, { scheduler });
  const snapshots = [];

  assert.deepEqual(await source.load(), {
    universe,
    frame: universe.frames[0],
    frameIndex: 0,
    playing: true,
    connection: {
      source: "simulation",
      state: "SIMULATED",
      streamId: universe.frames[0].streamId,
      sequence: universe.frames[0].sequence,
      serverTime: universe.frames[0].demoTime,
      marketDataTime: universe.frames[0].marketDataTime,
    },
  });

  const unsubscribe = source.subscribe((snapshot) => snapshots.push(snapshot));
  assert.equal(snapshots.length, 1, "subscribe must emit the current frame immediately");
  assert.equal(scheduler.activeCount, 1);

  scheduler.tick();
  assert.deepEqual([snapshots.at(-1).frameIndex, snapshots.at(-1).playing], [1, true]);
  assert.deepEqual(
    [snapshots.at(-1).connection.state, snapshots.at(-1).connection.sequence],
    ["SIMULATED", universe.frames[1].sequence],
  );

  source.pause();
  assert.deepEqual([snapshots.at(-1).frameIndex, snapshots.at(-1).playing], [1, false]);
  const pausedCount = snapshots.length;
  source.pause();
  scheduler.tick();
  assert.equal(snapshots.length, pausedCount, "paused source must not repeat state or tick emissions");
  assert.equal(scheduler.activeCount, 0);

  source.resume();
  assert.deepEqual([snapshots.at(-1).frameIndex, snapshots.at(-1).playing], [1, true]);
  const resumedCount = snapshots.length;
  source.resume();
  assert.equal(snapshots.length, resumedCount, "resume must emit only on a state change");
  scheduler.tick();
  assert.equal(snapshots.at(-1).frameIndex, 2);

  unsubscribe();
  assert.equal(scheduler.activeCount, 0);
  source.close();
  await assert.rejects(source.load(), /closed/);
  assert.throws(() => source.subscribe(() => {}), /closed/);
});

test("two simulated sources replay identical frames and wrap without consulting motion preferences", async () => {
  const universe = await fixture();
  const schedulerA = new FakeScheduler();
  const schedulerB = new FakeScheduler();
  const sourceA = new SimulatedUniverseSource(universe, { scheduler: schedulerA, initialFrameIndex: 59 });
  const sourceB = new SimulatedUniverseSource(universe, { scheduler: schedulerB, initialFrameIndex: 59 });
  const seenA = [];
  const seenB = [];
  sourceA.subscribe((snapshot) => seenA.push(snapshot));
  sourceB.subscribe((snapshot) => seenB.push(snapshot));

  schedulerA.tick();
  schedulerB.tick();
  assert.equal(seenA.at(-1).frameIndex, 0);
  assert.equal(seenB.at(-1).frameIndex, 0);
  assert.deepEqual(seenA.at(-1).frame.routeValues, seenB.at(-1).frame.routeValues);

  const sourceText = await readFile(sourceUrl, "utf8");
  assert.doesNotMatch(sourceText, /matchMedia|prefers-reduced-motion/u);
  sourceA.close();
  sourceB.close();
});
