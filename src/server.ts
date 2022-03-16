import { config } from "dotenv";
import { promises } from "fs"
import Koa from "koa"
import { router } from "./routes/router"
import koaLogger from "koa-logger"
process.env = { ...process.env, ...config().parsed };

export async function runServer() {

    console.log("starting PreWeave")
    await promises.mkdir("./temp", { recursive: true })
    await promises.mkdir("./transactions", { recursive: true })
    const app = new Koa()
    app.use(koaLogger(((str) => {
        console.log(str);
    })));
    app.on("error", (err, _) => {
        console.log(err)
    })

    if (process.env?.IS_DMZ) {
        router.stack = router.stack.filter(r => r.name != "DMZDisable")
    }
    app.use(router.routes())


    app.listen(+(process.env.PORT ?? 8080));
    console.log("started server")

}