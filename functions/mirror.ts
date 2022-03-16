import axios from "axios";
import {pipeline} from "stream/promises";
import * as fs from "fs";
import {httpServerConnection} from "../src/utils/db";
import {FileDataItem} from "arbundles/file";

export default async function (node: string) {
    const exportable: string[] = await axios.get(`${node}/exportable`).then(r => r.data);

    for (const txId of exportable) {
        const p = `./transactions/${txId}`;
        try {
            await pipeline(
                await axios.get(`${node}/item/${txId}`, { responseType: "stream" }).then(r => r.data),
                fs.createWriteStream(p)
            );
        } catch (e) {
            console.error(`Error occurred while piping exportable to fs from peer - ${e}`);
            process.exit(1);
        }

        try {
            const item = new FileDataItem(p);
            const dataStart = await item.dataStart();
            await httpServerConnection("transactions")
                .insert({
                    tx_id: txId,
                    exportable: true,
                    data_start: dataStart
                });
        } catch (e) {
            await fs.promises.unlink(p);
            console.error(`Error occurred while adding exportable to db - ${e}`);
            process.exit(1);
        }
    }
}