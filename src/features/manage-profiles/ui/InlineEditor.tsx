import { useEffect, useMemo, useState } from "react";
import { Button, SegmentControl, Switch, Textarea } from "@proxyshard/shardx-ui-kit";
import { Field } from "../../../shared/ui/Field";
import { NumField } from "../../../shared/ui/NumField";
import { Pair } from "../../../shared/ui/Pair";
import { PortList } from "../../../shared/ui/PortList";
import { CSSelect } from "../../../shared/ui/CSSelect";
import { SelectField } from "../../../shared/ui/SelectField";
import { ColorSwatches } from "../../../shared/ui/ColorSwatches";
import { ExtensionPicker } from "./ExtensionPicker";
import { ProxySelect } from "./ProxySelect";
import { HOST_OS } from "../../../shared/lib/utils";
import {
  AUTO_TZ, TIMEZONES, LOCALES,
  MEMORY_OPTIONS, CPU_OPTIONS, MEDIA_COUNT_OPTIONS, OS_OPTIONS, matchesOs, osIdFor,
} from "../../../shared/constants";
import type { ProfileForm, GeoMode, WebRtcMode } from "../../../entities/profile";
import type { FingerprintEntry } from "../../../entities/fingerprint";
import type { ProxyEntry } from "../../../entities/proxy";
import { enrichPicksForPreset, claimsMobile } from "../../../entities/profile";
import { useGpuCompat } from "../../../shared/model/gpuCompat";
import { IncompatibleWarningModal } from "../../gpu-compat";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-0.5 flex items-center gap-1.5 text-subheading-2xs text-primary-base">
      {children}
    </div>
  );
}

