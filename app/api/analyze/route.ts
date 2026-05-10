import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { board, solution, row, col } = await req.json();

    if (board[row][col] !== 0 && board[row][col] !== null) {
      return NextResponse.json({
        analysis: `[SECTOR ${row},${col}] CELL ALREADY FILLED. SELECT AN EMPTY CELL.`,
      });
    }

    const correct = solution[row][col];
    const rowNums = board[row].filter((n: number | null) => n !== null && n !== 0).join(", ");
    const colNums = board.map((r: (number | null)[]) => r[col]).filter((n: number | null) => n !== null && n !== 0).join(", ");
    
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    const boxNums: number[] = [];
    for (let r = boxRow; r < boxRow + 3; r++)
      for (let c = boxCol; c < boxCol + 3; c++)
        if (board[r][c] !== null && board[r][c] !== 0) boxNums.push(board[r][c]);

    // 💡 РЕЗЕРВНЫЙ ОТВЕТ (FALLBACK): Если Google API недоступен, выдаем эту красивую заглушку
    const fallbackResponse = `[OFFLINE PROTOCOL] TACTICAL SCAN COMPLETE. 
Row ${row} and Column ${col} cross-reference indicates interference. 
Elimination logic confirms the only viable digit is ${correct}. Proceed with operation.`;

const prompt = `You are an AI Analyst for 0xdoku, a hacker sudoku game. Be tactical and brief.Reply with MAXIMUM 2 sentences DONT YAP bro. Use words like SECTOR, ELIMINATE, VECTOR. Do NOT state the answer directly.

Analyze row ${row} col ${col}. Row has: ${rowNums || "none"}. Column has: ${colNums || "none"}. Box has: ${boxNums.join(", ") || "none"}. Correct digit is ${correct}. Explain elimination logic.`;

    const apiKey = process.env.GEMINI_API_KEY;
    
    // Если ключа нет вообще — сразу отдаем резервный ответ
    if (!apiKey) {
      console.warn("⚠️ No API Key found, using Offline Protocol.");
      return NextResponse.json({ analysis: fallbackResponse });
    }

    // Пробуем достучаться до бесплатной и самой легкой модели
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;
    
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 5000 },
      }),
    });

    const data = await res.json();

    // Если Google выдал ошибку (лимиты, бан в регионе) — НЕ ПАДАЕМ, отдаем резервный ответ!
    if (!res.ok) {
      console.warn("⚠️ Google API Error (Quota/Region limit), using Offline Protocol. Error:", data.error?.message);
      return NextResponse.json({ analysis: fallbackResponse });
    }

    // Если всё прошло успешно, отдаем реальный ответ от ИИ
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || fallbackResponse;
    return NextResponse.json({ analysis: text });

  } catch (error) {
    console.error("❌ Backend Crash:", error);
    // Даже если сервер упал, пользователь всё равно получит помощь
    return NextResponse.json({ 
      analysis: "[EMERGENCY OVERRIDE] SYSTEM OFFLINE. TARGET SECTOR REQUIRES MANUAL DECRYPTION." 
    });
  }
}