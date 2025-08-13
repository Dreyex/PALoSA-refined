# Cheat Sheet
## Directory Structure
### Client-Side

- src/assets/: A place for all static, non-code assets. Store your images, custom fonts, icons (SVGs), etc., here. Vite will correctly bundle these when you build the project.
- src/components/: This is for your reusable React components.
- layout/: For major structural components that define the page layout, like Header, Footer, Navbar, or Sidebar.
- ui/: For small, generic, purely presentational components that could be used anywhere (e.g., a styled Button, a Card container, an Input field).
- Other components (ProjectCard.jsx) can live at the top level of components if they are more specific to your application's domain.
- src/hooks/: For your custom React hooks. As your app grows, you'll extract logic from components into reusable hooks (e.g., a useFetch hook, or in this case, a usePortfolioData hook to contain the fetching logic).
- src/pages/: For top-level components that represent an entire page or view (e.g., Home, About, Contact). If you were to add routing to your application, your router would map paths like / to HomePage.jsx and /about to AboutPage.jsx.
- src/services/: To abstract away third-party service interactions, especially API calls. Instead of having fetch logic inside your components, you'd have a function here. This makes your code much cleaner. For example, api.js might contain a function getPortfolio() that performs the fetch.

### Server-Side
- index.js (The Entry Point): This file should now be very simple. Its only jobs are to:
- Import and set up middleware (like cors).
- Connect to the database (if any).
- Tell Express to use your routes.
- Start the server.
- routes/: This folder defines the API endpoints (the URLs). It maps a URL like /api/portfolio to a specific controller function. It handles the "what" and "where" of a request.
- controllers/: This is the "brain" of your API. A controller function is executed by a route. Its job is to handle the incoming request, perform business logic (like getting data), and send back a response. It handles the "how" a request is processed.
- controllers/utils: Here all helping/utility functions are stored.
- models/: This folder is for your data schema and interaction logic. Even if you are not using a database yet, it's a good practice to have a "model" file that is responsible for providing the data. If you later add a database like MongoDB, all your database queries would live here.
- config/: For configuration variables like the server port, database connection strings, or API keys. It's best practice to load these from environment variables.
- .env: A file (added to .gitignore!) to store your environment variables locally. For example: PORT=3001.
---
## Branch Naming Conventions

### Types
- feature/ for new features or enhancements
- bugfix/ (or bug/) for fixing a bug
- hotfix/ for urgent fixes or emergency patches
- release/ for release preparation branches
- chore/ for maintenance tasks like dependency updates or documentation
- test/ for experimental work
  
### Typography

`<type>/<issue-reference>/<short-description>`

### Help
- Use separators consistently (slashes or hyphens).
- Keep branch names concise but descriptive.
- Avoid long names for long-lived branches.
- Stick to lowercase letters, numbers, hyphens, and dots (for versions in release branches).
- Avoid starting with a dot or ending with a slash.
- Avoid reserved names (like HEAD, FETCH_HEAD).
- Use ticket numbers to make tracking easier.