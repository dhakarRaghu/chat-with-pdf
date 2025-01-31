"use client";

import type { PutBlobResult } from "@vercel/blob";
import { useState, useRef } from "react";
import { Button } from "./ui/button";

export default function UploadPDF() {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [blob, setBlob] = useState<PutBlobResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB (adjust as needed) // because 4.5 max blob
  const ALLOWED_FORMATS = ['application/pdf']; // Only allow PDFs

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFileName(event.target.files[0].name);
      setError(null);
    }
  };

  // Handle drag events
  const handleDragOver = (event: React.DragEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDragActive(false);

    if (event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      setFileName(file.name);
      inputFileRef.current!.files = event.dataTransfer.files;
      setError(null);
    }
  };

  // Handle file upload
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!inputFileRef.current?.files || inputFileRef.current.files.length === 0) {
      setError("Please select a file first.");
      return;
    }
    

    const file = inputFileRef.current.files[0];

    if (file.size > MAX_FILE_SIZE) {
        alert('File size exceeds 5MB limit.');
        return;
      }
      if (!ALLOWED_FORMATS.includes(file.type)) {
        alert('Only PDF files are allowed.');
        return;
      }

    try {
      setUploading(true);
      const response = await fetch(`/api/upload?filename=${file.name}`, {
        method: "POST",
        body: file,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file.");
      }

    

      const newBlob = (await response.json()) as PutBlobResult;
      setBlob(newBlob);
      setFileName(null);
      setError(null);
    } catch (err) {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md">
      <form
        onSubmit={handleSubmit}
        className="w-full"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drop Zone */}
        <div
          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200
          ${dragActive ? "border-blue-600 bg-blue-100" : "border-gray-300"}`}
          onClick={() => inputFileRef.current?.click()}
        >
          <p className="text-gray-600">
            {dragActive ? "Drop the file here..." : "Drag & Drop your file here or Click to upload"}
          </p>
          <Button type="button" className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200">
            Select File
          </Button>
        </div>

        {/* Hidden Input Field */}
        <input name="file" ref={inputFileRef} type="file" required className="hidden" onChange={handleFileChange} />

        {/* Selected File Name */}
        {fileName && <p className="text-gray-700 text-sm mt-2">Selected: {fileName}</p>}

        {/* Error Message */}
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        {/* Upload Button */}
        <Button
          type="submit"
          disabled={uploading}
          className={`w-full mt-4 px-4 py-2 text-white rounded-lg transition duration-200 ${
            uploading ? "bg-gray-500 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {uploading ? "Uploading..." : "Upload"}
        </Button>
      </form>

      {/* Uploaded File Link */}
      
      {blob && (
        <div className="mt-4 text-center">
          <p className="text-gray-700">File uploaded successfully!</p>
          <a href={blob.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
            View File
            { blob.url }{ blob.pathname}
          </a>
        </div>
      )}
    </div>
  );
}
