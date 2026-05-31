// Anchor — Settings, command palette, toast host.

// ============ SETTINGS ============
const Toggle = ({ on, onClick }) => (
  <button onClick={onClick} style={{
    width: 40, height: 23, borderRadius: 99, border: "none", cursor: "pointer", padding: 2,
    background: on ? "var(--accent)" : "var(--border)", display: "flex", justifyContent: on ? "flex-end" : "flex-start",
    transition: "background .15s, justify-content .15s",
  }}>
    <span style={{ width: 19, height: 19, borderRadius: 99, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.4)", transition: "all .15s" }} />
  </button>
);

const SetRow = ({ title, desc, children, last }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 2px", borderBottom: last ? "none" : "1px solid var(--border)" }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{title}</div>
      {desc && <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3, lineHeight: 1.5 }}>{desc}</div>}
    </div>
    {children}
  </div>
);

const Settings = ({ profile, toast }) => {
  const [t, setT] = React.useState({ launch: true, tray: true, deepl: true, sync: true, spell: false });
  const tog = (k) => setT((s) => ({ ...s, [k]: !s[k] }));
  const Card = ({ label, children }) => (
    <div style={{ marginBottom: 26 }}>
      <SectionLabel>{label}</SectionLabel>
      <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 13, padding: "2px 18px" }}>{children}</div>
    </div>
  );
  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "30px 30px 60px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px", color: "var(--text)", letterSpacing: "-.02em" }}>Settings</h1>
        <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "0 0 28px" }}>Manage Anchor for the <strong style={{ color: "var(--dim)" }}>{profile.name}</strong> profile.</p>

        <Card label="General">
          <SetRow title="Launch at login" desc="Open Anchor automatically when you sign in.">
            <Toggle on={t.launch} onClick={() => tog("launch")} />
          </SetRow>
          <SetRow title="Keep in menu bar" desc="Quick access from the system tray.">
            <Toggle on={t.tray} onClick={() => tog("tray")} />
          </SetRow>
          <SetRow title="Global shortcut" desc="Summon Anchor from anywhere." last>
            <kbd style={kbdStyle}>⌘</kbd><kbd style={kbdStyle}>⇧</kbd><kbd style={kbdStyle}>A</kbd>
          </SetRow>
        </Card>

        <Card label="Notes & AI">
          <SetRow title="DeepL — Improve writing" desc="Refine grammar and tone with one click in the editor.">
            <Toggle on={t.deepl} onClick={() => tog("deepl")} />
          </SetRow>
          <SetRow title="Check spelling as you type" last>
            <Toggle on={t.spell} onClick={() => tog("spell")} />
          </SetRow>
        </Card>

        <Card label="Sync & Data">
          <SetRow title="Sync across devices" desc="End-to-end encrypted. Bundles, notes and snippets stay in step.">
            <Toggle on={t.sync} onClick={() => tog("sync")} />
          </SetRow>
          <SetRow title="Export data" desc="Download everything in this profile as JSON." last>
            <button onClick={() => toast("Exporting profile…")} style={{ ...outlineBtnStyle }}><IconDownload size={14} /> Export</button>
          </SetRow>
        </Card>

        <Card label="Profiles">
          {window.PROFILES.map((p, i) => (
            <SetRow key={p.id} title={p.name} desc={p.id === profile.id ? "Current profile" : "Switch from the sidebar avatar."} last={i === window.PROFILES.length - 1}>
              <Dot color={p.color} size={10} />
            </SetRow>
          ))}
        </Card>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>Anchor 1.4.0 · macOS</span>
          <div style={{ flex: 1 }} />
          <button onClick={() => toast("You're up to date")} style={outlineBtnStyle}>Check for updates</button>
        </div>
      </div>
    </div>
  );
};

const kbdStyle = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 22, height: 22,
  padding: "0 6px", marginLeft: 4, borderRadius: 6, background: "var(--panel-2)", border: "1px solid var(--border)",
  color: "var(--dim)", fontSize: 12, fontWeight: 600, fontFamily: "var(--mono)",
};
const outlineBtnStyle = {
  display: "flex", alignItems: "center", gap: 7, height: 32, padding: "0 13px", borderRadius: 8,
  border: "1px solid var(--border)", background: "var(--hover)", color: "var(--dim)", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
};

