import { NextFunction } from "connect";
import { createReadStream, promises } from "fs";
import { Context } from "koa";
import { resolve } from "path";
import { exists, httpServerConnection, isExportable } from "../utils/db";
import { checkPath, isArweaveAddress, makeError } from "../utils/utils";

export async function getItem(ctx: Context, next: NextFunction) {

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
        return makeError(ctx, 404)
    }
    if (!await isExportable(httpServerConnection, txId)) {
        return makeError(ctx, 404)
    }

    // const tx = await getDataItem(httpServerConnection, txId)
    //  const di = await new FileDataItem(path).tags()
    // todo: remove from DB and add to obj store

    // ctx.setHeader("Content-Type", di.find(t => t.name.toLowerCase() === "content-type") ?? "application/octet-stream")
    const size = (await promises.stat(path)).size
    ctx.setHeader("Content-Length", size)
    ctx.body = createReadStream(resolve(path))
    return await next()

}