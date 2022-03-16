import {Context} from "koa";
import {NextFunction} from "../types";
import {httpServerConnection} from "../utils/db";

export async function getExportable(ctx: Context, next: NextFunction) {
    ctx.body = await httpServerConnection("transactions")
        .select("tx_id")
        .where("exportable", "=", true)
        .then(r => r.map(row => row.tx_id));
    await next();
}