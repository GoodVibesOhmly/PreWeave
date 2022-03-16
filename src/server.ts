import { config } from "dotenv";
import { promises } from "fs"
import Koa from "koa"
import { router } from "./routes/router"
import koaLogger from "koa-logger"
process.env = { ...process.env, ...config().parsed };
async function runServer() {

    console.log("starting PreWeave")
    await promises.mkdir("./temp", { recursive: true })
    await promises.mkdir("./dataItems", { recursive: true })
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


    app.listen(80);
    console.log("started server")

}
runServer()