using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PriorAuth.API.Models;

[Table("health_plans")]
public class HealthPlan
{
    [Key, Column("health_plan_id")]
    public int HealthPlanId { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("ins_plan_code")]
    public string? InsPlanCode { get; set; }

    [Column("line_of_business")]
    public string? LineOfBusiness { get; set; }

    [Column("plan_type")]
    public string? PlanType { get; set; }

    [Column("entity")]
    public string? Entity { get; set; }

    [Column("plan_code")]
    public string? PlanCode { get; set; }
}

[Table("procedure_codes")]
public class ProcedureCode
{
    [Key, Column("procedure_code")]
    public string Code { get; set; } = string.Empty;

    [Column("description")]
    public string Description { get; set; } = string.Empty;
}

[Table("diagnosis_codes")]
public class DiagnosisCode
{
    [Key, Column("diagnosis_code")]
    public string Code { get; set; } = string.Empty;

    [Column("description")]
    public string Description { get; set; } = string.Empty;
}

[Table("members")]
public class Member
{
    [Key, Column("patient_id")]
    public string PatientId { get; set; } = string.Empty;

    [Column("first_name")]
    public string FirstName { get; set; } = string.Empty;

    [Column("last_name")]
    public string LastName { get; set; } = string.Empty;

    [Column("date_of_birth")]
    public DateOnly? DateOfBirth { get; set; }

    [Column("gender")]
    public string? Gender { get; set; }

    [Column("language_code")]
    public string? LanguageCode { get; set; }

    [Column("address_line1")]
    public string? AddressLine1 { get; set; }

    [Column("address_line2")]
    public string? AddressLine2 { get; set; }

    [Column("city")]
    public string? City { get; set; }

    [Column("state")]
    public string? State { get; set; }

    [Column("zip_code")]
    public string? ZipCode { get; set; }

    [Column("phone")]
    public string? Phone { get; set; }

    [Column("email_address")]
    public string? EmailAddress { get; set; }

    [Column("member_code")]
    public string? MemberCode { get; set; }

    [Column("group_number")]
    public string? GroupNumber { get; set; }

    [Column("ipa_code")]
    public string? IpaCode { get; set; }

    [Column("plan_code")]
    public string? PlanCode { get; set; }
}

[Table("providers")]
public class Provider
{
    [Key, Column("physician_id")]
    public string PhysicianId { get; set; } = string.Empty;

    [Column("first_name")]
    public string FirstName { get; set; } = string.Empty;

    [Column("last_name")]
    public string LastName { get; set; } = string.Empty;

    [Column("npi")]
    public string? Npi { get; set; }

    [Column("tin")]
    public string? Tin { get; set; }

    [Column("specialty1")]
    public string? Specialty1 { get; set; }

    [Column("specialty2")]
    public string? Specialty2 { get; set; }

    [Column("address_line1")]
    public string? AddressLine1 { get; set; }

    [Column("address_line2")]
    public string? AddressLine2 { get; set; }

    [Column("city")]
    public string? City { get; set; }

    [Column("state")]
    public string? State { get; set; }

    [Column("zip_code")]
    public string? ZipCode { get; set; }

    [Column("phone")]
    public string? Phone { get; set; }

    [Column("fax")]
    public string? Fax { get; set; }

    [Column("email_address")]
    public string? EmailAddress { get; set; }

    [Column("cell_phone")]
    public string? CellPhone { get; set; }
}

[Table("sites")]
public class Site
{
    [Key, Column("site_id")]
    public string SiteId { get; set; } = string.Empty;

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("npi")]
    public string? Npi { get; set; }

    [Column("tin")]
    public string? Tin { get; set; }

    [Column("specialty1")]
    public string? Specialty1 { get; set; }

    [Column("specialty2")]
    public string? Specialty2 { get; set; }

    [Column("address_line1")]
    public string? AddressLine1 { get; set; }

    [Column("address_line2")]
    public string? AddressLine2 { get; set; }

    [Column("city")]
    public string? City { get; set; }

    [Column("state")]
    public string? State { get; set; }

    [Column("zip_code")]
    public string? ZipCode { get; set; }

    [Column("phone")]
    public string? Phone { get; set; }

    [Column("fax")]
    public string? Fax { get; set; }

    [Column("participating")]
    public bool Participating { get; set; } = true;

    [Column("steerage_flag")]
    public string? SteerageFlag { get; set; }
}

[Table("authorizations")]
public class Authorization
{
    [Key, Column("authorization_id")]
    public int AuthorizationId { get; set; }

    [Column("reference_number")]
    public string ReferenceNumber { get; set; } = string.Empty;

    [Column("status")]
    public string Status { get; set; } = "PENDING";

    [Column("program")]
    public string? Program { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("patient_id")]
    public string? PatientId { get; set; }

    [Column("physician_id")]
    public string? PhysicianId { get; set; }

    [Column("health_plan_id")]
    public int? HealthPlanId { get; set; }

    [Column("site_id")]
    public string? SiteId { get; set; }

    [Column("primary_diagnosis")]
    public string? PrimaryDiagnosis { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    // Navigation
    public Member? Member { get; set; }
    public Provider? Provider { get; set; }
    public HealthPlan? HealthPlan { get; set; }
    public Site? Site { get; set; }
    public DiagnosisCode? PrimaryDiagnosisCode { get; set; }
    public List<AuthorizationProcedure> Procedures { get; set; } = new();
    public List<AuthorizationDiagnosis> Diagnoses { get; set; } = new();
}

[Table("authorization_procedures")]
public class AuthorizationProcedure
{
    [Key, Column("id")]
    public int Id { get; set; }

    [Column("authorization_id")]
    public int AuthorizationId { get; set; }

    [Column("procedure_code")]
    public string ProcedureCode { get; set; } = string.Empty;

    [Column("quantity")]
    public int Quantity { get; set; } = 1;

    public ProcedureCode? Procedure { get; set; }
}

[Table("authorization_diagnoses")]
public class AuthorizationDiagnosis
{
    [Key, Column("id")]
    public int Id { get; set; }

    [Column("authorization_id")]
    public int AuthorizationId { get; set; }

    [Column("diagnosis_code")]
    public string DiagnosisCode { get; set; } = string.Empty;

    [Column("is_primary")]
    public bool IsPrimary { get; set; } = false;

    public DiagnosisCode? Diagnosis { get; set; }
}
