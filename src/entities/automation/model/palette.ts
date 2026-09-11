/** The block library: what an operator can add by hand, grouped the way the
 *  picker shows it. Recording from the live browser adds the same kinds. */

export type ParamKind =
  | "text"
  | "number"
  | "url"
  | "key"
  | "select"
  | "textarea"
  | "resiloc"
  /** A saved project, chosen from a list. */
  | "project"
  /** An entry point inside the project another param names. */
  | "projectStep";

export type ParamSpec = {
  name: string;
  label: string;
  kind: ParamKind;
  /** Shown when the field is empty. */
  hint?: string;
  options?: string[];
  default?: string | number;
  /** For a dependent picker: the sibling param whose value it reads. */
  of?: string;
  /** Can hold something that must not leave the machine — a password, a token,
   *  a proxy with credentials in it. Only these fields offer "secret", which
   *  blanks the value on export. A folder name or a CSS selector does not. */
  secret?: boolean;
};

export type BlockSpec = {
  kind: string;
  label: string;
  /** One line, shown under the name in the picker. */
  about: string;
  params: ParamSpec[];
};

export type Category = { id: string; label: string; blocks: BlockSpec[] };

export const PALETTE: Category[] = [
  {
    id: "profile",
    label: "Profile",
    blocks: [
      {
        kind: "profile.temp",
        label: "Temporary profile",
        about: "Makes one for this run and removes it at the end.",
        params: [
          { name: "platform", label: "Platform", kind: "select", options: ["", "windows", "macos", "linux", "android"] },
          { name: "proxy", label: "Proxy", kind: "text", hint: "ip:port:user:pass — kept on the profile only", secret: true },
          { name: "into", label: "Save its id as", kind: "text", hint: "English letters, digits and _" },
        ],
      },
      {
        kind: "profile.create",
        label: "Create profile",
        about: "Makes one that stays, in a folder of its own.",
        params: [
          { name: "name", label: "Name", kind: "text", hint: "leave empty for a generated one" },
          { name: "folder", label: "Folder", kind: "text", default: "Automation" },
          { name: "platform", label: "Platform", kind: "select", options: ["", "windows", "macos", "linux", "android"] },
          { name: "proxy", label: "Proxy", kind: "text", hint: "ip:port:user:pass — kept on the profile only", secret: true },
          { name: "into", label: "Save its id as", kind: "text", hint: "English letters, digits and _" },
        ],
      },
      {
        kind: "proxy.swap",
        label: "Swap proxy (live)",
        about:
          "Changes the profile's proxy without restarting the browser (through the core; keeps the WebRTC/QUIC UDP relay). Leave empty for a direct connection.",
        params: [
          { name: "proxy", label: "Proxy", kind: "text", hint: "socks5://user:pass@host:port — empty = direct", secret: true },
        ],
      },
      {
        kind: "profile.use",
        label: "Use profile",
        about: "Drives one you already have.",
        params: [{ name: "id", label: "Profile id", kind: "text", hint: "or {{variable}}" }],
      },
      {
        kind: "profile.keep",
        label: "Keep profile",
        about: "Turns the temporary profile into one that stays.",
        params: [{ name: "folder", label: "Move to folder", kind: "text", hint: "leave empty to keep it where it is" }],
      },
      {
        kind: "profile.read",
        label: "Read a profile setting",
        about: "Any value the profile carries, by name.",
        params: [
          {
            name: "path",
            label: "Setting",
            kind: "text",
            hint: "navigator.user_agent, screen.width, timezone.id, _meta.folder",
          },
          { name: "into", label: "Save as", kind: "text", hint: "English letters, digits and _" },
        ],
      },
      {
        kind: "profile.delete",
        label: "Delete profile",
        about: "Removes it. Empty means the one this thread is driving.",
        params: [{ name: "id", label: "Profile id", kind: "text", hint: "leave empty for the current one" }],
      },
    ],
  },
  {
    id: "proxy",
    label: "Proxy",
    blocks: [
      {
        kind: "proxy.set",
        label: "Set proxy",
        about: "Puts a proxy on the profile. Never added to your proxy list.",
        params: [{ name: "proxy", label: "Proxy", kind: "text", hint: "ip:port:user:pass", secret: true }],
      },
      {
        kind: "proxy.residential",
        label: "Take a residential proxy",
        about:
          "Builds a ProxyShard residential session the way the generator card does, and puts it on the profile. Stops the run if the plan has no traffic left.",
        params: [
          {
            name: "plan",
            label: "Plan",
            kind: "select",
            options: ["standart", "premium", "unmetered"],
            default: "standart",
          },
          { name: "country", label: "Country", kind: "resiloc", hint: "pick one or more — a random one each run; none = any" },
          { name: "region", label: "Region", kind: "resiloc", hint: "pick a single country first" },
          { name: "city", label: "City", kind: "resiloc", hint: "pick a single region first" },
          { name: "isp", label: "ISP", kind: "resiloc", hint: "premium — pick a single city first" },
          {
            name: "os",
            label: "Operating system",
            kind: "select",
            options: ["", "macos", "windows", "android", "linux", "ios"],
            hint: "Premium plan only",
          },
          {
            name: "session",
            label: "Session",
            kind: "select",
            options: ["sticky", "dynamic"],
            default: "sticky",
            hint: "sticky holds one address; dynamic takes a new one",
          },
          {
            name: "session_mode",
            label: "Session mode",
            kind: "select",
            options: ["after 5 sec", "static"],
            default: "after 5 sec",
          },
          {
            name: "protocol",
            label: "Protocol",
            kind: "select",
            options: ["socks5", "http"],
            default: "socks5",
          },
          { name: "relay", label: "Relay", kind: "text", hint: "leave empty for the nearest one" },
          { name: "into", label: "Save it as", kind: "text", hint: "English letters, digits and _" },
        ],
      },
      {
        kind: "proxy.generate",
        label: "Get a proxy from ProxyShard",
        about: "Takes one from an order and puts it on the profile only.",
        params: [
          { name: "order", label: "Order id", kind: "text", hint: "leave empty for the newest" },
          { name: "country", label: "Country", kind: "text", hint: "two letters, optional" },
          { name: "into", label: "Save it as", kind: "text", hint: "English letters, digits and _" },
        ],
      },
    ],
  },
  {
    id: "navigation",
    label: "Navigation",
    blocks: [
      {
        kind: "goto",
        label: "Open URL",
        about: "Loads an address in the current tab.",
        params: [{ name: "url", label: "Address", kind: "url", hint: "https://example.com" }],
      },
      { kind: "back", label: "Go back", about: "One step back in history.", params: [] },
      { kind: "forward", label: "Go forward", about: "One step forward in history.", params: [] },
      { kind: "reload", label: "Reload", about: "Reloads the current page.", params: [] },
      {
        kind: "waitLoad",
        label: "Wait for load",
        about: "Waits until the page has finished loading.",
        params: [{ name: "timeout", label: "Give up after (s)", kind: "number", default: 30 }],
      },
    ],
  },
  {
    // Gestures a cursor cannot make. The ordinary Pointer steps already become
    // touches on a phone profile — these are the ones with no desktop twin.
    id: "touch",
    label: "Touch",
    blocks: [
      {
        kind: "touch.tap",
        label: "Tap",
        about: "One finger, once. On a phone profile the ordinary Click already does this; use Tap when the project is written for touch and should say so.",
        params: [
          { name: "selector", label: "On element", kind: "text", hint: "CSS selector, or leave empty and give x/y" },
          { name: "x", label: "X", kind: "number" },
          { name: "y", label: "Y", kind: "number" },
          { name: "tapCount", label: "Taps", kind: "number", default: 1 },
          { name: "timeout", label: "Wait for it (s)", kind: "number", default: 5 },
        ],
      },
      {
        kind: "touch.longPress",
        label: "Long press",
        about: "Holds a finger down — the phone's context menu, and how text is selected.",
        params: [
          { name: "selector", label: "On element", kind: "text", hint: "CSS selector, optional" },
          { name: "x", label: "X", kind: "number" },
          { name: "y", label: "Y", kind: "number" },
          { name: "timeout", label: "Wait for it (s)", kind: "number", default: 5 },
        ],
      },
      {
        kind: "touch.swipe",
        label: "Swipe",
        about: "A finger travelling across the glass. Starts in the middle of the page when no element is named.",
        params: [
          { name: "selector", label: "Start on", kind: "text", hint: "CSS selector, optional" },
          { name: "dx", label: "Right by (px)", kind: "number", default: 0 },
          { name: "dy", label: "Down by (px)", kind: "number", default: 0 },
          { name: "timeout", label: "Wait for it (s)", kind: "number", default: 5 },
        ],
      },
      {
        kind: "touch.drag",
        label: "Drag",
        about: "Presses, waits for the item to be picked up, carries it and sets it down. The wait is what makes it a drag and not a scroll.",
        params: [
          { name: "selector", label: "Drag this", kind: "text", hint: "CSS selector" },
          { name: "to", label: "Onto this", kind: "text", hint: "CSS selector" },
          { name: "holdMs", label: "Hold first (ms)", kind: "number", hint: "leave empty for the profile's own" },
          { name: "timeout", label: "Wait for it (s)", kind: "number", default: 5 },
        ],
      },
      {
        kind: "touch.pinch",
        label: "Pinch",
        about: "Two fingers, to zoom in or out. Above 1 zooms in.",
        params: [
          { name: "scale", label: "Scale", kind: "number", default: 2 },
          { name: "selector", label: "Around element", kind: "text", hint: "CSS selector, optional" },
          { name: "x", label: "X", kind: "number" },
          { name: "y", label: "Y", kind: "number" },
        ],
      },
    ],
  },
  {
    id: "pointer",
    label: "Pointer",
    blocks: [
      {
        kind: "click",
        label: "Click",
        about: "Moves to the target and clicks it, the way a hand would.",
        params: [{ name: "selector", label: "Element", kind: "text", hint: "CSS selector" },
          { name: "timeout", label: "Wait for it (s)", kind: "number", default: 5 },
        ],
      },
      {
        kind: "doubleClick",
        label: "Double-click",
        about: "Two clicks with a realistic gap between them.",
        params: [{ name: "selector", label: "Element", kind: "text", hint: "CSS selector" },
          { name: "timeout", label: "Wait for it (s)", kind: "number", default: 5 },
        ],
      },
      {
        kind: "rightClick",
        label: "Right-click",
        about: "Opens the page's own context menu.",
        params: [{ name: "selector", label: "Element", kind: "text", hint: "CSS selector" },
          { name: "timeout", label: "Wait for it (s)", kind: "number", default: 5 },
        ],
      },
      {
        kind: "hover",
        label: "Move to",
        about: "Travels to the element without clicking.",
        params: [{ name: "selector", label: "Element", kind: "text", hint: "CSS selector" },
          { name: "timeout", label: "Wait for it (s)", kind: "number", default: 5 },
        ],
      },
      {
        kind: "drag",
        label: "Drag onto",
        about: "Presses on one element, carries it to another and lets go.",
        params: [
          { name: "selector", label: "Drag this", kind: "text", hint: "CSS selector" },
          { name: "to", label: "Onto this", kind: "text", hint: "CSS selector" },
          {
            name: "button",
            label: "Button",
            kind: "select",
            options: ["left", "middle", "right"],
            default: "left",
          },
          { name: "holdMs", label: "Hold first (ms)", kind: "number", hint: "phone profiles only — leave empty for the profile's own" },
          { name: "timeout", label: "Wait for it (s)", kind: "number", default: 5 },
        ],
      },
      {
        kind: "swipe",
        label: "Swipe",
        about:
          "Presses and moves by a distance, then lets go — a slider, a canvas, a sweep that selects text. Starts in the middle of the page when no element is named.",
        params: [
          { name: "selector", label: "Start on", kind: "text", hint: "CSS selector, optional" },
          { name: "dx", label: "Right by (px)", kind: "number", default: 0 },
          { name: "dy", label: "Down by (px)", kind: "number", default: 0 },
          {
            name: "button",
            label: "Button",
            kind: "select",
            options: ["left", "middle", "right"],
            default: "left",
          },
          { name: "timeout", label: "Wait for it (s)", kind: "number", default: 5 },
        ],
      },
      {
        kind: "scroll",
        label: "Scroll",
        about: "Scrolls the page with the profile's own scroll device.",
        params: [
          { name: "deltaY", label: "Down by (px)", kind: "number", default: 600 },
          { name: "deltaX", label: "Right by (px)", kind: "number", default: 0 },
          { name: "timeout", label: "Wait for it (s)", kind: "number", default: 5 },
        ],
      },
    ],
  },
  {
    id: "keyboard",
    label: "Keyboard",
    blocks: [
      {
        kind: "type",
        label: "Type text",
        about: "Types into whatever is focused, with human timing.",
        params: [
          { name: "text", label: "Text", kind: "text", hint: "what to type", secret: true },
          { name: "selector", label: "Focus first (optional)", kind: "text", hint: "CSS selector" },
          { name: "timeout", label: "Wait for it (s)", kind: "number", default: 5 },
        ],
      },
      {
        kind: "press",
        label: "Press key",
        about: "One key, with modifiers if you name them.",
        params: [
          { name: "key", label: "Key", kind: "key", hint: "Enter, Tab, ArrowDown, a" },
          { name: "modifiers", label: "Modifiers", kind: "text", hint: "Shift, Control, Alt, Meta, Accel" },
        ],
      },
      {
        kind: "clear",
        label: "Clear field",
        about: "Selects everything in the field and deletes it.",
        params: [{ name: "selector", label: "Element", kind: "text", hint: "CSS selector" },
          { name: "timeout", label: "Wait for it (s)", kind: "number", default: 5 },
        ],
      },
    ],
  },
  {
    id: "flow",
    label: "Flow",
    blocks: [
      {
        kind: "flow.call",
        label: "Run a flow",
        about: "Runs a saved project as a piece of this one. A module can call the same flows.",
        params: [
          { name: "project", label: "Flow", kind: "project" },
          { name: "entry", label: "Start at", kind: "projectStep", of: "project", hint: "its own start, unless a named entry is chosen" },
          { name: "in", label: "Give it", kind: "textarea", hint: "name=value per line; leave empty to share every variable" },
          { name: "out", label: "Take back", kind: "text", hint: "variable names, comma separated" },
        ],
      },
      {
        kind: "flow.entry",
        label: "Entry point",
        about: "Names a place in this project that another flow, or a module, can start at. Does nothing when the project runs on its own.",
        params: [
          { name: "name", label: "Name", kind: "text", hint: "login, checkout…" },
          { name: "about", label: "What it does", kind: "text" },
        ],
      },
      {
        kind: "wait",
        label: "Wait",
        about: "Pauses before the next step.",
        params: [{ name: "seconds", label: "Seconds", kind: "number", default: 2 }],
      },
      {
        kind: "waitFor",
        label: "Wait for element",
        about: "Waits until the element shows up.",
        params: [
          { name: "selector", label: "Element", kind: "text", hint: "CSS selector" },
          { name: "timeout", label: "Give up after (s)", kind: "number", default: 15 },
        ],
      },
      {
        kind: "waitGone",
        label: "Wait until it is gone",
        about: "Waits for an element to disappear — a spinner, an overlay, a queue page.",
        params: [
          { name: "selector", label: "Element", kind: "text", hint: "CSS selector" },
          { name: "timeout", label: "Give up after (s)", kind: "number", default: 15 },
        ],
      },
      {
        kind: "waitText",
        label: "Wait for text",
        about: "Waits until an element says something. Case is ignored.",
        params: [
          { name: "selector", label: "Element", kind: "text", hint: "CSS selector" },
          { name: "text", label: "Text", kind: "text", hint: "part of what it should say" },
          { name: "timeout", label: "Give up after (s)", kind: "number", default: 15 },
        ],
      },
      {
        kind: "waitUrl",
        label: "Wait for the address",
        about: "Waits until the address contains what you name — after a redirect or a login.",
        params: [
          { name: "url", label: "Address contains", kind: "text", hint: "/account" },
          { name: "timeout", label: "Give up after (s)", kind: "number", default: 30 },
        ],
      },
      {
        kind: "ifExists",
        label: "Only if element exists",
        about: "Skips the steps that follow when the element is missing.",
        params: [{ name: "selector", label: "Element", kind: "text", hint: "CSS selector" }],
      },
      {
        kind: "if.value",
        label: "If — compare values",
        about:
          "Branches on two values. True → “when it works”; false → “when it fails” (your else). Set both branches in the step's panel.",
        params: [
          { name: "a", label: "First", kind: "text", hint: "text, number or {{variable}}" },
          {
            name: "op",
            label: "Is",
            kind: "select",
            options: ["=", "≠", "contains", "not contains", "starts with", "ends with", "is empty", "is not empty", ">", ">=", "<", "<="],
            default: "=",
          },
          { name: "b", label: "Second", kind: "text", hint: "text, number or {{variable}} (ignored for empty checks)" },
        ],
      },
      {
        kind: "if.exists",
        label: "If — element is there",
        about: "Branches on an element. There → “when it works”; missing → “when it fails” (else).",
        params: [{ name: "selector", label: "Element", kind: "text", hint: "CSS selector" }],
      },
      {
        kind: "if.text",
        label: "If — element text",
        about: "Branches on what an element says. True → “when it works”; false → “when it fails”.",
        params: [
          { name: "selector", label: "Element", kind: "text", hint: "CSS selector" },
          {
            name: "op",
            label: "Text",
            kind: "select",
            options: ["contains", "not contains", "=", "≠", "starts with", "ends with", "is empty", "is not empty"],
            default: "contains",
          },
          { name: "text", label: "Value", kind: "text", hint: "what to look for" },
        ],
      },
      {
        kind: "if.url",
        label: "If — the address",
        about: "Branches on the current address — after a redirect or a login. True → “when it works”; false → “when it fails”.",
        params: [
          {
            name: "op",
            label: "Address",
            kind: "select",
            options: ["contains", "not contains", "starts with", "ends with", "="],
            default: "contains",
          },
          { name: "text", label: "Value", kind: "text", hint: "/account" },
        ],
      },
      { kind: "stop", label: "Stop", about: "Ends this pass early.", params: [] },
    ],
  },
  {
    id: "requests",
    label: "Requests",
    blocks: [
      {
        kind: "script.run",
        label: "Run JavaScript",
        about:
          "Runs your JS in the page through the core's isolated world — no page-visible trace (not Runtime.evaluate). Pick the page's own world only when the script must read the page's own variables.",
        params: [
          { name: "source", label: "Script", kind: "textarea", hint: "JS to run — the last expression is the result (no top-level return); empty = load from a file" },
          { name: "file", label: "…or file", kind: "text", hint: "path to a .js file" },
          { name: "world", label: "World", kind: "select", options: ["isolated", "main"], default: "isolated" },
          { name: "into", label: "Save result as", kind: "text", hint: "English letters, digits and _" },
        ],
      },
      {
        kind: "http.request",
        label: "Send a request",
        about:
          "Sends it from the launcher, not from the page — with a chosen TLS fingerprint and, by default, through the profile's own proxy.",
        params: [
          {
            name: "method",
            label: "Method",
            kind: "select",
            options: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
            default: "GET",
          },
          { name: "url", label: "Address", kind: "url", hint: "https://example.com/api" },
          {
            name: "headers",
            label: "Headers",
            kind: "text",
            hint: "one per line — Name: value",
          },
          { name: "body", label: "Body", kind: "text", hint: "sent as it is", secret: true },
          {
            name: "fingerprint",
            label: "TLS fingerprint",
            kind: "select",
            hint: "empty = the profile's default",
            options: [
              "",
              "chrome_149", "chrome_148", "chrome_147", "chrome_146", "chrome_145",
              "chrome_144", "chrome_143", "chrome_142", "chrome_141", "chrome_140",
              "firefox_151", "firefox_150", "firefox_149", "firefox_148", "firefox_147",
              "firefox_146", "firefox_145", "firefox_144", "firefox_143", "firefox_142",
              "safari_26.4", "safari_26", "safari_18.5", "safari_18.3.1", "safari_18",
              "safari_ios_26.2", "safari_ios_18.1.1", "safari_ipad_26.2",
              "edge_148", "edge_147", "edge_146", "edge_145", "edge_144",
              "edge_143", "edge_142", "edge_141", "edge_140",
              "opera_131", "opera_130", "opera_129",
              "okhttp_5", "okhttp_4.12",
            ],
          },
          {
            name: "session",
            label: "Session",
            kind: "text",
            hint: "a name keeps cookies between steps; empty sends it alone",
          },
          {
            name: "via",
            label: "Send through",
            kind: "select",
            options: ["profile", "host"],
            default: "profile",
          },
          { name: "into", label: "Save the answer as", kind: "text", hint: "also fills <name>_status and <name>_headers" },
          { name: "timeout", label: "Give up after (s)", kind: "number", default: 30 },
        ],
      },
      {
        kind: "http.endSession",
        label: "End a session",
        about: "Forgets a session's cookies and connections. Sessions end on their own when the last run finishes.",
        params: [{ name: "session", label: "Session", kind: "text" }],
      },
    ],
  },
  {
    id: "traffic",
    label: "Traffic",
    blocks: [
      {
        kind: "traffic.observe",
        label: "Watch requests",
        about:
          "Starts capturing this profile's requests so you can open them in the Traffic tab and seed rules from the real response. Turn it off to stop.",
        params: [
          { name: "enabled", label: "State", kind: "select", options: ["on", "off"], default: "on" },
        ],
      },
      {
        kind: "traffic.block",
        label: "Block requests",
        about: "Fails every request that matches before it leaves — an ad host, a tracker, a beacon.",
        params: [
          { name: "url", label: "URL matches", kind: "text", hint: "*://*.doubleclick.net/*  (glob)" },
          { name: "method", label: "Method", kind: "text", hint: "GET, POST… empty = any" },
          {
            name: "resource",
            label: "Type",
            kind: "select",
            options: ["any", "document", "xhr", "script", "stylesheet", "image", "font", "media", "other"],
            default: "any",
          },
          { name: "reason", label: "Reason", kind: "text", hint: "BlockedByClient, AccessDenied… empty = default" },
        ],
      },
      {
        kind: "traffic.redirect",
        label: "Redirect requests",
        about:
          "Sends a matching request to another address, transparently — the page still sees the original URL.",
        params: [
          { name: "url", label: "URL matches", kind: "text", hint: "glob" },
          { name: "to", label: "Send to", kind: "url", hint: "https://…" },
          { name: "method", label: "Method", kind: "text", hint: "empty = any" },
          {
            name: "resource",
            label: "Type",
            kind: "select",
            options: ["any", "document", "xhr", "script", "stylesheet", "image", "font", "media", "other"],
            default: "any",
          },
        ],
      },
      {
        kind: "traffic.setHeaders",
        label: "Rewrite the request",
        about: "Sets request headers (and, if you want, the body or method) before it is sent.",
        params: [
          { name: "url", label: "URL matches", kind: "text", hint: "glob" },
          { name: "headers", label: "Set headers", kind: "textarea", hint: "one per line — Name: value" },
          { name: "setBody", label: "Set body", kind: "textarea", hint: "leave empty to keep it" },
          { name: "setMethod", label: "Set method", kind: "text", hint: "empty = keep" },
          {
            name: "resource",
            label: "Type",
            kind: "select",
            options: ["any", "document", "xhr", "script", "stylesheet", "image", "font", "media", "other"],
            default: "any",
          },
        ],
      },
      {
        kind: "traffic.editResponse",
        label: "Edit the response",
        about: "Rewrites the real response — status, headers, body — on the way back to the page.",
        params: [
          { name: "url", label: "URL matches", kind: "text", hint: "glob" },
          { name: "status", label: "Set status", kind: "number", hint: "e.g. 200 — empty = keep" },
          { name: "responseHeaders", label: "Set response headers", kind: "textarea", hint: "one per line — Name: value" },
          { name: "responseBody", label: "Set response body", kind: "textarea", hint: "leave empty to keep it" },
          {
            name: "resource",
            label: "Type",
            kind: "select",
            options: ["any", "document", "xhr", "script", "stylesheet", "image", "font", "media", "other"],
            default: "any",
          },
        ],
      },
      {
        kind: "traffic.fulfill",
        label: "Fake a response",
        about: "Answers a matching request with your own response — no network. Status, headers and body are yours.",
        params: [
          { name: "url", label: "URL matches", kind: "text", hint: "glob" },
          { name: "status", label: "Status", kind: "number", default: 200 },
          { name: "responseHeaders", label: "Headers", kind: "textarea", hint: "one per line — Name: value" },
          { name: "responseBody", label: "Body", kind: "textarea" },
          {
            name: "resource",
            label: "Type",
            kind: "select",
            options: ["any", "document", "xhr", "script", "stylesheet", "image", "font", "media", "other"],
            default: "any",
          },
        ],
      },
    ],
  },
  {
    id: "data",
    label: "Data",
    blocks: [
      {
        kind: "log",
        label: "Log",
        about: "Writes a line into the run log.",
        params: [{ name: "text", label: "Message", kind: "text", hint: "what to record" }],
      },
      {
        kind: "readText",
        label: "Read text",
        about: "Takes the element's text and keeps it under a name.",
        params: [
          { name: "selector", label: "Element", kind: "text", hint: "CSS selector" },
          { name: "into", label: "Save as", kind: "text", hint: "English letters, digits and _" },
          { name: "timeout", label: "Wait for it (s)", kind: "number", default: 5 },
        ],
      },
      {
        kind: "var.set",
        label: "Set value",
        about: "Stores a value you can use in later steps as {{name}}.",
        params: [
          { name: "name", label: "Name", kind: "text", hint: "English letters, digits and _" },
          { name: "value", label: "Value", kind: "text", hint: "text, or {{another}}", secret: true },
        ],
      },
      {
        kind: "var.math",
        label: "Do arithmetic",
        about: "Adds, subtracts, multiplies or divides two values.",
        params: [
          { name: "a", label: "First", kind: "text", hint: "number or {{variable}}" },
          { name: "op", label: "Operation", kind: "select", options: ["+", "-", "*", "/", "%", "min", "max"], default: "+" },
          { name: "b", label: "Second", kind: "text", hint: "number or {{variable}}" },
          { name: "into", label: "Save as", kind: "text", hint: "English letters, digits and _" },
        ],
      },
      {
        kind: "var.autofill",
        label: "Read the generated person",
        about: "A field of the invented person. Needs a page with a form open — that is when the browser offers one.",
        params: [
          { name: "field", label: "Field", kind: "text", hint: "first_name, last_name, email, phone…" },
          { name: "into", label: "Save as", kind: "text", hint: "English letters, digits and _" },
        ],
      },
      {
        kind: "count",
        label: "Count elements",
        about: "How many things match, kept under a name. 0 when nothing does.",
        params: [
          { name: "selector", label: "Element", kind: "text", hint: "CSS selector" },
          { name: "into", label: "Save as", kind: "text", hint: "English letters, digits and _" },
        ],
      },
      {
        kind: "readAttribute",
        label: "Read an attribute",
        about: "Takes an element's attribute — href, value, data-id — and keeps it under a name.",
        params: [
          { name: "selector", label: "Element", kind: "text", hint: "CSS selector" },
          { name: "name", label: "Attribute", kind: "text", hint: "href" },
          { name: "into", label: "Save as", kind: "text", hint: "English letters, digits and _" },
          { name: "timeout", label: "Wait for it (s)", kind: "number", default: 5 },
        ],
      },
      {
        kind: "screenshot",
        label: "Take a picture",
        about: "Saves what the page looks like right now. Goes beside the run log when no file is named.",
        params: [
          { name: "path", label: "File", kind: "text", hint: "leave empty to save it beside the log" },
        ],
      },
      {
        kind: "var.random",
        label: "Pick something at random",
        about: "A number between two values, or one item out of a list. Use it for waits and for choosing.",
        params: [
          { name: "list", label: "List", kind: "text", hint: "one, two, three — wins over the range" },
          { name: "min", label: "From", kind: "text", default: "0" },
          { name: "max", label: "To", kind: "text", default: "100" },
          { name: "into", label: "Save as", kind: "text", hint: "English letters, digits and _" },
        ],
      },
      {
        kind: "file.readLine",
        label: "Take a line from a file",
        about: "Reads the first line and, unless told otherwise, removes it — so a list of accounts is used once each.",
        params: [
          { name: "path", label: "File", kind: "text", hint: "one entry per line" },
          { name: "into", label: "Save as", kind: "text", hint: "English letters, digits and _" },
          {
            name: "take",
            label: "After reading",
            kind: "select",
            options: ["remove the line", "keep"],
            default: "remove the line",
          },
        ],
      },
      {
        kind: "file.append",
        label: "Write a line to a file",
        about: "Appends one line, so a run leaves its results behind.",
        params: [
          { name: "path", label: "File", kind: "text", hint: "/path/to/results.csv" },
          { name: "line", label: "Line", kind: "text", hint: "{{email}},{{total}}" },
        ],
      },
    ],
  },
  {
    id: "database",
    label: "Database",
    blocks: [
      {
        kind: "db.open",
        label: "Open database",
        about:
          "Opens a database and keeps it under a name for the rest of the run. SQLite is a file (empty = in-memory); the others take a connection string.",
        params: [
          { name: "driver", label: "Driver", kind: "select", options: ["sqlite", "postgres", "mysql", "mariadb", "mongodb"], default: "sqlite" },
          { name: "target", label: "File or connection string", kind: "text", hint: "data.db · postgres://user:pass@host/db · mysql://… · mongodb://…" },
          { name: "database", label: "Database (MongoDB)", kind: "text", hint: "only if not in the URI" },
          { name: "name", label: "Connection name", kind: "text", default: "default" },
        ],
      },
      {
        kind: "db.exec",
        label: "SQL — execute",
        about: "SQL that changes data or schema (INSERT/UPDATE/DELETE/CREATE). For MongoDB, a JSON command document (runCommand).",
        params: [
          { name: "name", label: "Connection", kind: "text", default: "default" },
          { name: "sql", label: "SQL", kind: "textarea", hint: "INSERT INTO t(a) VALUES ('{{x}}')" },
          { name: "into", label: "Save affected rows as", kind: "text", hint: "English letters, digits and _" },
        ],
      },
      {
        kind: "db.query",
        label: "SQL — query",
        about: "A SELECT (or, for MongoDB, a JSON find/command) whose result is saved. Choose the shape: all rows, first row, first value, or the row count.",
        params: [
          { name: "name", label: "Connection", kind: "text", default: "default" },
          { name: "sql", label: "SQL", kind: "textarea", hint: "SELECT * FROM t WHERE a = '{{x}}'" },
          { name: "mode", label: "Result", kind: "select", options: ["rows", "row", "value", "count"], default: "rows" },
          { name: "into", label: "Save as", kind: "text", hint: "English letters, digits and _" },
        ],
      },
      {
        kind: "db.close",
        label: "Close connection",
        about: "Closes one named connection. All open connections close when the run ends anyway.",
        params: [
          { name: "name", label: "Connection", kind: "text", default: "default" },
        ],
      },
    ],
  },
];

export function specFor(kind: string): BlockSpec | null {
  for (const c of PALETTE) {
    const b = c.blocks.find((x) => x.kind === kind);
    if (b) return b;
  }
  return null;
}
