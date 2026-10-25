
USE student_management;

INSERT INTO classes (class_code, class_name)
VALUES
    ('ATTT23A', 'An toan thong tin 23A'),
    ('CNTT23A', 'Cong nghe thong tin 23A');

INSERT INTO students
    (student_code, full_name, date_of_birth, gender, email, phone, class_id)
VALUES
    ('SV001', 'Nguyen Van An', '2005-01-15', 'Nam',
     'sv001@example.com', '0900000001',
     (SELECT id FROM classes WHERE class_code = 'ATTT23A')),
    ('SV002', 'Tran Thi Binh', '2005-06-20', 'Nu',
     'sv002@example.com', '0900000002',
     (SELECT id FROM classes WHERE class_code = 'ATTT23A')),
    ('SV003', 'Le Van Cuong', '2004-11-08', 'Nam',
     'sv003@example.com', '0900000003',
     (SELECT id FROM classes WHERE class_code = 'CNTT23A'));

INSERT INTO subjects (subject_code, subject_name, credits)
VALUES
    ('CSDL', 'Co so du lieu', 3),
    ('LTWEB', 'Lap trinh web', 3);

INSERT INTO grades (student_id, subject_id, score, semester)
VALUES
    (
        (SELECT id FROM students WHERE student_code = 'SV001'),
        (SELECT id FROM subjects WHERE subject_code = 'CSDL'),
        8.50,
        '2026-1'
    ),
    (
        (SELECT id FROM students WHERE student_code = 'SV002'),
        (SELECT id FROM subjects WHERE subject_code = 'CSDL'),
        7.00,
        '2026-1'
    ),
    (
        (SELECT id FROM students WHERE student_code = 'SV003'),
        (SELECT id FROM subjects WHERE subject_code = 'LTWEB'),
        9.00,
        '2026-1'
    );
