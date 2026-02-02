/**
 * NewNetworkUpload Validation Rules
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * This file contains the validation rules extracted from your Excel specification.
 * These are the DEFAULT rules - admins can customize them for each project.
 *
 * HOW THIS WORKS:
 * - Each rule describes what a CSV column should look like
 * - When a developer uploads a file, we check each column against these rules
 * - If something doesn't match, we report it as an error
 */

import { ValidationRule, ValidationTemplate, NewNetworkUploadColumn } from '@/types';

/**
 * These are the column definitions from your "NewNetworkUpload" Excel sheet.
 * I've converted them into a format the application can use.
 */
export const NEW_NETWORK_UPLOAD_COLUMNS: NewNetworkUploadColumn[] = [
  {
    name: 'IGNORE',
    required: true,
    allowBlank: false,
    uniqueRequired: false,
    dataType: 'Boolean',
    length: 5,
    example: 'no',
    notes: 'Default to "no". Set to "yes" to skip this row during import.',
  },
  {
    name: 'CANCREATE',
    required: true,
    allowBlank: false,
    uniqueRequired: false,
    dataType: 'Boolean',
    length: 5,
    example: 'yes',
    notes: '(yes, no) Default to Yes. Yes can always be provided even if the record of device/meter already exists. This used to control if the device/meter was new to Temetra (set to Yes) and if just updating an existing device/meter, set to no.',
  },
  {
    name: 'CREF',
    required: true,
    allowBlank: false,
    uniqueRequired: true,
    dataType: 'Character',
    length: 50,
    example: 'SPID_015481',
    notes: 'If using ChoiceConnect, can use the ServicePointID field. Must always be unique and permanent for each Meter/Endpoint combination. This identifies the physical connection for a meter. Does not change even if the meter#, ERT # changes. (Preferred to match ServicePointId from CCFN/IA)',
  },
  {
    name: 'METERSERIAL',
    required: true,
    allowBlank: false,
    uniqueRequired: true,
    dataType: 'Character',
    length: '5-48',
    example: '45812-h',
    notes: 'The meter serial number, which can be used to locate the meter in Temetra (MUST BE UNIQUE). Cannot be less than 5 digits. If working with compound meters you can add -h for high side and -l for low side.',
  },
  {
    name: 'ADDTAG',
    required: true,
    allowBlank: false,
    uniqueRequired: false,
    dataType: 'Character',
    example: 'readtype=02 cellular-device-installed mcategory=4',
    notes: 'Used to pass and store the "read type code" in Temetra which is used to specify truncation/multiplication for RF readings. For example: readtype=02 might be used to tell Temetra to truncate 2 digits from a water meter\'s radio reading. If Utilizing Cellular Endpoints, for any record that has "Cellular 500W ERT" or "Cellular 500G ERT" as a collection method, pass an addtag value of "Cellular-Device-Installed" to enable automatic provisioning of the cellular endpoints.',
  },
  {
    name: 'ACCOUNTREF',
    required: true,
    allowBlank: false,
    uniqueRequired: false,
    dataType: 'Character',
    length: 25,
    example: 'ACCN_16975',
    notes: 'Use to look up an account, must be unique to Net.',
  },
  {
    name: 'CUSTOMERNAME',
    required: false,
    allowBlank: true,
    uniqueRequired: false,
    dataType: 'Character',
    length: 100,
    example: '"Cassidy, Butch"',
    notes: 'Sets the Account with a Customer Name (example: First Last or "Last, First"). If comma exists in value, enclose with double quotes.',
  },
  {
    name: 'PROPERTYADDRESS',
    required: true,
    allowBlank: false,
    uniqueRequired: false,
    dataType: 'Character',
    length: 500,
    example: '1908 San Vincente Rd',
    notes: 'Update the property address of the meter. If comma exists as part of address, enclose in double quotes.',
  },
  {
    name: 'MIUSERIAL',
    required: true,
    allowBlank: false,
    uniqueRequired: true,
    dataType: 'Character',
    length: 50,
    example: '67125820',
    notes: 'Endpoint ID (aka Transponder Id, Device Id, ERT Id) associated to a specific meter. For cellular ERTs Billing must be able to store and pass a 10 digit ID number with a leading 0. If an ERT is removed from a meter and is not replaced by another, remove ert from CIS and change collectionmethod to Manual Read.',
  },
  {
    name: 'ROUTENAME',
    required: true,
    allowBlank: false,
    uniqueRequired: false,
    dataType: 'Character',
    length: 25,
    example: 'Book',
    notes: 'Route Name should be an exact match of existing route (examples are the Route number, Book number, or Cycle number).',
  },
  {
    name: 'ADDRESSLINE1',
    required: false,
    allowBlank: true,
    uniqueRequired: false,
    dataType: 'Character',
    length: 500,
    example: '1908 San Vincente Rd',
    notes: 'Additional address line if needed.',
  },
  {
    name: 'LAT',
    required: false,
    allowBlank: true,
    uniqueRequired: false,
    dataType: 'Character',
    example: '36.418176',
    notes: 'Latitude coordinate for the meter location. Use decimal degrees format.',
  },
  {
    name: 'LON',
    required: false,
    allowBlank: true,
    uniqueRequired: false,
    dataType: 'Character',
    example: '-116.074688',
    notes: 'Longitude coordinate for the meter location. Use decimal degrees format.',
  },
  {
    name: 'METERTYPE',
    required: false,
    allowBlank: true,
    uniqueRequired: false,
    dataType: 'Character',
    example: 'Generic',
    notes: 'Type of meter (e.g., Generic, Specific model).',
  },
  {
    name: 'METERMODEL',
    required: false,
    allowBlank: true,
    uniqueRequired: false,
    dataType: 'Character',
    example: 'Gas',
    notes: 'Meter model type (e.g., Gas, Water).',
  },
  {
    name: 'COLLECTIONMETHOD',
    required: true,
    allowBlank: false,
    uniqueRequired: false,
    dataType: 'Character',
    example: 'Cellular 500G ERT',
    notes: 'How readings are collected. Common values: Manual Read, Cellular 500W ERT, Cellular 500G ERT.',
  },
  {
    name: 'SEQUENCE',
    required: false,
    allowBlank: true,
    uniqueRequired: false,
    dataType: 'Character',
    example: '10',
    notes: 'Order in the route for reading.',
  },
  {
    name: 'METERNOMINALSIZE',
    required: false,
    allowBlank: true,
    uniqueRequired: false,
    dataType: 'Character',
    example: '5/8"',
    notes: 'Physical size of the meter.',
  },
  {
    name: 'METERFORMAT',
    required: false,
    allowBlank: true,
    uniqueRequired: false,
    dataType: 'Character',
    example: '4.0',
    notes: 'Format/precision for meter readings.',
  },
  {
    name: 'METERUNITS',
    required: false,
    allowBlank: true,
    uniqueRequired: false,
    dataType: 'Character',
    example: 'CCF',
    notes: 'Units of measurement. Gas: CCF, cu ft. Water: CCF, CGAL, cu ft, GAL, KGAL. Electric: KW, KWH.',
  },
  {
    name: 'METERINSTALLATIONDATE',
    required: false,
    allowBlank: true,
    uniqueRequired: false,
    dataType: 'Character',
    example: '17/06/1992',
    notes: 'Date the meter was installed. Format: DD/MM/YYYY or YYYY-MM-DD.',
  },
  {
    name: 'CATEGORY',
    required: false,
    allowBlank: true,
    uniqueRequired: false,
    dataType: 'Character',
    example: 'Residential',
    notes: 'Customer category (e.g., Residential, Commercial).',
  },
  {
    name: 'METERCOMMENT',
    required: false,
    allowBlank: true,
    uniqueRequired: false,
    dataType: 'Character',
    example: 'gate code: 4434',
    notes: 'Notes or comments about the meter location.',
  },
  {
    name: 'METERREF',
    required: false,
    allowBlank: true,
    uniqueRequired: false,
    dataType: 'Character',
    example: '',
    notes: 'Additional meter reference if needed.',
  },
  {
    name: 'PHONE',
    required: false,
    allowBlank: true,
    uniqueRequired: false,
    dataType: 'Character',
    example: '270-555-5555',
    notes: 'Customer phone number.',
  },
  {
    name: 'CUSTOMEREMAIL1',
    required: false,
    allowBlank: true,
    uniqueRequired: false,
    dataType: 'Character',
    example: 'Butch.Cassidy@gmail.com',
    notes: 'Customer email address.',
  },
  {
    name: 'DMA',
    required: false,
    allowBlank: true,
    uniqueRequired: false,
    dataType: 'Character',
    example: '10',
    notes: 'District Metered Area identifier.',
  },
  {
    name: 'PERMANTENTLYDISCONNECTED',
    required: false,
    allowBlank: true,
    uniqueRequired: false,
    dataType: 'Boolean',
    example: 'False',
    notes: 'Set to True if the meter is permanently disconnected and should not be read.',
  },
];

