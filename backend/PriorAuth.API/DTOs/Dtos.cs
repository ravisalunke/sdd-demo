namespace PriorAuth.API.DTOs;

// ─── LOOKUP DTOs ────────────────────────────────────────────────

public record HealthPlanDto(
    int HealthPlanId,
    string Name,
    string? LineOfBusiness,
    string? PlanType,
    string? PlanCode
);

public record ProcedureCodeDto(
    string Code,
    string Description
);

public record DiagnosisCodeDto(
    string Code,
    string Description
);

public record MemberDto(
    string PatientId,
    string FirstName,
    string LastName,
    string FullName,
    string? DateOfBirth,
    string? Gender,
    string? Phone,
    string? City,
    string? State,
    string? MemberCode,
    string? PlanCode
);

public record ProviderDto(
    string PhysicianId,
    string FirstName,
    string LastName,
    string FullName,
    string? Npi,
    string? Specialty1,
    string? Phone,
    string? City,
    string? State
);

public record SiteDto(
    string SiteId,
    string Name,
    string? Npi,
    string? Specialty1,
    string? Phone,
    string? City,
    string? State,
    bool Participating
);

// ─── AUTHORIZATION DTOs ─────────────────────────────────────────

public record CreateAuthorizationRequest(
    string? Program,
    string PatientId,
    string PhysicianId,
    int HealthPlanId,
    string SiteId,
    string PrimaryDiagnosis,
    List<string> DiagnosisCodes,
    List<ProcedureRequest> Procedures,
    string? Notes
);

public record ProcedureRequest(
    string Code,
    int Quantity
);

public record AuthorizationSummaryDto(
    int AuthorizationId,
    string ReferenceNumber,
    string Status,
    string? Program,
    DateTime CreatedAt,
    string? MemberName,
    string? ProviderName,
    string? HealthPlanName,
    string? PrimaryDiagnosis
);

public record AuthorizationDetailDto(
    int AuthorizationId,
    string ReferenceNumber,
    string Status,
    string? Program,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    MemberDto? Member,
    ProviderDto? Provider,
    HealthPlanDto? HealthPlan,
    SiteDto? Site,
    DiagnosisCodeDto? PrimaryDiagnosisCode,
    List<ProcedureSummary> Procedures,
    List<DiagnosisCodeDto> Diagnoses,
    string? Notes
);

public record ProcedureSummary(
    string Code,
    string Description,
    int Quantity
);
