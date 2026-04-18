export const SeriesConfig: {
    [modelName: string]: {
        seriesType: string,
        filter: (data: any) => object,
        generatorSeries?: (data: any) => object,
        field: string
    }[]
} = {};
