export interface DriveAccount {
  id: string;
  email: string;
  accountName: string;
  volumeLabel?: string;
  driveLetter: string;
  totalStorage: number; // in bytes
  usedStorage: number;  // in bytes
  status: 'mounted' | 'unmounted' | 'syncing' | 'error';
  errorMessage?: string;
  connectedAt: string;
  lastSynced: string;
}

export interface SystemStatus {
  totalStorage: number;
  usedStorage: number;
  freeStorage: number;
  activeDrivesCount: number;
  availableLetters: string[];
  winfspInstalled?: boolean;
}


export interface GoogleCredential {
  clientId: string;
  clientSecret: string;
  configured: boolean;
}

export interface AuthStatus {
  passwordEnabled: boolean;
  passwordConfigured: boolean;
  authenticated: boolean;
  failedAttempts: number;
  maxAttempts: number;
  remainingAttempts: number;
}

export interface LogEntry {
  id: number;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  module: string;
  message: string;
}

export interface TransferItem {
  name: string;
  driveLetter: string;
  percentage: number;
  bytes: number;
  size: number;
  speed: number;
  speedFormatted: string;
  bytesFormatted: string;
  sizeFormatted: string;
  eta: number;
  etaFormatted: string;
}

export interface TransferStatus {
  active: boolean;
  totalSpeed: number;
  speedFormatted: string;
  items: TransferItem[];
}



