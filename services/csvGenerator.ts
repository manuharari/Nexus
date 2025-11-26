
import { MOCK_DATASETS } from "../constants";
import { DailyReport, IndustryType } from "../types";

// Initialize with default industry data for templates
const MOCK_MATERIALS = MOCK_DATASETS[IndustryType.DISCRETE_MFG].materials;
const MOCK_SKUS = MOCK_DATASETS[IndustryType.DISCRETE_MFG].skus;
const MOCK_MACHINES = MOCK_DATASETS[IndustryType.DISCRETE_MFG].machines;

// Utility to format date
const formatDate = (date: Date) => date.toISOString().split('T')[0];

// --- 1. Material Price History Template (5 Years) ---
export const generatePriceHistoryTemplate = () => {
  const headers = ['Date', 'Material_ID', 'Material_Name', 'Supplier', 'Price_USD', 'Currency', 'Exchange_Rate_MXN', 'Supplier_Lead_Time_Days'];
  let csvContent = headers.join(',') + '\n';

  const today = new Date();
  const fiveYearsAgo = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());

  // Iterate day by day for 5 years
  for (let d = new Date(fiveYearsAgo); d <= today; d.setDate(d.getDate() + 7)) { // Weekly data points
    const dateStr = formatDate(d);
    // Base seasonality factor (sine wave)
    const seasonFactor = Math.sin((d.getMonth() / 12) * 2 * Math.PI);
    // Inflation/Trend factor (linear growth)
    const yearOffset = d.getFullYear() - fiveYearsAgo.getFullYear();
    const trendFactor = 1 + (yearOffset * 0.03); // 3% annual inflation
    // Random Exchange Rate Fluctuation
    const exchangeRate = 17.0 + (Math.random() * 4) + (yearOffset * 0.5); 

    MOCK_MATERIALS.forEach(mat => {
      // Simulate price volatility
      const randomShock = (Math.random() - 0.5) * 0.1; // +/- 5% noise
      const price = mat.currentPrice * trendFactor * (1 + (seasonFactor * 0.05)) * (1 + randomShock);
      
      csvContent += `${dateStr},${mat.id},"${mat.name}","Global Suppliers Inc",${price.toFixed(2)},USD,${exchangeRate.toFixed(2)},${mat.supplierLeadTime}\n`;
    });
  }
  return csvContent;
};

// --- 2. Maintenance Logs & Sensor Template (5 Years) ---
export const generateMaintenanceTemplate = () => {
  const headers = ['Date', 'Machine_ID', 'Machine_Name', 'Run_Hours_Total', 'Avg_Temp_C', 'Avg_Vibration_RMS', 'Avg_RPM', 'Peak_Current_Amps', 'Maintenance_Event', 'Parts_Replaced'];
  let csvContent = headers.join(',') + '\n';

  const today = new Date();
  const fiveYearsAgo = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());

  MOCK_MACHINES.forEach(machine => {
    let runHours = 0;
    let health = 100;

    for (let d = new Date(fiveYearsAgo); d <= today; d.setDate(d.getDate() + 1)) { // Daily aggregates
      const dateStr = formatDate(d);
      
      // Simulate degradation
      runHours += 12 + (Math.random() * 4); // 12-16 hours operation per day
      health -= 0.1 + (Math.random() * 0.1);

      // Sensor Simulation based on health
      const isStressed = health < 70;
      const temp = 65 + (isStressed ? 15 : 0) + (Math.random() * 5);
      const vib = 2.5 + (isStressed ? 3.0 : 0) + (Math.random() * 0.5);
      const rpm = 1200 - (isStressed ? 100 : 0) + (Math.random() * 20);
      const current = 15 + (isStressed ? 5 : 0) + (Math.random() * 1);

      // Maintenance Event Logic
      let event = 'None';
      let parts = '';
      
      if (health < 40) {
         event = 'Corrective Maintenance';
         parts = 'Bearings;Seals';
         health = 100; // Reset after fix
      } else if (d.getDate() === 1 && d.getMonth() % 3 === 0) { // Quarterly
         event = 'Preventive Maintenance';
         parts = 'Filters;Oil';
         health = Math.min(health + 10, 100);
      }

      csvContent += `${dateStr},${machine.id},"${machine.name}",${runHours.toFixed(1)},${temp.toFixed(1)},${vib.toFixed(2)},${rpm.toFixed(0)},${current.toFixed(1)},"${event}","${parts}"\n`;
    }
  });

  return csvContent;
};

// --- 3. Sales & Inventory Template (5 Years) ---
export const generateSalesInventoryTemplate = () => {
  const headers = ['Date', 'SKU_ID', 'SKU_Name', 'Units_Sold', 'Production_Run_Qty', 'Inventory_End_Of_Day', 'Is_Promotion'];
  let csvContent = headers.join(',') + '\n';

  const today = new Date();
  const fiveYearsAgo = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());

  MOCK_SKUS.forEach(sku => {
    let inventory = sku.inventory.reorderPoint * 2; // Start healthy

    for (let d = new Date(fiveYearsAgo); d <= today; d.setDate(d.getDate() + 1)) { // Daily
      const dateStr = formatDate(d);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const isPromo = d.getDate() > 15 && d.getDate() < 20; // Monthly promo window

      // Sales
      let sales = 0;
      if (!isWeekend) {
        sales = Math.floor(50 + (Math.random() * 30) + (isPromo ? 40 : 0));
      }

      // Inventory Logic
      inventory -= sales;
      let production = 0;
      if (inventory < sku.inventory.reorderPoint) {
         production = sku.inventory.reorderPoint * 1.5; // Batch refill
         inventory += production;
      }

      csvContent += `${dateStr},${sku.id},"${sku.name}",${sales},${production},${inventory},${isPromo}\n`;
    }
  });

  return csvContent;
};

// --- 4. Generate Daily Analysis Report ---
export const generateDailyReportCSV = (data: DailyReport) => {
    const headers = ['Date', 'Metric', 'Value', 'Notes'];
    let csv = headers.join(',') + '\n';
    csv += `${data.date},Alerts Generated,${data.alertsGenerated},"High severity warnings"\n`;
    csv += `${data.date},Machines At Risk,${data.machinesAtRisk},"Predicted failure < 14 days"\n`;
    csv += `${data.date},Predicted Stockouts,${data.stockoutsPredicted},"Within next 30 days"\n`;
    csv += `${data.date},Buy Signals,${data.buySignals},"Material price dip detected"\n`;
    return csv;
}

export const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
