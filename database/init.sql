-- =============================================================
-- ABC Healthcare Prior Authorization System
-- PostgreSQL Schema + Seed Data
-- =============================================================

-- ─── MASTER TABLES ────────────────────────────────────────────

CREATE TABLE health_plans (
    health_plan_id  SERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    ins_plan_code   VARCHAR(50),
    line_of_business VARCHAR(100),
    plan_type       VARCHAR(50),
    entity          VARCHAR(100),
    plan_code       VARCHAR(50)
);

CREATE TABLE procedure_codes (
    procedure_code  VARCHAR(20) PRIMARY KEY,
    description     VARCHAR(500) NOT NULL
);

CREATE TABLE diagnosis_codes (
    diagnosis_code  VARCHAR(20) PRIMARY KEY,
    description     VARCHAR(500) NOT NULL
);

CREATE TABLE members (
    patient_id      VARCHAR(20) PRIMARY KEY,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    date_of_birth   DATE,
    gender          CHAR(1),
    language_code   VARCHAR(10),
    address_line1   VARCHAR(200),
    address_line2   VARCHAR(200),
    city            VARCHAR(100),
    state           CHAR(2),
    zip_code        VARCHAR(10),
    phone           VARCHAR(20),
    email_address   VARCHAR(200),
    member_code     VARCHAR(50),
    group_number    VARCHAR(50),
    ipa_code        VARCHAR(50),
    plan_code       VARCHAR(50)
);

CREATE TABLE providers (
    physician_id    VARCHAR(20) PRIMARY KEY,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    npi             VARCHAR(20),
    tin             VARCHAR(20),
    specialty1      VARCHAR(100),
    specialty2      VARCHAR(100),
    address_line1   VARCHAR(200),
    address_line2   VARCHAR(200),
    city            VARCHAR(100),
    state           CHAR(2),
    zip_code        VARCHAR(10),
    phone           VARCHAR(20),
    fax             VARCHAR(20),
    email_address   VARCHAR(200),
    cell_phone      VARCHAR(20)
);

CREATE TABLE sites (
    site_id         VARCHAR(20) PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    npi             VARCHAR(20),
    tin             VARCHAR(20),
    specialty1      VARCHAR(100),
    specialty2      VARCHAR(100),
    address_line1   VARCHAR(200),
    address_line2   VARCHAR(200),
    city            VARCHAR(100),
    state           CHAR(2),
    zip_code        VARCHAR(10),
    phone           VARCHAR(20),
    fax             VARCHAR(20),
    participating   BOOLEAN DEFAULT true,
    steerage_flag   VARCHAR(10)
);

-- ─── TRANSACTIONAL TABLES ──────────────────────────────────────

CREATE TABLE authorizations (
    authorization_id    SERIAL PRIMARY KEY,
    reference_number    VARCHAR(30) UNIQUE NOT NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    program             VARCHAR(100),
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Member
    patient_id          VARCHAR(20) REFERENCES members(patient_id),

    -- Provider
    physician_id        VARCHAR(20) REFERENCES providers(physician_id),

    -- Health Plan
    health_plan_id      INTEGER REFERENCES health_plans(health_plan_id),

    -- Site
    site_id             VARCHAR(20) REFERENCES sites(site_id),

    -- Clinical
    primary_diagnosis   VARCHAR(20) REFERENCES diagnosis_codes(diagnosis_code),
    notes               TEXT
);

