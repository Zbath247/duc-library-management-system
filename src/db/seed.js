import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { runMigration } from './migrate.js';

export function runSeed() {
  console.log('[Seed] Seeding realistic sample data for DUC Library...');
  runMigration();

  // Clean existing data for a fresh seed
  db.exec(`
    DELETE FROM audit_logs;
    DELETE FROM checkins;
    DELETE FROM reservations;
    DELETE FROM loans;
    DELETE FROM sessions;
    DELETE FROM users;
    DELETE FROM members;
    DELETE FROM books;
    DELETE FROM settings;
    DELETE FROM sqlite_sequence WHERE name IN ('users', 'members', 'books', 'loans', 'reservations', 'checkins', 'audit_logs');
  `);

  // 1. Seed Settings
  const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  const defaultSettings = [
    ['library_name_en', 'Digital University of Cambodia Library'],
    ['library_name_km', 'បណ្ណាល័យសាកលវិទ្យាល័យឌីជីថលកម្ពុជា'],
    ['student_loan_days', '14'],
    ['staff_loan_days', '30'],
    ['max_books_student', '5'],
    ['max_books_staff', '10'],
    ['telegram_bot_token', ''],
    ['telegram_chat_id', ''],
    ['auto_backup_enabled', 'true']
  ];
  for (const [k, v] of defaultSettings) {
    insertSetting.run(k, v);
  }

  // 2. Seed Members (25 realistic members: students and staff)
  const insertMember = db.prepare(`
    INSERT INTO members (card_number, name_km, name_en, type, phone, email, photo_url, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const membersData = [
    ['DUC-M2026-0001', 'ចាន់ វណ្ណា', 'Vanna Chan', 'student', '012-345-671', 'vanna.chan@student.duc.edu.kh', null, 'active'],
    ['DUC-M2026-0002', 'សុខ សុភាព', 'Sopheap Sok', 'student', '010-456-782', 'sopheap.sok@student.duc.edu.kh', null, 'active'],
    ['DUC-M2026-0003', 'កែវ ពិសិដ្ឋ', 'Piseth Keo', 'student', '097-567-893', 'piseth.keo@student.duc.edu.kh', null, 'active'],
    ['DUC-M2026-0004', 'ម៉េង ធីតា', 'Thida Meng', 'student', '015-678-904', 'thida.meng@student.duc.edu.kh', null, 'active'],
    ['DUC-M2026-0005', 'ហេង រតនា', 'Rathana Heng', 'student', '011-789-015', 'rathana.heng@student.duc.edu.kh', null, 'active'],
    ['DUC-M2026-0006', 'លឹម ដារ៉ា', 'Dara Lim', 'student', '077-890-126', 'dara.lim@student.duc.edu.kh', null, 'active'],
    ['DUC-M2026-0007', 'ជា ស្រីពៅ', 'Sreypov Chea', 'student', '089-901-237', 'sreypov.chea@student.duc.edu.kh', null, 'active'],
    ['DUC-M2026-0008', 'អ៊ុច វិបុល', 'Vibol Ouch', 'student', '092-012-348', 'vibol.ouch@student.duc.edu.kh', null, 'active'],
    ['DUC-M2026-0009', 'ស៊ុន ម៉ាលី', 'Maly Sun', 'student', '098-123-459', 'maly.sun@student.duc.edu.kh', null, 'active'],
    ['DUC-M2026-0010', 'សេង បូរី', 'Borey Seng', 'student', '086-234-560', 'borey.seng@student.duc.edu.kh', null, 'active'],
    ['DUC-M2026-0011', 'នួន សុខឃីម', 'Sokkhim Nuon', 'student', '012-765-431', 'sokkhim.nuon@student.duc.edu.kh', null, 'active'],
    ['DUC-M2026-0012', 'ប្រាក់ វិចិត្រ', 'Vichet Prak', 'student', '016-876-542', 'vichet.prak@student.duc.edu.kh', null, 'active'],
    ['DUC-M2026-0013', 'ឃួន ស្រីនីត', 'Sreynit Khuon', 'student', '078-987-653', 'sreynit.khuon@student.duc.edu.kh', null, 'active'],
    ['DUC-M2026-0014', 'ទៀង សំណាង', 'Samnang Tieng', 'student', '093-098-764', 'samnang.tieng@student.duc.edu.kh', null, 'active'],
    ['DUC-M2026-0015', 'ឡុង ពិសី', 'Pisei Long', 'student', '017-109-875', 'pisei.long@student.duc.edu.kh', null, 'active'],
    ['DUC-M2026-0016', 'អ៊ឹម គន្ធា', 'Kunthea Im', 'student', '010-210-986', 'kunthea.im@student.duc.edu.kh', null, 'active'],
    ['DUC-M2026-0017', 'ផន ពិសាល', 'Pisal Phorn', 'student', '095-321-097', 'pisal.phorn@student.duc.edu.kh', null, 'active'],
    ['DUC-M2026-0018', 'ទូច រក្សា', 'Raksa Touch', 'student', '088-432-108', 'raksa.touch@student.duc.edu.kh', null, 'active'],
    ['DUC-M2026-0019', 'សូត្រ វីរៈ', 'Virak Sotr', 'student', '012-543-219', 'virak.sotr@student.duc.edu.kh', null, 'active'],
    ['DUC-M2026-0020', 'យីង ចិន្តា', 'Chenda Ying', 'student', '070-654-320', 'chenda.ying@student.duc.edu.kh', null, 'active'],
    // Staff / Faculty Members
    ['DUC-M2026-0101', 'បណ្ឌិត ស៊ុំ សុវណ្ណ', 'Dr. Sovann Sum', 'staff', '012-888-001', 'sovann.sum@duc.edu.kh', null, 'active'],
    ['DUC-M2026-0102', 'សាស្ត្រាចារ្យ គង់ ណារិទ្ធ', 'Prof. Narith Kong', 'staff', '012-888-002', 'narith.kong@duc.edu.kh', null, 'active'],
    ['DUC-M2026-0103', 'លោកស្រី ជា សុខា', 'Ms. Sokha Chea', 'staff', '012-888-003', 'sokha.chea@duc.edu.kh', null, 'active'],
    ['DUC-M2026-0104', 'លោក វ៉ាន់ សុផល', 'Mr. Sophal Van', 'staff', '012-888-004', 'sophal.van@duc.edu.kh', null, 'active'],
    ['DUC-M2026-0105', 'បណ្ឌិត អ៊ុក មុនី', 'Dr. Mony Ouk', 'staff', '012-888-005', 'mony.ouk@duc.edu.kh', null, 'active']
  ];

  const memberIds = {};
  for (const m of membersData) {
    const res = insertMember.run(...m);
    memberIds[m[0]] = Number(res.lastInsertRowid);
  }

  // 3. Seed Users with bcrypt
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('admin123', salt);
  const libHash = bcrypt.hashSync('lib123', salt);
  const memberHash = bcrypt.hashSync('student123', salt);

  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, full_name, role, member_id)
    VALUES (?, ?, ?, ?, ?)
  `);

  const adminUser = insertUser.run('admin', adminHash, 'DUC Administrator', 'admin', null);
  const adminId = Number(adminUser.lastInsertRowid);
  const libUser = insertUser.run('librarian', libHash, 'ជា សុខា (Sokha Chea)', 'librarian', memberIds['DUC-M2026-0103']);
  const libId = Number(libUser.lastInsertRowid);
  insertUser.run('student1', memberHash, 'ចាន់ វណ្ណា (Vanna Chan)', 'member', memberIds['DUC-M2026-0001']);
  insertUser.run('student2', memberHash, 'សុខ សុភាព (Sopheap Sok)', 'member', memberIds['DUC-M2026-0002']);

  // 4. Seed 35 Realistic Books (Khmer & English titles, diverse categories)
  const insertBook = db.prepare(`
    INSERT INTO books (isbn, title_km, title_en, author, category, publisher, publish_year, shelf_location, total_copies, available_copies, cover_image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const booksData = [
    ['978-0132350884', 'កូដស្អាត៖ មគ្គុទ្ទេសក៍កម្មវិធីសរសើរសុទ្ធ', 'Clean Code: A Handbook of Agile Software Craftsmanship', 'Robert C. Martin', 'Computer Science', 'Prentice Hall', 2008, 'Shelf A-01', 5, 4, null],
    ['978-0134685991', 'ចង្កោមការរចនាប្រព័ន្ធដែលមានប្រសិទ្ធភាព', 'Effective Java (3rd Edition)', 'Joshua Bloch', 'Software Engineering', 'Addison-Wesley', 2018, 'Shelf A-02', 4, 3, null],
    ['978-0262033848', 'សេចក្តីផ្តើមនៃក្បួនដោះស្រាយទិន្នន័យ (ក្បួនកុំព្យូទ័រ)', 'Introduction to Algorithms (CLRS)', 'Thomas H. Cormen et al.', 'Computer Science', 'MIT Press', 2009, 'Shelf A-03', 6, 5, null],
    ['978-1491950357', 'ការរចនាប្រព័ន្ធទិន្នន័យពឹងផ្អែកខ្ពស់', 'Designing Data-Intensive Applications', 'Martin Kleppmann', 'Database Systems', "O'Reilly Media", 2017, 'Shelf B-01', 4, 3, null],
    ['978-1491957660', 'ភាសា Python សម្រាប់វិភាគទិន្នន័យ', 'Python for Data Analysis (3rd Edition)', 'Wes McKinney', 'Data Science', "O'Reilly Media", 2022, 'Shelf B-02', 5, 4, null],
    ['978-0135957059', 'អ្នកសរសេរកម្មវិធីជាក់ស្តែង', 'The Pragmatic Programmer: 20th Anniversary Edition', 'David Thomas, Andrew Hunt', 'Software Engineering', 'Addison-Wesley', 2019, 'Shelf A-04', 4, 3, null],
    ['978-0596517748', 'ភាសា JavaScript៖ ផ្នែកដ៏ល្អប្រណិត', 'JavaScript: The Good Parts', 'Douglas Crockford', 'Web Development', "O'Reilly Media", 2008, 'Shelf B-03', 3, 3, null],
    ['978-1492053743', 'ស្វែងយល់ពី React រហ័ស និងមានប្រសិទ្ធភាព', 'Learning React (2nd Edition)', 'Alex Banks & Eve Porcello', 'Web Development', "O'Reilly Media", 2020, 'Shelf B-04', 5, 4, null],
    ['978-1449331818', 'ការរៀនម៉ាស៊ីនជាមួយ Scikit-Learn និង TensorFlow', 'Hands-On Machine Learning with Scikit-Learn, Keras & TensorFlow', 'Aurélien Géron', 'AI & Machine Learning', "O'Reilly Media", 2022, 'Shelf C-01', 5, 4, null],
    ['978-0262035613', 'ការរៀនស៊ីជម្រៅ (Deep Learning)', 'Deep Learning (Adaptive Computation & Machine Learning)', 'Ian Goodfellow et al.', 'AI & Machine Learning', 'MIT Press', 2016, 'Shelf C-02', 3, 2, null],
    ['978-1119548225', 'ការគ្រប់គ្រងបណ្តាញ និងសន្តិសុខប្រព័ន្ធ CompTIA Network+', 'CompTIA Network+ Certification All-in-One Guide', 'Mike Meyers', 'Networking & Cyber Security', 'McGraw Hill', 2021, 'Shelf C-03', 4, 3, null],
    ['978-1260464009', 'សន្តិសុខពត៌មានវិទ្យា CompTIA Security+ SY0-601', 'CompTIA Security+ All-in-One Exam Guide', 'Wm. Arthur Conklin et al.', 'Networking & Cyber Security', 'McGraw Hill', 2021, 'Shelf C-04', 4, 3, null],
    ['978-0134093413', 'ប្រព័ន្ធប្រតិបត្តិការសម័យទំនើប', 'Modern Operating Systems (4th Edition)', 'Andrew S. Tanenbaum', 'Computer Systems', 'Pearson', 2014, 'Shelf D-01', 3, 3, null],
    ['978-0133594140', 'រចនាសម្ព័ន្ធកុំព្យូទ័រ និងការរៀបចំប្រព័ន្ធ', 'Computer Organization and Architecture (10th Edition)', 'William Stallings', 'Computer Systems', 'Pearson', 2015, 'Shelf D-02', 4, 4, null],
    ['978-0321125217', 'ការរចនាផ្តោតលើដែនកំណត់ (Domain-Driven Design)', 'Domain-Driven Design: Tackling Complexity in the Heart of Software', 'Eric Evans', 'Software Architecture', 'Addison-Wesley', 2003, 'Shelf D-03', 3, 2, null],
    ['978-1492078005', 'ស្ថាបត្យកម្មប្រព័ន្ធកុំព្យូទ័រទន់ (Software Architecture)', 'Fundamentals of Software Architecture', 'Mark Richards, Neal Ford', 'Software Architecture', "O'Reilly Media", 2020, 'Shelf D-04', 5, 4, null],
    ['978-1449373320', 'ការរចនាចំណុចប្រទាក់អ្នកប្រើប្រាស់ (Designing Interfaces)', 'Designing Interfaces (3rd Edition)', 'Jenifer Tidwell', 'UI/UX Design', "O'Reilly Media", 2020, 'Shelf E-01', 4, 3, null],
    ['978-0465050659', 'ការរចនាវត្ថុប្រចាំថ្ងៃ (The Design of Everyday Things)', 'The Design of Everyday Things', 'Don Norman', 'UI/UX Design', 'Basic Books', 2013, 'Shelf E-02', 6, 5, null],
    ['978-1119702849', 'គណនេយ្យ និងហិរញ្ញវត្ថុសម្រាប់អាជីវកម្ម', 'Accounting and Finance for Non-Specialists', 'Peter Atrill & Eddie McLaney', 'Business & Finance', 'Wiley', 2021, 'Shelf F-01', 4, 4, null],
    ['978-0062457714', 'ការចាប់ផ្តើមអាជីវកម្មបែបទំនើប (The Lean Startup)', 'The Lean Startup', 'Eric Ries', 'Business & Innovation', 'Crown Business', 2011, 'Shelf F-02', 5, 4, null],
    ['978-0307887894', 'ពីសូន្យដល់មួយ៖ កំណត់ត្រាស្តីពីការបង្កើតអនាគត', 'Zero to One: Notes on Startups, or How to Build the Future', 'Peter Thiel, Blake Masters', 'Business & Innovation', 'Crown Currency', 2014, 'Shelf F-03', 5, 5, null],
    ['978-9995000001', 'ប្រវត្តិសាស្ត្រខ្មែរ និងអារ្យធម៌អង្គរ', 'History of Cambodia and Angkorian Civilization', 'ត្រាំង ង៉ា (Trang Nga)', 'Cambodian History', 'ក្រសួងអប់រំ យុវជន និងកីឡា', 2015, 'Shelf H-01', 6, 5, null],
    ['978-9995000002', 'អារ្យធម៌ខ្មែរ៖ ទំនៀមទម្លាប់ ប្រពៃណី និងសិល្បៈ', 'Khmer Civilization: Traditions, Beliefs and Arts', 'សាស្ត្រាចារ្យ ឌី គៀម', 'Cambodian Culture', 'ពុទ្ធសាសនបណ្ឌិត្យ', 2018, 'Shelf H-02', 5, 4, null],
    ['978-9995000003', 'វចនានុក្រមខ្មែរ សម្តេចព្រះសង្ឃរាជ ជួន ណាត (ភាគ ១-២)', 'Chuon Nath Khmer Dictionary (Vol 1-2)', 'សម្តេចព្រះសង្ឃរាជ ជួន ណាត', 'Reference & Language', 'ពុទ្ធសាសនបណ្ឌិត្យ', 2010, 'Shelf H-03', 8, 8, null],
    ['978-0194323456', 'វេយ្យាករណ៍ភាសាអង់គ្លេសកម្រិតខ្ពស់', 'Oxford English Grammar Course: Advanced', 'Michael Swan, Catherine Walter', 'Language & Communication', 'Oxford University Press', 2019, 'Shelf G-01', 6, 5, null],
    ['978-1108430425', 'ការប្រាស្រ័យទាក់ទងជំនួញប្រកបដោយវិជ្ជាជីវៈ', 'English for Business Communication', 'Simon Sweeney', 'Business & Communication', 'Cambridge University Press', 2020, 'Shelf G-02', 4, 3, null],
    ['978-0134092669', 'ការគ្រប់គ្រងមូលដ្ឋានទិន្នន័យ SQL សម័យថ្មី', 'Database Systems: The Complete Book (2nd Edition)', 'Hector Garcia-Molina et al.', 'Database Systems', 'Pearson', 2008, 'Shelf B-05', 4, 4, null],
    ['978-1491954249', 'ស្វែងយល់អំពី Docker និង Cloud Native', 'Using Docker: Developing and Deploying with Containers', 'Adrian Mouat', 'DevOps & Cloud', "O'Reilly Media", 2016, 'Shelf C-05', 5, 4, null],
    ['978-1492043799', 'ការគ្រប់គ្រង Kubernetes ក្នុងផលិតកម្មជាក់ស្តែង', 'Kubernetes: Up and Running (2nd Edition)', 'Brendan Burns et al.', 'DevOps & Cloud', "O'Reilly Media", 2019, 'Shelf C-06', 4, 3, null],
    ['978-0132354165', 'ការកែសម្រួលកូដ (Refactoring: Improving Existing Code)', 'Refactoring: Improving the Design of Existing Code', 'Martin Fowler', 'Software Engineering', 'Addison-Wesley', 2018, 'Shelf A-05', 4, 3, null],
    ['978-0321356680', 'ក្បួនសរសេរសាកល្បងមុន (Test Driven Development)', 'Test Driven Development: By Example', 'Kent Beck', 'Software Engineering', 'Addison-Wesley', 2002, 'Shelf A-06', 4, 4, null],
    ['978-1118531648', 'រចនាគេហទំព័រ HTML និង CSS មើលឃើញងាយយល់', 'HTML and CSS: Design and Build Websites', 'Jon Duckett', 'Web Development', 'Wiley', 2011, 'Shelf B-06', 6, 5, null],
    ['978-1118907443', 'ភាសា JavaScript និង jQuery សម្រាប់ការរចនាគេហទំព័រ', 'JavaScript and JQuery: Interactive Front-End Web Development', 'Jon Duckett', 'Web Development', 'Wiley', 2014, 'Shelf B-07', 5, 4, null],
    ['978-0387848570', 'ធាតុផ្សំនៃការរៀនតាមស្ថិតិ (Elements of Statistical Learning)', 'The Elements of Statistical Learning', 'Trevor Hastie et al.', 'Mathematics & Statistics', 'Springer', 2009, 'Shelf C-07', 3, 3, null],
    ['978-0134494166', 'គណិតវិទ្យាដាច់ដោយឡែក និងការអនុវត្ត', 'Discrete Mathematics and Its Applications (8th Edition)', 'Kenneth Rosen', 'Mathematics & Statistics', 'McGraw Hill', 2018, 'Shelf C-08', 5, 4, null]
  ];

  const bookIds = [];
  for (const b of booksData) {
    const res = insertBook.run(...b);
    bookIds.push(Number(res.lastInsertRowid));
  }

  // 5. Seed Realistic Loans (active borrowed, overdue, and returned)
  const insertLoan = db.prepare(`
    INSERT INTO loans (book_id, member_id, borrow_date, due_date, return_date, renewal_count, status, notes, processed_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const today = new Date();
  const format = (d) => d.toISOString().split('T')[0];

  const daysAgo = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return format(d);
  };

  const daysFromNow = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return format(d);
  };

  const loansData = [
    // Active loans
    [bookIds[0], memberIds['DUC-M2026-0001'], daysAgo(5), daysFromNow(9), null, 0, 'borrowed', 'Borrowed for SE course', libId],
    [bookIds[1], memberIds['DUC-M2026-0002'], daysAgo(7), daysFromNow(7), null, 0, 'borrowed', null, libId],
    [bookIds[3], memberIds['DUC-M2026-0003'], daysAgo(2), daysFromNow(12), null, 0, 'borrowed', 'Database assignment', libId],
    [bookIds[4], memberIds['DUC-M2026-0004'], daysAgo(4), daysFromNow(10), null, 0, 'borrowed', null, libId],
    [bookIds[7], memberIds['DUC-M2026-0005'], daysAgo(3), daysFromNow(11), null, 0, 'borrowed', 'Frontend project', libId],
    [bookIds[8], memberIds['DUC-M2026-0006'], daysAgo(10), daysFromNow(4), null, 1, 'borrowed', 'Renewed once', libId],
    [bookIds[9], memberIds['DUC-M2026-0101'], daysAgo(15), daysFromNow(15), null, 0, 'borrowed', 'Research reference', libId],
    // Overdue loans (for testing alerts & blocking)
    [bookIds[10], memberIds['DUC-M2026-0007'], daysAgo(25), daysAgo(11), null, 0, 'overdue', 'First notice sent', libId],
    [bookIds[11], memberIds['DUC-M2026-0008'], daysAgo(20), daysAgo(6), null, 0, 'overdue', 'Due soon passed', libId],
    [bookIds[14], memberIds['DUC-M2026-0010'], daysAgo(18), daysAgo(4), null, 0, 'overdue', null, libId],
    // Returned loans
    [bookIds[2], memberIds['DUC-M2026-0001'], daysAgo(30), daysAgo(16), daysAgo(17), 0, 'returned', 'Returned in good condition', libId],
    [bookIds[5], memberIds['DUC-M2026-0002'], daysAgo(45), daysAgo(31), daysAgo(32), 0, 'returned', null, libId],
    [bookIds[16], memberIds['DUC-M2026-0003'], daysAgo(28), daysAgo(14), daysAgo(14), 0, 'returned', null, libId],
    [bookIds[21], memberIds['DUC-M2026-0102'], daysAgo(40), daysAgo(10), daysAgo(12), 0, 'returned', null, libId]
  ];

  for (const l of loansData) {
    insertLoan.run(...l);
  }

  // 6. Seed Reservations
  const insertRes = db.prepare('INSERT INTO reservations (book_id, member_id, status) VALUES (?, ?, ?)');
  insertRes.run(bookIds[0], memberIds['DUC-M2026-0006'], 'pending');
  insertRes.run(bookIds[9], memberIds['DUC-M2026-0002'], 'pending');

  // 7. Seed Library Reader Checkins (today & yesterday)
  const insertCheckin = db.prepare(`
    INSERT INTO checkins (member_id, check_in_time, check_out_time, device_source)
    VALUES (?, ?, ?, ?)
  `);
  insertCheckin.run(memberIds['DUC-M2026-0001'], daysAgo(0) + ' 08:30:00', daysAgo(0) + ' 11:45:00', 'barcode_scanner');
  insertCheckin.run(memberIds['DUC-M2026-0002'], daysAgo(0) + ' 09:15:00', null, 'barcode_scanner');
  insertCheckin.run(memberIds['DUC-M2026-0003'], daysAgo(0) + ' 10:00:00', daysAgo(0) + ' 12:20:00', 'barcode_scanner');
  insertCheckin.run(memberIds['DUC-M2026-0101'], daysAgo(0) + ' 13:00:00', null, 'barcode_scanner');

  // 8. Seed Initial Audit Logs
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertAudit.run(adminId, 'DATABASE_SEED', 'system', null, JSON.stringify({ message: 'System seeded with default dataset' }), '127.0.0.1');

  console.log('[Seed] Database successfully seeded:');
  console.log(' - Users: admin (admin/admin123), librarian (librarian/lib123), student (student1/student123)');
  console.log(` - Members: ${membersData.length} active records`);
  console.log(` - Books: ${booksData.length} records`);
  console.log(` - Loans: ${loansData.length} records (active, overdue, and returned)`);
}

import { fileURLToPath } from 'node:url';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    runSeed();
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err);
    process.exit(1);
  }
}
