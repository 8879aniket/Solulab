/* eslint-disable guard-for-in */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const async = require('async');

admin.initializeApp();

function fetchUsers(users) {
  const result = {};
  const userresolve = new Promise((resolve, reject) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const prop in users) {
      // eslint-disable-next-line security/detect-object-injection
      const userId = users[prop];
      const userRef = admin.database().ref(`/debug/Users/${userId}`);

      userRef.on('value', (snapShot) => {
        const snapVal = snapShot.val();
        if (snapVal.fcmToken !== '' && snapVal.fcmToken != null) {
          result.fcmToken = snapVal.fcmToken;
          result.deviceType = snapVal.deviceType;
          result.id = snapVal.id;
          result.chatWith = snapVal.chatWith;
          result.badge = snapVal.badge;
          result.appBadge = snapVal.appBadge;
        }
        setTimeout(() => {
          resolve(result);
        }, 1000);
      }, (err) => {
        reject(err);
      });
    }
  });
  return userresolve;
}

function senderDetails(userId) {
  const result = {};
  const userresolve = new Promise((resolve, reject) => {
    const userRef = admin.database().ref(`/debug/Users/${userId}`);
    userRef.on('value', (snapShot) => {
      const snapVal = snapShot.val();
      result.senderName = snapVal.name;
      result.id = snapVal.id;
      result.fcmToken = snapVal.fcmToken;
      result.deviceType = snapVal.deviceType;
      result.image = snapVal.image;
      result.chatWith = snapVal.chatWith;
      result.badge = snapVal.badge;
      result.appBadge = snapVal.appBadge;
      setTimeout(() => {
        resolve(result);
      }, 1000);
    }, (err) => {
      reject(err);
    });
  });
  return userresolve;
}

function getGroupMembers(groupId) {
  let result;
  const grpresolve = new Promise((resolve, reject) => {
    const grpRef = admin.database().ref(`/debug/Chat/Groups/${groupId}`);
    grpRef.on('value', (snapShot) => {
      const snapVal = snapShot.val();
      result = snapVal.members;
      setTimeout(() => {
        resolve(result);
      }, 1000);
    }, (err) => {
      reject(err);
    });
  });
  return grpresolve;
}

const updateBadgeCount = async (userId, badge) => {
  try {
    const ref = admin.database().ref(`/debug/Users/${userId}`);
    ref.update({
      badge,
    });
    return true;
  } catch (exception) {
    throw Error('Error while updating user badge in firebase database');
  }
};

