// Anchor — sidebar, profile switcher, favicon tile.

const Favicon = ({ name, size = 28, radius = 7 }) => {
  const f = window.FAVI[name] || { bg: "#374151", fg: "#fff", t: "?" };
  return (
    <div
      style={{
        width: size, height: size, borderRadius: radius, background: f.bg,
        color: f.fg, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.42, fontWeight: 700, flexShrink: 0, lineHeight: 1,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,.06)",
      }}
    >
      {f.t}
    </div>
  );
};

const Dot = ({ color, size = 8 }) => (
  <span style={{ width: size, height: size, borderRadius: 99, background: color, flexShrink: 0, display: "inline-block" }} />
);

// ---- Profile switcher (top of sidebar) ----
const ProfileSwitcher = ({ profile, profiles, onSwitch, onAdd }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const initials = profile.name[0];
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className="an-prof-btn"
        onClick={() => setOpen((o) => !o)}
        title="Switch profile"
        style={{
          width: 38, height: 38, borderRadius: 11, border: "1px solid var(--border)",
          background: "linear-gradient(160deg,#2b3550,#1a2236)", color: "#dbe4ff",
          fontSize: 14, fontWeight: 700, position: "relative", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {initials}
        <span style={{
          position: "absolute", bottom: -2, right: -2, width: 12, height: 12, borderRadius: 99,
          background: profile.color, border: "2.5px solid var(--bg)",
        }} />
      </button>
      {open && (
        <div className="an-pop" style={{
          position: "absolute", top: 0, left: 48, width: 188, zIndex: 60,
          background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 12,
          padding: 6, boxShadow: "0 18px 50px rgba(0,0,0,.55)",
        }}>
          <div style={{ padding: "6px 8px 4px", fontSize: 11, fontWeight: 600, color: "var(--muted)", letterSpacing: .3, textTransform: "uppercase" }}>Profiles</div>
          {profiles.map((p) => (
            <button
              key={p.id}
              className="an-menu-item"
              onClick={() => { onSwitch(p); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 8px",
                borderRadius: 8, border: "none", background: p.id === profile.id ? "rgba(37,99,235,.16)" : "transparent",
                color: "var(--text)", cursor: "pointer", fontSize: 13, fontWeight: 500, textAlign: "left",
              }}
            >
              <Dot color={p.color} size={9} />
              <span style={{ flex: 1 }}>{p.name}</span>
              {p.id === profile.id && <span style={{ color: "var(--accent2)" }}><IconCheck size={15} /></span>}
            </button>
          ))}
          <div style={{ height: 1, background: "var(--border)", margin: "5px 4px" }} />
          <button
            className="an-menu-item"
            onClick={() => { onAdd(); setOpen(false); }}
            style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px",
              borderRadius: 8, border: "none", background: "transparent", color: "var(--muted)",
              cursor: "pointer", fontSize: 13, fontWeight: 500, textAlign: "left",
            }}
          >
            <span style={{ display: "flex" }}><IconPlus size={15} /></span> Add Profile
          </button>
        </div>
      )}
    </div>
  );
};

// ---- Sidebar nav item ----
const NavItem = ({ icon: Ic, label, active, disabled, badge, onClick }) => {
  const [hov, setHov] = React.useState(false);
  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "center" }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <button
        onClick={disabled ? undefined : onClick}
        aria-disabled={disabled}
        style={{
          width: 40, height: 40, borderRadius: 11, cursor: disabled ? "default" : "pointer",
          border: "1px solid " + (active ? "rgba(37,99,235,.55)" : "transparent"),
          background: active ? "linear-gradient(160deg,#1e3a8a,#1c326f)" : (hov && !disabled ? "var(--hover)" : "transparent"),
          color: disabled ? "#3b4252" : active ? "#dbe7ff" : (hov ? "var(--text)" : "var(--muted)"),
          display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
          boxShadow: active ? "0 6px 16px rgba(30,58,138,.45)" : "none", transition: "background .12s, color .12s",
        }}
      >
        <Ic size={20} />
        {active && <span style={{ position: "absolute", left: -9, top: 9, bottom: 9, width: 3, borderRadius: 3, background: "var(--accent2)" }} />}
      </button>
      {hov && (
        <div style={{
          position: "absolute", left: 50, top: "50%", transform: "translateY(-50%)", zIndex: 70,
          background: "#0a0c12", border: "1px solid var(--border)", color: "var(--text)",
          padding: "5px 9px", borderRadius: 7, fontSize: 12, fontWeight: 500, whiteSpace: "nowrap",
          boxShadow: "0 8px 24px rgba(0,0,0,.5)", pointerEvents: "none",
        }}>
          {label}{badge && <span style={{ color: "var(--muted)", marginLeft: 6, fontSize: 11 }}>{badge}</span>}
        </div>
      )}
    </div>
  );
};

const Divider = () => <div style={{ height: 1, background: "var(--border)", margin: "8px 10px" }} />;

const Sidebar = ({ screen, setScreen, profile, onSwitchProfile, onAddProfile, calcOpen, onToggleCalc }) => (
  <div style={{
    width: 56, flexShrink: 0, background: "var(--rail)", borderRight: "1px solid var(--border)",
    display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: 4,
  }}>
    <div style={{ marginBottom: 6 }}>
      <ProfileSwitcher profile={profile} profiles={window.PROFILES} onSwitch={onSwitchProfile} onAdd={onAddProfile} />
    </div>
    <div style={{ height: 1, background: "var(--border)", width: 28, margin: "4px 0 8px" }} />
    <NavItem icon={IconBundles} label="Bundles" active={screen === "bundles" || screen === "browser"} onClick={() => setScreen("bundles")} />
    <NavItem icon={IconNotes} label="Notes" active={screen === "notes"} onClick={() => setScreen("notes")} />
    <NavItem icon={IconSnippets} label="Snippets" active={screen === "snippets"} onClick={() => setScreen("snippets")} />
    <NavItem icon={IconCalculator} label="Calculator" active={calcOpen} onClick={onToggleCalc} />
    <Divider />
    <NavItem icon={IconEmail} label="Email" badge="coming soon" disabled />
    <NavItem icon={IconTriad} label="Email Triad" badge="coming soon" disabled />
    <div style={{ flex: 1 }} />
    <NavItem icon={IconSettings} label="Settings" active={screen === "settings"} onClick={() => setScreen("settings")} />
  </div>
);

Object.assign(window, { Favicon, Dot, ProfileSwitcher, NavItem, Divider, Sidebar });
