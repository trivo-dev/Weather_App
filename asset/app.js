/**
 * Ánh xạ trạng thái thời tiết (weather main) và mã icon sang class CSS nền và icon URL.
 * @param {string} weatherMain - Trạng thái thời tiết chính (ví dụ: 'Clear', 'Rain', 'Clouds').
 * @param {string} iconCode - Mã icon (ví dụ: '01d', '10n').
 * @returns {object} { backgroundClass: string, iconUrl: string }
 */
function getWeatherMapping(weatherMain, iconCode) {
  const isDay = iconCode.endsWith("d");
  let backgroundClass = "weather-default";
  const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

  switch (weatherMain.toLowerCase()) {
    case "clear":
      backgroundClass = isDay ? "weather-sunny" : "weather-night";
      break;

    case "clouds":
      // Sử dụng "sunny" cho mây rải rác nhẹ (02d) hoặc "cloudy" cho mây u ám (04d)
      if (iconCode === "02d" || iconCode === "02n") {
        backgroundClass = isDay ? "weather-sunny" : "weather-night"; // Vẫn sáng/quang nếu mây nhẹ
      } else {
        backgroundClass = "weather-cloudy"; // Mây u ám
      }
      break;

    case "rain":
    case "drizzle":
    case "thunderstorm":
      backgroundClass = "weather-rainy";
      break;

    case "snow":
      backgroundClass = "weather-snowy"; // Cần định nghĩa trong CSS nếu có ảnh tuyết
      break;

    case "mist":
    case "smoke":
    case "haze":
      backgroundClass = "weather-cloudy"; // Sương mù/Mù
      break;

    default:
      backgroundClass = "weather-default";
      break;
  }

  return { backgroundClass, iconUrl };
}

/**
 * Hàm cập nhật Icon và Background cho giao diện.
 * Sử dụng hàm getWeatherMapping để xác định class CSS nền.
 * @param {object} currentWeather - Dữ liệu thời tiết hiện tại (data.current)
 */
function updateBackgroundAndIcon(currentWeather) {
  const mainCondition = currentWeather.weather[0].main;
  const iconCode = currentWeather.weather[0].icon;

  const { backgroundClass, iconUrl } = getWeatherMapping(
    mainCondition,
    iconCode
  );

  console.log(
    "Weather condition:",
    mainCondition,
    "Icon code:",
    iconCode,
    "Background class:",
    backgroundClass
  );

  // 1. Cập nhật Icon (sử dụng icon URL từ PHP)
  const iconEl = document.getElementById("weather-icon");
  if (iconEl) {
    iconEl.src = iconUrl;
    iconEl.alt = currentWeather.weather[0].description;
  }

  // 2. Cập nhật Background - áp dụng class cho body
  const body = document.body;
  if (body) {
    // Xóa tất cả các class nền cũ đã định nghĩa
    body.classList.remove(
      "weather-sunny",
      "weather-rainy",
      "weather-cloudy",
      "weather-night",
      "weather-snowy",
      "weather-default"
    );

    // Thêm class nền mới
    body.classList.add(backgroundClass);
    console.log("Applied background class:", backgroundClass, "to body");
  } else {
    console.error("body không tìm thấy!");
  }
}

// ==========================================================
// KẾT THÚC LOGIC CẬP NHẬT BACKGROUND VÀ ICON
// ==========================================================

// ==========================================================
// LOGIC CHUYỂN ĐỔI ĐỘ C / ĐỘ F
// ==========================================================

// Biến lưu trữ đơn vị nhiệt độ hiện tại (mặc định là Celsius)
let currentUnit = "C";

// Biến lưu trữ dữ liệu thời tiết hiện tại
let currentWeatherData = null;

// Hàm chuyển đổi từ Celsius sang Fahrenheit
function celsiusToFahrenheit(celsius) {
  return (celsius * 9) / 5 + 32;
}

