import { Context } from "koa";
import { NextFunction } from "../types";
import { checkPath, makeError } from "../utils/utils";
import { tmpName } from "tmp-promise"
import { createWriteStream, promises } from "fs";
import { pipeline } from "stream/promises";
import { createData } from "arbundles";
import { ARSigner } from "../utils/crypto";
import { httpServerConnection, insertDataItem } from "../utils/db";
import { randomBytes } from "crypto";
import { resolve } from "path"
// import { FileDataItem } from "arbundles/file"


export async function downloadData(ctx: Context, next: NextFunction) {

    let path;
    try {
        // @ts-ignore
        ["content-type", "content-length"].forEach(h => {
            if (!ctx.header[h]) { return makeError(ctx, 400, `${h} required`) }
        });

        // download content to file
        path = ctx.state.filePath = await tmpName({ tmpdir: "./temp" });
        // const data = ctx.request.rawBody    
        const wStrm = createWriteStream(path)
        console.log("piping to file")
        await pipeline(
            ctx.request.req,
            wStrm
        );
        await new Promise((r, e) => {
            wStrm.close(er => {
                if (er) e(er);
                r(null)
            })
        })
        ctx.stats = await promises.stat(path)
    } catch (e) {
        console.error(e)
        if (path) {
            await promises.unlink(path)
        }
        return makeError(ctx, 500)
    }

    await next();
}

export async function signData(ctx: Context, next: NextFunction) {
    if (!ctx.state.filePath) {
        console.error("no path, aborting");
        return makeError(ctx, 500)
    }
    const path = ctx.state.filePath;
    if (!await checkPath(ctx.state.filePath)) {
        return makeError(ctx, 500)
    }
    try {
        console.debug("reading data")
        const data = await promises.readFile(path);
        console.debug("signing data")
        console.log({
            tags: [
                { name: "Content-Type", value: ctx.headers["content-type"] },
                { name: "application", value: "preweave" }
            ],
            anchor: randomBytes(32).toString("base64").slice(0, 32)
        })
        const dataItem = createData(data, ARSigner, {
            tags: [
                { name: "Content-Type", value: ctx.headers["content-type"] },
                { name: "application", value: "preweave" }
            ],
            anchor: randomBytes(32).toString("base64").slice(0, 32)
        })
        await dataItem.sign(ARSigner);
        console.debug(`writing signed data to ${dataItem.id}`)
        await promises.writeFile(path, dataItem.getRaw())
        ctx.response.body = dataItem.id;
        ctx.response.status = 200;

        // insert here.
        const tx = {
            "tx_id": dataItem.id,
            "data_start": dataItem.getStartOfData()
        };
        ctx.state.itemId = dataItem.id;
        console.log(tx);
        if (!await insertDataItem(httpServerConnection, tx)) return makeError(ctx, 500, "DB error");
    } catch (e) {
        console.error(e)
        return makeError(ctx, 500)
    }

    await next();
}

// PoC
export async function moveData(ctx: Context, next: NextFunction) {

    const path = ctx.state?.filePath
    if (!path || !await checkPath(path)) {
        return makeError(ctx, 500);
    }
    try {
        await promises.rename(resolve(path), resolve(`./transactions/${ctx.state.itemId}`));

        console.log(`moved ${ctx.state.itemId} from temp`)
    } catch (e) {
        console.error(e);
        return makeError(ctx, 500)
    }
    await next();
} 