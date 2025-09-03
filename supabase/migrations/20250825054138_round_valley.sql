-- Smart Study Material Platform Database Schema
-- Production-ready MySQL database structure

-- Users table with comprehensive user management
CREATE TABLE users (
    user_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role ENUM('admin', 'teacher', 'student') NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    whatsapp_number VARCHAR(20),
    academic_year YEAR,
    current_semester INT CHECK (current_semester BETWEEN 1 AND 8),
    is_active BOOLEAN DEFAULT TRUE,
    force_password_change BOOLEAN DEFAULT FALSE,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_role (role),
    INDEX idx_active (is_active),
    INDEX idx_academic (academic_year, current_semester)
);

-- Materials table for study content management
CREATE TABLE materials (
    material_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    semester INT CHECK (semester BETWEEN 1 AND 8) NOT NULL,
    academic_year YEAR NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(50),
    uploaded_by VARCHAR(20) NOT NULL,
    tags TEXT,
    description TEXT,
    download_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_semester_year (semester, academic_year),
    INDEX idx_subject (subject),
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_active (is_active),
    FULLTEXT idx_search (title, description, tags)
);

-- Material access control for student assignments
CREATE TABLE material_access (
    access_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(20) NOT NULL,
    material_id INT NOT NULL,
    assigned_by VARCHAR(20) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(material_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_material (user_id, material_id),
    INDEX idx_user_active (user_id, is_active),
    INDEX idx_material (material_id),
    INDEX idx_assigned_by (assigned_by)
);

-- Delivery logs for tracking material distribution
CREATE TABLE delivery_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(20) NOT NULL,
    material_id INT NOT NULL,
    delivery_channel ENUM('email', 'whatsapp', 'both') NOT NULL,
    recipient_email VARCHAR(255),
    recipient_whatsapp VARCHAR(20),
    status ENUM('pending', 'sent', 'failed') NOT NULL DEFAULT 'pending',
    error_message TEXT,
    retry_count INT DEFAULT 0,
    delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(material_id) ON DELETE CASCADE,
    INDEX idx_user_status (user_id, status),
    INDEX idx_material (material_id),
    INDEX idx_status_date (status, delivered_at),
    INDEX idx_delivery_channel (delivery_channel)
);

-- Comprehensive audit trail for compliance
CREATE TABLE audit_trail (
    audit_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(20),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id VARCHAR(100),
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user_action (user_id, action),
    INDEX idx_target (target_type, target_id),
    INDEX idx_created_at (created_at),
    INDEX idx_action (action)
);

-- Session management for JWT tokens
CREATE TABLE user_sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL,
    refresh_token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_active (user_id, is_active),
    INDEX idx_expires (expires_at),
    INDEX idx_refresh_token (refresh_token(255))
);

-- System settings for configuration management
CREATE TABLE system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_by VARCHAR(20),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Email queue for reliable delivery
CREATE TABLE email_queue (
    queue_id INT PRIMARY KEY AUTO_INCREMENT,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    template_name VARCHAR(100),
    template_data JSON,
    priority INT DEFAULT 5,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    error_message TEXT,
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_status_priority (status, priority),
    INDEX idx_scheduled (scheduled_at),
    INDEX idx_recipient (recipient_email)
);

-- Insert default admin user
INSERT INTO users (
    user_id, 
    name, 
    email, 
    role, 
    password_hash,
    is_active,
    force_password_change
) VALUES (
    'ADMIN001',
    'System Administrator',
    'admin@studyplatform.edu',
    'admin',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VJWZp/K/K', -- password: admin123
    TRUE,
    FALSE
);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('max_login_attempts', '5', 'number', 'Maximum failed login attempts before account lockout', FALSE),
('lockout_duration_minutes', '15', 'number', 'Account lockout duration in minutes', FALSE),
('password_min_length', '8', 'number', 'Minimum password length requirement', FALSE),
('session_timeout_minutes', '120', 'number', 'Session timeout in minutes', FALSE),
('jwt_secret_key', 'your-super-secret-jwt-key-change-in-production', 'string', 'JWT signing secret', FALSE),
('email_from_address', 'noreply@studyplatform.edu', 'string', 'Default from email address', FALSE),
('whatsapp_api_url', 'https://api.whatsapp.com/send', 'string', 'WhatsApp API endpoint', FALSE),
('file_upload_max_size', '52428800', 'number', 'Maximum file upload size in bytes (50MB)', FALSE),
('allowed_file_types', '["pdf", "doc", "docx", "ppt", "pptx", "txt", "jpg", "png"]', 'json', 'Allowed file types for upload', FALSE);

-- Create views for common queries
CREATE VIEW active_users AS
SELECT 
    user_id,
    name,
    email,
    role,
    academic_year,
    current_semester,
    last_login,
    created_at
FROM users 
WHERE is_active = TRUE;

CREATE VIEW student_materials AS
SELECT 
    m.*,
    u.name as uploaded_by_name,
    ma.assigned_at,
    ma.assigned_by
FROM materials m
JOIN users u ON m.uploaded_by = u.user_id
LEFT JOIN material_access ma ON m.material_id = ma.material_id
WHERE m.is_active = TRUE;

CREATE VIEW delivery_summary AS
SELECT 
    u.user_id,
    u.name as student_name,
    m.title as material_title,
    dl.delivery_channel,
    dl.status,
    dl.delivered_at
FROM delivery_logs dl
JOIN users u ON dl.user_id = u.user_id
JOIN materials m ON dl.material_id = m.material_id
ORDER BY dl.delivered_at DESC;