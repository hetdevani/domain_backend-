interface ResponseData {
    code: string;
    message: string;
    status: number;
    data?: any;
}

export interface ErrorResponse extends ResponseData { }

export interface SuccessResponse extends ResponseData { }

export interface PaginationOptions {
    page?: number;
    limit?: number;
    sortBy?: any;
    populateFields?: string[];
    selectFields?: string[];
}

export interface SearchOptions {
    keys: string[];
    keyword: string;
}

export interface ExcelReportColumnHeaders {
    header: string;
    key: string;
    isReference?: boolean,
    populateKey?: string
}

export type NestedSelect = {
    select?: string[];
    [key: string]: NestedSelect | string[] | undefined;
};