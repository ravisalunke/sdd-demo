using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PriorAuth.API.Data;
using PriorAuth.API.DTOs;
using PriorAuth.API.Models;

namespace PriorAuth.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthorizationsController : ControllerBase
{
    private readonly PriorAuthDbContext _db;
    private readonly ILogger<AuthorizationsController> _logger;

    public AuthorizationsController(PriorAuthDbContext db, ILogger<AuthorizationsController> logger)
    {
        _db = db;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<AuthorizationSummaryDto>>> GetAll(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = _db.Authorizations
            .Include(a => a.Member)
            .Include(a => a.Provider)
            .Include(a => a.HealthPlan)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(a => a.Status == status.ToUpper());

        var results = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AuthorizationSummaryDto(
                a.AuthorizationId,
                a.ReferenceNumber,
                a.Status,
                a.Program,
                a.CreatedAt,
                a.Member != null ? a.Member.FirstName + " " + a.Member.LastName : null,
                a.Provider != null ? "Dr. " + a.Provider.FirstName + " " + a.Provider.LastName : null,
                a.HealthPlan != null ? a.HealthPlan.Name : null,
                a.PrimaryDiagnosis
            ))
            .ToListAsync();

        return Ok(results);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AuthorizationDetailDto>> GetById(int id)
    {
        var auth = await _db.Authorizations
            .Include(a => a.Member)
            .Include(a => a.Provider)
            .Include(a => a.HealthPlan)
            .Include(a => a.Site)
            .Include(a => a.PrimaryDiagnosisCode)
            .Include(a => a.Procedures).ThenInclude(p => p.Procedure)
            .Include(a => a.Diagnoses).ThenInclude(d => d.Diagnosis)
            .FirstOrDefaultAsync(a => a.AuthorizationId == id);

        if (auth == null) return NotFound();

        return Ok(MapToDetail(auth));
    }

    [HttpPost]
    public async Task<ActionResult<AuthorizationDetailDto>> Create(
        [FromBody] CreateAuthorizationRequest request)
    {
        // Generate reference number
        var refNumber = $"PA-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(10000, 99999)}";

        var auth = new Authorization
        {
            ReferenceNumber = refNumber,
            Status = "PENDING",
            Program = request.Program,
            PatientId = request.PatientId,
            PhysicianId = request.PhysicianId,
            HealthPlanId = request.HealthPlanId,
            SiteId = request.SiteId,
            PrimaryDiagnosis = request.PrimaryDiagnosis,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Authorizations.Add(auth);
        await _db.SaveChangesAsync();

        // Add procedures
        foreach (var proc in request.Procedures)
        {
            _db.AuthorizationProcedures.Add(new AuthorizationProcedure
            {
                AuthorizationId = auth.AuthorizationId,
                ProcedureCode = proc.Code,
                Quantity = proc.Quantity
            });
        }

        // Add diagnoses
        foreach (var diagCode in request.DiagnosisCodes)
        {
            _db.AuthorizationDiagnoses.Add(new AuthorizationDiagnosis
            {
                AuthorizationId = auth.AuthorizationId,
                DiagnosisCode = diagCode,
                IsPrimary = diagCode == request.PrimaryDiagnosis
            });
        }

        await _db.SaveChangesAsync();

        _logger.LogInformation("Authorization created: {RefNumber}", refNumber);

        // Return full detail
        var created = await _db.Authorizations
            .Include(a => a.Member)
            .Include(a => a.Provider)
            .Include(a => a.HealthPlan)
            .Include(a => a.Site)
            .Include(a => a.PrimaryDiagnosisCode)
            .Include(a => a.Procedures).ThenInclude(p => p.Procedure)
            .Include(a => a.Diagnoses).ThenInclude(d => d.Diagnosis)
            .FirstAsync(a => a.AuthorizationId == auth.AuthorizationId);

        return CreatedAtAction(nameof(GetById),
            new { id = auth.AuthorizationId }, MapToDetail(created));
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest request)
    {
        var auth = await _db.Authorizations.FindAsync(id);
        if (auth == null) return NotFound();

        var validStatuses = new[] { "PENDING", "APPROVED", "DENIED", "CANCELLED", "IN_REVIEW" };
        if (!validStatuses.Contains(request.Status.ToUpper()))
            return BadRequest($"Invalid status. Must be one of: {string.Join(", ", validStatuses)}");

        auth.Status = request.Status.ToUpper();
        auth.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return NoContent();
    }

    private static AuthorizationDetailDto MapToDetail(Authorization a)
    {
        var memberDto = a.Member == null ? null : new MemberDto(
            a.Member.PatientId, a.Member.FirstName, a.Member.LastName,
            a.Member.FirstName + " " + a.Member.LastName,
            a.Member.DateOfBirth.HasValue ? a.Member.DateOfBirth.Value.ToString("yyyy-MM-dd") : null,
            a.Member.Gender, a.Member.Phone, a.Member.City, a.Member.State,
            a.Member.MemberCode, a.Member.PlanCode);

        var providerDto = a.Provider == null ? null : new ProviderDto(
            a.Provider.PhysicianId, a.Provider.FirstName, a.Provider.LastName,
            "Dr. " + a.Provider.FirstName + " " + a.Provider.LastName,
            a.Provider.Npi, a.Provider.Specialty1, a.Provider.Phone,
            a.Provider.City, a.Provider.State);

        var planDto = a.HealthPlan == null ? null : new HealthPlanDto(
            a.HealthPlan.HealthPlanId, a.HealthPlan.Name,
            a.HealthPlan.LineOfBusiness, a.HealthPlan.PlanType, a.HealthPlan.PlanCode);

        var siteDto = a.Site == null ? null : new SiteDto(
            a.Site.SiteId, a.Site.Name, a.Site.Npi, a.Site.Specialty1,
            a.Site.Phone, a.Site.City, a.Site.State, a.Site.Participating);

        var diagDto = a.PrimaryDiagnosisCode == null ? null :
            new DiagnosisCodeDto(a.PrimaryDiagnosisCode.Code, a.PrimaryDiagnosisCode.Description);

        var procs = a.Procedures.Select(p => new ProcedureSummary(
            p.ProcedureCode,
            p.Procedure?.Description ?? p.ProcedureCode,
            p.Quantity)).ToList();

        var diags = a.Diagnoses.Select(d => new DiagnosisCodeDto(
            d.DiagnosisCode,
            d.Diagnosis?.Description ?? d.DiagnosisCode)).ToList();

        return new AuthorizationDetailDto(
            a.AuthorizationId, a.ReferenceNumber, a.Status, a.Program,
            a.CreatedAt, a.UpdatedAt,
            memberDto, providerDto, planDto, siteDto, diagDto,
            procs, diags, a.Notes);
    }
}

public record UpdateStatusRequest(string Status);