// Hàm cập nhật hiển thị nhiệt độ khi chuyển đổi đơn vị
function updateTemperatureDisplay() {
  if (!currentWeatherData) return;

  const current = currentWeatherData.current;
  const unitSymbol = currentUnit === "C" ? "°C" : "°F";

  // Cập nhật nhiệt độ hiện tại
  let temp = current.main.temp;
  if (currentUnit === "F") {
    temp = celsiusToFahrenheit(temp);
  }
  const tempElement = document.getElementById("temp");
  if (tempElement) {
    tempElement.textContent = Math.round(temp) + unitSymbol;
  }

  // Cập nhật cảm giác như
  let feelsLike = current.main.feels_like;
  if (currentUnit === "F") {
    feelsLike = celsiusToFahrenheit(feelsLike);
  }
  const feelsElement = document.getElementById("feels");
  if (feelsElement) {
    feelsElement.textContent =
      "Cảm giác: " + Math.round(feelsLike) + unitSymbol;
  }

  // Cập nhật nhiệt độ dự báo
  const forecastList = document.getElementById("forecast-list");
  if (forecastList) {
    const forecastItems = forecastList.querySelectorAll(".forecast-item");

    // Lấy ngày hôm nay từ current weather
    const today = new Date(currentWeatherData.current.dt * 1000);
    const todayDateString = today.toLocaleDateString("vi-VN");

    // Lọc bỏ ngày hôm nay và lấy các ngày tiếp theo
    const daily = {};
    currentWeatherData.forecast.list.forEach((item) => {
      const itemDate = new Date(item.dt * 1000);
      const itemDateString = itemDate.toLocaleDateString("vi-VN");

      // Chỉ lấy các ngày sau ngày hôm nay
      if (itemDateString !== todayDateString) {
        if (itemDate.getTime() > today.getTime()) {
          if (!daily[itemDateString]) {
            daily[itemDateString] = item;
          }
        }
      }
    });

    // Lấy 5 ngày đầu tiên (từ ngày mai)
    const dailyArray = Object.values(daily)
      .sort((a, b) => a.dt - b.dt)
      .slice(0, 5);

    forecastItems.forEach((item, index) => {
      if (dailyArray[index]) {
        let forecastTemp = dailyArray[index].main.temp;
        if (currentUnit === "F") {
          forecastTemp = celsiusToFahrenheit(forecastTemp);
        }
        // Cập nhật nhiệt độ trong forecast item
        const tempDiv = item.querySelector(".forecast-temp");
        if (tempDiv) {
          tempDiv.textContent = Math.round(forecastTemp) + unitSymbol;
        }
      }
    });
  }
}
// ==========================================================
// KẾT THÚC LOGIC CHUYỂN ĐỔI ĐỘ C / ĐỘ F
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM đã tải xong, bắt đầu tải thời tiết...");

  // Kiểm tra xem các element có tồn tại không
  const locationName = document.getElementById("location-name");
  const temp = document.getElementById("temp");
  const searchForm = document.getElementById("search-form");

  if (!locationName || !temp || !searchForm) {
    console.error("Không tìm thấy các element cần thiết trong DOM!");
    return;
  }

  console.log("Tất cả elements đã sẵn sàng, bắt đầu fetch dữ liệu...");

  // Thử tải thời tiết với một chút delay để đảm bảo DOM đã sẵn sàng
  setTimeout(() => {
    fetchWeather("Hanoi"); // mặc định khi mở trang
  }, 100);

  // Tìm kiếm theo tên thành phố
  document.getElementById("search-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const city = document.getElementById("city-input").value.trim();
    if (city) {
      fetchWeather(city);
    }
  });

  // Lấy vị trí hiện tại (mặc định là Quy Nhơn)
  document.getElementById("geo-btn").addEventListener("click", () => {
    fetchWeather("Quy Nhon");
  });

  // Event listener cho nút toggle chuyển đổi đơn vị
  const unitToggle = document.getElementById("unit-toggle");
  if (unitToggle) {
    unitToggle.addEventListener("change", (e) => {
      // Nếu checkbox được check thì chuyển sang Fahrenheit, ngược lại là Celsius
      currentUnit = e.target.checked ? "F" : "C";
      updateTemperatureDisplay();
    });
  }
});

