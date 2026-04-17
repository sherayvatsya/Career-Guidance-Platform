export async function askClaude(messages) {
  const res = await fetch("http://localhost:4000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages })
  });

  if (!res.ok) {
    throw new Error("Chat request failed");
  }

  const data = await res.json();
  return data.reply || "I couldn't process that. Please try again.";
}
