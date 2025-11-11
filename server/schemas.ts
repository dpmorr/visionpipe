import { z } from 'zod';
import { vendors } from '@db/schema';

// Vendor login schema for validation
export const vendorLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Re-export vendor schemas from db/schema
export const insertVendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  services: z.array(z.string()),
  serviceAreas: z.array(z.string()),
  certificationsAndCompliance: z.array(z.string()),
  rating: z.number().min(0).max(5),
  onTimeRate: z.number().min(0).max(100),
  recyclingEfficiency: z.number().min(0).max(100),
  customerSatisfaction: z.number().min(0).max(100),
  website: z.string().url().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  primaryContact: z.string().optional(),
});

export type VendorLogin = z.infer<typeof vendorLoginSchema>;
