# Train Company Simulator

**Train Company Simulator** is a dynamic and engaging web-based simulation game where you take on the role of a budding entrepreneur aiming to build and manage your own railway empire. Strategically build tracks, purchase and upgrade trains, manage finances, and expand your network across diverse regions to become the top train company in Railtopia!

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Demo](#demo)
- [Installation](#installation)
- [Usage](#usage)
- [Game Mechanics](#game-mechanics)
- [Technologies Used](#technologies-used)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## Features

- **Track Building:** Design and expand your railway network by connecting cities with strategic track placements.
- **Diverse Train Types:** Purchase a variety of trains, each with unique speeds, capacities, and maintenance costs.
- **Financial Management:** Balance your budget by managing expenses, revenue, loans, and investments.
- **Dynamic Market:** Adapt to changing demands, economic conditions, and political landscapes.
- **Competitive AI:** Face off against AI-controlled train companies vying for market dominance.
- **Upgrades and Research:** Invest in upgrades and research to unlock advanced technologies and improve your fleet.
- **Interactive Map:** Visualize your expanding railway network on an interactive and responsive map.
- **Achievements and Missions:** Complete missions and earn achievements to track your progress and earn rewards.
- **Save and Load:** Save your progress and load your game anytime to continue building your empire.

## Installation

To run **Train Company Simulator** locally on your machine, follow these steps:

### Prerequisites

- [Node.js](https://nodejs.org/) installed on your machine.
- A web browser (e.g., Chrome, Firefox, Edge).

### Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Gemeri/Tren.git
   ```

2. **Navigate to the Project Directory**

   ```
   cd train-company-simulator
   ```

3. **Install Dependencies**

   If your project uses any dependencies (e.g., via `npm`), install them. For this basic setup, no dependencies are required, but if you have a `package.json`, run:

   ```
   npm install
   ```

4. **Start a Local Server**

   You can use any local server. Here's how to do it using `http-server`:

   - **Install `http-server` Globally**

     ```
     npm install -g http-server
     ```

   - **Start the Server**

     ```
     http-server
     ```

   The game should now be accessible at `http://localhost:8080` (default port).

   *Alternatively*, you can open the `index.html` file directly in your web browser, but some functionalities might require a local server.

## Usage

1. **Launch the Game**

   Open your web browser and navigate to `http://localhost:8080` (or the URL provided by your local server).

2. **Main Menu**

   - **Play New Game:** Start a fresh game and embark on building your railway empire.
   - **Load Game:** Load a previously saved game state from your local machine.

3. **Gameplay**

   - **Build Tracks:** Click the "Build Track" button and select two cities on the map to connect them with a railway track.
   - **Buy Trains:** Purchase different types of trains (slow or fast) to run on your tracks.
   - **Upgrade Tracks:** Enhance your tracks to improve maintenance costs and train speeds.
   - **Manage Finances:** Monitor your money, manage loans, and adjust workers' pay to balance your budget.
   - **Political Affiliation:** Change your political stance to influence tax rates and other economic factors.
   - **Save Game:** Regularly save your progress to continue your journey later.

4. **Controls**

   - **Spacebar:** Pause/Unpause the game.
   - **Mouse:** Interact with cities, tracks, and UI elements.

## Game Mechanics

### 1. **Building Tracks**

- **First Track:** You can build your first track between any two cities.
- **Expansion:** Subsequent tracks must connect at least one city that's already connected to an existing track, ensuring a connected railway network.
- **Costs:** Building tracks consumes money based on the distance between cities and the current tax rate.

### 2. **Purchasing and Managing Trains**

- **Train Types:** Choose between slow and fast trains, each with distinct speeds, maintenance costs, and revenue generation.
- **Assignment:** Assign trains to tracks to start generating revenue.
- **Upgrades:** Improve trains to enhance their performance and profitability.

### 3. **Financial Management**

- **Income:** Earn revenue from running trains on tracks.
- **Expenses:** Pay for maintenance costs, workers' salaries, track upgrades, and other operational costs.
- **Loans:** Take out loans to invest in your company, with repayment terms and interest rates.
- **Bankruptcy:** Mismanaging finances can lead to bankruptcy, ending the game.

### 4. **Political and Economic Factors**

- **Political Affiliation:** Changing your company's political stance affects tax rates and economic conditions.
- **Market Demand:** Adapt to changing demands for passenger and cargo services.
- **Competitors:** Compete against AI-controlled companies vying for dominance.

### 5. **Train Animations**

- **Visual Representation:** Trains move smoothly along tracks, reversing direction upon reaching endpoints.
- **Infinite Loop:** Trains continuously shuttle between cities, enhancing the visual realism of the simulation.

## Technologies Used

- **Frontend:**
  - HTML5
  - CSS3
  - JavaScript (ES6+)
  - Canvas API for rendering graphics and animations

- **Backend:**
  - [Optional] Node.js with Express.js (if you implement server-side features)

- **Tools:**
  - [http-server](https://www.npmjs.com/package/http-server) for local development
  - Git for version control

## Contributing

Contributions are welcome! Follow these steps to contribute to **Train Company Simulator**:

1. **Fork the Repository**

   Click the "Fork" button at the top right of this page to create a copy of the repository on your GitHub account.

2. **Clone the Forked Repository**

   ```
   git clone https://github.com/Gemeri/Tren.git
   ```

3. **Create a New Branch**

   ```
   git checkout -b feature/YourFeatureName
   ```

4. **Make Your Changes**

   Implement your feature or fix a bug.

5. **Commit Your Changes**

   ```
   git commit -m "Add feature: Your Feature Description"
   ```

6. **Push to Your Forked Repository**

   ```
   git push origin feature/YourFeatureName
   ```

7. **Create a Pull Request**

   Navigate to the original repository and click "New Pull Request" to submit your changes for review.

## License

This project is licensed under the [MIT License](LICENSE).

---
