/**
 * 地理位置、5公里範圍過濾、距離計算與導航引導服務
 */

// Haversine 公式計算兩經緯度點之間的距離（單位：公里）
export function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // 地球半徑 (km)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

// 格式化顯示距離 (例如 350 公尺 或 2.4 公里)
export function formatDistance(distanceKm) {
  if (distanceKm == null || isNaN(distanceKm)) return '--';
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} 公尺`;
  }
  return `${distanceKm.toFixed(1)} 公里`;
}

// 預估步行時間（分鐘），平均步行速度以 4.5 km/h 估計
export function estimateWalkingTimeMinutes(distanceKm) {
  if (distanceKm == null || isNaN(distanceKm)) return 0;
  const minutes = Math.ceil((distanceKm / 4.5) * 60);
  return minutes > 0 ? minutes : 1;
}

// 計算方位角與繁體中文方向描述 (如: 往東北方向)
export function getBearingDirection(lat1, lon1, lat2, lon2) {
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  brng = (brng + 360) % 360;

  if (brng >= 337.5 || brng < 22.5) return "正北方向";
  if (brng >= 22.5 && brng < 67.5) return "東北方向";
  if (brng >= 67.5 && brng < 112.5) return "正東方向";
  if (brng >= 112.5 && brng < 157.5) return "東南方向";
  if (brng >= 157.5 && brng < 202.5) return "正南方向";
  if (brng >= 202.5 && brng < 247.5) return "西南方向";
  if (brng >= 247.5 && brng < 292.5) return "正西方向";
  if (brng >= 292.5 && brng < 337.5) return "西北方向";
  return "前進方向";
}

// 篩選指定半徑公里內的點位清單
export function filterWithinRadius(items, userLat, userLng, radiusKm = 5) {
  if (!userLat || !userLng || !Array.isArray(items)) return items;

  return items
    .map(item => {
      const dist = getDistanceKm(userLat, userLng, item.lat, item.lng);
      return { ...item, distanceKm: dist };
    })
    .filter(item => item.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
