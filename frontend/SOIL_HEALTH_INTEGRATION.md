# Frontend Integration Guide - Soil Health Analysis

## Overview

This guide shows how to integrate the Soil Health Analysis API into your frontend application.

## 📦 API Service Module

Create `src/services/soilHealthService.js`:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Get soil health reference ranges
 * @returns {Promise<Object>} Health ranges and issue descriptions
 */
export async function getHealthRanges() {
  const response = await fetch(`${API_BASE_URL}/api/soil-health/ranges`);
  if (!response.ok) throw new Error('Failed to fetch health ranges');
  return response.json();
}

/**
 * Get weekly soil health summary for a farmer
 * @param {string|number} farmerId - Farmer ID
 * @param {string} token - JWT auth token
 * @returns {Promise<Object>} Weekly summary with analysis
 */
export async function getFarmerWeeklySummary(farmerId, token) {
  const response = await fetch(
    `${API_BASE_URL}/api/soil-health/farmer/${farmerId}/weekly`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  if (!response.ok) throw new Error('Failed to fetch weekly summary');
  return response.json();
}

/**
 * Get current soil health for a farmer
 * @param {string|number} farmerId - Farmer ID
 * @param {string} token - JWT auth token
 * @returns {Promise<Object>} Current soil health status
 */
export async function getFarmerCurrentHealth(farmerId, token) {
  const response = await fetch(
    `${API_BASE_URL}/api/soil-health/farmer/${farmerId}/current`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  if (!response.ok) throw new Error('Failed to fetch current health');
  return response.json();
}

/**
 * Get soil health summary for all farmers
 * @param {string} token - JWT auth token
 * @returns {Promise<Object>} All farmers health summary
 */
export async function getAllFarmersSummary(token) {
  const response = await fetch(
    `${API_BASE_URL}/api/soil-health/farmers/summary`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  if (!response.ok) throw new Error('Failed to fetch farmers summary');
  return response.json();
}

/**
 * Get weekly summary by sensor devices
 * @param {Object} params - Parameters
 * @param {Array<string>} params.sensorDevices - Array of device IDs
 * @param {string} params.location - Location identifier
 * @param {string} params.plantingDate - Planting date (YYYY-MM-DD)
 * @param {string} params.harvestDate - Harvest date (YYYY-MM-DD)
 * @param {string} token - JWT auth token
 * @returns {Promise<Object>} Weekly summary
 */
export async function getWeeklySummaryByDevices(params, token) {
  const response = await fetch(
    `${API_BASE_URL}/api/soil-health/weekly`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    }
  );
  if (!response.ok) throw new Error('Failed to fetch weekly summary');
  return response.json();
}

/**
 * Get current health by sensor devices
 * @param {Object} params - Parameters
 * @param {Array<string>} params.sensorDevices - Array of device IDs
 * @param {string} params.location - Location identifier
 * @param {string} token - JWT auth token
 * @returns {Promise<Object>} Current health
 */
export async function getCurrentHealthByDevices(params, token) {
  const response = await fetch(
    `${API_BASE_URL}/api/soil-health/current`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    }
  );
  if (!response.ok) throw new Error('Failed to fetch current health');
  return response.json();
}
```

## 🎨 React Component Examples

### 1. Soil Health Dashboard Component

```jsx
import React, { useState, useEffect } from 'react';
import { getFarmerWeeklySummary } from '../services/soilHealthService';
import { useAuth } from '../contexts/AuthContext';

function SoilHealthDashboard({ farmerId }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    loadSummary();
  }, [farmerId]);

  async function loadSummary() {
    try {
      setLoading(true);
      const data = await getFarmerWeeklySummary(farmerId, token);
      setSummary(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading soil health data...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!summary) return null;

  return (
    <div className="soil-health-dashboard">
      <h2>Soil Health Analysis</h2>
      
      {/* Farmer Info */}
      <div className="farmer-info">
        <h3>{summary.farmer.name}</h3>
        <p>Crop: {summary.farmer.cropType}</p>
        <p>Location: {summary.farmer.location}</p>
        <p>Planting Date: {summary.farmer.plantingDate}</p>
      </div>

      {/* Weekly Summaries */}
      <div className="weekly-summaries">
        {summary.weeks.map(week => (
          <WeekCard key={week.week} week={week} />
        ))}
      </div>
    </div>
  );
}

function WeekCard({ week }) {
  const getStatusColor = (status) => {
    if (status === 'Healthy') return 'green';
    if (status === 'Not Healthy') return 'red';
    return 'gray';
  };

  return (
    <div className={`week-card status-${getStatusColor(week.analysis.soilStatus)}`}>
      <h4>Week {week.week}</h4>
      <p className="period">{week.period}</p>
      <p className="data-points">{week.dataPoints} data points</p>
      
      <div className="status-badges">
        <span className={`badge ${getStatusColor(week.analysis.soilStatus)}`}>
          {week.analysis.soilStatus}
        </span>
      </div>

      <div className="analysis">
        <p><strong>Watering:</strong> {week.analysis.wateringStatus}</p>
        <p><strong>Nutrients:</strong> {week.analysis.nutrientLevel}</p>
      </div>

      {week.analysis.issues.length > 0 && (
        <div className="issues">
          <h5>Issues:</h5>
          <ul>
            {week.analysis.issues.map((issue, idx) => (
              <li key={idx}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {week.dataPoints > 0 && (
        <div className="averages">
          <h5>Average Values:</h5>
          <div className="values-grid">
            <div><strong>Temp:</strong> {week.averages.temperature}°C</div>
            <div><strong>Moisture:</strong> {week.averages.moisture}%</div>
            <div><strong>pH:</strong> {week.averages.ph}</div>
            <div><strong>N:</strong> {week.averages.nitrogen} mg/kg</div>
            <div><strong>P:</strong> {week.averages.phosphorus} mg/kg</div>
            <div><strong>K:</strong> {week.averages.potassium} mg/kg</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SoilHealthDashboard;
```

### 2. Current Health Widget

```jsx
import React, { useState, useEffect } from 'react';
import { getFarmerCurrentHealth } from '../services/soilHealthService';
import { useAuth } from '../contexts/AuthContext';

function CurrentHealthWidget({ farmerId }) {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [farmerId]);

  async function loadHealth() {
    try {
      const data = await getFarmerCurrentHealth(farmerId, token);
      setHealth(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load health:', err);
    }
  }

  if (loading) return <div>Loading...</div>;
  if (!health || !health.success) return null;

  return (
    <div className={`health-widget status-${health.soilStatus.toLowerCase()}`}>
      <h3>Current Soil Status</h3>
      
      <div className="status-badge">
        <span className={health.soilStatus === 'Healthy' ? 'badge-success' : 'badge-danger'}>
          {health.soilStatus}
        </span>
      </div>

      <div className="current-values">
        <div className="value-item">
          <span className="label">Temperature</span>
          <span className="value">{health.values.temperature?.toFixed(1) || 'N/A'}°C</span>
        </div>
        <div className="value-item">
          <span className="label">Moisture</span>
          <span className="value">{health.values.moisture?.toFixed(1) || 'N/A'}%</span>
        </div>
        <div className="value-item">
          <span className="label">pH</span>
          <span className="value">{health.values.ph?.toFixed(1) || 'N/A'}</span>
        </div>
      </div>

      {health.issues.length > 0 && (
        <div className="issues-summary">
          <h4>⚠️ Issues Detected:</h4>
          <ul>
            {health.issues.slice(0, 3).map((issue, idx) => (
              <li key={idx}>{issue}</li>
            ))}
          </ul>
          {health.issues.length > 3 && (
            <p className="more">+ {health.issues.length - 3} more issues</p>
          )}
        </div>
      )}

      <p className="timestamp">
        Last updated: {new Date(health.timestamp).toLocaleString()}
      </p>
    </div>
  );
}

export default CurrentHealthWidget;
```

### 3. All Farmers Summary Table

```jsx
import React, { useState, useEffect } from 'react';
import { getAllFarmersSummary } from '../services/soilHealthService';
import { useAuth } from '../contexts/AuthContext';

function FarmersSummaryTable() {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    loadSummary();
  }, []);

  async function loadSummary() {
    try {
      const data = await getAllFarmersSummary(token);
      setFarmers(data.farmers || []);
    } catch (err) {
      console.error('Failed to load summary:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading farmers summary...</div>;

  return (
    <div className="farmers-summary-table">
      <h2>All Farmers Soil Health Summary</h2>
      <p className="count">Total: {farmers.length} farmers</p>
      
      <table>
        <thead>
          <tr>
            <th>Farmer</th>
            <th>Crop Type</th>
            <th>Location</th>
            <th>Soil Status</th>
            <th>Issues</th>
            <th>Last Update</th>
          </tr>
        </thead>
        <tbody>
          {farmers.map(farmer => (
            <tr key={farmer.farmerId} className={`status-${farmer.soilStatus?.toLowerCase()}`}>
              <td>{farmer.farmerName}</td>
              <td>{farmer.cropType}</td>
              <td>{farmer.location}</td>
              <td>
                <span className={`badge ${farmer.soilStatus === 'Healthy' ? 'badge-success' : 'badge-danger'}`}>
                  {farmer.soilStatus || 'Unknown'}
                </span>
              </td>
              <td>
                {farmer.issues?.length || 0} issues
              </td>
              <td>
                {farmer.timestamp ? new Date(farmer.timestamp).toLocaleString() : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default FarmersSummaryTable;
```

## 🎨 CSS Styling

Add to your CSS file:

```css
/* Soil Health Dashboard */
.soil-health-dashboard {
  padding: 20px;
}

.farmer-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.weekly-summaries {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.week-card {
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  background: white;
}

.week-card.status-green {
  border-color: #28a745;
  background: #f0fff4;
}

.week-card.status-red {
  border-color: #dc3545;
  background: #fff5f5;
}

.week-card.status-gray {
  border-color: #6c757d;
  background: #f8f9fa;
}

.status-badges {
  margin: 10px 0;
}

.badge {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 12px;
  font-size: 0.9em;
  font-weight: bold;
}

.badge.green {
  background: #28a745;
  color: white;
}

.badge.red {
  background: #dc3545;
  color: white;
}

.badge.gray {
  background: #6c757d;
  color: white;
}

.issues {
  margin-top: 10px;
  padding: 10px;
  background: #fff3cd;
  border-radius: 4px;
}

.issues ul {
  margin: 5px 0;
  padding-left: 20px;
}

.issues li {
  font-size: 0.9em;
  margin: 3px 0;
}

.values-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  font-size: 0.9em;
}

/* Current Health Widget */
.health-widget {
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  background: white;
}

.health-widget.status-healthy {
  border-color: #28a745;
  background: #f0fff4;
}

.health-widget.status-not-healthy {
  border-color: #dc3545;
  background: #fff5f5;
}

.current-values {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin: 15px 0;
}

.value-item {
  text-align: center;
}

.value-item .label {
  display: block;
  font-size: 0.9em;
  color: #666;
}

.value-item .value {
  display: block;
  font-size: 1.5em;
  font-weight: bold;
  color: #333;
}

/* Farmers Summary Table */
.farmers-summary-table {
  padding: 20px;
}

.farmers-summary-table table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

.farmers-summary-table th,
.farmers-summary-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.farmers-summary-table th {
  background: #f8f9fa;
  font-weight: bold;
}

.farmers-summary-table tbody tr:hover {
  background: #f8f9fa;
}

.badge-success {
  background: #28a745;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85em;
}

.badge-danger {
  background: #dc3545;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85em;
}
```

## 🔗 Integration with Existing Pages

### Add to Farmer Detail Page

```jsx
import SoilHealthDashboard from './SoilHealthDashboard';

function FarmerDetail({ farmerId }) {
  return (
    <div>
      {/* Existing farmer details */}
      <FarmerInfo farmerId={farmerId} />
      
      {/* Add soil health section */}
      <section className="soil-health-section">
        <SoilHealthDashboard farmerId={farmerId} />
      </section>
    </div>
  );
}
```

### Add Widget to Dashboard

```jsx
import CurrentHealthWidget from './CurrentHealthWidget';

function Dashboard() {
  return (
    <div className="dashboard">
      <div className="widgets-grid">
        {/* Existing widgets */}
        <SensorWidget />
        
        {/* Add health widget */}
        <CurrentHealthWidget farmerId={currentFarmerId} />
      </div>
    </div>
  );
}
```

## 📱 Responsive Design

The components are already mobile-friendly with CSS Grid. For smaller screens:

```css
@media (max-width: 768px) {
  .weekly-summaries {
    grid-template-columns: 1fr;
  }
  
  .current-values {
    grid-template-columns: 1fr;
  }
  
  .farmers-summary-table {
    overflow-x: auto;
  }
}
```

## ✅ Testing

Test your integration:

1. **Start backend**: `cd backend && npm run dev`
2. **Start frontend**: `cd frontend && npm run dev`
3. **Test endpoints** using browser dev tools
4. **Check console** for any errors

## 🎉 You're Done!

Your frontend now has complete soil health analysis integration!
