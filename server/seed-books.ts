import { db } from "./db";
import { publishedBooks } from "../shared/schema";
import { eq } from "drizzle-orm";

async function seedBooks() {
  console.log("Seeding books...");

  const booksToSeed = [
    {
      authorId: "mathew-trustlayer",
      authorName: "Mathew",
      title: "Through The Veil",
      slug: "through-the-veil",
      description: "A 107,000-word investigation into the hidden architecture of history. 52 chapters. 13 parts. What if the most important name in history was deliberately changed — and the evidence has been hiding in plain sight for centuries?",
      coverImageUrl: "/images/trust-book-featured.jpg",
      genre: "Investigation",
      category: "nonfiction",
      subcategory: "Investigation",
      tags: ["Hidden History", "Ancient Texts", "Institutional Power", "Documentary"],
      price: 499,
      status: "published",
      wordCount: 107000,
      chapterCount: 52,
      sampleChapters: 1,
      rating: "5.0",
      reviewCount: 142,
      publishedAt: new Date(),
    },
    {
      authorId: "mathew-trustlayer",
      authorName: "Mathew",
      title: "Speaking Code",
      slug: "speaking-code",
      description: "The definitive guide to Lume and the AI-native programming revolution. Learn how to bridge the gap between human intent and machine execution without learning an arbitrary syntax. The architecture behind cognitive distance and voice-to-code execution.",
      coverImageUrl: "/images/trust-book-reader.jpg", // generic image for now
      genre: "Technology",
      category: "nonfiction",
      subcategory: "Technology",
      tags: ["Programming", "AI", "Lume", "Software Architecture", "Future of Work"],
      price: 999,
      status: "published",
      wordCount: 45000,
      chapterCount: 12,
      sampleChapters: 2,
      rating: "4.9",
      reviewCount: 38,
      publishedAt: new Date(),
    }
  ];

  for (const book of booksToSeed) {
    const existing = await db.select().from(publishedBooks).where(eq(publishedBooks.slug, book.slug));
    if (existing.length === 0) {
      console.log(`Inserting ${book.title}...`);
      await db.insert(publishedBooks).values(book);
    } else {
      console.log(`Updating ${book.title}...`);
      await db.update(publishedBooks).set(book).where(eq(publishedBooks.slug, book.slug));
    }
  }

  console.log("Book seeding complete!");
  process.exit(0);
}

seedBooks().catch(console.error);
