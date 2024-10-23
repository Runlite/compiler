# Express TypeScript Template

This is a robust Express server template built with TypeScript, incorporating best practices for security, logging, health checks, monitoring, and environment management.

## Features

- **TypeScript**: Fully typed codebase for better developer experience and fewer runtime errors
- **Express.js**: Fast, unopinionated, minimalist web framework for Node.js
- **Robust Routing**: Organized and extensible routing system
- **Logging**: Comprehensive logging using Winston
- **Health Checks**: Detailed health check endpoint for monitoring application status
- **Security Best Practices**: 
  - Helmet for setting secure HTTP headers
  - CORS protection
  - Rate limiting to prevent abuse
  - Input validation using express-validator
- **Monitoring**: Prometheus metrics endpoint for system monitoring
- **Environment Management**: dotenv for easy environment variable management
- **Error Handling**: Global error handling middleware
- **Code Quality**: ESLint and Prettier for consistent code style
- **Testing**: Jest setup for unit and integration testing
- **API Documentation**: Swagger UI for interactive API documentation

## Prerequisites

- Node.js (v14 or later)
- npm or yarn


   ```
## Getting Started

### Using GitHub Template

This repository is set up as a GitHub template. You can create a new project based on this template by clicking the "Use this template" button at the top of the repository page on GitHub.

Alternatively, you can use the following command to create a new project based on this template:

```bash
git clone https://github.com/ajaysehwal/express-ts-template.git my-project
cd my-project
```

After cloning, remember to remove the existing Git history and initialize a new repository:

```bash
rm -rf .git
git init
```

### Installation and Setup

1. Install dependencies:
   ```bash
   yarn install
   ```
2. Set up Object-relational mapping (ORM):
   ```bash
   yarn setup:ORM
   ```
   
2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your specific configuration.

3. Start the development server:
   ```bash
   yarn dev
   ```



The server will start on `http://localhost:4949` (or the port specified in your .env file).

## Project Structure

```
.
├── src/
│   ├── config/
|   ├── constants/
|   ├── managers/
│   ├── controllers/
│   ├── middlewares/
│   ├── schema/
│   ├── routes/
│   ├── security/
│   ├── services/
│   ├── types/
│   ├── utils/
│   └── index.ts
├── tests/
├── .env.example
├── .eslintrc.js
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Configuration

Configuration is managed through environment variables. See `.env.example` for available options.

## API Routes

- `GET /health`: Health check endpoint
  - Protected with Basic Auth
  - Default credentials: username: `admin`, password: `admin`

- `GET /metrics`: Prometheus metrics endpoint
  - Protected with Basic Auth
  - Default credentials: username: `admin`, password: `admin`

- Add your custom routes here

**Important Security Note:** 
The `/health` and `/metrics` routes are protected with Basic Authentication using default credentials. It is **strongly recommended** to change these credentials before deploying to production. You can modify the credentials in the `.env` file:

## Logging

This template uses Winston for logging. Logs are written to both console and file. Configure log levels and file paths in `src/config/logger.ts`.

## Health Checks

The `/health` endpoint provides detailed information about the application's status, including:

- Server uptime
- Database connection status
- Memory usage
- CPU load

## Security

Security measures implemented:

- Helmet.js for setting secure HTTP headers
- CORS protection
- Rate limiting on all routes
- Input validation using express-validator

Ensure to keep all dependencies up to date and regularly review security best practices.

## Monitoring

A Prometheus-compatible metrics endpoint is available at `/metrics`. This can be integrated with monitoring tools like Grafana for visualizing application performance.

## Environment Management

Environment variables are managed using dotenv. Copy `.env.example` to `.env` and adjust the values as needed. Never commit the `.env` file to version control.


## Deployment

This template can be deployed to any environment that supports Node.js. Make sure to set the appropriate environment variables in your production environment.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
