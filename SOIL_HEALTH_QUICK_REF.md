# 🌱 Soil Health API - Quick Reference Card

## 📍 Base URL
```
http://localhost:3000/api/soil-health
```

## 🔑 Authentication
All endpoints except `/ranges` require JWT token:
```
Authorization: Bearer YOUR_TOKEN
```

---

## 📋 Endpoints

### 1️⃣ Get Health Ranges (Public)
```bash
GET /api/soil-health/ranges
```
Returns: Reference ranges for all 8 soil parameters

---

### 2️⃣ Farmer Weekly Summary
```bash
GET /api/soil-health/farmer/:farmerId/weekly
```
Returns: Weekly summaries from planting to harvest

**Example:**
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/soil-health/farmer/123/weekly
```

---

### 3️⃣ Farmer Current Health
```bash
GET /api/soil-health/farmer/:farmerId/current
```
Returns: Latest soil health status

**Example:**
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/soil-health/farmer/123/current
```

---

### 4️⃣ All Farmers Summary
```bash
GET /api/soil-health/farmers/summary
```
Returns: Current health for all farmers

**Example:**
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/soil-health/farmers/summary
```

---

### 5️⃣ Weekly by Devices
```bash
POST /api/soil-health/weekly
Content-Type: application/json

{
  "sensorDevices": ["DEVICE_001", "DEVICE_002"],
  "location": "District B",
  "plantingDate": "2026-01-28",
  "harvestDate": "2026-04-28"
}
```

---

### 6️⃣ Current by Devices
```bash
POST /api/soil-health/current
Content-Type: application/json

{
  "sensorDevices": ["DEVICE_001"],
  "location": "District B"
}
```

---

## 🎨 Status Values

### Soil Status
- ✅ `Healthy` - All parameters within range
- ❌ `Not Healthy` - One or more issues detected
- ⏳ `Pending` - Insufficient data

### Watering Status
- ✅ `Appropriate` - Moisture and temp optimal
- 💧 `Needs More Water` - Too dry or too hot
- 🚫 `Reduce Watering` - Too wet
- ⏳ `Pending` - Insufficient data

### Nutrient Level
- ✅ `Appropriate` - N, P, K all good
- ⬇️ `Low - Needs Fertilizer` - Any NPK below min
- ⬆️ `High - Reduce Fertilizer` - Any NPK above max
- ⏳ `Pending` - Insufficient data

---

## 📊 Healthy Ranges

| Param | Min | Max | Unit |
|-------|-----|-----|------|
| N | 20 | 50 | mg/kg |
| P | 10 | 30 | mg/kg |
| K | 80 | 200 | mg/kg |
| pH | 6.0 | 7.0 | - |
| EC | 0.2 | 2.0 | dS/m |
| Moisture | 15 | 35 | % VWC |
| Temp | 18 | 30 | °C |
| Salinity | 0.2 | 2.0 | dS/m |

---

## 🔗 Frontend Integration

### Service Function
```javascript
import { getFarmerWeeklySummary } from '../services/soilHealthService';

const summary = await getFarmerWeeklySummary(farmerId, token);
```

### React Component
```jsx
function SoilHealth({ farmerId }) {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    async function load() {
      const result = await getFarmerWeeklySummary(farmerId, token);
      setData(result);
    }
    load();
  }, [farmerId]);
  
  return (
    <div>
      {data?.weeks.map(week => (
        <div key={week.week}>
          <h3>Week {week.week}: {week.analysis.soilStatus}</h3>
        </div>
      ))}
    </div>
  );
}
```

---

## 🧪 Testing

### Thunder Client
1. Import: `thunder-tests/soil-health-api.json`
2. Set variables: `baseUrl`, `authToken`, `farmerId`
3. Run requests

### Example Script
```bash
node backend/example-soil-health.js
```

---

## 📁 Documentation

- **API Docs**: `backend/SOIL_HEALTH_API.md`
- **System Guide**: `backend/SOIL_HEALTH_README.md`
- **Frontend Guide**: `frontend/SOIL_HEALTH_INTEGRATION.md`
- **Summary**: `SOIL_HEALTH_SUMMARY.md`

---

## ⚠️ Common Issues

**Error: Farmer not found**
- Check farmerId exists in database

**Error: No sensor devices**
- Ensure farmer has `sensor_devices` configured

**Error: No data available**
- Check InfluxDB has data for devices
- Verify date range includes data

**Error: Authentication failed**
- Check token is valid and not expired

---

## 🎯 Quick Commands

```bash
# Start backend
cd backend && npm run dev

# Test public endpoint
curl http://localhost:3000/api/soil-health/ranges

# Test with auth (replace TOKEN and ID)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/soil-health/farmer/1/weekly

# Run examples
node backend/example-soil-health.js
```

---

## 📞 Need Help?

1. Check API docs: `backend/SOIL_HEALTH_API.md`
2. Review examples: `backend/example-soil-health.js`
3. Test in Thunder Client
4. Check console logs for errors

---

**🌱 Soil Health Analysis Engine v1.0**  
**Ready to use! 🚀**