/**
 * Convert the column definitions to ValidationRule format
 * This is what the validation engine actually uses
 */
export function convertToValidationRules(): ValidationRule[] {
  return NEW_NETWORK_UPLOAD_COLUMNS.map((col, index) => {
    // Parse length - could be a number or a range like "5-48"
    let minLength: number | undefined;
    let maxLength: number | undefined;

    if (col.length) {
      if (typeof col.length === 'string' && col.length.includes('-')) {
        const [min, max] = col.length.split('-').map(Number);
        minLength = min;
        maxLength = max;
      } else {
        maxLength = typeof col.length === 'string' ? parseInt(col.length) : col.length;
      }
    }

    // Determine data type for validation
    const dataType = col.dataType === 'Boolean' ? 'boolean' : 'text';

    // Assign color based on rule importance
    let colorCode = '#94a3b8'; // Default gray
    if (col.required && !col.allowBlank) {
      colorCode = '#dc2626'; // Red for required
    } else if (!col.required) {
      colorCode = '#22c55e'; // Green for optional
    }
    if (col.uniqueRequired) {
      colorCode = '#8b5cf6'; // Purple for unique
    }

    return {
      id: `rule-${index}`,
      column_name: col.name,
      column_index: index,
      is_required: col.required,
      allow_blank: col.allowBlank,
      is_unique: col.uniqueRequired,
      min_length: minLength,
      max_length: maxLength,
      data_type: dataType,
      notes: col.notes,
      example: col.example,
      color_code: colorCode,
    };
  });
}

