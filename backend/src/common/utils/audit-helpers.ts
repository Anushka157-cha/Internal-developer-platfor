import { AuditSeverity } from '../enums/audit-severity.enum';

export function getSeverityFromAction(action: string): AuditSeverity {
  const upperAction = action.toUpperCase();
  
  // FAILED
  if (
    upperAction.includes('FAILED') ||
    upperAction.includes('ERROR') ||
    upperAction.includes('DELETED') ||
    upperAction.includes('REJECTED')
  ) {
    return AuditSeverity.FAILED;
  }
  
  // WARNING
  if (
    upperAction.includes('WARNING') ||
    upperAction.includes('DISABLED') ||
    upperAction.includes('SUSPENDED') ||
    upperAction.includes('LOCKED')
  ) {
    return AuditSeverity.WARNING;
  }
  
  // SUCCESS
  if (
    upperAction.includes('SUCCESS') ||
    upperAction.includes('CREATED') ||
    upperAction.includes('COMPLETED') ||
    upperAction.includes('APPROVED') ||
    upperAction.includes('ENABLED')
  ) {
    return AuditSeverity.SUCCESS;
  }
  
  // INFO (default)
  return AuditSeverity.INFO;
}
