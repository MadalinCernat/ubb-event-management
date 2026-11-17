export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED";
export type MembershipRole = "MEMBER" | "MANAGER";
export type RegistrationStatus = "ACTIVE" | "CANCELLED";

export interface OrganizationRef {
  id: string;
  name: string;
}

// Public event shape returned by the API (no participant information, only counts).
export interface EventView {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  status: EventStatus;
  organization: OrganizationRef;
  registeredCount: number;
  availableSpots: number;
}

export interface Membership {
  organizationId: string;
  organizationName: string;
  role: MembershipRole;
}

export interface Me {
  id: string;
  email: string;
  displayName: string;
  memberships: Membership[];
}

export interface Session {
  accessToken: string;
  tokenType: string;
  user: {
    id: string;
    email: string;
    displayName: string;
  };
}

export interface RegistrationView {
  id: string;
  eventId: string;
  status: RegistrationStatus;
  registeredAt: string;
  event: {
    id: string;
    title: string;
    location: string;
    startsAt: string;
    endsAt: string;
    status: EventStatus;
  };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
