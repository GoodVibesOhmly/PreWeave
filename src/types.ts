export type NextFunction = () => Promise<any>

export type Transaction = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "tx_id": string,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "data_start": number,
    exportable?: boolean
}