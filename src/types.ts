export type NextFunction = () => Promise<any>

export type Transaction = {
    "data_item_id": string,
    "data_start": number,
    exportable?: boolean
}