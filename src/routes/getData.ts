import { createReadStream, promises } from "fs";
import { Context } from "koa";
import { NextFunction } from "../types";
import { checkPath, isArweaveAddress, makeError } from "../utils/utils";
import { resolve } from "path"
import { exists, getDataItem, httpServerConnection } from "../utils/db";
import { FileDataItem } from "arbundles/file";

export async function getData(ctx: Context, next: NextFunction) {
    const txId = ctx.params.txId;
    if (!txId) {
        return makeError(ctx, 400, "No TxID specified")
    }
    // this *should* filter out all malicious input
    if (!isArweaveAddress(txId)) {
        return makeError(ctx, 400, "Invalid TxID")
    }
    const path = `./dataItems/${txId}`
    if (!checkPath(path)) {
        return makeError(ctx, 404)
    }

    if (!await exists(httpServerConnection, "data_items", "data_item_id", txId)) {
        return makeError(ctx, 400, "Tx does not exist")
    }

    const tx = await getDataItem(httpServerConnection, txId)
    const di = await new FileDataItem(path).tags()
    // todo: remove from DB and add to obj store

    ctx.setHeader("Content-Type", di.find(t => t.name.toLowerCase() === "content-type") ?? "application/octet-stream")
    const size = (await promises.stat(path)).size
    ctx.setHeader("Content-Length", size - tx.start)
    ctx.body = createReadStream(resolve(path), { start: tx.start })
    return await next()
}
