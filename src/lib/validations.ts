import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),
  confirmPassword: z.string(),
  referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export const onboardingStep1Schema = z.object({
  country: z.string().min(1, "Selecciona tu país"),
  playingLevel: z.string().min(1, "Selecciona tu nivel de juego"),
});

export const onboardingStep2Schema = z.object({
  primaryRoom: z.string().min(1, "Selecciona tu sala principal"),
  secondaryRooms: z.array(z.string()).optional(),
  weeklyHours: z.number().min(0).max(168),
});

export const onboardingStep3Schema = z.object({
  goals: z.array(z.string()).min(1, "Selecciona al menos un objetivo"),
  nickname: z.string().min(3, "El nickname debe tener al menos 3 caracteres").optional(),
});

export const profileSchema = z.object({
  name: z.string().min(2),
  nickname: z.string().min(3).optional().nullable(),
  country: z.string().optional().nullable(),
  playingLevel: z.string().optional().nullable(),
  weeklyHours: z.number().min(0).max(168).optional().nullable(),
  primaryRoom: z.string().optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida"),
  newPassword: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export const rakebackLoadSchema = z.object({
  userId: z.string().min(1, "Selecciona un usuario"),
  roomId: z.string().min(1, "Selecciona una sala"),
  period: z.string().min(1, "Introduce el período"),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  rakeGenerated: z.number().positive("El rake debe ser positivo"),
  rakebackPercent: z.number().min(0).max(100),
  notes: z.string().optional(),
});

export const roomSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  slug: z.string().min(1),
  affiliateCode: z.string().min(1, "El código de afiliación es requerido"),
  rakebackBase: z.number().min(0).max(100),
  rakebackPremium: z.number().min(0).max(100).optional().nullable(),
  website: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
  setupGuide: z.string().optional().nullable(),
  vpnRequired: z.boolean().default(false),
  vpnInstructions: z.string().optional().nullable(),
  countriesAllowed: z.array(z.string()).default([]),
  countriesBlocked: z.array(z.string()).default([]),
});

export const serviceSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  category: z.enum(["VPN", "DATAMINING", "TOOLS", "COACHING", "OTHER"]),
  description: z.string().min(1),
  shortDescription: z.string().min(1),
  icon: z.string().optional().nullable(),
  priceEur: z.number().positive(),
  priceInBalance: z.number().positive().optional().nullable(),
  isRecurring: z.boolean().default(false),
  recurringPeriod: z.string().optional().nullable(),
  requiredStratum: z.enum(["NOVATO", "SEMI_PRO", "PROFESIONAL", "REFERENTE"]).optional().nullable(),
  features: z.array(z.string()).default([]),
  setupInstructions: z.string().optional().nullable(),
});

export const ticketSchema = z.object({
  subject: z.string().min(1, "El asunto es requerido"),
  category: z.string().min(1, "Selecciona una categoría"),
  message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres"),
});

export const balanceAdjustSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().refine((v) => v !== 0, "El monto no puede ser cero"),
  description: z.string().min(5, "La descripción debe tener al menos 5 caracteres"),
});

export const courseSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  priceEur: z.number().positive(),
  priceWithAffiliation: z.number().positive().optional().nullable(),
  maxStudents: z.number().int().positive().default(12),
  durationWeeks: z.number().int().positive().default(12),
  trialWeeks: z.number().int().min(0).default(2),
  schedule: z.string().optional().nullable(),
  requiresAffiliation: z.boolean().default(true),
});

export const stakingDealSchema = z.object({
  userId: z.string().min(1),
  totalBankroll: z.number().positive(),
  profitSplitMpd: z.number().min(0).max(100).default(35),
  profitSplitPlayer: z.number().min(0).max(100).default(65),
  notes: z.string().optional(),
});

export const knowledgeArticleSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string().min(1),
  category: z.string().min(1),
  isPublic: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type RakebackLoadInput = z.infer<typeof rakebackLoadSchema>;
export type RoomInput = z.infer<typeof roomSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type TicketInput = z.infer<typeof ticketSchema>;
export type BalanceAdjustInput = z.infer<typeof balanceAdjustSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
export type StakingDealInput = z.infer<typeof stakingDealSchema>;
export type KnowledgeArticleInput = z.infer<typeof knowledgeArticleSchema>;
