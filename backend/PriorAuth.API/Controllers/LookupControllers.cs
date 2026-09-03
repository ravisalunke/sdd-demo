using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PriorAuth.API.Data;
using PriorAuth.API.DTOs;

namespace PriorAuth.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MembersController : ControllerBase
{
    private readonly PriorAuthDbContext _db;
    public MembersController(PriorAuthDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<MemberDto>>> Search(
        [FromQuery] string? name,
        [FromQuery] string? patientId,
        [FromQuery] string? memberCode)
    {
        var query = _db.Members.AsQueryable();

        if (!string.IsNullOrWhiteSpace(patientId))
            query = query.Where(m => m.PatientId.Contains(patientId));
        else if (!string.IsNullOrWhiteSpace(memberCode))
            query = query.Where(m => m.MemberCode != null && m.MemberCode.Contains(memberCode));
        else if (!string.IsNullOrWhiteSpace(name))
            query = query.Where(m =>
                (m.FirstName + " " + m.LastName).ToLower().Contains(name.ToLower()));
        else
            query = query.Take(20); // return first 20 with no filter

        var results = await query.Take(50).Select(m => new MemberDto(
            m.PatientId,
            m.FirstName,
            m.LastName,
            m.FirstName + " " + m.LastName,
            m.DateOfBirth.HasValue ? m.DateOfBirth.Value.ToString("yyyy-MM-dd") : null,
            m.Gender,
            m.Phone,
            m.City,
            m.State,
            m.MemberCode,
            m.PlanCode
        )).ToListAsync();

        return Ok(results);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MemberDto>> GetById(string id)
    {
        var m = await _db.Members.FindAsync(id);
        if (m == null) return NotFound();
        return Ok(new MemberDto(m.PatientId, m.FirstName, m.LastName,
            m.FirstName + " " + m.LastName,
            m.DateOfBirth.HasValue ? m.DateOfBirth.Value.ToString("yyyy-MM-dd") : null,
            m.Gender, m.Phone, m.City, m.State, m.MemberCode, m.PlanCode));
    }
}

[ApiController]
[Route("api/[controller]")]
public class ProvidersController : ControllerBase
{
    private readonly PriorAuthDbContext _db;
    public ProvidersController(PriorAuthDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<ProviderDto>>> Search(
        [FromQuery] string? name,
        [FromQuery] string? npi)
    {
        var query = _db.Providers.AsQueryable();

        if (!string.IsNullOrWhiteSpace(npi))
            query = query.Where(p => p.Npi != null && p.Npi.Contains(npi));
        else if (!string.IsNullOrWhiteSpace(name))
            query = query.Where(p =>
                (p.FirstName + " " + p.LastName).ToLower().Contains(name.ToLower()));
        else
            query = query.Take(20);

        var results = await query.Take(50).Select(p => new ProviderDto(
            p.PhysicianId, p.FirstName, p.LastName,
            "Dr. " + p.FirstName + " " + p.LastName,
            p.Npi, p.Specialty1, p.Phone, p.City, p.State
        )).ToListAsync();

        return Ok(results);
    }
}

[ApiController]
[Route("api/[controller]")]
public class SitesController : ControllerBase
{
    private readonly PriorAuthDbContext _db;
    public SitesController(PriorAuthDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<SiteDto>>> Search([FromQuery] string? name)
    {
        var query = _db.Sites.AsQueryable();

        if (!string.IsNullOrWhiteSpace(name))
            query = query.Where(s => s.Name.ToLower().Contains(name.ToLower()));
        else
            query = query.Take(20);

        var results = await query.Take(50).Select(s => new SiteDto(
            s.SiteId, s.Name, s.Npi, s.Specialty1,
            s.Phone, s.City, s.State, s.Participating
        )).ToListAsync();

        return Ok(results);
    }
}

[ApiController]
[Route("api/[controller]")]
public class HealthPlansController : ControllerBase
{
    private readonly PriorAuthDbContext _db;
    public HealthPlansController(PriorAuthDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<HealthPlanDto>>> GetAll()
    {
        var results = await _db.HealthPlans
            .Select(h => new HealthPlanDto(
                h.HealthPlanId, h.Name, h.LineOfBusiness, h.PlanType, h.PlanCode))
            .ToListAsync();
        return Ok(results);
    }
}

[ApiController]
[Route("api/[controller]")]
public class DiagnosisCodesController : ControllerBase
{
    private readonly PriorAuthDbContext _db;
    public DiagnosisCodesController(PriorAuthDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<DiagnosisCodeDto>>> Search([FromQuery] string? q)
    {
        var query = _db.DiagnosisCodes.AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(d =>
                d.Code.ToLower().Contains(q.ToLower()) ||
                d.Description.ToLower().Contains(q.ToLower()));
        else
            query = query.Take(20);

        var results = await query.Take(30)
            .Select(d => new DiagnosisCodeDto(d.Code, d.Description))
            .ToListAsync();

        return Ok(results);
    }
}

[ApiController]
[Route("api/[controller]")]
public class ProcedureCodesController : ControllerBase
{
    private readonly PriorAuthDbContext _db;
    public ProcedureCodesController(PriorAuthDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<ProcedureCodeDto>>> Search([FromQuery] string? q)
    {
        var query = _db.ProcedureCodes.AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(p =>
                p.Code.ToLower().Contains(q.ToLower()) ||
                p.Description.ToLower().Contains(q.ToLower()));
        else
            query = query.Take(20);

        var results = await query.Take(30)
            .Select(p => new ProcedureCodeDto(p.Code, p.Description))
            .ToListAsync();

        return Ok(results);
    }
}
