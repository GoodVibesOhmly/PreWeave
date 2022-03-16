import { Context } from "koa";
import { NextFunction } from "../types";
import { httpServerConnection } from "../utils/db";

export async function getExportable(ctx: Context, next: NextFunction) {
    // get all exportable items
    const res = await httpServerConnection("data_items")
        .select("data_item_id")
        .where("exportable", "=", true)

    ctx.body = res;
    await next()

}