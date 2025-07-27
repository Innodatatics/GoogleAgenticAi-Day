def notify_all(db, message):
    notif_ref = db.collection('notifications')
    notif_ref.add(message)


def get_notifications(db):
    notifications = []
    for doc in db.collection('notifications').order_by('timestamp', direction='DESCENDING').stream():
        notif = doc.to_dict()
        notif['id'] = doc.id
        notifications.append(notif)
    return notifications
