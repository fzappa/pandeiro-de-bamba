import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { beep, playSyntheticStrokeSound } from "../src/lib/audio/engine.ts";
import { STROKES } from "../src/lib/types.ts";

class MockGainNode {
  gain = {
    setValueAtTime() {},
    exponentialRampToValueAtTime() {},
  };
  connect() {}
}

class MockOscillator {
  frequency = { value: 0, setValueAtTime() {} };
  type = "sine";
  connect() {}
  start() {}
  stop() {}
}

class MockBiquadFilter {
  type = "lowpass";
  frequency = { setValueAtTime() {} };
  connect() {}
}

class MockBufferSource {
  buffer = null;
  connect() {}
  start() {}
  stop() {}
}

class MockAudioContext {
  sampleRate = 48_000;
  destination = {};
  currentTime = 0;
  createOscillator() {
    return new MockOscillator();
  }
  createGain() {
    return new MockGainNode();
  }
  createBiquadFilter() {
    return new MockBiquadFilter();
  }
  createBuffer() {
    return {
      getChannelData() {
        return new Float32Array(8);
      },
    };
  }
  createBufferSource() {
    return new MockBufferSource();
  }
}

describe("audio engine", () => {
  test("beep schedules nodes without throwing", () => {
    const ctx = new MockAudioContext();
    assert.doesNotThrow(() => beep(ctx, 0, 440, 0.05));
  });

  test("playSyntheticStrokeSound covers every stroke type", () => {
    const ctx = new MockAudioContext();
    for (const stroke of Object.keys(STROKES)) {
      assert.doesNotThrow(() =>
        playSyntheticStrokeSound(ctx, stroke, 0, true, false),
      );
    }
  });

  test("accent flag does not break synthesis", () => {
    const ctx = new MockAudioContext();
    assert.doesNotThrow(() =>
      playSyntheticStrokeSound(ctx, "P", 0, false, true),
    );
  });
});