/**
 * Get the default validation template
 * This is the "NewNetworkUpload" format from your Excel
 */
export function getDefaultTemplate() {
  return {
    id: 'default-new-network-upload',
    name: 'NewNetworkUpload',
    description: 'Format for NewNetworkUpload CSV used to update Temetra with information from CIS/Billing. It is recommended to have this file automated on a nightly basis.',
    rules: convertToValidationRules(),
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * List of valid units of measure
 * Used to validate the METERUNITS column
 */
export const VALID_UNITS = {
  gas: ['CCF', 'cu ft'],
  water: ['CCF', 'CGAL', 'cu ft', 'GAL', 'KGAL'],
  electric: ['KW', 'KWH'],
};

/**
 * Valid collection methods
 * Used to validate the COLLECTIONMETHOD column
 */
export const VALID_COLLECTION_METHODS = [
  'Manual Read',
  'Cellular 500W ERT',
  'Cellular 500G ERT',
];

/**
 * Convert a database template row into a ValidationTemplate for the CSV validator.
 * The DB stores rules in the same ValidationRule format from types/index.ts.
 */
export function dbTemplateToValidationTemplate(
  dbTemplate: { id: string; name: string; description?: string | null; rules: ValidationRule[]; created_by?: string; created_at?: string; updated_at?: string }
): ValidationTemplate {
  return {
    id: dbTemplate.id,
    name: dbTemplate.name,
    description: dbTemplate.description || undefined,
    rules: dbTemplate.rules || [],
    created_by: dbTemplate.created_by || 'system',
    created_at: dbTemplate.created_at || new Date().toISOString(),
    updated_at: dbTemplate.updated_at || new Date().toISOString(),
  };
}

/**
 * ProjectValidationRule type for use with project-specific rules
 * (Simplified format, different from the main ValidationRule in types/index.ts)
 */
export interface ProjectValidationRule {
  columnName: string;
  displayName: string;
  required: boolean;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'email';
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  allowedValues?: string[];
  description?: string;
}

/**
 * Default validation rules for new projects
 * Simplified format for project-specific customization
 */
export const DEFAULT_VALIDATION_RULES: ProjectValidationRule[] = NEW_NETWORK_UPLOAD_COLUMNS.map(col => ({
  columnName: col.name,
  displayName: col.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  required: col.required,
  dataType: col.dataType === 'Boolean' ? 'boolean' : 'string',
  maxLength: typeof col.length === 'number' ? col.length :
    (typeof col.length === 'string' && !col.length.includes('-') ? parseInt(col.length) : undefined),
  description: col.notes,
}));
