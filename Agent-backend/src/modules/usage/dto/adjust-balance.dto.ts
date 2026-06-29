// Deprecated from v1.5.10. Prefer AdminAdjustAgentTokensDto in billing module.
export class AdjustBalanceDto {
  deltaAgentTokens?: number;
  deltaTokens?: number;
  reason!: string;
}
