import { NextFunction } from "connect";
import { createReadStream, promises } from "fs";
import { Context } from "koa";
import { resolve } from "path";
import { exists, httpServerConnection, isExportable } from "../utils/db";
import { checkPath, isArweaveAddress, makeError } from "../utils/utils";

export async function getItem(ctx: Context, next: NextFunction): Promise<void> {
    const txId = ctx.params.txId;
    if (!txId) {
        return makeError(ctx, 400, "No TxID specified")
    }
    // this *should* filter out all malicious input
    if (!isArweaveAddress(txId)) {
        return makeError(ctx, 400, "Invalid TxID")
    }
    const path = `./transactions/${txId}`
    if (!await checkPath(path)) {
        return makeError(ctx, 404)
    }

    if (!await exists(httpServerConnection, "transactions", "tx_id", txId)) {
        return makeError(ctx, 404)
    }
    if (!await isExportable(httpServerConnection, txId)) {
        return makeError(ctx, 404)
    }

    ctx.length = await promises.stat(path).then(r => r.size);
    ctx.body = createReadStream(resolve(path));
    await next();
}