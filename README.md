# ReGenerator

**ReGenerator** is an interactive, visual playground for exploring Regular Expressions and Automata Theory. By bridging the gap between raw regular expressions and their underlying mathematical constructs, this tool allows students, educators, and developers to visualize how a computer strictly understands pattern matching.

It provides a rich set of features that compile down regex strings into navigable graphs in real time.

## ✨ Features

- **Automata Visualization:** Type any standard regular expression and instantly view its mathematical graph representation. The tool compiles your regex and constructs the corresponding State Automata.
- **Mathematical Compilation Pipeline:**
  - **Regex to NFA** via *Thompson's Construction Algorithm*
  - **NFA to DFA** via *Subset / Powerset Construction*
  - **DFA Minimization** via *Hopcroft's Algorithm*
- **Interactive UI:** Hover over the nodes (states) of the graph to get an overlay of outgoing transitions, whether it is a start, accept, or intermediary state.
- **String Tester:** Evaluate test strings against your provided regex expression in real-time.
- **String Generator:** Automatically generate examples of random strings that are guaranteed to be accepted by the language defined in your regular expression.
- **Equivalence Checker:** Input two different regular expressions and the application will formally verify if they describe the exact same mathematical language. If they don't, it will attempt to provide a counterexample string!

## 🛠 Tech Stack

- **React & TypeScript:** Core component architecture and interface
- **Vite:** Blazing fast frontend build tooling
- **D3.js:** Force-directed graph simulation and dynamic SVG path rendering

## 🚀 Getting Started

Follow these steps to run the application locally on your machine:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/BhavishyaMaheshwari/ReGenerator.git
   cd ReGenerator
   ```

2. **Install dependencies:**
   Make sure you have [Node.js](https://nodejs.org/) installed, and then run:
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **View the app:**
   Open your browser and navigate to the local URL provided in the terminal (typically `http://localhost:5173/`).

## 📜 License

This project is built for educational context. Feel free to use and modify it!