// Map tên tiếng Việt sang chuẩn tiếng Anh cho OpenWeather
const cityMap = {
  "hà nội": "Hanoi",
  hn: "Hanoi",
  "thành phố hồ chí minh": "Ho Chi Minh",
  "hồ chí minh": "Ho Chi Minh",
  "sài gòn": "Ho Chi Minh",
  "đà nẵng": "Da Nang",
  "hải phòng": "Hai Phong",
  "cần thơ": "Can Tho",
  "bình định": "Binh Dinh",
  "quy nhơn": "Quy Nhon",
};

// ====== Hàm updateUI ======
function updateUI(data) {
  console.log("🔄 updateUI được gọi với dữ liệu:", data);

  // Kiểm tra dữ liệu hợp lệ
  if (!data || !data.current) {
    console.error("❌ Dữ liệu không hợp lệ:", data);
    displayError("Dữ liệu thời tiết không hợp lệ");
    return;
  }

  console.log("✅ Dữ liệu hợp lệ, bắt đầu cập nhật các element...");

  // Lưu trữ dữ liệu thời tiết hiện tại để sử dụng cho chuyển đổi đơn vị
  currentWeatherData = data;

  // Đồng hồ
  function updateClock() {
    const now = new Date();
    const clockEl = document.getElementById("clock");
    if (clockEl) {
      clockEl.textContent = now.toLocaleTimeString("vi-VN");
    }
  }
  if (!window.clockInterval) {
    window.clockInterval = setInterval(updateClock, 1000);
  }
  updateClock();

  const current = data.current;

  if (!current.weather || !current.weather[0]) {
    console.error("❌ Không có dữ liệu weather:", current);
    displayError("Không có thông tin thời tiết");
    return;
  }

  const weather = current.weather[0];
  console.log("🌡️ Weather info:", weather);

  // >>> BƯỚC QUAN TRỌNG: Gọi hàm cập nhật nền và icon <<<
  // Truyền toàn bộ dữ liệu current từ API
  console.log("🎨 Cập nhật background và icon...");
  updateBackgroundAndIcon(current);

  // Debug: Kiểm tra xem dữ liệu có đúng không
  console.log("📊 Current weather data:", current);

  const locationNameEl = document.getElementById("location-name");
  if (locationNameEl) {
    locationNameEl.textContent = current.name;
    console.log("✅ Đã cập nhật location-name:", current.name);
  } else {
    console.error("❌ Không tìm thấy element location-name");
  }

  // Hiển thị nhiệt độ theo đơn vị hiện tại
  const unitSymbol = currentUnit === "C" ? "°C" : "°F";
  let temp = current.main.temp;
  if (currentUnit === "F") {
    temp = celsiusToFahrenheit(temp);
  }
  const tempEl = document.getElementById("temp");
  if (tempEl) {
    tempEl.textContent = Math.round(temp) + unitSymbol;
    console.log("✅ Đã cập nhật temp:", Math.round(temp) + unitSymbol);
  } else {
    console.error("❌ Không tìm thấy element temp");
  }

  const descEl = document.getElementById("desc");
  if (descEl) {
    descEl.textContent = weather.description;
    console.log("✅ Đã cập nhật desc:", weather.description);
  } else {
    console.error("❌ Không tìm thấy element desc");
  }

  // Cảm giác như
  let feelsLike = current.main.feels_like;
  if (currentUnit === "F") {
    feelsLike = celsiusToFahrenheit(feelsLike);
  }
  // Cảm giác như
  try {
    const feelsEl = document.getElementById("feels");
    if (feelsEl) {
      feelsEl.textContent = "Cảm giác: " + Math.round(feelsLike) + unitSymbol;
      console.log("✅ Đã cập nhật feels");
    }
  } catch (e) {
    console.error("❌ Lỗi cập nhật feels:", e);
  }

  try {
    const humidityEl = document.getElementById("humidity");
    if (humidityEl) {
      humidityEl.textContent = "Độ ẩm: " + current.main.humidity + "%";
      console.log("✅ Đã cập nhật humidity");
    }
  } catch (e) {
    console.error("❌ Lỗi cập nhật humidity:", e);
  }

  try {
    const windEl = document.getElementById("wind");
    if (windEl) {
      windEl.textContent =
        "Gió: " +
        (current.wind.speed || 0) +
        " m/s" +
        (current.wind.deg ? " (" + current.wind.deg + "°)" : "");
      console.log("✅ Đã cập nhật wind");
    }
  } catch (e) {
    console.error("❌ Lỗi cập nhật wind:", e);
  }

  // Áp suất
  try {
    const pressureEl = document.getElementById("pressure");
    if (pressureEl) {
      pressureEl.textContent =
        "Áp suất: " + (current.main.pressure || 0) + " hPa";
      console.log("✅ Đã cập nhật pressure");
    }
  } catch (e) {
    console.error("❌ Lỗi cập nhật pressure:", e);
  }

  // Tầm nhìn (mét -> km)
  try {
    const visibility = current.visibility
      ? (current.visibility / 1000).toFixed(1)
      : "—";
    const visibilityEl = document.getElementById("visibility");
    if (visibilityEl) {
      visibilityEl.textContent = "Tầm nhìn: " + visibility + " km";
      console.log("✅ Đã cập nhật visibility");
    }
  } catch (e) {
    console.error("❌ Lỗi cập nhật visibility:", e);
  }

  // Mây
  try {
    const cloudsEl = document.getElementById("clouds");
    if (cloudsEl) {
      cloudsEl.textContent = "Mây: " + (current.clouds?.all || 0) + "%";
      console.log("✅ Đã cập nhật clouds");
    }
  } catch (e) {
    console.error("❌ Lỗi cập nhật clouds:", e);
  }

  // Ngày tháng
  try {
    const dateEl = document.getElementById("date");
    if (dateEl) {
      dateEl.textContent = new Date(current.dt * 1000).toLocaleDateString(
        "vi-VN",
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      );
      console.log("✅ Đã cập nhật date");
    }
  } catch (e) {
    console.error("❌ Lỗi cập nhật date:", e);
  }

  // Mặt trời mọc/lặn
  if (current.sys) {
    try {
      const sunrise = new Date(current.sys.sunrise * 1000);
      const sunset = new Date(current.sys.sunset * 1000);
      const sunriseEl = document.getElementById("sunrise");
      const sunsetEl = document.getElementById("sunset");
      if (sunriseEl) {
        sunriseEl.textContent =
          "Mọc: " +
          sunrise.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          });
        console.log("✅ Đã cập nhật sunrise");
      }
      if (sunsetEl) {
        sunsetEl.textContent =
          "Lặn: " +
          sunset.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          });
        console.log("✅ Đã cập nhật sunset");
      }
    } catch (e) {
      console.error("❌ Lỗi cập nhật sunrise/sunset:", e);
    }
  }

  // 👉 Gợi ý trang phục & Nhắc nhở ngày mai
  const suggestionEl = document.getElementById("suggestion");
  if (suggestionEl) {
    const span = suggestionEl.querySelector("span");
    if (span)
      span.textContent = "Gợi ý trang phục: " + (data.suggestion || "—");
  }

  const reminderEl = document.getElementById("reminder");
  if (reminderEl) {
    const span = reminderEl.querySelector("span");
    if (span) span.textContent = "Nhắc nhở: " + (data.reminder || "—");
  }

  // Reset error styling nếu có
  const descElReset = document.getElementById("desc");
  if (descElReset) {
    descElReset.style.color = "";
    descElReset.style.fontWeight = "";
    descElReset.style.padding = "";
    descElReset.style.background = "";
    descElReset.style.borderRadius = "";
    descElReset.style.border = "";
  }

  // Forecast 5 ngày
  console.log("📅 Bắt đầu cập nhật forecast...");
  try {
    const forecastList = document.getElementById("forecast-list");
    if (!forecastList) {
      console.error("❌ Không tìm thấy element forecast-list");
      return;
    }

    forecastList.innerHTML = "";

    if (
      !data.forecast ||
      !data.forecast.list ||
      data.forecast.list.length === 0
    ) {
      console.error("❌ Không có dữ liệu forecast");
      forecastList.innerHTML =
        "<p style='text-align: center; color: var(--muted);'>Không có dữ liệu dự báo</p>";
      return;
    }

    // Lấy ngày hôm nay từ current weather
    const today = new Date(data.current.dt * 1000);
    const todayDateString = today.toLocaleDateString("vi-VN");

    // Lọc bỏ ngày hôm nay và lấy các ngày tiếp theo
    const daily = {};
    data.forecast.list.forEach((item) => {
      const itemDate = new Date(item.dt * 1000);
      const itemDateString = itemDate.toLocaleDateString("vi-VN");

      // Chỉ lấy các ngày sau ngày hôm nay
      if (itemDateString !== todayDateString) {
        // So sánh theo timestamp để đảm bảo là ngày mai trở đi
        if (itemDate.getTime() > today.getTime()) {
          if (!daily[itemDateString]) {
            daily[itemDateString] = item;
          }
        }
      }
    });

    // Lấy 5 ngày đầu tiên (từ ngày mai)
    const dailyArray = Object.values(daily)
      .sort((a, b) => a.dt - b.dt) // Sắp xếp theo thời gian
      .slice(0, 5);

    console.log("📅 Số ngày forecast (không tính hôm nay):", dailyArray.length);
    console.log("📅 Ngày hôm nay:", todayDateString);

    dailyArray.forEach((item, index) => {
      try {
        const fIconUrl = `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`;

        // Chuyển đổi nhiệt độ theo đơn vị hiện tại
        let forecastTemp = item.main.temp;
        if (currentUnit === "F") {
          forecastTemp = celsiusToFahrenheit(forecastTemp);
        }

        const el = document.createElement("div");
        el.classList.add("forecast-item");
        const date = new Date(item.dt * 1000);
        const dayName = date.toLocaleDateString("vi-VN", { weekday: "short" });
        const dayMonth = date.toLocaleDateString("vi-VN", {
          day: "numeric",
          month: "short",
        });

        el.innerHTML = `
        <div class="forecast-day">${dayName}</div>
        <div class="forecast-date">${dayMonth}</div>
        <img src="${fIconUrl}" alt="${
          item.weather[0].description
        }" class="forecast-icon">
        <div class="forecast-temp">${Math.round(
          forecastTemp
        )}${unitSymbol}</div>
        <div class="forecast-desc">${item.weather[0].description}</div>
        <div class="forecast-details">
          <span><i class="fas fa-tint"></i> ${item.main.humidity}%</span>
          <span><i class="fas fa-wind"></i> ${Math.round(
            item.wind.speed || 0
          )} m/s</span>
        </div>
      `;
        forecastList.appendChild(el);
        console.log(`✅ Đã thêm forecast item ${index + 1}:`, dayName);
      } catch (e) {
        console.error(`❌ Lỗi khi tạo forecast item ${index + 1}:`, e);
      }
    });

    console.log("✅ Đã cập nhật forecast xong!");
  } catch (e) {
    console.error("❌ Lỗi khi cập nhật forecast:", e);
  }

  console.log("🎉 Hoàn tất cập nhật UI!");
}