export function InlineEditor({
  draft, setDraft, proxies, fingerprints, onSave, onCancel,
}: {
  draft: ProfileForm;
  setDraft: (f: ProfileForm) => void;
  proxies: ProxyEntry[];
  fingerprints: FingerprintEntry[];
  onSave: () => void;
  onCancel: () => void;
}) {
  const f = draft;
  const u = <K extends keyof ProfileForm>(k: K, v: ProfileForm[K]) => setDraft({ ...f, [k]: v });

  // OS filter init from bound fingerprint's platform; new profile uses host OS.
  const currentFp = fingerprints.find((x) => x.id === f.gpu_preset_id);
  const [osFilter, setOsFilter] = useState<string>(
    currentFp ? osIdFor(currentFp.platform as string) : HOST_OS
  );
  const gpusForOs = useMemo(
    () => fingerprints.filter((fp) => matchesOs(fp.platform, osFilter)),
    [fingerprints, osFilter],
  );

  /// Pick GPU = full fingerprint snap; toStored carries lib.payload at save.
  // The verdict map and the "stop warning me" flag; the load is once per app run.
  const compatById = useGpuCompat((s) => s.byId);
  const suppressed = useGpuCompat((s) => s.suppressed);
  const loadCompat = useGpuCompat((s) => s.load);
  useEffect(() => { void loadCompat(); }, [loadCompat]);
  // A pick held back until the operator has seen what it costs.
  const [pendingGpu, setPendingGpu] = useState<string | null>(null);

  const setGpu = async (id: string) => {
    const fp = fingerprints.find((x) => x.id === id);
    if (!fp) return;
    const nav = fp.payload?.navigator ?? {};
    // Ask Rust for the same hw + platform_version triplet save uses.
    let picks: { hardware_concurrency?: number; device_memory?: number; platform_version?: string } = {};
    try {
      picks = await enrichPicksForPreset(id);
    } catch {
      // Fall back to preset's nav defaults if Rust enrich fails.
    }
    setDraft({
      ...f,
      gpu_preset_id: id,
      hardware_concurrency: picks.hardware_concurrency ?? nav.hardware_concurrency ?? f.hardware_concurrency,
      device_memory: picks.device_memory ?? nav.device_memory ?? f.device_memory,
      platform_version: picks.platform_version ?? f.platform_version,
      user_agent: nav.user_agent ?? f.user_agent,
    });
  };

  // Snap unknown / empty gpu_preset_id to a random GPU of the active OS.
  // Only from fingerprints this machine can back: otherwise the page reads the
  // extension in getSupportedExtensions() and null from getExtension().
  useEffect(() => {
    if (fingerprints.length === 0) return;
    const exists = fingerprints.some((g) => g.id === f.gpu_preset_id);
    if (!exists) {
      const base = gpusForOs.length > 0 ? gpusForOs : fingerprints;
      const fitting = base.filter((g) => compatById[g.id]?.compatible !== false);
      const pool = fitting.length > 0 ? fitting : base;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      if (pick) setGpu(pick.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fingerprints, osFilter, f.gpu_preset_id]);

  /// What the GPU select calls: applies a pick that fits this machine, and asks
  /// first otherwise — the choice stays the operator's, the cost has to be known.
  const chooseGpu = (id: string) => {
    const verdict = compatById[id];
    if (verdict && !verdict.compatible && !suppressed) {
      setPendingGpu(id);
      return;
    }
    void setGpu(id);
  };

  const pickOs = (os: string) => {
    setOsFilter(os);
    // Switch GPU to first of new OS if current doesn't match.
    if (currentFp && !matchesOs(currentFp.platform, os)) {
      const first = fingerprints.find((g) => matchesOs(g.platform, os));
      if (first) setGpu(first.id);
    }
  };

  return (
    <div className="inline-editor relative border-t border-stroke-soft-200 bg-bg-weak-50 px-[18px] py-3.5 pl-[22px]">
      <div className="absolute left-0 top-0 h-full w-[3px] bg-primary-base" />
      <div className="grid grid-cols-3 gap-4">
        {/* ----- col 1: identity + hardware ----- */}
        <div className="flex flex-col gap-4">
          <SectionHeading>Identity</SectionHeading>
          <Field label="Profile name" value={f.name} onChange={(v) => u("name", v)} placeholder="e.g. shop-pl-1" />

          <label className="flex flex-col gap-1">
            <span className="text-label-base font-medium text-text-strong-900">Operating system</span>
            <SegmentControl
              size="small"
              className="w-full *:flex-1"
              value={osFilter}
              items={OS_OPTIONS.map((o) => ({ value: o.id, label: o.label }))}
              onChange={pickOs}
            />
          </label>

          <label className="flex flex-col gap-1">
            <CSSelect
              value={f.gpu_preset_id}
              onChange={(v) => chooseGpu(v)}
              title="GPU / device (from Fingerprint Library)"
              placeholder={`— no ${osFilter} fingerprints in library —`}
              options={gpusForOs.map((g) => ({ value: g.id, label: g.label }))}
            />
          </label>

          <Field label="User-Agent" value={f.user_agent} onChange={(v) => u("user_agent", v)} mono />

          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="CPU cores"
              value={f.hardware_concurrency}
              onChange={(v) => u("hardware_concurrency", v)}
              options={CPU_OPTIONS}
            />
            <SelectField
              label="Memory (GB)"
              value={f.device_memory}
              onChange={(v) => u("device_memory", v)}
              options={MEMORY_OPTIONS}
            />
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-label-base font-medium text-text-strong-900">Proxy</span>
            <ProxySelect
              value={f.proxy_id}
              proxies={proxies}
              onChange={(id) => u("proxy_id", id)}
            />
          </label>

          <ColorSwatches
            label="Colour"
            value={f.color}
            onChange={(v) => u("color", v)}
          />
        </div>

        {/* ----- col 2: locale + noise ----- */}
        <div className="flex flex-col gap-4">
          <SectionHeading>Locale</SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
             
              <CSSelect
                value={f.timezone}
                title="Timezone"
                onChange={(v) => u("timezone", v)}
                options={TIMEZONES.map((tz) => ({
                  value: tz,
                  label: tz === AUTO_TZ ? "Auto (from proxy geo)" : tz,
                }))}
              />
            </label>
            <label className="flex flex-col gap-1">
             
              <CSSelect
                title="Language"
                value={f.language}
                onChange={(v) => u("language", v)}
                options={LOCALES.map((l) => ({ value: l.code, label: l.label }))}
              />
            </label>
          </div>

          <div className="mt-1.5">
            <SectionHeading>Noise</SectionHeading>
          </div>
          <div className="grid grid-cols-2 gap-2 gap-x-3">
            <Pair label="Canvas"        value={f.noise_canvas}        on={(v) => u("noise_canvas", v)} />
            <Pair label="WebGL"         value={f.noise_webgl}         on={(v) => u("noise_webgl", v)} />
            <Pair label="Audio"         value={f.noise_audio}         on={(v) => u("noise_audio", v)} />
            <Pair label="Client rects"  value={f.noise_client_rects}  on={(v) => u("noise_client_rects", v)} />
            <Pair label="Sensors"       value={f.noise_sensors}       on={(v) => u("noise_sensors", v)} />
            <Pair label="Fonts"         value={f.noise_fonts}         on={(v) => u("noise_fonts", v)} onText="Noise" />
          </div>

          <PortList
            label="Ports to block"
            value={f.blocked_ports}
            onChange={(v) => u("blocked_ports", v)}
          />
        </div>

        {/* ----- col 3: privacy + media + notes ----- */}
        <div className="flex flex-col gap-4">
          <SectionHeading>Privacy</SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <CSSelect
                title="WebRTC"
                value={f.webrtc}
                onChange={(v) => u("webrtc", v as WebRtcMode)}
                options={[
                  { value: "auto", label: "Auto" },
                  { value: "tcp_only", label: "TCP only" },
                  { value: "block", label: "Block" },
                ]}
              />
            </label>
            <label className="flex flex-col gap-1">
              <CSSelect
                title="Do Not Track"
                value={f.do_not_track ? "1" : "0"}
                onChange={(v) => u("do_not_track", v === "1")}
                options={[
                  { value: "0", label: "Off" },
                  { value: "1", label: "On (send DNT: 1)" },
                ]}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-label-base font-medium text-text-strong-900">Geolocation</span>
            <SegmentControl
              size="small"
              className="w-full *:flex-1"
              value={f.geo_mode}
              items={(["auto", "manual"] as GeoMode[]).map((m) => ({
                value: m,
                label: m === "auto" ? "Auto (from proxy)" : "Manual coords",
              }))}
              onChange={(v) => u("geo_mode", v as GeoMode)}
            />
          </label>
          {f.geo_mode === "manual" && (
            <div className="grid grid-cols-3 gap-3">
              <NumField label="Latitude" value={f.geo_lat} onChange={(v) => u("geo_lat", v)} step={0.0001} />
              <NumField label="Longitude" value={f.geo_lng} onChange={(v) => u("geo_lng", v)} step={0.0001} />
              <NumField label="Accuracy m" value={f.geo_accuracy} onChange={(v) => u("geo_accuracy", v)} />
            </div>
          )}

          <div className="mt-2.5">
            <SectionHeading>Media devices</SectionHeading>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <SelectField label="Mic in" value={f.media_audio_in} onChange={(v) => u("media_audio_in", v)} options={MEDIA_COUNT_OPTIONS} />
            <SelectField label="Speakers" value={f.media_audio_out} onChange={(v) => u("media_audio_out", v)} options={MEDIA_COUNT_OPTIONS} />
            <SelectField label="Webcam" value={f.media_video_in} onChange={(v) => u("media_video_in", v)} options={MEDIA_COUNT_OPTIONS} />
          </div>

          {claimsMobile(f) && (
            <>
              <div className="mt-2.5">
                <SectionHeading>Media</SectionHeading>
              </div>
              <Switch
                label="Answer DRM questions the Android way"
                checked={f.android_media}
                onChange={(checked) => u("android_media", checked)}
              />
              <p className="m-0 -mt-1 text-paragraph-xs text-text-soft-400">
                Almost every Android device is Widevine L1, so a real phone accepts
                hardware-secured playback and this one refuses it — which a site can
                read in one call. Turning this on makes the profile answer like the
                device it claims to be. The catch: this browser reaches Widevine
                through a software module, so a site that believes the answer and
                asks for a hardware-secured licence gets one it cannot play. Leave it
                off where paid video has to work; turn it on where matching the device
                matters more.
              </p>
            </>
          )}

          <div className="mt-2.5">
            <SectionHeading>Extensions</SectionHeading>
          </div>
          <ExtensionPicker
            value={f.extensions}
            onChange={(v) => u("extensions", v)}
          />

          <Textarea
            label="Notes"
            rows={2}
            value={f.notes}
            onChange={(e) => u("notes", e.target.value)}
            placeholder="Free-form notes…"
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2.5 border-t border-stroke-soft-200 pt-3.5">
        <Button variant="neutral" mode="stroke" size="small" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" mode="filled" size="small" onClick={onSave}>
          {f.id ? "Save changes" : "Create profile"}
        </Button>
      </div>
      {pendingGpu && compatById[pendingGpu] && (
        <IncompatibleWarningModal
          compat={compatById[pendingGpu]}
          onKeep={() => {
            const id = pendingGpu;
            setPendingGpu(null);
            void setGpu(id);
          }}
          onCancel={() => setPendingGpu(null)}
        />
      )}
    </div>
  );
}
