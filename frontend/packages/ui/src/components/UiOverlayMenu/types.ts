export type OverlayMenuSide = 'top' | 'right' | 'bottom' | 'left';

export type OverlayMenuAlign = 'start' | 'center' | 'end';

export type OverlayMenuOrigin =
  | OverlayMenuSide
  | `${OverlayMenuSide}-${OverlayMenuAlign}`;