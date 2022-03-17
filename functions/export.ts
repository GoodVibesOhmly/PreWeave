
import { httpServerConnection } from "../src/utils/db";
import { exportTx } from "../src/utils";

export default async function (): Promise<void> {
    const unexported = await httpServerConnection("transactions")
        // eslint-disable-next-line @typescript-eslint/naming-convention
        .select<{ tx_id: string }[]>("tx_id")
        .where("exportable", "=", false)
        .then(r => r.map(row => row.tx_id));

    console.log(unexported)

    for (const txId of unexported) {
        await exportTx(txId);
    }
}