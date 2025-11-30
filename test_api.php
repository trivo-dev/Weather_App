<?php
// File test để kiểm tra weather.php có hoạt động không
header("Content-Type: text/html; charset=utf-8");
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Test Weather API</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: #0b1020;
            color: #e6e9f5;
        }
        .test-result {
            background: #121939;
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            border: 1px solid #223;
        }
        .success { border-left: 4px solid #4caf50; }
        .error { border-left: 4px solid #f44336; }
        pre {
            background: #0f1533;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <h1>🔍 Test Weather API</h1>
    
    <?php
    $testCity = "Hanoi";
    $testUrl = "weather.php?city=" . urlencode($testCity);
    
    echo "<div class='test-result'>";
    echo "<h2>Test 1: Kiểm tra file weather.php</h2>";
    if (file_exists("weather.php")) {
        echo "<p class='success'>✓ File weather.php tồn tại</p>";
    } else {
        echo "<p class='error'>✗ File weather.php KHÔNG tồn tại</p>";
    }
    echo "</div>";
    
    echo "<div class='test-result'>";
    echo "<h2>Test 2: Gọi API với thành phố: $testCity</h2>";
    echo "<p>URL: <code>$testUrl</code></p>";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "http://" . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . "/weather.php?city=" . urlencode($testCity));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($curlError) {
        echo "<p class='error'>✗ Lỗi cURL: $curlError</p>";
    } else {
        echo "<p>HTTP Code: <strong>$httpCode</strong></p>";
        
        if ($httpCode == 200) {
            $data = json_decode($response, true);
            if ($data) {
                if (isset($data['error'])) {
                    echo "<p class='error'>✗ API trả về lỗi: " . htmlspecialchars($data['error']) . "</p>";
                    echo "<pre>" . htmlspecialchars($response) . "</pre>";
                } else {
                    echo "<p class='success'>✓ API hoạt động tốt!</p>";
                    echo "<p>Thành phố: <strong>" . ($data['current']['name'] ?? 'N/A') . "</strong></p>";
                    echo "<p>Nhiệt độ: <strong>" . ($data['current']['main']['temp'] ?? 'N/A') . "°C</strong></p>";
                    echo "<p>Mô tả: <strong>" . ($data['current']['weather'][0]['description'] ?? 'N/A') . "</strong></p>";
                    echo "<details><summary>Xem toàn bộ dữ liệu JSON</summary><pre>" . htmlspecialchars(json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) . "</pre></details>";
                }
            } else {
                echo "<p class='error'>✗ Không thể parse JSON</p>";
                echo "<pre>" . htmlspecialchars($response) . "</pre>";
            }
        } else {
            echo "<p class='error'>✗ HTTP Error: $httpCode</p>";
            echo "<pre>" . htmlspecialchars($response) . "</pre>";
        }
    }
    echo "</div>";
    
    echo "<div class='test-result'>";
    echo "<h2>Test 3: Kiểm tra cấu hình PHP</h2>";
    echo "<p>PHP Version: <strong>" . phpversion() . "</strong></p>";
    echo "<p>cURL enabled: <strong>" . (function_exists('curl_init') ? 'Có' : 'Không') . "</strong></p>";
    echo "<p>allow_url_fopen: <strong>" . (ini_get('allow_url_fopen') ? 'Bật' : 'Tắt') . "</strong></p>";
    echo "</div>";
    ?>
    
    <div class="test-result">
        <h2>Hướng dẫn sửa lỗi</h2>
        <ul>
            <li>Nếu API trả về lỗi "Invalid API key": Cần kiểm tra API key trong weather.php</li>
            <li>Nếu lỗi cURL: Kiểm tra cấu hình PHP và kết nối internet</li>
            <li>Nếu file không tồn tại: Kiểm tra đường dẫn file</li>
            <li>Mở Console trong trình duyệt (F12) để xem lỗi JavaScript</li>
        </ul>
    </div>
</body>
</html>


