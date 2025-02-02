import { GoogleGenerativeAI } from "@google/generative-ai"
import { getContext } from "@/lib/context"
import { db } from "@/lib/db"
import { chats, messages, userSystemEnum } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: Request) {
  try {
    const { messages: chatMessages, chatId } = await req.json()

    // console.log("chatMessages:", chatMessages)
    // Fetch chat details from the database
    const _chats = await db.select().from(chats).where(eq(chats.id, chatId))
    if (_chats.length !== 1) {
      return NextResponse.json({ error: "chat not found" }, { status: 404 })
    }

    const fileKey = _chats[0].fileKey
    const lastMessage = chatMessages[chatMessages.length - 1]

    // Get context from the file using your custom function
    const context = await getContext(lastMessage.content, fileKey)
    // console.log("message :", lastMessage.content , "fileKey : " , fileKey)
    // console.log("Context:", context)

    // Construct the prompt for the AI model
    const prompt = `AI assistant is a brand new, powerful, human-like artificial intelligence.
      The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
      AI is a well-behaved and well-mannered individual.
      AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
      AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
      AI assistant is a big fan of Pinecone and Vercel.
      START CONTEXT BLOCK
      ${context}
      END OF CONTEXT BLOCK
      AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
      If the context does not provide the answer to the question, the AI assistant will say, "I'm sorry, but I don't have enough information to answer that question based on the given context."
      AI assistant will not apologize for previous responses, but instead will indicate new information was gained.
      AI assistant will not invent anything that is not drawn directly from the context.
      
      User: ${lastMessage.content}
      AI:`

    // Make the request to Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    const result = await model.generateContent(prompt)
    const response = result.response
    const aiMessage = response.text()

    // console.log("AI Response:", aiMessage)
    // Save user message into db
    await db.insert(messages).values({
      chatId,
      content: lastMessage.content,
      role: userSystemEnum.enumValues[1], // "user"
    })

    // Save AI message into db
    await db.insert(messages).values({
      chatId,
      content: aiMessage,
      role: userSystemEnum.enumValues[0], // "system"
    })

    // Return the AI response
    return NextResponse.json({ role: "system", content: aiMessage })
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json({ error: "An error occurred" }, { status: 500 })
  }
}

