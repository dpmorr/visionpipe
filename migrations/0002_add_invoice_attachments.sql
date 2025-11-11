CREATE TABLE IF NOT EXISTS "invoice_attachments" (
  "id" serial PRIMARY KEY NOT NULL,
  "invoice_id" integer NOT NULL,
  "file_name" text NOT NULL,
  "file_type" text NOT NULL,
  "file_size" integer NOT NULL,
  "file_url" text NOT NULL,
  "uploaded_at" timestamp DEFAULT now(),
  "uploaded_by" integer,
  CONSTRAINT "invoice_attachments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE,
  CONSTRAINT "invoice_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL
); 