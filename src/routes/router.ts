import Router from "@koa/router";
import { getExportable } from "./getExportable";
import { getData } from "./getData";
import { getItem } from "./getItem";
import {downloadData, moveData, signData} from "./postData";
import { proxyToBundlr } from "./postDataItem";

export const router = new Router()
    // @ts-ignore 
    .post("/data", downloadData, signData, moveData)
    .post("/tx", proxyToBundlr)
    .get("/:txId", getData)
    .get("DMZDisable", "/tx/:txid", getItem)
    .get("DMZDisable", "/exportable", getExportable)