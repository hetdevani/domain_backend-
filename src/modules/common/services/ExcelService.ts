import * as Excel from 'exceljs';

class ExcelService {
    public async excelToJson(filePath: string): Promise<any[]> {
        const workbook = new Excel.Workbook();
        await workbook.xlsx.readFile(filePath);
        const workSheet = workbook.getWorksheet(1);
        const rows: any[] = [];
        const column: any[] = [];

        if (workSheet) {
            workSheet.eachRow({ includeEmpty: true }, (row: any, rowNumber: number) => {
                const data = row.values.slice(1);
                if (rowNumber === 1) {
                    column.push(...data);
                } else {
                    const json: Record<string, any> = {};
                    column.forEach((key, index) => {
                        json[key] = data[index];
                    });
                    rows.push(json);
                }
            });
        }

        return rows;
    }
}

export default new ExcelService();
