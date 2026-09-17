import sqlite3
conn = sqlite3.connect('stufac_persistent.db')
conn.row_factory = sqlite3.Row
cur = conn.cursor()

print("=== USERS ===")
cur.execute("SELECT user_id, email, role FROM users")
for u in cur.fetchall():
    print(dict(u))

print("\n=== APPLICATIONS (student_id, status) ===")
cur.execute("SELECT application_id, student_id, organization, status, current_status FROM applications")
for a in cur.fetchall():
    print(dict(a))

print("\n=== JOIN RESULT ===")
cur.execute("""
    SELECT u.email,
           COUNT(a.application_id) AS companies_applied,
           SUM(CASE WHEN LOWER(COALESCE(a.status, a.current_status)) IN ('shortlisted', 'selected', 'offered', 'offer', 'accepted')
                    THEN 1 ELSE 0 END) AS shortlisted_count
    FROM applications a
    JOIN users u ON CAST(u.user_id AS TEXT) = CAST(a.student_id AS TEXT)
    WHERE u.role = 'Student'
    GROUP BY u.email
""")
rows = cur.fetchall()
if rows:
    for r in rows:
        print(dict(r))
else:
    print("NO ROWS RETURNED - JOIN IS FAILING")

conn.close()
