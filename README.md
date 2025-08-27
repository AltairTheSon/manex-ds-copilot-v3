# Figma Pages Preview Application

A React web application that allows users to preview all pages from a Figma file using the Figma REST API with optional MCP (Model Context Protocol) integration.

## Features

- **Secure Token Input**: Password-protected input field for Figma access tokens
- **File ID Extraction**: Supports both file IDs and full Figma URLs
- **Real-time Page Preview**: Fetches and displays thumbnails for all pages in a Figma file
- **Layer Viewing**: Click on any page to view all layers within that page with thumbnails
- **Layer Details**: Shows layer names, types, dimensions, and visual properties
- **Smart Navigation**: Seamless navigation between pages and layer views
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Comprehensive error handling for API failures and invalid inputs
- **Loading States**: Clear loading indicators during API operations
- **MCP Integration**: Optional Model Context Protocol support for enterprise environments
- **Multiple Connection Methods**: Direct API access or MCP server routing

## Connection Methods

### Direct API Access (Default)
Connect directly to the Figma API using your access token.

### MCP Server Integration
Route API calls through an MCP (Model Context Protocol) server for enhanced security, monitoring, and enterprise features.

**Benefits of MCP Integration:**
- Centralized API management
- Enhanced security and authentication
- Request monitoring and logging
- Rate limiting and caching
- Audit trails

📖 **[View MCP Setup Guide](docs/MCP_SETUP.md)** for detailed configuration instructions.

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- A Figma account with access token

### Installation

1. Clone the repository:
```bash
git clone https://github.com/AltairTheSon/manex-ds-copilot-v3.git
cd manex-ds-copilot-v3
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Getting a Figma Access Token

1. Go to [Figma Developer Settings](https://www.figma.com/developers/api#access-tokens)
2. Log in to your Figma account
3. Click "Generate new token"
4. Give your token a descriptive name
5. Copy the generated token (keep it secure!)

### Using the Application

1. **Enter your Figma Access Token**: Paste your token in the password field
2. **Enter the File ID**: You can either:
   - Paste the full Figma file URL (e.g., `https://www.figma.com/file/ABC123/My-Design`)
   - Enter just the file ID (e.g., `ABC123`)
3. **Click "Connect & Preview Pages"**: The app will fetch and display all pages
4. **View Page Layers**: Click on any page card to view detailed layer information
5. **Navigate Back**: Use the back button to return to the pages view or main form

## API Endpoints Used

The application uses the following Figma REST API endpoints:

- `GET /v1/files/{file_id}` - Retrieves file information and page structure  
- `GET /v1/images/{file_id}` - Generates page and layer thumbnails
- `GET /v1/files/{file_id}/nodes?ids={node_ids}` - Fetches detailed page and layer information

## Security

- Access tokens are never logged or stored permanently
- Tokens are only kept in memory during the session
- The `.env.example` file shows how to configure environment variables
- Sensitive information is excluded from the repository via `.gitignore`

## CORS Considerations

The Figma API supports CORS for web applications, so no proxy server is required for development or production deployments.

## Available Scripts

In the project directory, you can run:

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000).

### `npm run build`
Builds the app for production to the `build` folder.

### `npm test`
Launches the test runner in interactive watch mode.

### `npm run eject`
**Note: this is a one-way operation. Once you `eject`, you can't go back!**

## Deployment

The application can be deployed to any static hosting service:

1. Run `npm run build` to create a production build
2. Deploy the contents of the `build` folder to your hosting service

Popular options include:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront

## Troubleshooting

### Common Issues

1. **"Invalid access token"**: Ensure your token is correctly copied from Figma
2. **"File not found"**: Check that the file ID is correct and you have access to the file
3. **"Access denied"**: Verify that your token has the necessary permissions
4. **Network errors**: Check your internet connection and ensure Figma's API is accessible

### Token Validation

The application performs basic validation on tokens and file IDs:
- Tokens should be at least 20 characters long
- File IDs should be alphanumeric and longer than 10 characters

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Create React App](https://create-react-app.dev/)
- Uses the [Figma REST API](https://www.figma.com/developers/api)
- Icons and emojis for enhanced user experience