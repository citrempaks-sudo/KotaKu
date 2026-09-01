$baseDir = "C:\Users\Indosmart ct\Documents\itec"
$dbPath  = Join-Path $baseDir "kotaku.db"
$port    = 8080

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Text;
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
    public static extern IntPtr sqlite3_column_text(IntPtr stmt, int iCol);
    [DllImport("winsqlite3.dll", CallingConvention = CallingConvention.Cdecl)]
    public static extern int sqlite3_column_count(IntPtr stmt);
    [DllImport("winsqlite3.dll", CallingConvention = CallingConvention.Cdecl)]
    public static extern IntPtr sqlite3_column_name(IntPtr stmt, int iCol);
    [DllImport("winsqlite3.dll", CallingConvention = CallingConvention.Cdecl)]
    public static extern int sqlite3_column_type(IntPtr stmt, int iCol);
}
"@

$global:dbHandle = [IntPtr]::Zero
$rc = [SqliteNative]::sqlite3_open($dbPath, [ref]$global:dbHandle)
if ($rc -ne 0) {
    Write-Host "Gagal membuka database: $dbPath" -ForegroundColor Red
    exit 1
}

function Invoke-SqliteQuery([string]$sql) {
    $stmt = [IntPtr]::Zero
    $prepareRc = [SqliteNative]::sqlite3_prepare_v2($global:dbHandle, $sql, -1, [ref]$stmt, [IntPtr]::Zero)
    if ($prepareRc -ne 0) {
        $err = [System.Runtime.InteropServices.Marshal]::PtrToStringAnsi([SqliteNative]::sqlite3_errmsg($global:dbHandle))
        return @{ __error = $err }
    }
    $colCount = [SqliteNative]::sqlite3_column_count($stmt)
    $rows = @()
    $stepRc = [SqliteNative]::sqlite3_step($stmt)
    while ($stepRc -eq 100) {  # SQLITE_ROW
        $row = [ordered]@{}
        for ($i = 0; $i -lt $colCount; $i++) {
            $colName = [System.Runtime.InteropServices.Marshal]::PtrToStringAnsi([SqliteNative]::sqlite3_column_name($stmt, $i))
            $valPtr  = [SqliteNative]::sqlite3_column_text($stmt, $i)
            $val = if ($valPtr -eq [IntPtr]::Zero) { $null } else { [System.Runtime.InteropServices.Marshal]::PtrToStringAnsi($valPtr) }
            $row[$colName] = $val
        }
        $rows += [pscustomobject]$row
        $stepRc = [SqliteNative]::sqlite3_step($stmt)
    }
    [SqliteNative]::sqlite3_finalize($stmt) | Out-Null
    return $rows
}

function ConvertTo-JsonResponse($data) {
    return ($data | ConvertTo-Json -Depth 6 -Compress)
}

function Send-Json($context, $statusCode, $obj) {
    $json = ConvertTo-JsonResponse $obj
    $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
    $context.Response.StatusCode = $statusCode
    $context.Response.ContentType = "application/json; charset=utf-8"
    $context.Response.Headers.Add("Access-Control-Allow-Origin", "*")
    $context.Response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    $context.Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
    $context.Response.ContentLength64 = $buffer.Length
    $context.Response.OutputStream.Write($buffer, 0, $buffer.Length)
    $context.Response.Close()
}

function Send-File($context, $path, $contentType) {
    if (-not (Test-Path $path)) {
        Send-Json $context 404 @{ error = "File tidak ditemukan" }
        return
    }
    $bytes = [System.IO.File]::ReadAllBytes($path)
    $context.Response.StatusCode = 200
    $context.Response.ContentType = $contentType
    $context.Response.ContentLength64 = $bytes.Length
    $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $context.Response.Close()
}

$allReports   = Invoke-SqliteQuery "SELECT * FROM reports ORDER BY id DESC"
$allWaste     = Invoke-SqliteQuery "SELECT * FROM waste_materials"
$allAiLibrary = Invoke-SqliteQuery "SELECT * FROM ai_waste_library"
$allSchedules = Invoke-SqliteQuery "SELECT * FROM repair_schedules"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  EcoHub Server BERJALAN" -ForegroundColor Green
Write-Host "  Buka: http://localhost:$port/evohub.html" -ForegroundColor Green
Write-Host "  API:  http://localhost:$port/api/reports" -ForegroundColor Green
Write-Host "  (Tekan Ctrl+C untuk menghentikan)" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request  = $context.Request
        $response = $context.Response
        $path = $request.Url.AbsolutePath

        # CORS preflight
        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 204
            $response.Headers.Add("Access-Control-Allow-Origin", "*")
            $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
            $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
            $response.Close()
            continue
        }

        if ($path -eq "/api/reports") {
            Send-Json $context 200 $allReports
        }
        elseif ($path -match "^/api/reports/\d+$") {
            <# #>
        }
        elseif ($path -eq "/api/waste") {
            Send-Json $context 200 $allWaste
        }
        elseif ($path -eq "/api/ai-library") {
            Send-Json $context 200 $allAiLibrary
        }
        elseif ($path -eq "/api/schedules") {
            Send-Json $context 200 $allSchedules
        }
        elseif ($path -eq "/api/stats") {
            $stats = @{
                total_reports = @($allReports).Count
                total_schedules = @($allSchedules).Count
                total_materials = @($allWaste).Count
            }
            Send-Json $context 200 $stats
        }
        elseif ($path -eq "/" -or $path -eq "/index.html") {
            Send-File $context (Join-Path $baseDir "HTML.html") "text/html; charset=utf-8"
        }
        elseif ($path -eq "/HTML.html") {
            Send-File $context (Join-Path $baseDir "HTML.html") "text/html; charset=utf-8"
        }
        elseif ($path -eq "/JS.js") {
            Send-File $context (Join-Path $baseDir "JS.js") "application/javascript; charset=utf-8"
        }
        elseif ($path -eq "/CSS.css") {
            Send-File $context (Join-Path $baseDir "CSS.css") "text/css; charset=utf-8"
        }
        elseif ($path -eq "/tailwind-config.js") {
            Send-File $context (Join-Path $baseDir "tailwind-config.js") "application/javascript; charset=utf-8"
        }
        else {
            Send-Json $context 404 @{ error = "Endpoint tidak ditemukan: $path" }
        }
    }
}
finally {
    $listener.Close()
    [SqliteNative]::sqlite3_close($global:dbHandle) | Out-Null
}
