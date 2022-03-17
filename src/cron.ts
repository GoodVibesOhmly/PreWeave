import cron from "node-cron";
import { httpServerConnection } from "./utils/db";
import { exportTx } from "./utils";

export function runCron(): void {
    cron.schedule("* * * 1 *", async function () {
        // Get all txs which aren't exported and more than a year old...

        const txs = await httpServerConnection("transactions")
            .select("tx_id")
            .where("date_created", "<", httpServerConnection.raw("now() - interval '1 year'"))
            .then(r => r.map(row => row.tx_id));

        for (const txId of txs) {
            await exportTx(txId);
        }
    });
}