import cron from "node-cron";

console.log("Worker iniciado");

cron.schedule("*/30 * * * *", () => {
  console.log(`[worker] Sincronización simulada: ${new Date().toISOString()}`);
});