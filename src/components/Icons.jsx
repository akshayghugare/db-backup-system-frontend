const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

const make = (paths) =>
  function Icon({ size = 14, className = "" }) {
    return (
      <svg {...base} width={size} height={size} className={`shrink-0 ${className}`}>
        {paths}
      </svg>
    );
  };

export const DatabaseIcon = make(
  <>
    <ellipse cx="12" cy="5" rx="8" ry="3" />
    <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
    <path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
  </>
);
export const UploadIcon = make(
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M17 8l-5-5-5 5" />
    <path d="M12 3v12" />
  </>
);
export const DownloadIcon = make(
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M7 10l5 5 5-5" />
    <path d="M12 15V3" />
  </>
);
export const ArrowRightIcon = make(
  <>
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
  </>
);
export const AlertIcon = make(
  <>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </>
);
export const EyeIcon = make(
  <>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </>
);
export const EyeOffIcon = make(
  <>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-6.5 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    <path d="M1 1l22 22" />
  </>
);
export const CheckCircleIcon = make(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12l3 3 5-6" />
  </>
);
export const XCircleIcon = make(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M15 9l-6 6" />
    <path d="M9 9l6 6" />
  </>
);
export const SpinnerIcon = ({ size = 14, className = "" }) => (
  <svg {...base} width={size} height={size} className={`shrink-0 animate-spin ${className}`}>
    <path d="M21 12a9 9 0 1 1-6.22-8.56" />
  </svg>
);
export const PlugIcon = make(
  <>
    <path d="M9 2v6" />
    <path d="M15 2v6" />
    <path d="M6 8h12v3a6 6 0 0 1-12 0V8z" />
    <path d="M12 17v5" />
  </>
);
export const TableIcon = make(
  <>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 10h18" />
    <path d="M9 4v16" />
  </>
);
export const LogOutIcon = make(
  <>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </>
);
export const UserIcon = make(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </>
);
export const UsersIcon = make(
  <>
    <circle cx="9" cy="8" r="4" />
    <path d="M1 21a8 8 0 0 1 16 0" />
    <path d="M17 4a4 4 0 0 1 0 8" />
    <path d="M23 21a8 8 0 0 0-4-6.9" />
  </>
);
export const ShieldIcon = make(
  <>
    <path d="M12 2l8 3v6c0 5-3.5 9.5-8 11-4.5-1.5-8-6-8-11V5l8-3z" />
  </>
);
export const LockIcon = make(
  <>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </>
);
export const HistoryIcon = make(
  <>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l3 2" />
  </>
);
export const MenuIcon = make(
  <>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
  </>
);
export const CloseIcon = make(
  <>
    <path d="M18 6L6 18" />
    <path d="M6 6l12 12" />
  </>
);
export const ChevronDownIcon = make(<path d="M6 9l6 6 6-6" />);
export const ChevronRightIcon = make(<path d="M9 6l6 6-6 6" />);
export const CheckIcon = make(<path d="M5 12l5 5L20 7" />);
export const ClockIcon = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>
);
export const ServerIcon = make(
  <>
    <rect x="3" y="4" width="18" height="7" rx="2" />
    <rect x="3" y="13" width="18" height="7" rx="2" />
    <path d="M7 7.5h.01" />
    <path d="M7 16.5h.01" />
  </>
);
export const LayersIcon = make(
  <>
    <path d="M12 3l9 5-9 5-9-5 9-5z" />
    <path d="M3 13l9 5 9-5" />
  </>
);
export const ZapIcon = make(<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />);
export const ActivityIcon = make(<path d="M22 12h-4l-3 9L9 3l-3 9H2" />);
export const SearchIcon = make(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </>
);
export const RefreshIcon = make(
  <>
    <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
    <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M3 21v-5h5" />
  </>
);
export const SparklesIcon = make(
  <>
    <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z" />
    <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
  </>
);
export const HourglassIcon = make(
  <>
    <path d="M6 2h12" />
    <path d="M6 22h12" />
    <path d="M7 2v4a5 5 0 0 0 10 0V2" />
    <path d="M7 22v-4a5 5 0 0 1 10 0v4" />
  </>
);
export const LinkIcon = make(
  <>
    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
    <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
  </>
);
export const GridIcon = make(
  <>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </>
);
