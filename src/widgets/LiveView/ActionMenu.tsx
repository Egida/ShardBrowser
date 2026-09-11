import type { Picked } from "../../entities/automation";

export type MenuAction = { kind: string; label: string; needsText?: boolean };

/** What a right-click offers for the element under it. Ordered by how often an
 *  operator wants each. */
const ACTIONS: MenuAction[] = [
  { kind: "click", label: "Click" },
  { kind: "type", label: "Type text here…", needsText: true },
  { kind: "doubleClick", label: "Double-click" },
  { kind: "rightClick", label: "Right-click" },
  { kind: "hover", label: "Move to" },
  { kind: "clear", label: "Clear field" },
  { kind: "waitFor", label: "Wait for this" },
  { kind: "ifExists", label: "Only if this exists" },
  { kind: "readText", label: "Read its text…", needsText: true },
];

type Props = {
  at: { x: number; y: number };
  target: Picked | null;
  onChoose: (a: MenuAction) => void;
  onClose: () => void;
};

export function ActionMenu({ at, target, onChoose, onClose }: Props) {
  const what = target?.label
    ? `"${target.label}"`
    : target?.tag
      ? `<${target.tag}>`
      : "this point";

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div
        className="fixed z-50 w-[220px] overflow-hidden rounded-10 bg-bg-white-0 py-1 shadow-[var(--shadow-md)] ring-1 ring-stroke-soft-200"
        style={{ left: at.x, top: at.y }}
      >
        <div className="truncate px-3 py-1.5 text-paragraph-xs text-text-soft-400">
          {target?.selector ? what : `${what} · by position`}
        </div>
        {ACTIONS.map((a) => (
          <button
            key={a.kind}
            type="button"
            className="block w-full px-3 py-1.5 text-left text-paragraph-sm text-text-strong-950 hover:bg-bg-weak-50"
            onClick={() => { onChoose(a); onClose(); }}
          >
            {a.label}
          </button>
        ))}
      </div>
    </>
  );
}
