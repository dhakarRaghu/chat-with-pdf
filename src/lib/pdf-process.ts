"use server";

import pdfParse from "pdf-parse";      // in nodemodule comments the testing part in pdf-parse/index.js  to eliminate the error 005...
import { put } from "@vercel/blob";

export async function uploadPDF(pdf: File | null) {
  try {
    console.log("Received file for upload");

    // Ensure a file is provided
    if (!pdf) {
      return { error: "PDF file is required" };
    }

    // Convert File to Buffer
    const arrayBuffer = await pdf.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`Processing file: ${pdf.name}`);

    // Extract text from the PDF
    const pdfData = await pdfParse(buffer);
    const extractedText = pdfData.text;

    // Upload the PDF to Vercel Blob Storage
    const blob = await put(pdf.name, buffer, { access: "public" });

    return {
      message: "File uploaded and processed successfully",
      text: extractedText,
      fileUrl: blob.url,
    };
  } catch (error) {
    console.error("Error processing PDF:", error);
    return { error: "Failed to process PDF" };
  }
}
