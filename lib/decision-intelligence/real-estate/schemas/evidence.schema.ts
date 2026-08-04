import { z } from 'zod'
import { RE_EVIDENCE_CATEGORIES } from '../types/enums'

export const REEvidenceItemSchema = z.object({
  key: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean()]),
  notes: z.string().optional(),
})

export const REEvidenceSchema = z.object({
  category: z.enum(RE_EVIDENCE_CATEGORIES as [string, ...string[]]),
  authority: z.number().min(0).max(1),
  source: z.string().min(1),
  timestamp: z.string().datetime({ offset: true }),
  items: z.array(REEvidenceItemSchema).optional(),
})

export const REEvidenceArraySchema = z.array(REEvidenceSchema)

export type REEvidenceInput = z.input<typeof REEvidenceSchema>
export type REEvidenceParsed = z.output<typeof REEvidenceSchema>
