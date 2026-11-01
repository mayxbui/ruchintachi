// Document Picture-in-Picture (Chrome/Edge 116+ desktop), not yet in
// TypeScript's DOM types. Used by the pop-out widget (#66).

interface DocumentPictureInPictureOptions {
  width?: number;
  height?: number;
  disallowReturnToOpener?: boolean;
  preferInitialWindowPlacement?: boolean;
}

interface DocumentPictureInPicture extends EventTarget {
  /** The open always-on-top window, or null. */
  readonly window: Window | null;
  requestWindow(options?: DocumentPictureInPictureOptions): Promise<Window>;
}

interface Window {
  /** Missing in browsers without Document Picture-in-Picture. */
  readonly documentPictureInPicture?: DocumentPictureInPicture;
}
