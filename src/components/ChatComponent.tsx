"use client"
import React from "react"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Send } from "lucide-react"
import MessageList from "./MessageList"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import type { Message } from "ai"

type Props = { chatId: number }

const ChatComponent = ({ chatId }: Props) => {
  const [input, setInput] = React.useState("")
  const queryClient = useQueryClient()

  const { data: messages, isLoading } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      const response = await axios.post<Message[]>("/api/get-messages", {
        chatId,
      })
      return response.data
    },
  })

  const mutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await axios.post("/api/chat", {
        messages: [...(messages || []), { role: "user", content: message }],
        chatId,
      })
      return response.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["chat", chatId], (oldData: Message[] | undefined) => {
        return oldData ? [...oldData, { role: "user", content: input }, data] : [{ role: "user", content: input }, data]
      })
      setInput("")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    mutation.mutate(input)
  }

  React.useEffect(() => {
    const messageContainer = document.getElementById("message-container")
    if (messageContainer) {
      messageContainer.scrollTo({
        top: messageContainer.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [])

  return (
    <div className="relative max-h-screen overflow-scroll" id="message-container">
      {/* header */}
      <div className="sticky top-0 inset-x-0 p-2 bg-white font-black h-fit">
        <h3 className="text-xl font-bold text-black">Ask pdf!!</h3>
      </div>

      {/* message list */}
      <MessageList messages={messages || []} isLoading={isLoading || mutation.isPending} />

      <form onSubmit={handleSubmit} className="sticky bottom-0 inset-x-0 px-2 py-4 ">
        <div className="flex">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask any question..."
            className="w-full"
          />
          <Button type="submit" className="bg-blue-600 ml-2" disabled={mutation.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ChatComponent

