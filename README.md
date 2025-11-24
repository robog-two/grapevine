# Grapevine (🍇.robog.net)
A natural language embedding index for Geminispace + Some HTTP

 - [ ] Grapevine General Roadmap
    - [ ] Prototype
      - [x] Implement basic Queue
      - [ ] Implement Gather
        - [ ] Fetch gemini URLs
        - [ ] Ignore HTTP
      - [ ] Implement Embed
        - [ ] Vector data saved to file
        - [ ] Embed with Ollama
    - [ ] MVP
      - [ ] Queue saves to file and can be very large (RabbitMQ?)
      - [ ] Advanced Gather (influenced by search.ts from robog-two/deno-llm-api)
        - [ ] Respect robots.txt (probably OK to simply re-fetch every time)
        - [ ] Fetch HTTP urls
          - [ ] Don't extract links (the internet is huge!)
          - [ ] Extract text with reader.js
        - [ ] Filter bad urls with ublock
      - [ ] Advanced Embed
        - [ ] Real vector database
    - [ ] High performance implementation
      - [ ] Parallelize gathering, delay between requests to the same IP, but shotgun-blast many different IPs
      - [ ] Gather everything
        - [ ] Robots.txt information should probably go into SQL or a fast KV database
        - [ ] Extract links by parsing html -> DOM
        - [ ] Probably will need to compress queue as it may get very large otherwise (can rabbitmq do this by default?)
      - [ ] Embed everything
        - [ ] Compress text or entire vector database
        - [ ] Parallelize embeddings with Llama.cpp

## Design Notes

I'm using this project as a springboard to get back into software architecture / TDD in typescript, since we've been considering doing greenfield devlopment in TS for [Localify](https://localify.org/team/about-us) to implement the features we have planned in regards to expanding our data with more scraping and crowdsourcing. I've been working on making something like this for some time, most recently with my [Small Language Model RAG search service](https://github.com/robog-two/deno-llm-api) (currently offline due to resource consumption as of Nov 23)

![The project architechture as rendered by GraphViz, if you cannot see the image, you may read /design.dot which details the graph in dot code](/design.png)

## Definitions
My very basic definitions of the following terms might help if you are out-of-the-loop on the newer/popular machine learning lingo.
**RAG** - Retreival Augmented Generation, a process where you transform a user's query into a vector with a NLE model, retreive similar vectors (and their associated text chunks from an trusted source) from a database, and then feed all of this data as context into an LLM to improve truthfulness and accuracy.

**NLE** - Natural Language Embedding transforms a piece of text into a vector. It is designed in such a way that the vector roughly represents the meaning of the text, therefore, vectors with a shorter distance from each other are more similar in meaning, like "the sky is blue" and "what color is the sky"

**LLM** - Large Language Model, a transformer neural network that takes text and predicts the next word that makes the most sense. They are generally tuned to answer questions and reformat input in a way that is natural and easy to read. This project does not use a large language model, though you could
