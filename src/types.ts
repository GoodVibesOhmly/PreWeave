export type NextFunction = () => Promise<any>

export type Transaction = {
    "tx_id": string,
    "data_start": number,
    exportable?: boolean
}