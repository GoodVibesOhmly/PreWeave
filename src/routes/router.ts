import Router from "@koa/router";
import { getExportable } from "./getExportable";
import { getData } from "./getData";
import { getItem } from "./getItem";
import { downloadData, moveData, signData } from "./postData";
import { proxyToBundlr } from "./postDataItem";

export const router = new Router()
    .post("/data", downloadData, signData, moveData)
    .post("/tx", proxyToBundlr)
    .get("/tx/:txId", getItem)
    .get("/exportable", getExportable)
    .get("/:txId", getData);