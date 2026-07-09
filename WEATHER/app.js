const startBtn = document.querySelector(".start");
const search = document.querySelector("#inputfield");
const searchIcon = document.querySelector("#searchIcon");
const desc = document.querySelector("#desc");
const temp = document.querySelector("#temp");
const cityName = document.querySelector("#city");
const wind = document.querySelector("#windSpeed");
const humidity = document.querySelector("#humidityper");
const goHome = document.querySelector(".homeBtn");
const icon = document.querySelector("#icon");
const mainBox1 = document.querySelector(".mainBox1");
const mainBox2 = document.querySelector(".mainBox2");
const mainBox3 = document.querySelector(".mainBox3");
const backBtn = document.querySelector("#backBtn");


startBtn.addEventListener("click", () => {
    mainBox1.classList.add("inactive");
    mainBox2.classList.remove("inactive");
    document.body.classList.add("bg-active");
});

function mapWeatherCode(code) {
    if (code === 0) return "Clear";
    if (code === 1 || code === 2 || code === 3) return "Clouds";
    if (code >= 45 && code <= 48) return "Mist";
    if (code >= 51 && code <= 67) return "Rain";
    if (code >= 71 && code <= 77) return "Snow";
    if (code >= 80 && code <= 82) return "Rain";
    if (code >= 85 && code <= 86) return "Snow";
    if (code >= 95) return "Rain";
    return "Clear";
}

function changeIcon(weatherMain) {
    let icons = {
        Clouds: "clouds.png",
        Rain: "rain.png",
        Mist: "mist.png",
        Haze: "haze.png",
        Snow: "snow.png",
        Clear: "clear.png"
    };
    icon.src = icons[weatherMain] || "clear.png";
}

async function getWeatherData(city) {
    try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            mainBox2.classList.add("inactive");
            mainBox3.classList.remove("inactive");
            document.body.classList.remove("bg-active");
            document.getElementById("weatherData").classList.add("inactive");
            desc.innerHTML = "--";
            temp.innerHTML = "--°c";
            cityName.innerHTML = "City Name";
            wind.innerHTML = "--km/h";
            humidity.innerHTML = "--%";
            search.value = "";
            icon.src = "clear.png";
            return;
        }

        const lat = geoData.results[0].latitude;
        const lon = geoData.results[0].longitude;
        const resolvedCity = geoData.results[0].name;

        // current weather
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&past_days=15&forecast_days=4`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();

        console.log("Fetched Data (15 days past + 3 days forecast):", weatherData.daily);

        const current = weatherData.current;
        const daily = weatherData.daily;

        // UI
        let weatherMain = mapWeatherCode(current.weather_code);
        desc.innerHTML = weatherMain;
        temp.innerHTML = Math.round(current.temperature_2m) + "°c";
        cityName.innerHTML = resolvedCity;
        wind.innerHTML = current.wind_speed_10m + "km/h";
        humidity.innerHTML = current.relative_humidity_2m + "%";

        // Show weather data container
        document.getElementById("weatherData").classList.remove("inactive");

        changeIcon(weatherMain);

        // forecast
        const forecastBox = document.querySelector("#forecastBox");
        if (forecastBox) {
            forecastBox.innerHTML = "";

            // Yesterday
            if (daily.time[14]) {
                const maxTemp = Math.round(daily.temperature_2m_max[14]);
                const minTemp = Math.round(daily.temperature_2m_min[14]);
                const item = document.createElement("div");
                item.className = "forecastItem";
                item.innerHTML = `<span>Yesterday</span> <span>${maxTemp}°c / ${minTemp}°c</span>`;
                forecastBox.appendChild(item);
            }

            // Future forecast
            for (let i = 16; i <= 18; i++) {
                if (daily.time[i]) {
                    const date = new Date(daily.time[i]);
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                    const maxTemp = Math.round(daily.temperature_2m_max[i]);
                    const minTemp = Math.round(daily.temperature_2m_min[i]);

                    const item = document.createElement("div");
                    item.className = "forecastItem";
                    item.innerHTML = `<span>${dayName}</span> <span>${maxTemp}°c / ${minTemp}°c</span>`;
                    forecastBox.appendChild(item);
                }
            }
        }

    } catch (e) {
        console.error("Error fetching weather data:", e);
    }
}

searchIcon.addEventListener("click", () => {
    getWeatherData(search.value);
})

search.addEventListener("keypress", (e) => {
    if (e.key == "Enter") {
        getWeatherData(search.value);
    }
})

goHome.addEventListener("click", () => {
    mainBox3.classList.add("inactive");
    mainBox1.classList.remove("inactive");
    document.body.classList.remove("bg-active");
})

if (backBtn) {
    backBtn.addEventListener("click", () => {
        mainBox2.classList.add("inactive");
        mainBox1.classList.remove("inactive");
        document.body.classList.remove("bg-active");
    });
}