import { describe, expect, it, vi } from "vitest";
import { createAudioAdapter } from "@/audio/audioAdapter";

function fakeAudio() {
  const listeners = new Map<string, EventListener>();
  const audio = {
    src: "",
    volume: 1,
    currentTime: 0,
    duration: Number.NaN,
    paused: true,
    play: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    pause: vi.fn(),
    addEventListener: vi.fn((event: string, listener: EventListener) =>
      listeners.set(event, listener),
    ),
    removeEventListener: vi.fn((event: string, listener: EventListener) => {
      if (listeners.get(event) === listener) listeners.delete(event);
    }),
  };
  return {
    audio,
    emit: (event: string) => listeners.get(event)?.(new Event(event)),
  };
}

describe("audio adapter", () => {
  it("delegates src, volume, play resolve/reject, and pause", async () => {
    const fixture = fakeAudio();
    const adapter = createAudioAdapter(fixture.audio);
    adapter.src = "https://example.com/song.mp3";
    adapter.volume = 0.4;
    expect(adapter.src).toBe(fixture.audio.src);
    expect(adapter.volume).toBe(0.4);
    await expect(adapter.play()).resolves.toBeUndefined();
    adapter.pause();
    expect(fixture.audio.pause).toHaveBeenCalledOnce();
    const failure = new Error("blocked");
    fixture.audio.play.mockRejectedValueOnce(failure);
    await expect(adapter.play()).rejects.toBe(failure);
  });

  it("subscribes to ended and error, and unsubscribes exact handlers", () => {
    const fixture = fakeAudio();
    const adapter = createAudioAdapter(fixture.audio);
    const ended = vi.fn();
    const error = vi.fn();
    const offEnded = adapter.on("ended", ended);
    const offError = adapter.on("error", error);
    fixture.emit("ended");
    fixture.emit("error");
    expect(ended).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledOnce();
    offEnded();
    offError();
    fixture.emit("ended");
    fixture.emit("error");
    expect(ended).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledOnce();
    expect(fixture.audio.removeEventListener).toHaveBeenCalledTimes(2);
  });

  it("delegates currentTime, duration, timeupdate and durationchange", () => {
    const fixture = fakeAudio();
    fixture.audio.duration = 200;
    fixture.audio.currentTime = 10;
    const adapter = createAudioAdapter(fixture.audio);
    const time = vi.fn();
    const duration = vi.fn();
    adapter.on("timeupdate", time);
    adapter.on("durationchange", duration);
    adapter.currentTime = 40;
    expect(adapter.duration).toBe(200);
    expect(fixture.audio.currentTime).toBe(40);
    fixture.emit("timeupdate");
    fixture.emit("durationchange");
    expect(time).toHaveBeenCalledOnce();
    expect(duration).toHaveBeenCalledOnce();
  });
});
