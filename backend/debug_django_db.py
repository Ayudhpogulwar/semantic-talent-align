import sqlite3
conn = sqlite3.connect('db.sqlite3')
conn.row_factory = sqlite3.Row
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
print('Tables:', [r['name'] for r in cur.fetchall()])

# Check if there's an applications table here
try:
    cur.execute("SELECT * FROM applications LIMIT 5")
    rows = cur.fetchall()
    print("\nApplications in db.sqlite3:")
    for r in rows:
        print(dict(r))
except Exception as e:
    print("No applications table:", e)

# Check users in Django db
try:
    cur.execute("SELECT id, email FROM auth_user LIMIT 10")
    print("\nDjango auth_user:")
    for r in cur.fetchall():
        print(dict(r))
except Exception as e:
    print("auth_user error:", e)

conn.close()
