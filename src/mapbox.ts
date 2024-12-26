import pLimit from "p-limit";

export const obtenerCoordenadasLotesLimitado = async (
  direcciones: string[],
  proximity?: [number, number] // [longitud, latitud]
): Promise<{ [direccion: string]: number[] }> => {
  const accessToken =
    "pk.eyJ1IjoibWF5YmVhZGV2IiwiYSI6ImNtNDR0Z25hNDByNXYyanExbGZsdm5ibzkifQ.9Bk8eWPNN9HVdTfwATCXmA";

  const fetchCoordenadas = async (direccion: string): Promise<number[]> => {
    const bbox = "-75.644,-55.05,-66.959,-17.5";

    // Construir la URL del endpoint
    let url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(
      direccion
    )}&access_token=${accessToken}&bbox=${bbox}`;

    // Agregar el parámetro de proximidad si está disponible
    if (proximity) {
      url += `&proximity=${proximity[0]},${proximity[1]}`;
    } else {
      const prox = [-72.95, -41.46];
      url += `&proximity=${prox[0]},${prox[1]}`;
    }
    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const lugar = data.features[0];
        const coordenadas = lugar.geometry.coordinates; // [longitud, latitud]
        return coordenadas;
      } else {
        return [0, 0]; // Coordenadas predeterminadas si no hay resultados
      }
    } catch (error) {
      console.error(`Error al obtener coordenadas para ${direccion}:`, error);
      return [0, 0]; // Coordenadas predeterminadas en caso de error
    }
  };

  // Limitar concurrencia a 10 solicitudes a la vez
  const limit = pLimit(20);

  const resultados = await Promise.all(
    direcciones.map((direccion) =>
      limit(() =>
        fetchCoordenadas(direccion).then((coords) => ({ direccion, coords }))
      )
    )
  );

  return resultados.reduce((acc, { direccion, coords }) => {
    acc[direccion] = coords;
    return acc;
  }, {} as { [direccion: string]: number[] });
};

export const obtenerCoordenadas = async (
  direccion: string
): Promise<number[]> => {
  
  const accessToken =
    "pk.eyJ1IjoibWF5YmVhZGV2IiwiYSI6ImNtNDR0Z25hNDByNXYyanExbGZsdm5ibzkifQ.9Bk8eWPNN9HVdTfwATCXmA"; // Tu token de Mapbox

    const bbox = "-75.644,-55.05,-66.959,-17.5";

    // Construir la URL del endpoint
    let url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(
      direccion
    )}&access_token=${accessToken}&bbox=${bbox}`;

      const prox = [-72.95, -41.46];
      url += `&proximity=${prox[0]},${prox[1]}`;
    

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const lugar = data.features[0]; // El primer resultado más relevante
      const coordenadas = lugar.geometry.coordinates; // [longitud, latitud]
      console.log(`Coordenadas de ${direccion}:`, coordenadas);
      return coordenadas; // Devuelve las coordenadas
    } else {
      console.log("No se encontraron resultados.");
      return [0, 0]; // Devuelve un valor predeterminado en caso de no encontrar coordenadas
    }
  } catch (error) {
    console.error("Error al obtener las coordenadas:", error);
    return [0, 0]; // Devuelve un valor predeterminado en caso de error
  }
};
