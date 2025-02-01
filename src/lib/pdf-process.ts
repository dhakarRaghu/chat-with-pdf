"use server";
import pdfParse from "pdf-parse";      // in nodemodule comments the testing part in pdf-parse/index.js  to eliminate the error 005...
import { put } from "@vercel/blob";
import { processTextIntoPinecone } from "./pinecone";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "./db";
import { chats } from "./db/schema";

export async function uploadPDF(pdf: File | null) {

  const {userId} = await auth();
  if(!userId){
    redirect('/sign-in');
  }

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

    let chat_id: any[] = [];
console.log("blob" , blob);
    if (extractedText) {
      try {
        console.log("Processing file:", pdf.name);
        const fileKey = `${pdf.name}-${Date.now()}.pdf`;
        await processTextIntoPinecone(extractedText, fileKey);
        console.log("Embedding uploaded successfully!");

        chat_id = await db.insert(chats).values({
          fileKey: fileKey,
          pdfName : pdf.name,
          pdfUrl : blob.url,
          userId
        })
        .returning({
          insertedId : chats.id,
        })

        // if(chat_id){
        //   redirect(`/chat/${chat_id[0]}`);
        // }
        // console.log("chat_id : " , chat_id) 
        // console.log("chat_id[0] : " , chat_id[0])
        // console.log("insertedid : " , chat_id[0].insertedId )
      } catch (error) {
        console.error("Error processing text:", error);
      }
    } else {
      console.warn("Invalid file input. Skipping processing.");
    }

    return {
      message: "File uploaded and processed successfully",
      chat_id : chat_id.length > 0 ? chat_id[0].insertedId : null,
      text: extractedText,
      fileUrl: blob.url,
    };
  } catch (error) {
    console.error("Error processing PDF:", error);
    return { error: "Failed to process PDF" };
  }
}
