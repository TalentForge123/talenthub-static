// Airtable Integration for TalentForge Landing Page
// This file handles the secure connection to Airtable using personal access token

// Configuration
const AIRTABLE_CONFIG = {
    baseId: 'appMpjnii0pGKieaq',  // The base ID from your Airtable workspace
    token: 'patFrsj6Ns3iL2UCU.de3d865692e68079e68f7c2069c39cd258353537312266d8f4c57a9db324d209',  // Personal access token
    tables: {
        candidates: 'tblgZkmfZsq40VtxV',  // Candidates table ID
        employees: 'tblgZkmfZsq40VtxV',  // Using candidates table for employees temporarily
        jobs: 'tblgZkmfZsq40VtxV'  // Using candidates table for jobs temporarily
    }
};

// Airtable API client
class AirtableClient {
    constructor(config) {
        this.baseId = config.baseId;
        this.token = config.token;
        this.tables = config.tables;
        this.proxyUrl = 'https://cors-anywhere.herokuapp.com/'; // CORS proxy (optional)
    }

    // Send data to Airtable
    async sendData(tableName, records) {
        if (!this.tables[tableName]) {
            throw new Error(`Table "${tableName}" not configured`);
        }

        const tableId = this.tables[tableName];
        let url = `https://api.airtable.com/v0/${this.baseId}/${tableId}`;
        
        // Uncomment the next line if CORS is an issue
        // url = this.proxyUrl + url;

        try {
            console.log(`Sending data to Airtable table: ${tableName}`);
            console.log('Records:', JSON.stringify(records).substring(0, 200) + '...');
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ records })
            });

            const responseText = await response.text();
            console.log('Airtable API response:', responseText);
            
            if (!response.ok) {
                let errorMessage = 'Unknown error';
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.error?.message || response.statusText;
                } catch (e) {
                    errorMessage = responseText || response.statusText;
                }
                throw new Error(`Airtable API error: ${errorMessage}`);
            }

            return JSON.parse(responseText);
        } catch (error) {
            console.error('Error sending data to Airtable:', error);
            
            // Check if it's a CORS error
            if (error.message.includes('CORS') || error.message.includes('Cross-Origin')) {
                console.error('CORS error detected. Try using a CORS proxy or server-side implementation.');
            }
            
            throw error;
        }
    }

    // Get data from Airtable
    async getData(tableName, options = {}) {
        if (!this.tables[tableName]) {
            throw new Error(`Table "${tableName}" not configured`);
        }

        const tableId = this.tables[tableName];
        let url = `https://api.airtable.com/v0/${this.baseId}/${tableId}`;

        // Uncomment the next line if CORS is an issue
        // url = this.proxyUrl + url;

        // Add query parameters if provided
        if (options.fields || options.filterByFormula || options.maxRecords || options.sort) {
            const params = new URLSearchParams();
            
            if (options.fields) {
                options.fields.forEach(field => {
                    params.append('fields[]', field);
                });
            }
            
            if (options.filterByFormula) {
                params.append('filterByFormula', options.filterByFormula);
            }
            
            if (options.maxRecords) {
                params.append('maxRecords', options.maxRecords);
            }
            
            if (options.sort) {
                options.sort.forEach((sort, index) => {
                    params.append(`sort[${index}][field]`, sort.field);
                    params.append(`sort[${index}][direction]`, sort.direction || 'asc');
                });
            }
            
            url += `?${params.toString()}`;
        }

        try {
            console.log(`Getting data from Airtable table: ${tableName}`);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const responseText = await response.text();
            console.log('Airtable API response:', responseText.substring(0, 200) + '...');
            
            if (!response.ok) {
                let errorMessage = 'Unknown error';
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.error?.message || response.statusText;
                } catch (e) {
                    errorMessage = responseText || response.statusText;
                }
                throw new Error(`Airtable API error: ${errorMessage}`);
            }

            return JSON.parse(responseText);
        } catch (error) {
            console.error('Error getting data from Airtable:', error);
            
            // Check if it's a CORS error
            if (error.message.includes('CORS') || error.message.includes('Cross-Origin')) {
                console.error('CORS error detected. Try using a CORS proxy or server-side implementation.');
            }
            
            throw error;
        }
    }

    // Process CSV data for upload
    processCSVForUpload(csvData, type) {
        console.log(`Processing CSV data for ${type} upload`);
        console.log('CSV data sample:', csvData.substring(0, 200) + '...');
        
        // Parse CSV data
        const lines = csvData.split('\n');
        const headers = lines[0].split(',').map(header => 
            header.trim().replace(/^"(.*)"$/, '$1')  // Remove quotes if present
        );
        
        console.log('CSV headers:', headers);
        
        const records = [];
        
        // Start from index 1 to skip headers
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue; // Skip empty lines
            
            const values = this.parseCSVLine(lines[i]);
            if (values.length !== headers.length) {
                console.warn(`Skipping line ${i+1}: column count mismatch (expected ${headers.length}, got ${values.length})`);
                continue;
            }
            
            const record = { fields: {} };
            headers.forEach((header, index) => {
                record.fields[header] = values[index];
            });
            
            records.push(record);
        }
        
        console.log(`Processed ${records.length} records from CSV`);
        return records;
    }
    
    // Helper to parse CSV line correctly handling quoted values
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (i + 1 < line.length && line[i + 1] === '"') {
                    // Double quotes inside quotes - add a single quote
                    current += '"';
                    i++;
                } else {
                    // Toggle quote mode
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // End of field
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        // Add the last field
        result.push(current.trim());
        
        // Remove surrounding quotes from each value
        return result.map(value => value.replace(/^"(.*)"$/, '$1'));
    }
}

// Create Airtable client instance
const airtableClient = new AirtableClient(AIRTABLE_CONFIG);

// Export for use in main script
window.airtableClient = airtableClient;
