// Anchor — Notes screen: folder tree + note list + rich editor.

const FolderRow = ({ name, count, open, depth = 0, active, onClick }) => {
  const [hov, setHov] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 7, width: "100%",
        padding: "7px 8px 7px " + (8 + depth * 16) + "px", borderRadius: 8,
        border: "none", background: active ? "rgba(37,99,235,.14)" : (hov ? "var(--hover)" : "transparent"),
        color: active ? "var(--text)" : "var(--dim)", cursor: "pointer", textAlign: "left",
        fontSize: 13, fontWeight: 500,
      }}
    >
      <span style={{ color: "var(--muted)", display: "flex", transform: open ? "rotate(90deg)" : "none", transition: "transform .12s" }}><IconChevron size={13} /></span>
      <span style={{ color: open ? "var(--accent2)" : "var(--muted)", display: "flex" }}><IconFolder size={15} /></span>
      <span style={{ flex: 1 }}>{name}</span>
      <span style={{ fontSize: 11, color: "var(--muted)" }}>{count}</span>
    </button>
  );
};

const NoteRow = ({ note, active, onClick }) => {
  const [hov, setHov] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "block", width: "100%", textAlign: "left", padding: "11px 13px", cursor: "pointer",
        border: "none", borderLeft: "2px solid " + (active ? "var(--accent2)" : "transparent"),
        background: active ? "rgba(37,99,235,.1)" : (hov ? "var(--hover)" : "transparent"),
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {note.pinned && <span style={{ color: "var(--accent2)", display: "flex" }}><IconPin size={12} fill="currentColor" /></span>}
        <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{note.title}</span>
        <span style={{ fontSize: 11, color: "var(--muted)", flexShrink: 0 }}>{note.date}</span>
      </div>
      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{note.preview}</div>
    </button>
  );
};

const ToolbarBtn = ({ icon: Ic, label, onClick, active }) => {
  const [hov, setHov] = React.useState(false);
  return (
    <button
      onClick={onClick} title={label}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: 30, height: 30, borderRadius: 7, border: "none", cursor: "pointer",
        background: active ? "rgba(37,99,235,.2)" : (hov ? "var(--hover)" : "transparent"),
        color: active ? "var(--accent2)" : (hov ? "var(--text)" : "var(--muted)"),
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <Ic size={16} />
    </button>
  );
};

const Editor = ({ toast }) => {
  const b = window.ACTIVE_NOTE_BODY;
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "var(--bg)" }}>
      {/* toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "8px 14px", borderBottom: "1px solid var(--border)" }}>
        <ToolbarBtn icon={IconHeading} label="Heading" onClick={() => toast("Heading")} />
        <ToolbarBtn icon={IconBold} label="Bold  ⌘B" onClick={() => toast("Bold")} />
        <ToolbarBtn icon={IconItalic} label="Italic  ⌘I" onClick={() => toast("Italic")} />
        <ToolbarBtn icon={IconList} label="Bulleted list" onClick={() => toast("List")} />
        <div style={{ width: 1, height: 18, background: "var(--border)", margin: "0 6px" }} />
        <button
          onClick={() => toast("Improving text with DeepL…")}
          style={{
            display: "flex", alignItems: "center", gap: 6, height: 30, padding: "0 11px", borderRadius: 7,
            border: "1px solid rgba(124,58,237,.4)", background: "linear-gradient(160deg,rgba(124,58,237,.22),rgba(124,58,237,.1))",
            color: "#c4b5fd", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
          }}
        >
          <IconSparkle size={14} /> Improve
        </button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11.5, color: "var(--muted)" }}>{b.words} words · saved</span>
      </div>
      {/* canvas */}
      <div style={{ flex: 1, overflowY: "auto", padding: "34px 0" }}>
        <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 40px" }}>
          <input
            defaultValue={b.title}
            spellCheck={false}
            style={{
              width: "100%", border: "none", background: "transparent", outline: "none",
              color: "var(--text)", fontSize: 30, fontWeight: 700, letterSpacing: "-.02em", marginBottom: 6,
            }}
          />
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 26, display: "flex", gap: 10, alignItems: "center" }}>
            <span>Work</span><span>·</span><span>Edited 2:14 PM</span>
          </div>
          {b.paragraphs.map((p, i) => {
            if (p.type === "h2") return <h2 key={i} style={{ fontSize: 19, fontWeight: 700, color: "var(--text)", margin: "26px 0 10px", letterSpacing: "-.01em" }}>{p.text}</h2>;
            if (p.type === "bullets") return (
              <ul key={i} style={{ margin: "4px 0 8px", paddingLeft: 22, display: "flex", flexDirection: "column", gap: 7 }}>
                {p.items.map((it, j) => <li key={j} style={{ fontSize: 15, lineHeight: 1.65, color: "var(--dim)" }}>{it}</li>)}
              </ul>
            );
            return <p key={i} style={{ fontSize: 15, lineHeight: 1.75, color: "var(--dim)", margin: "0 0 14px", textWrap: "pretty" }}>{p.text}</p>;
          })}
          <div style={{ height: 1, background: "var(--border)", margin: "8px 0 16px" }} />
          <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--muted)", margin: 0 }}>Add to checklist before Friday review. Loop in Mara on the DeepL quota question.</p>
        </div>
      </div>
    </div>
  );
};

