import axios from "axios";
import * as fs from "fs";
import { httpServerConnection } from "../src/utils/db";

export default async function () {
    const unexported = await httpServerConnection("transactions")
        .select<{ tx_id: string }[]>("tx_id")
        .where("exportable", "=", false)
        .then(r => r.map(row => row.tx_id));

    for (const txId of unexported) {
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
}