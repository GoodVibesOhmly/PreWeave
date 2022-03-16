import cron from "node-cron";
import * as fs from "fs";

// eslint-disable-next-line @typescript-eslint/naming-convention
const YEAR_IN_MS = 3.154e+10;

export function runCron(): void {
    cron.schedule("* * * 1 *", async function () {
        for await (const file of await fs.promises.opendir("./transactions")) {
            if (!file.isFile()) continue;

            const stat = await fs.promises.stat(file.name);

            if ((Date.now() - stat.birthtimeMs) > YEAR_IN_MS) {
                await fs.promises.unlink(file.name);
            }
        }
    });
}