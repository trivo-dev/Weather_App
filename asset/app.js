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

// Biến lưu trữ dữ liệu dự báo theo ngày và trạng thái lựa chọn
let dailyForecastData = [];
let selectedForecastContext = null;
let searchFeedbackTimeoutId = null;

// Hàm chuyển đổi từ Celsius sang Fahrenheit
function celsiusToFahrenheit(celsius) {
  return (celsius * 9) / 5 + 32;
}

// Hàm cập nhật hiển thị nhiệt độ khi chuyển đổi đơn vị
function updateTemperatureDisplay() {
  if (!currentWeatherData) return;

  const unitSymbol = getUnitSymbol();

  if (!selectedForecastContext) {
    const current = currentWeatherData.current;
    if (!current) return;

    const tempElement = document.getElementById("temp");
    if (tempElement) {
      const convertedTemp = convertTemperatureValue(current.main?.temp);
      tempElement.textContent =
        convertedTemp !== null ? convertedTemp + unitSymbol : "—";
    }

    const feelsElement = document.getElementById("feels");
    if (feelsElement) {
      const convertedFeels = convertTemperatureValue(current.main?.feels_like);
      feelsElement.textContent =
        "Cảm giác: " +
        (convertedFeels !== null ? convertedFeels + unitSymbol : "—");
    }
  } else if (selectedForecastContext.dayData) {
    applyForecastSelection(
      selectedForecastContext.dayData,
      selectedForecastContext.index,
      {
        skipChart: true,
        skipHighlight: true,
      }
    );
    updateChartForDay(selectedForecastContext.dayData.entries);
  }

  const forecastItems = document.querySelectorAll(
    "#forecast-list .forecast-item"
  );
  forecastItems.forEach((item, index) => {
    const dayData = dailyForecastData[index];
    if (!dayData || !dayData.representative?.main) return;
    const tempDiv = item.querySelector(".forecast-temp");
    if (tempDiv) {
      const convertedValue = convertTemperatureValue(
        dayData.representative.main.temp
      );
      tempDiv.textContent =
        convertedValue !== null ? convertedValue + unitSymbol : "—";
    }
  });
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
    // Nếu đã có dữ liệu cũ thì giữ nguyên giao diện, chỉ báo lỗi nhỏ
    if (currentWeatherData) {
      showSearchFeedback(
        "Không thể cập nhật dữ liệu mới. Đang hiển thị dữ liệu gần nhất.",
        "error"
      );
    } else {
      displayError("Dữ liệu thời tiết không hợp lệ");
    }
    return;
  }

  console.log("✅ Dữ liệu hợp lệ, bắt đầu cập nhật các element...");

  // Lưu trữ dữ liệu thời tiết hiện tại để sử dụng cho chuyển đổi đơn vị
  currentWeatherData = data;
  resetForecastSelectionState();

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
    if (currentWeatherData) {
      showSearchFeedback(
        "Không có thông tin thời tiết mới. Đang hiển thị dữ liệu gần nhất.",
        "error"
      );
    } else {
      displayError("Không có thông tin thời tiết");
    }
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

    const today = new Date(data.current.dt * 1000);
    dailyForecastData = groupForecastByDay(data.forecast.list, today);

    if (!dailyForecastData.length) {
      forecastList.innerHTML =
        "<p style='text-align: center; color: var(--muted);'>Không có dữ liệu dự báo</p>";
      return;
    }

    console.log(
      "📅 Số ngày forecast (không tính hôm nay):",
      dailyForecastData.length
    );

    dailyForecastData.forEach((dayData, index) => {
      try {
        if (!dayData.representative) return;
        const entry = dayData.representative;
        const fIconUrl = `https://openweathermap.org/img/wn/${entry.weather[0].icon}.png`;
        const forecastTemp = convertTemperatureValue(entry.main.temp);
        const tempDisplay =
          forecastTemp !== null
            ? `${forecastTemp}${getUnitSymbol()}`
            : "—";
        const el = document.createElement("div");
        el.classList.add("forecast-item");
        el.setAttribute("role", "button");
        el.setAttribute("tabindex", "0");
        el.dataset.index = index;

        el.innerHTML = `
        <div class="forecast-day">${dayData.dayName}</div>
        <div class="forecast-date">${dayData.dateLabel}</div>
        <img src="${fIconUrl}" alt="${
          entry.weather[0].description
        }" class="forecast-icon">
        <div class="forecast-temp">${tempDisplay}</div>
        <div class="forecast-desc">${entry.weather[0].description}</div>
        <div class="forecast-details">
          <span><i class="fas fa-tint"></i> ${entry.main.humidity}%</span>
          <span><i class="fas fa-wind"></i> ${Math.round(
            entry.wind.speed || 0
          )} m/s</span>
        </div>
      `;
        forecastList.appendChild(el);
        el.addEventListener("click", () => handleForecastItemClick(index));
        el.addEventListener("keyup", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleForecastItemClick(index);
          }
        });
        console.log(`✅ Đã thêm forecast item ${index + 1}:`, dayData.dayName);
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
  const hasSnapshot = !!currentWeatherData;
  if (!hasSnapshot) {
    if (locationName) locationName.textContent = "Đang tải...";
    if (temp) temp.textContent = "—";
  }
  hideSearchFeedback();
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

    let data;
    // Thử parse JSON kể cả khi HTTP status không phải 200 để lấy thông báo lỗi chi tiết
    try {
      data = await res.json();
    } catch (parseErr) {
      console.warn("⚠️ Không parse được JSON lỗi, dùng thông báo mặc định");
    }

    if (!res.ok) {
      const serverMsg =
        data && (data.error || data.message)
          ? data.error || data.message
          : `Lỗi kết nối server: ${res.status} ${res.statusText}`;
      console.error("❌ Response error:", serverMsg);
      throw new Error(serverMsg);
    }

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
    hideSearchFeedback();
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

    // 1. Tạo thông báo lỗi thân thiện hơn
    const cityNotFound = 
        err?.message?.includes("city") || 
        err?.message?.includes("thành phố") ||
        err?.message?.includes("not found"); // Đảm bảo bắt được lỗi "not found" từ API

    const friendlyMessage = cityNotFound
      ? "Tên thành phố không hợp lệ. Vui lòng thử lại."
      : err?.message || "Không thể tải dữ liệu thời tiết. Vui lòng thử lại.";

    // 2. Logic giữ dữ liệu cũ và hiển thị lỗi
    if (currentWeatherData) {
      // ĐÃ CÓ DỮ LIỆU CŨ → Giữ nguyên UI, chỉ hiển thị thông báo dưới ô tìm kiếm (RẤT QUAN TRỌNG)
      showSearchFeedback(
        `${friendlyMessage} Đang hiển thị dữ liệu gần nhất.`,
        "error"
      );
      
      // Ở đây KHÔNG gọi displayError() để giữ lại dữ liệu cũ.

    } else {
      // CHƯA TỪNG LOAD THÀNH CÔNG → Hiển thị lỗi toàn bộ UI và cũng hiển thị dưới ô tìm kiếm.
      showSearchFeedback(friendlyMessage, "error", 0); // Hiển thị lỗi vĩnh viễn (duration=0)
      displayError(friendlyMessage); 
    }
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

// ===============================
// HELPER & INTERACTION CHO FORECAST
// ===============================

function showSearchFeedback(message, type = "error", duration = 5000) {
  const feedbackEl = document.getElementById("search-feedback");
  if (!feedbackEl) return;
  feedbackEl.textContent = message;
  feedbackEl.classList.remove("is-error", "is-success");
  if (type === "success") {
    feedbackEl.classList.add("is-success");
  } else {
    feedbackEl.classList.add("is-error");
  }
  feedbackEl.hidden = false;
  if (searchFeedbackTimeoutId) {
    clearTimeout(searchFeedbackTimeoutId);
  }
  if (duration > 0) {
    searchFeedbackTimeoutId = setTimeout(() => {
      hideSearchFeedback();
    }, duration);
  }
}

function hideSearchFeedback() {
  const feedbackEl = document.getElementById("search-feedback");
  if (!feedbackEl) return;
  feedbackEl.hidden = true;
  feedbackEl.classList.remove("is-error", "is-success");
  if (searchFeedbackTimeoutId) {
    clearTimeout(searchFeedbackTimeoutId);
    searchFeedbackTimeoutId = null;
  }
}

function getUnitSymbol() {
  return currentUnit === "C" ? "°C" : "°F";
}

function convertTemperatureValue(value) {
  if (value === null || value === undefined || isNaN(value)) return null;
  const converted =
    currentUnit === "C" ? Number(value) : celsiusToFahrenheit(Number(value));
  return Math.round(converted);
}

function groupForecastByDay(list, today) {
  if (!Array.isArray(list) || !today) return [];
  const dayBuckets = {};
  const todayTime = today.getTime();

  list.forEach((item) => {
    if (!item?.dt) return;
    const itemDate = new Date(item.dt * 1000);
    if (itemDate.getTime() <= todayTime) return;
    const dateKey = itemDate.toISOString().split("T")[0];
    if (!dayBuckets[dateKey]) {
      dayBuckets[dateKey] = [];
    }
    dayBuckets[dateKey].push(item);
  });

  return Object.keys(dayBuckets)
    .sort()
    .map((key) => {
      const entries = dayBuckets[key].sort((a, b) => a.dt - b.dt);
      const representative = findRepresentativeEntry(entries);
      const dateObj = new Date(entries[0].dt * 1000);
      return {
        dateKey: key,
        entries,
        representative,
        dayName: dateObj.toLocaleDateString("vi-VN", { weekday: "short" }),
        dateLabel: dateObj.toLocaleDateString("vi-VN", {
          day: "numeric",
          month: "short",
        }),
        fullLabel: dateObj.toLocaleDateString("vi-VN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      };
    })
    .slice(0, 5);
}

function findRepresentativeEntry(entries = []) {
  if (!entries.length) return null;
  const midday = entries.find((entry) => {
    const hour = new Date(entry.dt * 1000).getHours();
    return hour === 12;
  });
  return midday || entries[Math.floor(entries.length / 2)];
}

function handleForecastItemClick(index) {
  if (!dailyForecastData[index]) return;
  applyForecastSelection(dailyForecastData[index], index);
}

function applyForecastSelection(dayData, index, options = {}) {
  if (!dayData?.representative) return;

  selectedForecastContext = { dayData, index };

  if (!options.skipHighlight) {
    highlightForecastItem(index);
  }

  applySnapshotToMainCard(dayData.representative, {
    dateLabel: dayData.fullLabel,
    suffix: "Dự báo",
  });

  setChartLockState(true);

  if (!options.skipChart) {
    updateChartForDay(dayData.entries);
  }
}

function highlightForecastItem(index) {
  const forecastItems = document.querySelectorAll(
    "#forecast-list .forecast-item"
  );
  forecastItems.forEach((item, idx) => {
    item.classList.toggle("is-active", idx === index);
  });
}

function updateChartForDay(entries = []) {
  if (typeof updateChart !== "function" || !entries.length) return;
  const unitSymbol = getUnitSymbol();
  const hourlySeries = entries.map((item) => ({
    time: new Date(item.dt * 1000).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    temp:
      convertTemperatureValue(item.main?.temp) ??
      Math.round(item.main?.temp ?? 0),
  }));
  updateChart(hourlySeries, unitSymbol);
}

function applySnapshotToMainCard(entry, options = {}) {
  if (!entry || !entry.main || !entry.weather) return;
  const unitSymbol = getUnitSymbol();
  const weatherInfo = entry.weather[0];

  const tempEl = document.getElementById("temp");
  if (tempEl && entry.main.temp !== undefined) {
    const convertedTemp = convertTemperatureValue(entry.main.temp);
    tempEl.textContent =
      convertedTemp !== null ? convertedTemp + unitSymbol : "—";
  }

  const descEl = document.getElementById("desc");
  if (descEl && weatherInfo?.description) {
    descEl.textContent = weatherInfo.description;
  }

  const feelsEl = document.getElementById("feels");
  if (feelsEl && entry.main.feels_like !== undefined) {
    const convertedFeels = convertTemperatureValue(entry.main.feels_like);
    feelsEl.textContent =
      "Cảm giác: " +
      (convertedFeels !== null ? convertedFeels + unitSymbol : "—");
  }

  const humidityEl = document.getElementById("humidity");
  if (humidityEl && entry.main.humidity !== undefined) {
    humidityEl.textContent = "Độ ẩm: " + entry.main.humidity + "%";
  }

  const windEl = document.getElementById("wind");
  if (windEl) {
    windEl.textContent =
      "Gió: " +
      Math.round(entry.wind?.speed || 0) +
      " m/s" +
      (entry.wind?.deg ? " (" + entry.wind.deg + "°)" : "");
  }

  const pressureEl = document.getElementById("pressure");
  if (pressureEl && entry.main.pressure !== undefined) {
    pressureEl.textContent = "Áp suất: " + entry.main.pressure + " hPa";
  }

  const visibilityEl = document.getElementById("visibility");
  if (visibilityEl) {
    const distance =
      entry.visibility !== undefined && entry.visibility !== null
        ? (entry.visibility / 1000).toFixed(1) + " km"
        : "—";
    visibilityEl.textContent = "Tầm nhìn: " + distance;
  }

  const cloudsEl = document.getElementById("clouds");
  if (cloudsEl && entry.clouds?.all !== undefined) {
    cloudsEl.textContent = "Mây: " + entry.clouds.all + "%";
  }

  const dateEl = document.getElementById("date");
  if (dateEl && entry.dt) {
    const label = options.dateLabel || formatFullDate(entry.dt * 1000);
    dateEl.textContent = options.suffix ? `${label} (${options.suffix})` : label;
  }

  updateBackgroundAndIcon(entry);
}

function formatFullDate(timestamp) {
  return new Date(timestamp).toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function resetForecastSelectionState() {
  selectedForecastContext = null;
  dailyForecastData = [];
  const items = document.querySelectorAll("#forecast-list .forecast-item");
  items.forEach((item) => item.classList.remove("is-active"));
  setChartLockState(false);
}

function setChartLockState(locked) {
  if (typeof window === "undefined") return;
  window.chartLockedBySelection = !!locked;
}
