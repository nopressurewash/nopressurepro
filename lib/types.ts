export type QuoteStatus =
  | "draft"
  | "sent"
  | "approved"
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
}

export interface Client {
  id: string;
  name: string;
  suburb: string;
  phone: string;
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

