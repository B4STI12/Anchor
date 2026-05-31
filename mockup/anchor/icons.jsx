// Anchor — icon set. Clean 24x24 stroke icons using currentColor.
const Icon = ({ d, children, size = 20, sw = 1.75, fill = "none", ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...rest}
  >
    {d ? <path d={d} /> : children}
  </svg>
);

const IconBundles = (p) => (
  <Icon {...p}>
    <path d="M12 3 21 7.5 12 12 3 7.5z" />
    <path d="M3 12.5 12 17l9-4.5" />
    <path d="M3 16.5 12 21l9-4.5" />
  </Icon>
);
const IconNotes = (p) => (
  <Icon {...p}>
    <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6M9 17h4" />
  </Icon>
);
const IconSnippets = (p) => (
  <Icon {...p}>
    <path d="m9 8-4 4 4 4" />
    <path d="m15 8 4 4-4 4" />
  </Icon>
);
const IconCalculator = (p) => (
  <Icon {...p}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M8 7h8" />
    <path d="M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" sw={2.4} />
  </Icon>
);
const IconEmail = (p) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </Icon>
);
const IconTriad = (p) => (
  <Icon {...p}>
    <rect x="3" y="4" width="8" height="7" rx="1.5" />
    <rect x="13" y="4" width="8" height="7" rx="1.5" />
    <rect x="8" y="14" width="8" height="6" rx="1.5" />
  </Icon>
);
const IconSettings = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" sw={1.5} />
  </Icon>
);
const IconBack = (p) => <Icon {...p} d="M15 18l-6-6 6-6" />;
const IconForward = (p) => <Icon {...p} d="M9 18l6-6-6-6" />;
const IconReload = (p) => (
  <Icon {...p}>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    <path d="M3 21v-5h5" />
  </Icon>
);
const IconCopy = (p) => (
  <Icon {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </Icon>
);
const IconExternal = (p) => (
  <Icon {...p}>
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
  </Icon>
);
const IconPlus = (p) => <Icon {...p} d="M12 5v14M5 12h14" sw={2} />;
const IconGrip = (p) => (
  <Icon {...p} fill="currentColor" stroke="none">
    <circle cx="9" cy="6" r="1.4" />
    <circle cx="15" cy="6" r="1.4" />
    <circle cx="9" cy="12" r="1.4" />
    <circle cx="15" cy="12" r="1.4" />
    <circle cx="9" cy="18" r="1.4" />
    <circle cx="15" cy="18" r="1.4" />
  </Icon>
);
const IconPin = (p) => (
  <Icon {...p}>
    <path d="M12 17v5" />
    <path d="M9 3h6l-1 7 3 3H7l3-3-1-7z" />
  </Icon>
);
const IconBold = (p) => (
  <Icon {...p} sw={2}>
    <path d="M6 4h7a4 4 0 0 1 0 8H6z" />
    <path d="M6 12h8a4 4 0 0 1 0 8H6z" />
  </Icon>
);
const IconItalic = (p) => <Icon {...p} sw={2} d="M19 4h-9M14 20H5M15 4 9 20" />;
const IconList = (p) => (
  <Icon {...p}>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" sw={2.4} />
  </Icon>
);
const IconHeading = (p) => <Icon {...p} sw={2} d="M6 4v16M18 4v16M6 12h12" />;
const IconSearch = (p) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </Icon>
);
const IconCheck = (p) => <Icon {...p} d="M20 6 9 17l-5-5" sw={2.2} />;
const IconChevron = (p) => <Icon {...p} d="m9 18 6-6-6-6" />;
const IconChevDown = (p) => <Icon {...p} d="m6 9 6 6 6-6" />;
const IconLock = (p) => (
  <Icon {...p}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Icon>
);
const IconTrash = (p) => (
  <Icon {...p}>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
  </Icon>
);
const IconEdit = (p) => (
  <Icon {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
  </Icon>
);
const IconFolder = (p) => (
  <Icon {...p} d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
);
const IconSparkle = (p) => (
  <Icon {...p} fill="currentColor" stroke="none">
    <path d="M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6z" />
    <path d="M18 14l.7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7z" />
  </Icon>
);
const IconKey = (p) => (
  <Icon {...p}>
    <circle cx="8" cy="8" r="4" />
    <path d="m11 11 8 8" />
    <path d="m16 16 2-2M19 13l2 2" />
  </Icon>
);
const IconDownload = (p) => (
  <Icon {...p}>
    <path d="M12 3v12" />
    <path d="m7 11 5 5 5-5" />
    <path d="M5 21h14" />
  </Icon>
);
const IconMoon = (p) => <Icon {...p} d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />;
const IconX = (p) => <Icon {...p} d="M18 6 6 18M6 6l12 12" sw={2} />;
const IconCornerReturn = (p) => (
  <Icon {...p} d="M9 10 5 14l4 4M5 14h11a4 4 0 0 0 4-4V6" />
);

Object.assign(window, {
  Icon, IconBundles, IconNotes, IconSnippets, IconCalculator, IconEmail, IconTriad,
  IconSettings, IconBack, IconForward, IconReload, IconCopy, IconExternal, IconPlus,
  IconGrip, IconPin, IconBold, IconItalic, IconList, IconHeading, IconSearch, IconCheck,
  IconChevron, IconChevDown, IconLock, IconTrash, IconEdit, IconFolder, IconSparkle,
  IconKey, IconDownload, IconMoon, IconX, IconCornerReturn,
});