// Hiển thị loading
function showLoading() {
  const locationName = document.getElementById("location-name");
  const temp = document.getElementById("temp");
  if (locationName) locationName.textContent = "Đang tải...";
  if (temp) temp.textContent = "—";
}

// Ẩn loading
function hideLoading() {
  // Loading sẽ được thay thế bởi dữ liệu thực
}

// Hiển thị lỗi
function displayError(message) {
  console.error("displayError called with:", message);

  const locationName = document.getElementById("location-name");
  const temp = document.getElementById("temp");
  const desc = document.getElementById("desc");

  if (locationName) locationName.textContent = "❌ Lỗi tải dữ liệu";
  if (temp) temp.textContent = "—";
  if (desc) desc.textContent = message || "Không thể tải dữ liệu thời tiết";

  // Hiển thị thông báo lỗi rõ ràng hơn
  if (desc) {
    desc.style.color = "#ff6b6b";
    desc.style.fontWeight = "600";
    desc.style.padding = "1em";
    desc.style.background = "rgba(220, 53, 69, 0.2)";
    desc.style.borderRadius = "0.5em";
    desc.style.border = "1px solid rgba(220, 53, 69, 0.4)";
  }

  document.getElementById("feels").textContent = "Cảm giác: —";
  document.getElementById("humidity").textContent = "Độ ẩm: —";
  document.getElementById("wind").textContent = "Gió: —";
  document.getElementById("pressure").textContent = "Áp suất: —";
  document.getElementById("visibility").textContent = "Tầm nhìn: —";
  document.getElementById("clouds").textContent = "Mây: —";
  document.getElementById("date").textContent = "—";
  document.getElementById("clock").textContent = "—";
  document.getElementById("sunrise").textContent = "Mọc: —";
  document.getElementById("sunset").textContent = "Lặn: —";
  document.getElementById("forecast-list").innerHTML = "";

  const iconEl = document.getElementById("weather-icon");
  if (iconEl) iconEl.src = "";

  const suggestionEl = document.getElementById("suggestion");
  if (suggestionEl) {
    const span = suggestionEl.querySelector("span");
    if (span) span.textContent = "Gợi ý trang phục: —";
  }

  const reminderEl = document.getElementById("reminder");
  if (reminderEl) {
    const span = reminderEl.querySelector("span");
    if (span) span.textContent = "Nhắc nhở: —";
  }
}

