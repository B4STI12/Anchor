// Anchor — Floating, draggable calculator window that overlays the current screen.

const FloatingCalculator = ({ open, onClose, toast }) => {
  const { useState, useRef, useEffect, useCallback } = React;
  const winRef = useRef(null);
  const [pos, setPos] = useState({ x: 720, y: 70 });
  const [dragging, setDragging] = useState(false);
  const [showHist, setShowHist] = useState(false);

  const [display, setDisplay] = useState("0");
  const [expr, setExpr] = useState("");
  const [history, setHistory] = useState([
    { e: "1250 × 1.081", r: "1 351.25" },
    { e: "847 + 199 + 49", r: "1 095" },
  ]);
  const [justEvaled, setJustEvaled] = useState(false);

  const fmt = (n) => {
    if (!isFinite(n)) return "Error";
    const r = Math.round(n * 1e6) / 1e6;
    const [int, dec] = String(r).split(".");
    const si = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return dec ? si + "." + dec : si;
  };

  const press = useCallback((k) => {
    if (k === "C") { setDisplay("0"); setExpr(""); return; }
    if (k === "( )") return;
    if (k === "⌫") { setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : "0")); return; }
    if (k === "=") {
      setExpr((curExpr) => {
        setDisplay((curDisplay) => {
          try {
            const js = (curExpr + curDisplay).replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/%/g, "/100").replace(/\s/g, "");
            const val = Function('"use strict";return (' + js + ")")();
            const pretty = (curExpr + curDisplay).trim();
            setHistory((h) => [{ e: pretty, r: fmt(val) }, ...h].slice(0, 12));
            setJustEvaled(true);
            return fmt(val);
          } catch { return "Error"; }
        });
        return "";
      });
      return;
    }
    if (["+", "−", "×", "÷"].includes(k)) {
      setDisplay((d) => { setExpr((e) => (e || "") + d + " " + k + " "); return "0"; });
      setJustEvaled(false);
      return;
    }
    if (k === "%") { setDisplay((d) => d + "%"); return; }
    setJustEvaled(false);
    setDisplay((d) => (d === "0" && k !== "." ? k : (d === "Error" ? k : d + k)));
  }, []);

  // ---- keyboard input while open ----
  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (k === "Escape") { onClose(); return; }
      if (/^[0-9.]$/.test(k)) { e.preventDefault(); press(k); }
      else if (k === "+") { e.preventDefault(); press("+"); }
      else if (k === "-") { e.preventDefault(); press("−"); }
      else if (k === "*") { e.preventDefault(); press("×"); }
      else if (k === "/") { e.preventDefault(); press("÷"); }
      else if (k === "%") { e.preventDefault(); press("%"); }
      else if (k === "Enter" || k === "=") { e.preventDefault(); press("="); }
      else if (k === "Backspace") { e.preventDefault(); press("⌫"); }
      else if (k.toLowerCase() === "c") { e.preventDefault(); press("C"); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, press, onClose]);

  // clamp into the window when first opened / on resize
  useEffect(() => {
    if (!open) return;
    const el = winRef.current;
    if (!el || !el.offsetParent) return;
    const parent = el.offsetParent;
    setPos((p) => ({
      x: Math.max(10, Math.min(p.x, parent.clientWidth - el.offsetWidth - 10)),
      y: Math.max(10, Math.min(p.y, parent.clientHeight - el.offsetHeight - 10)),
    }));
  }, [open, showHist]);

  const onHeaderDown = (e) => {
    if (e.target.closest("button")) return;
    e.preventDefault();
    const el = winRef.current;
    const parent = el.offsetParent;
    const startX = e.clientX, startY = e.clientY;
    const orig = { ...pos };
    setDragging(true);
    document.body.style.userSelect = "none";
    const move = (ev) => {
      let nx = orig.x + (ev.clientX - startX);
      let ny = orig.y + (ev.clientY - startY);
      nx = Math.max(8, Math.min(nx, parent.clientWidth - el.offsetWidth - 8));
      ny = Math.max(8, Math.min(ny, parent.clientHeight - el.offsetHeight - 8));
      setPos({ x: nx, y: ny });
    };
    const up = () => {
      setDragging(false);
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  if (!open) return null;

  const keys = [
    ["C", "( )", "%", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "−"],
    ["1", "2", "3", "+"],
    ["0", ".", "⌫", "="],
  ];
  const isOp = (k) => ["÷", "×", "−", "+", "="].includes(k);

  return (
    <div
      ref={winRef}
      style={{
        position: "absolute", left: pos.x, top: pos.y, width: 296, zIndex: 200,
        background: "var(--panel)", border: "1px solid #2c3550", borderRadius: 16,
        boxShadow: dragging
          ? "0 40px 110px rgba(0,0,0,.7), 0 0 0 1px rgba(96,165,250,.25)"
          : "0 30px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.03)",
        overflow: "hidden", animation: "calcFloatIn .16s cubic-bezier(.2,.9,.3,1.1)",
        transition: dragging ? "none" : "box-shadow .15s",
      }}
    >
      {/* ---- title bar / drag handle ---- */}
      <div
        onMouseDown={onHeaderDown}
        style={{
          display: "flex", alignItems: "center", gap: 8, height: 38, padding: "0 8px 0 12px",
          borderBottom: "1px solid var(--border)", background: "var(--rail)",
          cursor: dragging ? "grabbing" : "grab", userSelect: "none",
        }}
      >
        <span style={{ display: "flex", color: "var(--accent2)" }}><window.IconCalculator size={15} /></span>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)", flex: 1, letterSpacing: "-.01em" }}>Calculator</span>
        <button
          onClick={() => setShowHist((s) => !s)}
          title="History"
          style={{
            width: 26, height: 26, borderRadius: 7, border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: showHist ? "var(--hover)" : "transparent", color: showHist ? "var(--accent2)" : "var(--muted)",
          }}
        ><window.IconList size={15} /></button>
        <button
          onClick={onClose}
          title="Close"
          className="an-calc-close"
          style={{
            width: 26, height: 26, borderRadius: 7, border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "transparent", color: "var(--muted)",
          }}
        ><window.IconX size={15} /></button>
      </div>

      {/* ---- display ---- */}
      <div style={{ padding: "16px 14px 14px", textAlign: "right", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 3 }}>
        <div style={{ fontSize: 12.5, color: "var(--muted)", fontFamily: "var(--mono)", minHeight: 16, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{expr || "\u00A0"}</div>
        <div style={{ fontSize: 36, fontWeight: 600, color: "var(--text)", letterSpacing: "-.02em", fontVariantNumeric: "tabular-nums", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{display}</div>
      </div>

      {/* ---- history (collapsible) ---- */}
      {showHist && (
        <div style={{ borderTop: "1px solid var(--border)", background: "var(--panel-2)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px 6px" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: .3, textTransform: "uppercase" }}>History</span>
            <button onClick={() => setHistory([])} style={{ border: "none", background: "transparent", color: "var(--muted)", cursor: "pointer", fontSize: 11.5, padding: "2px 4px", display: "flex", alignItems: "center", gap: 4 }}>
              <window.IconTrash size={12} /> Clear
            </button>
          </div>
          <div style={{ maxHeight: 132, overflowY: "auto", padding: "0 8px 8px" }}>
            {history.length === 0 && <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "16px 0" }}>No calculations yet</div>}
            {history.map((h, i) => (
              <button key={i} onClick={() => { setDisplay(h.r.replace(/\s/g, "")); setExpr(""); setJustEvaled(true); }} className="an-hist"
                style={{ display: "block", width: "100%", textAlign: "right", padding: "7px 9px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", marginBottom: 1 }}>
                <div style={{ fontSize: 11.5, color: "var(--muted)", fontFamily: "var(--mono)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{h.e}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--dim)", fontVariantNumeric: "tabular-nums", marginTop: 1 }}>{h.r}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---- keypad ---- */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 7, padding: "4px 12px 14px" }}>
        {keys.flat().map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            className="an-calc-key"
            style={{
              height: 46, borderRadius: 12, border: "1px solid var(--border)", cursor: "pointer",
              fontSize: k === "⌫" ? 15 : k === "( )" ? 14 : 17, fontWeight: 600, fontVariantNumeric: "tabular-nums",
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
  );
};

Object.assign(window, { FloatingCalculator });
