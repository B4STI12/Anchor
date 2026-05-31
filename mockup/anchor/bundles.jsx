// Anchor — Bundles screen + embedded browser.

const BundleListItem = ({ bundle, active, onClick }) => {
  const [hov, setHov] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 10px",
        borderRadius: 9, border: "1px solid " + (active ? "rgba(37,99,235,.35)" : "transparent"),
        background: active ? "rgba(37,99,235,.14)" : (hov ? "var(--hover)" : "transparent"),
        color: active ? "var(--text)" : "var(--dim)", cursor: "pointer", textAlign: "left",
        fontSize: 13.5, fontWeight: 500, transition: "background .12s",
      }}
    >
      <Dot color={bundle.color} size={9} />
      <span style={{ flex: 1 }}>{bundle.name}</span>
      <span style={{ fontSize: 11.5, color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{bundle.links.length}</span>
    </button>
  );
};

const LinkCard = ({ link, hovered, onOpen }) => {
  const [hov, setHov] = React.useState(false);
  const isHov = hov || hovered;
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={() => onOpen(link)}
      style={{
        position: "relative", display: "flex", alignItems: "center", gap: 12, padding: "13px 13px",
        borderRadius: 12, cursor: "pointer",
        border: "1px solid " + (isHov ? "rgba(37,99,235,.45)" : "var(--border)"),
        background: isHov ? "linear-gradient(160deg,#1c2334,#171b27)" : "var(--panel)",
        boxShadow: isHov ? "0 10px 26px rgba(0,0,0,.4)" : "0 1px 0 rgba(255,255,255,.02)",
        transform: isHov ? "translateY(-1px)" : "none", transition: "all .14s",
      }}
    >
      <span style={{
        position: "absolute", left: 3, top: "50%", transform: "translateY(-50%)",
        color: "var(--muted)", opacity: isHov ? .8 : 0, cursor: "grab", transition: "opacity .12s",
      }}>
        <IconGrip size={16} />
      </span>
      <Favicon name={link.fav} size={34} radius={9} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{link.label}</div>
        <div style={{ fontSize: 11.5, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>{link.url}</div>
      </div>
      <span style={{ color: "var(--muted)", opacity: isHov ? 1 : 0, transition: "opacity .12s" }}><IconExternal size={15} /></span>
    </div>
  );
};

const Bundles = ({ onOpenLink, toast }) => {
  const [activeId, setActiveId] = React.useState(window.BUNDLES[0].id);
  const bundle = window.BUNDLES.find((b) => b.id === activeId);
  return (
    <div style={{ display: "flex", height: "100%" }}>
      <div style={{ width: 220, flexShrink: 0, borderRight: "1px solid var(--border)", padding: "14px 10px", display: "flex", flexDirection: "column", background: "var(--panel-2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 6px 10px" }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".4px", textTransform: "uppercase", color: "var(--muted)" }}>Bundles</span>
          <button className="an-iconbtn" title="New bundle" onClick={() => toast("Bundle created")} style={ghostIconStyle}><IconPlus size={15} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
          {window.BUNDLES.map((b) => (
            <BundleListItem key={b.id} bundle={b} active={b.id === activeId} onClick={() => setActiveId(b.id)} />
          ))}
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <Dot color={bundle.color} size={11} />
          <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "var(--text)", whiteSpace: "nowrap" }}>{bundle.name}</h1>
          <span style={{ fontSize: 12.5, color: "var(--muted)", whiteSpace: "nowrap" }}>{bundle.links.length} links</span>
          <div style={{ flex: 1 }} />
          <button className="an-iconbtn" title="Add link" onClick={() => toast("Add a link to " + bundle.name)} style={ghostIconStyle}><IconPlus size={16} /></button>
          <button
            className="an-primary"
            onClick={() => { onOpenLink(bundle.links[0]); toast("Opening " + bundle.links.length + " tabs…"); }}
            style={primaryBtnStyle}
          >
            <IconExternal size={15} /> Open All
          </button>
        </div>
        <div style={{ padding: 20, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12, alignContent: "start" }}>
          {bundle.links.map((l, i) => (
            <LinkCard key={l.id} link={l} hovered={i === 0 && bundle.id === "dev"} onOpen={onOpenLink} />
          ))}
        </div>
      </div>
    </div>
  );
};

const EmbeddedBrowser = ({ link, onBack, toast }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#0c0e14" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderBottom: "1px solid var(--border)", background: "var(--panel)" }}>
        <div style={{ display: "flex", gap: 2 }}>
          <button className="an-iconbtn" title="Back to Bundles" onClick={onBack} style={navIconStyle}><IconBack size={18} /></button>
          <button className="an-iconbtn" title="Forward" style={{ ...navIconStyle, color: "#3b4252", cursor: "default" }}><IconForward size={18} /></button>
          <button className="an-iconbtn" title="Reload" onClick={() => toast("Reloading…")} style={navIconStyle}><IconReload size={16} /></button>
        </div>
        <div style={{
          flex: 1, display: "flex", alignItems: "center", gap: 9, height: 34, padding: "0 12px",
          background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 9,
        }}>
          <IconLock size={13} />
          <span style={{ fontSize: 13, color: "var(--dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            <span style={{ color: "var(--muted)" }}>https://</span>{link.url}
          </span>
        </div>
        <button className="an-iconbtn" title="Copy URL" onClick={() => toast("URL copied to clipboard")} style={navIconStyle}><IconCopy size={16} /></button>
        <button className="an-iconbtn" title="Open in external browser" onClick={() => toast("Opening in system browser…")} style={navIconStyle}><IconExternal size={16} /></button>
      </div>
      <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "radial-gradient(120% 80% at 50% 0%,#11151f,#0a0c12)" }}>
        <div className="an-webloader" style={{ position: "absolute", top: 0, left: 0, height: 2, background: "linear-gradient(90deg,transparent,var(--accent2),transparent)", width: "40%" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, color: "var(--muted)" }}>
          <Favicon name={link.fav} size={64} radius={18} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--dim)" }}>{link.label}</div>
            <div style={{ fontSize: 12.5, marginTop: 5, fontFamily: "var(--mono)" }}>{link.url}</div>
          </div>
          <div style={{ fontSize: 11.5, color: "#3b4252", letterSpacing: ".3px" }}>Embedded webview · isolated session</div>
        </div>
      </div>
    </div>
  );
};

const ghostIconStyle = {
  width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border)", background: "transparent",
  color: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
};
const navIconStyle = {
  width: 32, height: 32, borderRadius: 8, border: "none", background: "transparent",
  color: "var(--dim)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
};
const primaryBtnStyle = {
  display: "flex", alignItems: "center", gap: 7, height: 34, padding: "0 15px", borderRadius: 9, whiteSpace: "nowrap",
  border: "1px solid rgba(37,99,235,.5)", background: "linear-gradient(160deg,#1e3a8a,#1c326f)",
  color: "#eaf1ff", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 6px 16px rgba(30,58,138,.4)",
};

Object.assign(window, { Bundles, EmbeddedBrowser, LinkCard, ghostIconStyle, navIconStyle, primaryBtnStyle });
