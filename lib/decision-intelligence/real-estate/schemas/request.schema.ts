import { z } from 'zod'
import { SUPPORTED_CONTRACT_MAJOR } from '../types/enums'
import { REParametersSchema } from './parameters.schema'
import { REEvidenceArraySchema } from './evidence.schema'

// Version check: accept any 1.x.x contract (MAJOR must match)
const contractVersionSchema = z.string().refine(
  (v) => {
    const [major] = v.split('.').map(Number)
    return major === SUPPORTED_CONTRACT_MAJOR
  },
  { message: `contractVersion major must be ${SUPPORTED_CONTRACT_MAJOR}` },
)

export const REFeasibilityRequestSchema = z.object({
  contractVersion: contractVersionSchema,
  domain: z.literal('real_estate'),
  decisionType: z.enum(['feasibility', 'market_entry']),
  phase: z.enum(['P1', 'P2', 'P3']),
  requestId: z.string().uuid(),
  timestamp: z.string().datetime({ offset: true }),
  context: z.object({
    parameters: REParametersSchema,
    evidence: REEvidenceArraySchema,
  }),
})

export type REFeasibilityRequestInput = z.input<typeof REFeasibilityRequestSchema>
export type REFeasibilityRequestParsed = z.output<typeof REFeasibilityRequestSchema>
