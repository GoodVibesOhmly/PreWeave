import { httpServerConnection } from "./db";
import axios from "axios";
import fs from "fs";

export async function exportTx(txId: string): Promise<void> {
    const trx = await httpServerConnection.transaction();
    await trx("transactions")
        .update("exportable", true)
        .where("tx_id", "=", txId);
    await axios.post("https://node1.bundlr.network/tx/arweave", fs.createReadStream(`./transactions/${txId}`), {
        headers: {
            "content-type": "application/octet-stream"
        }
    });

    await trx.commit();
}