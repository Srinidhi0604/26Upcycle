const { Pool } = require('pg');
const AWS = require('aws-sdk');

// Connect to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Set up AWS for managing WebSocket connections
const region = process.env.AWS_REGION || 'us-east-1';
const apiGatewayManagementApi = new AWS.ApiGatewayManagementApi({
  apiVersion: '2018-11-29',
  endpoint: process.env.WEBSOCKET_ENDPOINT,
  region
});

// Map of connectionId to userId for authenticated connections
const connections = {};

exports.handler = async (event, context) => {
  const { routeKey } = event.requestContext;
  const connectionId = event.requestContext.connectionId;

  // Handle different WebSocket events
  switch (routeKey) {
    case '$connect':
      // Connection established
      console.log('Client connected:', connectionId);
      return { statusCode: 200 };

    case '$disconnect':
      // Connection closed
      console.log('Client disconnected:', connectionId);
      // Remove from connections if exists
      delete connections[connectionId];
      return { statusCode: 200 };

    case '$default':
    default:
      // Message received
      try {
        const body = JSON.parse(event.body);
        const { type, data } = body;
        
        switch (type) {
          case 'auth':
            // Authenticate connection
            if (data && data.userId) {
              connections[connectionId] = data.userId;
              
              // Confirm authentication success
              await sendToConnection(connectionId, {
                type: 'auth_success',
                data: { message: 'Authenticated successfully' }
              });
              
              console.log(`User ${data.userId} authenticated on connection ${connectionId}`);
            }
            break;
            
          case 'message':
            // Handle new message
            if (!connections[connectionId]) {
              await sendToConnection(connectionId, {
                type: 'error',
                data: { message: 'Not authenticated' }
              });
              return { statusCode: 403 };
            }
            
            const userId = connections[connectionId];
            const { chatId, content } = data;
            
            // Validate chat membership
            const chatResult = await pool.query(
              'SELECT * FROM chats WHERE id = $1 AND (seller_id = $2 OR collector_id = $2)',
              [chatId, userId]
            );
            
            if (chatResult.rows.length === 0) {
              await sendToConnection(connectionId, {
                type: 'error',
                data: { message: 'Chat not found or unauthorized' }
              });
              return { statusCode: 403 };
            }
            
            // Save message to database
            const messageResult = await pool.query(
              'INSERT INTO messages (chat_id, sender_id, content, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
              [chatId, userId, content, new Date()]
            );
            
            const message = messageResult.rows[0];
            
            // Get the chat to find the other participant
            const chat = chatResult.rows[0];
            const otherUserId = chat.seller_id === userId ? chat.collector_id : chat.seller_id;
            
            // Find all active connections for the other user
            const otherUserConnections = Object.entries(connections)
              .filter(([_, connUserId]) => connUserId === otherUserId)
              .map(([connId]) => connId);
            
            // Send message to all connections of the other user
            for (const connId of otherUserConnections) {
              await sendToConnection(connId, {
                type: 'new_message',
                data: message
              });
            }
            
            // Also send confirmation to the sender
            await sendToConnection(connectionId, {
              type: 'new_message',
              data: message
            });
            
            break;
            
          default:
            await sendToConnection(connectionId, {
              type: 'error',
              data: { message: 'Unknown message type' }
            });
        }
        
        return { statusCode: 200 };
      } catch (error) {
        console.error('Error processing message:', error);
        
        try {
          await sendToConnection(connectionId, {
            type: 'error',
            data: { message: 'Error processing message' }
          });
        } catch (sendError) {
          console.error('Error sending error message:', sendError);
        }
        
        return { statusCode: 500 };
      }
  }
};

// Helper function to send messages to a connection
async function sendToConnection(connectionId, payload) {
  try {
    await apiGatewayManagementApi.postToConnection({
      ConnectionId: connectionId,
      Data: JSON.stringify(payload),
    }).promise();
  } catch (error) {
    // Handle client disconnections or errors
    if (error.statusCode === 410) {
      // Client is disconnected, remove the connection
      console.log(`Connection ${connectionId} no longer exists, removing`);
      delete connections[connectionId];
    } else {
      console.error(`Error sending message to connection ${connectionId}:`, error);
      throw error;
    }
  }
}