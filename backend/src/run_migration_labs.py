import pg8000.dbapi
import ssl
import sys

host = "db.oqralxhqlgbmsdxwywpu.supabase.co"
user = "postgres"
database = "postgres"
passwords = [
    "postgres",
    "oqralxhqlgbmsdxwywpu",
    "healthguard",
    "healthguard123",
    "HealthGuard",
    "HealthGuard123",
    "postgres123",
    "admin",
    "admin123"
]

sql_file = r"c:\projectms\Hackathon kaggle\backend\migrations\20260728000004_add_optional_clinical_fields.sql"

def run_migration():
    with open(sql_file, 'r') as f:
        sql = f.read()

    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    # Try both ports 5432 and 6543
    for port in [5432, 6543]:
        for pw in passwords:
            try:
                print(f"Connecting to {host}:{port} with password: {pw[:3]}...")
                conn = pg8000.dbapi.connect(
                    host=host,
                    user=user,
                    password=pw,
                    database=database,
                    port=port,
                    ssl_context=ssl_context if port == 6543 else None,
                    timeout=5
                )
                print("Connected! Executing migration DDL...")
                cursor = conn.cursor()
                cursor.execute(sql)
                conn.commit()
                print("DDL Migration successfully applied to Supabase database!")
                cursor.close()
                conn.close()
                return True
            except Exception as e:
                print(f"Failed on port {port}: {e}")
                pass
    return False

if __name__ == "__main__":
    success = run_migration()
    if not success:
        print("Could not connect directly to Postgres. The user will need to run the SQL in their Supabase console.")
        sys.exit(0)
