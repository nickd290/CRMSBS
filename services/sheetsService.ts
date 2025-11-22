
import { SheetRow } from '../types';
import { HEADERS, INITIAL_SHEETS_DATA } from '../constants';

// This service mimics the Google Sheets API behavior with LocalStorage persistence
class GoogleSheetsService {
  private sheets: Map<string, { headers: string[], rows: SheetRow[] }>;
  private STORAGE_KEY = 'starter_box_crm_data_v1';

  constructor() {
    this.sheets = new Map();
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Rehydrate the Map from the plain object
        Object.keys(parsed).forEach(key => {
          this.sheets.set(key, parsed[key]);
        });
        console.log('Data loaded from LocalStorage');
      } else {
        this.initializeDefaults();
      }
    } catch (e) {
      console.error('Failed to load from storage, resetting to defaults', e);
      this.initializeDefaults();
    }
  }

  private initializeDefaults() {
    this.sheets.set('Customers', { headers: HEADERS.CUSTOMERS, rows: [...INITIAL_SHEETS_DATA.CUSTOMERS] });
    this.sheets.set('Products', { headers: HEADERS.PRODUCTS, rows: [...INITIAL_SHEETS_DATA.PRODUCTS] });
    this.sheets.set('Orders', { headers: HEADERS.ORDERS, rows: [...INITIAL_SHEETS_DATA.ORDERS] });
    this.sheets.set('Invoices', { headers: HEADERS.INVOICES, rows: [...INITIAL_SHEETS_DATA.INVOICES] });
    this.sheets.set('Mockups', { headers: HEADERS.MOCKUPS, rows: [...INITIAL_SHEETS_DATA.MOCKUPS] });
    this.sheets.set('Samples', { headers: HEADERS.SAMPLES, rows: [...INITIAL_SHEETS_DATA.SAMPLES] });
    this.saveToStorage();
  }

  private saveToStorage() {
    try {
      const data = Object.fromEntries(this.sheets);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      console.log('Data saved to LocalStorage');
    } catch (e) {
      console.error('Failed to save to storage', e);
    }
  }

  private async simulateDelay() {
    return new Promise(resolve => setTimeout(resolve, 400)); // Simulate network latency
  }

  async getSheetValues(sheetName: string): Promise<SheetRow[]> {
    await this.simulateDelay();
    const sheet = this.sheets.get(sheetName);
    if (!sheet) throw new Error(`Sheet ${sheetName} not found`);
    return sheet.rows;
  }

  async appendRow(sheetName: string, row: SheetRow): Promise<void> {
    await this.simulateDelay();
    const sheet = this.sheets.get(sheetName);
    if (!sheet) throw new Error(`Sheet ${sheetName} not found`);
    sheet.rows.push(row);
    this.saveToStorage();
  }

  async updateRow(sheetName: string, rowIndex: number, row: SheetRow): Promise<void> {
    await this.simulateDelay();
    const sheet = this.sheets.get(sheetName);
    if (!sheet) throw new Error(`Sheet ${sheetName} not found`);
    if (rowIndex < 0 || rowIndex >= sheet.rows.length) throw new Error("Row index out of bounds");
    
    sheet.rows[rowIndex] = row;
    this.saveToStorage();
  }

  // Robust CSV Parsing using a State Machine to handle quotes and commas
  private parseCSV(text: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let insideQuotes = false;
    
    // Normalize line endings
    const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    for (let i = 0; i < normalizedText.length; i++) {
        const char = normalizedText[i];
        const nextChar = normalizedText[i + 1];
        
        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                currentCell += '"';
                i++; // Skip escaped quote
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (char === ',' && !insideQuotes) {
            currentRow.push(currentCell.trim());
            currentCell = '';
        } else if (char === '\n' && !insideQuotes) {
            currentRow.push(currentCell.trim());
            if (currentRow.some(cell => cell !== '')) { // Skip empty rows
                rows.push(currentRow);
            }
            currentRow = [];
            currentCell = '';
        } else {
            currentCell += char;
        }
    }
    
    // Handle the last cell/row
    if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        if (currentRow.some(cell => cell !== '')) {
            rows.push(currentRow);
        }
    }
    
    return rows;
  }

  async bulkImport(sheetName: string, csvContent: string): Promise<number> {
    await this.simulateDelay();
    const sheet = this.sheets.get(sheetName);
    if (!sheet) throw new Error(`Sheet ${sheetName} not found`);

    try {
        const parsedRows = this.parseCSV(csvContent);
        
        if (parsedRows.length === 0) return 0;

        // Determine start index (skip header if it looks like a header)
        let startIndex = 0;
        const firstRow = parsedRows[0];
        
        // Simple heuristic: if the first row matches our known headers roughly
        const knownHeader = sheet.headers[0] || '';
        if (firstRow.length > 0 && knownHeader && firstRow[0].toString().toLowerCase().includes(knownHeader.toLowerCase())) {
            startIndex = 1;
        }

        let addedCount = 0;
        for (let i = startIndex; i < parsedRows.length; i++) {
            sheet.rows.push(parsedRows[i]);
            addedCount++;
        }

        this.saveToStorage();
        return addedCount;
    } catch (e) {
        console.error('CSV Parse Error', e);
        throw new Error("Failed to parse CSV data.");
    }
  }

  async clearData() {
      localStorage.removeItem(this.STORAGE_KEY);
      this.initializeDefaults();
      window.location.reload();
  }
}

export const sheetsService = new GoogleSheetsService();
