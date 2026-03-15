export type QuoteStatus =
  | "draft"
  | "sent"
  | "approved"
  | "follow_up"
  | "booked"
  | "completed"
  | "paid"
  | "lost";

export type StainLevel = "light" | "medium" | "heavy";

export type ServiceType = string;

export interface Rates {
  driveway: number;
  paths: number;
  patio: number;
  houseWash: number;
  roofWash: number;
  wallsExtras: number;
}

export interface Quote {
  id: string;
  clientName: string;
  suburb: string;
  phone: string;
  drivewaySqm: number;
  pathsSqm: number;
  patioSqm: number;
  stainLevel: StainLevel;
  estimatedHours: number;
  includeHouseWash: boolean;
  includeRoofWash: boolean;
  includeWallsExtras: boolean;
  notes: string;
  serviceType: ServiceType;
  low: number;
  recommended: number;
  high: number;
  revenuePerHour: number;
  status: QuoteStatus;
  createdAt: string;
  scheduledDate?: string;
  scheduledTime?: string;
  /** Set when status is first set to "sent" */
  sentAt?: string;
  /** Set when status is first set to "approved" */
  approvedAt?: string;
}

export interface Client {
  id: string;
  name: string;
  suburb: string;
  phone: string;
  email?: string;
  address?: string;
  totalJobs: number;
  totalValue: number;
  clientType: "Residential" | "Commercial";
}

export type JobPhotoCategory = "before" | "after" | "other";

export interface JobPhotoRecord {
  id: string;
  quoteId: string;
  category: JobPhotoCategory;
  createdAt: string;
  blob: Blob;
  caption?: string;
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export interface InvoiceLineItem {
  description: string;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  quoteId: string;
  clientName: string;
  suburb: string;
  phone: string;
  serviceType: string;
  lineItems: InvoiceLineItem[];
  amount: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