const Notes = ({ toast }) => {
  const [folders, setFolders] = React.useState(window.FOLDERS);
  const [activeNote, setActiveNote] = React.useState("n1");
  const [activeFolder, setActiveFolder] = React.useState("Work");

  const toggle = (id) => setFolders((fs) => fs.map((f) => f.id === id ? { ...f, open: !f.open } : f));
  const visibleNotes = window.NOTES.filter((n) => n.folder === activeFolder);

  return (
    <div style={{ display: "flex", height: "100%" }}>
      {/* folder tree */}
      <div style={{ width: 200, flexShrink: 0, borderRight: "1px solid var(--border)", padding: "14px 8px", background: "var(--panel-2)", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 6px 10px" }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".4px", textTransform: "uppercase", color: "var(--muted)" }}>Folders</span>
          <button className="an-iconbtn" title="New folder" onClick={() => toast("New folder")} style={ghostIconStyle}><IconPlus size={15} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 1, overflowY: "auto" }}>
          {folders.map((f) => (
            <React.Fragment key={f.id}>
              <FolderRow name={f.name} count={f.notes.length || f.notes} open={f.open}
                active={activeFolder === f.name}
                onClick={() => { toggle(f.id); setActiveFolder(f.name); }} />
              {f.open && f.children && f.children.map((c) => (
                <FolderRow key={c.id} name={c.name} count={c.notes} open={false} depth={1}
                  active={false} onClick={() => toast(c.name + " folder")} />
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
      {/* note list */}
      <div style={{ width: 290, flexShrink: 0, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "var(--panel)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 13px", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0, flex: 1, color: "var(--text)" }}>{activeFolder}</h2>
          <button className="an-primary" onClick={() => toast("New note created")} style={{ ...primaryBtnStyle, height: 30, padding: "0 11px", fontSize: 12.5 }}>
            <IconPlus size={14} /> New
          </button>
        </div>
        <div style={{ padding: "9px 11px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, height: 32, padding: "0 10px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8 }}>
            <IconSearch size={14} />
            <input placeholder="Search notes…" style={{ flex: 1, border: "none", background: "transparent", outline: "none", color: "var(--text)", fontSize: 13 }} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {visibleNotes.map((n) => (
            <NoteRow key={n.id} note={n} active={n.id === activeNote} onClick={() => setActiveNote(n.id)} />
          ))}
        </div>
      </div>
      {/* editor */}
      <Editor toast={toast} />
    </div>
  );
};

Object.assign(window, { Notes, Editor });
