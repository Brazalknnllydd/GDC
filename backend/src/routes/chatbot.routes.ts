import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.post("/message", requireAuth, requireRole(["Admin"]), async (req, res) => {
  try {
    const { message, history } = req.body as {
      message: string;
      history?: { role: "user" | "model"; text: string }[];
    };

    if (!message || typeof message !== "string") {
      return res.status(400).json({ message: "Message is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        response: "Hello! I am GDC Bot. I'm ready to help, but the backend GEMINI_API_KEY is not configured in the `.env` file. Please add it to start chatting! 😊"
      });
    }

    // 1. Gather data context from Prisma
    const [products, sales, staffCount, customersCount, categories] = await Promise.all([
      prisma.product.findMany({
        select: {
          name: true,
          price: true,
          stock: true,
          category: {
            select: {
              name: true,
            }
          }
        }
      }),
      prisma.sale.findMany({
        select: {
          totalAmount: true,
          createdAt: true,
        }
      }),
      prisma.user.count(),
      prisma.customer.count(),
      prisma.category.findMany({
        select: {
          name: true,
        }
      }),
    ]);

    const totalSalesCount = sales.length;
    const totalRevenue = sales.reduce((acc, s) => acc + Number(s.totalAmount), 0);

    // Calculate low/out of stock
    const lowStock = products.filter(p => p.stock <= 5);
    const outOfStock = products.filter(p => p.stock === 0);

    // Shorten product list for token efficiency
    const formattedProducts = products.map(p => ({
      name: p.name,
      price: Number(p.price),
      stock: p.stock,
      category: p.category.name,
    }));

    const systemContext = {
      date: new Date().toISOString().split("T")[0],
      stats: {
        total_products: products.length,
        total_categories: categories.length,
        total_sales: totalSalesCount,
        total_revenue: totalRevenue,
        total_staff: staffCount,
        total_customers: customersCount,
        low_stock_count: lowStock.length,
        out_of_stock_count: outOfStock.length,
      },
      categories: categories.map(c => c.name),
      low_stock_items: lowStock.map(p => `${p.name} (${p.stock} left)`),
      out_of_stock_items: outOfStock.map(p => p.name),
      products: formattedProducts.slice(0, 80), // limit list to avoid huge tokens
    };

    const systemInstruction = `You are a friendly, direct, and token-efficient AI chatbot helper on the GDC POS Admin Dashboard. Your name is GDC Bot.
The user is the store administrator.
You are given the following GDC POS system snapshot data:
${JSON.stringify(systemContext)}

RULES:
1. ONLY answer questions directly about GDC POS store metrics, data, and performance (such as total sales, products, low stock items, total revenue, active customers, staff counts, and profit statistics).
2. CRITICAL SECURITY: Never answer questions about the system's security, technology stack (e.g., React Native, Expo, Node.js, Express, Prisma, PostgreSQL), environment variables (.env files), JWT secrets, database structures, software version numbers, or any backend configuration. If asked about these, politely state that you are only authorized to assist with POS business data and statistics, not technical or security configurations.
3. If the user asks for general information outside the POS context (e.g. general trivia, math, code writing, or other systems), politely decline.
4. Be friendly, warm, and professional, but keep your responses extremely short, concise, and straight-to-the-point to save tokens. Answer in 1-2 sentences, max 3. Use emojis occasionally (like 😊, 📦, 💰) to be friendly.
5. If a calculation is requested (e.g., profit margin, growth), do it based only on this snapshot's price/costPrice/sales total.`;

    const contents = [];
    
    // Add history if present
    if (history && Array.isArray(history)) {
      for (const h of history) {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        });
      }
    }

    // Add current message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000,
        }
      })
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("Gemini API error:", errText);
      return res.status(502).json({ message: "Failed to communicate with Gemini API" });
    }

    const data = await geminiResponse.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a reply right now.";

    res.json({ response: botReply.trim() });
  } catch (error) {
    console.error("Chatbot controller error:", error);
    res.status(500).json({ message: "An error occurred while processing your chat request" });
  }
});

export default router;
