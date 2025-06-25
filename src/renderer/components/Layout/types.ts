export interface ThreeColumnLayoutProps {
  leftColumn: React.ReactNode;
  middleColumn: React.ReactNode;
  rightColumn: React.ReactNode;
  className?: string;
  minLeftWidth?: number;
  minMiddleWidth?: number;
  minRightWidth?: number;
  initialLeftWidth?: number;
  initialMiddleWidth?: number;
  initialRightWidth?: number;
}

export const DEFAULT_MIN_WIDTHS = {
  left: 200,
  middle: 300,
  right: 250,
} as const;

export const DEFAULT_INITIAL_WIDTHS = {
  left: 20,
  middle: 50,
  right: 30,
} as const;

export const COLUMN_TITLES = {
  left: 'File Tree',
  middle: 'Editor',
  right: 'Frames',
} as const;

export const COLUMN_ANIMATIONS = {
  left: 'animate-slide-in-left',
  middle: 'animate-fade-in',
  right: 'animate-slide-in-right',
} as const; 