module.exports.sendMessageNotification = functions.database
  // .ref('/debug/Chat/Conversations/{conversationsId}/{groupId}/lastMessage')
  .ref('/debug/Chat/Threads/{threadsId}/{groupId}')
  .onWrite((change, context) => {
    const conversationData = change.after.val();
    const {
      message, senderId, id, type, status,
    } = conversationData;
    if (type === 'TEXT' || type === 'IMAGE') {
      if (status == 'PENDING') {
        if (conversationData.message === '' || conversationData.message === null) {
          return 'Blank  Message';
        }
        const conversationUid = context.params.groupId; // conversion id which gives the  conversation id to fetch  message data from messages table
        const groupId = context.params.threadsId; // conversion id which gives the  conversation id to fetch  message data from messages table
        const parentId = change.after.ref.parent.key; // same as conversionIDs
        const ids = parentId.split('_');
        if (ids[1] !== undefined && ids[1].length > 10) {
          // single user
          let conversationUsers = [];
          conversationUsers = ids.filter((e) => e !== senderId);
          return senderDetails(senderId).then((senderData) => fetchUsers(conversationUsers).then((results) => {
            const notificationTitle = `${senderData.senderName} sent a new message!`;
            const notificationMesssage = message;
            let fbadge = results.badge;
            let abadge = results.appBadge;
            if (fbadge == 'NaN' || fbadge == undefined || fbadge == 'undefined') {
              fbadge = 0;
            }
            if (abadge == 'NaN' || abadge == undefined || abadge == 'undefined') {
              abadge = 0;
            }
            let badge = parseInt(fbadge, 10) + parseInt(abadge, 10) + 1;
            const fbadgeUp = parseInt(fbadge, 10) + 1;
            badge = badge.toString();
            const senderImage = (senderData.image == undefined || senderData.image == 'undefined') ? '' : senderData.image;
            let payload;
            // if (results.id != chatWith.userId && results.chatWith.userId != senderId) {
            if (results.chatWith == undefined) {
              if (results.fcmToken) {
                if (results.deviceType === 'android') {
                  payload = {
                    data: {
                      conv_id: groupId,
                      msgid: id,
                      senderId,
                      senderName: senderData.senderName,
                      senderImage,
                      title: notificationTitle,
                      messages: notificationMesssage,
                      type: 'chat_message',
                      isGroup: 'false',
                      groupId: '',
                      badge,
                    },
                  };
                } else {
                  payload = {
                    notification: {
                      id: groupId,
                      msgid: id,
                      senderId,
                      senderName: senderData.senderName,
                      senderImage,
                      title: notificationTitle,
                      body: notificationMesssage,
                      sound: 'default',
                      badge,
                      priority: 'high',
                      type: 'chat_message',
                      isGroup: 'false',
                      groupId: '',
                    },
                    data: {
                      conv_id: groupId,
                      msgid: id,
                      senderId,
                      senderName: senderData.senderName,
                      senderImage,
                      title: notificationTitle,
                      message: notificationMesssage,
                      type: 'chat_message',
                      'content-available': '1',
                      isGroup: 'false',
                      groupId: '',
                      badge,
                    },
                  };
                }

                const options = {
                  priority: 'high',
                  alert: 'true',
                  timeToLive: 60 * 60 * 24,
                };
                admin.messaging().sendToDevice(results.fcmToken, payload, options)
                  .then((response) => {
                    updateBadgeCount(results.id, fbadgeUp);
                  })
                  .catch((error) => {
                    throw error;
                  });
              }
            } else if (results.chatWith.userId != senderId) {
              if (results.fcmToken) {
                if (results.deviceType === 'android') {
                  payload = {
                    data: {
                      conv_id: groupId,
                      msgid: id,
                      senderId,
                      senderName: senderData.senderName,
                      senderImage,
                      title: notificationTitle,
                      messages: notificationMesssage,
                      type: 'chat_message',
                      isGroup: 'false',
                      groupId: '',
                    },
                  };
                } else {
                  payload = {
                    notification: {
                      id: groupId,
                      msgid: id,
                      senderId,
                      senderName: senderData.senderName,
                      senderImage,
                      title: notificationTitle,
                      body: notificationMesssage,
                      sound: 'default',
                      badge: '1',
                      priority: 'high',
                      type: 'chat_message',
                      isGroup: 'false',
                      groupId: '',
                    },
                    data: {
                      conv_id: groupId,
                      msgid: id,
                      senderId,
                      senderName: senderData.senderName,
                      senderImage,
                      title: notificationTitle,
                      message: notificationMesssage,
                      type: 'chat_message',
                      'content-available': '1',
                      isGroup: 'false',
                      groupId: '',
                    },
                  };
                }

                const options = {
                  priority: 'high',
                  alert: 'true',
                  timeToLive: 60 * 60 * 24,
                };
                admin.messaging().sendToDevice(results.fcmToken, payload, options)
                  .then((response) => {
                    updateBadgeCount(results.id, fbadgeUp);
                  })
                  .catch((error) => {
                    throw error;
                  });
              }
            }
          }));
        }
        return senderDetails(senderId).then((senderData) => getGroupMembers(parentId).then((result) => {
          async.forEach(result, (results, callback1) => {
            if (senderId !== results.id) {
              senderDetails(results.id).then((sd) => {
                const notificationTitle = `${senderData.senderName} sent a new message!`;
                const notificationMesssage = message;
                // let badge = (sd.badge != undefined || sd.badge != 'undefined') ? parseInt(sd.badge, 10) + parseInt(sd.appBadge, 10) + 1 : '1';
                // badge = badge.toString();
                let fbadge = sd.badge;
                let abadge = sd.appBadge;
                if (fbadge == 'NaN' || fbadge == undefined || fbadge == 'undefined') {
                  fbadge = 0;
                }
                if (abadge == 'NaN' || abadge == undefined || abadge == 'undefined') {
                  abadge = 0;
                }
                let badge = parseInt(fbadge, 10) + parseInt(abadge, 10) + 1;
                const fbadgeUp = parseInt(fbadge, 10) + 1;
                badge = badge.toString();
                const senderImage = (senderData.image == undefined || senderData.image == 'undefined') ? '' : senderData.image;
                let payload;
                if (sd.chatWith == undefined) {
                  if (sd.fcmToken) {
                    if (sd.deviceType === 'android') {
                      payload = {
                        data: {
                          conv_id: groupId,
                          msgid: id,
                          senderId,
                          senderName: senderData.senderName,
                          senderImage,
                          title: notificationTitle,
                          messages: notificationMesssage,
                          type: 'chat_message',
                          isGroup: 'true',
                          groupId,
                          badge,
                        },
                      };
                    } else {
                      payload = {
                        notification: {
                          id: groupId,
                          msgid: id,
                          senderId,
                          senderName: senderData.senderName,
                          senderImage,
                          title: notificationTitle,
                          body: notificationMesssage,
                          sound: 'default',
                          badge,
                          priority: 'high',
                          type: 'chat_message',
                          isGroup: 'true',
                          groupId,
                        },
                        data: {
                          conv_id: groupId,
                          msgid: id,
                          senderId,
                          senderName: senderData.senderName,
                          senderImage,
                          title: notificationTitle,
                          message: notificationMesssage,
                          type: 'chat_message',
                          'content-available': '1',
                          isGroup: 'true',
                          groupId,
                          badge,
                        },
                      };
                    }
                    const options = {
                      priority: 'high',
                      alert: 'true',
                      timeToLive: 60 * 60 * 24,
                    };
                    admin.messaging().sendToDevice(sd.fcmToken, payload, options)
                      .then((response) => {
                        this.updateBadgeCount(sd.id, badge);
                      })
                      .catch((error) => {
                        console.log('Error sending message:', error);
                      });
                  }
                } else if (sd.chatWith.userId != groupId) {
                  if (sd.fcmToken) {
                    if (sd.deviceType === 'android') {
                      payload = {
                        data: {
                          conv_id: groupId,
                          msgid: id,
                          senderId,
                          senderName: senderData.senderName,
                          senderImage,
                          title: notificationTitle,
                          messages: notificationMesssage,
                          type: 'chat_message',
                          isGroup: 'true',
                          groupId,
                          badge,
                        },
                      };
                    } else {
                      payload = {
                        notification: {
                          id: groupId,
                          msgid: id,
                          senderId,
                          senderName: senderData.senderName,
                          senderImage,
                          title: notificationTitle,
                          body: notificationMesssage,
                          sound: 'default',
                          badge,
                          priority: 'high',
                          type: 'chat_message',
                          isGroup: 'true',
                          groupId,
                        },
                        data: {
                          conv_id: groupId,
                          msgid: id,
                          senderId,
                          senderName: senderData.senderName,
                          senderImage,
                          title: notificationTitle,
                          message: notificationMesssage,
                          type: 'chat_message',
                          'content-available': '1',
                          isGroup: 'true',
                          groupId,
                          badge,
                        },
                      };
                    }
                    const options = {
                      priority: 'high',
                      alert: 'true',
                      timeToLive: 60 * 60 * 24,
                    };
                    admin.messaging().sendToDevice(sd.fcmToken, payload, options)
                      .then((response) => {
                        this.updateBadgeCount(sd.id, fbadgeUp);
                      })
                      .catch((error) => {
                        console.log('Error sending message:', error);
                      });
                  }
                }
                callback1();
              });
            }
          });
        }));
      }
    }
    return true;
  });
