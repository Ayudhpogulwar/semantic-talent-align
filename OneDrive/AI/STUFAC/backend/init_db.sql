-- ============================================================================
-- SAIOTAF DATABASE SCHEMA SETUP (MySQL 8.0+)
-- Semantic-Aware Intelligent Opportunity & Talent Alignment Framework
-- ============================================================================

CREATE DATABASE IF NOT EXISTS saiotaf_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE saiotaf_db;

-- Disable Foreign Key Checks for Clean Table Re-creation
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS certificates;
DROP TABLE IF EXISTS application_status_history;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS ngo_opportunities;
DROP TABLE IF EXISTS internships;
DROP TABLE IF EXISTS opportunities;
DROP TABLE IF EXISTS organizations;
DROP TABLE IF EXISTS student_skills;
DROP TABLE IF EXISTS faculty_profiles;
DROP TABLE IF EXISTS student_profiles;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE (Core Authentication & Role Management)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Student', 'Faculty', 'Admin', 'Organization') NOT NULL DEFAULT 'Student',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret VARCHAR(128) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. STUDENT PROFILES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE student_profiles (
    student_id INT PRIMARY KEY,
    roll_number VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    graduation_year INT NOT NULL,
    cgpa DECIMAL(3, 2) NOT NULL,
    phone_number VARCHAR(20) NULL,
    preferred_opportunity_type ENUM('Internship', 'NGO', 'Both') DEFAULT 'Both',
    verification_status ENUM('Pending', 'Approved', 'Rejected', 'Flagged') DEFAULT 'Pending',
    active_resume_id VARCHAR(64) NULL COMMENT 'MongoDB ObjectId Reference',
    placement_readiness_score DECIMAL(5, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_user FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_student_verification (verification_status),
    INDEX idx_student_dept_yr (department, graduation_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. FACULTY PROFILES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE faculty_profiles (
    faculty_id INT PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    role_permissions JSON NULL COMMENT 'Specific administrative capabilities',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_faculty_user FOREIGN KEY (faculty_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. ORGANIZATIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE organizations (
    org_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL COMMENT 'Associated user account if organization posts directly',
    name VARCHAR(255) NOT NULL,
    website VARCHAR(255) NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20) NULL,
    org_type ENUM('Corporate', 'NGO', 'Government', 'Academic') NOT NULL DEFAULT 'Corporate',
    verification_status ENUM('Pending', 'Verified', 'Rejected') DEFAULT 'Pending',
    verified_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_org_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_org_verifier FOREIGN KEY (verified_by) REFERENCES faculty_profiles(faculty_id) ON DELETE SET NULL,
    INDEX idx_org_verification (verification_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. OPPORTUNITIES TABLE (Base Entity)
-- ----------------------------------------------------------------------------
CREATE TABLE opportunities (
    opportunity_id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    opportunity_type ENUM('Internship', 'NGO') NOT NULL,
    mode ENUM('Remote', 'Onsite', 'Hybrid') NOT NULL DEFAULT 'Onsite',
    location VARCHAR(255) NULL,
    deadline DATETIME NOT NULL,
    status ENUM('Draft', 'Pending_Approval', 'Active', 'Expired', 'Closed') DEFAULT 'Pending_Approval',
    created_by INT NOT NULL COMMENT 'Faculty or Admin who approved/created',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_opp_org FOREIGN KEY (org_id) REFERENCES organizations(org_id) ON DELETE CASCADE,
    CONSTRAINT fk_opp_creator FOREIGN KEY (created_by) REFERENCES users(user_id),
    INDEX idx_opp_type_status (opportunity_type, status),
    INDEX idx_opp_deadline (deadline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. INTERNSHIPS TABLE (Specialized Extension)
-- ----------------------------------------------------------------------------
CREATE TABLE internships (
    opportunity_id INT PRIMARY KEY,
    stipend_amount DECIMAL(10, 2) NULL,
    duration_months INT NOT NULL,
    convertible_to_ppo BOOLEAN DEFAULT FALSE,
    min_cgpa DECIMAL(3, 2) DEFAULT 0.00,
    CONSTRAINT fk_internship_opp FOREIGN KEY (opportunity_id) REFERENCES opportunities(opportunity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. NGO OPPORTUNITIES TABLE (Specialized Extension)
-- ----------------------------------------------------------------------------
CREATE TABLE ngo_opportunities (
    opportunity_id INT PRIMARY KEY,
    cause_area VARCHAR(150) NOT NULL COMMENT 'e.g., Education, Environment, Healthcare',
    is_volunteer BOOLEAN DEFAULT TRUE,
    stipend_amount DECIMAL(10, 2) DEFAULT 0.00,
    duration_weeks INT NOT NULL,
    impact_description TEXT NULL,
    CONSTRAINT fk_ngo_opp FOREIGN KEY (opportunity_id) REFERENCES opportunities(opportunity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. APPLICATIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE applications (
    application_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    opportunity_id INT NOT NULL,
    resume_id VARCHAR(64) NOT NULL COMMENT 'Snapshot of MongoDB resume ObjectId used at application time',
    cover_note TEXT NULL,
    current_status ENUM('Applied', 'Under_Review', 'Shortlisted', 'Interview', 'Offered', 'Rejected', 'Completed') DEFAULT 'Applied',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_app_student FOREIGN KEY (student_id) REFERENCES student_profiles(student_id) ON DELETE CASCADE,
    CONSTRAINT fk_app_opp FOREIGN KEY (opportunity_id) REFERENCES opportunities(opportunity_id) ON DELETE CASCADE,
    UNIQUE KEY uq_student_opportunity (student_id, opportunity_id),
    INDEX idx_app_status (current_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. APPLICATION STATUS HISTORY TABLE (Audit Trail State Machine)
-- ----------------------------------------------------------------------------
CREATE TABLE application_status_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    previous_status ENUM('Applied', 'Under_Review', 'Shortlisted', 'Interview', 'Offered', 'Rejected', 'Completed') NULL,
    new_status ENUM('Applied', 'Under_Review', 'Shortlisted', 'Interview', 'Offered', 'Rejected', 'Completed') NOT NULL,
    changed_by INT NOT NULL COMMENT 'User ID of actor who triggered status change',
    remarks VARCHAR(255) NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ash_app FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE,
    CONSTRAINT fk_ash_user FOREIGN KEY (changed_by) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. CERTIFICATES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE certificates (
    certificate_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    opportunity_id INT NULL COMMENT 'Optional link to on-platform opportunity',
    issuing_organization VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    file_uri VARCHAR(512) NOT NULL,
    verification_status ENUM('Pending', 'Verified', 'Rejected') DEFAULT 'Pending',
    verified_by INT NULL,
    verified_at DATETIME NULL,
    rejection_reason VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cert_student FOREIGN KEY (student_id) REFERENCES student_profiles(student_id) ON DELETE CASCADE,
    CONSTRAINT fk_cert_opp FOREIGN KEY (opportunity_id) REFERENCES opportunities(opportunity_id) ON DELETE SET NULL,
    CONSTRAINT fk_cert_verifier FOREIGN KEY (verified_by) REFERENCES faculty_profiles(faculty_id) ON DELETE SET NULL,
    INDEX idx_cert_status (verification_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. AUDIT LOGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action_type VARCHAR(100) NOT NULL COMMENT 'e.g., VERIFY_STUDENT, APPROVE_OPPORTUNITY',
    entity_affected VARCHAR(100) NOT NULL,
    entity_id INT NOT NULL,
    details JSON NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_audit_action (action_type),
    INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SAIOTAF DML SAMPLE DATA SEEDING SCRIPT
-- ============================================================================

-- 1. Insert Core Users
INSERT INTO users (user_id, email, password_hash, role, is_active, is_verified, mfa_enabled) VALUES
(1, 'ananya.s@college.edu', '$2b$12$eImiTXuWVxfM37uY4JANjO2ZfW9X2m2kF8a2A2h1W5eG5f5S5S5S5', 'Student', TRUE, TRUE, FALSE),
(2, 'rahul.k@college.edu', '$2b$12$eImiTXuWVxfM37uY4JANjO2ZfW9X2m2kF8a2A2h1W5eG5f5S5S5S5', 'Student', TRUE, TRUE, FALSE),
(3, 'dr.rao@college.edu', '$2b$12$eImiTXuWVxfM37uY4JANjO2ZfW9X2m2kF8a2A2h1W5eG5f5S5S5S5', 'Faculty', TRUE, TRUE, TRUE),
(4, 'recruiter@techcorp.com', '$2b$12$eImiTXuWVxfM37uY4JANjO2ZfW9X2m2kF8a2A2h1W5eG5f5S5S5S5', 'Organization', TRUE, TRUE, FALSE),
(5, 'contact@greenearth.org', '$2b$12$eImiTXuWVxfM37uY4JANjO2ZfW9X2m2kF8a2A2h1W5eG5f5S5S5S5', 'Organization', TRUE, TRUE, FALSE);

-- 2. Insert Faculty Profiles
INSERT INTO faculty_profiles (faculty_id, employee_id, first_name, last_name, department, designation, role_permissions) VALUES
(3, 'EMP-9021', 'Dr. S.', 'Rao', 'Computer Science & Engineering', 'Training & Placement Officer', '{"can_verify_students": true, "can_approve_jobs": true, "can_verify_certs": true}');

-- 3. Insert Student Profiles
INSERT INTO student_profiles (student_id, roll_number, first_name, last_name, department, graduation_year, cgpa, phone_number, preferred_opportunity_type, verification_status, active_resume_id, placement_readiness_score) VALUES
(1, '2023CS1082', 'Ananya', 'Sharma', 'Computer Science & Engineering', 2027, 8.85, '+919876543210', 'Both', 'Approved', '66b5c1a8f9d3e214a1000001', 84.50),
(2, '2023IT1045', 'Rahul', 'Kumar', 'Information Technology', 2027, 7.90, '+919876543211', 'Internship', 'Approved', '66b5c1a8f9d3e214a1000002', 68.20);

-- 4. Insert Organizations
INSERT INTO organizations (org_id, user_id, name, website, contact_email, contact_phone, org_type, verification_status, verified_by) VALUES
(1, 4, 'InnovateTech Solutions', 'https://innovatetech.io', 'recruiter@techcorp.com', '+15550192834', 'Corporate', 'Verified', 3),
(2, 5, 'GreenEarth Foundation', 'https://greenearth.org', 'contact@greenearth.org', '+15550195555', 'NGO', 'Verified', 3);

-- 5. Insert Base Opportunities
INSERT INTO opportunities (opportunity_id, org_id, title, description, opportunity_type, mode, location, deadline, status, created_by) VALUES
(101, 1, 'Backend Engineering Intern', 'Develop scalable REST APIs using Express/Node.js and Python. Integrate SQL databases and optimize vector search pipelines.', 'Internship', 'Hybrid', 'Bangalore', '2026-09-30 23:59:59', 'Active', 3),
(102, 2, 'Community Data Analyst', 'Analyze regional environmental data, build public dashboards, and assist in automated survey aggregation.', 'NGO', 'Remote', 'Remote', '2026-09-15 23:59:59', 'Active', 3);

-- 6. Insert Specialized Internship Details
INSERT INTO internships (opportunity_id, stipend_amount, duration_months, convertible_to_ppo, min_cgpa) VALUES
(101, 35000.00, 6, TRUE, 7.50);

-- 7. Insert Specialized NGO Details
INSERT INTO ngo_opportunities (opportunity_id, cause_area, is_volunteer, stipend_amount, duration_weeks, impact_description) VALUES
(102, 'Environment & Sustainability', FALSE, 10000.00, 12, 'Empower local climate action through data-driven environmental mapping.');

-- 8. Insert Applications
INSERT INTO applications (application_id, student_id, opportunity_id, resume_id, cover_note, current_status, applied_at) VALUES
(1, 1, 101, '66b5c1a8f9d3e214a1000001', 'I have strong experience with Express.js REST APIs and MongoDB vector search.', 'Shortlisted', '2026-08-01 10:30:00'),
(2, 2, 101, '66b5c1a8f9d3e214a1000002', 'Eager to contribute to backend development.', 'Under_Review', '2026-08-02 14:15:00'),
(3, 1, 102, '66b5c1a8f9d3e214a1000001', 'Passionate about leveraging Python for environmental sustainability.', 'Applied', '2026-08-05 09:00:00');

-- 9. Insert Application Status History
INSERT INTO application_status_history (history_id, application_id, previous_status, new_status, changed_by, remarks) VALUES
(1, 1, NULL, 'Applied', 1, 'Initial application submitted by student.'),
(2, 1, 'Applied', 'Under_Review', 3, 'Application routed to T&PO review queue.'),
(3, 1, 'Under_Review', 'Shortlisted', 3, 'Semantic fit score > 85%. Shortlisted for technical round.');

-- 10. Insert Certificates
INSERT INTO certificates (certificate_id, student_id, opportunity_id, issuing_organization, title, file_uri, verification_status, verified_by, verified_at) VALUES
(1, 1, NULL, 'Coursera - DeepLearning.AI', 'Natural Language Processing Specialization', 'https://storage.college.edu/certs/ananya_nlp_2026.pdf', 'Verified', 3, '2026-07-20 11:00:00');

-- 11. Insert Audit Logs
INSERT INTO audit_logs (log_id, user_id, action_type, entity_affected, entity_id, details) VALUES
(1, 3, 'VERIFY_STUDENT', 'student_profiles', 1, '{"status": "Approved", "reason": "Academic records verified against registrar database."}');
