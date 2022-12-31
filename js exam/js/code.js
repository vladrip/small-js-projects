const weatherApi = {
    key: "e09001b354ee7aa153636c83fb9aca3e",
    base: "https://api.openweathermap.org/data/2.5/",
    icons: "http://openweathermap.org/img/wn/"
}

let forecast, isMetric = true, lang = "en", lat, lon;
let input = document.getElementById("search-textfield");
let searchIcon = document.getElementById("search-icon");
let autocomplete = new google.maps.places.Autocomplete(input, { types: ["(cities)"] });
let slider = document.getElementById("weather-slider");

google.maps.event.addListener(autocomplete, "place_changed", updateWeather);
document.getElementById("celsius").addEventListener("change", changeTempSystem);
document.getElementById("farenheit").addEventListener("change", changeTempSystem);

if (localStorage.getItem("place") == null || localStorage.getItem("place") == "undefined") {
    searchIcon.style.backgroundImage = 'url("images/loading.gif")';
    navigator.geolocation.getCurrentPosition(geo => {
        lat = geo.coords.latitude;
        lon = geo.coords.longitude;
        updateWeather(false);
    }, () => {
        lat = 50.4501;
        lon = 30.5234;
        updateWeather(false);
    });
} else updateWeather(true);

function updateWeather(updateCoords = true) {
    searchIcon.style.backgroundImage = 'url("images/loading.gif")'; 
    let place = autocomplete.getPlace();
    if (updateCoords) {
        if (place == undefined) {
            place = JSON.parse(localStorage.getItem("place"));
            input.value = place.formatted_address;
            lat = place.geometry.location.lat, lon = place.geometry.location.lng;
        } else {
            localStorage.setItem("place", JSON.stringify(place));
            lat = place.geometry.location.lat(), lon = place.geometry.location.lng();
        }
    }

    fetch(`${weatherApi.base}forecast?lat=${lat}&lon=${lon}&units=${isMetric ? "metric" : "imperial"}&lang=${lang}&appid=${weatherApi.key}`)
    .then(weatherPromise => {
        return weatherPromise.json();
    }).then(_forecast => {
        console.log(_forecast);
        if (!updateCoords)
            input.value = _forecast.city.name + ", " + _forecast.city.country;
        slider.textContent = "";
        forecast = _forecast;
        _forecast.list.forEach(el => addSliderElement(el));
        updateChosenWeather({target: slider.children[0]});
        document.getElementById("search-icon").style.backgroundImage = 'url("images/geo.svg")';
    });
}

function changeTempSystem() {
    isMetric = !isMetric;
    updateWeather();
}

function addSliderElement(weather) {
    let date = new Date(parseInt(weather.dt) * 1000);
    let dateHour = date.getHours();

    let card = document.createElement("div");
    card.className = "col-3 col-sm-2 col-xl-1";
    card.style.border = "1px solid gainsboro";
    card.style.borderTop = "0"; card.style.borderBottom = "0";
    if (dateHour == 21)
        card.style.borderRight = "1px solid gray";
    else if (dateHour == 0)
        card.style.borderLeft = "1px solid gray";
    if (slider.childElementCount == 0)
        card.style.borderLeft = "0";
    else if (slider.childElementCount == 39)
        card.style.borderRight = "0";
    
    let day = document.createElement("p");
    day.className = "text-muted mb-0";
    day.textContent = date.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase();
    card.appendChild(day);

    let hour = document.createElement("p");
    hour.className = "mb-0 mt-1";
    hour.textContent = dateHour + ":00";
    card.appendChild(hour);

    let icon = document.createElement("div");
    icon.className = "weather-icon";
    icon.style.backgroundImage = `url("${weatherApi.icons}${weather.weather[0].icon}@2x.png")`;
    icon.style.filter = "brightness(92%)";
    card.appendChild(icon);

    let temp = document.createElement("h6");
    temp.className = "text-primary ms-1";
    temp.textContent = Math.round(weather.main.temp) + (isMetric ? "°C" : "°F");
    card.appendChild(temp);

    card.childNodes.forEach(node => node.style.pointerEvents = "none");
    card.addEventListener("click", updateChosenWeather);
    slider.appendChild(card);
}

function updateChosenWeather(event) {
    let weather = forecast.list[Array.prototype.indexOf.call(event.target.parentNode.children, event.target)];
    console.log(weather);

    let date = new Date(parseInt(weather.dt) * 1000);
    document.getElementById("chosen-time").textContent = date.toLocaleDateString(isMetric ? "en-GB" : "en-US", { weekday: "long", hour: "numeric", minute: "numeric" });
    document.getElementById("chosen-date").textContent = date.toLocaleDateString("en-GB", { month: "long", day: "numeric" });

    let icon = document.getElementById("chosen-icon");
    icon.style.backgroundImage = `url("${weatherApi.icons}${weather.weather[0].icon}@4x.png")`;
    icon.style.filter = "brightness(92%)";
    icon.title = weather.weather[0].description;

    document.getElementById("chosen-temp").textContent = Math.round(weather.main.temp) + (isMetric ? "°C" : "°F");
    document.getElementById("chosen-condition").textContent = weather.weather[0].main;
    document.getElementById("chosen-description").textContent = weather.weather[0].description;
    document.getElementById("precipitation").textContent = parseInt(weather.pop * 100) + "%";
    document.getElementById("humidity").textContent = weather.main.humidity + "%";
    document.getElementById("wind").textContent = isMetric ? Math.round(weather.wind.speed * 3.6) + " km/hour" : Math.round(weather.wind.speed) + " miles/hour";
    document.getElementById("cloudiness").textContent = weather.clouds.all + "%";
    document.getElementById("pressure").textContent = weather.main.pressure + " hPa";
    let visibility = isMetric ? weather.visibility / 1000 : weather.visibility / 1609;
    document.getElementById("visibility").textContent = +(Math.round(visibility + "e+2")  + "e-2") + (isMetric ? " km" : " miles");
    document.getElementById("wind-direction").textContent = weather.wind.deg + "°";
}