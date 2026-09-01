$baseDir = "C:\Users\Indosmart ct\Documents\itec"
$dbPath  = Join-Path $baseDir "kotaku.db"
$sqlPath = Join-Path $baseDir "database.sql"
$logPath = Join-Path $baseDir "kotaku_build.log"

"=== EcoHub DB Build $(Get-Date) ===" | Out-File -FilePath $logPath -Encoding UTF8
function Log($msg) { Add-Content -Path $logPath -Value $msg -Encoding UTF8 }

try {
    Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class SqliteNative
{
    [DllImport("winsqlite3.dll", CallingConvention = CallingConvention.Cdecl)]
    public static extern int sqlite3_open(string filename, out IntPtr db);
    [DllImport("winsqlite3.dll", CallingConvention = CallingConvention.Cdecl)]
    public static extern int sqlite3_close(IntPtr db);
    [DllImport("winsqlite3.dll", CallingConvention = CallingConvention.Cdecl)]
    public static extern IntPtr sqlite3_errmsg(IntPtr db);
    [DllImport("winsqlite3.dll", CallingConvention = CallingConvention.Cdecl)]
    public static extern int sqlite3_prepare_v2(IntPtr db, string zSql, int nByte, out IntPtr stmt, IntPtr pzTail);
    [DllImport("winsqlite3.dll", CallingConvention = CallingConvention.Cdecl)]
    public static extern int sqlite3_step(IntPtr stmt);
    [DllImport("winsqlite3.dll", CallingConvention = CallingConvention.Cdecl)]
    public static extern int sqlite3_finalize(IntPtr stmt);
    [DllImport("winsqlite3.dll", CallingConvention = CallingConvention.Cdecl)]
    public static extern IntPtr sqlite3_libversion();
}
"@
    Log "Add-Type OK"
} catch {
    Log ("Add-Type FAILED: " + $_.Exception.Message)
    exit 1
}

if (Test-Path $dbPath) { Remove-Item $dbPath -Force; Log "Old DB removed" }

if (-not (Test-Path $sqlPath)) { Log "SQL file not found"; exit 1 }
$sqlScript = Get-Content -Path $sqlPath -Raw -Encoding UTF8
Log ("SQL script length: " + $sqlScript.Length)

$dbPtr = [IntPtr]::Zero
$result = [SqliteNative]::sqlite3_open($dbPath, [ref]$dbPtr)
if ($result -ne 0) {
    Log ("Open failed: " + [System.Runtime.InteropServices.Marshal]::PtrToStringAnsi([SqliteNative]::sqlite3_errmsg($dbPtr)))
    exit 1
}
Log "DB opened"

$lines = $sqlScript -split "`r?`n" | Where-Object { $t = $_.Trim(); $t -ne "" -and -not $t.StartsWith("--") }
$cleanSql = $lines -join "`n"
$statements = $cleanSql -split ";\s*`n|;\s*$" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
Log ("Statements count: " + $statements.Count)

$successCount = 0
foreach ($stmtText in $statements) {
    if (-not $stmtText) { continue }
    $stmtPtr = [IntPtr]::Zero
    $rc = [SqliteNative]::sqlite3_prepare_v2($dbPtr, $stmtText, -1, [ref]$stmtPtr, [IntPtr]::Zero)
    if ($rc -ne 0) {
        Log ("Prepare error: " + [System.Runtime.InteropServices.Marshal]::PtrToStringAnsi([SqliteNative]::sqlite3_errmsg($dbPtr)) + " | " + $stmtText.Substring(0,[Math]::Min(60,$stmtText.Length)))
        [SqliteNative]::sqlite3_close($dbPtr) | Out-Null
        exit 1
    }
    $stepRc = 0
    do { $stepRc = [SqliteNative]::sqlite3_step($stmtPtr) } while ($stepRc -eq 100)
    if ($stepRc -ne 101) {
        Log ("Step error: " + [System.Runtime.InteropServices.Marshal]::PtrToStringAnsi([SqliteNative]::sqlite3_errmsg($dbPtr)) + " code=" + $stepRc)
        [SqliteNative]::sqlite3_finalize($stmtPtr) | Out-Null
        [SqliteNative]::sqlite3_close($dbPtr) | Out-Null
        exit 1
    }
    [SqliteNative]::sqlite3_finalize($stmtPtr) | Out-Null
    $successCount++
}

[SqliteNative]::sqlite3_close($dbPtr) | Out-Null
Log ("Statements executed: " + $successCount)

if (-not (Test-Path $dbPath)) { Log "DB file not created"; exit 1 }
$fileInfo = Get-Item $dbPath
Log ("[SUCCESS] DB created. Size: " + [math]::Round($fileInfo.Length / 1KB, 2) + " KB")

$libVersion = [System.Runtime.InteropServices.Marshal]::PtrToStringAnsi([SqliteNative]::sqlite3_libversion())
Log ("SQLite version: " + $libVersion)
Log "DONE"
