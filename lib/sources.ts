/** Which BMC system each kind of record would come from (shown as "Source:" tags). */
export const SOURCE = {
  complaints: "CCRS / MyBMC",
  workOrders: "SAP work order",
  rates: "Rate schedule (USOR)",
  fixes: "Pothole Tracking System",
} as const;
