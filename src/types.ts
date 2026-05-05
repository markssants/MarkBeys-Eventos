export type UserRole = 'designer' | 'contractor';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: any;
}

export interface EventProject {
  id: string;
  name: string;
  logoUrl?: string;
  driveUrl?: string;
  contractorName?: string;
  city?: string;
  eventDate?: string;
  djCount?: number;
  artCount?: number;
  motionCount?: number;
  location?: string;
  contractorId: string;
  designerId: string;
  contractorEmail?: string;
  designerEmail?: string;
  status: 'planning' | 'ongoing' | 'completed';
  createdAt: any;
}

export interface ArtTask {
  id: string;
  eventId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: 'dj' | 'party' | 'branding';
  deadline: any;
  status: 'todo' | 'production' | 'review' | 'delivered' | 'post' | 'finished';
  position: number;
  color?: string;
  createdAt: any;
}

export interface DjAsset {
  id: string;
  eventId: string;
  name: string;
  presskitUrl?: string;
  musicName?: string;
  musicUrl?: string;
  musicDuration?: string;
  createdAt: any;
}

export interface ProjectDocument {
  id: string;
  eventId: string;
  type: 'contract' | 'receipt';
  url: string;
  name: string;
  createdAt: any;
}

export interface PaymentItem {
  id: string;
  eventId: string;
  amount: number;
  status: 'paid' | 'pending';
  dueDate: any;
  paidAt?: any;
  createdAt: any;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}