CREATE TABLE authorization_procedures (
    id                  SERIAL PRIMARY KEY,
    authorization_id    INTEGER NOT NULL REFERENCES authorizations(authorization_id) ON DELETE CASCADE,
    procedure_code      VARCHAR(20) NOT NULL REFERENCES procedure_codes(procedure_code),
    quantity            INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE authorization_diagnoses (
    id                  SERIAL PRIMARY KEY,
    authorization_id    INTEGER NOT NULL REFERENCES authorizations(authorization_id) ON DELETE CASCADE,
    diagnosis_code      VARCHAR(20) NOT NULL REFERENCES diagnosis_codes(diagnosis_code),
    is_primary          BOOLEAN NOT NULL DEFAULT false
);

-- Reference number generator
CREATE SEQUENCE auth_ref_seq START 100001;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER authorizations_updated_at
    BEFORE UPDATE ON authorizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── SEED DATA ─────────────────────────────────────────────────

INSERT INTO health_plans (name, ins_plan_code, line_of_business, plan_type, entity, plan_code) VALUES
('Cigna Health',         'CIG001', 'Commercial',  'PPO',  'Cigna Corp',    'CIGNA'),
('Aetna Better Health',  'AET001', 'Medicaid',    'HMO',  'Aetna Inc',     'AETNA'),
('UnitedHealthcare',     'UHC001', 'Commercial',  'EPO',  'UHG',           'UHC'),
('Blue Shield of CA',    'BSC001', 'Commercial',  'PPO',  'Blue Shield',   'BSCA'),
('Anthem Blue Cross',    'ANT001', 'Medicare',    'HMO',  'Anthem Inc',    'ANTHEM'),
('Molina Healthcare',    'MOL001', 'Medicaid',    'HMO',  'Molina',        'MOLINA');

INSERT INTO procedure_codes VALUES
('99213', 'Office Visit – Established Patient, Low Complexity'),
('99214', 'Office Visit – Established Patient, Moderate Complexity'),
('99215', 'Office Visit – Established Patient, High Complexity'),
('27447', 'Total Knee Arthroplasty'),
('27130', 'Total Hip Arthroplasty'),
('43239', 'EGD with Biopsy'),
('70553', 'MRI Brain with and without Contrast'),
('93306', 'Echocardiography with Doppler'),
('29827', 'Arthroscopy Shoulder – Rotator Cuff Repair'),
('64483', 'Lumbar Epidural Steroid Injection'),
('90837', 'Psychotherapy 60 Minutes'),
('96413', 'Chemotherapy Administration – Intravenous Push');

INSERT INTO diagnosis_codes VALUES
('M17.11', 'Primary osteoarthritis, right knee'),
('M17.12', 'Primary osteoarthritis, left knee'),
('M16.11', 'Primary osteoarthritis, right hip'),
('I10',    'Essential (primary) hypertension'),
('E11.9',  'Type 2 diabetes mellitus without complications'),
('J18.9',  'Pneumonia, unspecified organism'),
('F32.1',  'Major depressive disorder, single episode, moderate'),
('M54.5',  'Low back pain'),
('K21.0',  'Gastro-esophageal reflux disease with esophagitis'),
('G43.909','Migraine, unspecified, not intractable'),
('Z12.31', 'Encounter for screening mammogram for malignant neoplasm of breast'),
('C18.9',  'Malignant neoplasm of colon, unspecified');

INSERT INTO members VALUES
('PT001234', 'John',   'Doe',      '1985-03-15', 'M', 'EN', '123 Main St',     NULL,        'Los Angeles', 'CA', '90001', '213-555-0101', 'john.doe@email.com',    'MBR10001', 'GRP001', 'IPA01', 'CIGNA'),
('PT001235', 'Jane',   'Smith',    '1990-07-22', 'F', 'EN', '456 Oak Avenue',  'Apt 2B',    'San Diego',   'CA', '92101', '619-555-0102', 'jane.smith@email.com',  'MBR10002', 'GRP001', 'IPA01', 'AETNA'),
('PT001236', 'Robert', 'Johnson',  '1978-11-08', 'M', 'EN', '789 Pine Road',   NULL,        'Sacramento',  'CA', '94203', '916-555-0103', 'robert.j@email.com',    'MBR10003', 'GRP002', 'IPA02', 'UHC'),
('PT001237', 'Mary',   'Williams', '1992-05-30', 'F', 'ES', '321 Elm Street',  'Unit 5',    'Fresno',      'CA', '93722', '559-555-0104', 'mary.w@email.com',      'MBR10004', 'GRP002', 'IPA02', 'BSCA'),
('PT001238', 'David',  'Brown',    '1965-09-12', 'M', 'EN', '654 Maple Drive', NULL,        'Oakland',     'CA', '94612', '510-555-0105', 'david.b@email.com',     'MBR10005', 'GRP003', 'IPA03', 'ANTHEM'),
('PT001239', 'Susan',  'Davis',    '1958-01-25', 'F', 'EN', '987 Cedar Lane',  NULL,        'San Jose',    'CA', '95128', '408-555-0106', 'susan.d@email.com',     'MBR10006', 'GRP003', 'IPA03', 'MOLINA');

INSERT INTO providers VALUES
('PHY001', 'Michael', 'Anderson', '1234567890', '12-3456789', 'Orthopedic Surgery', 'Sports Medicine',  '100 Medical Plaza',   NULL,       'Los Angeles', 'CA', '90024', '310-555-2001', '310-555-2002', 'dr.anderson@clinic.com', '310-555-2003'),
('PHY002', 'Sarah',   'Martinez',  '2345678901', '23-4567890', 'Internal Medicine',  'Primary Care',     '200 Health Center Dr', 'Suite 10', 'San Diego',   'CA', '92122', '619-555-2004', '619-555-2005', 'dr.martinez@health.com', '619-555-2006'),
('PHY003', 'James',   'Wilson',    '3456789012', '34-5678901', 'Cardiology',         NULL,               '300 Heart Institute',  NULL,       'Sacramento',  'CA', '94229', '916-555-2007', '916-555-2008', 'dr.wilson@cardio.com',   '916-555-2009'),
('PHY004', 'Lisa',    'Thompson',  '4567890123', '45-6789012', 'Gastroenterology',   NULL,               '400 GI Specialists',   'Floor 3',  'San Jose',    'CA', '95110', '408-555-2010', '408-555-2011', 'dr.thompson@gi.com',     '408-555-2012'),
('PHY005', 'Kevin',   'Garcia',    '5678901234', '56-7890123', 'Psychiatry',         'Behavioral Health','500 Mental Health Blvd', NULL,      'Oakland',     'CA', '94609', '510-555-2013', '510-555-2014', 'dr.garcia@psych.com',    '510-555-2015');

INSERT INTO sites VALUES
('SITE001', 'ABC Medical Center',       '0987654321', '98-7654321', 'Multi-Specialty', NULL,              '100 Medical Plaza',    NULL,       'Los Angeles', 'CA', '90024', '310-555-3001', '310-555-3002', true,  'Y'),
('SITE002', 'Coastal Health Clinic',    '1098765432', '10-9876543', 'Primary Care',    NULL,              '200 Coastal Hwy',      'Ste 5',    'San Diego',   'CA', '92037', '619-555-3003', '619-555-3004', true,  'N'),
('SITE003', 'Valley Surgical Center',   '2109876543', '21-0987654', 'Surgical',        'Orthopedics',     '300 Valley Road',      NULL,       'Sacramento',  'CA', '94203', '916-555-3005', '916-555-3006', true,  'Y'),
('SITE004', 'Bay Area Heart Institute', '3210987654', '32-1098765', 'Cardiology',      NULL,              '400 Bay Bridge Blvd',  'Level 2',  'Oakland',     'CA', '94607', '510-555-3007', '510-555-3008', false, 'N'),
('SITE005', 'Central Valley Hospital',  '4321098765', '43-2109876', 'Hospital',        'Multi-Specialty', '500 Central Ave',      NULL,       'Fresno',      'CA', '93721', '559-555-3009', '559-555-3010', true,  'Y');
