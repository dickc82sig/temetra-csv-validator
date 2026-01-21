/**
 * File Upload Component
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * A drag-and-drop file upload component that accepts CSV files.
 * Shows upload progress and validates file type before accepting.
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, File, X, AlertCircle, CheckCircle } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';

interface FileUploadProps {
  // Called when a file is selected
  onFileSelect: (file: File) => void;
  // Accepted file types (default: CSV only)
  acceptedTypes?: string[];
  // Maximum file size in bytes (default: 10MB)
  maxSize?: number;
  // Label text
  label?: string;
  // Help text
  helpText?: string;
  // Is the upload disabled?
  disabled?: boolean;
}

export default function FileUpload({
  onFileSelect,
  acceptedTypes = ['.csv', 'text/csv', 'application/vnd.ms-excel'],
  maxSize = 10 * 1024 * 1024, // 10MB default
  label = 'Upload CSV File',
  helpText = 'Drag and drop your CSV file here, or click to browse',
  disabled = false,
}: FileUploadProps) {
  // State for tracking drag events and selected file
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reference to the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Validate the selected file
   */
  const validateFile = (file: File): string | null => {
    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidType = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return fileExtension === type.toLowerCase();
      }
      return file.type === type;
    });

    if (!isValidType) {
      return 'Invalid file type. Please upload a CSV file.';
    }

    // Check file size
    if (file.size > maxSize) {
      return `File is too large. Maximum size is ${formatFileSize(maxSize)}.`;
    }

    return null; // No errors
  };

  /**
   * Handle file selection (from input or drop)
   */
  const handleFile = useCallback((file: File) => {
    setError(null);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  }, [onFileSelect, maxSize]);

  /**
   * Handle drag events
   */
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  /**
   * Handle file input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  /**
   * Clear the selected file
   */
  const clearFile = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      {/* Drop zone */}
      <div
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8
          transition-colors cursor-pointer
          ${disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : ''}
          ${isDragging ? 'border-temetra-blue-500 bg-temetra-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${error ? 'border-red-300 bg-red-50' : ''}
          ${selectedFile && !error ? 'border-green-300 bg-green-50' : ''}
        `}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />

        {/* Content based on state */}
        <div className="text-center">
          {selectedFile && !error ? (
            // File selected state
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <div className="flex items-center justify-center gap-2">
                <File className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">{selectedFile.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
          ) : error ? (
            // Error state
            <div className="space-y-2">
              <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="text-sm text-temetra-blue-600 hover:text-temetra-blue-700"
              >
                Try again
              </button>
            </div>
          ) : (
            // Default state
            <div className="space-y-2">
              <Upload className={`mx-auto h-10 w-10 ${isDragging ? 'text-temetra-blue-500' : 'text-gray-400'}`} />
              <p className="text-sm text-gray-600">{helpText}</p>
              <p className="text-xs text-gray-500">
                CSV files only, up to {formatFileSize(maxSize)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Selected file info (if showing details below) */}
      {selectedFile && !error && (
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-green-600">File ready for upload</span>
          <button
            type="button"
            onClick={clearFile}
            className="text-gray-500 hover:text-gray-700"
          >
            Change file
          </button>
        </div>
      )}
    </div>
  );
}
