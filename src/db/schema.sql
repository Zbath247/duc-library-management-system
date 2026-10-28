-- DUC Library Management System Database Schema

CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_number TEXT UNIQUE NOT NULL,
    name_km TEXT NOT NULL,
    name_en TEXT NOT NULL,
    type TEXT CHECK(type IN ('student', 'staff')) NOT NULL DEFAULT 'student',
    phone TEXT,
    email TEXT,
    photo_url TEXT,
    status TEXT CHECK(status IN ('active', 'suspended')) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'librarian', 'member')) NOT NULL,
    member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    isbn TEXT,
    title_km TEXT NOT NULL,
    title_en TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT NOT NULL,
    publisher TEXT,
    publish_year INTEGER,
    shelf_location TEXT NOT NULL,
    total_copies INTEGER NOT NULL DEFAULT 1,
    available_copies INTEGER NOT NULL DEFAULT 1,
    cover_image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    borrow_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    renewal_count INTEGER DEFAULT 0,
    status TEXT CHECK(status IN ('borrowed', 'returned', 'overdue')) DEFAULT 'borrowed',
    notes TEXT,
    processed_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    reserved_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK(status IN ('pending', 'fulfilled', 'cancelled')) DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    check_out_time DATETIME,
    device_source TEXT DEFAULT 'barcode_scanner'
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indices for fast searching and constraint lookups
CREATE INDEX IF NOT EXISTS idx_members_card ON members(card_number);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_title_en ON books(title_en);
CREATE INDEX IF NOT EXISTS idx_books_title_km ON books(title_km);
CREATE INDEX IF NOT EXISTS idx_loans_member ON loans(member_id);
CREATE INDEX IF NOT EXISTS idx_loans_book ON loans(book_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_checkins_date ON checkins(check_in_time);
