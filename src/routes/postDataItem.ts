
import { Context } from "koa";
import { NextFunction } from "../types";
import proxy from "koa-proxy"

export async function proxyToBundlr(ctx: Context, next: NextFunction): Promise<void> {
    // add logic to do currency-aware routing?
    await proxy({
        host: "https://node1.bundlr.network/tx"
    })(ctx, next)

}

