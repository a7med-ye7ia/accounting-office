-- Add ocr_data column to contracts table for storing OCR extraction results
-- Stores the full JSON response from the OCR service as-is

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS ocr_data TEXT;
