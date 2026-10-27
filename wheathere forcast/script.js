
const searchForm = document.getElementById("searchForm");
const searchButton = searchForm.querySelector('button[type="submit"]');
const cityInput = document.getElementById("cityInput");
const statusMessage = document.getElementById("statusMessage");

const currentWeather = document.getElementById("currentWeather");
const cityName = document.getElementById("cityName");
const weatherDescription = document.getElementById("weatherDescription");
const weatherIcon = document.getElementById("weatherIcon");
const temperature = document.getElementById("temperature");
const feelsLike = document.getElementById("feelsLike");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");

const forecastContainer = document.getElementById("forecastContainer");

// Abhi API key ki jagah placeholder hai.
// Apni actual key baad mein add karenge.
const API_KEY = "97d802508d63d41734836a39be073cd5";


searchForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const city = cityInput.value.trim();

    if (city === "") {
        statusMessage.textContent = "Please enter a city name.";
        return;
    }

    if (API_KEY === "YOUR_API_KEY_HERE") {
        statusMessage.textContent =
            "Please configure your OpenWeather API key.";
        return;
    }

    searchButton.disabled = true;
    searchButton.textContent = "Loading...";
    statusMessage.textContent = "Fetching weather data...";
    currentWeather.hidden = true;
    forecastContainer.innerHTML = "";

    try {
        await getWeather(city);
    } catch (error) {
        statusMessage.textContent = error.message;
        currentWeather.hidden = true;
        forecastContainer.innerHTML = "";
    } finally {
        searchButton.disabled = false;
        searchButton.textContent = "Search";
    }
});


   

async function getWeather(city) {
    const currentUrl =
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

    const forecastUrl =
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

    const [currentResponse, forecastResponse] = await Promise.all([
        fetch(currentUrl),
        fetch(forecastUrl)
    ]);

    if (!currentResponse.ok || !forecastResponse.ok) {
        if (currentResponse.status === 404 || forecastResponse.status === 404) {
            throw new Error("City not found. Please check the spelling.");
        }

        if (currentResponse.status === 401 || forecastResponse.status === 401) {
            throw new Error("API key invalid or not active yet. Please check your key.");
        }

        throw new Error("Unable to load weather. Please try again.");
    }

    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();

    displayCurrentWeather(currentData);
    displayForecast(forecastData);

    statusMessage.textContent = `Weather loaded for ${currentData.name}.`;
}

function displayCurrentWeather(data) {
    cityName.textContent = `${data.name}, ${data.sys.country}`;
    weatherDescription.textContent = data.weather[0].description;
    temperature.textContent = `${Math.round(data.main.temp)}°C`;
    feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;
    humidity.textContent = `${data.main.humidity}%`;
    windSpeed.textContent = `${data.wind.speed} m/s`;

    const iconCode = data.weather[0].icon;
    weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    weatherIcon.alt = data.weather[0].description;

    currentWeather.hidden = false;
}

function displayForecast(data) {
    forecastContainer.innerHTML = "";

    // API har 3 hours ka forecast deta hai.
    // Hum har din ka ek afternoon forecast select karenge.
    const dailyForecasts = data.list.filter(function (item) {
        return item.dt_txt.includes("12:00:00");
    }).slice(0, 5);

    dailyForecasts.forEach(function (item) {
        const date = new Date(item.dt_txt);

        const dayName = date.toLocaleDateString("en-US", {
            weekday: "short"
        });

        const iconCode = item.weather[0].icon;
        const description = item.weather[0].description;
        const temp = Math.round(item.main.temp);

        const forecastCard = document.createElement("article");
        forecastCard.className = "forecast-card";

        forecastCard.innerHTML = `
            <h3>${dayName}</h3>
            <img
                src="https://openweathermap.org/img/wn/${iconCode}.png"
                alt="${description}"
            >
            <p>${temp}°C</p>
           <p class="forecast-description">${description}</p>
        `;

        forecastContainer.appendChild(forecastCard);
    });
}
