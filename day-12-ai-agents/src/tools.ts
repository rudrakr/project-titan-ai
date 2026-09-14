export async function getWeather(city: string) {
  return {
    city,
    temperature: 18,
    condition: "Partly cloudy",
  };
}