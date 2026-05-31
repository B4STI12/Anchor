// Anchor — Snippets, Calculator, Settings.

// ============ SNIPPETS ============
const FieldCopyRow = ({ k, v, onCopy }) => {
  const [hov, setHov] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const go = () => { onCopy(v); setCopied(true); setTimeout(() => setCopied(false), 1100); };
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={go}
      style={{
        display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, cursor: "pointer",
        background: hov ? "var(--hover)" : "transparent", border: "1px solid " + (hov ? "var(--border)" : "transparent"),
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", width: 58, flexShrink: 0, textTransform: "uppercase", letterSpacing: ".3px" }}>{k}</span>
      <span style={{ flex: 1, fontSize: 13.5, color: "var(--dim)", fontFamily: k === "Street" || k === "City" ? "inherit" : "inherit" }}>{v}</span>
      <span style={{ color: copied ? "var(--accent2)" : "var(--muted)", opacity: hov || copied ? 1 : 0, transition: "opacity .12s", display: "flex" }}>
        {copied ? <IconCheck size={15} /> : <IconCopy size={14} />}
      </span>
    </div>
  );
};

const SnippetCard = ({ snip, onCopy }) => {
  const [hov, setHov] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const copyAll = () => {
    const text = snip.type === "address" ? snip.fields.map((f) => f.v).join("\n") : snip.content;
    onCopy(text); setCopied(true); setTimeout(() => setCopied(false), 1100);
  };
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 13, border: "1px solid " + (hov ? "rgba(37,99,235,.4)" : "var(--border)"),
        background: "var(--panel)", overflow: "hidden", transition: "border-color .14s",
        boxShadow: hov ? "0 10px 28px rgba(0,0,0,.35)" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 13px", borderBottom: snip.type === "address" ? "1px solid var(--border)" : "none" }}>
        <span style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: snip.type === "address" ? "rgba(34,197,94,.16)" : "rgba(37,99,235,.16)",
          color: snip.type === "address" ? "#4ade80" : "#60a5fa",
        }}>
          {snip.type === "address" ? <IconFolder size={15} /> : <IconKey size={15} />}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{snip.label}</div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{snip.uses} uses · {snip.type === "address" ? "Address" : "Custom"}</div>
        </div>
        <button
          onClick={copyAll}
          style={{
            display: "flex", alignItems: "center", gap: 6, height: 28, padding: "0 10px", borderRadius: 7,
            border: "1px solid " + (copied ? "rgba(34,197,94,.5)" : "var(--border)"),
            background: copied ? "rgba(34,197,94,.15)" : "var(--hover)", color: copied ? "#4ade80" : "var(--dim)",
            fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0,
          }}
        >
          {copied ? <IconCheck size={13} /> : <IconCopy size={13} />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {snip.type === "address" ? (
        <div style={{ padding: "6px 7px 8px" }}>
          {snip.fields.map((f, i) => <FieldCopyRow key={i} k={f.k} v={f.v} onCopy={onCopy} />)}
        </div>
      ) : (
        <div style={{ padding: "10px 13px 13px" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 12.5, color: "var(--dim)", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 11px", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{snip.content}</div>
        </div>
      )}
    </div>
  );
};

const Snippets = ({ toast }) => {
  const copy = (t) => toast("Copied to clipboard");
  const addresses = window.SNIPPETS.filter((s) => s.type === "address");
  const customs = window.SNIPPETS.filter((s) => s.type === "custom");
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--text)" }}>Snippets</h1>
        <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{window.SNIPPETS.length} saved</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, height: 34, padding: "0 11px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 9, width: 220 }}>
          <IconSearch size={15} />
          <input placeholder="Search snippets…" style={{ flex: 1, border: "none", background: "transparent", outline: "none", color: "var(--text)", fontSize: 13 }} />
        </div>
        <button className="an-primary" onClick={() => toast("New snippet")} style={primaryBtnStyle}><IconPlus size={15} /> New Snippet</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <SectionLabel>Addresses</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14, marginBottom: 28 }}>
            {addresses.map((s) => <SnippetCard key={s.id} snip={s} onCopy={copy} />)}
          </div>
          <SectionLabel>Custom Fields</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
            {customs.map((s) => <SnippetCard key={s.id} snip={s} onCopy={copy} />)}
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 12px 2px" }}>{children}</div>
);

