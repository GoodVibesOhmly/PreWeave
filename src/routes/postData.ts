import { Context } from "koa";
import { NextFunction } from "../types";
import { checkPath, makeError } from "../utils/utils";
import { tmpName } from "tmp-promise"
import { createWriteStream, promises } from "fs";
import { pipeline } from "stream/promises";
import { createData } from "arbundles";
import { ARSigner } from "../utils/crypto";
import { httpServerConnection, insertDataItem } from "../utils/db";
import { verifyItem } from "../utils/crypto";
import { createHash } from "crypto";
import base64url from "base64url";
import { resolve } from "path"
import { FileDataItem } from "arbundles/file"


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
        )
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
    return await next()
}

export async function signData(ctx: Context, next: NextFunction) {
    if (!ctx.state.filePath) {
        console.error("no path, aborting");
        return makeError(ctx, 500)
    }
    const path = ctx.state.filePath;
    if (!checkPath(ctx.state.filePath)) {
        return makeError(ctx, 500)
    }
    try {
        console.debug("reading data")
        const data = await promises.readFile(path);
        console.debug("signing data")
        const dataItem = createData(data, ARSigner, {
            tags: [
                { name: "Content-Type", value: ctx.headers["content-type"] },
                { name: "application", value: "preweave" }
            ]
        })
        console.debug(`writing signed data to ${dataItem.id}`)
        await promises.writeFile(path, dataItem.getRaw())
        ctx.body = dataItem.id;
        ctx.status = 200;

        // insert here.
        const tx = {
            id: dataItem.id,
            start: dataItem.getStartOfData()
        }
        await insertDataItem(httpServerConnection, tx)

    } catch (e) {
        console.error(e)
        return makeError(ctx, 500)
    }
    return await next()
}

// PoC
export async function moveData(ctx: Context, next: NextFunction) {

    const path = ctx.state?.filePath
    if (!path || !await checkPath(path)) {
        return makeError(ctx, 500);
    }
    try {
        console.debug("verifying/moving complete dataItem")
        // verify here
        const { signature } = await verifyItem(path, ctx.stats.size)
        // can use owner later on
        const id = base64url.encode(createHash("sha256").update(signature).digest());
        // todo: use MinIO
        await promises.rename(resolve(path), resolve(`./dataItems${id}`))
        const start = await (new FileDataItem(`./dataItems${id}`)).dataStart()
        await insertDataItem(httpServerConnection, { id, start })

        console.log(`moved ${id} from temp`)
    } catch (e) {
        console.error(e);
        return makeError(ctx, 500)
    }
    return await next()
} 