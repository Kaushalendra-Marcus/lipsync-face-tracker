/** Inline SVG icon set — no emoji anywhere in the UI. */
function base(props, children) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const PlayIcon = (p) => base(p, <polygon points="6 3 20 12 6 21 6 3" fill="currentColor" stroke="none" />);
export const PauseIcon = (p) =>
  base(p, (<g><rect x="5" y="4" width="5" height="16" rx="1" fill="currentColor" stroke="none" /><rect x="14" y="4" width="5" height="16" rx="1" fill="currentColor" stroke="none" /></g>));
export const StepBackIcon = (p) =>
  base(p, (<g><polygon points="15 5 8 12 15 19 15 5" fill="currentColor" stroke="none" /><line x1="17" y1="5" x2="17" y2="19" /></g>));
export const StepFwdIcon = (p) =>
  base(p, (<g><polygon points="9 5 16 12 9 19 9 5" fill="currentColor" stroke="none" /><line x1="7" y1="5" x2="7" y2="19" /></g>));
export const SkipBackIcon = (p) =>
  base(p, (<g><polygon points="11 5 4 12 11 19 11 5" fill="currentColor" stroke="none" /><polygon points="19 5 12 12 19 19 19 5" fill="currentColor" stroke="none" /></g>));
export const SkipFwdIcon = (p) =>
  base(p, (<g><polygon points="13 5 20 12 13 19 13 5" fill="currentColor" stroke="none" /><polygon points="5 5 12 12 5 19 5 5" fill="currentColor" stroke="none" /></g>));
export const EyeOffIcon = (p) =>
  base(p, (<g><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></g>));
export const TrashIcon = (p) =>
  base(p, (<g><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></g>));
export const DownloadIcon = (p) =>
  base(p, (<g><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></g>));
export const UploadIcon = (p) =>
  base(p, (<g><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></g>));
export const XIcon = (p) => base(p, (<g><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></g>));
export const CrosshairIcon = (p) =>
  base(p, (<g><circle cx="12" cy="12" r="9" /><line x1="12" y1="3" x2="12" y2="7" /><line x1="12" y1="17" x2="12" y2="21" /><line x1="3" y1="12" x2="7" y2="12" /><line x1="17" y1="12" x2="21" y2="12" /></g>));
export const FilmIcon = (p) =>
  base(p, (<g><rect x="2" y="4" width="20" height="16" rx="2" /><line x1="7" y1="4" x2="7" y2="20" /><line x1="17" y1="4" x2="17" y2="20" /><line x1="2" y1="9" x2="7" y2="9" /><line x1="2" y1="15" x2="7" y2="15" /><line x1="17" y1="9" x2="22" y2="9" /><line x1="17" y1="15" x2="22" y2="15" /></g>));
export const ChevronLeftIcon = (p) => base(p, <polyline points="15 18 9 12 15 6" />);
export const ChevronRightIcon = (p) => base(p, <polyline points="9 18 15 12 9 6" />);
export const LayersIcon = (p) =>
  base(p, (<g><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 12 12 17 22 12" /><polyline points="2 17 12 22 22 17" /></g>));
export const KeyboardIcon = (p) =>
  base(p, (<g><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="6" y1="9" x2="6" y2="9" /><line x1="10" y1="9" x2="10" y2="9" /><line x1="14" y1="9" x2="14" y2="9" /><line x1="18" y1="9" x2="18" y2="9" /><line x1="7" y1="13" x2="17" y2="13" /></g>));
export const EyeIcon = (p) =>
  base(p, (<g><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></g>));
export const EyeReturnIcon = (p) =>
  base(p, (<g><path d="M1 12s4-8 11-8c2.5 0 4.7 1 6.5 2.5" /><circle cx="12" cy="12" r="3" /><polyline points="18 14 20 18 16 19" /></g>));
export const UndoIcon = (p) =>
  base(p, (<g><polyline points="9 14 4 9 9 4" /><path d="M20 20v-7a4 4 0 0 0-4-4H4" /></g>));
export const RedoIcon = (p) =>
  base(p, (<g><polyline points="15 14 20 9 15 4" /><path d="M4 20v-7a4 4 0 0 1 4-4h12" /></g>));
export const LockIcon = (p) =>
  base(p, (<g><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></g>));
export const BoxSelectIcon = (p) =>
  base(p, (<g><rect x="4" y="4" width="16" height="16" rx="1" strokeDasharray="4 2" /><circle cx="4" cy="4" r="1.6" fill="currentColor" stroke="none" /><circle cx="20" cy="20" r="1.6" fill="currentColor" stroke="none" /></g>));
export const PinIcon = (p) =>
  base(p, (<g><path d="M9 4h6l1 7 3 3v2H5v-2l3-3z" /><line x1="12" y1="16" x2="12" y2="21" /></g>));
export const PlusIcon = (p) =>
  base(p, (<g><rect x="3" y="3" width="18" height="18" rx="3" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></g>));
export const FolderOpenIcon = (p) =>
  base(p, (<g><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></g>));
export const SaveIcon = (p) =>
  base(p, (<g><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></g>));
export const GearIcon = (p) =>
  base(p, (<g><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></g>));
export const VolumeIcon = (p) =>
  base(p, (<g><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /></g>));
export const MuteIcon = (p) =>
  base(p, (<g><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></g>));
export const FullscreenIcon = (p) =>
  base(p, (<g><path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" /><path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" /></g>));
export const HandIcon = (p) =>
  base(p, (<g><path d="M18 11V6a2 2 0 0 0-4 0v5" /><path d="M14 10V4a2 2 0 0 0-4 0v6" /><path d="M10 10.5V6a2 2 0 0 0-4 0v8" /><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.9-2.3l-3.4-3.85a2 2 0 0 1 3-2.65L7 15" /></g>));
export const CursorIcon = (p) =>
  base(p, (<g><path d="M4 3l7 18 2.5-7.5L21 11z" /></g>));
export const ResizeIcon = (p) =>
  base(p, (<g><path d="M21 3h-6" /><path d="M21 3v6" /><path d="M3 21h6" /><path d="M3 21v-6" /><rect x="7" y="7" width="10" height="10" rx="1" strokeDasharray="3 2" /></g>));
