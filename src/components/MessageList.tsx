import { cn } from "@/lib/utils"
import type { Message } from "ai/react"
import { Loader2 } from "lucide-react"

type Props = {
  isLoading: boolean
  messages: Message[]
}

const MessageList = ({ messages, isLoading }: Props) => {
  if (isLoading && messages.length === 0) {
    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2 px-4">
      {messages.map((message, index) => {
        return (
          <div
            key={index}
            className={cn("flex", {
              "justify-end pl-10": message.role === "user",
              "justify-start pr-10": message.role === "system",
            })}
          >
            <div
              className={cn("rounded-lg   px-3 text-sm py-1 shadow-md ring-1 ring-black-900/10", {
                "bg-blue-500 text-black": message.role === "user",
              })}
            >
              <p>{message.content}</p>
            </div>
          </div>
        )
      })}
      {isLoading && messages.length > 0 && (
        <div className="flex justify-start pr-10">
          <div className="rounded-lg px-3 text-sm py-1 shadow-md ring-1 ring-gray-900/10">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        </div>
      )}
    </div>
  )
}

export default MessageList

