export async function searchNearby(map, location, radius = 5000, keyword = "") {
  const service = new google.maps.places.PlacesService(map);

  return new Promise((resolve, reject) => {
    service.nearbySearch(
      {
        location,
        radius,
        keyword
      },
      (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          resolve(results);
        } else {
          reject(status);
        }
      }
    );
  });
}
