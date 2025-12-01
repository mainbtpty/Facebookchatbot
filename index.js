const express = require('express');
const app = express();
const axios = require('axios');
const dialogflow = require('dialogflow');

// Dialogflow credentials
const projectId = 'your-project-id';
const sessionId = 'your-session-id';
const languageCode = 'en-US';

// Facebook Messenger credentials
const pageAccessToken = 'your-page-access-token';
const verifyToken = 'your-verify-token';

// Create a Dialogflow client
const sessionClient = new dialogflow.SessionsClient({
  projectId,
  credentials: {
    client_email: 'your-client-email',
    private_key: 'your-private-key',
  },
});

// Handle incoming requests from Facebook Messenger
app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === verifyToken) {
    res.send(req.query['hub.challenge']);
  } else {
    res.send('Error, wrong validation token');
  }
});

app.post('/webhook', (req, res) => {
  const messaging = req.body.entry[0].messaging[0];
  const senderId = messaging.sender.id;
  const message = messaging.message;

  // Detect intent using Dialogflow
  sessionClient.detectIntent({
    session: sessionClient.sessionPath(projectId, sessionId),
    queryInput: {
      text: {
        text: message.text,
        languageCode,
      },
    },
  })
    .then((responses) => {
      const response = responses[0].queryResult;
      const intent = response.intent.displayName;
      const messageText = response.fulfillmentText;

      // Send response back to Facebook Messenger
      const messageData = {
        recipient: {
          id: senderId,
        },
        message: {
          text: messageText,
        },
      };
      const url = `https://graph.facebook.com/v13.0/me/messages?access_token=${pageAccessToken}`;
      axios.post(url, messageData)
        .then((response) => {
          console.log('Message sent!');
        })
        .catch((error) => {
          console.error('Error sending message:', error);
        });
    })
    .catch((error) => {
      console.error('Error detecting intent:', error);
    });

  res.send('ok');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