// ============ CALCULATOR ============
const Calculator = ({ toast }) => {
  const [display, setDisplay] = React.useState("0");
  const [expr, setExpr] = React.useState("");
  const [history, setHistory] = React.useState([
    { e: "1250 × 1.081", r: "1 351.25" },
    { e: "847 + 199 + 49", r: "1 095" },
    { e: "(2400 − 380) ÷ 12", r: "168.33" },
  ]);
  const [justEvaled, setJustEvaled] = React.useState(false);

  const fmt = (n) => {
    if (!isFinite(n)) return "Error";
    const r = Math.round(n * 1e6) / 1e6;
    const [int, dec] = String(r).split(".");
    const si = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return dec ? si + "." + dec : si;
  };

  const press = (k) => {
    if (k === "C") { setDisplay("0"); setExpr(""); return; }
    if (k === "⌫") { setDisplay((d) => d.length > 1 ? d.slice(0, -1) : "0"); return; }
    if (k === "=") {
      try {
        const js = (expr + display).replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/\s/g, "");
        // eslint-disable-next-line no-eval
        const val = Function('"use strict";return (' + js + ")")();
        const pretty = (expr + display).trim();
        setHistory((h) => [{ e: pretty, r: fmt(val) }, ...h].slice(0, 8));
        setDisplay(fmt(val)); setExpr(""); setJustEvaled(true);
      } catch { setDisplay("Error"); }
      return;
    }
    if (["+", "−", "×", "÷"].includes(k)) {
      setExpr((expr || "") + (justEvaled ? display : display) + " " + k + " ");
      setDisplay("0"); setJustEvaled(false);
      return;
    }
    setJustEvaled(false);
    setDisplay((d) => (d === "0" && k !== "." ? k : d + k));
  };

  const keys = [
    ["C", "( )", "%", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "−"],
    ["1", "2", "3", "+"],
    ["0", ".", "⌫", "="],
  ];
  const isOp = (k) => ["÷", "×", "−", "+", "="].includes(k);

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 30 }}>
        <div style={{ width: 340, background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 20, padding: 18, boxShadow: "0 24px 60px rgba(0,0,0,.45)" }}>
          <div style={{ padding: "20px 12px 18px", textAlign: "right", minHeight: 96, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 4 }}>
            <div style={{ fontSize: 14, color: "var(--muted)", fontFamily: "var(--mono)", minHeight: 18 }}>{expr || "\u00A0"}</div>
            <div style={{ fontSize: 44, fontWeight: 600, color: "var(--text)", letterSpacing: "-.02em", fontVariantNumeric: "tabular-nums", overflow: "hidden", textOverflow: "ellipsis" }}>{display}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 9 }}>
            {keys.flat().map((k) => (
              <button
                key={k}
                onClick={() => press(k)}
                className="an-calc-key"
                style={{
                  height: 56, borderRadius: 14, border: "1px solid var(--border)", cursor: "pointer",
                  fontSize: k === "⌫" ? 17 : 19, fontWeight: 600, fontVariantNumeric: "tabular-nums",
                  background: k === "=" ? "linear-gradient(160deg,#1e3a8a,#1c326f)" : isOp(k) ? "var(--hover)" : "var(--panel-2)",
                  color: k === "=" ? "#eaf1ff" : isOp(k) ? "var(--accent2)" : k === "C" ? "#f87171" : "var(--text)",
                  boxShadow: k === "=" ? "0 6px 16px rgba(30,58,138,.4)" : "none",
                }}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ width: 280, flexShrink: 0, borderLeft: "1px solid var(--border)", background: "var(--panel-2)", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 12px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>History</span>
          <button onClick={() => setHistory([])} style={{ ...ghostIconStyle, width: "auto", padding: "0 8px", height: 26, fontSize: 11.5, gap: 5 }}>Clear</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
          {history.length === 0 && <div style={{ fontSize: 12.5, color: "var(--muted)", textAlign: "center", padding: "30px 0" }}>No calculations yet</div>}
          {history.map((h, i) => (
            <button key={i} onClick={() => setDisplay(h.r.replace(/\s/g, ""))} className="an-hist"
              style={{ display: "block", width: "100%", textAlign: "right", padding: "10px 11px", borderRadius: 9, border: "none", background: "transparent", cursor: "pointer", marginBottom: 2 }}>
              <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--mono)" }}>{h.e}</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: "var(--dim)", fontVariantNumeric: "tabular-nums", marginTop: 2 }}>{h.r}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Snippets, SnippetCard, Calculator, SectionLabel });
