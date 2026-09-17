import sqlite3
conn = sqlite3.connect('db.sqlite3')
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# Check student_verification_requests
print("=== student_verification_requests ===")
cur.execute("SELECT id, full_name, email, roll_number, status FROM student_verification_requests LIMIT 10")
for r in cur.fetchall():
    print(dict(r))

conn.close()

# Also check stufac_persistent.db for ayudh
conn2 = sqlite3.connect('stufac_persistent.db')
conn2.row_factory = sqlite3.Row
cur2 = conn2.cursor()
print("\n=== stufac_persistent users ===")
cur2.execute("SELECT user_id, email FROM users")
for r in cur2.fetchall():
    print(dict(r))

print("\n=== stufac_persistent student_profiles ===")
cur2.execute("SELECT student_id, roll_number, first_name, last_name, department FROM student_profiles")
for r in cur2.fetchall():
    print(dict(r))

conn2.close()
