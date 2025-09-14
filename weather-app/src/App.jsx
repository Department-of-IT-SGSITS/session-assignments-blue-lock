import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { db } from "./firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import emailjs from "emailjs-com"; 
import "./App.css";

function App() {
  const [weather, setWeather] = useState(null);
  const [history, setHistory] = useState([]);
  const [city, setCity] = useState(""); 
  const [autoActive, setAutoActive] = useState(false); 
  const intervalRef = useRef(null); 

  const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

  // Threshold rules (alert only when toggle is ON)
  const checkThresholdAndAlert = async (data) => {
    if (!autoActive) return; 

    let alertMessage = "";

    if (data.temperature >= 35) {
      alertMessage = `🔥 Hot Weather Alert!\n${data.city} is experiencing high temperatures of ${data.temperature}°C`;
    } else if (data.temperature <= 10) {
      alertMessage = `❄️ Cold Weather Alert!\n${data.city} is experiencing low temperatures of ${data.temperature}°C`;
    } else if (data.condition.toLowerCase().includes("rain")) {
      alertMessage = `🌧️ Rain Alert!\n${data.city} is experiencing ${data.condition}`;
    } else if (data.condition.toLowerCase().includes("cloud")) {
      alertMessage = `☁️ Cloudy Weather Alert!\n${data.city} is experiencing ${data.condition}`;
    }

    if (alertMessage) {
      await sendEmail({ ...data, alertMessage });
    }
  };

  // Fetch weather
  const fetchWeather = async (selectedCity = null, saveToFirestore = false) => {
    try {
      const queryCity = selectedCity || city.trim() || "Indore"; 
      const res = await axios.get(
        `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${queryCity}&aqi=yes`
      );

      const data = res.data;

      const weatherData = {
        city: data.location.name,
        region: data.location.region,
        country: data.location.country,
        temperature: data.current.temp_c,
        condition: data.current.condition.text,
        icon: data.current.condition.icon,
        humidity: data.current.humidity,
        wind: `${data.current.wind_kph} kph ${data.current.wind_dir}`,
        last_updated: data.current.last_updated,
        date: new Date().toISOString(),
      };

      if (saveToFirestore) {
        await addDoc(collection(db, "weather"), weatherData);
        await checkThresholdAndAlert(weatherData);
      }

      setWeather(weatherData);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch weather");
    }
  };

  // Send alert email (new template)
  const sendEmail = async (weatherData) => {
    const templateParams = {
      to_email: import.meta.env.VITE_SENDER_EMAIL, 
      alert_message: weatherData.alertMessage, 
      city: weatherData.city,
      temperature: `${weatherData.temperature} °C`,
      condition: weatherData.condition,
      last_updated: weatherData.last_updated,
    };

    try {
      await emailjs.send(
        import.meta.env.VITE_EmailJS_Service_ID,
        import.meta.env.VITE_EmailJS_Template_ID,
        templateParams,
        import.meta.env.VITE_EmailJS_Public_Key
      );
      console.log("⚠️ Alert email sent successfully!");
    } catch (error) {
      console.error("Failed to send email:", error);
    }
  };

  // Fetch history from Firestore
  const fetchHistory = async () => {
    try {
      const snapshot = await getDocs(collection(db, "weather"));
      const allData = snapshot.docs.map((doc) => doc.data());
      const sortedData = allData.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      setHistory(sortedData);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch history");
    }
  };

  // Auto-refresh every 30 minutes if active
  useEffect(() => {
    if (autoActive && city.trim()) {
      fetchWeather(city, true); 
      intervalRef.current = setInterval(() => {
        fetchWeather(city, true); 
      }, 30 * 60 * 1000); // Replace with 30 * 60 * 1000 for real 30 mins
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [autoActive, city]);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1 style={{ marginLeft: "20px" }}>SkyCast</h1>

      {/* Input box for city */}
      <input
        type="text"
        placeholder="Enter city"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        style={{
          padding: "8px",
          marginRight: "10px",
          border: "1px solid gray",
          borderRadius: "5px",
        }}
      />
      <button onClick={() => fetchWeather(city, false)}>Show Weather Info</button>

      {/* Toggle Button */}
      <button
        onClick={() => setAutoActive(!autoActive)}
        style={{
          marginLeft: "10px",
          padding: "8px",
          backgroundColor: autoActive ? "green" : "gray",
          color: "white",
          border: "none",
          borderRadius: "5px",
        }}
      >
        {autoActive ? "Active (Auto Fetch ON)" : "Inactive (Auto Fetch OFF)"}
      </button>

      {/* Current Weather Display */}
      {weather && (
        <div style={{ marginTop: "20px" }}>
          <h2>
            {weather.city}, {weather.region}, {weather.country}
          </h2>
          <img src={weather.icon} alt={weather.condition} />
          <p>🌡️ Temperature : {weather.temperature}°C</p>
          <p>🌥️ Condition : {weather.condition}</p>
          <p>💧 Humidity: {weather.humidity}%</p>
          <p>🌬️ Wind: {weather.wind}</p>
          <p>🕒 Last updated: {weather.last_updated}</p>
        </div>
      )}

      <hr />

      {/* Historical Data Button */}
      <button onClick={fetchHistory}>Show Historical Data</button>

      {/* ✅ Historical Weather Table */}
      {history.length > 0 && (
        <table
          style={{
            marginTop: "20px",
            borderCollapse: "collapse",
            width: "100%",
            textAlign: "left",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f2f2f2" }}>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>City</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Region</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Country</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Temp (°C)</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Condition</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Humidity</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Wind</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item, idx) => (
              <tr key={idx}>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{item.city}</td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{item.region}</td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{item.country}</td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{item.temperature}</td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{item.condition}</td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{item.humidity}%</td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{item.wind}</td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{item.last_updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;






































// import { useState } from "react";
// import axios from "axios";
// import { db } from "./firebase";
// import { collection, addDoc, getDocs } from "firebase/firestore";
// import emailjs from "emailjs-com"; 
// import "./App.css";

// function App() {
//   const [weather, setWeather] = useState(null);
//   const [history, setHistory] = useState([]);
//   const [city, setCity] = useState(""); // state for input city

//   const WEATHER_API_KEY = "4fd82e81516d45dbaf890731251309";

//   // Fetch current weather & store in Firestore
//   const fetchWeather = async () => {
//     try {
//       const queryCity = city.trim() || "Indore"; 
//       const res = await axios.get(
//         `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${queryCity}&aqi=yes`
//       );

//       const data = res.data;

//       const weatherData = {
//         city: data.location.name,
//         region: data.location.region,
//         country: data.location.country,
//         temperature: data.current.temp_c,
//         condition: data.current.condition.text,
//         icon: data.current.condition.icon,
//         humidity: data.current.humidity,
//         wind: `${data.current.wind_kph} kph ${data.current.wind_dir}`,
//         last_updated: data.current.last_updated,
//         date: new Date().toISOString(), // for Firestore history
//       };

//       // Save to Firestore
//       await addDoc(collection(db, "weather"), weatherData);

//       setWeather(weatherData);

//       // Send email via EmailJS
//       await sendEmail(weatherData);
//     } catch (err) {
//       console.error(err);
//       alert("Failed to fetch weather");
//     }
//   };

//   // Send weather email
//   const sendEmail = async (weatherData) => {
//     const templateParams = {
//       to_email: "blogvista.contact@gmail.com", 
//       city: weatherData.city,
//       region: weatherData.region,
//       country: weatherData.country,
//       temperature: `${weatherData.temperature} °C`,
//       condition: weatherData.condition,
//       humidity: `${weatherData.humidity}%`,
//       wind: weatherData.wind,
//       last_updated: weatherData.last_updated,
//     };

//     try {
//       await emailjs.send(
//         "service_ynj4xyu", // EmailJS service ID
//         "template_wzns2i9", // EmailJS template ID
//         templateParams,
//         "QHcFw6tJTo66sRFyi" // EmailJS public key
//       );
//       console.log("Email sent successfully!");
//     } catch (error) {
//       console.error("Failed to send email:", error);
//     }
//   };

//   // Fetch all historical data from Firestore
//   const fetchHistory = async () => {
//     try {
//       const snapshot = await getDocs(collection(db, "weather"));
//       const allData = snapshot.docs.map((doc) => doc.data());

//       // Sort by date (latest first)
//       const sortedData = allData.sort(
//         (a, b) => new Date(b.date) - new Date(a.date)
//       );

//       setHistory(sortedData);
//     } catch (err) {
//       console.error(err);
//       alert("Failed to fetch history");
//     }
//   };

//   return (
//     <div style={{ padding: "20px", fontFamily: "Arial" }}>
//       <h1 style={{ marginLeft: "20px" }}>SkyCast</h1>

//       {/* Input box for city */}
//       <input
//         type="text"
//         placeholder="Enter city"
//         value={city}
//         onChange={(e) => setCity(e.target.value)}
//         style={{
//           padding: "8px",
//           marginRight: "10px",
//           border: "1px solid gray",
//           borderRadius: "5px",
//         }}
//       />
//       <button onClick={fetchWeather}>Show Weather Info</button>

//       {/* Current Weather Display */}
//       {weather && (
//         <div style={{ marginTop: "20px" }}>
//           <h2>
//             {weather.city}, {weather.region}, {weather.country}
//           </h2>
//           <img src={weather.icon} alt={weather.condition} />
//           <p>🌡️ Temprature : {weather.temperature}°C</p>
//           <p>🌥️ Condition : {weather.condition}</p>
//           <p>💧 Humidity: {weather.humidity}%</p>
//           <p>🌬️ Wind: {weather.wind}</p>
//           <p>🕒 Last updated: {weather.last_updated}</p>
//         </div>
//       )}

//       <hr />

//       {/* Historical Data Button */}
//       <button onClick={fetchHistory}>Show Historical Data</button>

//       {/* Historical Weather List */}
//       <ul style={{ marginTop: "20px" }}>
//         {history.map((item, idx) => (
//           <li key={idx} style={{ marginBottom: "10px" }}>
//             <strong>
//               {item.city}, {item.region} ({item.country})
//             </strong>
//             <br />
//             🌡️ Temprature : {item.temperature}°C | 🌥️ Condition : {item.condition}
//             <br />
//             💧 Humidity: {item.humidity}% | 🌬️ Wind: {item.wind}
//             <br />
//             🕒 Last updated: {item.last_updated}
//             <hr />
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

// export default App;
