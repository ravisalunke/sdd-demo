using Microsoft.EntityFrameworkCore;
using PriorAuth.API.Models;

namespace PriorAuth.API.Data;

public class PriorAuthDbContext : DbContext
{
    public PriorAuthDbContext(DbContextOptions<PriorAuthDbContext> options) : base(options) { }

    public DbSet<HealthPlan> HealthPlans => Set<HealthPlan>();
    public DbSet<ProcedureCode> ProcedureCodes => Set<ProcedureCode>();
    public DbSet<DiagnosisCode> DiagnosisCodes => Set<DiagnosisCode>();
    public DbSet<Member> Members => Set<Member>();
    public DbSet<Provider> Providers => Set<Provider>();
    public DbSet<Site> Sites => Set<Site>();
    public DbSet<Authorization> Authorizations => Set<Authorization>();
    public DbSet<AuthorizationProcedure> AuthorizationProcedures => Set<AuthorizationProcedure>();
    public DbSet<AuthorizationDiagnosis> AuthorizationDiagnoses => Set<AuthorizationDiagnosis>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Authorization → Member
        modelBuilder.Entity<Authorization>()
            .HasOne(a => a.Member)
            .WithMany()
            .HasForeignKey(a => a.PatientId)
            .OnDelete(DeleteBehavior.SetNull);

        // Authorization → Provider
        modelBuilder.Entity<Authorization>()
            .HasOne(a => a.Provider)
            .WithMany()
            .HasForeignKey(a => a.PhysicianId)
            .OnDelete(DeleteBehavior.SetNull);

        // Authorization → HealthPlan
        modelBuilder.Entity<Authorization>()
            .HasOne(a => a.HealthPlan)
            .WithMany()
            .HasForeignKey(a => a.HealthPlanId)
            .OnDelete(DeleteBehavior.SetNull);

        // Authorization → Site
        modelBuilder.Entity<Authorization>()
            .HasOne(a => a.Site)
            .WithMany()
            .HasForeignKey(a => a.SiteId)
            .OnDelete(DeleteBehavior.SetNull);

        // Authorization → Primary Diagnosis
        modelBuilder.Entity<Authorization>()
            .HasOne(a => a.PrimaryDiagnosisCode)
            .WithMany()
            .HasForeignKey(a => a.PrimaryDiagnosis)
            .OnDelete(DeleteBehavior.SetNull);

        // Authorization → Procedures
        modelBuilder.Entity<AuthorizationProcedure>()
            .HasOne(ap => ap.Procedure)
            .WithMany()
            .HasForeignKey(ap => ap.ProcedureCode)
            .OnDelete(DeleteBehavior.Restrict);

        // Authorization → Diagnoses
        modelBuilder.Entity<AuthorizationDiagnosis>()
            .HasOne(ad => ad.Diagnosis)
            .WithMany()
            .HasForeignKey(ad => ad.DiagnosisCode)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
