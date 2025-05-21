/**
 * Firebase Cloud Functions for LoveTrack+
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Firestore reference
const db = admin.firestore();

/**
 * Generate a random 6-digit code
 * @returns {string} - 6-digit code
 */
const generateCoupleCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Create a new couple
 * 
 * This function creates a new couple document in Firestore and generates
 * a unique pairing code that can be used to join the couple.
 */
exports.createCouple = functions.https.onCall(async (data, context) => {
  try {
    // Ensure user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to create a couple.'
      );
    }
    
    // Get userId from auth context
    const userId = context.auth.uid;
    
    // Parse the start date from the request
    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    
    // Generate a unique code for this couple
    const coupleCode = generateCoupleCode();
    
    // Create a new couple document
    const coupleRef = db.collection('couples').doc();
    const coupleId = coupleRef.id;
    
    // Create the couple document
    await coupleRef.set({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: userId,
      members: [userId],
      startDate: startDate,
      pairingCode: coupleCode,
      pairingExpires: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Return the couple ID and code
    return {
      coupleId,
      coupleCode
    };
  } catch (error) {
    console.error('Error creating couple:', error);
    throw new functions.https.HttpsError(
      'internal',
      'An unexpected error occurred creating the couple.'
    );
  }
});

/**
 * Join an existing couple using a pairing code
 * 
 * This function allows a user to join an existing couple using the
 * unique pairing code generated when the couple was created.
 */
exports.joinCouple = functions.https.onCall(async (data, context) => {
  try {
    // Ensure user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to join a couple.'
      );
    }
    
    // Get userId from auth context
    const userId = context.auth.uid;
    
    // Get the pairing code from the request
    const { code } = data;
    
    if (!code) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'A valid pairing code must be provided.'
      );
    }
    
    // Find the couple with this pairing code
    const couplesSnapshot = await db.collection('couples')
      .where('pairingCode', '==', code)
      .limit(1)
      .get();
    
    if (couplesSnapshot.empty) {
      throw new functions.https.HttpsError(
        'not-found',
        'Invalid pairing code. Please check the code and try again.'
      );
    }
    
    // Get the couple document
    const coupleDoc = couplesSnapshot.docs[0];
    const coupleData = coupleDoc.data();
    const coupleId = coupleDoc.id;
    
    // Check if this user is already a member
    if (coupleData.members.includes(userId)) {
      return {
        coupleId,
        success: true,
        message: 'You are already a member of this couple.'
      };
    }
    
    // Add the user to the couple
    await coupleDoc.ref.update({
      members: admin.firestore.FieldValue.arrayUnion(userId),
      // Remove the pairing code since it's been used
      pairingCode: admin.firestore.FieldValue.delete()
    });
    
    // Return success
    return {
      coupleId,
      success: true
    };
  } catch (error) {
    console.error('Error joining couple:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError(
      'internal',
      'An unexpected error occurred joining the couple.'
    );
  }
});

/**
 * Send reminders for upcoming events
 * 
 * This function runs on a schedule and sends notifications for events
 * that have a reminder time.
 */
exports.sendEventReminders = functions.pubsub
  .schedule('every 15 minutes')
  .onRun(async (context) => {
    try {
      const now = admin.firestore.Timestamp.now();
      const fifteenMinutesLater = new Date(now.toMillis() + 15 * 60 * 1000);
      
      // Find events with reminder times in the next 15 minutes
      const eventsSnapshot = await db.collection('events')
        .where('reminderTime', '>=', now)
        .where('reminderTime', '<=', fifteenMinutesLater)
        .get();
      
      if (eventsSnapshot.empty) {
        console.log('No reminders to send.');
        return null;
      }
      
      // Process each event
      const sendPromises = eventsSnapshot.docs.map(async (doc) => {
        const event = doc.data();
        const coupleId = event.coupleId;
        
        // Get the couple document to find members
        const coupleDoc = await db.collection('couples').doc(coupleId).get();
        
        if (!coupleDoc.exists) {
          console.log(`Couple ${coupleId} not found for event ${doc.id}`);
          return;
        }
        
        const coupleData = coupleDoc.data();
        const members = coupleData.members || [];
        
        // Get FCM tokens for all members
        const tokenPromises = members.map(async (userId) => {
          const tokensSnapshot = await db.collection('fcmTokens')
            .where('userId', '==', userId)
            .get();
          
          return tokensSnapshot.docs.map(doc => doc.data().token);
        });
        
        const tokenArrays = await Promise.all(tokenPromises);
        const tokens = tokenArrays.flat().filter(Boolean);
        
        if (tokens.length === 0) {
          console.log(`No FCM tokens found for couple ${coupleId}`);
          return;
        }
        
        // Prepare notification
        const title = event.title || 'Event Reminder';
        const eventDate = event.date.toDate();
        const body = `Your event "${title}" is coming up at ${eventDate.toLocaleTimeString()}.`;
        
        const message = {
          notification: {
            title,
            body
          },
          data: {
            eventId: doc.id,
            coupleId,
            url: `/calendar/${doc.id}`
          },
          tokens
        };
        
        // Send the notification
        const response = await admin.messaging().sendMulticast(message);
        console.log(`${response.successCount} messages sent successfully for event ${doc.id}`);
        
        // Mark the reminder as sent
        await doc.ref.update({
          reminderSent: true
        });
      });
      
      await Promise.all(sendPromises);
      return null;
    } catch (error) {
      console.error('Error sending reminders:', error);
      return null;
    }
  });

/**
 * Register FCM token for a user
 * 
 * This function saves a user's FCM token for push notifications
 */
exports.registerFcmToken = functions.https.onCall(async (data, context) => {
  try {
    // Ensure user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to register for notifications.'
      );
    }
    
    const userId = context.auth.uid;
    const { token } = data;
    
    if (!token) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'A valid FCM token must be provided.'
      );
    }
    
    // Store the token in Firestore
    await db.collection('fcmTokens').doc(token).set({
      userId,
      token,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      platform: data.platform || 'web'
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error registering FCM token:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError(
      'internal',
      'An unexpected error occurred registering the FCM token.'
    );
  }
});
