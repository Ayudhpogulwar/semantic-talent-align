import sqlite3
conn = sqlite3.connect('stufac_persistent.db')
conn.row_factory = sqlite3.Row
cur = conn.cursor()

print("=== APPLICATIONS full columns ===")
cur.execute("PRAGMA table_info(applications)")
for c in cur.fetchall():
    print(dict(c))

print("\n=== APPLICATIONS data with student_email ===")
cur.execute("SELECT application_id, student_id, student_email, student_name, organization, status FROM applications")
for r in cur.fetchall():
    print(dict(r))

print("\n=== QUERY BY student_email ===")
cur.execute("""
    SELECT student_email,
           COUNT(application_id) AS companies_applied,
           SUM(CASE WHEN LOWER(COALESCE(status, current_status)) IN ('shortlisted', 'selected', 'offered', 'offer', 'accepted')
                    THEN 1 ELSE 0 END) AS shortlisted_count
    FROM applications
    WHERE student_email IS NOT NULL AND student_email != ''
    GROUP BY student_email
""")
for r in cur.fetchall():
    print(dict(r))

conn.close()