// Lấy thời tiết theo tên thành phố
async function fetchWeather(city) {
  try {
    // Hiển thị loading
    showLoading();

    let normalizedCity = city.trim();
    const key = normalizedCity.toLowerCase();
    if (cityMap[key]) {
      normalizedCity = cityMap[key];
    }

    console.log("🌤️ Đang tải thời tiết cho:", normalizedCity);

    // Xây dựng URL - đảm bảo đường dẫn đúng
    const url = `weather.php?city=${encodeURIComponent(normalizedCity)}`;
    console.log("📡 URL request:", url);

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-cache",
    });

    console.log("📥 Response status:", res.status, res.statusText);
    console.log("📥 Response headers:", res.headers);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Response error text:", errorText);
      throw new Error(`Lỗi kết nối server: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log("✅ Dữ liệu nhận được:", data);
    console.log("✅ Current data:", data.current);
    console.log("✅ Forecast data:", data.forecast);

    if (data.error) {
      console.error("❌ API error:", data.error);
      throw new Error(data.error);
    }

    if (!data.current || !data.forecast) {
      console.error("❌ Dữ liệu không đầy đủ:", {
        hasCurrent: !!data.current,
        hasForecast: !!data.forecast,
      });
      throw new Error("Dữ liệu không đầy đủ từ server");
    }

    console.log("🎨 Bắt đầu cập nhật UI...");
    hideLoading();
    updateUI(data);
    console.log("✅ UI đã được cập nhật!");

    // Load biểu đồ sau khi dữ liệu chính đã load
    if (typeof loadHourlyWeather === "function") {
      console.log("📊 Đang load biểu đồ...");
      loadHourlyWeather(normalizedCity);
    } else {
      console.warn("⚠️ Hàm loadHourlyWeather không tồn tại");
    }
  } catch (err) {
    console.error("❌ Lỗi fetchWeather:", err);
    console.error("❌ Stack trace:", err.stack);
    hideLoading();
    displayError(
      err.message || "Không thể tải dữ liệu thời tiết. Vui lòng thử lại sau."
    );
  }
}

// Lấy thời tiết theo tọa độ
async function fetchWeatherByCoords(lat, lon) {
  try {
    const res = await fetch(`weather.php?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error("Lỗi kết nối server");
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    updateUI(data);
  } catch (err) {
    console.error("Lỗi:", err.message);
    displayError(err.message);
  }
}
