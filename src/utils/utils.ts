import { PathLike, promises } from "fs";
import { Context } from "koa";

export async function makeError(ctx: Context, code?: number, msg?: string): Promise<void> {
    ctx.res.statusMessage = msg;
    ctx.res.statusCode = code;
}

export const checkPath = async (path: PathLike): Promise<boolean> => { return promises.stat(path).then(_ => true).catch(_ => false) }

export function isArweaveAddress(address: string): boolean {
    if (!address) return undefined;
    const addr = address.toString().trim();
    return /[a-z0-9_-]{43}/i.test(addr);
}
