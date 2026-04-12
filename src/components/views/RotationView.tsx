"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

export default function RotationView() {
  const toy = useStore((s) => s.state.toyRotation);
  const setBinContents = useStore((s) => s.setBinContents);
  const logToyRotation = useStore((s) => s.logToyRotation);
  const config = useStore((s) => s.state.config);

  const active = toy.bins.filter((b) => b.status === "active");
  const inactive = toy.bins.filter((b) => b.status === "inactive");

  const [outBin, setOutBin] = useState<string>(active[0]?.id ?? "");
  const [inBin, setInBin] = useState<string>(inactive[0]?.id ?? "");
  const [donated, setDonated] = useState<string>("");

  const daysSince = toy.lastRotationDate
    ? Math.floor((Date.now() - new Date(toy.lastRotationDate).getTime()) / 86400000)
    : null;
  const overdue =
    daysSince !== null && daysSince > toy.nudgeAfterWeeks * 7;

  return (
    <div className="space-y-3">
      <div className="h2">TOY ROTATION</div>

      <section className="panel space-y-2">
        <div className="text-sm">
          Last rotation:{" "}
          <span className={overdue ? "text-redstone" : "text-yellow-300"}>
            {toy.lastRotationDate
              ? `${daysSince} days ago`
              : "never"}
          </span>
        </div>
        {overdue && (
          <div className="text-sm muted">
            ⚠️ It's been more than {toy.nudgeAfterWeeks} weeks. Time to swap?
          </div>
        )}
        <div className="text-xs muted">
          Rotation interval: every {config.rotationIntervalWeeks} weeks
        </div>
      </section>

      <section className="space-y-2">
        <div className="h3">BINS</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {toy.bins.map((b) => (
            <div
              key={b.id}
              className={`panel ${b.status === "active" ? "" : "opacity-70"}`}
            >
              <div className="flex justify-between items-center">
                <div className="font-pixel text-[10px] text-yellow-300">
                  {b.name.toUpperCase()}
                </div>
                <span className="font-pixel text-[8px]">
                  {b.status === "active" ? "🟢 ACTIVE" : "⚫ STORED"}
                </span>
              </div>
              <textarea
                className="input mt-2"
                rows={2}
                placeholder="What's in this bin?"
                value={b.contents}
                onChange={(e) => setBinContents(b.id, e.target.value)}
              />
              {b.lastSwap && (
                <div className="text-xs muted mt-1">
                  Last swap: {new Date(b.lastSwap).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="panel space-y-2">
        <div className="h3">SWAP A BIN</div>
        <label className="block text-sm">
          OUT (active → stored)
          <select
            className="input mt-1"
            value={outBin}
            onChange={(e) => setOutBin(e.target.value)}
          >
            {active.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          IN (stored → active)
          <select
            className="input mt-1"
            value={inBin}
            onChange={(e) => setInBin(e.target.value)}
          >
            {inactive.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Anything donated?
          <input
            className="input mt-1"
            value={donated}
            onChange={(e) => setDonated(e.target.value)}
            placeholder="optional notes"
          />
        </label>
        <button
          type="button"
          className="block-btn"
          disabled={!outBin || !inBin || outBin === inBin}
          onClick={() => {
            logToyRotation(outBin, inBin, donated || undefined);
            setDonated("");
          }}
        >
          Log Rotation
        </button>
      </section>

      {toy.rotationLog.length > 0 && (
        <section>
          <div className="h3 mb-2">HISTORY</div>
          <div className="space-y-1">
            {toy.rotationLog.map((r) => (
              <div key={r.id} className="panel panel-tight text-sm">
                {new Date(r.date).toLocaleDateString()} —{" "}
                <span className="muted">out</span> {r.outBin}{" "}
                <span className="muted">in</span> {r.inBin}
                {r.donatedItems && (
                  <div className="text-xs muted">donated: {r.donatedItems}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
