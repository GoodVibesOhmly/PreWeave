export type NextFunction = () => Promise<any>

export type Transaction = {
    id: string,
    start: number,
    exportable?: boolean
}