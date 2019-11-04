// render icons right after loading script
feather.replace();

// get first element by class name
const getElement = classname => document.getElementsByClassName(classname)[0];

const weatherDetailsElement = getElement('weather-details');
const temperatureElement = getElement('temperature');
const timezoneElement = getElement('timezone');
const descriptionElement = getElement('description');
const pressureElement = getElement('pressure');
const humidityElement = getElement('humidity');
let weatherIconElement;

// safe parse data from local storage and get it
const safeParse = key => {
  try {
    const data = localStorage.getItem(key);
    if (data !== null) {
      return JSON.parse(data);
    }
  } catch {
    return '';
  }
  return '';
}

// safe save data to local storage
const safeUpdate = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
}

// map for showing weather icon
const weatherIconMap = {
  sun: 'sun',
  cloud: 'cloud',
  snow: 'cloud-snow',
  driz: 'cloud-drizzle',
  rain: 'cloud-rain',
  ligh: 'cloud-lightning',
  err: 'alert-octagon',
};

// update weather icon type
const changeWeatherIcon = description => {
  for (let key in weatherIconMap) {
    if (weatherIconMap.hasOwnProperty(key) && description.includes(key)) {
      if (weatherIconElement.dataset.feather !== weatherIconMap[key]) {
        weatherIconElement.dataset.feather = weatherIconMap[key];
        return true;
      }
      return false;
    }
  }
};

// safe update weather icon if it's absent or not
const safeAddWeatherIcon = description => {
  description = description.toLowerCase();

  let changed = false;
  if (!weatherIconElement) {
    weatherIconElement = document.createElement('i');
    weatherIconElement.className = 'weather-icon';
    changed = changeWeatherIcon(description);
    weatherDetailsElement.insertBefore(weatherIconElement, temperatureElement);
  } else {
    changed = changeWeatherIcon(description);
  }
 
  if (changed) {
    feather.replace();  
  }
}

timezoneElement.innerText = Intl.DateTimeFormat().resolvedOptions().timeZone;
temperatureElement.innerText = safeParse('last-temperature');
pressureElement.innerText = safeParse('last-pressure');
humidityElement.innerText = safeParse('last-humidity');

const lastDescription = safeParse('last-description');
descriptionElement.innerText = lastDescription;
safeAddWeatherIcon(lastDescription);

// parses data after getting them
const parseData = ({ data }) => {
  const { app_temp, weather } = data[0];
  
  return {
    temperature: Math.floor(app_temp),
    pressure: 0,
    humidity: 0,
    description: weather.description,
  }
}

// render data when it's loaded
const render = data => {
  if (data.error) {
    return;
  }

  const { temperature, pressure, humidity, description } = parseData(data);
  
  // update data in local storage
  safeUpdate('last-temperature', temperature);
  safeUpdate('last-description', description);
  safeUpdate('last-pressure', pressure);
  safeUpdate('last-humidity', humidity);
  safeAddWeatherIcon(description);

  // change UI
  temperatureElement.innerText = temperature;
  descriptionElement.innerText = description;
  pressureElement.innerText = pressure;
  humidityElement.innerText = humidity;
}

const setNowAndThen = (f, timeout) => {
  f();
  return setInterval(f, timeout);
}

const setNotAvailable = () => {
  safeAddWeatherIcon('error');
  descriptionElement.innerText = 'Server is not available';
};

let fetchIntervalId;

// ask for current position
let watchId = navigator.geolocation.getCurrentPosition(position => {
  const { latitude, longitude } = position.coords;
  
  // refetch new data every 5s as source is not stable
  fetchIntervalId = setNowAndThen(() => {
    try {
      fetch(`https://weatherbit-v1-mashape.p.rapidapi.com/current?lang=en&lon=${longitude}&lat=${latitude}`, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'weatherbit-v1-mashape.p.rapidapi.com',
          'x-rapidapi-key': 'h3Xhq3P5NxmshKEkDpjsgbPl6LtOp1Hro4bjsnB5pKYYR8ITI6'
        }
      })
        .then(data => data.json())
        .then(data => render(data))
        .catch(() => setNotAvailable());
    } catch {
      setNotAvailable();
    }
  }, 30000);
});

window.addEventListener('unload', () => {
  navigator.geolocation.clearWatch(watchId);
  watchId = undefined;
  if (!fetchIntervalId) {
    clearInterval(fetchIntervalId);
    fetchIntervalId = undefined;
  }
});