// ============ COMMAND PALETTE ============
const CommandPalette = ({ open, onClose, onNav, toast }) => {
  const [q, setQ] = React.useState("");
  const [sel, setSel] = React.useState(0);
  const inputRef = React.useRef(null);

  const cmds = React.useMemo(() => [
    { id: "bundles", label: "Go to Bundles", hint: "⌘1", icon: IconBundles, act: () => onNav("bundles") },
    { id: "notes", label: "Go to Notes", hint: "⌘2", icon: IconNotes, act: () => onNav("notes") },
    { id: "snippets", label: "Go to Snippets", hint: "⌘3", icon: IconSnippets, act: () => onNav("snippets") },
    { id: "calc", label: "Go to Calculator", hint: "⌘4", icon: IconCalculator, act: () => onNav("calculator") },
    { id: "settings", label: "Open Settings", hint: "⌘,", icon: IconSettings, act: () => onNav("settings") },
    { id: "newnote", label: "Create new note", hint: "⌘N", icon: IconEdit, act: () => { onNav("notes"); toast("New note created"); } },
    { id: "newbundle", label: "Create new bundle", icon: IconPlus, act: () => { onNav("bundles"); toast("Bundle created"); } },
    { id: "copyaddr", label: "Copy Home Address", icon: IconCopy, act: () => toast("Copied to clipboard") },
    { id: "switch", label: "Switch to Work profile", icon: IconKey, act: () => toast("Switched to Work") },
    { id: "theme", label: "Toggle dark / light", icon: IconMoon, act: () => toast("Dark mode is on") },
  ], [onNav, toast]);

  const filtered = cmds.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()));

  React.useEffect(() => { if (open) { setQ(""); setSel(0); setTimeout(() => inputRef.current && inputRef.current.focus(), 30); } }, [open]);
  React.useEffect(() => { setSel(0); }, [q]);

  const run = (c) => { c.act(); onClose(); };

  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (filtered[sel]) run(filtered[sel]); }
    else if (e.key === "Escape") { onClose(); }
  };

  if (!open) return null;
  return (
    <div onMouseDown={onClose} style={{
      position: "fixed", inset: 0, zIndex: 200, background: "rgba(5,7,12,.55)", backdropFilter: "blur(3px)",
      display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "13vh",
    }}>
      <div className="an-pop" onMouseDown={(e) => e.stopPropagation()} style={{
        width: 560, maxWidth: "90vw", background: "var(--panel)", border: "1px solid var(--border)",
        borderRadius: 15, boxShadow: "0 30px 80px rgba(0,0,0,.6)", overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "15px 17px", borderBottom: "1px solid var(--border)" }}>
          <IconSearch size={18} />
          <input
            ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
            placeholder="Type a command or search…"
            style={{ flex: 1, border: "none", background: "transparent", outline: "none", color: "var(--text)", fontSize: 15.5 }}
          />
          <kbd style={kbdStyle}>esc</kbd>
        </div>
        <div style={{ maxHeight: 340, overflowY: "auto", padding: 7 }}>
          {filtered.length === 0 && <div style={{ padding: "26px 0", textAlign: "center", fontSize: 13, color: "var(--muted)" }}>No matching commands</div>}
          {filtered.map((c, i) => (
            <button
              key={c.id}
              onMouseEnter={() => setSel(i)}
              onClick={() => run(c)}
              style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 12px", borderRadius: 9,
                border: "none", cursor: "pointer", textAlign: "left",
                background: i === sel ? "rgba(37,99,235,.18)" : "transparent",
                color: i === sel ? "var(--text)" : "var(--dim)",
              }}
            >
              <span style={{ color: i === sel ? "var(--accent2)" : "var(--muted)", display: "flex" }}><c.icon size={17} /></span>
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{c.label}</span>
              {c.hint && <kbd style={kbdStyle}>{c.hint}</kbd>}
              {i === sel && <span style={{ color: "var(--muted)", display: "flex" }}><IconCornerReturn size={15} /></span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============ TOASTS ============
const ToastHost = ({ toasts }) => (
  <div style={{ position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)", zIndex: 300, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
    {toasts.map((t) => (
      <div key={t.id} className="an-toast" style={{
        display: "flex", alignItems: "center", gap: 9, padding: "10px 15px", borderRadius: 10,
        background: "#0a0c12", border: "1px solid var(--border)", color: "var(--text)",
        fontSize: 13, fontWeight: 500, boxShadow: "0 14px 40px rgba(0,0,0,.5)",
      }}>
        <span style={{ color: "var(--accent2)", display: "flex" }}><IconCheck size={15} /></span>
        {t.msg}
      </div>
    ))}
  </div>
);

Object.assign(window, { Settings, Toggle, CommandPalette, ToastHost, kbdStyle, outlineBtnStyle });
