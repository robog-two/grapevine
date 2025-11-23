import { RingQueue } from "./src/ring_queue.ts";
import { embedAndStore } from "";
import { gather } from "";
import { Queue } from "./src/queue.ts";

// Every page we need to crawl and embed
const pages: Queue<URL> = new RingQueue();

// Good starter page with lots of outlinks
pages.enqueue(new URL("gemini://bbs.geminispace.org/tag/?atom"));

setInterval(() => {
  if (pages.isEmpty()) Deno.exit(0); // Entire geminispace crawled?

  // Get the text of the page as well as any outgoing links
  const { text, links } = gather(pages.dequeue());

  // Generate embeddings for the text and store them in the database
  embedAndStore(text);

  // Add all of the links we found and search them next
  links.forEach((link: URL) => pages.enqueue(link));
}, 60000); // 1 minute seems vaguely kind
