"""
EcoHub Database Creator
=======================
Menjalankan skrip database.sql untuk membuat file SQLite bernama 'kotaku.db'
di dalam folder proyek ini.

Penggunaan:
    python create_database.py
"""

import os
import sqlite3
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "kotaku.db")
SQL_PATH = os.path.join(BASE_DIR, "database.sql")


def main():
    if not os.path.exists(SQL_PATH):
        print(f"[ERROR] File skrip SQL tidak ditemukan: {SQL_PATH}")
        sys.exit(1)
 
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print(f"[INFO] Database lama dihapus: {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        with open(SQL_PATH, "r", encoding="utf-8") as f:
            sql_script = f.read()

        cursor.executescript(sql_script)

        conn.commit()
        print("[SUKSES] Database berhasil dibuat dan diisi data awal.")
        print(f"         Lokasi file: {DB_PATH}")

        tables = ["reports", "waste_materials", "ai_waste_library", "repair_schedules"]
        print("\n--- Ringkasan Data ---")
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"  {table:<20}: {count} baris")

    except Exception as e:
        print(f"[ERROR] Gagal membuat database: {e}")
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
