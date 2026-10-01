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

