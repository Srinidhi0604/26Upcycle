# Upcycle Hub - Marketplace Platform

A marketplace platform connecting sellers of upcycled products with collectors, featuring product listings, image uploads, and real-time chat.

## Features

- User authentication with different roles (seller, collector, or both)
- Product listing and browsing by category
- Product image uploads
- Real-time chat for price negotiation
- PostgreSQL database for persistent storage

## Deployment to Netlify

### Prerequisites

1. [Netlify account](https://app.netlify.com/signup)
2. PostgreSQL database URL (can be from Neon, Supabase, Railway, etc.)

### Steps to Deploy

#### 1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

Make sure all your changes are committed and pushed to your repository.

#### 2. Connect your repository to Netlify

1. Log in to your Netlify account
2. Click "Add new site" > "Import an existing project"
3. Connect to your Git provider and select your repository

#### 3. Configure Build Settings

In the Netlify site settings page that appears:

- **Build command**: `npm run build`
- **Publish directory**: `client/dist`

#### 4. Configure Environment Variables

In your Netlify site's dashboard, go to **Site settings** > **Environment variables** and add the following:

- `DATABASE_URL`: Your PostgreSQL database connection string
- `SESSION_SECRET`: A long, random string for session security
- `SITE_URL`: Your Netlify site URL (after deployment, like `https://your-app-name.netlify.app`)
- `NODE_ENV`: Set to `production`
- `AWS_REGION`: Set to `us-east-1` (or your preferred region)
- `WEBSOCKET_ENDPOINT`: After deploying, set this to your Netlify Functions endpoint (like `https://your-app-name.netlify.app/.netlify/functions`)

#### 5. Enable Netlify Functions

Your project is already set up with the necessary Netlify Functions configuration. Make sure your `netlify.toml` file is present in the repository root.

#### 6. Deploy

Click the "Deploy site" button in your Netlify dashboard.

#### 7. Additional Setup for WebSocket Support

For WebSocket support, you'll need to:

1. Set up an AWS API Gateway WebSocket API
2. Update the `WEBSOCKET_ENDPOINT` environment variable with your API Gateway endpoint

**Note**: Full WebSocket support on Netlify requires additional AWS services because Netlify Functions don't natively support persistent WebSocket connections. For simpler deployments, consider using a service like Pusher or Socket.io with their managed WebSocket infrastructure.

## Local Development

### Prerequisites

- Node.js and npm
- PostgreSQL database

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add the necessary environment variables (see the `.env.example` file)
4. Start the development server: `npm run dev`

## Database Schema

The database includes the following tables:

- `users`: User accounts with different types (seller/collector)
- `products`: Product listings with images and details
- `chats`: Conversations between sellers and collectors
- `messages`: Individual messages within chats

## License

[MIT License](LICENSE)