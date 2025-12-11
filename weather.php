<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=utf-8");

// --- API Key ---
// $apiKey = "7e1a92020fb10446446cb82105d49457";
$apiKey = "9e74dda636db58c18120b15630a121f8";

// --- Hàm gọi API ---
function callAPI($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Tắt SSL verify nếu cần
    
    $output = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);

    if ($output === false || !empty($curlError)) {
        curl_close($ch);
        return [
            "error" => "Lỗi kết nối: " . ($curlError ?: "Không thể kết nối đến API"),
            "code" => 500
        ];
    }

    curl_close($ch);
    $data = json_decode($output, true);

    if ($httpCode !== 200) {
        $errorMsg = "Lỗi API";
        if (is_array($data) && isset($data["message"])) {
            $errorMsg = $data["message"];
        } elseif (is_array($data) && isset($data["error"])) {
            $errorMsg = $data["error"];
        }
        return [
            "error" => $errorMsg . " (HTTP $httpCode)",
            "code" => $httpCode
        ];
    }

    if (!is_array($data)) {
        return [
            "error" => "Dữ liệu trả về không hợp lệ",
            "code" => 500
        ];
    }

    return $data;
}

// --- Xác định query ---
if (isset($_GET["geo"])) {
    $city = "Quy Nhon";
} else {
    $city = isset($_GET["city"]) ? urlencode($_GET["city"]) : "Hanoi";
}

$urlCurrent  = "https://api.openweathermap.org/data/2.5/weather?q={$city}&appid={$apiKey}&lang=vi&units=metric";
$urlForecast = "https://api.openweathermap.org/data/2.5/forecast?q={$city}&appid={$apiKey}&lang=vi&units=metric";

// --- Gọi API ---
$current  = callAPI($urlCurrent);
$forecast = callAPI($urlForecast);

// --- Kiểm tra lỗi ---
if (isset($current["error"])) {
    http_response_code($current["code"] ?? 500);
    echo json_encode([
        "error" => $current["error"] ?? "Không lấy được dữ liệu thời tiết hiện tại"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (isset($forecast["error"])) {
    http_response_code($forecast["code"] ?? 500);
    echo json_encode([
        "error" => $forecast["error"] ?? "Không lấy được dữ liệu dự báo"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Kiểm tra dữ liệu có đầy đủ không
if (!isset($current["main"]) || !isset($current["weather"][0])) {
    http_response_code(500);
    echo json_encode([
        "error" => "Dữ liệu thời tiết không đầy đủ"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// --- Xử lý dữ liệu ---
$temp = $current["main"]["temp"] ?? 0;
$desc = strtolower($current["weather"][0]["description"] ?? "");
$iconCode = $current["weather"][0]["icon"] ?? "01d"; // Trả icon code để front-end map

// Gợi ý trang phục
$suggestion = "Hôm nay thời tiết khá dễ chịu, bạn cứ thoải mái chọn trang phục mình thích.";
if (strpos($desc, "mưa") !== false) {
    $suggestion = "Trời sắp mưa, nhớ mang theo áo mưa hoặc ô để tránh ướt nhé☔";
} elseif ($temp < 20) {
    $suggestion = "Trời lạnh, mặc áo khoác ấm nhé 🧥";
} elseif ($temp > 32) {
    $suggestion = "Trời nóng, mặc đồ thoáng mát 👕 và uống nhiều nước  💧";
}

// Nhắc nhở ngày mai
$reminder = "Không có nhắc nhở đặc biệt.";
if (!empty($forecast["list"]) && isset($forecast["list"][8])) {
    $tomorrowDesc = strtolower($forecast["list"][8]["weather"][0]["description"] ?? "");
    $tomorrowTemp = $forecast["list"][8]["main"]["temp"] ?? null;

    $reminderArr = [];
    if (strpos($tomorrowDesc, "mưa") !== false) $reminderArr[] = "Ngày mai có mưa, bạn nhớ mang ô nhé ☔";
    if (strpos($tomorrowDesc, "nắng") !== false) $reminderArr[] = "Ngày mai trời nắng, bôi kem chống nắng nhé 🌞";
    if ($tomorrowTemp !== null) {
        if ($tomorrowTemp <= 10) $reminderArr[] = "Ngày mai lạnh, mang áo ấm vào nha 🧥";
        if ($tomorrowTemp >= 35) $reminderArr[] = "Ngày mai nóng, uống nhiều nước nhé 💧";
    }

    $reminder = !empty($reminderArr) ? implode(" | ", $reminderArr) :" Ngày mai thời tiết thuận lợi ✅";
}

// Dữ liệu hourly chart (8 mốc tiếp theo ~24h)
$hourly = [];
if (!empty($forecast["list"])) {
    foreach (array_slice($forecast["list"], 0, 8) as $entry) {
        $time = date("H:i", $entry["dt"]);
        $hourly[] = [
            "time" => $time,
            "temp" => round($entry["main"]["temp"])
        ];
    }
}

// Xuất JSON
echo json_encode([
    "current"    => $current,
    "forecast"   => $forecast,
    "iconCode"   => $iconCode, // trả code để map icon động
    "suggestion" => $suggestion,
    "reminder"   => $reminder,
    "hourly"     => $hourly
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
