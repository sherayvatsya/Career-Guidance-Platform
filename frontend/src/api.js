function buildOfflineMentorReply(messages) {
  const lastUserMessage =
    [...messages].reverse().find((m) => m?.role === "user" && typeof m.content === "string")?.content?.toLowerCase() || "";

  if (lastUserMessage.includes("web development") || lastUserMessage.includes("web dev")) {
    return "Great goal. Web development roadmap: 1) Learn HTML, CSS, and JavaScript fundamentals. 2) Build 3 small projects (landing page, responsive portfolio, and a todo app). 3) Learn React and API integration. 4) Learn backend basics with Node.js/Express and a database like PostgreSQL or MongoDB. 5) Deploy 2 full-stack projects and prepare for interviews with DSA + system design basics.";
  }

  return "I can still help without the external AI key. Share your target role, current skill level, and timeline, and I will give you a step-by-step roadmap.";
}

export async function askClaude(messages) {
  const res = await fetch("http://localhost:4000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = typeof data?.error === "string" ? data.error : "Chat request failed";
    if (/ANTHROPIC_API_KEY/i.test(message)) {
      return buildOfflineMentorReply(messages);
    }
    throw new Error(message);
  }

  if (typeof data?.error === "string" && /ANTHROPIC_API_KEY/i.test(data.error)) {
    return buildOfflineMentorReply(messages);
  }

  return data.reply || "I couldn't process that. Please try again.";
}
