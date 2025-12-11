export interface User {
  id: string;
  username: string;
  isOnline: boolean;
  lastSeen?: Date;
}
